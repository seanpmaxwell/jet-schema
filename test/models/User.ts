import { transform } from '../../src';

import schema from '../util/schema';

import {
  isEmail,
  isNumber,
  isRelationalKey,
  isString,
  isOptionalString,
} from '../util/validators';


// **** Variables **** //

enum AdminStatus {
  Basic = 'basic',
  Mid = 'mid',
  High = 'high',
}

enum AdminStatusAlt {
  Basic,
  Mid,
  High,
}


// **** Types ***** //

export interface IUser {
  id: number; // pk
  name: string;
  age: number;
  email: string;
  created: Date;
  lastLogin: Date;
  avatar?: IAvatar | null;
  avatar2: IAvatar | null;
  avatar3?: IAvatar | null;
  avatar4?: IAvatar | null;
  address: IAddress;
  adminStatus: AdminStatus;
  adminStatusAlt: AdminStatusAlt;
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
  email: ['', isEmail],
  age: [0, transform(Number, isNumber)],
  created: Date,
  lastLogin: Date,
  avatar: schema({
    fileName: isString,
    data: [ 'base64:str;', isString ],
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
  avatar2: schema({
    fileName: isString,
    data: [ 'base64:str;', isString ],
    url: isOptionalString,
  }, false, true),
  avatar3: schema({
    fileName: isString,
    data: [ 'base64:str;', isString ],
    url: isOptionalString,
  }, true, true, false),
  avatar4: schema({
    fileName: isString,
    data: [ 'base64:str;', isString ],
    url: isOptionalString,
  }, true, true, null),
  adminStatus: AdminStatus,
  adminStatusAlt: AdminStatusAlt,
});


// **** Export default **** //

export default {
  AdminStatus,
  AdminStatusAlt,
  ...User,
};
