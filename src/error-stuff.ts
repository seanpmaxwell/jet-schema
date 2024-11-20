import { isStr } from './util';


// **** Variables **** //

export const Errors = {
  Init: '"init:" option must be "true" if schema is not optional.',
  DefaultVal: 'Default value did not pass validation.',
  Validator: 'Validator must be a function, enum, nested-schema, or ' + 
    'Date() constructor.',
  PropValidation: 'Validator function failed.',
  UndefButNotOpt: 'Argument was undefined but not optional.',
  NullButNotNullable: 'Argument was null but not nullable',
  NotAnObj: 'Argument must be an object.',
  StrictMode: 'Extra properties not allowed in strict mode.',
} as const;


// **** Types **** //

export type TErrArg = string | IError | (string | IError)[];
export type TOnError = (errors: TErrArg) => void;
export type TFormatError = (error: IError) => IError | string;

export interface IError {
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
export function defaultOnError(errors?: TErrArg): void {
  if (!!errors) {
    if (Array.isArray(errors) && !(errors.length > 0)) {
      return;
    }
    let errorsF: string;
    if (!isStr(errors)) {
      if (Array.isArray(errors) && (errors.length === 1)) {
        errorsF = JSON.stringify(errors[0]);
      } else {
        errorsF = JSON.stringify(errors);
      }
    } else {
      errorsF = errors;
    }
    throw new Error(errorsF);
  }
}

/**
 * Get the default error message.
 */
export function getErrObj(
  message?: string,
  location?: string,
  schemaId?: string,
  property?: string,
  value?: unknown,
): IError {
  const error: IError = {};
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
