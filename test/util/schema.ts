import jetLogger from '../../src';
import { isBool, isEmail, isNum, isRelKey, isStr } from './validators';


export default jetLogger([
  [isBool, false],
  [isNum, 0],
  [isStr, ''],
  [isRelKey, -1],
  [isEmail, 'a@a.com'],
]);