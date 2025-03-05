/* eslint-disable max-len */
// **** Functions **** //

import { IErrorItem, IValidatorObj } from '../src';


/******************************************************************************
                                 Types
******************************************************************************/

type TEmail = `${string}@${string}`  | '--';


/******************************************************************************
                                Functions
******************************************************************************/

/**
 * Check if a param is undefined.
 */
export function isUndefined(param: unknown): param is undefined {
  return param === undefined;
}

/**
 * Is a valid number in string form.
 */
export function isNumberString(param: unknown): param is string {
  return typeof param === 'string' && !isNaN(Number(param));
}

/**
 * Is a valid string
 */
export function isOptionalString(param: unknown): param is string | undefined {
  return isUndefined(param) || typeof param === 'string';
}

/**
 * Is a valid boolean
 */
export function isOptionalBoolean(param: unknown): param is boolean | undefined {
  return typeof param === 'boolean' || param === undefined;
}

/**
 * Is a number
 */
export function isNumber(param: unknown): param is number {
  return typeof param === 'number';
}

/**
 * Is a valid string
 */
export function isString(param: unknown): param is string {
  return typeof param === 'string';
}

/**
 * Is the item a relational key. 'undefined' not allowd so we need to set a 
 * default value.
 */
export const RelationalKey: IValidatorObj<number> = {
  vf: (arg: unknown): arg is number => isNumber(arg) && arg >= -1,
  default: -1,
} as const;

/**
 * base64 string data item.
 */
export const Base64Str: IValidatorObj<string> = {
  vf: isString,
  default: 'base64:str;',
} as const;

/**
 * Is a valid email address.
 */
export const Email: IValidatorObj<TEmail> = {
  vf(arg): arg is TEmail {
    return (
      isString(arg) && 
      (arg.length < 254) &&
      (arg === '--' || arg.includes('@'))
    );
  },
  default: '--',
} as const;

/**
 * Accept a "number[]" or a stringified "number[]"". 
 */
export const NumberArray: IValidatorObj<number[]> = {
  vf(val: unknown): val is number[] {
    return Array.isArray(val) && val.every(item => isNumber(item));
  },
  default: [],
  transform(arg: unknown) {
    if (isString(arg)) {
      return JSON.parse(arg) as number[];
    } else {
      return arg as number[];
    }
  },
  formatError(error: IErrorItem) {
    return `The property "${error.property}" was not a valid number array`;
  },
} as const;

/**
 * Allow param to be undefined
 */
export function nonNullable<T>(cb: ((arg: unknown) => arg is T)) {
  return (arg: unknown): arg is NonNullable<T> => {
    if (arg === null || arg === undefined) {
      return false;
    } else {
      return cb(arg);
    }
  };
}
