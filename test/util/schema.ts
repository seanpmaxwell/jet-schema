import jetLogger, { trans as transLib } from '../../src';
import { isBoolean, isEmail, isNumber, isRelationalKey, isString } from './validators';


export const trans = transLib;

const customClone = (arg: unknown) => {
  const val = JSON.stringify(arg);
  return JSON.parse(val);
}

export default jetLogger([
  [isBoolean, false],
  [isNumber, 0],
  [isString, ''],
  [isRelationalKey, -1],
  [isEmail, 'a@a.com'],
], customClone);
