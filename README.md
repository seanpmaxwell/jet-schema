# Jet-Schema ✈️ 📝
> Simple, zero-dependency, typescript-first schema validation tool, that lets you use your own validation functions (inferring types included!).
<br/>


## Introduction 🚀
Most schema validation libraries have fancy functions for validating objects and their properties, but the problem is I usually already have a lot of my own custom validation logic specific for each of my applications (i.e. functions to check primitive-types, regexes for validating strings etc). The only thing that was making me use schema-validation libraries was trying to validate object properties. So I thought, why not figure out a way to integrate my all the functions I had already written with something that can validate them against object properties? Well **jet-schema** does just that :)
<br/>

If you want a library that includes all kinds of special functions for validating things other than objects, **jet-schema** is probably not for you. However, the vast majority of projects I've worked on have involved implementing lots of type-checking functions specific to the needs of that project. For example, maybe the email format that's built into the library is different than the one your application needs. Instead of of having to dig into the library's features to validate using your custom method, with **jet-schema** you can just pass your method.
<br/>

Reasons to use Jet-Schema
- TypeScript first!
- Quick, terse, simple, easy-to-use (there are only 3 function exports and 2 type exports).
- Much smaller and less complex than most schema-validation libraries.
- Typesafety works both ways, you can either force a schema structure using a pre-defined type OR you can infer a type from a schema.
- `new` and `test` functions provided automatically on every new schema.
- Provides a `transform` wrapper function to modify values after before validating them.
- Works client-side or server-side.
- Enums can be used for validation.
- Doesn't require a compilation step (so still works with `ts-node`, unlike `typia`).
<br/>


## Preview 👀
```typescript

// An example using "zod", a popular schema validation library
const User: z.ZodType<IUser> = z.object({
  id: z.number().default(-1).min(-1),
  name: z.string().default(''),
  email: z.string().email().or(z.literal('')).default('a@a.com'),
  age: z.preprocess(Number, z.number()),
  created: z.preprocess((arg => arg === undefined ? new Date() : arg), z.coerce.date()),
  address: z.object({ 
    street: z.string(),
    zip: z.number(),
    country: z.string().optional(),
  }).optional(),
});

// Equivalent using "jet-schema" (other than "schema/transform", the other functions 
// are defined elsewhere in the application)
const User = schema<IUser>({
  id: isRelKey,
  name: isString,
  email: ['x@example.com', isEmail],
  age: transform(Number, isNumber),
  created: Date,
  address: schema({
    street: isString,
    zip: isNumber,
    country: isOptionalStr,
  }, true),
});
```
<br/>


## Guide 📜

### Getting Started
First you need to initialize the `schema` function by importing and calling the `jetLogger()` function.
<br/>

`jetSchema()` accepts two optional arguments:
  - An array-map of which default-value should be used for which validator-function: you should use this option for frequently used validator-function/default-value combinations where you don't want to set a default value every time.
  - The second is a custom clone function if you don't want to use the built-in function which uses `structuredClone` (I like to use `lodash.cloneDeep`).
<br/>

When setting up **jet-schema** for the first time, usually what I do is create two files under my `util/` folder: `schema.ts` and `validators.ts`. In `schema.ts` I'll import and call the `jet-schema` function then apply any frequently used validator-function/default-value combinations I have and a clone-function. If you don't want to go through this step you can import the `schema` function directly from `jet-schema`.
```typescript
// "util/validators.ts"

export function isNum(param: unknown): param is number {
  return typeof param === 'number';
}

export function isStr(param: unknown): param is string {
  return typeof param === 'string';
}

export function isOptionalStr(param: unknown): param is string | undefined {
  return param === undefined || typeof param === 'string';
}
```

> ⚠️ **IMPORTANT:**  &nbsp;  You need to use type-predicates when writing validator functions. If a value can be null/undefined, your validator-function's type-predicate needs account for this (`i.e. (arg: unknown): arg is string | undefined => ... `).

```typescript
// "util/schema.ts"
import jetSchema from 'jet-schema';
import { isNum, isStr } from './validators';

export default jetSchema([
  [isNum, 0],
  [isStr, ''],
], '...pass a custom clone-function here if you want to...');
```
<br/>

Now that we have our schema function setup, let's make a schema: there are two ways to go about this, enforcing a schema from a type or infering a type from a schema. I'll show you some examples doing it both ways.
<br/>

> Personally, I like to create an interface first cause I feel like they are great way to document your data-types, but I know some people prefer to setup their schemas first and infer their types from that.

```typescript
// "models/User.ts"
import { inferType } from 'jet-schema';

import schema from 'util/schema.ts';
import { isNum, isStr, isOptionalStr } from 'util/type-checks';


// **OPTION 1**: Create schema using type
interface IUser {
  id: number;
  name: string;
  email: string;
  nickName?: string; 
}
const User = schema<IUser>({
  id: isNum,
  name: isStr,
  email: ['', EMAIL_RGX.test] // You can pass your defaults/validators in an array instead.
  nickName: isOptionalStr, // NOTE: we don't have to pass this option since its optional
})

// **OPTION 2**: Create type using schema
const User = schema({
  id: isNum,
  name: isStr,
  email: ['', EMAIL_RGX.test]
  nickName: isOptionalStr,
})
const TUser = inferType<typeof User>;
```

> ⚠️ **IMPORTANT:**  &nbsp; Upon initialization, the validator-functions will check their defaults. If a value is not optional and you do not supply default value, then an error will be thrown when `schema()` is called.
<br/>

Once you have your schema setup, you can call the `new`, `test`, and `pick` functions. Here is an overview of what each one does:
- `new` Allows you to create new instances of your type using partials. If the value is absent, `new` will using the default supplied. If no default is supplied then the value will be skipped.
- `test` accepts any unknown value, returns a type-predicate and will test it against the `schema`.
- `pick` allows you to select property and returns an object with the `test` and `default` functions. If a value is nullable, then you need to use optional guard when calling it: `pick?.()`

> If an object property is a mapped-type then it must be initialized with the schema function. Just like with the parent schemas, you can also call `new`, `test`, `pick`, in addition to `default`. The value returned from `default` could be different from `new` if the schema is optional/nullable and the default value is `null` or `undefined`.


### Making schemas optional/nullable
In additiona to a schema-object the `schema()` function accepts 3 additional parameters `isOptional`, `isNullable`, and `default`. These are type-checked against the type supplied to schema `schema<...Your Type...>()`, so you must supply the correct parameters. So for example, if the schema-type is nullable and optional, then you must enter `true` for the second and third parameters.<br/>

The third option `default` defines the behavior for nested schemas when initialized from a parent. The value can be a `boolean` or `null`. If `false` the value will not be initialized with the parent, if `null` (the schema must be nullable to do this) value will be `null`, and if `true` or `undefined` then a full schema object will be created when a parent object is created. 


### Transforming values with `transform()`
If you want to modify a value before it passes through a validator function, you can import the `transform` function and wrap your validator function with it. `transform` calls the validator function and fires a callback with the modified value if the callback was provided. When calling `new` or `test`, `transform` will modify the original object.
<br/>

I've found `transform` can be useful for other parts of my application where I need to modify a value before validating it and return the transformed value. The function firing the callback still returns the validator's type-predicate:
```typescript
import { transform } from 'jet-schema';

const customTest = transform(JSON.parse, isNumberArray);
let val = '[1,2,3,5]';
console.log(customTest(val, transVal => val = transVal)); // => true
console.log(val); // => [1,2,3,5] this is number array not a string
```


### Using Partial Schemas
For whatever reason, your schema may end up existing in multiple places. If you want to declare a partial schema, you can import the `TJetSchema` type and use it to setup one, then merge it with your full schema later.

```typescript
import schema, { TJetSchema } from 'jet-schema';

const PartialSchema: TJetSchema<{ id: number, name: string }> = {
  id: isNumber,
  name: isString,
} as const;

const FullSchema = schema<{ id: number, name: string, e: boolean }>({
  ...PartialSchema,
  e: isBoolean,
});

console.log(FullSchema.new());
```


### Bonus Features
- When passing the `Date` constructor, `jet-schema` automatically converts all valid date values (i.e. string/number ) to a `Date` object. The default value will be a current datetime `Date` object.
- You can also use an enum as a validator. The default value will be the first value in the enum object and the validation will make sure the value is a value in the enum.
