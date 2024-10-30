/* eslint-disable n/no-unsupported-features/node-builtins */
/* eslint-disable max-len */

import {
  processEnum,
  isArr, 
  isDate,
  isFn,
  isObj,
  isUndef,
  TFunc,
  TValidatorFn,
} from './util';


// **** Fancy Composite Types **** //

// Check if an object is a "named" static object
// This roots out Record<string,...> and makes sure we use a named type
type TStaticObj<Prop> = string extends keyof Prop ? never : {
  [key: string]: string | number | boolean | TStaticObj<Prop>;
};
type TConvertInterfaceToType<Prop> = {
  [K in keyof Prop]: Prop[K];
};
type IsStaticObj<P, Prop = NonNullable<P>> = (
  TConvertInterfaceToType<Prop> extends TStaticObj<Prop> ? true : false
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
type GetTypePredicate<T> = T extends (x: unknown) => x is infer U ? U : never;
type TOnError = (property: string, value?: unknown) => void;


// **** Schema Types **** //

// Set the Default values arrays
type TDefaultValsMap<T> = {
  [K in keyof T]: {
    0: ((arg: unknown) => arg is unknown),
    1: 0 extends keyof T[K] ? GetTypePredicate<T[K][0]> : never,
  }
};

// Return value for the pick function
type TPickRetVal<T, NT = NonNullable<T>> = {
  test: (arg: unknown) => arg is T,
  default: () => T,
} & (IsStaticObj<T> extends true ? {
  pick: <K extends keyof NT>(prop: K) => (undefined extends NT[K] ? TPickRetVal<NT[K]> | undefined : TPickRetVal<NT[K]>);
  new: (arg?: Partial<T>) => NonNullable<T>;
} : unknown);

// Value returned by the "schema" function
export interface ISchema<T, NT = NonNullable<T>> {
  new: (arg?: Partial<T>) => NonNullable<T>;
  test: (arg: unknown) => arg is T;
  pick: <K extends keyof NT>(prop: K) => (undefined extends NT[K] ? TPickRetVal<NT[K]> | undefined : TPickRetVal<NT[K]>);
  _schemaOptions: {
    optional: boolean;
    nullable: boolean;
    init: boolean | null;
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
};
 
interface IJetOptions<M> {
  defaultValuesMap?: M extends [TFunc, unknown][] ? M : never,
  cloneFn?: (value: unknown) => unknown,
  onError?: TOnError,
}

export interface IOptNul {
  optional: true;
  nullable: true;
  init?: null | boolean;
}

export interface IOptNotNul {
  optional: true;
  nullable?: false;
  init?: boolean;
}

export interface INotOptButNul {
  optional?: false;
  nullable: true;
  init?: null | true;
}

export interface INotOptOrNul {
  optional?: false;
  nullable?: false;
  init?: true;
}

// Need to restrict parameters based on if "T" is null or undefined.
type TSchemaOptions<T> = (
  unknown extends T 
  ? (IOptNul | IOptNotNul | INotOptButNul | INotOptOrNul) 
  : (undefined extends T 
      ? (null extends T ? IOptNul : IOptNotNul) 
      : (null extends T ? INotOptButNul : INotOptOrNul)
    )
);


// **** Functions **** //

/**
 * Core jetSchema functions
 */
function jetSchema<M extends TDefaultValsMap<M>>(options?: IJetOptions<M>) {
  // Setup default values map
  const defaultValsMap = new Map(options?.defaultValuesMap),
    onErrorF = (options?.onError ? options.onError : _defaultOnErr),
    cloneFn = (options?.cloneFn ? options.cloneFn : _defaultClone);
  // Return the "schema" function
  return <T,
    U extends TSchemaFnObjArg<T> = TSchemaFnObjArg<T>,
    R extends TSchemaOptions<T> = TSchemaOptions<T>
  >(schemaFnObjArg: U, schemaOptions?: R) => {
    // Initialize options
    const optionsF = {
      optional: !!schemaOptions?.optional,
      nullable: !!schemaOptions?.nullable,
      init: (isUndef(schemaOptions?.init) ? true : schemaOptions?.init),
    };
    // "defaultVal"
    if (!optionsF.optional && !optionsF.nullable && !optionsF.init) {
      throw new Error('Default value must be the full schema-object if type is neither optional or nullable');
    }
    // Setup
    const ret = _setupDefaultsAndValidators(schemaFnObjArg, cloneFn, defaultValsMap, onErrorF),
      newFn = _setupNewFn(ret.defaults, ret.validators, cloneFn, onErrorF),
      testFn = _setupTestFn(ret.validators, optionsF.optional, optionsF.nullable, onErrorF);
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
      _schemaOptions: optionsF,
    } as ISchema<
      unknown extends T 
      ? InferTypes<U,
        'optional' extends keyof R ? R['optional'] : false,
        'nullable' extends keyof R ? R['nullable'] : false
        >
      : T>;
  };
}

/**
 * Setup the new() function
 */
function _setupDefaultsAndValidators<T>(
  setupObj: TSchemaFnObjArg<T>,
  cloneFn: typeof _defaultClone,
  defaultValsMap: Map<TFunc, unknown>,
  onError: TOnError,
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
        dflt = childSchema._schemaOptions.init;
      if (dflt === true) {
        defaults[key] = () => childSchema.new();
      } else if (dflt === null) {
        defaults[key] = () => null;
      }
      childSchemaNewFns[key] = () => childSchema.new();
      validators[key] = childSchema.test;
    // Enum
    } else if (isObj(setupVal)) {
      const [ dflt, vldr ] = processEnum(setupVal);
      defaults[key] = () => cloneFn(dflt);
      validators[key] = vldr as TValidatorFn<unknown>;
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
      dfltVal: unknown = defaults[key]?.();
    if (!vldr(dfltVal)) {
      onError(key, dfltVal);
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
  return (isObj(arg) && '_schemaOptions' in arg);
}

/**
 * Setup the new() function
 */
function _setupNewFn(
  defaultVals: TDefaultVals,
  validators: TValidators,
  cloneFn: TFunc,
  onError: TOnError,
): (partial?: Partial<TModel>) => TModel {
  return (partial: Partial<TModel> = {}) => {
    // Get default values
    const retVal: TModel = {};
    for (const dflt in defaultVals) {
      const val: unknown = defaultVals[dflt]();
      if (val !== undefined) {
        retVal[dflt] = val;
      }
    }
    // Get values from partial
    for (const key in partial) {
      const testFn = validators[key];
      let val = partial[key];
      if (testFn(val, ((transVal) => val = transVal))) {
        retVal[key] = cloneFn(val);
      } else {
        onError(key, val);
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
  onError: TOnError,
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
      onError('schema.test function', arg);
      return false;
    }
    for (const key in validators) {
      const testFn = validators[key];
      let val = (arg as TModel)[key];
      if (!testFn(val, ((transVal) => val = transVal))) {
        onError(key, val);
      }
      (arg as TModel)[key] = val;
    }
    return true;
  };
}

/**
 * Clone Function
 */
function _defaultClone(arg: unknown): unknown {
  if (arg instanceof Date) {
    return new Date(arg);
  } else if (isObj(arg)) {
    return structuredClone(arg);
  } else {
    return arg;
  }
}

/**
 * Default function to call when a validation fails.
 */
function _defaultOnErr(property: string) {
  throw new Error(`The item "${property}" failed to pass validation.`);
}


// **** Export default **** //

export default jetSchema;
