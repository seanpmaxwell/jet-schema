import { inferType } from '../../src';

import schema from '../util/schema';

import {
  isNumber,
  isOptionalString,
  isRelationalKey,
  isString,
} from '../util/validators';


// **** Setup ***** //

enum Level {
  low,
  high,
}

const Post = schema({
  id: isRelationalKey,
  mesage: isString,
  index: isNumber,
  created: Date,
  optionalStr: isOptionalString,
  image: schema({
    fileName: isString,
    data: isString,
  }),
  imageOpt: schema({
    fileName: isString,
    data: isString,
  }, { optional: true }),
  imageOptNull: schema({
    fileName: isString,
    data: isString,
  }, { optional: true, nullable: true }),
  imageNull: schema({
    fileName: isString,
    data: isString,
  }, { optional: false, nullable: true }),
  imageReq: schema({
    fileName: isString,
    data: isString,
  }, { optional: false, nullable: false }),
  imageNullish: schema({
    fileName: isString,
    data: isString,
    foo: isOptionalString,
  }, { nullish: true }),
  level: Level,
}, { id: 'Post' });

export type IPost = inferType<typeof Post>;

export default {
  Level,
  ...Post,
} as const;
