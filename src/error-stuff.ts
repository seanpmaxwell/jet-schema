import { isObj, isStr } from './util';


// **** Variables **** //

export const ERROR_MESSAGES = {
  Init: '"init:" option must be "true" if schema is not optional.',
  DefaultVal: 'Default value did not pass validation.',
  Validator: 'Schema-property must be a validator-function, nested-schema, ' + 
    'validator-object, or one of the following constructors String, Number, ' + 
    'Boolean, or Date.',
  PropValidation: 'Validator function failed.',
  UndefButNotOpt: 'Argument was undefined but not optional.',
  NullButNotNullable: 'Argument was null but not nullable',
  NotAnObj: 'Argument must be an object.',
  StrictMode: 'Extra properties not allowed in strict mode.',
  Enum: 'Enum option was used but value was not a valid enum.',
} as const;


// **** Types **** //

export type TAllErrs = string | IErrorItem | (string | IErrorItem)[];
export type TOnError = (errors: TAllErrs) => void;
export type TFormatError = (error: IErrorItem) => IErrorItem | string;

export interface IErrorItem {
  property?: string;
  value?: unknown;
  message?: string;
  location?: string;
  schemaId?: string;
}


// **** Functions **** //

/**
 * Default function to call when a validation fails.
 */
export function defaultOnError(errors?: TAllErrs): void {
  if (!!errors && !(Array.isArray(errors) && !errors.length)) {
    throw new JetSchemaError(errors);
  }
}

/**
 * Get the default error message.
 */
export function setupErrItem(
  message?: string,
  location?: string,
  schemaId?: string,
  property?: string,
  value?: unknown,
): IErrorItem {
  const error: IErrorItem = {};
  if (!!property) {
    error.property = property;
  }
  if (arguments.length === 5) {
    error.value = value;
  }
  if (!!message) {
    error.message = message;
  }
  if (!!location) {
    error.location = location;
  }
  if (!!schemaId) {
    error.schemaId = schemaId;
  }
  return error;
}


// **** Classes **** //

class JetSchemaError extends Error {

  public static MESSAGE = 'One or more schema properties failed validation: ';
  private errArg: TAllErrs = '';

  public constructor(errArg: TAllErrs) {
    const errStr = JetSchemaError.SetupErrorString(errArg);
    super(JetSchemaError.MESSAGE + errStr);
    this.errArg = JetSchemaError.CopyErrArg(errArg);
  }

  public static SetupErrorString(errArg: TAllErrs): string {
    if (!isStr(errArg)) {
      if (Array.isArray(errArg) && (errArg.length === 1)) {
        return JSON.stringify(errArg[0]);
      } else {
        return JSON.stringify(errArg);
      }
    } else {
      return errArg;
    }
  }

  public static CopyErrArg(errArg: TAllErrs): TAllErrs {
    if (Array.isArray(errArg)) {
      return [ ...errArg ];
    } else if (isObj(errArg)) {
      return { ...errArg };
    } else {
      return errArg;
    }
  }

  public getErrors(): TAllErrs {
    return this.errArg;
  }
}
