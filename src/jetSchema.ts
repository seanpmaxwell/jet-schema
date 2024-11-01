/* eslint-disable n/no-unsupported-features/node-builtins */
/* eslint-disable max-len */

import {
  processEnum,
  isDate,
  isObj,
  isUndef,
  TFunc,
  IValidatorFn,
  TEnum,
  isEnum,
} from './util';


// **** Variables ****

const Errors = {
  Init: '"init" must be true if schema is not optional.',
  Default: 'This validation failed when setting up defaults.',
  Validator: 'Setup error: validator must be a function, enum, schema, or Date constructor.',
  Undef: 'schema.test failed: value was undefined but not optional.',
  Null: 'schema.test failed: value was null but not nullable.',
  NotAnObj: 'schema.test failed: value was neither undefined nor null but not an object.',
  ParseNotAnObj: 'schema.parse failed: value must be an object.',
} as const;


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


// **** Utility types **** //

type NotUndef<T> = Exclude<T, undefined>;
type TModel = Record<string | number | symbol, unknown>;
type AddNullablesHelper<T, isN> = isN extends true ? NonNullable<T> | null : NonNullable<T>;
type AddNullables<T, isU, isN> = (isU extends true ? AddNullablesHelper<NotUndef<T>, isN> | undefined : AddNullablesHelper<NotUndef<T>, isN>);

type TDefaultVals = Record<string | number | symbol, TFunc>;
type TValidators = Record<string | number | symbol, IValidatorFn<unknown>>;
type GetTypePredicate<T> = T extends (x: unknown) => x is infer U ? U : never;
type TOnError = (property: string, value?: unknown, origMessage?: string) => void;

interface IFullOptions {
  optional?: boolean;
  nullable?: boolean;
  init?: boolean | null;
  nullish?: true; 
}


// **** Schema Types **** //

// Make sure validator function type-predicate returns default type
type TDefaultValsMap<T> = {
  [K in keyof T]: {
    0: ((arg: unknown) => arg is unknown),
    1: 0 extends keyof T[K] ? GetTypePredicate<T[K][0]> : never,
  }
};

// Return value for the pick function
type TPickRetVal<T, NnT = NonNullable<T>> = {
  test: (arg: unknown) => arg is T,
  default: () => T,
} & (IsStaticObj<T> extends true ? {
  pick: <K extends keyof NnT>(prop: K) => TPickRetVal<NnT[K]>;
  new: (arg?: Partial<NonNullable<T>>) => NonNullable<T>;
} : unknown);

// Value returned by the "schema" function
export interface ISchema<T> {
  new: (arg?: Partial<NonNullable<T>>) => NonNullable<T>;
  test: (arg: unknown) => arg is T;
  pick: <K extends keyof T>(prop: K) => TPickRetVal<T[K]>;
  parse: (arg: unknown) => NonNullable<T>;
  _schemaOptions: {
    optional: boolean;
    nullable: boolean;
    init: boolean | null;
  };
}

// Main argument passed to the schema functions
export type TSchemaFnObjArg<T> = Required<{
  [K in keyof T]: (
    T[K] extends (string | number)
    ? (IValidatorFn<T[K]> | TEnum)
    : T[K] extends Date 
    ? (DateConstructor | IValidatorFn<T[K]>)
    : IsStaticObj<T[K]> extends true
    ? ISchema<T[K]>
    : IValidatorFn<T[K]>
  );
}>;

// "Jet Options"
interface IJetOptions<M> {
  defaultValuesMap?: M extends [TFunc, unknown][] ? M : never,
  cloneFn?: (value: unknown) => unknown,
  onError?: TOnError,
}

// Need to restrict parameters based on if "T" is null or undefined.
type TSchemaOptions<T> = (
  unknown extends T 
  ? (IOptNul | IOptNotNul | INotOptButNul | INotOptOrNul | INullish) 
  : (undefined extends T 
      ? (null extends T ? (IOptNul | INullish) : IOptNotNul) 
      : (null extends T ? INotOptButNul : INotOptOrNul)
    )
);

// If not optional or nullable, make this an optional parameter
type TSchemaOptionsHelper<T, R> = (
  unknown extends T 
  ? ([] | [R]) 
  : undefined extends T 
  ? [R] 
  : null extends T 
  ? [R] 
  : ([] | [R])
);


// **** Infer Types **** //

export type PublicInferType<S> = (S extends ISchema<infer X> ? X : never);

type InferTypes<U, R, Schema = MakeKeysOptIfUndef<InferTypesHelper<U>>> = (
  'nullish' extends keyof R
  ? AddNullables<Schema, true, true>
  : AddNullables<Schema,
    'optional' extends keyof R ? R['optional'] : false,
    'nullable' extends keyof R ? R['nullable'] : false
  >
);

type MakeKeysOptIfUndef<T> = { [K in keyof T]-?:
  (x: undefined extends T[K] ? Partial<Record<K, T[K]>> : Record<K, T[K]>) => void
}[keyof T] extends (x: infer I) => void ?
  I extends infer U ? { [K in keyof U]: U[K] } : never : never;
  
type InferTypesHelper<U> = {
  [K in keyof U]: (
    U[K] extends DateConstructor
    ? Date
    : U[K] extends IValidatorFn<infer X>
    ? X
    : U[K] extends ISchema<infer X>
    ? X
    : U[K] extends unknown[] // Don't let arrays get mixed with enums
    ? never
    : U[K] extends TEnum
    ? U[K][keyof U[K]]
    : never
  );
};

export interface IOptNul {
  optional: true;
  nullable: true;
  init?: null | boolean;
  nullish?: undefined
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

export interface INullish {
  nullish: true;
  optional?: undefined;
  nullable?: undefined;
  init?: null | boolean;
}


// **** Functions **** //

/**
 * Core jetSchema functions
 */
function jetSchema<M extends TDefaultValsMap<M>>(options?: IJetOptions<M>) {
  // Setup default values map
  const defaultValsMap = new Map(options?.defaultValuesMap),
    onErrorF = (options?.onError ? _wrapCustomError(options.onError) : _defaultOnErr),
    cloneFn = (options?.cloneFn ? options.cloneFn : _defaultClone);
  // Return the "schema" function
  return <T,
    U extends TSchemaFnObjArg<T> = TSchemaFnObjArg<T>,
    R extends TSchemaOptions<T> = TSchemaOptions<T>,
  >(schemaFnObjArg: U, ...options: TSchemaOptionsHelper<T, R>) => {
    // setup options
    const [ schemaOptions ] = options;
    const optionsF = _processOptions(schemaOptions);
    if (!optionsF.optional && !optionsF.init) {
      onErrorF('', '', Errors.Init);
    }
    // Setup
    const ret = _setupDefaultsAndValidators(schemaFnObjArg, cloneFn, defaultValsMap, onErrorF),
      newFn = _setupNewFn(ret.defaults, ret.validators, cloneFn, onErrorF),
      testFn = _setupTestFn(ret.validators, optionsF.optional, optionsF.nullable, onErrorF),
      parseFn = _setupParseFn(ret.validators, cloneFn, onErrorF);
    // Return
    return {
      new: newFn,
      test: testFn,
      pick: <K extends keyof U>(p: K) => {
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
      parse: parseFn,
      _schemaOptions: optionsF,
    } as unknown extends T ? ISchema<InferTypes<U, R>> : ISchema<T>;
  };
}

/**
 * Setup the new() function
 */
function _setupDefaultsAndValidators<T>(
  schemaArgObj: TSchemaFnObjArg<T>,
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
  for (const key in schemaArgObj) {
    const schemaArgProp = schemaArgObj[key];
    // Date
    if (schemaArgProp === Date) {
      defaults[key] = () => new Date();
      validators[key] = isDate;
    // Is nexted schema
    } else if (_isSchemaObj(schemaArgProp)) {
      const childSchema = schemaArgProp,
        dflt = childSchema._schemaOptions.init;
      if (dflt === true) {
        defaults[key] = () => childSchema.new();
      } else if (dflt === null) {
        defaults[key] = () => null;
      } else {
        defaults[key] = () => undefined;
      }
      childSchemaNewFns[key] = () => childSchema.new();
      validators[key] = childSchema.test;
    // Enum
    } else if (isEnum(schemaArgProp)) {
      const [ dflt, vldr ] = processEnum(schemaArgProp);
      defaults[key] = () => cloneFn(dflt);
      validators[key] = vldr as IValidatorFn<unknown>;
    // Validator function
    } else if (typeof schemaArgProp === 'function') {
      let vdlrFn = schemaArgProp as IValidatorFn<unknown>; 
      // Check if default wrapper was used
      let dflt;
      if (!!vdlrFn.origVldtr) {
        dflt = vdlrFn.defaultVal;
        vdlrFn = vdlrFn.origVldtr;
      } else if (defaultValsMap.has(vdlrFn)) {
        dflt = defaultValsMap.get(vdlrFn);
      }
      // Set the default
      if (!isUndef(dflt)) {
        const defaultF = cloneFn(dflt);
        defaults[key] = () => defaultF;
      } else {
        defaults[key] = () => undefined;
      }
      // Set the validator function
      validators[key] = vdlrFn;
    } else {
      onError(key, '', Errors.Validator);
    }
    // Make sure the default is a valid value
    const vldr = validators[key],
      dfltVal: unknown = defaults[key]();
    if (!vldr(dfltVal)) {
      onError(key, dfltVal, Errors.Default);
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
      if (!defaultVals[key]) { // purge extras
        continue;
      }
      const testFn = validators[key];
      let val = partial[key];
      if (testFn(val, ((transVal) => val = transVal))) {
        retVal[key] = cloneFn(val);
      } else {
        onError(key, val);
        retVal[key] = '**ERROR**';
      }
    }
    // Return
    return retVal;
  };
}

/**
 * Setup the test() function
 */
function _setupTestFn(
  validators: TValidators,
  isOptional: boolean,
  isNullable: boolean,
  onError: TOnError,
): (arg: unknown) => arg is TModel {
  return (arg: unknown): arg is TModel => {
    // Check null/undefined;
    if (isUndef(arg)) {
      if (isOptional) {
        return true;
      } else {
        onError('', arg, Errors.Undef);
        return false;
      }
    } else if (arg === null) {
      if (isNullable) {
        return true;
      } else {
        onError('', arg, Errors.Null);
        return false;
      }
    }
    // Must be an object
    if (!isObj(arg)) {
      onError('', arg, Errors.NotAnObj);
      return false;
    }
    // Run validators
    for (const key in validators) {
      const testFn = validators[key];
      let val = (arg as TModel)[key];
      if (!testFn(val, ((transVal) => val = transVal))) {
        onError(key, val);
        return false;
      }
      (arg as TModel)[key] = val;
    }
    // Return
    return true;
  };
}

/**
 * Setup the new() function
 */
function _setupParseFn(
  validators: TValidators,
  cloneFn: TFunc,
  onError: TOnError,
): (arg: unknown) => TModel {
  return (arg: unknown) => {
    // Must be an object
    const retVal: TModel = {};
    if (!isObj(arg)) {
      onError('', arg, Errors.ParseNotAnObj);
      return retVal;
    }
    // Run validators, looping validators will purse extras
    for (const key in validators) {
      const testFn = validators[key];
      let val = (arg as TModel)[key];
      if (!testFn(val, ((transVal) => val = transVal))) {
        onError(key, val);
        retVal[key] = '**ERROR**';
      }
      if (key in arg) {
        retVal[key] = cloneFn(val);
      }
    }
    // Return
    return retVal;
  };
}

/**
 * Setup options based on object passed by the user.
 */
function _processOptions(options: IFullOptions | undefined) {
  const init = (isUndef(options?.init) ? true : options?.init);
  if (!options?.nullish) {
    return {
      optional: !!options?.optional,
      nullable: !!options?.nullable,
      init,
    };
  } else {
    return {
      optional: true,
      nullable: true,
      init,
    };
  }
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
 * Provide the default error message to the custom function.
 */
function _wrapCustomError(onError: TOnError) {
  return (property: string, value?: unknown, moreDetails?: string) => {
    const origMessage = _getDefaultErrMsg(property, value, moreDetails);
    return onError(property, value, origMessage);
  };
}

/**
 * Default function to call when a validation fails.
 */
function _defaultOnErr(property: string, value?: unknown, moreDetails?: string) {
  const message = _getDefaultErrMsg(property, value, moreDetails);
  throw new Error(message);
}

/**
 * Get the default error message.
 */
function _getDefaultErrMsg(property: string, value?: unknown, moreDetails?: string) {
  if (!!property) {
    property = `The property "${property}" failed to pass validation.`;
  }
  let message = '';
  if (!!property && !value && !moreDetails) {
    message = property;
  } else if (!property && !!value && !moreDetails) {
    message = JSON.stringify(value);
  } else if (!property && !value && !!moreDetails) {
    message = moreDetails;
  } else {
    if (!property) {
      message = JSON.stringify({ message: moreDetails, value });
    } else {
      message = JSON.stringify({
        message: property,
        value, ['more-details']:
        moreDetails,
      });
    }
  }
  return message;
}


// **** Export default **** //

export default jetSchema;
