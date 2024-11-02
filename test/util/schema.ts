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
    { fn: isBoolean, default: false },
    { fn: isNumber, default: 0 },
    { fn: isString, default: '' },
    { fn: isRelationalKey, default: -1 },
    { fn: isNumberArray, default: [], transform: JSON.parse },
  ],
  cloneFn: customClone,
  onError: customError,
});
