// **** Types **** //

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TFunc = (...args: any[]) => any;
export type TBasicObj = Record<string, unknown>;
export type TEnum = Record<string, string | number>;


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
 * Get the keys of an enum object.
 */
export function processEnum(arg: unknown): [ unknown, TFunc ] {
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
  return [
    vals[0],
    arg => vals.some(val => val === arg),
  ];
}

/**
 * Check if unknown is a valid enum object. NOTE: this does not work for mixed 
 * enums see: eslint@typescript-eslint/no-mixed-enums
 */
export function isEnum(arg: unknown): arg is TEnum {
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
    return checkObjEntries(arg, (key, val) => {
      return isStr(key) && isStr(val);
    });
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
 * Do a validator callback function for each object key/value pair.
 */
export function checkObjEntries(
  val: unknown,
  cb: (key: string, val: unknown) => boolean,
): val is NonNullable<object> {
  if (isObj(val)) {
    for (const entry of Object.entries(val)) {
      if (!cb(entry[0], entry[1])) {
        return false;
      }
    }
  }
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
export const isDate = (val: unknown): val is Date => {
  return (val instanceof Date) && !isNaN(new Date(val).getTime());
};

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
