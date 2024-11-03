/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
/* eslint-disable max-len */
import schema from '../util/schema';

import {
  isEmail,
  isNumber,
  isRelationalKey,
  isString,
  isOptionalString,
  isNumberArray,
  isOptionalBoolean,
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


// **** Setup **** //

const User = schema<IUser>({
  id: isRelationalKey,
  name: isString,
  email: { vf: isEmail, default: '' },
  age: { vf: isNumber, transform: Number, default: 0 },
  created: Date,
  lastLogin: Date,
  phone: isOptionalString,
  avatar: schema({
    fileName: isString,
    data: { vf: isString, default: 'base64:str;' },
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
    data: { vf: isString, default: 'base64:str;' },
    url: isOptionalString,
  }, { nullable: true }),
  avatar3: schema({
    fileName: isString,
    data: { vf: isString, default: 'base64:str;' },
    url: isOptionalString,
  }, { optional: true, nullable: true, init: false }),
  avatar4: schema({
    fileName: isString,
    data: { vf: isString, default: 'base64:str;' },
    url: isOptionalString,
  }, { optional: true, nullable: true, init: null }),
  avatar5: schema({
    fileName: isString,
    data: { vf: isString, default: 'base64:str;' },
    url: isOptionalString,
  }, { optional: true, init: false }),
  avatar6: schema({
    fileName: isString,
    data: { vf: isString, default: 'base64:str;' },
    url: isOptionalString,
  }, { nullish: true, init: false }),
  avatar7: schema({
    fileName: isString,
    data: isString,
    url: { vf: isOptionalString, default: 'base64:str;' },
  }, { nullish: true, init: null }),
  avatar8: schema({
    fileName: isString,
    data: isString,
    url: isOptionalString,
    // foo: isString
  }, { nullish: true }),
  adminStatus: AdminStatus,
  adminStatusAlt: AdminStatusAlt,
  pastIds: isNumberArray,
  single: {
    vf: isOptionalBoolean,
    onError: (_: string, value: unknown, moreDetails?: string, schemaId?: string) => {
      const message = JSON.stringify({
        message: 'Property "single" must be a boolean or undefined.',
        value: JSON.stringify(value),
        ['more-details']: moreDetails || '--',
        ['schema-id']: schemaId || '--',
      });
      console.error(message);
    },
  },
}, { id: 'User' });



// **** Export default **** //

export default {
  AdminStatus,
  AdminStatusAlt,
  ...User,
};
