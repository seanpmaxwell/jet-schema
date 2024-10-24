import jetLogger, { trans as transLib } from '../../src';
import { isBool, isEmail, isNum, isRelKey, isStr } from './validators';


export const trans = transLib;

export default jetLogger([
  [isBool, false],
  [isNum, 0],
  [isStr, ''],
  [isRelKey, -1],
  [isEmail, 'a@a.com'],
], (arg: unknown) => {
  const val = JSON.stringify(arg);
  return JSON.parse(val);
});
