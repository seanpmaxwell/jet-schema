import jetSchema from './jetSchema';


// Export types
export type {
  TSchemaFnObjArg as TJetSchema,
  PublicInferType as inferType,
} from './jetSchema';

// Export functions
export { transform, setDefault } from './util';
export const schema = jetSchema();
export default jetSchema;
