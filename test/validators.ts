import { isNumber, isString } from 'jet-validators';
import { IErrorItem, TValidatorObj } from '../src';


/******************************************************************************
                                Functions
******************************************************************************/

/**
 * Is the item a relational key. 'undefined' not allowd so we need to set a 
 * default value.
 */
export const VRelationalKey: TValidatorObj<number> = {
  vldr: (arg: unknown): arg is number => isNumber(arg) && arg >= -1,
  default: -1,
} as const;

/**
 * Accept a "number[]" or a stringified "number[]"". 
 */
export const VNumberArray: TValidatorObj<number[]> = {
  vldr(val: unknown): val is number[] {
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
