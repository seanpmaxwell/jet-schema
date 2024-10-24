// **** Variables **** //

const EMAIL_RGX = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9-]*\.)+[A-Z]{2,}$/i;


// **** Functions **** //

/**
 * Check if a param is undefined.
 */
export function isUndef(param: unknown): param is undefined {
  return param === undefined;
}

/**
 * Is a number
 */
export function isNum(param: unknown): param is number {
  return typeof param === 'number';
}

/**
 * Is a valid number in string form.
 */
export function isNumStr(param: unknown): param is string {
  return typeof param === 'string' && !isNaN(Number(param));
}

/**
 * Is a number array.
 */
export function isNumArr(val: unknown): val is number[] {
  return Array.isArray(val) && !val.some(item => typeof item !== 'number');
}

/**
 * Is a valid string
 */
export function isStr(param: unknown): param is string {
  return typeof param === 'string';
}

/**
 * Is a valid string
 */
export function optIsStr(param: unknown): param is string | undefined {
  return isUndef(param) || typeof param === 'string';
}

/**
 * Is a valid boolean
 */
export function isBool(param: unknown): param is boolean {
  return typeof param === 'boolean';
}

/**
 * Is the item a relational key.
 */
export function isRelKey(arg: unknown): arg is number {
  return isNum(arg) && arg >= -1; 
}

/**
 * Is param a valid color.
 */
export function isEmail(val: unknown): val is string {
  return isStr(val) && EMAIL_RGX.test(val);
}
