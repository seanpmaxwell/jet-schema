/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable n/no-process-env */
/* eslint-disable no-console */

import jetLogger from '../../src';

import {
  isBoolean,
  isNumber,
  isNumberArray,
  isRelationalKey,
  isString,
} from './validators';


/**
 * Overwrite clone function
 */
const customClone = (arg: unknown): unknown => {
  if (arg instanceof Date) {
    return new Date(arg);
  } else if (typeof arg === 'object') {
    const val = JSON.stringify(arg);
    return JSON.parse(val);
  } else {
    return arg;
  }
};

/**
 * Print to console instead of throw error.
 */
const customError = (_: string, __: unknown, origMessage?: string) => {
  if (process.env.NODE_ENV !== 'test') {
    console.error(origMessage);
  }
};


// **** Export default **** //

export default jetLogger({
  globals: [
    { vf: isBoolean, default: false },
    { vf: isNumber, default: 0 },
    { vf: isString, default: '' },
    { vf: isRelationalKey, default: -1 },
    {
      vf: isNumberArray,
      default: [],
      transform: (arg: unknown) => {
        if (isString(arg)) {
          return JSON.parse(arg);
        } else {
          return arg;
        }
      },
      onError: (property: string, value: unknown, moreDetails?: string, schemaId?: string) => {
        const message = JSON.stringify({
          message: `Property "${property}" must be a number[] or a string equivalent. `,
          value: JSON.stringify(value),
          ['more-details']: moreDetails || '--',
          ['schema-id']: schemaId || '--',
        });
        console.error(message);
      },
    },
  ],
  cloneFn: customClone,
  onError: customError,
});
