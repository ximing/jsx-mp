import { diffObjToPath, noop, isEmptyObject, shakeFnFromObject } from './internal/util';
import { filterProps } from './filter';
import propsManager from './internal/propsManager';
import { internal_safe_get as safeGet, internal_safe_set as safeSet } from './internal/index';

function generateObserver(key, ComponentClass, context) {
    function observer(value) {
        // const compid = this.data.compid;
        const nextProps = filterProps(
            ComponentClass.defaultProps,
            // propsManager.map[compid] || {},
            {},
            Object.assign({}, this.props, {
                [key]: value
            })
        );
        const newData = doUpdate.call(this, {}, nextProps);
        const dataDiff = diffObjToPath(newData, this.data);
        if (Object.keys(dataDiff).length) {
            this.__nativeSetData(dataDiff);
        }
        this.props = nextProps;
    }
    return observer;
}

function bindProperties(weappComponentConf, ComponentClass) {
    weappComponentConf.properties = ComponentClass.properties || {};
    weappComponentConf.props = weappComponentConf.props || {};
    Object.keys(weappComponentConf.props).forEach((key) => {
        if (key === 'compid') {
            throw new Error('业务方不能使用 compid 字段作为属性的key');
        }
        weappComponentConf.properties[key] = {
            type: null,
            value: weappComponentConf.props[key],
            observer: generateObserver(key, ComponentClass, weappComponentConf)
        };
    });
    // taro jsx 编译器注入的变量
    weappComponentConf.properties.compid = {
        type: null,
        value: null,
        observer(value) {
            console.error('properties.compid', value);
            this.data.compid = value;
        }
    };
}

// 根据 $usedState 过滤掉需要传送给 view层的数据，只传递需要的
function doUpdate(nextData = {}, nextProps = {}) {
    const { props, data, $usedState } = this;
    let _nextData = Object.assign(
        {},
        props,
        data,
        this._createData(Object.assign({}, data, nextData), Object.assign({}, props, nextProps))
    );
    if ($usedState && $usedState.length) {
        const _data = {};
        $usedState.forEach((key) => {
            let val = safeGet(_nextData, key);
            if (typeof val === 'undefined') {
                return;
            }
            if (typeof val === 'object') {
                if (isEmptyObject(val)) return safeSet(_data, key, val);
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

function setData(data, fn = noop) {
    try {
        const newData = doUpdate.call(this, data);
        const dataDiff = diffObjToPath(newData, this.data);
        this.__nativeSetData(dataDiff, fn);
    } catch (err) {
        console.error('--> setData error', err);
        throw err;
    }
}

export function createComponent(ComponentClass) {
    const componentInstance = new ComponentClass();
    try {
        componentInstance._constructor && componentInstance._constructor();
        componentInstance.props = filterProps(
            ComponentClass.defaultProps,
            {},
            componentInstance.props
        );
        componentInstance.data = doUpdate.call(componentInstance);
        componentInstance.data.$taroCompReady = true;
    } catch (err) {
        console.warn(`[JSX warn] 请给组件提供一个 \`defaultProps\` 以提高初次渲染性能！`);
        console.warn(err);
    }
    const { created, ready } = componentInstance;
    componentInstance.__isReady = false;
    componentInstance.created = function(...args) {
        this.__nativeSetData = this.setData;
        componentInstance.__init(this);
        Object.defineProperty(this, 'setData', {
            value: setData.bind(this),
            configurable: true,
            enumerable: true,
            writable: false
        });
        created && created.apply(this, args);
    };
    componentInstance.ready = function(...args) {
        this.__isReady = true;
        ready && ready.apply(this, args);
    };
    if (!componentInstance.methods) {
        componentInstance.methods = {};
    }
    // 将原型链上不可枚举的方法赋值过来
    Object.getOwnPropertyNames(ComponentClass.prototype).forEach((key) => {
        if (['constructor', 'data', 'props'].indexOf(key) < 0)
            componentInstance[key] = ComponentClass.prototype[key];
    });
    // 将对象中的业务函数放到methods上面
    Object.keys(componentInstance).forEach((key) => {
        if (
            [
                'constructor',
                'methods',
                'props',
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
    // props 进行 observer监听
    bindProperties(componentInstance, ComponentClass);
    return componentInstance;
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
    const { onLoad, onReady } = componentInstance;
    componentInstance.__isReady = false;
    componentInstance.onLoad = function(...args) {
        try {
            this.__nativeSetData = this.setData;
            componentInstance.__init(this);
            Object.defineProperty(this, 'setData', {
                value: setData.bind(this),
                configurable: true,
                enumerable: true,
                writable: false
            });
        } catch (e) {
            console.error(e);
        }
        onLoad && onLoad.apply(this, args);
    };
    componentInstance.onReady = function(...args) {
        this.__isReady = true;
        onReady && onReady.apply(this, args);
    };
    // 将原型链上不可枚举的方法赋值过来
    Object.getOwnPropertyNames(ComponentClass.prototype).forEach((key) => {
        if (['constructor', 'data', 'props'].indexOf(key) < 0)
            componentInstance[key] = ComponentClass.prototype[key];
    });

    return componentInstance;
}
