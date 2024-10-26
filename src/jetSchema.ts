import { getEnumVals, isArr, isDate, isFn, isObj, isUndef, TFunc, TValidatorFn } from './util';


// **** Fancy Composite Types **** //

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

// If a mapped type property can be undefined, make it optional
type MakeOptIfUndef<T> = ({
  [K in keyof T as undefined extends T[K] ? K : never]?: T[K]
}) & {
  [K in keyof T as undefined extends T[K] ? never : K]: T[K]
};


// **** Utility types **** //

type NotUndef<T> = Exclude<T, undefined>;
type TModel = Record<string | number | symbol, unknown>;
type AddNullablesHelper<T, isN> = isN extends true ? NonNullable<T> | null : NonNullable<T>;
type AddNullables<T, isU, isN> = (isU extends true ? AddNullablesHelper<NotUndef<T>, isN> | undefined : AddNullablesHelper<NotUndef<T>, isN>);
type TEnum = Record<string, string | number>;
type TDefaultVals = Record<string | number | symbol, TFunc>;
type TValidators = Record<string | number | symbol, TValidatorFn<unknown>>;
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
type TPickRetVal<T, NT = NonNullable<T>> = {
  test: (arg: unknown) => arg is T,
  default: () => T,
} & (IsStaticObj<T> extends true ? {
  pick: <K extends keyof NT>(prop: K) => (undefined extends NT[K] ? TPickRetVal<NT[K]> | undefined : TPickRetVal<NT[K]>);
  new: (arg?: Partial<T>) => NonNullable<T>;
} : {});

// Value returned by the "schema" function
export interface ISchema<T, NT = NonNullable<T>> {
  new: (arg?: Partial<T>) => NonNullable<T>;
  test: (arg: unknown) => arg is T;
  pick: <K extends keyof NT>(prop: K) => (undefined extends NT[K] ? TPickRetVal<NT[K]> | undefined : TPickRetVal<NT[K]>);
  _schemaSettings: {
    isOptional: boolean;
    isNullable: boolean;
    defaultVal: boolean | null;
  };
}

type TRefine<T> = (arg: unknown) => arg is T;
type TTypeArr<Type> = ([Type, TRefine<Type>] | TRefine<Type>);

// Main argument passed to the schema functions
export type TSchemaFnObjArg<T> = {
  [K in keyof T]:
  T[K] extends (string | number)
  ? (TTypeArr<T[K]> | TEnum)
  : T[K] extends Date 
  ? (DateConstructor | TTypeArr<T[K]>)
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
    isOptional: false,
    isNullable?: true,
    defaultVal?: true | null,
  // Not undefined and not null
  ] : [
    isOptional?: false,
    isNullable?: false,
    defaultVal?: true,
  ]));


// **** Infer Types **** //

export type PublicInferType<S> = (
  S extends ISchema<unknown> 
  ? GetTypePredicate<S['test']> 
  : never
);

type InferTypes<U, isOpt, isNul> =
  AddNullables<
    MakeOptIfUndef<InferTypesHelper<U>>,
    isOpt,
    isNul
  >;

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
    ? (TTypeArr<U[K]> | TEnum)
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
  return <T,
    U extends TSchemaFnObjArg<T> = TSchemaFnObjArg<T>,
    R extends TSchemaFnArgs<T> = TSchemaFnArgs<T>,
  >(schemaFnObjArg: U, ...rest: R) => {
    // Setup
    const [ isOptional = false, isNullable = false, defaultVal = true ] = rest,
      ret = _setupDefaultsAndValidators(schemaFnObjArg, cloneFn, defaultValsMap),
      newFn = _setupNewFn(ret.defaults, ret.validators, cloneFn),
      testFn = _setupTestFn(ret.validators, isOptional, isNullable);
    // "defaultVal"
    if (!isOptional && !isNullable && !defaultVal) {
      throw new Error('Default value must be the full schema-object if type is neither optional or nullable');
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
      } else if (dflt === null) {
        defaults[key] = () => null;
      }
      childSchemaNewFns[key] = () => childSchema.new();
      validators[key] = childSchema.test;
    // Enum
    } else if (isObj(setupVal)) {
      const vals = getEnumVals(setupVal);
      defaults[key] = () => cloneFn(vals[0]);
      validators[key] = (arg: unknown): arg is T[keyof T] => vals.some(item => item === arg);
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
    // Safe guard
    if (isUndef(defaults[key])) {
      defaults[key] = () => undefined;
    }
    // Make sure the default is a valid value
    const vldr = validators[key],
      dfltVal = defaults[key]?.();
    if (!vldr(dfltVal)) {
      throw new Error(`Default value for key "${key}" was missing or invalid`);
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
      let val = partial[key];
      if (testFn(val, ((transVal) => val = transVal))) {
        retVal[key] = cloneFn(val);
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
      const testFn = validators[key];
      let val = (arg as TModel)[key];
      if (!testFn(val, ((transVal) => val = transVal))) {
        throw new Error(`Property "${key}" was missing or invalid.`);
      }
      (arg as TModel)[key] = val;
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
