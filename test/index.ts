import { transform, ITransformAndTest } from '../src';

import User from './models/User';
import { IPost } from './models/Post';
import { isNumberArray, nonNullable } from './util/validators';


// **** User Test Stuff (User has an explicit type) **** //

// Test schema new
console.log(User.new({
  lastLogin: '2023-12-25' as unknown as Date,
  age: '123' as unknown as number,
}));

console.log(User.pick('avatar').default?.())
console.log(User.pick('avatar').new?.())
console.log(User.pick('avatar').pick?.('data'))

const avatar = User.pick('avatar').new?.();
const testAvatar = nonNullable(User.pick('avatar').test!);
console.log(testAvatar('asdf'))
console.log(testAvatar(avatar))

// Test trans function
const customTest: ITransformAndTest<number[]> = transform(JSON.parse, isNumberArray);
console.log(customTest('[1,2,3,5]'));


// **** Post test stuff (Post has an inferred type) **** //

const customPost: IPost = {
  id: -1,
  mesage: '123',
  index: 0,
  created: new Date(),
  image: {
    data: '',
    fileName: '',
  },
  // image: null,
  // imageOpt: undefined,
  imageNull: null,
  // imageOptNull: null,
  // imageNull: {
  //   fileName: '',
  //   data: '',
  // },
}

