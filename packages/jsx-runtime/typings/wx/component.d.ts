// https://github.com/wx-minapp/minapp-wx/blob/master/typing/component.d.ts
import { Behavior } from "./behavior";
import { wx } from "./lib.wx.api";

export namespace Component {
  interface HookOptions {
    /** 组件生命周期函数，在组件实例进入页面节点树时执行，注意此时不能调用 setData */
    created?(this: Component): any;
    /** 组件生命周期函数，在组件实例进入页面节点树时执行 */
    attached?(this: Component): any;
    /** 组件生命周期函数，在组件布局完成后执行，此时可以获取节点信息（使用 SelectorQuery ） */
    ready?(this: Component): any;
    /** 组件生命周期函数，在组件实例被移动到节点树另一个位置时执行 */
    moved?(this: Component): any;
    /** 组件生命周期函数，在组件实例被从页面节点树移除时执行 */
    detached?(this: Component): any;
  }

  /** 组件属性类型，null 表示任意类型 */
  type PropType =
    | typeof String
    | typeof Number
    | typeof Boolean
    | typeof Object
    | typeof Array
    | null;

  interface Options {
    /**
     * 外部样式类
     *
     * 有时，组件希望接受外部传入的样式类（类似于 view 组件的 hover-class 属性）。
     * 此时可以在 Component 中用 externalClasses 定义段定义若干个外部样式类
     *
     * 参考： https://mp.weixin.qq.com/debug/wxadoc/dev/framework/custom-component/wxml-wxss.html#%E5%A4%96%E9%83%A8%E6%A0%B7%E5%BC%8F%E7%B1%BB
     */
    externalClasses?: string[];

    /**
     * 组件的对外属性
     *
     * 是属性名到属性设置的映射表，属性设置中可包含三个字段，
     * type 表示属性类型、 value 表示属性初始值、
     * observer 表示属性值被更改时的响应函数
     */
    properties?: {
      [key: string]:
        | PropType
        | {
            /** 属性类型 */
            type: PropType;
            /** 属性初始值 */
            value?: any;
            /** 属性值被更改时的响应函数 */
            observer?: (
              this: Component,
              newVal: any,
              oldVal: any,
              changedPath: string[]
            ) => any;
          };
    };

    /**
     * 组件的内部数据
     *
     * 和 properties 一同用于组件的模版渲染
     */
    data?: { [key: string]: any };

    /**
     * 一些组件选项，请参见文档其他部分的说明
     */
    options?: { [key: string]: any };

    /** 组件间关系定义，参见 组件间关系 https://mp.weixin.qq.com/debug/wxadoc/dev/framework/custom-component/relations.html */
    relations?: {
      [key: string]: {
        /** 目标组件的相对关系 */
        type: "parent" | "child" | "ancestor" | "descendant";
        /** 关系生命周期函数，当关系被建立在页面节点树中时触发，触发时机在组件attached生命周期之后 */
        linked?: (this: Component) => any;
        /** 关系生命周期函数，当关系在页面节点树中发生改变时触发，触发时机在组件moved生命周期之后 */
        linkChanged?: (this: Component) => any;
        /** 关系生命周期函数，当关系脱离页面节点树时触发，触发时机在组件detached生命周期之后 */
        unlinked?: (this: Component) => any;
        /** 如果这一项被设置，则它表示关联的目标节点所应具有的behavior，所有拥有这一behavior的组件节点都会被关联 */
        target?: string;
      };
    };

    /**
     * 组件的方法列表
     *
     * 包括事件响应函数和任意的自定义方法，关于事件响应函数的使用，参见 [组件事件](https://mp.weixin.qq.com/debug/wxadoc/dev/framework/custom-component/events.html)
     */
    methods?: {
      [key: string]: (this: Component, ...a: any[]) => void;
    };

    /** 类似于mixins和traits的组件间代码复用机制，参见 behaviors: https://mp.weixin.qq.com/debug/wxadoc/dev/framework/custom-component/behaviors.html */
    behaviors?: Array<string | Behavior>;

    [key: string]: any;
  }

  interface TriggerEventOptions {
    /**
     * 事件是否冒泡，默认 false
     */
    bubbles?: boolean;
    /**
     * 事件是否可以穿越组件边界，为false时，事件将只能在引用组件的节点树上触发，不进入其他任何组件内部，默认 false
     */
    composed?: boolean;
    /**
     * 事件是否拥有捕获阶段，默认 false
     */
    capturePhase?: boolean;
  }
}

declare interface Component {
  /** 组件的文件路径 */
  is?: string;
  /** 节点id */
  id?: string;
  /** 节点dataset */
  dataset?: { [key: string]: any };

  /** 组件数据，包括内部数据和属性值 */
  data?: { [key: string]: any };

  /** 组件数据，包括内部数据和属性值（与 data 一致） */
  properties: { [key: string]: any };

  /** 设置data并执行视图层渲染 */
  setData(newData: any, callback?: any): void;

  /** 检查组件是否具有 behavior （检查时会递归检查被直接或间接引入的所有behavior） */
  hasBehavior?(behavior: any): boolean;

  /** 触发事件 */
  triggerEvent?(
    name: string,
    detail: any,
    options: Component.TriggerEventOptions
  ): void;

  /** 也可以使用 wx.createSelectorQuery */
  createSelectorQuery?(): wx.SelectorQuery;
  /** 使用选择器选择组件实例节点，返回匹配到的第一个组件实例对象 */
  selectComponent?(selector: string): Component;
  /** 使用选择器选择组件实例节点，返回匹配到的全部组件实例对象组成的数组 */
  selectAllComponents?(selector: string): Component[];
  /** 获取所有这个关系对应的所有关联节点, 参见 组件间关系 https://mp.weixin.qq.com/debug/wxadoc/dev/framework/custom-component/relations.html */
  getRelationNodes?(relationKey: string): any[];
}
