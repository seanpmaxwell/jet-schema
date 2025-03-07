// **** Types **** //

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TFunc = (...args: any[]) => any;
export type TBasicObj = Record<string, unknown>;


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
 * Is a valid string
 */
export function isStr(param: unknown): param is string {
  return typeof param === 'string';
}

/**
 * Is an object exluding null
 */
export function isObj(val: unknown): val is NonNullable<object> {
  return !!val && typeof val === 'object';
}

/**
 * Check if non object array.
 */
export function isNonArrObj(
  arg: unknown,
): arg is Record<string, unknown> {
  return typeof arg === 'object' && !Array.isArray(arg);
}

/**
 * Get the values of an enum object.
 */
export function getEnumVals(arg: unknown): unknown[] {
  if (!isEnum(arg)) {
    throw Error('"getEnumKeys" must receive an enum object.');
  }
  // Get keys
  let vals = Object.keys(arg).reduce((arr: unknown[], key) => {
    if (!arr.includes(key)) {
      arr.push(arg[key]);
    }
    return arr;
  }, []);
  // Check if string or number enum
  if (isNum(arg[vals[0] as string])) {
    vals = vals.map(item => arg[item as string]);
  }
  // Return
  return vals;
}

/**
 * Check if unknown is a valid enum object. NOTE: this does not work for mixed 
 * enums see: eslint@typescript-eslint/no-mixed-enums
 */
export function isEnum(arg: unknown): arg is Record<string, string | number> {
  // Check is non-array object
  if (!isObj(arg) || Array.isArray(arg)) {
    return false;
  }
  // Check if string or number enum
  const param = (arg as TBasicObj),
    keys = Object.keys(param),
    middle = Math.floor(keys.length / 2);
  // ** String Enum ** //
  if (!isNum(param[keys[middle]])) {
    for (const key in param) {
      if (!isStr(key) || !isStr(param[key])) {
        return false;
      }
    }
    return true;
  }
  // ** Number Enum ** //
  // Enum key length will always be even
  if (keys.length % 2 !== 0) {
    return false;
  }
  // Check key/values
  for (let i = 0; i < middle; i++) {
    const thisKey = keys[i],
      thisVal = param[thisKey],
      thatKey = keys[i + middle],
      thatVal = param[thatKey];
    if (!(thisVal === thatKey && thisKey === String(thatVal))) {
      return false;
    }
  }
  // Return
  return true;
}

/**
 * Check if non-array object.
 */
export function isBasicObj(arg: unknown): arg is TBasicObj {
  return isObj(arg) && !Object.keys(arg).some(key => !isStr(key));
}

/**
 * Not necessarily a Date object but makes sure it is a valid date.
 */
export function isDate(val: unknown): val is Date {
  return (val instanceof Date) && !isNaN(new Date(val).getTime());
}

/**
 * Make sure is string
 */
export function isString(val: unknown): val is string  {
  return typeof val === 'string';
}

/**
 * Make sure is number
 */
export function isNumber(val: unknown): val is number  {
  return typeof val === 'number';
}

/**
 * Make sure is boolean
 */
export function isBoolean(val: unknown): val is boolean  {
  return typeof val === 'boolean';
}

/**
 * Clone Function
 */
export function defaultCloneFn(arg: unknown): unknown {
  if (arg instanceof Date) {
    return new Date(arg);
  } else if (isObj(arg)) {
    // eslint-disable-next-line n/no-unsupported-features/node-builtins
    return structuredClone(arg);
  } else {
    return arg;
  }
}
