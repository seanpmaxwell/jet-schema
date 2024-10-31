import { transform } from '../../src';

import schema from '../util/schema';

import {
  isEmail,
  isNumber,
  isRelationalKey,
  isString,
  isOptionalString,
  isBoolean,
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
  avatar7?: IAvatar | null;
  avatar8?: IAvatar | null;
  address: IAddress;
  adminStatus: AdminStatus;
  adminStatusAlt: AdminStatusAlt;
}

interface IAvatar {
  fileName: string;
  data: string;
  url?: string;
  // jpg?: boolean;
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
  avatar5: schema({
    fileName: isString,
    data: [ 'base64:str;', isString ],
    url: isOptionalString,
  }, { optional: true, init: false }),
  avatar6: schema({
    fileName: isString,
    data: [ 'base64:str;', isString ],
    url: isOptionalString,
  }, { nil: true, init: false }),
  avatar7: schema({
    fileName: isString,
    data: isString,
    url: isOptionalString,
    jpg: [ false, isBoolean ],
    foo: isString
  }, { nil: true, init: null }),
  avatar8: schema({
    fileName: isString,
    data: isString,
    url: isOptionalString,
    foo: isString
  }),
  adminStatus: AdminStatus,
  adminStatusAlt: AdminStatusAlt,
});


// **** Export default **** //

export default {
  AdminStatus,
  AdminStatusAlt,
  ...User,
};
