import { transform } from '../../src';

import schema from '../util/schema'

import {
  isEmail,
  isNumber,
  isRelationalKey,
  isString,
  isOptionalString,
} from '../util/validators';


// **** Types ***** //

interface IUser {
  id: number; // pk
  name: string;
  age: number;
  email: string;
  created: Date;
  lastLogin: Date;
  avatar?: IAvatar | null;
}

export interface IAvatar {
  fileName: string;
  data: string;
  url?: string;
}


// **** Setup **** //

const User = schema<IUser>({
  id: isRelationalKey,
  name: isString,
  email: isEmail,
  age: transform(Number, isNumber),
  created: Date,
  lastLogin: Date,
  avatar: schema({
    fileName: isString,
    data: isString,
    url: isOptionalString,
  }, true, true),
});



// **** Export default **** //

export default User;
