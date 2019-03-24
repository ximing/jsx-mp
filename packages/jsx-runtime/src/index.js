/**
 * Created by ximing on 2019-03-23.
 */
import { isEmptyObject, noop, diffObjToPath } from "./util";

const privatePropValName = "__triggerObserer";
const componentFnReg = /^__fn_/;

function filterProps(
  properties,
  defaultProps = {},
  componentProps = {},
  weappComponentData
) {
  const newProps = Object.assign({}, componentProps);
  for (const propName in properties) {
    if (propName === privatePropValName) {
      continue;
    }
    if (typeof componentProps[propName] === "function") {
      newProps[propName] = componentProps[propName];
    } else if (propName in weappComponentData) {
      newProps[propName] = weappComponentData[propName];
    }
    if (componentFnReg.test(propName)) {
      if (weappComponentData[propName] === true) {
        const fnName = propName.replace(componentFnReg, "");
        newProps[fnName] = noop;
      }
      delete newProps[propName];
    }
  }
  if (!isEmptyObject(defaultProps)) {
    for (const propName in defaultProps) {
      if (newProps[propName] === undefined || newProps[propName] === null) {
        newProps[propName] = defaultProps[propName];
      }
    }
  }
  return newProps;
}

function generateObserver(key, ComponentClass, context) {
  function observer(value) {
    const nextProps = filterProps(
      ComponentClass.properties,
      ComponentClass.defaultProps,
      Object.assign({}, this.props, {
        [key]: value
      }),
      this.data
    );
    if (this.__isReady) {
      const oldData = Object.assign({}, this.data);
      // 这里用context不用this的原因是微信会将传递给Component的Object处理一下，其中不在method里面的方法会被移走
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
  Object.keys(weappComponentConf.properties).forEach(key => {
    weappComponentConf.properties[key] = {
      ...weappComponentConf.properties[key],
      value: weappComponentConf.props[key],
      observer: generateObserver(key, ComponentClass, weappComponentConf)
    };
  });
  const defaultProps = ComponentClass.defaultProps || {};
  for (const key in defaultProps) {
    if (defaultProps.hasOwnProperty(key)) {
      weappComponentConf.properties[key] = {
        type: null,
        value: null,
        observer: generateObserver(key, ComponentClass, weappComponentConf)
      };
    }
  }
}

function setData(data, fn = noop) {
  try {
    const newData = this._createData(Object.assign({}, this.data, data));
    const dataDiff = diffObjToPath(newData, this.data);
    this.__nativeSetData(dataDiff, fn);
  } catch (err) {
    console.error("--> setData error", err);
    throw err;
  }
}

export function createComponent(ComponentClass) {
  const initData = {
    _componentProps: 1
  };
  const componentInstance = new ComponentClass();
  try {
    componentInstance.data =
      componentInstance._createData() || componentInstance.data;
  } catch (err) {
    console.warn(
      `[JSX warn] 请给组件提供一个 \`defaultProps\` 以提高初次渲染性能！`
    );
    console.warn(err);
  }
  const { created, ready, props, data } = componentInstance;
  componentInstance.data = Object.assign({}, initData, props, data);
  componentInstance.__isReady = false;
  componentInstance.created = function(...args) {
    this.__nativeSetData = this.setData;
    Object.defineProperty(this, "setData", {
      value: setData.bind(this),
      configurable: true,
      enumerable: true,
      writable: false
    });
    this.props = filterProps(
      ComponentClass.properties,
      ComponentClass.defaultProps,
      this.props,
      this.data
    );
    created && created.apply(this, args);
  };
  componentInstance.ready = function(...args) {
    this.__isReady = true;
    ready && ready.apply(this, args);
  };
  // 将原型链上不可枚举的方法赋值过来
  Object.getOwnPropertyNames(ComponentClass.prototype).forEach(key => {
    if (
      ["_constructor", "data", "props", "created", "ready"].indexOf(key) < 0 &&
      !Object.prototype.hasOwnProperty(key)
    )
      componentInstance[key] = ComponentClass.prototype[key];
  });
  bindProperties(componentInstance, ComponentClass);
  return componentInstance;
}

export function createPage(ComponentClass) {
  const initData = {
    _componentProps: 1
  };
  const componentInstance = new ComponentClass();
  try {
    componentInstance.data =
      componentInstance._createData() || componentInstance.data;
  } catch (err) {
    console.warn(
      `[JSX warn] 请给组件提供一个 \`defaultProps\` 以提高初次渲染性能！`
    );
    console.warn(err);
  }
  const { onLoad, onReady, props, data } = componentInstance;
  componentInstance.data = Object.assign({}, initData, props, data);
  componentInstance.__isReady = false;
  componentInstance.onLoad = function(...args) {
    this.__nativeSetData = this.setData;
    Object.defineProperty(this, "setData", {
      value: setData.bind(this),
      configurable: true,
      enumerable: true,
      writable: false
    });
    onLoad && onLoad.apply(this, args);
  };
  componentInstance.onReady = function(...args) {
    this.__isReady = true;
    onReady && onReady.apply(this, args);
  };
  // 将原型链上不可枚举的方法赋值过来
  Object.getOwnPropertyNames(ComponentClass.prototype).forEach(key => {
    if (
      ["_constructor", "data", "props", "onReady", "onReady"].indexOf(key) <
        0 &&
      !Object.prototype.hasOwnProperty(key)
    )
      componentInstance[key] = ComponentClass.prototype[key];
  });

  return componentInstance;
}
