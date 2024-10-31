/* eslint-disable no-console */

import { inferType, TJetSchema, transform } from '../src';

import User from './models/User';
import Post, { IPost } from './models/Post';
import schema from './util/schema';

import {
  isBoolean,
  isNumberArray,
  nonNullable,
  isString,
} from './util/validators';


// **** User Test Stuff (User has an explicit type) **** //

// Test schema new
const user1 = User.new({
  lastLogin: '2023-12-25' as unknown as Date,
  age: '123' as unknown as number,
});

// console.log(user1);
console.log(User.test(user1));
console.log(User.pick('age').test(User.AdminStatus.Basic));
console.log(User.pick('adminStatus').test);
console.log(User.pick('avatar').default());
console.log(User.pick('avatar').new());
console.log(User.pick('avatar').pick('data'));
console.log(User.pick('avatar').pick('data').default());
console.log(User.pick('avatar').pick('url').default());
console.log(User.pick('avatar2').default());
console.log(User.pick('avatar2').new());

const avatar = User.pick('avatar').new();
const testAvatar = nonNullable(User.pick('avatar').test);
console.log(testAvatar('asdf'));
console.log(testAvatar(avatar));

// Test trans function
const customTest = transform(JSON.parse, isNumberArray);
console.log(customTest('[1,2,3,5]', transVal => console.log(transVal)));


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
  imageOpt: undefined,
  // imageOpt: { data: '', fileName: '' },
  imageNull: null,
  imageOptNull: null,
  // imageNull: {
  //   fileName: '',
  //   data: '',
  // },
  imageReq: { data: '', fileName: '' },
  // imageNil: { data: '', fileName: '' }
  // optionalStr: 'asdf'
};

console.log(customPost);

const other = schema({
  fileName: isString,
  data: isString,
}, { optional: true, nullable: true, init: true });

type Tother = inferType<typeof other>;

const val: Tother = { fileName: '', data: '' };
if (other.test(val)) {
  console.log(val?.data);
}

const post = Post.new();
console.log(post.image);
console.log(post.imageNil);
console.log(post.imageOptNull);
console.log(post.imageNull);



// **** Test Partial Schema **** //

const PartialSchema: TJetSchema<{ id: number, name: string }> = {
  id: (arg: unknown) => typeof arg === 'number', // should return error,
  name: isString,
} as const;

const FullSchema = schema<{ id: number, name: string, e: boolean }>({
  ...PartialSchema,
  e: isBoolean,
});

console.log(FullSchema.new());
