import { getEnumVals, isArr, isDate, isFn, isObj, isUndef, TFunc } from './util';


// **** Types **** //

// Check if an object is a "named" static object
// This roots out Record<string,...> and makes sure we use a named type
type _TStaticObj<Prop> = string extends keyof Prop ? never : {
  [key: string]: string | number | boolean | _TStaticObj<Prop>;
};
type _TConvertInterfaceToType<Prop> = {
  [K in keyof Prop]: Prop[K];
};
type IsStaticObj<Prop> = (
  _TConvertInterfaceToType<Prop> extends _TStaticObj<Prop> ? true : false
);

// Validator function type
interface TVldrFn {
  (arg: unknown): boolean;
  transformedFlag?: boolean;
  transformedVal?: unknown;
}

// Utility types
type NotUndef<T> = Exclude<T, undefined>;
type Flatten<T> = (T extends unknown[] ? T[number] : NonNullable<T>);
type TBaseType<T> = Flatten<NonNullable<T>>;
type TModel = Record<string | number | symbol, unknown>;
type CheckNull<T> = null extends T ? NonNullable<T> | null : NonNullable<T>;
type TRefine<T> = (arg: unknown) => arg is undefined extends T ? CheckNull<NotUndef<T>> | undefined : CheckNull<NotUndef<T>>;
type TEnum = Record<string, string | number>;
type TDefaultVals = Record<string | number | symbol, TFunc>;
type TValidators = Record<string | number | symbol, TVldrFn>;

// Return value for the pick function
type TPickRetVal<T> = ({
  test: (arg: unknown) => arg is NotUndef<T>,
  default: () => NotUndef<T>,
}) & (IsStaticObj<Flatten<T>> extends true ? null extends T ? {
  pick?: <K extends keyof NonNullable<T>>(key: K) => TPickRetVal<NonNullable<T>[K]>,
} : undefined extends T ? {
  pick?: <K extends keyof NotUndef<T>>(key: K) => TPickRetVal<NotUndef<T>[K]>,
} : {
  pick: <K extends keyof T>(key: K) => TPickRetVal<T[K]>,
} : object);

interface ISchema<T> {
  new: (arg?: Partial<T>) => T;
  test: (arg: unknown) => arg is T;
  pick: <K extends keyof T>(prop: K) => TPickRetVal<T[K]>;
  _schemaSettings: {
    isOptional: boolean;
    isNullable: boolean;
    instantiateWithParent: boolean;
  };
}

type TTypeArr<Type> = ([Type, TRefine<Type>] | TRefine<Type>);

export type TSchemaObj<T> = {
  [K in keyof T]:
  TBaseType<T[K]> extends boolean
  ? TTypeArr<T[K]>
  : TBaseType<T[K]> extends (string | number)
  ? (TTypeArr<T[K]> | TEnum)
  : TBaseType<T[K]> extends Date 
  ? DateConstructor | [(string | number | Date | null), TRefine<T[K]>] | TRefine<T[K]>
  : IsStaticObj<Flatten<T[K]>> extends true
  ? ISchema<T[K]>
  : TBaseType<T[K]> extends Record<string, unknown>
  ? [T[K], TRefine<T[K]>]
  : never;
};

// Need to restrict parameters based on if "T" is null or undefined.
type Args<T> =
  // Undefined and null
  (undefined extends T ? (null extends T ? [
    isOptional: true,
    isNullable: true,
    instantiateWithParent?: boolean,
  // Undefined not null
  ] : [
    isOptional: true,
    isNullable?: false,
    instantiateWithParent?: boolean,
  // Not undefined and null
  ]) : (null extends T ? [
    isOptional: true,
    isNullable?: false,
    instantiateWithParent?: boolean,
  // Not undefined and not null
  ] : [
    isOptional?: false,
    isNullable?: false,
    instantiateWithParent?: true,
  ]));

type TGetSchemaFn = <T, U extends TSchemaObj<T> = TSchemaObj<T>>(_: U, ...__: Args<T>) => ISchema<T>;

// Set the Default values arrays
type GetTypePredicate<T> = T extends (x: any) => x is infer U ? U : never;
type TDefaultValArrItem<T> = {
  [K in keyof T]: {
    0: ((arg: unknown) => arg is unknown),
    1: 0 extends keyof T[K] ? GetTypePredicate<T[K][0]> : never,
  }
}


// **** Functions **** //

/**
 * Core jetSchema functions
 */
function jetSchema<T extends TDefaultValArrItem<T>>(
  defaultValuesArr?: T extends [TFunc, unknown][] ? T : never,
  cloneFnArg?: TFunc,
): TGetSchemaFn {

  // Setup default values map
  const defaultValsMap = new Map(defaultValuesArr);
  // Setup clone functions
  let cloneFn;
  if (!!cloneFnArg) {
    cloneFn = cloneFnArg;
  } else {
    cloneFn = (arg: unknown) => _clone(arg);
  }
  // Setup the schema function. If T required then "intantiateWithParent"
  // cannot be false, required must be instantiated with the parent.
  return <T, U extends TSchemaObj<T> = TSchemaObj<T>>(
    schemaObj: U,
    ...rest: Args<T>
  ): ISchema<T> => {
    // Setup
    const [ isOptional = false, isNullable = false, instantiateWithParent ] = rest,
      ret = _setupDefaultsAndValidators(schemaObj, cloneFn, defaultValsMap),
      newFn = _setupNewFn(ret.defaults, ret.validators, cloneFn),
      testFn = _setupTestFn(ret.validators, isOptional, isNullable);
    // "instantiateWithParent"
    let instantiateWithParentf = !!instantiateWithParent;
    if (isUndef(instantiateWithParent)) {
      instantiateWithParentf = true;
    }
    if (!isOptional && !isNullable && !instantiateWithParentf) {
      throw new Error('Must insantiate with parent if schema is neither optional or nullable');
    }
    // Return
    return {
      new: newFn,
      test: testFn,
      pick: <K extends keyof T>(p: K) => {
        const prop = schemaObj[p];
        return {
          default: (
            _isSchemaObj(prop) 
              ? ret.schemaDefaults[p] 
              : ret.defaults[p]
          ),
          test: ret.validators[p],
          ...(_isSchemaObj(prop) ? {
            pick: prop.pick,
          } : {}),
        };
      },
      _schemaSettings: {
        isOptional,
        isNullable,
        instantiateWithParent: instantiateWithParentf,
      },
    } as ISchema<T>;
  }
}

/**
 * Setup the new() function
 */
function _setupDefaultsAndValidators<T>(
  setupObj: TSchemaObj<T>,
  cloneFn: TFunc,
  defaultValsMap: Map<TFunc, unknown>,
): {
  schemaDefaults: TDefaultVals
  defaults: TDefaultVals,
  validators: TValidators,
} {
  const defaults: TDefaultVals = {},
    schemaDefaults: TDefaultVals = {},
    validators: TValidators = {};
  for (const key in setupObj) {
    const setupVal = setupObj[key];
    // Date
    if (setupVal === Date) {
      defaults[key] = () => new Date();
      validators[key] = (arg: unknown) => isDate(arg);
    // An array
    } else if (isArr(setupVal)) {
      defaults[key] = () => cloneFn(setupVal[0]);
      validators[key] = setupVal[1];
    // Schema
    } else if (_isSchemaObj(setupVal)) {
      const childSchema = setupVal;
      if (childSchema._schemaSettings.instantiateWithParent) {
        defaults[key] = () => childSchema.new();
      }
      schemaDefaults[key] = () => childSchema.new();
      validators[key] = childSchema.test;
    // Enum
    } else if (isObj(setupVal)) {
      const vals = getEnumVals(setupVal);
      defaults[key] = () => cloneFn(vals[0]);
      validators[key] = (arg: unknown) => vals.some(item => item === arg);
    // Just a validator function
    } else if (isFn(setupVal)) {
      validators[key] = setupVal;
      // If it's a required field, get the defaults from the function
      if (isUndef(defaults[key])) {
        const dflt = defaultValsMap.get(setupVal);
        if (!isUndef(dflt)) {
          defaults[key] = () => dflt;
        }
      }
    // If something is nullable and you wanna let its default value be null
    } else if (setupVal === null) {
      defaults[key] = () => null;
    }
  }
  // Return
  return {
    schemaDefaults,
    defaults,
    validators,
  };
}

/**
 * See if value is a schema object.
 */
function _isSchemaObj(arg: unknown): arg is ISchema<unknown> {
  return (isObj(arg) && '_schemaSettings' in arg);
}

/**
 * Setup the new() function
 */
function _setupNewFn(
  defaultVals: TDefaultVals,
  validators: TValidators,
  cloneFn: TFunc,
): (partial?: Partial<TModel>) => TModel {
  return (partial: Partial<TModel> = {}) => {
    // Get default values
    const retVal: TModel = {};
    for (const dflt in defaultVals) {
      retVal[dflt] = defaultVals[dflt]();
    }
    // Get values from partial
    for (const key in partial) {
      const testFn = validators[key];
      if (testFn(partial[key])) {
        if (testFn.transformedFlag) {
          retVal[key] = testFn.transformedVal;
        } else {
          retVal[key] = cloneFn(partial[key]);
        }
      } else {
        throw new Error(`Property "${key}" was invalid.`);
      }
    }
    // Return
    return retVal;
  };
}

/**
 * Setup the new() function
 */
function _setupTestFn(
  validators: TValidators,
  isOptional: boolean,
  isNullable: boolean,
): (arg: unknown) => arg is TModel {
  return (arg: unknown): arg is TModel => {
    // Check null/undefined;
    if (isUndef(arg) && isOptional) {
      return true;
    } else if (arg === null && isNullable) {
      return true;
    }
    // Must be an object
    if (!isObj(arg)) {
      throw new Error('test() failed: Parameter was not an object');
    }
    for (const key in validators) {
      const testFn = validators[key],
        val = (arg as TModel)[key];
      if (!testFn(val)) {
        throw new Error(`Property "${key}" was missing or invalid.`);
      }
      if (testFn.transformedFlag) {
        (arg as TModel)[key] = testFn.transformedVal;
      }
    }
    return true;
  };
}

/**
 * Clone Function
 */
export function _clone<T>(arg: T): T {
  if (arg instanceof Date) {
    return new Date(arg) as T;
  } else if (isObj(arg)) {
    return structuredClone(arg);
  } else {
    return arg;
  }
}


// **** Export default **** //

export default jetSchema;
