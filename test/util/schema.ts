/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable n/no-process-env */
/* eslint-disable no-console */

import jetLogger, { IError, TErrArg } from '../../src';

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
      formatError: (error: IError) => {
        return `The property "${error.property}" was not a valid number array`;
      },
    },
  ],
  cloneFn: customClone,
  onError(errors: TErrArg) {
    if (process.env.NODE_ENV !== 'test') {
      console.error(JSON.stringify(errors));
    }
  },
});
