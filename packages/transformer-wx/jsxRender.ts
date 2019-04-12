/**
 * Created by ximing on 2019-03-19.
 */
import transform from './src/index';
import { Options } from './src/options'
import { Adapters } from './src/adapter'

const baseOptions: Options = {
    isRoot: true,
    isApp:false,
    sourcePath: __filename,
    outputPath: __filename,
    env: {
        'process.env.NODE_ENV': 'development',
        'process.env.TARO_ENV': 'weapp'
    },
    adapter: Adapters.weapp,
    isTyped: false,
    code:`
import { View, Text, Button } from '@tarojs/components';

export default class Index {
    data = { abc: 'abc', passToChild: 123 };

    onMyEvent = (evt) => {
        console.log('sssss', evt);
        this.setState({
            abc: 'ccc',
            passToChild: this.state.passToChild + 1,
            bizId: 'xxxx'
        });
    };

    render() {
        return (
            <View>
                <text>
                    Hello
                    {this.data.abc}
                    {this.data.passToChild}
                </text>
                <view>{this.data.bizId}</view>
                <bit-tag type="danger">取消订单</bit-tag>
                <text onClick={this.onMyEvent}>sss</text>
                <view>
                    <Button bindtap={this.onMyEvent}>abc</Button>
                </view>
            </View>
        );
    }
}
`
};
const { template, code: resCode } = transform(
    baseOptions
);

console.log(resCode);
console.log(template);
