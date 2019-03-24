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
    state = { abc: 'abc', passToChild: 123 };

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
                <Text>
                    Hello
                    {this.state.abc}
                    {this.state.passToChild}
                </Text>
                <View>{this.state.bizId}</View>
                <BitcTag type="danger">取消订单</BitcTag>
                <Text onClick={this.onMyEvent}>sss</Text>
                <View>
                    <Button bindtap={this.onMyEvent}>abc</Button>
                </View>
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
