import { getEnumVals, isArr, isDate, isFn, isObj, isUndef, TFunc } from './util';


// **** Shared Types **** //

// Check if an object is a "named" static object
// This roots out Record<string,...> and makes sure we use a named type
type _TStaticObj<Prop> = string extends keyof Prop ? never : {
  [key: string]: string | number | boolean | _TStaticObj<Prop>;
};
type _TConvertInterfaceToType<Prop> = {
  [K in keyof Prop]: Prop[K];
};
type IsStaticObj<P, Prop = NonNullable<P>> = (
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
// type Flatten<T> = (T extends unknown[] ? T[number] : NonNullable<T>);
type TModel = Record<string | number | symbol, unknown>;
type CheckNull<T> = null extends T ? NonNullable<T> | null : NonNullable<T>;
type CheckNullables<T> = (undefined extends T ? CheckNull<NotUndef<T>> | undefined : CheckNull<NotUndef<T>>);
type CheckNullAlt<T, isN> = isN extends true ? NonNullable<T> | null : NonNullable<T>;
type CheckNullablesAlt<T, isU, isN> = (isU extends true ? CheckNullAlt<NotUndef<T>, isN> | undefined : CheckNullAlt<NotUndef<T>, isN>);
type TRefine<T> = (arg: unknown) => arg is CheckNullables<T>;
type TEnum = Record<string, string | number>;
type TDefaultVals = Record<string | number | symbol, TFunc>;
type TValidators = Record<string | number | symbol, TVldrFn>;
type GetTypePredicate<T> = T extends (x: any) => x is infer U ? U : never;


// **** Schema Types **** //

// Set the Default values arrays
type TDefaultValsMap<T> = {
  [K in keyof T]: {
    0: ((arg: unknown) => arg is unknown),
    1: 0 extends keyof T[K] ? GetTypePredicate<T[K][0]> : never,
  }
}

// Return value for the pick function
type TPickRetVal<T> = {
  test: (arg: unknown) => arg is T,
  default: () => T,
} & (IsStaticObj<T> extends true ? {
  pick: <K extends keyof NonNullable<T>>(key: K) => TPickRetVal<NonNullable<T>[K]>,
  new: (arg?: Partial<T>) => NonNullable<T>;
} : {});

// Value returned by the "schema" function
interface ISchema<T> {
  new: (arg?: Partial<T>) => NonNullable<T>;
  test: (arg: unknown) => arg is T;
  pick: <K extends keyof T>(prop: K) => (null extends T[K] ? Partial<TPickRetVal<T[K]>> : undefined extends T[K] ? Partial<TPickRetVal<T[K]>> : never);
  _schemaSettings: {
    isOptional: boolean;
    isNullable: boolean;
    defaultVal: boolean | null;
  };
}

type TTypeArr<Type> = ([Type, TRefine<Type>] | TRefine<Type>);

// Main argument passed to the schema functions
export type TSchemaFnObjArg<T> = {
  [K in keyof T]:
  T[K] extends (string | number)
  ? (TTypeArr<T[K]> | TEnum)
  : T[K] extends Date 
  ? (DateConstructor | [(string | number | Date | null), TRefine<T[K]>] | TRefine<T[K]>)
  : IsStaticObj<T[K]> extends true
  ? ISchema<T[K]>
  : TTypeArr<T[K]>;
};

// Need to restrict parameters based on if "T" is null or undefined.
type TSchemaFnArgs<T> = 
  // If T is unknown (inferring types)
  unknown extends T ? [
    isOptional?: boolean,
    isNullable?: boolean,
    defaultVal?: boolean | null,
  ] : 
  // Undefined and null
  (undefined extends T ? (null extends T ? [
    isOptional: true,
    isNullable: true,
    defaultVal?: boolean | null,
  // Undefined not null
  ] : [
    isOptional: true,
    isNullable?: false,
    defaultVal?: boolean,
  // Not undefined and null
  ]) : (null extends T ? [
    isOptional: true,
    isNullable?: false,
    defaultVal?: true | null,
  // Not undefined and not null
  ] : [
    isOptional?: false,
    isNullable?: false,
    defaultVal?: true,
  ]));

// The function that creates schemas "schema()"
// type TSchemaFn = <T, U extends TSchemaFnObjArg<T> = TSchemaFnObjArg<T>>(_: U, ...__: TSchemaFnArgs<T>) => ISchema<T>;


// **** Infer Types **** //

export type PublicInferType<S> = S extends ISchema<unknown> ? GetTypePredicate<S['test']> : never;

type InferTypes<U extends TSchemaFnObjArg<unknown>, isOpt, isNul> = CheckNullablesAlt<InferTypesHelper<U>, isOpt, isNul>;

type InferTypesHelper<U> = {
  [K in keyof U]: (
    U[K] extends unknown[]
      ? U[K][0]
      : U[K] extends DateConstructor
      ? Date
      : U[K] extends TFunc 
      ? GetTypePredicate<U[K]>
      : U[K] extends ISchema<unknown>
      ? GetTypePredicate<U[K]['test']>
      : U[K] extends (string | number) 
      ? U[K]
      : never
    );
}
 

// **** Functions **** //

/**
 * Core jetSchema functions
 */
function jetSchema<M extends TDefaultValsMap<M>>(
  defaultValuesArr?: M extends [TFunc, unknown][] ? M : never,
  cloneFnArg?: TFunc,
) {

  // Setup default values map
  const defaultValsMap = new Map(defaultValuesArr);
  // Setup clone functions
  let cloneFn;
  if (!!cloneFnArg) {
    cloneFn = cloneFnArg;
  } else {
    cloneFn = (arg: unknown) => _clone(arg);
  }

  // Return the "schema" function
  return <T, U extends TSchemaFnObjArg<T> = TSchemaFnObjArg<T>, R extends TSchemaFnArgs<T> = TSchemaFnArgs<T>>(
    schemaFnObjArg: U,
    ...rest: R
  ) => {
    // Setup
    const [ isOptional = false, isNullable = false, defaultVal = true ] = rest,
      ret = _setupDefaultsAndValidators(schemaFnObjArg, cloneFn, defaultValsMap),
      newFn = _setupNewFn(ret.defaults, ret.validators, cloneFn),
      testFn = _setupTestFn(ret.validators, isOptional, isNullable);
    // "instantiateWithParent"
    if (!isOptional && !isNullable && !defaultVal) {
      throw new Error('Must insantiate with parent if schema is neither optional or nullable');
    }
    // Return
    return {
      new: newFn,
      test: testFn,
      pick: <K extends keyof T>(p: K) => {
        const prop = schemaFnObjArg[p];
        if (!!prop) {
          return {
            default: ret.defaults[p],
            test: ret.validators[p],
            ...(_isSchemaObj(prop) ? {
              pick: prop.pick,
              new: ret.childSchemaNewFns[p],
            } : {}),
          };
        }
      },
      _schemaSettings: {
        isOptional,
        isNullable,
        defaultVal,
      },
    } as ISchema<unknown extends T ? InferTypes<U, R[0], R[1]> : T>;
  }
}

/**
 * Setup the new() function
 */
function _setupDefaultsAndValidators<T>(
  setupObj: TSchemaFnObjArg<T>,
  cloneFn: TFunc,
  defaultValsMap: Map<TFunc, unknown>,
): {
  childSchemaNewFns: TDefaultVals
  defaults: TDefaultVals,
  validators: TValidators,
} {
  const defaults: TDefaultVals = {},
    childSchemaNewFns: TDefaultVals = {},
    validators: TValidators = {};
  for (const key in setupObj) {
    const setupVal = setupObj[key];
    // Date
    if (setupVal === Date) {
      defaults[key] = () => new Date();
      validators[key] = isDate;
    // An array
    } else if (isArr(setupVal)) {
      defaults[key] = () => cloneFn(setupVal[0]);
      validators[key] = setupVal[1];
    // Schema
    } else if (_isSchemaObj(setupVal)) {
      const childSchema = setupVal,
        dflt = childSchema._schemaSettings.defaultVal;
      if (dflt === true) {
        defaults[key] = () => childSchema.new();
      } else {
        defaults[key] = () => dflt;
      }
      childSchemaNewFns[key] = () => childSchema.new();
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
    // Make sure the default is a valid value
    if (validators[key](defaults[key])) {
      throw new Error('Default value was missing or invalid');
    }
  }
  // Return
  return {
    childSchemaNewFns,
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
