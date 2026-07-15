// Types by Inference
// ========================
// Typescript knows the Javascript lang will generate types

let helloWorld = "Hello Word";

//Automatically helloWord is a string

// Defining Types
// ====================

// some design patterns in javascript like dynamic programming
// make it difficult for types to be inferred

// For instance creating an object with an
// inferred type which includes name:string anf id:number, you can write:

const user = {
    name: "Hope",
    id:0,
}

// The object's shape  can be explicitly described using interface declaration:

interface User{
    name:string;
    id:number;
}

// Now a javascript object can be declared to conforms to
// our new interface :TypeName

const hope:User = {
    name:"Hope",
    id:0,
}


// typeScript support  classes since  Javascript does too
// hence  we can use interface declaration with classes

interface  Person{
    name:string;
    id:number;
}

class UserAccount{
    name:string;
    id:number;
    constructor(name:string, id:number) {
        this.name = name;
        this.id = id;
    }
}

const person:Person = new UserAccount('Mucyo',2);

// Interfaces can be used to annotate parameters and return values

function deleteUser(user:Person){
    console.log(`${user.name} deleted`);
}

function getPerson():Person{
    return person;
}

// Primitive types available in JavaScript are:
//boolean,bigint,null,number,string and undefined
// Which can be used in an interface
// TYPESCRIPT extends these by adding others like
// any,unknown,never and void
// https://www.typescriptlang.org/play#example/unknown-and-never

//Composing types
//===================

//In typescript complex types can be created by combing simple ones
// the popular ways are using Generics and UNIONS

//UNIONS

//With unions a type can be declared BOOLEAN  as being either  true or false

type MyBool  = true | false;


//Popular use case is to describe set of string or numbers
type WindowStates  = 'open' | 'closed'|'minimized';
type LockState  = 'locked'|'unlocked';
type PositiveOddsUnderTen = 1|3|5|7|9;

// With unions we can handle different types too

function  getLength(obj:string|string[]):number{
    return obj.length;
}

//To know or inspect the type of available we can use  `typeof`

/*
string	typeof s === "string"
number	typeof n === "number"
boolean	typeof b === "boolean"
undefined	typeof undefined === "undefined"
function	typeof f === "function"
array	Array.isArray(a)

 */

function  wrapInArra(obj:string| string[]){
    if(typeof  obj ==='string'){
        return [obj];
    }
    return obj
}

// Generics

// Generics provide types to variables. A common example is an array without generics could contain anything where as an array with generics can describe the values that an array contains

type StringArray = Array<string>;
type NumberArray = Array<number>;
type ObjectWithNameArray = Array<{name:string}>

// User  own types can be declared using generics

interface Backpack<T>{
    add:(obj:T) => void;
    get: ()=>T;
}

declare const backpack: Backpack<number>
const object = backpack.get(); //Which makes object a number
// backpack.add("hope")
backpack.add(12);
