import {diffObjToPath, noop, isEmptyObject, shakeFnFromObject,objClone} from './internal/util';
import {filterProps} from './filter';
import {internal_safe_get as safeGet, internal_safe_set as safeSet} from './internal/index';
import {set} from './internal/safe-set';

function generateObserver(key, ComponentClass, context) {
    return function (value,a,b) {
        let _v = value;
        if (Array.isArray(b) && b.length > 1) {
            _v = set(objClone({ [key]: this.props[key] }), b, value)[key];
        }
        const nextProps = filterProps(
            ComponentClass.defaultProps,
            Object.assign({}, this.props, {
                [key]: _v
            })
        );
        this.receiveProps(nextProps);
        const newData = doUpdate.call(this, {}, nextProps);
        const dataDiff = diffObjToPath(newData, this.data, {},'');
        // 这里只处理props变动导致的关联变动也就是 _createDate 返回的数据，而不关心其他变化，尤其不能setData自己的key
        Object.keys(dataDiff).forEach((key) => {
            const keys = key.split('.');
            const k = keys[0].replace(/\[\d+\]/,"");
            if (k && ComponentClass.defaultProps && ComponentClass.defaultProps.hasOwnProperty(k)) {
                delete dataDiff[key];
            }
        })
        if (Object.keys(dataDiff).length) {
            this.setData(dataDiff);
        }
    };
}

function bindProperties(weappComponentConf, ComponentClass) {
    weappComponentConf.properties = ComponentClass.properties || {};
    weappComponentConf.props = weappComponentConf.props || {};
    Object.keys(weappComponentConf.props).forEach((key) => {
        weappComponentConf.properties[key] = {
            type: null,
            value: weappComponentConf.props[key],
            observer: generateObserver(key, ComponentClass, weappComponentConf)
        };
    });
}

function copyProperty(componentInstance, ComponentClass, othersProps = []) {
    Object.getOwnPropertyNames(ComponentClass.prototype).forEach((key) => {
        if (['constructor', 'state', 'data', 'props', ...othersProps].indexOf(key) < 0)
            componentInstance[key] = ComponentClass.prototype[key];
    });
}

function setState(data, fn = noop) {
    try {
        const newData = doUpdate.call(this, data);
        const dataDiff = diffObjToPath(newData, this.data);
        this.props &&
        Object.keys(dataDiff).forEach((key) => {
            const keys = key.split('.');
            const k = keys[0].replace(/\[\d+\]/, '');
            if (k && this.props.hasOwnProperty(k)) {
                // 这里只处理props变动导致的关联变动也就是 _createDate 返回的数据，而不关心其他变化，尤其不能setData props相关的key
                delete dataDiff[key];
            }
        });
        if (Object.keys(dataDiff).length) {
            this.setData(dataDiff, fn);
        } else {
            fn.call(this, this.state);
        }
    } catch (err) {
        console.error('--> setState error', err);
        throw err;
    }
}

// 根据 $usedState 过滤掉需要传送给 view层的数据，只传递需要的
function doUpdate(nextState = {}, nextProps = {}) {
    const {props, state, $usedState, data} = this;
    this.state = Object.assign({}, state, nextState);
    this.props = Object.assign({}, props, nextProps);
    let _nextData = Object.assign({}, data, this._createData());
    if ($usedState && $usedState.length) {
        const _data = {};
        $usedState.forEach((key) => {
            let val = safeGet(_nextData, key);
            if (typeof val === 'undefined') {
                return;
            }
            // 传递fn到 组件会丢失
            if (typeof val === 'object') {
                if (isEmptyObject(val)) return safeSet(_data, key, val);
                // 这里不处理丁香会有问题
                val = shakeFnFromObject(val);
                // 避免筛选完 Fn 后产生了空对象还去渲染
                if (!isEmptyObject(val)) safeSet(_data, key, val);
            } else {
                safeSet(_data, key, val);
            }
        });
        _nextData = _data;
    }
    return _nextData;
}

export function createComponent(ComponentClass) {
    const componentInstance = new ComponentClass();
    try {
        componentInstance._constructor && componentInstance._constructor();
        componentInstance.props = filterProps(
            ComponentClass.defaultProps,
            componentInstance.props
        );
        // props 进行 observer监听
        bindProperties(componentInstance, ComponentClass);
        componentInstance.data = doUpdate.call(componentInstance);
        componentInstance.data.$taroCompReady = true;
    } catch (err) {
        console.warn(`[JSX warn] 请给组件提供一个 \`defaultProps\` 以提高初次渲染性能！`);
        console.warn(err);
    }
    const {created, ready} = componentInstance;
    componentInstance.__isReady = false;
    componentInstance.setState = setState;
    componentInstance.__doUpdate = doUpdate;
    componentInstance.created = function (...args) {
        this.props = componentInstance.props;
        this.state = componentInstance.state;
        componentInstance.__init(this, false);
        created && created.apply(this, args);
    };
    componentInstance.ready = function (...args) {
        this.__isReady = true;
        ready && ready.apply(this, args);
    };
    if (!componentInstance.methods) {
        componentInstance.methods = {
            receiveProps() {
            }
        };
    }
    // 将原型链上不可枚举的方法赋值过来
    copyProperty(componentInstance, ComponentClass, ['created', 'ready']);

    // 将对象中的业务函数放到methods上面
    Object.keys(componentInstance).forEach((key) => {
        if (
            [
                'constructor',
                'methods',
                'props',
                'state',
                'data',
                'created',
                'attached',
                'ready',
                'moved',
                'detached',
                'error',
                'pageLifetimes',
                'properties',
                'options',
                'externalClasses',
                'observers',
                'behaviors',
                'relations',
                'lifetimes',
                'definitionFilter',
                'setData',
                'triggerEvent',
                'createSelectorQuery'
            ].indexOf(key) < 0
        ) {
            if (typeof componentInstance[key] === 'function') {
                componentInstance.methods[key] = componentInstance[key];
                // 减少内存占用
                delete componentInstance[key];
            }
        }
    });
    return Object.keys(componentInstance).reduce(function(pre,cur){
        pre[cur] = componentInstance[cur]
        return pre
    },{})
    // return componentInstance;
}

export function createPage(ComponentClass) {
    const componentInstance = new ComponentClass();
    try {
        componentInstance._constructor && componentInstance._constructor();
        componentInstance.data = doUpdate.call(componentInstance);
        componentInstance.data.$taroCompReady = true;
    } catch (err) {
        console.warn(`[JSX warn] 请给组件提供一个 \`defaultProps\` 以提高初次渲染性能！`);
        console.warn(err);
    }
    const {onLoad, onReady} = componentInstance;
    componentInstance.__isReady = false;
    componentInstance.setState = setState;
    // 暴露给业务做一些更新的事情，比如metric埋点等，需要触发更新
    componentInstance.__doUpdate = doUpdate;
    componentInstance.onLoad = function (...args) {
        try {
            componentInstance.__init(this, true);
        } catch (e) {
            console.error(e);
        }
        onLoad && onLoad.apply(this, args);
    };
    componentInstance.onReady = function (...args) {
        this.__isReady = true;
        onReady && onReady.apply(this, args);
    };
    // 将原型链上不可枚举的方法赋值过来
    copyProperty(componentInstance, ComponentClass, ['onLoad', 'onReady']);
    return Object.keys(componentInstance).reduce(function(pre,cur){
      pre[cur] = componentInstance[cur]
      return pre
    },{})
    // return componentInstance;
}
