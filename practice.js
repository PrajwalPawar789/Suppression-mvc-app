//function expression
// const add = function(a, b){
//     return a + b;
// };

// console.log(add(5,3));

//Arrow Functions
// const add = (x,y) => x + y;

// console.log(add(5,3))

//callback functions
// function add(x,y){
//     return x+y;
// }

// let a = 3, b = 6;
// let result = add(a,b);

// console.log(result);

//callback function
//A callback function is a function that is passed as an argument to another function.

// function add(a,b){
//     return a + b;
// }

// let a = 3, b = 6;

// let result = add(a, b);

// console.log(result);

// function display(x,y, operation){
//     let result = operation(x,y);
//     console.log(result);
// }

// display(1,45, add)

//Higher Order Function
//A Higher Order Function:
//1. Take one or more function as arguments(callback function) OR
//2. Return a function as a result

// function hoc(func){
//     func();
// }

// hoc(sayHello);

// function sayHello(){
//     console.log("hello!");
// }

// function createAdder(number){
//     return function(value){
//         return value + number;
//     }
// }

// const addFive = createAdder(5);

// console.log(addFive(2))