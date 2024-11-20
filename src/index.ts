import jetSchema from './jetSchema';


// Export types
export type {
  TSchemaFnObjArg as TJetSchema,
  PublicInferType as inferType,
} from './jetSchema';

export { IError, TErrArg } from './error-stuff';


// Export functions
export const schema = jetSchema();
export default jetSchema;
