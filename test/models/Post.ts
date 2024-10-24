import { inferType } from '../../src';

import schema from '../util/schema'

import {
  isNumber,
  isRelationalKey,
  isString,
} from '../util/validators';


const Post = schema({
  id: isRelationalKey,
  mesage: isString,
  index: isNumber,
  created: Date,
  image: schema({
    fileName: isString,
    data: isString,
  }, true, true),
});

export type TPost = inferType<typeof Post>

const customPost: TPost = {
  id: -1,
  mesage: '123',
  index: 0,
  created: new Date(),
  // image: {
  //   data: '',
  //   fileName: '',
  // }
  // image: null,
  image: undefined,
}



const other = schema({
  fileName: isString,
  data: isString,
}, true, true);

let val: unknown = 'asdf'
if (other.test(val)) {
  console.log(val?.data)
}
