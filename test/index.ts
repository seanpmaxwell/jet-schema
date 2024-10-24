import { trans } from './util/schema';
import User from './models/User';
import { isNumberArray } from './util/validators';


// Test schema new
console.log(User.new({
  lastLogin: '2023-12-25' as unknown as Date,
  age: '123' as unknown as number,
}));


// Test trans function
const customTest: ReturnType<typeof trans> = trans(JSON.parse, isNumberArray);
console.log(customTest('[1,2,3,5]'));
