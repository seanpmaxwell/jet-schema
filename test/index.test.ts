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
    adminStatus: User.AdminStatus.Basic,
    adminStatusAlt: User.AdminStatusAlt.Basic,
  };

  expect(user).toStrictEqual(expectedResult);
});


/**
 * Override each default
 */
test('test User override each default value', () => {

  const user = User.new({
    id: 5,
    name: 'john',
    age: 40,
    email: 'a@a.com',
    created: new Date('2022-1-1'),
    lastLogin: new Date('2022-1-1'),
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
  });

  const expectedResult: IUser = {
    id: 5,
    name: 'john',
    age: 40,
    email: 'a@a.com',
    created: new Date('2022-1-1'),
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
  };

  expect(user).toStrictEqual(expectedResult);
});


/**
 * Test child object whose default is 'undefined' is not on the parent.
 */
