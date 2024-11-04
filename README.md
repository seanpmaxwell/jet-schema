# Jet-Schema ✈️
> Simple, zero-dependency, typescript-first schema validation tool, with a focus on using your own custom validator functions.


## Table of contents
- [Introduction](#introduction)
- [Quick Glance](#quick-glance)
- [Guide](#guide)
  - [Getting Started](#getting-started)
  - [Global Settings](#global-settings)
  - [Creating Schemas](#creating-schemas)
  - [Schema Options](#schema-options)
  - [Child schemas](#child-schemas)
  - [Combining Schemas](#combining-schemas)
  - [TypeScript Caveats](#typescript-caveats)
  - [Bonus Features](#bonus-features)
- [Tips](#tips)
  - [Creating wrapper functions](#creating-wrapper-functions)
  - [Recommended Global Settings](#recommended-global-settings)
- [Author's Notes](#authors-notes)

<br/>


## Introduction <a name="introduction"></a>
**jet-schema** is a simple, TypeScript first schema validation tool, which enables you to use your own validator functions against each property in an object. That way you don't have to refer to documentation everytime you want to validate some new object property. It also means you get to grow a list of TypeScript validator functions that aren't tied to a specific library. 

> If you're open to `jet-schema` but think writing your own validator-functions could be a hassle, you can copy-n-paste the file (https://github.com/seanpmaxwell/ts-validators/blob/master/src/validators.ts) into your application and add/remove/edit validators as needed.


### Reasons to use Jet-Schema 😎
- Focus is on using your own validator-functions to validate object properties.
- TypeScript first!
- Fast, terse, simple, small (this library only exports 2 functions and 2 types, minified size is **4.56 KB**).
- Less complex than nearly every other schema-validation library.
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
  id: isNumber,
  name: isString,
  email: { vf: isEmail, default: 'x@x.com' },
  age: { vf: isNumber, transform: Number },
  created: Date,
  address: schema<IUser['address']>({
    street: isString,
    zip: isNumber,
    country: isOptionalStr,
  }, { optional: true }),
});

User.new({ id: 5 }) // => 
// {
//   id: 5,
//   name: '',
//   email: 'x@x.com',
//   age: 0,
//   created: 2024-11-04T04:43:33.072Z,
//   address: {
//     street: '',
//     zip: 0,
//   }
// }

User.test('asdf')) // => "false"
console.log(User.pick('address').pick('zip').test(123)) // => "true"
console.log(User.parse('something')) // **ERROR**
```
<br/>


## Guide <a name="guide"></a>

### Getting Started <a name="getting-started"></a>

> npm install -s jet-schema

Validator-functions can be passed directly or within a settings-object, so you can do more than just validate an object property. Validator-functions settings can be done at the **global-level**, so you don't have to configure them for every new schema or when a schema is initialized **local-level**.  

A settings object (NOTE validator-functions must return type-predicates):
```typescript
{
  vf: <T>(arg: unknown) => arg is T; // a "vf" => "validator function", 
  default?: T; // the default value for the validator-function
  transform?: (arg: unknown) => T; // modify the value before calling the validator-function
  onError?: (property: string, value?: unknown, moreDetails?: string, schemaId?: string) => void; // Custom error message for the function
}
```

Settings object in use:
```typescript
const User = schema<IUser>({
  id: {
    vf: (arg: unknown) => isNum(arg) && arg > -1,
    transform: (arg: unknown) => Number(arg),
    default: -1,
    onError: (prop: string) => `Property "${prop}" was not a valid id.`
  },
  name: isString,
});
```


### Global Settings <a name="global-settings"></a>
You can configure global settings by importing and calling the `jetSchema` function which returns a function with your global-settings saved. If you don't want to use global settings you can import the `schema` function directly from `jet-schema`.

```typescript
import jetSchema, {
  schema, // Use this if you don't want configure global settings.
} from 'jet-schema';
import { isNum, isStr } from './validators';

// Global settings
export default jetLogger({
  globals?: [
    { vf: isNum, default: 0 },
    { vf: isStr, default: '' },
  ],
  cloneFn?: () => ... // use a custom clone-function
  onError?: () => ... // pass a custom error-handler,
});
```

Global settings explained:
  - `globals`: An array of settings-objects, which map certain global settings for specific validator-functions. Use this option for frequently used validator-function settings you don't want to configure every time.
  - `cloneFn`: A custom clone-function, the default clone function uses `structuredClone` (I like to use `lodash.cloneDeep`).
  - `onError`: A global error handler, the default error-handler throws an error.
    - Format is: `(property: string, value?: unknown, origMessage?: string, schemaId?: string) => void;`. 


### Creating schemas <a name="creating-schemas"></a>

Using the function returned from `jetSchema` or the `schema` function from the library, call the function and pass an object with a key for each property you are trying to validate, with the value being a validator-function or a settings-object. For handling a schema's type, you can enforce a schema from a type or infering a type from a schema.

Create a schema using a type:
```typescript
interface IUser {
  id: number;
  name: string;
  email?: string;
}

const User = schema<IUser>({
  id: isNum,
  name: isStr,
  email: isOptionalStr,
});
```

Create a type using a schema:
```typescript
const User = schema({
  id: isNum,
  name: isStr,
  email: isOptionalStr,
});

const TUser = inferType<typeof User>;
```
<br/>

Once you have your custom schema setup, you can call the `new`, `test`, `pick`, and `parse` functions:
> Note: the following examples assume you set `0` as the default for `isNum`, `''` for `isStr`, and nothing for `isOptionalStr`.
<br/>

- `new` allows you to create new instances of your type using partials. If the property is absent, `new` will use the default supplied. If no default is supplied and the property is optional, then the value will be skipped. Runtime validation will still be done on every incoming property:
```typescript
User.new(); // => { id: 0, name: '' }
User.new({ id: 5 }); // => { id: 5, name: '' }
User.new({ name: 'john' }); // => { id: 0, name: 'john' }
User.new({ id: 1, name: 'a', email: 'b@b' }); // => { id: 1, name: 'a', email: 'b@b' }
```

- `test` accepts any unknown value, tests that it's valid, and returns a type-predicate:
```typescript
User.test(); // => throws Error
User.test({ id: 5, name: 'john' }); // => arg is IUser
User.new({ name: 'john' }); // => throws Error
User.new({ id: 1, name: 'a', email: 'b@b' }); // => arg is IUser
```

- `pick` allows you to select any property and returns an object with the `test` and `default` functions.
```typescript
  // pick up here
```

- `parse` is like a combination of `new` and `test`. It accepts an `unknown` value which is not optional, validates the properties but returns a new instance (while removing an extra ones) instead of a type-predicate. Note: only objects will pass the `parse` function, even if a schema is nullish, `null/undefined` values will not pass.


### Schema options <a name="schema-options"></a>
In addition to a schema-object, the `schema` function accepts an additional **options** object parameter. The values here are type-checked against the generic (`schema<"The Generic">(...)`) that was passed so you must use the correct values. If your generic is optional/nullable then your are required to pass the object so at runtime the correct values are used.
```typescript
{
  optional?: boolean; // default "false", must be true if generic is optional
  nullable?: boolean; // default "false", must be true if generic is nullable
  init?: boolean | null; // default "true", must be undefined, true, or null if generic is not optional.
  nullish?: true; // Use this instead of "{ optional: true, nullable: true; }"
  id?: string; // Will identify the schema in error messages
}
```

- 

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
If you want to declare part of a schema that will be used elsewhere, you can import the `TJetSchema` type and use it to setup a partial schema, then merge it with your full schema later.

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


## Tips <a name="tips"></a>

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

### Recommended Global Settings <a name="recommended-global-settings"></a>
I highly recommend you set these default values for each of your basic primitive validator functions, unless of course your application has some other specific need.
```typescript
// util/schema.ts
import { isNum, isStr, isBool } from 'util/validators.ts';

export default jetLogger({
  globals: [
    { vf: isNum, default: 0 },
    { vf: isStr, default: '' },
    { vf: isBool, default: false },
  ],
});
```
<br/>


## Author's Notes <a name="authors-notes"></a>
Most schema validation libraries have fancy functions for validating objects and their properties, but the problem is I already have a lot of my own custom validation functions specific for each of my applications that I also like to copy-n-paste a lot and modify as needed (i.e. functions to check primitive-types, regexes for validating strings etc). The only thing that was making me use schema-validation libraries was trying to validate an object. So I thought, why not figure out a way to integrate my all the functions I had already written with something that can validate them against object properties?
<br/>

I know some libraries like `zod` have functions such as `.refine()` which allow you to integrate custom validation logic. But this isn't quite the same because you could still chain additional validation logic onto `.refine` and you still have to look through the documentation to see how to do it. I wanted a library that allowed me to just slap in validator-functions that were not tied to any specific schema-validation library.
<br/>

If you want a library that includes all kinds of special functions for validating things other than objects, **jet-schema** is probably not for you. However, the vast majority of projects I've worked on have involved implementing lots of type-checking functions specific to the needs of that project. For example, maybe you use another datetime handling library other than JavasScript's `Date` object (i.e. `DayJs`). Instead of of having to dig into the library's features to accept `dayjs` objects as valid-objects, with **jet-schema** you can just drop in `dayjs.isValid`.
<br/>
