import jetLogger from '../../src';
import { isBoolean, isNumber, isRelationalKey, isString } from './validators';


const customClone = (arg: unknown): unknown => {
  if (arg instanceof Date) {
    return new Date(arg);
  } else if (typeof arg === 'object') {
    const val = JSON.stringify(arg);
    return JSON.parse(val);
  } else {
    return arg;
  }
};

export default jetLogger([
  [isBoolean, false],
  [isNumber, 0],
  [isString, ''],
  [isRelationalKey, -1],
], customClone);
