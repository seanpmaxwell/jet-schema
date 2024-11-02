/* eslint-disable max-len */
// **** Functions **** //

/**
 * Check if a param is undefined.
 */
export function isUndefined(param: unknown): param is undefined {
  return param === undefined;
}

/**
 * Is a number
 */
export function isNumber(param: unknown): param is number {
  return typeof param === 'number';
}

/**
 * Is a valid number in string form.
 */
export function isNumberString(param: unknown): param is string {
  return typeof param === 'string' && !isNaN(Number(param));
}

/**
 * Is a number array.
 */
export function isNumberArray(val: unknown): val is number[] {
  return Array.isArray(val) && !val.some(item => typeof item !== 'number');
}

/**
 * Is a valid string
 */
export function isString(param: unknown): param is string {
  return typeof param === 'string';
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
export function isBoolean(param: unknown): param is boolean {
  return typeof param === 'boolean';
}

/**
 * Is a valid boolean
 */
export function isOptionalBoolean(param: unknown): param is boolean | undefined {
  return typeof param === 'boolean' || param === undefined;
}

/**
 * Is the item a relational key.
 */
export function isRelationalKey(arg: unknown): arg is number {
  return isNumber(arg) && arg >= -1; 
}

/**
 * Is param a valid color.
 */
export function isEmail(val: unknown): val is string {
  return (
    isString(val) && 
    (val.length) < 254 &&
    (val === '' || val.includes('@'))
  );
}

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
