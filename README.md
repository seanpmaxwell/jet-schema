# Jet-Schema ✈️
> Simple, zero-dependency, typescript-first schema validation tool, that lets you use your own validation functions (inferring types included!).


## Introduction
Most schema validation libraries have fancy functions for validating object properties (i.e. `zod.string().email()`) but problem is I already had a lot of my own custom validation logic unique to my application (i.e. functions to check primitive-types, regexes for validating primtives etc). The only thing that was making me use schema-validation libraries was trying to validate object properties. So I thought, why not figure out a way to integrate my all the functions I had already written with something that can validate them against object properties? Well **jet-schema** does just that!
<br/>

If you want a library that includes all kinds of special functions for validating things other than objects **jet-schema** is probably not for you. However, the vast majority of projects I've worked on have involved implementing lots of type checking functions specific to the needs of that project. For example, maybe the email format maybe that's built into the library is different that the one your client needs. Instead of of have to write your own and dig into the library's feature to validate using your custom method, with jet-schema you can just pass your method.
<br/>

Reasons to use Jet-Schema
- TypeScript first
- Quick, terse, simple, easy-to-use (there are only 3 function exports and 3 type exports).
- Much smaller and less complex than most schema-validation types.
- Typesafety works both ways, you can either force a schema-type when the `schema` function is called OR you can infer a type from a schema.
- Provides a `transform` wrapper function for custom validators you may have.
- When passing the `Date` constructor, automatically converts all valid date values in a `Date` object.
- Set a default value for any validation function you may wanna reuse.
- `new` and `test` functions provided automatically by default.
- Works client-side or server-side
- Doesn't require a compilation step (so still works with `ts-node`, unline `typia`).


## Preview
```typescript

// An example using "zod", a popular schema validation library
const User: z.ZodType<IUser> = z.object({
  id: z.number().default(-1).min(-1),
  name: z.string().default(''),
  email: z.string().email().or(z.literal('')).default('a@a.com'),
  age: z.preprocess((arg => Number(arg)), z.number()),
  created: z.preprocess((arg => arg === undefined ? new Date() : arg), z.coerce.date()),
  address: z.object({ 
    street: z.string(),
    zip: z.number(),
    country: z.string().optional(),
  }).optional(),
});

// Equivalent using "jet-schema" (other than "schema/transform", 
// the other are application custom-functions)
const User = schema<IUser>({
  id: isRelKey,
  name: isString,
  email: ['a@a.com', isEmail],
  age: transform(Number, isNumber),
  created: Date,
  address: schema({
    street: isString,
    zip: isNumber,
    country: isOptString,
  }, true),
});
```


## Guide

### Getting Started
First you need to initialize the `schema` function by importing the `jet-logger` function. `jetLogger` accepts two optional arguments, an array-map of which default value should be used for which validator-function: you should use this if you don't want to have to declare a default value every time. And the second is a custom clone function if you don't want to use the built-in function which uses `structuredClone` (I like to use `lodash.cloneDeep`).
<br/>

Usually what I do is create two files under my `util/` folder: `schema.ts` and `validators.ts`. In `schema.ts` I'll import and call the `jet-schema` function and import the apply defaults to any custom validators I've made. If you don't want to go through this step you can import the `schema` function directly from `jet-schema`.
```typescript
// "util/type-checks.ts"
// IMPORTANT: you should use type-predicates when writing validator functions.

export function isNum(param: unknown): param is number {
  return typeof param === 'number';
}

export function isStr(param: unknown): param is string {
  return typeof param === 'string';
}

export function isOptionalStr(param: unknown): param is string | undefined {
  return param === undefined || typeof param === 'string';
}


// "util/schema.ts"
import jetSchema from 'jet-schema';
import { isNum, isStr } from './type-checks';
// import { schema } from 'jet-schema'; // No options

export default jetSchema([
  [isNumber, 0],
  [isStr, ''],
], 'pass a custom clone function here if you want to');
```
<br/>

Now that we have our schema function let's made a schema: there are two ways to go about this. I usually like to create an interface first cause I feel like they are great way to document your data types BUT some people would rather setup their schemas first and infer their types from that. I'll show you some examples doing both.
```typescript
// "models/User.ts"
import { inferType } from 'jet-schema';

import schema from 'util/schema.ts';
import { isNum, isStr, isOptionalStr } from 'util/type-checks';


// OPTION 1: Create schema using type
interface IUser {
  id: number;
  name: string;
  email: string;
  nickName?: string; 
}
const User = schema<IUser>({
  id: isNum,
  name: isStr,
  // You can pass your default/validator in an array instead.
  email: ['', ((arg: str) => EMAIL_RGX.test(arg))]
  // NOTE: we don't have to pass this option since its optional
  nickName: isOptionalStr,
})

// OPTION 2: Create type using schema
const User = schema({
  id: isNum,
  name: isStr,
  nickName: isOptionalStr,
})
const TUser = inferType<typeof User>;
```
<br/>

**IMPORTANT:** Upon initialization, the validator-functions will check their defaults. If a value is not optional and you do not supply default value, the an error will end up getting thrown when `schema` is called.
<br/>

Once you have you schema setup, you can call the `new`, `test`, and `pick` functions. Here is an overview of what each one does:
- `new` Allows you to create new instances of your type using partials. If the value is absent, `new` will using the default supplied. If no default is supplied then the value will be skipped.
- `test` accepts any unknown value, returns a type-predicate and will test it against the `schema`.
- `pick` allows you to select property and returns an object with the `test` and `default` functions. If a value is nullable, then you need to use optional guard when calling it: `pick?.()`


### Make schemas optional/nullable
- In additiona to a schema-object the `schema()` function accepts 3 additional parameters `isOptional`, `isNullable`, and `default`. These are type-checked against the type supplied to schema `schema<Your-Generic>()`, so you must supply the correct parameters.
- The third option `default` defines the behavior for nested schemas when initialized from a parent. The value can be a `boolean` or `null`. // pick up here


### Nested schemas


### Transforming values with `transform()`
