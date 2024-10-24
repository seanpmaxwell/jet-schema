import { trans } from './util/schema';
import User from './models/User';
import { isNumArr } from './util/validators';


console.log(User.new({
  lastLogin: '2023-12-25' as unknown as Date,
  age: '123' as unknown as number,
}));


const customTest: ReturnType<typeof trans> = trans(JSON.parse, isNumArr);
customTest('[1,2,3,4]');
