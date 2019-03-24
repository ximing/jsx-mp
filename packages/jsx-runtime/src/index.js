/**
 * Created by ximing on 2019-03-23.
 */
import { isEmptyObject, noop, diffObjToPath } from './util'

const privatePropValName = '__triggerObserer';
const anonymousFnNamePreffix = 'funPrivate'
const componentFnReg = /^__fn_/

function filterProps (properties, defaultProps = {}, componentProps = {}, weappComponentData) {
    let newProps = Object.assign({}, componentProps)
    for (const propName in properties) {
        if (propName === privatePropValName) {
            continue
        }
        if (typeof componentProps[propName] === 'function') {
            newProps[propName] = componentProps[propName]
        } else if (propName in weappComponentData) {
            newProps[propName] = weappComponentData[propName]
        }
        if (componentFnReg.test(propName)) {
            if (weappComponentData[propName] === true) {
                const fnName = propName.replace(componentFnReg, '')
                newProps[fnName] = noop
            }
            delete newProps[propName]
        }
    }
    if (!isEmptyObject(defaultProps)) {
        for (const propName in defaultProps) {
            if (newProps[propName] === undefined || newProps[propName] === null) {
                newProps[propName] = defaultProps[propName]
            }
        }
    }
    return newProps
}

function bindProperties (weappComponentConf, ComponentClass) {
    weappComponentConf.properties = ComponentClass.properties || {}
    const defaultProps = ComponentClass.defaultProps || {}
    for (const key in defaultProps) {
        if (defaultProps.hasOwnProperty(key)) {
            weappComponentConf.properties[key] = {
                type: null,
                value: null,
                observer:function () {
                    if (!this.__isReady) return;
                    const nextProps = filterProps(ComponentClass.properties, ComponentClass.defaultProps, this.props, this.data);
                    this.props = nextProps;
                }
            }
        }
    }
    // // 拦截props的更新，插入生命周期
    // // 调用小程序setData或会造成性能消耗
    // weappComponentConf.properties[privatePropValName] = {
    //     type: null,
    //     observer: function () {
    //         if (!this.__isReady) return;
    //         const nextProps = filterProps(ComponentClass.properties, ComponentClass.defaultProps, this.props, this.data);
    //         this.props = nextProps;
    //     }
    // }
}

function setData(data,fn=noop){
    let newData = this._createData(data);
    const dataDiff = diffObjToPath(newData, this.data);
    this._nativeSetData(dataDiff,fn);
}

export default function createComponent (ComponentClass) {
    let initData = {
        _componentProps: 1
    }
    // const componentProps = filterProps({}, ComponentClass.defaultProps)
    const componentInstance = new ComponentClass()
    try {
        componentInstance.data = componentInstance._createData() || componentInstance.data
    } catch (err) {
        console.warn(`[JSX warn] 请给组件提供一个 \`defaultProps\` 以提高初次渲染性能！`)
        console.warn(err)
    }
    const weappComponentConf = Object.assign({},componentInstance,{
        data: Object.assign({}, initData, componentInstance.props, componentInstance.data),
        __isReady:false,
        created (...args) {
            this._nativeSetData = this.setData;
            this.setData = setData.bind(this);
            componentInstance.created && componentInstance.created.apply(this,args)
        },
        ready(...args){
            this.__isReady = true;
            componentInstance.ready && componentInstance.ready.apply(this,args)
        }
    });
    bindProperties(weappComponentConf, ComponentClass)

    return weappComponentConf
}


export default function createPage (ComponentClass) {
    let initData = {
        _componentProps: 1
    }
    const componentInstance = new ComponentClass()
    try {
        componentInstance.data = componentInstance._createData() || componentInstance.data
    } catch (err) {
        console.warn(`[JSX warn] 请给组件提供一个 \`defaultProps\` 以提高初次渲染性能！`)
        console.warn(err)
    }
    const weappComponentConf = Object.assign({},componentInstance,{
        data: Object.assign({}, initData, componentInstance.props, componentInstance.data),
        __isReady:false,
        onLoad (...args) {
            this._nativeSetData = this.setData;
            this.setData = setData.bind(this);
            componentInstance.onLoad && componentInstance.onLoad.apply(this,args)
        },
        onReady(...args){
            this.__isReady = true;
            componentInstance.onReady && componentInstance.onReady.apply(this,args)
        }
    });
    return weappComponentConf
}
