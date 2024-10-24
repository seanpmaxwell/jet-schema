// **** Types **** //

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TFunc = (...args: any[]) => any;

export interface ITransformAndTest<T> {
  (arg: unknown): arg is T;
  transformedFlag?: boolean;
  transformedVal?: T;
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
 * Is the value an array
 */
export function isArr(arg: unknown): arg is unknown[] {
  return Array.isArray(arg);
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
export function getEnumKeys(arg: unknown): string[] {
  if (isNonArrObj(arg)) {
    const retVal: string[] = [];
    for (const key of Object.keys(arg)) {
      if (!retVal.includes(key)) {
        retVal.push(key);
      }
    }
    return retVal;
  }
  throw Error('"getEnumKeys" be an non-array object');
}

/**
 * Get the values of an enum object.
 */
export function getEnumVals(arg: unknown) {
  if (isNonArrObj(arg)) {
    const keys = getEnumKeys(arg);
    return keys.map(key => arg[key]);
  }
  throw Error('"getEnumVals" be an non-array object');
}

/**
 * Is arg a function
 */
export function isFn(arg: unknown): arg is TFunc {
  return typeof arg === 'function';
}

/**
 * Not necessarily a Date object but makes sure it is a valid date.
 */
export const isDate = transform((arg: string | number | Date) => {
  return new Date(arg)
}, isValidDate);

/**
 * HACK: isn't necessarily a date object but says its one if it is a valid 
 * date.
 */
export function isValidDate(val: unknown): val is Date {
  return (
    (isStr(val) || isNum(val) || (val instanceof Date)) && 
    !isNaN(new Date(val as any).getTime())
  )
}

/**
 * Transform a value before checking it.
 */
export function transform<T>(
  transFn: TFunc,
  cb: ((arg: unknown) => arg is T),
): ITransformAndTest<T> {
  const transformAndVldt: ITransformAndTest<T> = (arg: unknown): arg is T => {
    if (arg !== undefined) {
      arg = transFn(arg);
    }
    transformAndVldt.transformedFlag = true;
    transformAndVldt.transformedVal = arg as T;
    return cb(arg);
  };
  return transformAndVldt;
}

