// **** Types **** //

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TFunc = (...args: any[]) => any;
export type TRecord = Record<string, unknown>;

export type TEnum<T> = (
  T extends number
  ? Record<string, T | string>
  : T extends string 
  ? Record<string, T>
  : never
);


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
 * Is a valid boolean
 */
export function isBool(param: unknown): param is boolean {
  return typeof param === 'boolean';
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
 * Check if non-array object.
 */
export function isRecord(arg: unknown): arg is TRecord {
  return isObj(arg) && !Object.keys(arg).some(key => !isStr(key));
}

/**
 * Not necessarily a Date object but makes sure it is a valid date.
 */
export function isDate(val: unknown): val is Date {
  return (val instanceof Date) && !isNaN(new Date(val).getTime());
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


// **** Enum Stuff **** //

/**
 * Get the keys of an enum object. NOTE: this does not work for mixed 
 * enums see: eslint@typescript-eslint/no-mixed-enums
 */
export function getEnumVals<T>(arg: T): (keyof T)[] {
  // Check is enum
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
  return vals as (keyof T)[];
}

/**
 * Check if unknown is a valid enum object. NOTE: this does not work for mixed 
 * enums see: eslint@typescript-eslint/no-mixed-enums
 */
export function isEnum(arg: unknown): arg is TEnum<string | number> {
  // Check is non-array object
  if (!isObj(arg) || Array.isArray(arg)) {
    return false;
  }
  // Check if string or number enum
  const param = (arg as TRecord),
    keys = Object.keys(param),
    middle = Math.floor(keys.length / 2);
  // ** String Enum ** //
  if (!isNum(param[keys[middle]])) {
    const entries = Object.entries(arg);
    for (const entry of entries) {
      if (!(isStr(entry[0]) && isStr(entry[1]))) {
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
