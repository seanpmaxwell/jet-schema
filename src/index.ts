import jetLogger from './jetLogger';
import { transform as transformFn } from './util';


// Setup
const notOptionsSchema = jetLogger();


// Export types
export type { TSchemaFnObjArg as TJetSchema, PublicInferType as inferType } from './jetLogger';

// Export functions
export const transform = transformFn;
export const schema = notOptionsSchema;
export default jetLogger;
