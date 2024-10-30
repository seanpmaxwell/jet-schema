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
  avatar5?: IAvatar;
  avatar6?: IAvatar | null;
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
  }, { optional: true, nullable: true }),
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
  }, { nullable: true }),
  avatar3: schema({
    fileName: isString,
    data: [ 'base64:str;', isString ],
    url: isOptionalString,
  }, { optional: true, nullable: true, init: false }),
  avatar4: schema({
    fileName: isString,
    data: [ 'base64:str;', isString ],
    url: isOptionalString,
  }, { optional: true, nullable: true, init: null }),
  avatar6: schema({
    fileName: isString,
    data: [ 'base64:str;', isString ],
    url: isOptionalString,
  }, { nil: true }),
  adminStatus: AdminStatus,
  adminStatusAlt: AdminStatusAlt,
});


// **** Export default **** //

export default {
  AdminStatus,
  AdminStatusAlt,
  ...User,
};
