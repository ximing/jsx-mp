// https://github.com/wx-minapp/minapp-wx/blob/master/typing/behavior.d.ts
import {Component} from './component';

interface Behavior {

}
export interface BehaviorConstructor {
    new(): Behavior
    (options: Component.Options): Behavior
}
export var Behavior: BehaviorConstructor
