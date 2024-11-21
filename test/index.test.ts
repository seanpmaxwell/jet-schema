/* eslint-disable max-len */
import { expect, test } from 'vitest';

import schema from './util/schema';
import jetSchema from '../src';
import User, { IUser } from './models/User';
import { isNum, isStr } from '../src/util';


/**
 * Test defaults
 */
test('User all default values', () => {

  const user = User.new();

  const expectedResult: IUser = {
    id: -1,
    name: '',
    age: 0,
    email: '',
    created: new Date(user.created),
    lastLogin: new Date(user.lastLogin),
    avatar: { fileName: '', data: 'base64:str;' },
    avatar2: { fileName: '', data: 'base64:str;' },
    avatar4: null,
    address: {
      street: '',
      city: '',
      zip: 0,
      country: {
        name: '',
        code: 0,
      },
    },
    avatar7: null,
    avatar8: { fileName: '', data: '' },
    adminStatus: User.AdminStatus.Basic,
    adminStatusAlt: User.AdminStatusAlt.Basic,
    pastIds: [],
  };

  expect(user).toStrictEqual(expectedResult);
});


/**
 * Override each default
 */
test('User override each default value', () => {

  const EPOCH_PAST_TIME = new Date('2022-1-1').getTime();

  const user = User.new({
    id: 5,
    name: 'john',
    age: 40,
    email: 'a@a.com',
    created: new Date('2022-1-2'),
    lastLogin: EPOCH_PAST_TIME as unknown as Date,
    avatar: { fileName: 'aaa', data: 'bbb' },
    avatar2: { fileName: 'ccc', data: 'ddd' },
    address: {
      street: 'a',
      city: 'b',
      zip: 980109,
      country: {
        name: '',
        code: 0,
      },
    },
    adminStatus: User.AdminStatus.High,
    adminStatusAlt: User.AdminStatusAlt.Mid,
    avatar6: { fileName: 'nullish', data: '' },
    pastIds: '[1,2,3]' as unknown as number[], // test global transform
  });

  const expectedResult: IUser = {
    id: 5,
    name: 'john',
    age: 40,
    email: 'a@a.com',
    created: new Date('2022-1-2'),
    lastLogin: new Date('2022-1-1'),
    avatar: { fileName: 'aaa', data: 'bbb' },
    avatar2: { fileName: 'ccc', data: 'ddd' },
    avatar4: null,
    address: {
      street: 'a',
      city: 'b',
      zip: 980109,
      country: {
        name: '',
        code: 0,
      },
    },
    adminStatus: User.AdminStatus.High,
    adminStatusAlt: User.AdminStatusAlt.Mid,
    avatar6: { fileName: 'nullish', data: '' },
    avatar7: null,
    avatar8: { fileName: '', data: '' },
    pastIds: [1,2,3],
  };

  const somethingElse: unknown = {
    ...expectedResult,
    foo: 'bar',
  };

  expect(user).toStrictEqual(expectedResult);
  expect(User.test(expectedResult)).toStrictEqual(true);
  expect(User.test('asdf')).toStrictEqual(false);
  expect(User.parse(somethingElse)).toStrictEqual(expectedResult);
  expect(User.test(User.parse('asdf'))).toStrictEqual(false);
});


/**
 * Test pick function.
 */
test('User pick() function', () => {

  const EPOCH_PAST_TIME = new Date('2022-1-2').getTime();

  expect(User.pick('id').default()).toStrictEqual(-1);
  expect(User.pick('id').test(7)).toStrictEqual(true);
  expect(User.pick('name').default()).toStrictEqual('');
  expect(User.pick('name').test('john')).toStrictEqual(true);
  expect(User.pick('name').test(1234)).toStrictEqual(false);
  expect(User.pick('email').default()).toStrictEqual('');
  expect(User.pick('email').test('john@doe.com')).toStrictEqual(true);
  expect(User.pick('email').test('asdf')).toStrictEqual(false);
  expect(User.pick('created').default() instanceof Date).toStrictEqual(true);
  expect(User.pick('created').test(EPOCH_PAST_TIME)).toStrictEqual(true);
  expect(User.pick('address').pick('city').default()).toStrictEqual('');
  expect(User.pick('avatar').default()).toStrictEqual({ fileName: '', data: 'base64:str;' });
  expect(User.pick('avatar').default()).toStrictEqual({ fileName: '', data: 'base64:str;' });
  expect(User.pick('avatar2').default()).toStrictEqual({ fileName: '', data: 'base64:str;' });
  expect(User.pick('avatar3').default()).toStrictEqual(undefined);
  expect(User.pick('avatar4').default()).toStrictEqual(null);
  expect(User.pick('avatar5').default()).toStrictEqual(undefined);
  expect(User.pick('avatar6').default()).toStrictEqual(undefined);
  expect(User.pick('adminStatus').default()).toStrictEqual(User.AdminStatus.Basic);
  expect(User.pick('adminStatus').test('asdf')).toStrictEqual(false);
  expect(User.pick('adminStatusAlt').default()).toStrictEqual(User.AdminStatusAlt.Basic);
  expect(User.pick('adminStatusAlt').test(100)).toStrictEqual(false);
});


/**
 * Test nested schema function
 */
test('test User.pick("child schema").schema() function', () => {

  interface IUserAlt {
    id: number;
    name: string;
    avatar?: IUser['avatar'];
  }

  const UserAlt = schema<IUserAlt>({
    id: isNum,
    name: isStr,
    avatar: User.pick('avatar').schema(),
  });

  expect(UserAlt.pick('avatar').default()).toStrictEqual({
    fileName: '',
    data: 'base64:str;',
  });
});


/**
 * Test safety
 */
test('different schema "safety" options', () => {

  // Set "parent" settings
  const parentSchemaFn = jetSchema({
    globals: [
      { vf: isNum, default: 0 },
      { vf: isStr, default: '' },
    ],
    onError: () => ({}),
  });

  // Test "default/filter"
  const schemaDefault = parentSchemaFn({
    id: isNum,
    name: isStr,
  });
  const testResult1 = schemaDefault.test({ id: 1, name: 'joe', foo: 'bar' }),
    parseResult1 = schemaDefault.parse({ id: 1, name: 'joe', foo: 'bar' }),
    failResult1 = schemaDefault.test({ id: 1, name: 1234 });
  expect(testResult1).toStrictEqual(true);
  expect(parseResult1).toStrictEqual({ id: 1, name: 'joe' });
  expect(failResult1).toStrictEqual(false);

  // Test "default/filter" again
  const schemaFilter = parentSchemaFn({
    id: isNum,
    name: isStr,
  }, { safety: 'filter' });
  const testResult2 = schemaFilter.test({ id: 1, name: 'joe', foo: 'bar' }),
    parseResult2 = schemaFilter.parse({ id: 1, name: 'joe', foo: 'bar' }),
    failResult2 = schemaDefault.test({ id: 1, name: 1234 });
  expect(testResult2).toStrictEqual(true);
  expect(parseResult2).toStrictEqual({ id: 1, name: 'joe' });
  expect(failResult2).toStrictEqual(false);

  // Test "pass"
  const schemaPass = parentSchemaFn({
    id: isNum,
    name: isStr,
  }, { safety: 'pass' });
  const testResult3 = schemaPass.test({ id: 1, name: 'joe', foo: 'bar' }),
    parseResult3 = schemaPass.parse({ id: 1, name: 'joe', foo: 'bar' }),
    failResult3 = schemaPass.test({ id: 1, name: 1234 });
  expect(testResult3).toStrictEqual(true);
  expect(parseResult3).toStrictEqual({ id: 1, name: 'joe', foo: 'bar' });
  expect(failResult3).toStrictEqual(false);

  // Test "strict"
  const schemaStrict = parentSchemaFn({
    id: isNum,
    name: isStr,
  }, { safety: 'strict' });
  const testResult4 = schemaStrict.test({ id: 1, name: 'joe' }),
    parseResult4 = schemaStrict.parse({ id: 1, name: 'joe' }),
    failResult4 = schemaStrict.test({ id: 1, name: 'joe',  foo: 'bar' });
  expect(testResult4).toStrictEqual(true);
  expect(parseResult4).toStrictEqual({ id: 1, name: 'joe' });
  expect(failResult4).toStrictEqual(false);

  // Test error throw for "strict"
  const parentSchemaAllowThrowErrors = jetSchema({
    globals: [
      { vf: isNum, default: 0 },
      { vf: isStr, default: '' },
    ],
  });
  const schemaStrictAllowErrors = parentSchemaAllowThrowErrors({
    id: isNum,
    name: isStr,
  }, { safety: 'strict' });
  const arg = { id: 1, name: 'joe', foo: 'bar' };
  expect(() => schemaStrictAllowErrors.parse(arg)).toThrowError();
});
