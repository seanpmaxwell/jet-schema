/* eslint-disable no-console */

import {
  isNumber,
  isOptionalBoolean,
  isOptionalString,
  isString,
} from 'jet-validators';

import schema, { IErrorItem, TValidatorObj } from '../../src';
import { RelationalKey, NumberArray } from '../validators';


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

const Base64StrVldr: TValidatorObj<string> = {
  vldr: isString,
  default: 'base64:str;',
} as const;

const EmailVldr: TValidatorObj<TEmail> = {
  vldr(arg): arg is TEmail {
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
  pastIds: number[];
  single?: boolean;
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
  email: EmailVldr,
  age: { vldr: isNumber, transform: Number, default: 0 },
  created: Date,
  lastLogin: Date,
  phone: isOptionalString,
  avatar: schema({
    fileName: String,
    data: Base64StrVldr,
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
    data: Base64StrVldr,
    url: isOptionalString,
  }, { nullable: true }),
  avatar3: schema({
    fileName: String,
    data: Base64StrVldr,
    url: isOptionalString,
  }, { optional: true, nullable: true, init: false }),
  avatar4: schema({
    fileName: String,
    data: Base64StrVldr,
    url: isOptionalString,
  }, { optional: true, nullable: true, init: null }),
  avatar5: schema({
    fileName: String,
    data: Base64StrVldr,
    url: isOptionalString,
  }, { optional: true, init: false }),
  avatar6: schema({
    fileName: String,
    data: Base64StrVldr,
    url: isOptionalString,
  }, { nullish: true, init: false }),
  avatar7: schema({
    fileName: String,
    data: String,
    url: Base64StrVldr,
  }, { nullish: true, init: null }),
  avatar8: schema({
    fileName: String,
    data: String,
    url: isOptionalString,
    // foo: isString
  }, { nullish: true }),
  adminStatus: { enum: AdminStatus },
  adminStatusAlt: { enum: AdminStatusAlt },
  pastIds: NumberArray,
  single: {
    vldr: isOptionalBoolean,
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
