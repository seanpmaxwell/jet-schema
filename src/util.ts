// **** Types **** //

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TFunc = (...args: any[]) => any;
export type TBasicObj = Record<string, unknown>;
export type TEnum = Record<string, string | number>;

export interface IValidatorFn<T> {
  (arg: unknown, cb?: ((transformedVal: T) => void)): arg is T;
  defaultVal?: T;
  origVldtr?: IValidatorFn<T>;
}


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
  if (!isNonArrObj(arg)) {
    throw Error('"getEnumKeys" must receive a non-array object');
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
 * Check if unknown is a valid enum object.
 */
export function isEnum(arg: unknown): arg is TEnum {
  // Check is non-array object
  if (!(isObj(arg) && !Array.isArray(arg))) {
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
export const isDate = transform((arg: string | number | Date) => {
  return new Date(arg);
}, isValidDate);

/**
 * HACK: isn't necessarily a date object but says its one if it is a valid 
 * date.
 */
export function isValidDate(val: unknown): val is Date {
  return (
    (isStr(val) || isNum(val) || (val instanceof Date)) && 
    !isNaN(new Date(val).getTime())
  );
}

/**
 * Transform a value before checking it.
 */
export function transform<T>(
  transFn: TFunc,
  vldt: ((arg: unknown) => arg is T),
): IValidatorFn<T> {
  return (arg: unknown, cb?: (arg: T) => void): arg is T => {
    if (arg !== undefined) {
      arg = transFn(arg);
    }
    cb?.(arg as T);
    return vldt(arg);
  };
}

/**
 * Add a default value to a function.
 */
export function setDefault<T>(
  vldtr: IValidatorFn<T>,
  defaultVal: T,
): IValidatorFn<T> {
  const clone = (arg: unknown): arg is T => false;
  clone.defaultVal = defaultVal;
  clone.origVldtr = vldtr;
  return clone;
}
