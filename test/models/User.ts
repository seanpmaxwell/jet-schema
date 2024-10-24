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
  address: IAddress;
}

interface IAvatar {
  fileName: string;
  data: string;
  url?: string;
}

interface IAddress {
  street: string;
  city: string;
  zip: number;
  country: {
    name: string;
    code: number;
  };
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
  address: schema({
    street: isString,
    city: isString,
    zip: isNumber,
    country: schema({
      name: isString,
      code: isNumber,
    }),
  }),
});



// **** Export default **** //

export default User;
