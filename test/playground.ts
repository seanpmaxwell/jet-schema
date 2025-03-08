/* eslint-disable max-len */
/* eslint-disable no-console */
import { isEnumVal, isOptionalString } from 'jet-validators';

import schema, { inferType, TJetSchema } from '../src';

import User from './models/User';
import Post, { IPost } from './models/Post';
import { nonNullable } from './validators';


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
  message: '123',
  index: 0,
  // animals: 'hhh',
  // These should throw runtime errors
  // animals2: 'fido',
  // animals3: 1234,
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
  // pick up here
  level: Post.Level.high,
};

console.log('foo', customPost.imageNullish?.foo);

const other = schema({
  fileName: String,
  data: String,
  foo: { vldr: isOptionalString, default: '' },
}, { nullish: true, init: true });

type Tother = inferType<typeof other>;

const val: Tother = { fileName: '', data: '' };
if (other.test(val)) {
  console.log('Tother', val?.data);
}

const post = Post.new();
console.log(post.image);
console.log(post.imageNullish);
console.log(post.imageOptNull);
console.log(post.imageNull);



// **** Test Partial Schema **** //

const PartialSchema: TJetSchema<{ idddd: number, name: string }> = {
  idddd: (arg: unknown) => typeof arg === 'number', // should return error cause no default set,
  name: String,
} as const;

const FullSchema = schema<{ idddd: number, name: string, foo: boolean }>({
  ...PartialSchema,
  foo: Boolean,
}, { id: 'FullSchema', onError: arg => console.log(arg) });


console.log(FullSchema.new({ foo: 'horse' as unknown as boolean}));



// **** Test Global Overrides ***** //

try {
  User.new({ pastIds: '[1, 2, 3]' as unknown as number[] }); // should not print error
  User.new({ pastIds: '[1, 2, "horse"]' as unknown as number[] }); // should print error
} catch (err) {
  if (err instanceof Error) {
    console.log(err.message);
  }
}

// **** Test Local Overrides ***** //

try {
  User.new({ single: undefined }); // should not print error
  User.new({ single: 'true' as unknown as boolean }); // should print error
} catch (err) {
  if (err instanceof Error) {
    console.log(err.message);
  }
}


// **** Test Enum Hacks using objects instead **** //

enum AnimalTypes {
  Cat,
  Dog,
}

enum AnimalTypes2 {
  Cow = 3,
  Pig = 5,
}

interface IAnimal {
  id: number;
  types: AnimalTypes;
}

const Animal = schema<IAnimal>({
  id: Number,
  types: { vldr: isEnumVal(AnimalTypes), default: AnimalTypes.Cat },
  // types: { enum: AnimalTypes2 },
}, { id: 'Animal', onError: arg => console.log(arg) });

Animal.parse('asdf');
