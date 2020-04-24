const {diffObjToPath} = require('../lib/internal/util')

const state = {a: {b: 1,c:2}}
const newState = {a: {b: 2}}
console.log(diffObjToPath(newState,state))
