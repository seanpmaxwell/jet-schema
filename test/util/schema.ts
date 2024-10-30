/* eslint-disable n/no-process-env */
/* eslint-disable no-console */

import jetLogger from '../../src';
import { isBoolean, isNumber, isRelationalKey, isString } from './validators';


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
 * Overwrite error handling
 */
const customError = (property: string, value: unknown) => {
  if (process.env.NODE_ENV !== 'test') {
    console.error(`Validation for "${property}" failed. Value tested:`, value);
  }
};


// **** Export default **** //

export default jetLogger({
  defaultValuesMap: [
    [isBoolean, false],
    [isNumber, 0],
    [isString, ''],
    [isRelationalKey, -1],
  ],
  cloneFn: customClone,
  onError: customError,
});
