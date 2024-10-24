import jetLogger from '../../src';
import { isBoolean, isEmail, isNumber, isRelationalKey, isString } from './validators';


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
