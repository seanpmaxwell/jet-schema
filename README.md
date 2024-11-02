# Jet-Schema ✈️
> Simple, zero-dependency, typescript-first schema validation tool, that lets you integrate your own validator-functions.


## Table of contents
- [Introduction](#introduction)
- [Quick Glance](#quick-glance)
- [Guide](#guide)
  - [Getting Started](#getting-started)
  - [Creating Custom Schemas](#creating-custom-schemas)
  - [Child schemas](#child-schemas)
  - [Making schemas optional/nullable](#making-schemas-opt-null)
  - [Combining Schemas](#combining-schemas)
  - [TypeScript Caveats](#typescript-caveats)
  - [Bonus Features](#bonus-features)
- [Miscellaneous Notes](#misc-notes)
  - [Creating wrapper functions](#creating-wrapper-functions)
  - [Recommended Defaults](#recommended-defaults)
<br/>


## Introduction <a name="introduction"></a>
Most schema validation libraries have fancy functions for validating objects and their properties, but the problem is I already have a lot of my own custom validation functions specific for each of my applications that I also like to copy-n-paste a lot and modify as needed (i.e. functions to check primitive-types, regexes for validating strings etc). The only thing that was making me use schema-validation libraries was trying to validate an object. So I thought, why not figure out a way to integrate my all the functions I had already written with something that can validate them against object properties? Well **jet-schema** does just that :)
<br/>

If you want a library that includes all kinds of special functions for validating things other than objects, **jet-schema** is probably not for you. However, the vast majority of projects I've worked on have involved implementing lots of type-checking functions specific to the needs of that project. For example, maybe the email format that's built into the library is different than the one your application needs. Instead of of having to dig into the library's features to run validations specific to your needs, with **jet-schema** you can just pass your method.
<br/>

> If you're open to `jet-schema` but think writing your own validator functions could be a hassle, you can copy-n-paste the file (https://github.com/seanpmaxwell/ts-validators/blob/master/src/validators.ts) into your application and add/remove/edit validators as needed.

### Reasons to use Jet-Schema 😎
- Use your own validator-functions with schema-validation (this is why I wrote it).
- TypeScript first!
- Quick, terse, simple, easy-to-use (this library only exports 2 functions and 2 types).
- Much smaller and less complex than most schema-validation libraries.
- Typesafety works both ways, you can either force a schema structure using a pre-defined type OR you can infer a type from a schema.
- `new`, `test`, `parse` functions provided automatically on every new schema.
- Setting defaults and transforming values can be set globally on initial setup or at the schema-level.
- Works client-side or server-side.
- Enums can be used for validation.
- `Date` constructor can be used to automatically transform and validate any valid date value.
- Doesn't require a compilation step (so still works with `ts-node`, unlike `typia`).
<br/>


## Quick Glance <a name="quick-glance"></a>
```typescript
import schema from 'utils/schema';
import { isRelKey, isString, isNumber, isOptionalStr } from 'utils/validators';

interface IUser {
  id: number;
  name: string;
  email: string;
  age: number;
  created: Date;
  address?: {
    street: string;
    zip: number;
    country?: string;
  };
}

const User = schema<IUser>({
  id: isRelKey,
  name: isString,
  email: { fn: isEmail, default: 'x@x.com' },
  age: { fn: isNumber, transform: Number },
  created: Date,
  address: schema<IUser['address']>({
    street: isString,
    zip: isNumber,
    country: isOptionalStr,
  }, { optional: true }),
});
```
<br/>


## Guide <a name="guide"></a>

### Getting Started <a name="getting-started"></a>

Note that at the heart of `jet-schema` are **validator-functions**. Since functions are objects in javascript, and objects are pass by reference, `jet-schema` will map certain settings to validator-functions by using the functions themselves as a reference. This is what enables you to pass your existing validator-functions to your schema without have to deal with the library's features everytime.

> npm install -s jet-schema

After installation, you need to configure the `schema` function by importing and calling `jetSchema()`. 
<br/>

`jetSchema()` accepts an optional settings object with 3 three properties:
  - `globals?`: An array of **validator-objects**, which set certain default settings for specific validator-functions. You should use this option for frequently used validator-function/default/transform combinations where you don't want to set a default value or transform-function every time. Upon initialization, the validator-functions will check their defaults. If a value is not optional and you do not supply a default value, then an error will occur when the schema is initialized. If you don't set a default value for a validator-function in `jetSchema()`, you can also do so when setting up an individual schema (the next 3 snippets below contain examples).<br/>
  
  The format for a **validator-object** is:
  ```typescript
  {
    fn: <T>(arg: unknown) => arg is T; // a validator-function
    default?: T; // the value to use for the validator-function
    transform?: (arg: unknown) => T; // modify the value before calling the validator-function
    onError?: (property: string, value?: unknown, moreDetails?: string, schemaId?: string) => void; // Custom error message for the function
  }
  ```
  - `cloneFn?`: A custom clone-function if you don't want to use the built-in function which uses `structuredClone` (I like to use `lodash.cloneDeep`).
  - `onError?`: A global error handler. By default, if a validator-function fails then an error is thrown. You can override this behavior by passing a custom error handling function as the third argument. This feature is really useful for testing when you may want to return an error string instead of throw an error.
    - Format: `(property: string, value?: unknown, origMessage?: string, schemaId?: string) => void;`. 

When setting up **jet-schema** for the first time, usually what I do is create two files under my `util/` folder: `schema.ts` and `validators.ts`. In `schema.ts` I'll import and call the `jet-schema` function then apply any globals and a custom clone-function. If you don't want to go through this step, you can import the `schema` function directly from `jet-schema`.

```typescript
// "util/validators.ts"
// As mentioned in the intro, you can copy some predefined validators from here (https://github.com/seanpmaxwell/ts-validators/blob/master/src/validators.ts)
export const isStr = (arg: unknown): arg is string => typeof param === 'string';
export const isOptStr = (arg: unknown): arg is string => arg === undefined || typeof param === 'string';
export const isNum = (arg: unknown): arg is string => typeof param === 'number';
```

> ⚠️ **IMPORTANT:**  &nbsp;  You need to use type-predicates when writing validator-functions. If a value can be `null/undefined`, your validator-function's type-predicate needs account for this (`i.e. (arg: unknown): arg is string | undefined => ... `).

```typescript
// "util/schema.ts"
import jetSchema from 'jet-schema';
import { isNum, isStr } from './validators';

export default jetLogger({
  globals: [
    { fn: isNum, default: 0 },
    { fn: isStr, default: '' },
  ],
  cloneFn: () => ... // pass a custom clone-function here if you want
  onError: () => ... // pass a custom error-handler here if you want,
});
```

### Creating custom schemas <a name="creating-custom-schemas"></a>

Now that we have our `schema` function setup, let's make a schema. Simply import the `schema` function from `util/schema.ts` and your existing validator-functions, then pass them as the value to each property in the `schema` function or use a validator-object. The format for a validator-object is the same both locally and globally (see above). All local-settings will for a validator-function will overwrite the global ones. Remember that if a property is required then a default must be set for its validator-function (locally or globally) or else `new` won't know what to use as a value when passing a partial.<br/>

For handling an individual schema's type, there are two ways to go about this, enforcing a schema from a type or infering a type from a schema. I'll show you an example of doing it both ways. 

> Personally, I like to create an interface first cause I feel like interfaces are great way to document your data-types; however, I created `inferType` because I know some people prefer to setup their schemas first and infer their types from that.

```typescript
// "models/User.ts"
import { inferType } from 'jet-schema';
import schema from 'util/schema.ts';
import { isNum, isStr, isOptionalStr } from 'util/validators.ts';

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
  email: { fn: isEmail, default: '' },
  nickName: isOptionalStr,
})

// **OPTION 2**: Create type using schema
const User = schema({
  id: isNum,
  name: isStr,
  email: { fn: isEmail, default: '' },
  nickName: isOptionalStr,
})
const TUser = inferType<typeof User>;
```

Once you have your custom schema setup, you can call the `new`, `test`, `pick`, and `parse` functions. Here is an overview of what each one does:
- `new` allows you to create new instances of your type using partials. If the property is absent, `new` will use the default supplied. If no default is supplied and the property is optional, then the value will be skipped. Runtime validation will still be done on every incoming property. Also, if you pass no parameter then a new instance will be created using all the defaults.
- `test` accepts any unknown value, tests that it's valid, and returns a type-predicate.
- `pick` allows you to select any property and returns an object with the `test` and `default` functions.
- `parse` is like a combination of `new` and `test`. It accepts an `unknown` value which is not optional, validates the properties but returns a new instance (while removing an extra ones) instead of a type-predicate. If you have an incoming unknown value (i.e. an api call) and you want to validate the properties and return a new cleaned instance, use `parse`. Note: only objects will pass the `parse` function, even if a schema is nullish, `null/undefined` values will not pass.


### Making schemas optional/nullable <a name="making-schemas-opt-null"></a>
In addition to a schema-object, the `schema` function accepts an additional **options** object parameter. The values here are type-checked against the generic (`schema<"The Generic">(...)`) that was passed so you must use the correct values. If your generic is optional/nullable then your are required to pass the object so at runtime the correct values are parsed.
```typescript
{
  optional?: boolean; // default "false", must be true if generic is optional
  nullable?: boolean; // default "false", must be true if generic is nullable
  init?: boolean | null; // default "true", must be undefined, true, or null if generic is not optional.
  nullish?: true; // Use this instead of "{ optional: true, nullable: true; }"
  id?: string; // Will identify the schema in error messages
}
```

The option `init` defines the behavior when a schema is a child-schema and is being initialized from the parent. If `true (default)`, then a nested child-object will be added to the property when a new instance of the parent is created. However, if a child-schema is optional or nullable, maybe you don't want a nested object and just want it to be `null` or skipped entirely. If `init` is `null` then `nullable` must be `true`, if `false` then `optional` must be `true`.<br/>

In the real world it's very common to have a lot of schemas which are both optional, nullable. So you don't have to write out `{ optional: true, nullable: true }` over-and-over again, you can write `{ nullish: true }` as an shorthand alternative.<br/>

You can also set the optional `id` field, if you need a unique identifier for your schema for whatever reason. If you set this option then it will be added to the default error message. This can be useful if you have to debug a bunch of schemas at once (that's pretty much all I use it for).

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
  address: schema<IUser['address']>({
    street: isString,
    zip: isNumber,
  }, { nullish: true, init: false, id: 'User_address' }),
})

User.new() // => { id: 0, name: '' }
```


### Child (aka nested) schemas <a name="child-schemas"></a>
- If an object property is a mapped-type, then it must be initialized with the `schema` function.
- Just like with the parent schemas, you can also call `new`, `test`, `pick`, `parse` in addition to `default`. Note: the value returned from `default` could be different from `new` if the schema is optional/nullable and the default value is `null` or `undefined`.
- There is one extra function `schema()` that you can call when using `pick` on a child-schema. This can be handy if you need to export a child-schema from one parent-schema to another:
```typescript
interface IUser {
  id: number;
  address?: { street: string, city: string };
}

const User = schema<IUser>({
  id: isNumber,
  address: schema<IUser['address']>({
    street: isStr,
    city: isString
  }, { optional: true, init: false }),
});

User.pick('address').default() // => undefined because we said "init: false"
User.pick('address').new() // { street: '', city: '' }

interface IUserAlt {
  id: number;
  address?: IUser['address'];
}

const UserAlt = schema<IUserAlt>({
  id: isNumber,
  address: User.pick('address').schema(),
});
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


### TypeScript Caveats <a name="typescript-caveats"></a>
Due to how structural-typing works in typescript, there are some limitations with typesafety that you need to be aware of. To put things in perspective, if type `A` has all the properties of type `B`, we can use type `A` for places where type `B` is required, even if `A` has additional properties.

**Validator functions**<br/>
If an object property's type can be `string | undefined`, then a validator-function whose type-predicate only returns `arg is string` will still work. However a if a type predicate returns `arg is string | undefined` we cannot use it for type `string`. This could cause runtime issues if a you pass a validator function like `isString` (when you should have passed `isOptionalString`) to a property whose value ends up being `undefined`.
```typescript
interface IUser {
  id: string;
  name?: string;
}

const User = schema<IUser>({
  id: isString, // "isOptionalString" will throw type errors
  name: isOptionalString, // "isString" will not throw type errors but will throw runtime errors
})
```

**Child schemas**<br/>
As mentioned, if a property in a parent is mapped-object type (it has a defined set of keys), then you need to call `schema` again for the nested object. If you don't use a generic on the child-schema, typescript will still make sure all the required properties are there; however, because of structural-typing the child could have additional properties. It is highly-recommended that you pass a generic to your child-objects so additional properties don't get added.
```typescript
interface IUser {
  id: number;
  address?: { street: string } | null;
}

const User = schema<IUser>({
  id: isNumber,
  address: schema<IUser['address']>({
    street: isString,
    // foo: isString, // If we left off the generic <IUser['address']> we could add "foo"
  }, { nullish: true }),
});
```
> If you know of a way to enforce typesafety on child-object without requiring a generic please make a pull-request because I couldn't figure out a way.


### Bonus Features <a name="bonus-features"></a>
- When passing the `Date` constructor, `jet-schema` sets the type to be a `Date` object and automatically converts all valid date values (i.e. `string/number`, maybe a `Date` object got stringified in an API call) to a `Date` object. The default value will be a `Date` object with the current datetime. 
- You can also use an enum as a validator. The default value will be the first value in the enum object and validation will make sure it is value of that enum.
<br>


## Miscellaneous Notes <a name="misc-notes"></a>

### Creating wrapper functions <a name="creating-wrapper-functions"></a>
If you need to modify the value of the `test` function for a property, (like removing `nullables`) then I recommended merging your schema with a new object and adding a wrapper function around that property's test function.

```typescript
// models/User.ts
import { nonNullable } from 'util/validators.ts';

interface IUser {
  id: number;
  address?: { street: string, zip: number } | null;
}

const User = schema<IUser>({
  id: isNumber,
  address: schema<IUser['address']>({
    street: isString,
    zip: isNumber,
  }, { nullish: true }),
})

export default {
  // Wrapper function to remove nullables
  checkAddr: nonNullable(User.pick('address').test),
  ...User,
}
```

### Recommended Defaults <a name="recommended-defaults"></a>
When calling the `jetSchema` function for this first time, at the very least, I highly recommend you set these default values for each of your basic primitive validator functions, unless of course your application has some other specific need.
```typescript
// util/schema.ts
import { isNum, isStr, isBool } from 'util/validators.ts';

export default jetLogger({
  globals: [
    { fn: isNum, default: 0 },
    { fn: isStr, default: '' },
    { fn: isBool, default: false },
  ],
});
```
