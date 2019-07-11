import { Behavior } from "./typings/wx/behavior";
import { wx } from "./typings/wx/lib.wx.api";

type ReactText = string | number;
type ReactChild = Element | ReactText;

interface ReactNodeArray extends Array<ReactNode> {}
type ReactFragment = {} | ReactNodeArray;
type ReactNode = ReactChild | ReactFragment | boolean | null | undefined;
type ReactInstance = any;

export = MP;
export as namespace MP;
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

interface ICustomShareContent {
  /** 转发标题。默认值：当前小程序名称 */
  title?: string;
  /** 转发路径，必须是以 / 开头的完整路径。默认值：当前页面 path */
  path?: string;
  /** 自定义图片路径，可以是本地文件路径、代码包文件路径或者网络图片路径。支持PNG及JPG。显示图片长宽比是 5:4，最低基础库： `1.5.0`。默认值：使用默认截图 */
  imageUrl?: string;
}
interface IPageScrollOption {
  /** 页面在垂直方向已滚动的距离（单位px） */
  scrollTop: number;
}
interface IShareAppMessageOption {
  /** 转发事件来源。
   *
   * 可选值：
   * - `button`：页面内转发按钮；
   * - `menu`：右上角转发菜单。
   *
   * 最低基础库： `1.2.4`
   */
  from: "button" | "menu" | string;
  /** 如果 `from` 值是 `button`，则 `target` 是触发这次转发事件的 `button`，否则为 `undefined`
   *
   * 最低基础库： `1.2.4` */
  target: any;
  /** 页面中包含`<web-view>`组件时，返回当前`<web-view>`的url
   *
   * 最低基础库： `1.6.4`
   */
  webViewUrl?: string;
}

interface ITabItemTapOption {
  /** 被点击tabItem的序号，从0开始，最低基础库： `1.9.0` */
  index: string;
  /** 被点击tabItem的页面路径，最低基础库： `1.9.0` */
  pagePath: string;
  /** 被点击tabItem的按钮文字，最低基础库： `1.9.0` */
  text: string;
}

declare namespace MP {
  function createComponent(com: any): any;
  function createPage(page: any): any;

  class Component<P, S> {
    constructor(props?: Readonly<P>);
    readonly props: Readonly<P> & Readonly<{ children?: ReactNode }>;
    setState<K extends keyof S>(
        data:
            | ((prevData: Readonly<S>, props: Readonly<P>) => Pick<S, K> | S | null)
            | (Pick<S, K> | S | null),
        callback?: () => void
    ): void;
    state: Readonly<S>;
    render(): ReactNode;
    /** 组件生命周期函数，在组件实例进入页面节点树时执行，注意此时不能调用 setData */
    created?(this: Component<P, S>): any;
    /** 组件生命周期函数，在组件实例进入页面节点树时执行 */
    attached?(this: Component<P, S>): any;
    /** 组件生命周期函数，在组件布局完成后执行，此时可以获取节点信息（使用 SelectorQuery ） */
    ready?(this: Component<P, S>): any;
    /** 组件生命周期函数，在组件实例被移动到节点树另一个位置时执行 */
    moved?(this: Component<P, S>): any;
    /** 组件生命周期函数，在组件实例被从页面节点树移除时执行 */
    detached?(this: Component<P, S>): any;
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
        linked?: (this: Component<P, S>) => any;
        /** 关系生命周期函数，当关系在页面节点树中发生改变时触发，触发时机在组件moved生命周期之后 */
        linkChanged?: (this: Component<P, S>) => any;
        /** 关系生命周期函数，当关系脱离页面节点树时触发，触发时机在组件detached生命周期之后 */
        unlinked?: (this: Component<P, S>) => any;
        /** 如果这一项被设置，则它表示关联的目标节点所应具有的behavior，所有拥有这一behavior的组件节点都会被关联 */
        target?: string;
      };
    };

    behaviors?: Array<string | Behavior>;

    externalClasses?: string[];

    /** 节点dataset */
    dataset?: { [key: string]: any };

    /** 检查组件是否具有 behavior （检查时会递归检查被直接或间接引入的所有behavior） */
    hasBehavior(behavior: any): boolean;

    /** 触发事件 */
    triggerEvent(
        name: string,
        detail: any,
        options?: TriggerEventOptions
    ): void;

    /** 也可以使用 wx.createSelectorQuery */
    createSelectorQuery(): wx.SelectorQuery;
    /** 使用选择器选择组件实例节点，返回匹配到的第一个组件实例对象 */
    selectComponent(selector: string): Component<P, S>;
    /** 使用选择器选择组件实例节点，返回匹配到的全部组件实例对象组成的数组 */
    selectAllComponents(selector: string): Component<P, S>[];
    /** 获取所有这个关系对应的所有关联节点, 参见 组件间关系 https://mp.weixin.qq.com/debug/wxadoc/dev/framework/custom-component/relations.html */
    getRelationNodes(relationKey: string): any[];

    [key: string]: any;
  }

  class Page<S> {
    constructor();
    setState<K extends keyof S>(
        data:
            | ((prevData: Readonly<S>) => Pick<S, K> | S | null)
            | (Pick<S, K> | S | null),
        callback?: () => void
    ): void;
    state: Readonly<S>;
    render(): ReactNode;

    /** 到当前页面的路径，类型为`String`。最低基础库： `1.2.0` */
    route?: string;

    /** 生命周期回调—监听页面加载
     *
     * 页面加载时触发。一个页面只会调用一次，可以在 onLoad 的参数中获取打开当前页面路径中的参数。
     */
    onLoad?(
        /** 打开当前页面路径中的参数 */
        query?: { [queryKey: string]: string }
    ): void;
    /** 生命周期回调—监听页面显示
     *
     * 页面显示/切入前台时触发。
     */
    onShow?(): void;
    /** 生命周期回调—监听页面初次渲染完成
     *
     * 页面初次渲染完成时触发。一个页面只会调用一次，代表页面已经准备妥当，可以和视图层进行交互。
     *

     * 注意：对界面内容进行设置的 API 如`wx.setNavigationBarTitle`，请在`onReady`之后进行。
     */
    onReady?(): void;
    /** 生命周期回调—监听页面隐藏
     *
     * 页面隐藏/切入后台时触发。 如 `navigateTo` 或底部 `tab` 切换到其他页面，小程序切入后台等。
     */
    onHide?(): void;
    /** 生命周期回调—监听页面卸载
     *
     * 页面卸载时触发。如`redirectTo`或`navigateBack`到其他页面时。
     */
    onUnload?(): void;
    /** 监听用户下拉动作
     *
     * 监听用户下拉刷新事件。
     * - 需要在`app.json`的`window`选项中或页面配置中开启`enablePullDownRefresh`。
     * - 可以通过`wx.startPullDownRefresh`触发下拉刷新，调用后触发下拉刷新动画，效果与用户手动下拉刷新一致。
     * - 当处理完数据刷新后，`wx.stopPullDownRefresh`可以停止当前页面的下拉刷新。
     */
    onPullDownRefresh?(): void;
    /** 页面上拉触底事件的处理函数
     *
     * 监听用户上拉触底事件。
     * - 可以在`app.json`的`window`选项中或页面配置中设置触发距离`onReachBottomDistance`。
     * - 在触发距离内滑动期间，本事件只会被触发一次。
     */
    onReachBottom?(): void;
    /** 用户点击右上角转发
     *
     * 监听用户点击页面内转发按钮（`<button>` 组件 `open-type="share"`）或右上角菜单“转发”按钮的行为，并自定义转发内容。
     *
     * **注意：只有定义了此事件处理函数，右上角菜单才会显示“转发”按钮**
     *
     * 此事件需要 return 一个 Object，用于自定义转发内容
     */
    onShareAppMessage?(
        /** 分享发起来源参数 */
        options?: IShareAppMessageOption
    ): ICustomShareContent;
    /** 页面滚动触发事件的处理函数
     *
     * 监听用户滑动页面事件。
     */
    onPageScroll?(
        /** 页面滚动参数 */
        options?: IPageScrollOption
    ): void;

    /** 当前是 tab 页时，点击 tab 时触发，最低基础库： `1.9.0` */
    onTabItemTap?(
        /** tab 点击参数 */
        options?: ITabItemTapOption
    ): void;
  }
}
