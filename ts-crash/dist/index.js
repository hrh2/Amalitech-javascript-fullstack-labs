"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
let id = 5;
let company = "Traversy Media";
let isPublish = false;
let x = 'Hello';
let ids = [1, 2, 3, 4, 5, 6, 7];
let arr = [1, 2, true, 'Hello'];
// Tuples
let person = [1, 'Brad', true];
// Tuple Array
let employee;
employee = [
    [1, 'Brad'],
    [2, 'Jane'],
    [3, 'Jill'],
];
//Union
let pId;
pId = '22';
//Enums
var Direction;
(function (Direction) {
    Direction[Direction["Up"] = 1] = "Up";
    Direction[Direction["Down"] = 2] = "Down";
    Direction[Direction["Left"] = 3] = "Left";
    Direction[Direction["Right"] = 4] = "Right";
})(Direction || (Direction = {}));
// console.log(Direction.Up)
//Objects
/*
type User ={
    id:number,
    name: string,
}
const user:User= {
    id:1,
    name:'John',
}

*/
// Type Assertion
let cid = 1;
// let customerId = <number>cid
let customerId = cid;
//Functions
function addNum(x, y) {
    return x + y;
}
// console.log(addNum(1,3))
// Void
function log(message) {
    console.log(message);
}
const user = {
    id: 1,
    name: 'John',
};
// interface Point = number | string
const p1 = 1;
const add = (x, y) => x + y;
const sub = (x, y) => x - y;
class Person {
    id;
    name;
    constructor(id, name) {
        this.id = id;
        this.name = name;
    }
    register() {
        return `${this.name} Registered`;
    }
}
const brad = new Person(1, "brad");
const mike = new Person(1, "mike");
console.log(brad, mike);
// console.log(brad.id)
// by default the access modifiers are public
// Subclasses
class Employee extends Person {
    position;
    constructor(id, name, position) {
        super(id, name);
        this.position = position;
    }
}
const emp = new Employee(3, 'Shawn', "Dev");
// Generics Types
function getArray(items) {
    return new Array().concat(items);
}
let numArr = getArray([1, 2, 3, 4, 5]);
let strArr = getArray(['john', 'hope']);
// numArr.push('hello')
numArr.push(2);
