/* eslint-disable max-len */
import { expect, test } from 'vitest';
import User, { IUser } from './models/User';


/**
 * Test defaults
 */
test('test User all default values', () => {

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
  };

  expect(user).toStrictEqual(expectedResult);
});


/**
 * Override each default
 */
test('test User override each default value', () => {

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
test('test User pick() function', () => {

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
