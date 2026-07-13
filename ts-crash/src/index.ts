let id:number = 5
let company:string = "Traversy Media"
let isPublish = false
let x:any = 'Hello'
let ids: number[] = [1,2,3,4,5,6,7]
let arr: any [] = [1,2,true,'Hello']

// Tuples
let person:[number,string,boolean] = [1,'Brad',true]
// Tuple Array
let employee: [number,string][]

employee = [
    [1,'Brad'],
    [2,'Jane'],
    [3,'Jill'],
]

//Union

let pId: string | number
pId = '22'

//Enums

enum Direction {
    Up=1,
    Down,
    Left,
    Right,
}

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

let cid:any = 1
// let customerId = <number>cid
let customerId = cid as number

//Functions
function addNum(x:number,y:number){
    return x+y
}

// console.log(addNum(1,3))

// Void
function log(message:string|number):void{
    console.log(message)
}

// log(true)


// Interfaces

interface UserInterface {
    readonly id:number,//Can not be assigned
    name: string,
    age?: number, //Option property
}
const user:UserInterface= {
    id:1,
    name:'John',
}
// user.id=1;


// Interfaces can't  work primitives

type Point = number | string
// interface Point = number | string
const p1: Point = 1

// Interface with Function
interface MathFunct {
    (x:number,y:number):number
}

const add: MathFunct = (x:number,y:number):number=>x+y
const sub: MathFunct = (x:number,y:number):number=>x-y

//Classes

interface PersonInterface {
    id:number,
    name: string,
    age?: number,
    register():string
}

class Person implements PersonInterface {
    id:number
    name:string

    constructor(id:number, name:string) {
        this.id = id
        this.name = name
    }
    register(){
        return `${this.name} Registered`
    }
}

const brad = new Person(1,"brad")
const mike= new Person(1,"mike")

console.log(brad,mike)
// console.log(brad.id)

// by default the access modifiers are public


// Subclasses
class Employee extends Person {
    position:string
    constructor(id:number,name:string,position:string) {
        super(id,name)
        this.position =position
    }
}

const  emp = new Employee(3,'Shawn',"Dev")

// Generics Types

function getArray<T>(items:T[]):T[]{
    return new Array().concat(items)
}

let numArr = getArray<number>([1,2,3,4,5])
let strArr = getArray<string>(['john','hope'])

// numArr.push('hello')
numArr.push(2)