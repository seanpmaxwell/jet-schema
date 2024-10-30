import { inferType } from '../../src';

import schema from '../util/schema';
import { isNumber, isRelationalKey, isString } from '../util/validators';


// **** Setup ***** //

const Post = schema({
  id: isRelationalKey,
  mesage: isString,
  index: isNumber,
  created: Date,
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
  imageNil: schema({
    fileName: isString,
    data: isString,
  }, { nil: true }),
});

export type IPost = inferType<typeof Post>;
export default Post;
