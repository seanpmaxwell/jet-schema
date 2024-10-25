# Jet-Schema ✈️ 📝
> Simple, zero-dependency, typescript-first schema validation tool, that lets you use your own validation functions (inferring types included!).
<br/>


## Introduction 🚀
Most schema validation libraries have fancy functions for validating object properties (i.e. `zod.string().email()`) but problem is I already had a lot of my own custom validation logic specific to my application (i.e. functions to check primitive-types, regexes for validating strings etc). The only thing that was making me use schema-validation libraries was trying to validate object properties. So I thought, why not figure out a way to integrate my all the functions I had already written with something that can validate them against object properties? Well **jet-schema** does just that :)
<br/>

If you want a library that includes all kinds of special functions for validating things other than objects **jet-schema** is probably not for you. However, the vast majority of projects I've worked on have involved implementing lots of type checking functions specific to the needs of that project. For example, maybe the email format that's built into the library is different that the one your application needs. Instead of of having to dig into the library's features to validate using your custom method, with **jet-schema** you can just pass your method.
<br/>

Reasons to use Jet-Schema
- TypeScript first!
- Quick, terse, simple, easy-to-use (there are only 3 function exports and 2 type exports).
- Much smaller and less complex than most schema-validation libraries.
- Typesafety works both ways, you can either force a schema-type when the `schema` function is called OR you can infer a type from a schema.
- Set a default value for any validation-function you may wanna reuse.
- Provides a `transform` wrapper function to modify values after before validating them.
- When passing the `Date` constructor, automatically converts all valid date values to a `Date` object.
- `new` and `test` functions provided automatically on every new `schema`.
- Works client-side or server-side.
- Doesn't require a compilation step (so still works with `ts-node`, unlike `typia`).
<br/>


## Preview 👀
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

### Getting Started 🚦
First you need to initialize the `schema` function by importing the `jet-logger` function. 
- `jetSchema` accepts two optional arguments:
  - an array-map of which default-value should be used for which validator-function: you should use this option for frequently used validator-function/default-value combinations where you don't want to set a default value every time.
  - The second is a custom clone function if you don't want to use the built-in function which uses `structuredClone` (I like to use `lodash.cloneDeep`).
<br/>

When setting up **jet-schema** for the first time, usually what I do is create two files under my `util/` folder: `schema.ts` and `validators.ts`. In `schema.ts` I'll import and call the `jet-schema` function and apply any frequently used validator-function/default-value I have. If you don't want to go through this step you can import the `schema` function directly from `jet-schema`.
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
  [isNum, 0],
  [isStr, ''],
], '...pass a custom clone function here if you want to...');
```
<br/>

Now that we have our schema function let's make a schema: there are two ways to go about this. I usually like to create an interface first cause I feel like they are great way to document your data types BUT some people would rather setup their schemas first and infer their types from that. I'll show you some examples doing both.
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
  // You can pass your defaults/validators in an array instead.
  email: ['', ((arg: str) => EMAIL_RGX.test(arg))]
  // NOTE: we don't have to pass this option since its optional
  nickName: isOptionalStr,
})

// **OPTION 2**: Create type using schema
const User = schema({
  id: isNum,
  name: isStr,
  nickName: isOptionalStr,
})
const TUser = inferType<typeof User>;
```
<br/>

**IMPORTANT:** Upon initialization, the validator-functions will check their defaults. If a value is not optional and you do not supply default value, then an error will be thrown when `schema` is called.
<br/>

Once you have you schema setup, you can call the `new`, `test`, and `pick` functions. Here is an overview of what each one does:
- `new` Allows you to create new instances of your type using partials. If the value is absent, `new` will using the default supplied. If no default is supplied then the value will be skipped.
- `test` accepts any unknown value, returns a type-predicate and will test it against the `schema`.
- `pick` allows you to select property and returns an object with the `test` and `default` functions. If a value is nullable, then you need to use optional guard when calling it: `pick?.()`
- If an object property is a mapped-type then it must be initialized with the schema function. Just like with the parent schemas, you can also call `new`, `test`, `pick`, in addition to `default`. The value returned from `default` could be different from `new` if the schema is optional/nullable and the default 


### Make schemas optional/nullable ❔
In additiona to a schema-object the `schema()` function accepts 3 additional parameters `isOptional`, `isNullable`, and `default`. These are type-checked against the type supplied to schema `schema<...Your Type...>()`, so you must supply the correct parameters. So for example, if the schema-type is nullable or optional, then you must enter `true` for the second and third parameters.<br/>

The third option `default` defines the behavior for nested schemas when initialized from a parent. The value can be a `boolean` or `null`. If `false` or `undefined` the value will not be initialized with the parent, if `null` (schema must be nullable) value will be `null`, and if `true` then a full schema object will be created. 


### Transforming values with `transform()` 🤖
If you want to modify a value before it passes through a validator function, you can import the `transform` function and wrap your validator function with it. `transform` calls the validator function and fires a callback with the modified value if the callback was provided. When calling `new` or `test`, `transform` will modify the object being used as an argument in. I've found `transform` can be useful for other parts of my application where I need to modify a value before validating it and returning the transformed value. The function firing the callback still returns a type-predicate.
```typescript
import { transform } from 'jet-schema';

const customTest = transform(JSON.parse, isNumberArray);
console.log(customTest('[1,2,3,5]', transVal => console.log(transVal)));
```


### Using Partial Schemas
For whatever reason, your schema may end up existing in multiple places. If you want to declare a partial schema, you can import the `TJetSchema` type and use it to setup a partial type, the merge that type with your full schema later.

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