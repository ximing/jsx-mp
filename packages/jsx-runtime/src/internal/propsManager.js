import { filterProps } from '../filter';

class Manager {
    map = {};
    observers = {};

    set(props = {}, compid) {
        if (!compid) return;
        throw new Error(
            'jsx/tsx 中使用的组件名称不规范，请不要使用驼峰。 错误的是：<BitcTag type="danger">取消订单</BitcTag> ，正确的是：<bitc-tag type="danger">取消订单</bitc-tag>'
        );
    }

    delete(compid) {
        delete this.map[compid];
        delete this.map[`__${compid}`];
        delete this.observers[compid];
    }
}

export default new Manager();
