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
  transform,
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

type TGlobalsMap = Map<TValidatorFn<unknown>, Pick<IValidatorObj<unknown>, 'default' | 'transform'>>;
type TDefaultsAndVldtrs = Record<string, { fn: TValidatorFn<unknown>, default: TFunc }>;
type GetTypePredicate<T> = T extends (x: unknown) => x is infer U ? U : never;
type TOnError = (property: string, value?: unknown, origMessage?: string, schemaId?: string) => void;

interface IFullOptions {
  optional?: boolean;
  nullable?: boolean;
  init?: boolean | null;
  nullish?: true;
  id?: string;
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
    fn: TValidatorFn<unknown>,
  } & ('fn' extends keyof M[K] ? {
    default?: GetTypePredicate<M[K]['fn']>,
    transform?: TFunc,
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

export interface IOptNul {
  optional: true;
  nullable: true;
  init?: null | boolean;
  nullish?: undefined
  id?: string;
}

export interface IOptNotNul {
  optional: true;
  nullable?: false;
  init?: boolean;
  id?: string;
}

export interface INotOptButNul {
  optional?: false;
  nullable: true;
  init?: null | true;
  id?: string;
}

export interface INotOptOrNul {
  optional?: false;
  nullable?: false;
  init?: true;
  id?: string;
}

export interface INullish {
  nullish: true;
  optional?: undefined;
  nullable?: undefined;
  init?: null | boolean;
  id?: string;
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
    const ret = _setupDefaultsAndVldtrs(schemaFnObjArg, cloneFn, globalsMap, onErrorF),
      newFn = _setupNewFn(ret.defaultsAndVldtrs, cloneFn, onErrorF),
      testFn = _setupTestFn(ret.defaultsAndVldtrs, optionsF.optional!, optionsF.nullable!, onErrorF),
      parseFn = _setupParseFn(ret.defaultsAndVldtrs, cloneFn, onErrorF);
    // Return
    return {
      new: newFn,
      test: testFn,
      pick: <K extends keyof U>(p: K) => {
        const prop = schemaFnObjArg[p],
          key = p as string;
        if (!!prop) {
          return {
            default: ret.defaultsAndVldtrs[key].default,
            test: ret.defaultsAndVldtrs[key].fn,
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
function _setupDefaultsAndVldtrs<T>(
  schemaArgObj: TSchemaFnObjArg<T>,
  cloneFn: typeof _defaultClone,
  globalsMap: TGlobalsMap,
  onError: TOnError,
): {
  childSchemaNewFns: Record<string, TFunc>,
  defaultsAndVldtrs: TDefaultsAndVldtrs,
} {
  const defaultsAndVldtrs: TDefaultsAndVldtrs = {},
    childSchemaNewFns: Record<string, TFunc> = {};
  for (const key in schemaArgObj) {
    const schemaArgProp = schemaArgObj[key];
    defaultsAndVldtrs[key] = {
      fn: (arg: unknown): arg is boolean  => false,
      default: () => false,
    };
    // Is validator function or object
    if (schemaArgProp === Date) {
      defaultsAndVldtrs[key] = {
        fn: transform((arg: Date) => new Date(arg), isDate),
        default: () => new Date(),
      };
    // Is nested schema
    } else if (
      (typeof schemaArgProp === 'function') ||
      _isValidatorObj(schemaArgProp)
    ) {
      // Check local validator-object
      let vdlrFn: TValidatorFn<unknown>,
        defaultVal,
        hasLocalDefault = false,
        hasLocalTransform = false;
      // Check local validator-objects
      if (_isValidatorObj(schemaArgProp)) {
        const localObj = schemaArgProp;
        vdlrFn = localObj.fn;
        if ('default' in localObj) {
          defaultVal = localObj.default;
          hasLocalDefault = true;
        }
        if (!!localObj.transform) {
          vdlrFn = transform(localObj.transform, vdlrFn);
          hasLocalTransform = true;
        }
      } else {
        vdlrFn = schemaArgProp as TValidatorFn<unknown>;
      }
      // Check global validator-object
      const globalsObj = globalsMap.get(vdlrFn);
      if (!!globalsObj) {
        if (!hasLocalDefault && 'default' in globalsObj) {
          defaultVal = globalsObj.default;
        }
        if (!hasLocalTransform && globalsObj.transform) {
          vdlrFn = transform(globalsObj.transform, vdlrFn);
        }
      }
      // Set the default
      if (!isUndef(defaultVal)) {
        const defaultF = cloneFn(defaultVal);
        defaultsAndVldtrs[key].default = () => defaultF;
      } else {
        defaultsAndVldtrs[key].default = () => undefined;
      }
      // Set the validator function
      defaultsAndVldtrs[key].fn = vdlrFn;
    // Nest schema
    } else if (_isSchemaObj(schemaArgProp)) {
      const childSchema = schemaArgProp,
        dflt = childSchema._schemaOptions.init;
      if (dflt === true) {
        defaultsAndVldtrs[key].default = () => childSchema.new();
      } else if (dflt === null) {
        defaultsAndVldtrs[key].default = () => null;
      } else {
        defaultsAndVldtrs[key].default = () => undefined;
      }
      childSchemaNewFns[key] = () => childSchema.new();
      defaultsAndVldtrs[key].fn = childSchema.test;
    // Enum
    } else if (isEnum(schemaArgProp)) {
      const [ dflt, vldr ] = processEnum(schemaArgProp);
      defaultsAndVldtrs[key].default = () => cloneFn(dflt);
      defaultsAndVldtrs[key].fn = vldr as TValidatorFn<unknown>;
    // Error
    } else {
      onError(key, '', Errors.Validator);
    }
    // Make sure the default is a valid value
    const vldr = defaultsAndVldtrs[key].fn,
      dfltVal: unknown = defaultsAndVldtrs[key].default();
    if (!vldr(dfltVal)) {
      onError(key, dfltVal, Errors.Default);
    }
  }
  // Return
  return {
    childSchemaNewFns,
    defaultsAndVldtrs,
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
  return (isObj(arg) && ('fn' in arg) && typeof arg.fn === 'function');
}

/**
 * Setup the new() function
 */
function _setupNewFn(
  defaultsAndVldtrs: TDefaultsAndVldtrs,
  cloneFn: TFunc,
  onError: TOnError,
): (partial?: Partial<TModel>) => TModel {
  return (partial: Partial<TModel> = {}) => {
    // Get default values
    const retVal: TModel = {};
    for (const key in defaultsAndVldtrs) {
      const val: unknown = defaultsAndVldtrs[key].default();
      if (val !== undefined) {
        retVal[key] = val;
      }
    }
    // Get values from partial
    for (const key in partial) {
      if (!defaultsAndVldtrs[key]) { // purge extras
        continue;
      }
      const testFn = defaultsAndVldtrs[key].fn;
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
  defaultsAndVldtrs: TDefaultsAndVldtrs,
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
    for (const key in defaultsAndVldtrs) {
      const testFn = defaultsAndVldtrs[key].fn;
      let val = (arg as TModel)[key];
      if (!testFn(val, ((transVal) => val = transVal))) {
        onError(key, val);
        return false;
      }
      if (key in arg) {
        (arg as TModel)[key] = val;
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
  defaultsAndVldtrs: TDefaultsAndVldtrs,
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
    for (const key in defaultsAndVldtrs) {
      const testFn = defaultsAndVldtrs[key].fn;
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
 * Setup the globals map
 */
function _setupGlobalsMap(globalsArr: IValidatorObj<unknown>[]): TGlobalsMap {
  const map: TGlobalsMap = new Map();
  for (const obj of globalsArr) {
    const { fn, ...rest } = obj;
    map.set(fn, rest);
  }
  return map;
}

/**
 * Setup options based on object passed by the user.
 */
function _processOptions(options: IFullOptions | undefined) {
  let base: IFullOptions = { init: true };
  if (!isUndef(options?.init)) {
    base.init = options.init;
  }
  if (!!options?.id) {
    base.id = options?.id;
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
