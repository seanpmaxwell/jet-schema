import { transform, setDefault } from '../../src';
import { IValidatorFn } from '../../src/util';

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
  avatar9?: (IAvatar) | null;
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

const foo = setDefault(isOptionalString, '');

// const blah = { setDefault, transform };


// **** Setup **** //

const User = schema<IUser>({
  id: isRelationalKey,
  name: isString,
  email: setDefault(isEmail, ''),
  age: setDefault(transform(Number, isNumber), 0),
  created: Date,
  lastLogin: Date,
  avatar: schema({
    fileName: isString,
    data: setDefault(isString, 'base64:str;'),
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
    data: setDefault(isString, 'base64:str;'),
    url: isOptionalString,
  }, { nullable: true }),
  avatar3: schema({
    fileName: isString,
    data: setDefault(isString, 'base64:str;'),
    url: isOptionalString,
  }, { optional: true, nullable: true, init: false }),
  avatar4: schema({
    fileName: isString,
    data: setDefault(isString, 'base64:str;'),
    url: isOptionalString,
  }, { optional: true, nullable: true, init: null }),
  avatar5: schema({
    fileName: isString,
    data: setDefault(isString, 'base64:str;'),
    url: isOptionalString,
  }, { optional: true, init: false }),
  avatar6: schema({
    fileName: isString,
    data: setDefault(isString, 'base64:str;'),
    url: isOptionalString,
  }, { nullish: true, init: false }),
  avatar7: schema({
    fileName: isString,
    data: isString,
    url: setDefault(isOptionalString, 'base64:str;'),
    // jpg: [ false, isBoolean ],
    // foo: isString
  }, { nullish: true, init: null }),
  avatar8: schema({
    fileName: isString,
    data: isString,
    url: setDefault(isOptionalString, 'base64:str;'),
    // foo: isString
  }, { nullish: true }),
  avatar9: schema({
    fileName: isString,
    data: isString,
    // url: foo,
    url: transform(String, isOptionalString),
    // url: setDefault(isOptionalString, ''),
    // url: isString,
    // status: ,
    foo: isString
  }, { nullish: true }),
  // avatar8: {
  //   fileName: '',
  //   data: '',
  //   url: '',
  //   foo: isString
  // },
  adminStatus: AdminStatus,
  adminStatusAlt: AdminStatusAlt,
});

const blah = schema<IAvatar>({
  fileName: isString,
  data: isString,
  url: isString,
}) 


import { z } from 'zod';

export interface IUserAlt {
  // id: number; // pk
  // name: string;
  // age: number;
  avatar?: IAvatar | null;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
// const Userx: z.ZodType<IUserAlt> = z.object({
//   // id: z.number().min(-1).default(-1),
//   // name: z.string().default(''),
//   // age: z.preprocess(Number, z.number()),
//   avatar: z.object<>({ 
//     fileName: z.string(),
//     data: z.string(),
//     // country: z.string().optional(),
//     foo: z.string(),
//   }).optional(),
// });



// **** Export default **** //

export default {
  AdminStatus,
  AdminStatusAlt,
  ...User,
};
