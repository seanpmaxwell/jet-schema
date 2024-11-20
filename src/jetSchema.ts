/* eslint-disable n/no-unsupported-features/node-builtins */
/* eslint-disable max-len */

import {
  processEnum,
  isDate,
  isObj,
  isUndef,
  TFunc,
  IValidatorFnOrObj,
  TEnum,
  isEnum,
  IValidatorObj,
  TValidatorFn,
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
  NewFn: 'Failed in the "new" function',
  TestFn: 'Failed in the "test" function',
  ParseFn: 'Failed in the "parse" function',
  StrictMode: 'Argument had a property which was not in schema, which is not allowed in strict mode',
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
export type TModel = Record<string | number | symbol, unknown>;
type AddNullablesHelper<T, isN> = isN extends true ? NonNullable<T> | null : NonNullable<T>;
type AddNullables<T, isU, isN> = (isU extends true ? AddNullablesHelper<NotUndef<T>, isN> | undefined : AddNullablesHelper<NotUndef<T>, isN>);

type TGlobalsMap = Map<TValidatorFn, Pick<IValidatorObj<unknown>, 'default' | 'transform' | 'onError'>>;
type GetTypePredicate<T> = T extends (x: unknown) => x is infer U ? U : never;
type TOnError = (property: string, value?: unknown, origMessage?: string, schemaId?: string) => void;

type TAllVldtrsObj = Record<string, {
  vf: TValidatorFn,
  transform?: TFunc,
  default: TFunc,
  onError?: IValidatorObj<unknown>['onError'],
}>;

interface IFullOptions {
  optional?: boolean;
  nullable?: boolean;
  init?: boolean | null;
  nullish?: true;
  id?: string;
  safety?: 'pass' | 'filter' | 'strict';
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
export interface ISchema<T> {
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

// "Jet Options"
interface IJetOptions<M> {
  globals?: M extends IValidatorObj<unknown>[] ? M : never,
  cloneFn?: (value: unknown) => unknown,
  onError?: TOnError,
}

type TGlobalsArr<M> = {
  [K in keyof M]: {
    vf: TValidatorFn,
  } & ('vf' extends keyof M[K] ? {
    default?: GetTypePredicate<M[K]['vf']>,
    transform?: TFunc,
    onError?: IValidatorObj<unknown>['onError'],
  } : never)
};

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

interface ISchemaOptionsBase {
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


// **** Functions **** //

/**
 * Core jetSchema functions
 */
function jetSchema<M extends TGlobalsArr<M>>(options?: IJetOptions<M>) {
  // Setup default values map
  const globalsMap = _setupGlobalsMap(options?.globals ?? []),
    cloneFn = (options?.cloneFn ? options.cloneFn : _defaultClone),
    onError = (options?.onError ? _wrapCustomError(options.onError) : _defaultOnErr);
  // Return the "schema" function
  return <T,
    U extends TSchemaFnObjArg<T> = TSchemaFnObjArg<T>,
    R extends TSchemaOptions<T> = TSchemaOptions<T>,
  >(schemaFnObjArg: U, ...options: TSchemaOptionsHelper<T, R>) => {
    // Setup options
    const [ schemaOptions ] = options;
    const optionsF = _processOptions(schemaOptions);
    let onErrorF = onError;
    if (optionsF.id) {
      onErrorF = _wrapErrorWithSchemaId(onErrorF, optionsF.id);
    }
    if (!optionsF.optional && (optionsF.init === false || isUndef(optionsF.init))) {
      onErrorF('', '', Errors.Init);
    }
    // Setup main functions
    const ret = _setupAllVldtrsHolder(schemaFnObjArg, cloneFn, globalsMap, onErrorF, optionsF.id),
      newFn = _setupNewFn(ret.allVldtrsHolder, cloneFn, onErrorF),
      testFn = _setupTestFn(ret.allVldtrsHolder, optionsF.optional!, optionsF.nullable!, optionsF.safety, onErrorF),
      parseFn = _setupParseFn(ret.allVldtrsHolder, optionsF.safety, onErrorF);
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
  cloneFn: typeof _defaultClone,
  globalsMap: TGlobalsMap,
  onError: TOnError,
  schemaId = '',
): {
  childSchemaNewFns: Record<string, TFunc>,
  allVldtrsHolder: TAllVldtrsObj,
} {
  const allVldtrsHolder: TAllVldtrsObj = {},
    childSchemaNewFns: Record<string, TFunc> = {};
  // Start loop
  for (const key in schemaArgObj) {
    // Init the validator-holder-object
    const vldrHolderObj: TAllVldtrsObj[keyof TAllVldtrsObj] = {
      vf: (arg: unknown): arg is boolean  => false,
      default: () => undefined,
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
        if (!!localObj.onError) {
          let customErr = localObj.onError;
          if (!!schemaId) {
            customErr = _wrapErrorWithSchemaId(customErr, schemaId);
          }
          vldrHolderObj.onError = customErr;
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
        if (!!globalsObj.onError) {
          let customErr = globalsObj.onError;
          if (!!schemaId) {
            customErr = _wrapErrorWithSchemaId(customErr, schemaId);
          }
          vldrHolderObj.onError = customErr;
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
      onError(key, '', Errors.Validator);
    }
    // Make sure the default is a valid value
    const vldr = vldrHolderObj.vf,
      dfltVal: unknown = vldrHolderObj.default();
    if (!vldr(dfltVal)) {
      if (!!vldrHolderObj.onError) {
        vldrHolderObj.onError(key, dfltVal, Errors.Default);
      } else {
        onError(key, dfltVal, Errors.Default);
      }
    }
    // Set the validator-object
    allVldtrsHolder[key] = vldrHolderObj;
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
function _isSchemaObj(arg: unknown): arg is ISchema<unknown> {
  return (isObj(arg) && '_schemaOptions' in arg);
}

/**
 * Is a validator object
 */
function _isValidatorObj(arg: unknown): arg is IValidatorObj<unknown> {
  return (isObj(arg) && ('vf' in arg) && typeof arg.vf === 'function');
}

/**
 * Setup the new() function
 */
function _setupNewFn(
  allVldtrsHolder: TAllVldtrsObj,
  cloneFn: TFunc,
  onError: TOnError,
): (partial?: Partial<TModel>) => TModel {
  return (partial: Partial<TModel> = {}) => {
    // Get default values
    const retVal: TModel = {};
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
        if (!!vldrObj.onError) {
          vldrObj.onError(key, val, Errors.NewFn);
        } else {
          onError(key, val, Errors.NewFn);
        }
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
  allVldtrsHolder: TAllVldtrsObj,
  isOptional: boolean,
  isNullable: boolean,
  safety: IFullOptions['safety'] = 'filter',
  onError: TOnError,
): (arg: unknown) => arg is TModel {
  const vldrEntries = Object.entries(allVldtrsHolder);
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
      return false;
    }
    // Run validators
    const argCopy: TModel = { ...arg };
    for (const [key, vldrObj] of vldrEntries) {
      // Run transform
      let val = (arg as TModel)[key];
      if (!!vldrObj.transform) {
        val = vldrObj.transform(val);
        (arg as TModel)[key] = val;
      }
      // Run validator-function
      if (!vldrObj.vf(val)) {
        if (!!vldrObj.onError) {
          vldrObj.onError(key, val, Errors.ParseFn);
        } else {
          onError(key, val, Errors.ParseFn);
        }
        return false;
      }
      // Check safety
      if (safety !== 'pass') {
        Reflect.deleteProperty(argCopy, key);
      }
    }
    // Unless safety = "pass", filter extra keys
    if (safety !== 'pass') {
      for (const key in argCopy) {
        if (safety === 'strict') {
          onError(key, argCopy[key], Errors.StrictMode);
          return false;
        }
        Reflect.deleteProperty(arg, key);
      }
    }
    // Return
    return true;
  };
}

/**
 * Setup the new() function
 */
function _setupParseFn(
  allVldtrsHolder: TAllVldtrsObj,
  safety: IFullOptions['safety'] = 'filter',
  onError: TOnError,
): (arg: unknown) => unknown {
  const vldrEntries = Object.entries(allVldtrsHolder);
  return (arg: unknown) => {
    // Must be an object
    if (!isObj(arg)) {
      onError('', arg, Errors.ParseNotAnObj);
      return arg;
    }
    // Run validators
    const argCopy: TModel = { ...arg };
    for (const [key, vldrObj] of vldrEntries) {
      // Run transform
      let val = (arg as TModel)[key];
      if (!!vldrObj.transform) {
        val = vldrObj.transform(val);
        (arg as TModel)[key] = val;
      }
      // Run validator-function
      if (!vldrObj.vf(val)) {
        if (!!vldrObj.onError) {
          vldrObj.onError(key, val, Errors.ParseFn);
        } else {
          onError(key, val, Errors.ParseFn);
        }
        return arg;
      }
      // Check safety
      if (safety !== 'pass') {
        Reflect.deleteProperty(argCopy, key);
      }
    }
    // Check no unknown keys for strict mode
    if (safety !== 'pass') {
      for (const key in argCopy) {
        if (safety === 'strict') {
          onError(key, argCopy[key], Errors.StrictMode);
          return arg;
        }
        Reflect.deleteProperty(arg, key);
      }
    }
    // Return
    return arg;
  };
}

/**
 * Setup the globals map
 */
function _setupGlobalsMap(globalsArr: IValidatorObj<unknown>[]): TGlobalsMap {
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
function _processOptions(options: IFullOptions | undefined) {
  let base: IFullOptions = { init: true, safety: 'filter' };
  if (!isUndef(options?.init)) {
    base.init = options.init;
  }
  if (!!options?.id) {
    base.id = options?.id;
  }
  if (!!options?.safety) {
    base.safety = options.safety;
  }
  if (!options?.nullish) {
    base = {
      ...base,
      optional: !!options?.optional,
      nullable: !!options?.nullable,
    };
  } else {
    base = {
      ...base,
      optional: true,
      nullable: true,
    };
  }
  // Return
  return base;
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
function _wrapErrorWithSchemaId(onError: TOnError, schemaId: string) {
  return (property: string, value?: unknown, moreDetails?: string) => {
    return onError(property, value, moreDetails, schemaId);
  };
}

/**
 * Provide the default error message to the custom function.
 */
function _wrapCustomError(onError: TOnError) {
  return (property: string, value?: unknown, moreDetails?: string, schemaId?: string) => {
    const origMessage = _getDefaultErrMsg(property, value, moreDetails, schemaId);
    return onError(property, value, origMessage);
  };
}

/**
 * Default function to call when a validation fails.
 */
function _defaultOnErr(property: string, value?: unknown, moreDetails?: string, schemaId?: string) {
  const message = _getDefaultErrMsg(property, value, moreDetails, schemaId);
  throw new Error(message);
}

/**
 * Get the default error message.
 */
function _getDefaultErrMsg(
  property: string,
  value?: unknown,
  moreDetails?: string,
  id?: string,
) {
  if (!!property) {
    property = `The property "${property}" failed to pass validation.`;
  }
  let message = '';
  if (!!property && !value && !moreDetails && !id) {
    message = property;
  } else if (!property && !!value && !moreDetails && !id) {
    message = JSON.stringify(value);
  } else if (!property && !value && !!moreDetails && !id) {
    message = moreDetails;
  } else {
    let msgObj: TModel;
    if (!property) {
      msgObj = {
        message: moreDetails,
        value,
      };
    } else {
      msgObj = {
        message: property,
        value,
        ['more-details']: moreDetails,
      };
    }
    if (!!id) {
      msgObj['schema-id'] = id;
    }
    message = JSON.stringify(msgObj);
  }
  return message;
}


// **** Export default **** //

export default jetSchema;
