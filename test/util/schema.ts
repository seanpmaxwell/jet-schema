import jetLogger, { transform as transformLib } from '../../src';
import { isBoolean, isEmail, isNumber, isRelationalKey, isString } from './validators';


export const transform = transformLib;

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
