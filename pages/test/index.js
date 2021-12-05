//  >>> <<< 位移运算符

let num = 3;
// 将目标数据先转换成二进制，然后移动指定的位数
console.log(num >>>2); //0
console.log(num >>>1); //1

console.log(num >>>0); //3
//0000 0011
//0000 0000
//0000 0001

// 右移零位会将非number数据强制转换成number
