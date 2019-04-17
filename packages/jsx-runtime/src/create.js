import { diffObjToPath, noop } from './internal/util';
import { filterProps } from './filter';
import propsManager from './internal/propsManager';

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
        if (this.__isReady) {
            const oldData = Object.assign({}, this.data);
            const newData = context._createData(oldData, nextProps);
            const dataDiff = diffObjToPath(newData, this.data);
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

function setData(data, fn = noop) {
    try {
        const newData = this._createData(Object.assign({}, this.data, data));
        const dataDiff = diffObjToPath(newData, this.data);
        this.__nativeSetData(dataDiff, fn);
    } catch (err) {
        console.error('--> setData error', err);
        throw err;
    }
}

export function createComponent(ComponentClass) {
    const initData = {};
    const componentInstance = new ComponentClass();
    try {
        componentInstance._constructor && componentInstance._constructor();
        componentInstance.props = filterProps(
            ComponentClass.defaultProps,
            {},
            componentInstance.props
        );
        componentInstance.data = componentInstance._createData() || componentInstance.data;
    } catch (err) {
        console.warn(`[JSX warn] 请给组件提供一个 \`defaultProps\` 以提高初次渲染性能！`);
        console.warn(err);
    }
    const { created, ready, props, data } = componentInstance;
    componentInstance.data = Object.assign({}, initData, props, data);
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
    const initData = {};
    const componentInstance = new ComponentClass();
    try {
        componentInstance._constructor && componentInstance._constructor();
        componentInstance.data = componentInstance._createData() || componentInstance.data;
    } catch (err) {
        console.warn(`[JSX warn] 请给组件提供一个 \`defaultProps\` 以提高初次渲染性能！`);
        console.warn(err);
    }
    const { onLoad, onReady, props, data } = componentInstance;
    componentInstance.data = Object.assign({}, initData, props, data);
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
