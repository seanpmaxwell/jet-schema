# Jet-Schema ✈️
> Simple, zero-dependency, typescript-first schema validation tool, with zero-overhead when it comes to custom validation.


## Table of contents
- [Introduction](#introduction)
- [Quick Glance](#quick-glance)
- [What is a validator function](#what-is-a-validator-function)
- [Comparison to other schema validation libraries](#comparison-to-others)
  - [Overview](#comparison-overview)
  - [Other perks](#other-perks)
- [Guide](#guide)
  - [Installation](#installation)
  - [Creating Schemas](#creating-schemas)
  - [Schema APIs](#schema-apis)
    - [.new](#new)
    - [.test](#test)
    - [.pick](#pick)
    - [.parse](#parse)
  - [Schema Options](#schema-options)
  - [Configuring settings](#configuring-settings)
    - [Parent settings](#parent-settings)
    - [Local settings](#local-settings)
  - [Combining Schemas](#combining-schemas)
  - [TypeScript Caveats](#typescript-caveats)
  - [Bonus Features](#bonus-features)
  - [Using jet-schema without TypeScript](#without-typescript)
  - [Combining jet-schema with parse from ts-validators](#parse-from-ts-validators)
- [Tips](#tips)
  - [Creating wrapper functions](#creating-wrapper-functions)
<br/>


## Introduction <a name="introduction"></a>
**jet-schema** is a simple, TypeScript first schema validation tool, which enables you to use your own validator functions against each property in an object. That way you don't have to refer to documentation everytime you want to validate some new object property. It also means you get to grow a list of TypeScript validator functions that aren't tied to a specific library. 

> If you're open to `jet-schema` but think writing your own validator-functions could be a hassle, you can copy-n-paste the file (https://github.com/seanpmaxwell/ts-validators/blob/master/src/validators.ts) into your application and add/remove/edit validators as needed.


### Reasons to use Jet-Schema 😎
- Focus is on using your own validator-functions to validate object properties.
- Enables extracting logic for nested schemas.
- Create new instances of your schemas using partials.
- Easy-to-learn, terse, and small (this library only exports 2 functions and 2 types, size **4.7kb** minified).
- Doesn't require a compilation step (so still works with `ts-node`, unlike `typia`).
- Fast! see these <a href="https://moltar.github.io/typescript-runtime-type-benchmarks/">benchmarks</a>.
- Typesafety works boths ways, you can infer a type from a schema or force a schema to have certain properties using a generic. 
- Works client-side or server-side.
- TypeScript first!
<br/>


## Quick Glance <a name="quick-glance"></a>
```typescript
import schema from 'utils/schema';
import { isString, isNumber } from 'utils/validators';

interface IUser {
  id: number;
  name: string;
  address: {
    street: string;
    zip: number;
  }
}

const User = schema<IUser>({
  id: isNumber,
  name: isString,
  address: schema({
    street: isString,
    zip: isNumber,
  })
});

User.new({ id: 5, name: 'joe' }) // => { id: 5, name: 'joe' }
User.test('asdf') // => false
User.pick('name').test('john') // => true
User.pick('address').pick('zip').test(234) // => true
User.parse('something') // => Error
```
<br/>


## What is a validator function <a name="what-is-a-validator-function"></a>

Let's first touch on what a *validator-function* is. A validator-functions is a function which performs both *runtime* AND *compile-time* validation. The typical way to define one is to give it a signature which receives an `unknown` value and returns a type-predicate if the value satisfies the given logic:
```typescript
function isNullishString(arg: unknown): param is string | undefined | null {
  return arg === undefined || arg === null || typeof arg === 'string';
}
```

Defining your own validator-functions is handy because it will save you a lot of boilerplate code when doing boolean logic throughout your application. With the above function we can do this: 
```typescript
if (isNullishString(someValue)) {
  // continue your logic...
} else {
  throw new Error('...')
}
```

Instead of having to do this:
```typescript
if (someValue === undefined || someValue === null || typeof someValue === 'string') {
  // continue your logic...
} else {
  throw new Error('...')
}
```

> I like to place all my validator-functions in a `util/validators.ts` file. As mentioned in the intro, you can copy some predefined validators from <a href="https://github.com/seanpmaxwell/ts-validators/blob/master/src/validators.ts">here</a>.

One final note, not only does creating a list of validator-functions save boilerplate code, but growing a list of validator-functions not dependent on any library will make them easy to copy-and-paste between multiple projects, saving you a lot of coding time down the line. For simple primitives like `isString`, `isNumber`, creating validators might seem trivial at first but once applications grow and you need to check if something is let's say `null`, `undefined` or `number[]` (i.e. `isNullishNumberArr`), you'll be glad you don't have to constantly redefine these functions. 
<br/>


## Comparison to other schema validation libraries <a name="comparison-to-others"></a>

### Overview <a name="comparison-overview"></a>
With most validation-libraries, if we wanted to use our `isNullishString` function above we'd have to refer to the library's documentation and typically wrap in some custom-handler function (i.e. zod's `.refine`). With jet-schema however, anytime we need to add a new property to your schema, you can just drop in a validator-function. This not only saves time but also makes your schema definitions way more terse. Let's looks at a some code where we setup a schema in `zod` and then again in `jet-schema`:
```typescript
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

// "zod"
const User: z.ZodType<IUser> = z.object({
  id: z.number().default(-1).min(-1),
  name: z.string().default(''),
  email: z.string().email().or(z.literal('')).default('x@x.x'),
  // OR if we had our own "isEmail" validator-function
  email: z.string().refine(val => isEmail(val)).default('x@x.x'),
  age: z.preprocess(Number, z.number()),
  created: z.preprocess((arg => arg === undefined ? new Date() : arg), z.coerce.date()),
  address: z.object({ 
    street: z.string(),
    zip: z.number(),
    country: z.string().optional(),
  }).optional(),
});

// "jet-schema"
const User = schema<IUser>({
  id: isRelationalKey,
  name: isString,
  email: { vf: isEmail, default: 'x@x.x' },
  age: { vf: isNumber, transform: Number },
  created: Date,
  address: schema<IUser['address']>({
    street: isString,
    zip: isNumber,
    country: isOptionalString,
  }, { optional: true }),
});
```

### Other Perks <a name="other-perks"></a>

**Size** (minified, not zipped):
- Jet-Schema **5kB**
- Zod **57kB**
- Yup **40kB**
- Joi **150kB**
- Valibot **35kB**
- **NOTE:** some of these could change as packages are updated

**Fast** (see these benchmarks <a href="https://moltar.github.io/typescript-runtime-type-benchmarks/">here</a>):<br/>
Checkout the benchmarks  and compare jet-schema to some other popular validators (one's which don't require a compilation step) like zod, valibot, and yup, etc. jet-schema is roughly 3 times as fast as zod and twice as fast as valibot for strict parsing tests. 
<br/>


## Guide <a name="guide"></a>

### Installation <a name="installation"></a>

> npm install -s jet-schema


## Creating schemas <a name="creating-schemas"></a>

Using the `schema` function exported from `jet-schema` or the function returned from calling `jetSchema(...)` if you configured parent settings (see the <a href="#parent-settings">Parent Settings</a> section), call the function and pass it an object with a key for each property you are trying to validate with the value being a validator-function or a settings-object (see the <a href="#configuring-settings">Configuring Settings</a> section for how to use settings-objects). For handling a schema's type, you can enforce a schema from a type or infer a type from a schema.

**Option 1:** Create a schema using a type:
```typescript
import { schema } from 'jet-schema';
import { isNum, isStr, isOptionalStr } from 'util/validators.ts';

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

**Option 2:** Create a type using a schema:
```typescript
import { schema } from 'jet-schema';
import { isNum, isStr, isOptionalStr } from 'util/validators.ts';

const User = schema({
  id: isNum,
  name: isStr,
  email: isOptionalStr,
});

const TUser = inferType<typeof User>;
```


## Schema APIs <a name="schema-apis"></a>
Once you have your custom schema setup, you can call the `.new`, `.test`, `.pick`, and `.parse` functions.

> NOTE: the following examples assume you set `0` as the default for `isNum`, `''` for `isStr`, and nothing for `isOptionalStr`. See the <a href="#configuring-settings">Configuring Settings</a> section for how to set default values.

### `.new` <a name="new"></a>
Allows you to create new instances of your type using partials. If the property is absent, `.new` will use the default supplied. If no default is supplied and the property is optional, then the value will be skipped. Runtime validation will still be done on every incoming property:
```typescript
User.new(); // => { id: 0, name: '' }
User.new({ id: 5 }); // => { id: 5, name: '' }
User.new({ id: 'asdf' }); // => Error
User.new({ name: 'john' }); // => { id: 0, name: 'john' }
User.new({ id: 1, name: 'a', email: 'b@b' }); // => { id: 1, name: 'a', email: 'b@b' }
```

### `.test` <a name="test"></a>
Accepts any unknown value, tests that it's valid, and returns a type-predicate:
```typescript
User.test(); // => Error
User.test({ id: 5, name: 'john' }); // => param is IUser
User.test({ name: 'john' }); // => Error
User.test({ id: 1, name: 'a', email: 'b@b' }); // => param is IUser
```

### `.pick` <a name="pick"></a>
Selects a property and returns an object with the `.test` and `.default` functions. If you use `.pick` on a child schema, you can also use the schema functions (`.new`, `.pick` etc), in addition to `.default`. Note that for a child-schema, `.default` could return a different value from `.new` if the default value is set to `null` or `undefined` (see the `init:` setting in the <a href="#schema-options">Schema Options</a> section).
```typescript
const User = schema<IUser>({
  id: isNum,
  address: schema<IUser['address'>({
    street: isStr,
    city: isStr,
  }, { init: null }),
});

User.pick('id').default(); // => "0"
User.pick('id').test(0); // => "true"
User.pick('id').test('asdf'); // => "false"
User.pick('address').new(); // => { street: '', city: '' }
User.pick('address').default(); // => "null"
User.pick('address').pick('city').test('asdf'); // => "true"
```

### `.parse` <a name="parse"></a>
Like a combination of `.new` and `.test`. It accepts an `unknown` value which is not optional, validates the properties but returns a new instance (while removing an extra ones) instead of a type-predicate. Note: only objects will pass the `.parse` function, even if a schema is nullish, `null/undefined` values will not pass.
```typescript
const User = schema<IUser>({
  id: isNum,
  name: isStr,
});

User.parse(); // => Error
User.parse({ id: 1, name: 'john' }); // => { id: 1, name: 'john' }
User.parse({ id: 1, name: 'john', foo: 'bar' }); // => { id: 1, name: 'john' }
User.parse({ id: '1', name: 'john' }); // => Error
```


## Schema options <a name="schema-options"></a>
In addition to a schema-object, the `schema` function accepts an additional **options** object parameter:
```typescript
const User = schema<IUser>({
  id: isNum,
  name: isStr,
}, /* { ...options object... } */); // <-- Pass options here
```

**options** explained:
  - `optional`: Default `false`, must be set to true if the generic is optional.
  - `nullable`: Default `false`, must be set to true if the generic is nullable.
  - `nullish`: Default `false`, convenient alternative to `{ optional: true, nullable: true; }`
  - `init`: Tells the parent what to do when the parent calls `.new`. There are 3 options:
    - `false`: Skip creating a child-object. The child-object must be `optional`.
    - `true`: Create a new child-object (Uses the child's `.new` function).
    - `null`: Set the child object's value to `null` (`nullable` must be true for the child).
  - `id`: A unique-identifier for the schema (useful if debugging a bunch of schemas at once).
  - `safety`: Value can be `'loose' (default), 'pass', or 'strict'`.
    - `loose`: Properties not in the schema will be filtered out but not trigger errors.
    - `pass`: Properties not in the schema will not be filtered out.
    - `strict`: Properties not in the schema will trigger errors.
    - **NOTE:** `safety` only applies to the `.test` and `.parse` functions, it does not affect `.new`. 

**options** example:
```typescript
type TUser = IUser | null | undefined;

const User = schema<TUser>({
  id: isNum,
  name: isStr,
}, {
  optional: true, // Must be true because TUser is `| undefined`
  nullable: true, // Must be true because TUser is `| null`
  nullish: true, // Alternative to { optional: true, nullable: true }
  init: false, // Can be "null", "false", or "true"
  id: 'User',
  safety: 'loose'
});
```


## Configuring settings <a name="configuring-settings"></a>

Validator-functions can be used alone or within a **settings-object**, which enables you to do more than just validate an object property. Settings can be configured at the **parent-level** (so you don't have to configure them for every new schema) or when a schema is initialized (**local-level**).  

Settings object overview:
```typescript
{
  vf: <T>(arg: unknown) => arg is T; // "vf" => "validator function", 
  default?: T; // the default value for the validator-function
  transform?: (arg: unknown) => T; // modify the value before calling the validator-function
  formatError?: (error: IError) => void; // Customize the error message for the function
}
```

Error format:
```typescript
{
  property?: string;
  value?: unknown;
  message?: string;
  location?: string; // function which is throwing the error
  schemaId?: string;
}
```


### Parent settings <a name="parent-settings"></a>

You can configure parent settings by importing and calling the `jetSchema` function which returns a function with your parent-settings saved:
```typescript
import jetSchema from 'jet-schema';
import { isNum, isStr } from './validators';

export default jetSchema({
  globals?: [
    { vf: isNum, default: 0 },
    { vf: isStr, default: '' },
  ],
  cloneFn?: () => ... // use a custom clone-function
  onError?: (errors: IError[]) => void // pass a custom error-handler,
});
```

Parent settings explained:
  - `globals`: An array of settings-objects, which map certain parent settings for specific validator-functions. Use this option for frequently used validator-function settings you don't want to configure every time.
  - `cloneFn`: A custom clone-function, the default clone function uses `structuredClone` (I like to use `lodash.cloneDeep`).
  - `onError`: Set what happens when the length of the errors array is greater than one.

### Local settings <a name="local-settings"></a>

To configure settings at the local-level, use them when creating a schema. All local-settings will override all parent ones; if you don't need the schema to have any parent settings you can import the `schema` function directly from `jet-schema`.<br/>

Local settings in detail:
```typescript
{
  vf: (arg: unknown) => arg is T;
  transform: (arg: unknown) => arg is T;
  default: T;
  formatError: (error: IError) => string | IError;
}
```

Local settings example:
```typescript
// Use this if you don't want use parent settings
// import { schema } from 'jet-schema';

// Where we set our parent settings
import schema from 'util/schema.ts';

const User = schema({
  id: {
    vf: isNum,
    transform: (arg: unknown) => Number(arg),
    default: -1,
    formatError: (error: IError) => `Property "id" was not a number. Value: ${value}.`
  },
  name: isStr,
});

// Local setting overwrote -1 as the default value for isNum whose parent default value was 0, 
// empty-string remains default for isStr
User.new() // => { id: -1, name: '' }
```


## Combining Schemas <a name="combining-schemas"></a>
If you want to declare part of a schema that will be used elsewhere, you can import the `TJetSchema` type and use it to setup a partial schema, then merge it with your full schema later:
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


## TypeScript Caveats <a name="typescript-caveats"></a>
Due to how structural-typing works in typescript, there are some limitations with typesafety that you need to be aware of. To put things in perspective, if type `A` has all the properties of type `B`, we can use type `A` for places where type `B` is required, even if `A` has additional properties.

#### <ins>Validator functions</ins>
If an object property's type can be `string | undefined`, then a validator-function whose type-predicate only returns `param is string` will still work. However a if a type predicate returns `param is string | undefined` we cannot use it for type `string`. This could cause runtime issues if a you pass a validator function like `isString` (when you should have passed `isOptionalString`) to a property whose value ends up being `undefined`:
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

#### <ins>Child schemas</ins>
As mentioned, if a property in a parent is a mapped-object type (it has a defined set of keys), then you need to call `schema` again for the nested object. If you don't use a generic on the child-schema, typescript will still make sure all the required properties are there; however, because of structural-typing the child could have additional properties. It is highly-recommended that you pass a generic to your child-objects so additional properties don't get added:
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


## Bonus Features <a name="bonus-features"></a>
- When passing the `Date` constructor, `jet-schema` sets the type to be a `Date` object and automatically converts all valid date values (i.e. `string/number`, maybe a `Date` object got stringified in an API call) to a `Date` object. The default value will be a `Date` object with the current datetime. 
- You can also use an `enum` as a validator. The default value will be the first value in the enum object and validation will make sure it is value of that enum. **IMPORTANT** this does not work for mixed enums see: `eslint@typescript-eslint/no-mixed-enums`


## Using jet-schema without TypeScript <a name="without-typescript"></a>
`jet-schema` is built in TypeScript for TypScript but can be used directly with plain JavaScript. There are two minified files you can import if you want to use plain javascript:
  - `dist/index.min.js`: CommonJS
  - `dist/index.min.mjs`: ESM (es6)
<br>


## Tips <a name="tips"></a>

### Creating wrapper functions <a name="creating-wrapper-functions"></a>
If you need to modify the value of the `.test` function for a property, (like removing `nullables`) then I recommended merging your schema with a new object and adding a wrapper function around that property's test function.
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

### Recommended Parent Settings <a name="recommended-parent-settings"></a>
I highly recommend you set these default values for each of your basic primitive validator functions, unless of course your application has some other specific need.
```typescript
import { isNum, isStr, isBool } from 'util/validators.ts';

export default jetSchema({
  globals: [
    { vf: isNum, default: 0 },
    { vf: isStr, default: '' },
    { vf: isBool, default: false },
  ],
});
```

### Combining jet-schema with `parse` from ts-validators <a name="parse-from-ts-validators"></a>
The before mentioned repo <a href="https://github.com/seanpmaxwell/ts-validators/blob/master">ts-validators</a> contains a function called `parse` (not to be confused with the jet-schema function `.parse`) which is handy for doing lots of little validations on objects where setting up a full stand-alone schema isn't really practical. For instance, maybe you have a backend webserver with many different APIs where every `request` object coming in needs to have one or a couple of properties validated on it before continuing the api call.<br/>

**ts-validators**'s `parse` function also works by receiving a schema filled with validator-functions and returns another validator-function to check if the object satisfies the schema. Using `parse` alone is trivial for doing simple primitive checks but can be very powerful if you have an object which contains both a combination of primitives and complex models that were setup with `jet-schema`.
```typescript
import { Request, Response } from 'express';
import { parse, isNum } from 'util/validators.ts'; // standalone .parse function
import User from 'models/User.ts' // This was setup with jet-schema

const validateReqBody = parse({
  userId: isNum,
  address: User.pick('address').test,
})

/**
 * parse checks req.body and makes sure .userId is a number with the isNum
 * validator-function and that the .address is a valid User['address'] object 
 * using the "User" schema setup by jet-schema.
 */
function updateUsersAddr(req: Request, res: Response) {
  const { userId, address } = validateReqBody(req.body);
  ...do stuff
}
```

> See this <a href="https://github.com/seanpmaxwell/express5-typescript-template/tree/master/src/routes">template</a> for a full example.
<br/>
