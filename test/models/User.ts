/* eslint-disable no-console */

import {
  isEnumVal,
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

enum AdminStatus2 {
  Basic2 = 'basic2',
  Mid2 = 'mid2',
  High2 = 'high2',
}

enum AdminStatusAlt {
  Basic,
  Mid,
  High,
}

enum AdminStatusAlt2 {
  Basic2,
  Mid2,
  High2,
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
  adminStatus2: AdminStatus2;
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
  age: { vldr: isNumber, default: 0 },
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
  // pick up here, validator object checks the correct enum but not "enum:" prop
  adminStatus2: { enum: AdminStatus2 },
  // adminStatus2: { vldr: isEnumVal(AdminStatus), default: AdminStatus2.Basic },
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
  AdminStatus2,
  AdminStatusAlt,
  ...User,
};
