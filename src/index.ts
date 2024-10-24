import jetLogger from './jetLogger';
import { transform as transformFn } from './util';


// Export types
export type { TSchemaFnObjArg as TJetSchema, PublicInferType as inferType } from './jetLogger';
export type { ITransformAndTest } from './util';

// Export functions
export const transform = transformFn;
export default jetLogger;
