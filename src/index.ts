import initSchemaFunction from './initSchemaFn';


// Export types
export type {
  TSchemaFnObjArg as TJetSchema,
  PublicInferType as inferType,
} from './initSchemaFn';

export { IError, TErrArg } from './error-stuff';


// Export functions
export const initSchemaFn = initSchemaFunction;
export default initSchemaFunction();
