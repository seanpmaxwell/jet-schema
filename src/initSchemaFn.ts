/* eslint-disable max-len */

import {
  getEnumVals,
  isDate,
  isObj,
  isUndef,
  TFunc,
  TEnum,
  isEnum,
  defaultCloneFn,
  isString,
  isNumber,
  isBoolean,
} from './util';

import {
  defaultOnError,
  ERROR_MESSAGES,
  setupErrItem,
  IErrorItem,
  TFormatError,
  TOnError,
} from './error-stuff';


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
type AddNullables<T, isU, isN> = (
  isU extends true 
    ? AddNullablesHelper<NotUndef<T>, isN> | undefined 
    : AddNullablesHelper<NotUndef<T>, isN>
  );


// **** Misc **** //

export interface IValidatorObj<T = unknown> {
  vf: TValidatorFn<T>,
  default?: (T | (() => T)),
  transform?: (arg: unknown) => T,
  formatError?: TFormatError;
}

type TValidatorFn<T = unknown> = (arg: unknown) => arg is T;
type IValidatorFnOrObj<T> = TValidatorFn<T> | IValidatorObj<T>;
type TCloneFn = typeof defaultCloneFn;

type TAllVldtrsObj = Record<string, {
  vf: TValidatorFn,
  default: TFunc,
  formatError: TFormatError,
  transform?: TFunc,
}>;

interface IFullOptions {
  optional: boolean;
  nullable: boolean;
  init: boolean | null;
  schemaId?: string;
  safety: 'pass' | 'filter' | 'strict';
}


// **** Schema Types **** //

// Return value for the pick function
type TPickRetVal<T, NnT = NonNullable<T>> = {
  test: (arg: unknown) => arg is T,
  default: () => T,
} & (IsStaticObj<T> extends true ? {
  pick: <K extends keyof NnT>(prop: K) => TPickRetVal<NnT[K]>;
  new: (arg?: Partial<NonNullable<T>>) => NonNullable<T>;
  schema: () => ISchema<T>;
} : unknown);

// Value returned by the "schema" function
export interface ISchema<T = unknown> {
  new: (arg?: Partial<NonNullable<T>>) => NonNullable<T>;
  test: (arg: unknown) => arg is T;
  pick: <K extends keyof T>(prop: K) => TPickRetVal<T[K]>;
  parse: (arg: unknown) => NonNullable<T>;
  _schemaOptions: {
    optional: boolean;
    nullable: boolean;
    init: boolean | null;
    id?: string;
    safety?: 'pass' | 'filter' | 'strict';
  };
}

// Main argument passed to the schema functions
export type TSchemaFnObjArg<T> = Required<{
  [K in keyof T]: (
    T[K] extends number
    ? (IValidatorFnOrObj<number> | TEnum | NumberConstructor)
    : T[K] extends string
    ? (IValidatorFnOrObj<string> | TEnum | StringConstructor)
    : T[K] extends boolean
    ? (IValidatorFnOrObj<boolean> | BooleanConstructor)
    : T[K] extends Date 
    ? (IValidatorFnOrObj<Date> | DateConstructor)
    : IsStaticObj<T[K]> extends true
    ? ISchema<T[K]>
    : IValidatorFnOrObj<T[K]>
  );
}>;

interface IJetOptions {
  cloneFn?: (value: unknown) => unknown,
  onError?: TOnError,
}

// Need to restrict parameters based on if "T" is null or undefined.
type TSchemaOptions<T = unknown> = (
  unknown extends T 
  ? (IOptNul | IOptNotNul | INotOptButNul | INotOptOrNul | INullish) 
  : (undefined extends T 
      ? (null extends T ? (IOptNul | INullish) : IOptNotNul) 
      : (null extends T ? INotOptButNul : INotOptOrNul)
    )
);

interface ISchemaOptionsBase {
  id?: string;
  safety?: 'pass' | 'filter' | 'strict';

  // pick up here, need to allow clone and on error as well
}

export interface IOptNul extends ISchemaOptionsBase {
  optional: true;
  nullable: true;
  init?: null | boolean;
  nullish?: undefined
}

export interface IOptNotNul extends ISchemaOptionsBase {
  optional: true;
  nullable?: false;
  init?: boolean;
}

export interface INotOptButNul extends ISchemaOptionsBase {
  optional?: false;
  nullable: true;
  init?: null | true;
}

export interface INotOptOrNul extends ISchemaOptionsBase {
  optional?: false;
  nullable?: false;
  init?: true;
}

export interface INullish extends ISchemaOptionsBase {
  nullish: true;
  optional?: undefined;
  nullable?: undefined;
  init?: null | boolean;
}

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
    : U[K] extends IValidatorFnOrObj<infer X>
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


// **** Functions **** //

/**
 * Core initSchemaFn() functions
 */
function initSchemaFn(options?: IJetOptions) {
  // Setup default values map
  const cloneFn = (options?.cloneFn ?? defaultCloneFn),
    onError = (options?.onError ?? defaultOnError);
  // Return the "schema" function
  return <T,
    U extends TSchemaFnObjArg<T> = TSchemaFnObjArg<T>,
    R extends TSchemaOptions<T> = TSchemaOptions<T>,
  >(schemaFnObjArg: U, ...options: TSchemaOptionsHelper<T, R>) => {
    // Setup options
    const [ schemaOptions ] = options,
      optionsF = _processOptions(schemaOptions);
    if (!optionsF.optional && (optionsF.init === false || isUndef(optionsF.init))) {
      const err = setupErrItem(ERROR_MESSAGES.Init, '.schema', optionsF.schemaId);
      onError(err);
    }
    // Setup main functions
    const ret = _setupAllVldtrsHolder(schemaFnObjArg, cloneFn, onError, optionsF.schemaId),
      newFn = _setupNewFn(ret.allVldtrsHolder, cloneFn, onError, optionsF.schemaId),
      testFn = _setupTestFn(ret.allVldtrsHolder, optionsF, onError),
      parseFn = _setupParseFn(ret.allVldtrsHolder, optionsF, onError);
    // Return
    return {
      new: newFn,
      test: testFn,
      pick: <K extends keyof U>(p: K) => {
        const prop = schemaFnObjArg[p],
          key = p as string,
          vldrObj = ret.allVldtrsHolder[key],
          transformFn = vldrObj.transform;
        let testFn: TFunc = vldrObj.vf;
        if (!!transformFn) {
          testFn = (val: unknown) => {
            val = transformFn(val);
            return vldrObj.vf(val);
          };
        }
        if (!!prop) {
          return {
            default: vldrObj.default,
            test: testFn,
            ...(_isSchemaObj(prop) && {
              pick: prop.pick,
              new: ret.childSchemaNewFns[key],
              schema: () => ({ ...prop }),
            }),
          };
        }
      },
      parse: parseFn,
      _schemaOptions: optionsF,
    } as unknown extends T ? ISchema<InferTypes<U, R>> : ISchema<T>;
  };
}

/**
 * Setup the _setupAllVldtrsHolder() function
 */
function _setupAllVldtrsHolder<T>(
  schemaArgObj: TSchemaFnObjArg<T>,
  cloneFn: TCloneFn,
  onError: TOnError,
  schemaId?: string,
): {
  childSchemaNewFns: Record<string, TFunc>,
  allVldtrsHolder: TAllVldtrsObj,
} {
  const allVldtrsHolder: TAllVldtrsObj = {},
    childSchemaNewFns: Record<string, TFunc> = {},
    errors: (string | IErrorItem)[] = [];
  // Start loop
  for (const key in schemaArgObj) {
    // Init the validator-holder-object
    const vldrHolderObj: TAllVldtrsObj[keyof TAllVldtrsObj] = {
      vf: (arg: unknown): arg is boolean  => !!arg,
      default: () => undefined,
      formatError: (error: IErrorItem) => error,
    };
    // Is validator function or object
    const schemaArgProp = schemaArgObj[key];
    // Date constructor
    if (schemaArgProp === Date) {
      vldrHolderObj.vf = isDate;
      vldrHolderObj.transform = (arg: Date) => new Date(arg);
      vldrHolderObj.default = () => new Date();
    // String constructor
    } else if (schemaArgProp === String) {
      vldrHolderObj.vf = isString;
      vldrHolderObj.default = () => '';
    // Number constructor
    } else if (schemaArgProp === Number) {
      vldrHolderObj.vf = isNumber;
      vldrHolderObj.default = () => 0;
    // Boolean constructor
    } else if (schemaArgProp === Boolean) {
      vldrHolderObj.vf = isBoolean;
      vldrHolderObj.default = () => false;
    // Enum
    } else if (isEnum(schemaArgProp)) {
      const vals = getEnumVals(schemaArgProp);
      vldrHolderObj.default = () => vals[0];
      const vldr = ((arg: unknown) => vals.some(val => val === arg));
      vldrHolderObj.vf = vldr as TValidatorFn;
    // Is a validator-object
    } else if (_isValidatorObj(schemaArgProp)) {
      const localObj = schemaArgProp;
      if ('default' in localObj) {
        if (typeof localObj.default === 'function') {
          vldrHolderObj.default = localObj.default as TFunc;
        } else {
          const defaultF = cloneFn(localObj.default);
          vldrHolderObj.default = () => defaultF;
        }
      }
      if (!!localObj.transform) {
        vldrHolderObj.transform = localObj.transform;
      }
      if (!!localObj.formatError) {
        vldrHolderObj.formatError = localObj.formatError;
      }
      vldrHolderObj.vf = localObj.vf;
    // Is a validator-function
    } else if (typeof schemaArgProp === 'function') {
      vldrHolderObj.vf = schemaArgProp as TValidatorFn;
    // Nested schema
    } else if (_isSchemaObj(schemaArgProp)) {
      const childSchema = schemaArgProp,
        dflt = childSchema._schemaOptions.init;
      if (dflt === true) {
        vldrHolderObj.default = () => childSchema.new();
      } else if (dflt === null) {
        vldrHolderObj.default = () => null;
      } else {
        vldrHolderObj.default = () => undefined;
      }
      childSchemaNewFns[key] = () => childSchema.new();
      vldrHolderObj.vf = childSchema.test;
    // Error
    } else {
      const errItem = setupErrItem(ERROR_MESSAGES.Init, '_setupAllVldtrsHolder', 
        schemaId, key);
      errors.push(errItem);
    }
    // Make sure the default is a valid value
    const dfltVal: unknown = vldrHolderObj.default();
    if (!vldrHolderObj.vf(dfltVal)) {
      const errItem = setupErrItem(ERROR_MESSAGES.DefaultVal, '_setupAllVldtrsHolder',
        schemaId, key, dfltVal);
      const errFin = vldrHolderObj.formatError(errItem); 
      errors.push(errFin);
    }
    // Set the validator-object
    allVldtrsHolder[key] = vldrHolderObj;
  }
  // Call error function if there are any errors
  if (errors.length > 0) {
    onError(errors);
  }
  // Return
  return {
    childSchemaNewFns,
    allVldtrsHolder,
  };
}

/**
 * See if value is a schema object.
 */
function _isSchemaObj(arg: unknown): arg is ISchema {
  return (isObj(arg) && '_schemaOptions' in arg);
}

/**
 * Is a validator object
 */
function _isValidatorObj(arg: unknown): arg is IValidatorObj {
  return (isObj(arg) && ('vf' in arg) && typeof arg.vf === 'function');
}

/**
 * Setup the new() function
 */
function _setupNewFn(
  allVldtrsHolder: TAllVldtrsObj,
  cloneFn: TFunc,
  onError: TOnError,
  schemaId?: string,
): (partial?: Partial<TModel>) => TModel {
  return (partial: Partial<TModel> = {}) => {
    // Get default values
    const retVal: TModel = {},
      errors: (string | IErrorItem)[] = [];
    for (const key in allVldtrsHolder) {
      const val: unknown = allVldtrsHolder[key].default();
      if (val !== undefined) {
        retVal[key] = val;
      }
    }
    // Get values from partial
    for (const key in partial) {
      const vldrObj = allVldtrsHolder[key];
      if (!vldrObj) { // Filter extras
        continue;
      }
      // Run transform
      let val = partial[key];
      if (!!vldrObj.transform) {
        val = vldrObj.transform(val);
      }
      retVal[key] = cloneFn(val);
      // Run validator-function
      if (!vldrObj.vf(val)) {
        const errItem = setupErrItem(ERROR_MESSAGES.PropValidation, '.new', 
          schemaId, key, val);
        const errFin = vldrObj.formatError(errItem); 
        errors.push(errFin);
      }
    }
    // Call error function if there are any errors
    if (errors.length > 0) {
      onError(errors);
    }
    // Return
    return retVal;
  };
}

/**
 * Setup the test() function
 */
function _setupTestFn(
  allVldtrsHolder: TAllVldtrsObj,
  options: IFullOptions,
  onError: TOnError,
): (arg: unknown) => arg is TModel {
  // Pre-process some stuff
  const { schemaId, safety } = options,
    NotOptErr = setupErrItem(ERROR_MESSAGES.UndefButNotOpt, '.test', schemaId),
    NullErr = setupErrItem(ERROR_MESSAGES.NullButNotNullable, '.test', schemaId),
    runValidations = _setupRunValidations(allVldtrsHolder, safety, '.test',
      schemaId);
  // Return test function
  return (arg: unknown): arg is TModel => {
    // Check undefined;
    if (isUndef(arg)) {
      if (options.optional) {
        return true;
      } else {
        onError(NotOptErr);
        return false;
      }
    // Check null
    } else if (arg === null) {
      if (options.nullable) {
        return true;
      } else {
        onError(NullErr);
        return false;
      }
    }
    // Must be an object
    if (!isObj(arg)) {
      return false;
    }
    // Run validators
    const errors = runValidations(arg);
    if (errors.length > 0) {
      onError(errors);
      return false;
    } else {
      return true;
    }
  };
}

/**
 * Setup the parse() function
 */
function _setupParseFn(
  allVldtrsHolder: TAllVldtrsObj,
  options: IFullOptions,
  onError: TOnError,
): (arg: unknown) => unknown {
  // Pre-process some stuff
  const { schemaId, safety } = options,
    notAnObjErr = setupErrItem(ERROR_MESSAGES.NotAnObj, '.parse', schemaId),
    runValidations = _setupRunValidations(allVldtrsHolder, safety, '.parse',
      schemaId);
  // Return parse function
  return (arg: unknown) => {
    if (!isObj(arg)) {
      onError(notAnObjErr);
      return arg;
    }
    // Run validators
    const errors = runValidations(arg);
    if (errors.length > 0) {
      onError(errors);
    }
    // Return
    return arg;
  };
}

/**
 * Setup options based on object passed by the user.
 */
function _processOptions(options?: TSchemaOptions): IFullOptions {
  const retVal: IFullOptions = {
    optional: false,
    nullable: false,
    init: true,
    safety: 'filter',
  };
  if (isUndef(options)) {
    return retVal;
  }
  if (!isUndef(options.init)) {
    retVal.init = options.init;
  }
  if (!!options.id) {
    retVal.schemaId = options.id;
  }
  if (!!options.safety) {
    retVal.safety = options.safety;
  }
  if (!isUndef(options.optional)) {
    retVal.optional = !!options.optional;
  }
  if (!isUndef(options.nullable)) {
    retVal.nullable = !!options.nullable;
  }
  if (('nullish' in options) && !isUndef(options.nullish)) {
    retVal.optional = options.nullish;
    retVal.nullable = options.nullish;
  }
  // Return
  return retVal;
}

/**
 * Run validator functions for an argument and return an errors array
 */
function _setupRunValidations(
  allVldtrsHolder: TAllVldtrsObj,
  safety: string,
  location: string,
  schemaId?: string,
): ((arg: object) => (string | IErrorItem)[] ) {
  // Run validations
  return (arg: object): (string | IErrorItem)[] => {
    const errors: (string | IErrorItem)[] = [];
    for (const key in allVldtrsHolder) {
      const vldrObj = allVldtrsHolder[key];
      let val = (arg as TModel)[key];
      if (!!vldrObj.transform) {
        val = vldrObj.transform(val);
        (arg as TModel)[key] = val;
      }
      if (!vldrObj.vf(val)) {
        const errItem = setupErrItem(ERROR_MESSAGES.PropValidation, location, 
          schemaId, key, val);
        const errFin = vldrObj.formatError(errItem); 
        errors.push(errFin);
      }
    }
    // Unless safety = "pass", filter extra keys
    if (safety !== 'pass') {
      for (const key in arg) {
        if (key in allVldtrsHolder) {
          continue;
        } else if (safety === 'strict') {
          const errItem = setupErrItem(ERROR_MESSAGES.StrictMode, location, 
            schemaId, key);
          errors.push(errItem);
        }
        Reflect.deleteProperty(arg, key);
      }
    }
    // Return errors
    return errors;
  };
}


// **** Export default **** //

export default initSchemaFn;
