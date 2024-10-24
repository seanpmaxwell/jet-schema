import { ITransformAndVldt, transform } from '../src';

import User from './models/User';
import { isNumberArray, nonNullable } from './util/validators';


// Test schema new
console.log(User.new({
  lastLogin: '2023-12-25' as unknown as Date,
  age: '123' as unknown as number,
}));

console.log(User.pick('avatar').default?.())
console.log(User.pick('avatar').new?.())
console.log(User.pick('avatar').pick?.('data'))

const avatar = User.pick('avatar').new?.();
// console.log(nonNullable(User.pick('avatar').test)())
// console.log(nonNullable(User.pick('avatar').test)(avatar))

// Test trans function
const customTest: ITransformAndVldt<number[]> = transform(JSON.parse, isNumberArray);
console.log(customTest('[1,2,3,5]'));
