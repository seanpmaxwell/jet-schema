# Jet-Schema ✈️
> Simple, zero-dependency, typescript-first schema validation tool, that lets you integrate your own validator-functions.


## Table of contents
- [Introduction](#introduction)
- [Quick Glance](#quick-glance)
- [Guide](#guide)
  - [Getting Started](#getting-started)
  - [Making schemas optional/nullable](#making-schemas-opt-null)
  - [Transforming values with transform()](#transforming-values-with-transform)
  - [Combining Schemas](#combining-schemas)
  - [Bonus Features](#bonus-features)
- [Misc Notes](#misc-notes)
  - [Validating properties which may be undefined](#validating-properties-which-may-be-undefined)
  - [Recommended Defaults](#recommended-defaults)


## Introduction <a name="introduction"></a>
Most schema validation libraries have fancy functions for validating objects and their properties, but the problem is I usually already have a lot of my own custom validation logic specific for each of my applications (i.e. functions to check primitive-types, regexes for validating strings etc). The only thing that was making me use schema-validation libraries was trying to validate an object schema. So I thought, why not figure out a way to integrate my all the functions I had already written with something that can validate them against object properties? Well **jet-schema** does just that :)
<br/>

If you want a library that includes all kinds of special functions for validating things other than objects, **jet-schema** is probably not for you. However, the vast majority of projects I've worked on have involved implementing lots of type-checking functions specific to the needs of that project. For example, maybe the email format that's built into the library is different than the one your application needs. Instead of of having to dig into the library's features to validate using your custom method, with **jet-schema** you can just pass your method.
<br/>

> If you're open to `jet-schema` but think writing your own validator functions could be a hassle, you can copy-n-paste the file (https://github.com/seanpmaxwell/ts-validators/blob/master/src/validators.ts) into your application and add/remove validators as needed.

Reasons to use Jet-Schema 😎
- TypeScript first!
- Quick, terse, simple, easy-to-use (there are only 3 function exports and 2 type exports).
- Much smaller and less complex than most schema-validation libraries.
- Typesafety works both ways, you can either force a schema structure using a pre-defined type OR you can infer a type from a schema.
- `new` and `test` functions provided automatically on every new schema.
- Provides a `transform` wrapper function to modify values before validating them.
- Works client-side or server-side.
- Enums can be used for validation.
- Date constructor can be used to automatically transform and validate any valid date value.
- Doesn't require a compilation step (so still works with `ts-node`, unlike `typia`).


## Quick Glance <a name="quick-glance"></a>
```typescript
// An example using "zod", a popular schema validation library
const User: z.ZodType<IUser> = z.object({
  id: z.number().default(-1).min(-1),
  name: z.string().default(''),
  email: z.string().email().or(z.literal('')).default('x@x.x'),
  age: z.preprocess(Number, z.number()),
  created: z.preprocess((arg => arg === undefined ? new Date() : arg), z.coerce.date()),
  address: z.object({ 
    street: z.string(),
    zip: z.number(),
    country: z.string().optional(),
  }).optional(),
});

// Equivalent using "jet-schema" (other than "schema/transform", the other functions 
// must be defined elsewhere in your application)
const User = schema<IUser>({
  id: isRelKey,
  name: isString,
  email: ['x@x.x', isEmail],
  age: transform(Number, isNumber),
  created: Date,
  address: schema({
    street: isString,
    zip: isNumber,
    country: isOptionalStr,
  }, { optional: true }),
});
```


## Guide <a name="guide"></a>

### Getting Started <a name="getting-started"></a>

> npm install -s jet-schema

After installation, you need to configure the `schema` function by importing and calling the `jetSchema()` function.
<br/>

`jetSchema()` accepts an optional settings object with 3 three options:
  - `defaultValuesMap`: An `[["val", "function"]]`nested array specifying which default value should be used for which validator-function: you should use this option for frequently used validator-function/default-value combinations where you don't want to set a default value every time. Upon initialization, the validator-functions will check their defaults. If a value is not optional and you do not supply a default value, then an error will be thrown when the schema is initialized. If you don't set a default value for a function in the `jetSchema()` function, you can also pass a 2 length array of the default value and the validator-function when `schema` is called (the next 3 snippets below contain examples).
  - `cloneFn`: A custom clone-function if you don't want to use the built-in function which uses `structuredClone` (I like to use `lodash.cloneDeep`).
  - `onError`: If a validator-function fails then an error is thrown. You can override this behavior by passing a custom error handling function as the third argument. Function must have the format: `(property: string, value?: unknown) => void;`

> When setting up **jet-schema** for the first time, usually what I do is create two files under my `util/` folder: `schema.ts` and `validators.ts`. In `schema.ts` I'll import and call the `jet-schema` function then apply any frequently used validator-function/default-value combinations I have and a clone-function. If you don't want to go through this step, you can import the `schema` function directly from `jet-schema`.

```typescript
// "util/validators.ts"
// As mentioned in the intro, you can copy some validators from here (https://github.com/seanpmaxwell/ts-validators/blob/master/src/validators.ts)
export const isStr = (arg: unknown): arg is string => typeof param === 'string';
export const isOptStr = (arg: unknown): arg is string => arg === undefined || typeof param === 'string';
export const isNum = (arg: unknown): arg is string => typeof param === 'number';
```

> ⚠️ **IMPORTANT:**  &nbsp;  You need to use type-predicates when writing validator-functions. If a value can be `null`/`undefined`, your validator-function's type-predicate needs account for this (`i.e. (arg: unknown): arg is string | undefined => ... `).

```typescript
// "util/schema.ts"
import jetSchema from 'jet-schema';
import { isNum, isStr } from './validators';

export default jetLogger({
  defaultValuesMap: [
    [isNum, 0],
    [isStr, ''],
  ],
  cloneFn: // pass a custom clone-function here
  onError: // pass a custom error-handler here,
});
```

Now that we have our schema function setup, let's make a schema: there are two ways to go about this, enforcing a schema from a type or infering a type from a schema. I'll show you some examples doing it both ways.

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
  email: ['x@x.x', EMAIL_RGX.test] // You can pass your defaults/validators in an array instead.
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

Once you have your schema setup, you can call the `new`, `test`, and `pick` functions. Here is an overview of what each one does:
- `new` Allows you to create new instances of your type using partials. If the value is absent, `new` will use the default supplied. If no default is supplied, then the value will be skipped.
- `test` accepts any unknown value, tests that it's valid, and returns a type-predicate,.
- `pick` allows you to select any property and returns an object with the `test` and `default` functions. If a value is optional, then you need to use an optional-chaining when calling it (i.e. `pick("some optional property")?.test("")` because typescript won't know if you've set that property in the schema.

> **IMPORTANT:** If an object property is a mapped-type, then it must be initialized with the `schema` function. Just like with the parent schemas, you can also call `new`, `test`, `pick`, in addition to `default`. The value returned from `default` could be different from `new` if the schema is optional/nullable and the default value is `null` or `undefined`.


### Making schemas optional/nullable <a name="making-schemas-opt-null"></a>
In addition to a schema-object, the `schema` function accepts an additional **options** object parameter. The values here are type-checkd against the generic (`schema<"The Generic">(...)`) that was passed so you must used the correct values. If your generic is optional/nullable then your are required to pass the object so at runtime the correct values are parsed.<nr/>

The third option `init` defines the behavior when a schema is a child-schema and is being initialized from the parent. If a child-schema is optional/nullable, maybe you don't want a nested object and just want it to be null or skipped entirely. If `init` is `null` then `nullable` must be `true`, if `false` then `optional` must be `true`.

```typescript
{
  optional?: boolean; // default "false", must be true if generic is optional
  nullable?: boolean; // default "false", must be true if generic is nullable
  init?: boolean | null; // default "true", must be undefined, true, or null if generic is not optional.
}
```

Here's an example of the options in use:

```typescript
// models/User.ts

interface IUser {
  id: number;
  name: string;
  address?: { street: string, zip: number } | null;
}

const User = schema<IUser>({
  id: isNumber,
  name: isString,
  address: schema({
    street: isString,
    zip: isNumber,
  }, { optional: true, nullable: true, init: false }),
})

User.new() // => { id: 0, name: '' }
```


### Transforming values with `transform()` <a name="transforming-values-with-transform"></a>
If you want to modify a value before it passes through a validator-function, you can import the `transform` function and wrap your validator function with it. `transform` accepts a transforming-function and a validator-function and returns a new validator-function (type-predicate is preserved) which will transform the value before testing it. When calling `new` or `test`, `transform` will modify the original object.
<br/>

If you want to access the transformed value yourself for whatever reason, you can pass a callback as the second argument to the returned validator-function and `transform` will supply the modified value to it. I've found `transform` can be useful for other parts of my application where I need to modify a value before validating it and then access the transformed value.
```typescript
import { transform } from 'jet-schema';

const modifyAndTest = transform(JSON.parse, isNumberArray);
let val = '[1,2,3,5]';
console.log(modifyAndTest(val, transVal => val = transVal)); // => true
console.log(val); // => [1,2,3,5] this is number array not a string
```


### Combining Schemas <a name="combining-schemas"></a>
For whatever reason, your schema may end up existing in multiple places. If you want to declare part of a schema that will be used elsewhere, you can import the `TJetSchema` type and use it to setup one, then merge it with your full schema later.

```typescript
import schema, { TJetSchema } from 'jet-schema';

const PartOfASchema: TJetSchema<{ id: number, name: string }> = {
  id: isNumber,
  name: isString,
} as const;

const FullSchema = schema<{ id: number, name: string, e: boolean }>({
  ...PartOfASchema,
  e: isBoolean,
});

console.log(FullSchema.new());
```


### Bonus Features <a name="bonus-features"></a>
- When passing the `Date` constructor, `jet-schema` automatically converts all valid date values (i.e. string/number ) to a `Date` object. The default value will be a `Date` object with the current datetime.
- You can also use an enum as a validator. The default value will be the first value in the enum object and validation will make sure it is an enum value.
<br>


## Misc Notes <a name="misc-notes"></a>

### Validating properties which may be undefined <a name="validating-properties-which-may-be-undefined"></a>
As mentioned in the guide, if a property is optional, then the value returned from `pick()` might be undefined. If you know based on context (because you set a property in the `schema` function), and you don't want to have to do optional calling everytime (i.e. `pick("some optional property")?.test(...)`), then I recommend adding a wrapper function to your schema:
```typescript
// models/User.ts

interface IUser {
  id: number;
  address?: { street: string } | null;
}

const User = schema<IUser>({
  id: isNumber,
  address: schema({
    street: isString,
  }, { optional: true, nullable: true }),
})

// Wrapper function: this is also handy for when we want to validate a 
// child object without allowing null as a possible value.
function checkAddr(arg: unknown): arg is NonNullable<IUser['address']> {
  if (arg === null || arg === undefined) {
    return false;
  }
  return User.pick('address')!.test(arg);
}

export default {
  checkAddr,
  ...User,
}
```

### Recommended Defaults <a name="recommended-defaults"></a>
When calling the `jetSchema` function for this first time, at the very least, I highly recommend you set these default values for each of your basic primitive validator functions, unless of course your application has some other specific need.
```typescript
// util/schema.ts
import { isNum, isStr, isBool } from 'util/type-checks';

export default jetLogger({
  defaultValuesMap: [
    [isNum, 0],
    [isStr, ''],
    [isBool, false],
  ],
});
```
