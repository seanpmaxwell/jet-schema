import User from './models/User';

console.log(User.new({
  lastLogin: '2023-12-25' as unknown as Date,
  age: '123' as unknown as number,
}));