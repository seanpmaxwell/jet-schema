/* eslint-disable max-len */

import {
  processEnum,
  isDate,
  isObj,
  isUndef,
  TFunc,
  TEnum,
  isEnum,
  defaultCloneFn,
} from './util';

import {
  defaultOnError,
  Errors,
  getErrObj,
  IError,
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
type AddNullables<T, isU, isN> = (isU extends true ? AddNullablesHelper<NotUndef<T>, isN> | undefined : AddNullablesHelper<NotUndef<T>, isN>);
type GetTypePredicate<T> = T extends (x: unknown) => x is infer U ? U : never;


// **** Misc **** //

type TValidatorFn<T = unknown> = (
  arg: unknown,
  parentObj?: TModel,
  key?: string,
) => arg is T;

interface IValidatorObj<T = unknown> {
  vf: TValidatorFn<T>,
  default?: T,
  transform?: TFunc,
  formatError?: TFormatError;
}

type IValidatorFnOrObj<T> = TValidatorFn<T> | IValidatorObj<T>;
type TGlobalsMap = Map<TValidatorFn, Pick<IValidatorObj, 'default' | 'transform' | 'formatError'>>;
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
interface ISchema<T = unknown> {
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
    T[K] extends (string | number)
    ? (IValidatorFnOrObj<T[K]> | TEnum)
    : T[K] extends Date 
    ? (DateConstructor | IValidatorFnOrObj<T[K]>)
    : IsStaticObj<T[K]> extends true
    ? ISchema<T[K]>
    : IValidatorFnOrObj<T[K]>
  );
}>;

interface IJetOptions<M> {
  globals?: M extends IValidatorObj[] ? M : never,
  cloneFn?: (value: unknown) => unknown,
  onError?: TOnError,
}

type TGlobalsArr<M> = {
  [K in keyof M]: {
    vf: TValidatorFn,
  } & ('vf' extends keyof M[K] ? {
    default?: GetTypePredicate<M[K]['vf']>,
    transform?: TFunc,
    formatError?: TFormatError,
  } : never)
};

// Need to restrict parameters based on if "T" is null or undefined.
type TSchemaOptions<T = unknown> = (
  unknown extends T 
  ? (IOptNul | IOptNotNul | INotOptButNul | INotOptOrNul | INullish) 
  : (undefined extends T 
      ? (null extends T ? (IOptNul | INullish) : IOptNotNul) 
      : (null extends T ? INotOptButNul : INotOptOrNul)
    )
);

export interface ISchemaOptionsBase {
  id?: string;
  safety?: 'pass' | 'filter' | 'strict';
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
 * Core jetSchema functions
 */
function jetSchema<M extends TGlobalsArr<M>>(options?: IJetOptions<M>) {
  // Setup default values map
  const globalsMap = _setupGlobalsMap(options?.globals ?? []),
    cloneFn = (options?.cloneFn ?? defaultCloneFn),
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
      const err = getErrObj(Errors.Init, '.schema', optionsF.schemaId);
      onError(err);
    }
    // Setup main functions
    const ret = _setupAllVldtrsHolder(schemaFnObjArg, globalsMap, cloneFn,
        onError, optionsF.schemaId),
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
            ...(_isSchemaObj(prop) ? {
              pick: prop.pick,
              new: ret.childSchemaNewFns[key],
              schema: () => ({ ...prop }),
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
function _setupAllVldtrsHolder<T>(
  schemaArgObj: TSchemaFnObjArg<T>,
  globalsMap: TGlobalsMap,
  cloneFn: TCloneFn,
  onError: TOnError,
  schemaId?: string,
): {
  childSchemaNewFns: Record<string, TFunc>,
  allVldtrsHolder: TAllVldtrsObj,
} {
  const allVldtrsHolder: TAllVldtrsObj = {},
    childSchemaNewFns: Record<string, TFunc> = {},
    errors: (string | IError)[] = [];
  // Start loop
  for (const key in schemaArgObj) {
    // Init the validator-holder-object
    const vldrHolderObj: TAllVldtrsObj[keyof TAllVldtrsObj] = {
      vf: (arg: unknown): arg is boolean  => !!arg,
      default: () => undefined,
      formatError: (error: IError) => error,
    };
    // Is validator function or object
    const schemaArgProp = schemaArgObj[key];
    if (schemaArgProp === Date) {
      vldrHolderObj.vf = isDate;
      vldrHolderObj.transform = (arg: Date) => new Date(arg);
      vldrHolderObj.default = () => new Date();
    // Is a validator-function or validator-object
    } else if (
      (typeof schemaArgProp === 'function') ||
      _isValidatorObj(schemaArgProp)
    ) {
      // Check local validator-object
      let vdlrFn: TValidatorFn,
        defaultVal,
        hasLocalDefault = false;
      // Check local validator-objects
      if (_isValidatorObj(schemaArgProp)) {
        const localObj = schemaArgProp;
        vdlrFn = localObj.vf;
        if ('default' in localObj) {
          defaultVal = localObj.default;
          hasLocalDefault = true;
        }
        if (!!localObj.transform) {
          vldrHolderObj.transform = localObj.transform;
        }
        if (!!localObj.formatError) {
          vldrHolderObj.formatError = localObj.formatError;
        }
      } else {
        vdlrFn = schemaArgProp as TValidatorFn;
      }
      // Check global validator-object
      const globalsObj = globalsMap.get(vdlrFn);
      if (!!globalsObj) {
        if (!hasLocalDefault && 'default' in globalsObj) {
          defaultVal = globalsObj.default;
        }
        if (!vldrHolderObj.transform && !!globalsObj.transform) {
          vldrHolderObj.transform = globalsObj.transform;
        }
        if (!vldrHolderObj.formatError && !!globalsObj.formatError) {
          vldrHolderObj.formatError = globalsObj.formatError;
        }
      }
      // Set the default
      if (!isUndef(defaultVal)) {
        const defaultF = cloneFn(defaultVal);
        vldrHolderObj.default = () => defaultF;
      } else {
        vldrHolderObj.default = () => undefined;
      }
      // Set the validator function
      vldrHolderObj.vf = vdlrFn;
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
    // Enum
    } else if (isEnum(schemaArgProp)) {
      const [ dflt, vldr ] = processEnum(schemaArgProp);
      vldrHolderObj.default = () => cloneFn(dflt);
      vldrHolderObj.vf = vldr as TValidatorFn;
    // Error
    } else {
      const errObj = getErrObj(Errors.Init, '._setupAllVldtrsHolder', schemaId, 
        key);
      errors.push(errObj);
    }
    // Make sure the default is a valid value
    const dfltVal: unknown = vldrHolderObj.default();
    if (!vldrHolderObj.vf(dfltVal)) {
      const errObj = getErrObj(Errors.DefaultVal, '._setupAllVldtrsHolder',
        schemaId, key, dfltVal);
      const errFin = vldrHolderObj.formatError(errObj); 
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
      errors: (string | IError)[] = [];
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
        const errObj = getErrObj(Errors.PropValidation, '.new', schemaId, key,
          val);
        const errFin = vldrObj.formatError(errObj); 
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
    NotOptErr = getErrObj(Errors.UndefButNotOpt, '.test', schemaId),
    NullErr = getErrObj(Errors.NullButNotNullable, '.test', schemaId),
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
 * Setup the new() function
 */
function _setupParseFn(
  allVldtrsHolder: TAllVldtrsObj,
  options: IFullOptions,
  onError: TOnError,
): (arg: unknown) => unknown {
  // Pre-process some stuff
  const { schemaId, safety } = options,
    notAnObjErr = getErrObj(Errors.NotAnObj, '.parse', schemaId),
    runValidations = _setupRunValidations(allVldtrsHolder, safety, '.test',
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
 * Setup the globals map
 */
function _setupGlobalsMap(globalsArr: IValidatorObj[]): TGlobalsMap {
  const map: TGlobalsMap = new Map();
  for (const obj of globalsArr) {
    const { vf, ...rest } = obj;
    map.set(vf, rest);
  }
  return map;
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
): ((arg: object) => (string | IError)[] ) {
  // Run validations
  return (arg: object): (string | IError)[] => {
    const errors: (string | IError)[] = [];
    for (const key in allVldtrsHolder) {
      const vldrObj = allVldtrsHolder[key];
      let val = (arg as TModel)[key];
      if (!!vldrObj.transform) {
        val = vldrObj.transform(val);
        (arg as TModel)[key] = val;
      }
      if (!vldrObj.vf(val)) {
        const errObj = getErrObj(Errors.PropValidation, location, schemaId, key,
          val);
        const errFin = vldrObj.formatError(errObj); 
        errors.push(errFin);
      }
    }
    // Unless safety = "pass", filter extra keys
    if (safety !== 'pass') {
      for (const key in arg) {
        if (key in allVldtrsHolder) {
          continue;
        } else if (safety === 'strict') {
          const errObj = getErrObj(Errors.StrictMode, location, schemaId, key);
          errors.push(errObj);
        } else if (safety === 'filter') {
          Reflect.deleteProperty(arg, key);
        }
      }
    }
    // Return errors
    return errors;
  };
}


// **** Export default **** //

export default jetSchema;
