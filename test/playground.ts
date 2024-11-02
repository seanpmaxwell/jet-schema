/* eslint-disable max-len */
/* eslint-disable no-console */

import { inferType, TJetSchema } from '../src';

import User from './models/User';
import Post, { IPost } from './models/Post';
import schema from './util/schema';

import {
  isBoolean,
  nonNullable,
  isString,
  isOptionalString,
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

const blah: unknown = 'asdf';
if (User.pick('avatar').test(blah)) {
  console.log(blah);
}


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
  // imageNullish: { data: '', fileName: '' }
  // optionalStr: 'asdf'
  level: Post.Level.high,
};

console.log(customPost.imageNullish?.foo);

const other = schema({
  fileName: isString,
  data: isString,
  foo: { fn: isOptionalString, default: '' },
}, { nullish: true, init: true });

type Tother = inferType<typeof other>;

const val: Tother = { fileName: '', data: '' };
if (other.test(val)) {
  console.log(val?.data);
}


const post = Post.new();
console.log(post.image);
console.log(post.imageNullish);
console.log(post.imageOptNull);
console.log(post.imageNull);



// **** Test Partial Schema **** //

const PartialSchema: TJetSchema<{ idddd: number, name: string }> = {
  idddd: (arg: unknown) => typeof arg === 'number', // should return error cause no default set,
  name: isString,
} as const;

const FullSchema = schema<{ idddd: number, name: string, foo: boolean }>({
  ...PartialSchema,
  foo: isBoolean,
}, { id: 'FullSchema' });

console.log(FullSchema.new({ foo: 'horse' as unknown as boolean}));
