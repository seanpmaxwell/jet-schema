import { isOptionalString } from 'jet-validators';

import schema, { inferType } from '../../src';
import { RelationalKey } from '../validators';


// **** Setup ***** //

enum Level {
  low,
  high,
}

const Post = schema({
  id: RelationalKey,
  message: String,
  index: Number,
  created: Date,
  // animals: { dog: 'asdf' },
  optionalStr: isOptionalString,
  image: schema({
    fileName: String,
    data: String,
  }),
  imageOpt: schema({
    fileName: String,
    data: String,
  }, { optional: true }),
  imageOptNull: schema({
    fileName: String,
    data: String,
  }, { optional: true, nullable: true }),
  imageNull: schema({
    fileName: String,
    data: String,
  }, { optional: false, nullable: true }),
  imageReq: schema({
    fileName: String,
    data: String,
  }, { optional: false, nullable: false }),
  imageNullish: schema({
    fileName: String,
    data: String,
    foo: isOptionalString,
  }, { nullish: true }),
  level: { enum: Level },
}, { id: 'Post' });

export type IPost = inferType<typeof Post>;

export default {
  Level,
  ...Post,
} as const;
