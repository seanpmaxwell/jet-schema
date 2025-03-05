import initSchemaFunction from './initSchemaFn';


export type {
  TSchemaFnObjArg as TJetSchema,
  PublicInferType as inferType,
  IValidatorObj,
} from './initSchemaFn';

export {
  IErrorItem,
  TAllErrs as TErrArg,
} from './error-stuff';


// Export functions
export const initSchemaFn = initSchemaFunction;
export default initSchemaFunction();
