/* eslint-disable no-console */

import schema, { IErrorItem, IValidatorObj } from '../../src';

import {
  RelationalKey,
  isOptionalString,
  isOptionalBoolean,
  isNumber,
  NumberArray,
  isString,
} from '../validators';


/******************************************************************************
                                Variables
******************************************************************************/

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

const Base64Str: IValidatorObj<string> = {
  vf: isString,
  default: 'base64:str;',
} as const;

const Email: IValidatorObj<TEmail> = {
  vf(arg): arg is TEmail {
    return (
      isString(arg) && 
      (arg.length <= 254) && 
      (arg.length >= 3) && 
      arg.includes('@')
    );
  },
  default: '.@.',
} as const;


/******************************************************************************
                                    Types
******************************************************************************/

type TEmail = `${string}@${string}`;

export interface IUser {
  id: number; // pk
  name: string;
  age: number;
  email: string;
  phone?: string;
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
  pastIds: number[],
  single?: boolean,
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


/******************************************************************************
                                    Setup
******************************************************************************/

const User = schema<IUser>({
  id: RelationalKey,
  name: String,
  email: Email,
  age: { vf: isNumber, transform: Number, default: 0 },
  created: Date,
  lastLogin: Date,
  phone: isOptionalString,
  avatar: schema({
    fileName: String,
    data: Base64Str,
    url: isOptionalString,
  }, { optional: true, nullable: true }),
  address: schema({
    street: String,
    city: String,
    zip: Number,
    country: schema({
      name: String,
      code: Number,
    }),
  }),
  avatar2: schema({
    fileName: String,
    data: Base64Str,
    url: isOptionalString,
  }, { nullable: true }),
  avatar3: schema({
    fileName: String,
    data: Base64Str,
    url: isOptionalString,
  }, { optional: true, nullable: true, init: false }),
  avatar4: schema({
    fileName: String,
    data: Base64Str,
    url: isOptionalString,
  }, { optional: true, nullable: true, init: null }),
  avatar5: schema({
    fileName: String,
    data: Base64Str,
    url: isOptionalString,
  }, { optional: true, init: false }),
  avatar6: schema({
    fileName: String,
    data: Base64Str,
    url: isOptionalString,
  }, { nullish: true, init: false }),
  avatar7: schema({
    fileName: String,
    data: String,
    url: Base64Str,
  }, { nullish: true, init: null }),
  avatar8: schema({
    fileName: String,
    data: String,
    url: isOptionalString,
    // foo: isString
  }, { nullish: true }),
  adminStatus: AdminStatus,
  adminStatusAlt: AdminStatusAlt,
  pastIds: NumberArray,
  single: {
    vf: isOptionalBoolean,
    formatError(error: IErrorItem) {
      console.error(JSON.stringify(error));
      return error;
    },
  },
}, { id: 'User' });



// **** Export default **** //

export default {
  AdminStatus,
  AdminStatusAlt,
  ...User,
};
