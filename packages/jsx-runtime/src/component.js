import { diffObjToPath, noop } from './internal/util';

/**
 * Created by ximing on 2019-04-11.
 */
export default class JSXComponent {
    __init(scope, isPage) {
        if(!isPage){
            Object.keys(this).forEach(key=>{
                if(typeof scope[key] === 'undefined' && typeof this[key] !== 'function'){
                    scope[key] = this[key]
                }
            })
        }
    }
}
