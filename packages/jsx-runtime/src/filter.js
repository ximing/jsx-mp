import { isEmptyObject } from './internal/util';

/**
 * Created by ximing on 2019-04-16.
 */

export function filterProps(defaultProps = {}, propsFromPropsManager = {}, curAllProps = {}) {
    let newProps = Object.assign({}, curAllProps, propsFromPropsManager);
    if (!isEmptyObject(defaultProps)) {
        for (const propName in defaultProps) {
            if (newProps[propName] === undefined) {
                newProps[propName] = defaultProps[propName];
            }
        }
    }
    return newProps;
}
