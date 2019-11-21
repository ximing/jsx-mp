const {createComponent,createPage,Component,Page}  = require('../lib');
class Page1 extends Page{
    constructor() {
        super()
        this.data = {}
        this.state = {
            a:{d:3},
            b:[{c:1},{c:2}]
        }
    }
    // data = {};
    setData(data,fn){
        this.data = Object.assign(this.data,data);
        setTimeout(()=>{
            fn(this.data);
        },0)
    }

    hello(){
        this.data.a.d=4;
        this.setState(this.data);
    }
}
class Com1 extends Component{

}
const page1 = createPage(Page1);

const com1 = createComponent(Com1);
page1.onLoad();
page1.hello();
console.log(JSON.stringify(page1.data))
