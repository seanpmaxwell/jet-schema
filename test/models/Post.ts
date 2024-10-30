/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { inferType } from '../../src';

import schema from '../util/schema';
import { isNumber, isRelationalKey, isString } from '../util/validators';


// **** Setup ***** //

const Post = schema({
  id: isRelationalKey,
  mesage: isString,
  index: isNumber,
  created: Date,
  // image: schema({
  //   fileName: isString,
  //   data: isString,
  // }),
  imageOpt: schema({
    fileName: isString,
    data: isString,
  }, { optional: true }),
  // imageOptNull: schema({
  //   fileName: isString,
  //   data: isString,
  // }, true, true),
  // imageNull: schema({
  //   fileName: isString,
  //   data: isString,
  // }, false, true),
});

export type IPost = inferType<typeof Post>;


const other = schema({
  fileName: isString,
  data: isString,
}, { optional: false, nullable: true, init: true });

const val = {};
if (other.test(val)) {
  console.log(val?.data);
}

// const post = Post.new();
// post.created