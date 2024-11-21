# Jet-Schema ✈️
> Simple, zero-dependency, typescript-first schema validation tool, with zero-overhead when it comes to custom validation.


## Table of contents
- [Introduction](#introduction)
- [Comparison to other schema validation libraries](#comparison-to-others)
- [Guide](#guide)
  - [Installation](#installation)
  - [What is a validator function](#what-is-a-validator-function)
  - [Creating Schemas](#creating-schemas)
    - [Validator-objects](#validator-objects)
    - [The schema() and default jetSchema() functions](#the-schema-and-default-jet-schema-functions)
    - [Handling the schema's type](#handling-the-schemas-type)
    - [Schema Options](#schema-options)
  - [Schema APIs](#schema-apis)
    - [.new](#new)
    - [.test](#test)
    - [.pick](#pick)
    - [.parse](#parse)
  - [Combining Schemas](#combining-schemas)
  - [TypeScript Caveats](#typescript-caveats)
  - [Bonus Features](#bonus-features)
  - [Using jet-schema without TypeScript](#without-typescript)
- [Tips](#tips)
  - [Creating wrapper functions](#creating-wrapper-functions)
  - [Recommended Global Settings](#recommended-global-settings)
  - [Combining jet-schema with parse from ts-validators](#parse-from-ts-validators)
<br/>


## Introduction <a name="introduction"></a>
`jet-schema` is a simple, TypeScript first schema validation tool, which enables you to use your own validator functions against each property in an object. That way you don't have to refer to documentation everytime you want to validate some new object property. It also means you get to grow a list of TypeScript validator functions that aren't tied to a specific library. 

> If you're open to `jet-schema` but think writing your own validator-functions could be a hassle, you can copy-n-paste the file (https://github.com/seanpmaxwell/ts-validators/blob/master/src/validators.ts) into your application and add/remove/edit validators as needed.


### <ins>Highlights</ins> 😎
- Focus is on using your own validator-functions to validate object properties.
- Enables extracting logic for nested schemas.
- Create new instances of your schemas using partials.
- Easy-to-learn, terse, and small (this library only exports 2 functions and 2 types, size **4.7kB** minified).
- Doesn't require a compilation step (so still works with `ts-node`, unlike `typia`).
- Fast! see these <a href="https://moltar.github.io/typescript-runtime-type-benchmarks/">benchmarks</a>.
- Typesafety works boths ways, you can infer a type from a schema or force a schema to have certain properties using a generic. 
- Works client-side or server-side.
- TypeScript first!


### <ins>Quick Glance</ins>
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


## Comparison to other schema validation libraries <a name="comparison-to-others"></a>

### <ins>Code comparison with zod</ins>
With most validation-libraries, if we wanted to use our `isNullishString` function above we'd have to refer to the library's documentation and typically wrap in some custom-handler function (i.e. zod's `.refine`). With jet-schema however, anytime we need to add a new property to your schema, you can just drop in a validator-function (see the <a name="what-is-a-validator-function">validator-functions</a> section). This not only saves time but also makes your schema setups way more terse. Let's looks at a some code where we setup a schema in `zod` and then again in `jet-schema`:
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
  address: schema({
    street: isString,
    zip: isNumber,
    country: isOptionalString,
  }, { optional: true }),
});
```

### <ins>Create instances with partials</ins>
A major reason I created jet-schema was I needed to create lots of instances of my schemas when testing and copies of existing objects (represented by my schemas) when doing edits. I didn't wanted to have to wrap a parsing function everytime I wanted to create a new instance so I added the `.new` function (see the <a name="new">.new</a> section for more details).<br/><br/>
Think of `.new` as like what a copy-constructor for classes. You can configure a set of default values for each validator-function, and then pass an partial-type of your schema-object to `.new`. Whichever values are in the partial will be validated and cloned, which values are not in the partial will be set with defaults. See the <a name="new">.new</a> section for more details.

### <ins>Size (minified, not zipped)</ins>
- Jet-Schema **5kB**
- Zod **57kB**
- Yup **40kB**
- Joi **150kB**
- Valibot **35kB**
- **NOTE:** some of these could change as packages are updated

### <ins>Fast</ins>
- See these benchmarks <a href="https://moltar.github.io/typescript-runtime-type-benchmarks/">here</a>:
- Looking at the benchmarks in the link above, compare jet-schema to some other popular validators and notice that it is rougly 2-3 times as fast as libraries which don't require a compilation setup (i.e. zod, valibot, yup etc).
<br/>


## Guide <a name="guide"></a>

### <ins>Installation</ins> <a name="installation"></a>

> npm install -s jet-schema


### <ins>What is a validator function</ins> <a name="what-is-a-validator-function"></a>
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

> I like to place all my validator-functions in a `util/validators.ts` file. As mentioned in the intro, you can copy some predefined validators from <a href="https://github.com/seanpmaxwell/ts-validators/blob/master/src/validators.ts">here</a>. One more note, not only does creating a list of validator-functions save boilerplate code, but growing a list of validator-functions not dependent on any library will make them easy to copy-and-paste between multiple projects, saving you a lot of coding time down the line. For simple primitives like `isString`, `isNumber`, creating validators might seem trivial at first but once applications grow and you need to check if something is let's say `null`, `undefined` or `number[]` (i.e. `isNullishNumberArr`), you'll be glad you don't have to constantly redefine these functions. 


### <ins>Creating schemas</ins> <a name="creating-schemas"></a>

#### `Validator-objects` <a name="validator-objects"></a>
Before we create a schema, lets get familiar with what a **validator-object** is. Validator-functions can be passed to schemas directly or within a validator-object. Validator-objects allow us to configure certains settings for a specific validator-function:
```typescript
// Validator-object format:
{
  vf: <T>(arg: unknown) => arg is T; // vf => validator-function 
  default?: T; // the default value for the validator-function
  transform?: (arg: unknown) => T; // modify the value before calling the validator-function
  formatError?: (error: IError) => IError | string; // Customize what's sent to onError() when errors are raised.
}

// Example
const UserSchema = schema({
  name: isString, // Using a validator-function directly
  id: {  // Using a validator-object
    vf: isNumber, // the validator-function in the object
    default: 0,
    transform: Number,
    formatError: err => `Property ${err.property} was not a valid number`,
  },
});
```

In the snippet above we see the `formatError` function passes and `IError` object. The format for an `IError` object is:
```typescript
{
  property?: string;
  value?: unknown;
  message?: string;
  location?: string; // function which is throwing the error
  schemaId?: string;
}
```

#### `The schema() and default jetSchema() functions` <a name="the-schema-and-default-jet-schema-functions"></a>
Schemas can be created by importing the `schema` function directly from the `jet-schema` library or importing the default `jetSchema` function. The `jetSchema` function can be passed an array of validator-objects and returns a new customized `schema` function; that way we don't have to configure validator-function settings for every new schema.

The validator-objects array is set in the `globals:` property. Note that localized settings will overwrite all global ones:
```typescript
import jetSchema from 'jet-schema';
import { isNum, isStr } from './validators'; 

const schema = jetSchema({
  globals?: [
    { vf: isNum, default: 0 },
    { vf: isStr, default: '' },
  ],
});

const User1 = schema({
  id: isNum,
  name: isStr,
});

const User2 = schema({
  id: { vf: isNum, default: -1 }, // Localized default setting overwriting global one
  name: isStr,
})

User1.new() // => { id: 0, name: '' }
User2.new() // => { id: -1, name: '' }
```

If we did not use the `jetSchema` function above and instead used the `schema` function directly, default values would have to be configured everytime. **IMPORTANT** If your validator-function does not accept `undefined` as a valid value, you must set a default value because all defaults will be validated at startup:
 ```typescript
import { schema } from 'jet-schema';
import { isNum, isStr } from './validators'; 

const User1 = shared({
  id: { vf: isNum, default: 0 },
  name: { vf: isStr, default: '' },
});

const User2 = sharedSchema({
  id: { vf: isNum, default: 0 },
  name: isStr, // ERROR: "isStr" does not accept `undefined` as a valid value but no default was value configured for "isStr"
})
```

For the `jetSchema` function, in addition to `globals` there are two additional options we can configure:
- `cloneFn`: A custom clone-function. When using the `.new` function, all partial values will be cloned. The default clone function uses `structuredClone` (I like to use `lodash.cloneDeep`).
- `onError`: Configure what happens when errors are raised. By default, a javascript `Error` is thrown with the array of errors stringified in the error message.
```typescript
import jetSchema from 'jet-schema';
import { isNum, isStr } from './validators';

export default jetSchema({
  globals?: [
    { vf: isNum, default: 0 },
    { vf: isStr, default: '' },
  ],
  cloneFn?: (val: unknown) => unknown, // use a custom clone-function
  onError?: (errors: IError[]) => void, // pass a custom error-handler,
});
```

> I usually configure the `jetSchema` function once per application and place it in a script called `utils/schema.ts`. From there I import it and use it to configure all individual schemas: take a look at this <a href="https://github.com/seanpmaxwell/express5-typescript-template/tree/master">template</a> for an example.


#### `Handling the schema's type` <a name="handling-the-schemas-type"></a>
For handling a schema's type, you can enforce a schema from a type or infer a type from a schema.

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

#### `&bull; Schema options param` <a name="schema-options"></a>
In addition to an object with our schema's properties, the `schema` function accepts an additional **options** parameter:
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
  - `init`: Tells the parent what to do when the parent calls `.new`.
    - `false`: Skip creating a child-object. The child-object must be `optional`.
    - `true`: Create a new child-object (Uses the child's `.new` function).
    - `null`: Set the child object's value to `null` (`nullable` must be true for the child).
  - `id`: A unique-identifier for the schema passed to the `IError` object.
  - `safety`: Sets how to deal with additional properties. 
    - `filter (default)`: Properties not in the schema will be filtered out but not raise errors.
    - `pass`: Properties not in the schema will not be filtered out nor raise errors.
    - `strict`: Properties not in the schema will be filtered out and raise errors.
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


### <ins>Schema APIs</ins> <a name="schema-apis"></a>
Once you have your custom schema setup, you can call the `.new`, `.test`, `.pick`, and `.parse` functions.

> NOTE: the following examples assume you set `0` as the default for `isNum`, `''` for `isStr`, nothing for `isOptionalStr`, and `safety` is left at its default `filter` option. See the <a name="creating-schemas">Creating Schemas</a> section for how to set default values and the `safety` option.

#### `.new` <a name="new"></a>
Allows you to create new instances of your type using partials. If the property is absent, `.new` will use the default supplied. If no default is supplied and the property is optional, then the value will be skipped. Runtime validation will still be done on every incoming property:
```typescript
User.new(); // => { id: 0, name: '' }
User.new({ id: 5 }); // => { id: 5, name: '' }
User.new({ id: 'asdf' }); // => Error
User.new({ name: 'john' }); // => { id: 0, name: 'john' }
User.new({ id: 1, name: 'a', email: 'b@b' }); // => { id: 1, name: 'a', email: 'b@b' }
```

#### `.test` <a name="test"></a>
Accepts any unknown value, tests that it's valid, and returns a type-predicate:
```typescript
User.test(); // => Error
User.test({ id: 5, name: 'john' }); // => param is IUser
User.test({ name: 'john' }); // => Error
User.test({ id: 1, name: 'a', email: 'b@b' }); // => param is IUser
```

#### `.pick` <a name="pick"></a>
Selects a property and returns an object with the `.test` and `.default` functions. If you use `.pick` on a child schema, you can also use the schema functions (`.new`, `.pick` etc), in addition to `.default`. Note that for a child-schema, `.default` could return a different value from `.new` if the default value is set to `null` or `undefined` (see the `init:` setting in the <a href="#schema-options">Schema Options</a> section).
```typescript
const User = schema<IUser>({
  id: isNum,
  address: schema<IUser['address']>({
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

#### `.parse` <a name="parse"></a>
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


### <ins>Combining Schemas</ins> <a name="combining-schemas"></a>
If you want to declare part of a schema that will be used elsewhere, you can import the `TJetSchema` type and use it to setup a partial schema, then merge it with your full schema later:
```typescript
import schema, { TJetSchema } from 'jet-schema';
import { isNumber, isString, isBoolean } from './validators';

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


### <ins>TypeScript Caveats</ins> <a name="typescript-caveats"></a>
Due to how structural-typing works in typescript, there are some limitations with typesafety that you need to be aware of. To put things in perspective, if type `A` has all the properties of type `B`, we can use type `A` for places where type `B` is required, even if `A` has additional properties.

#### `Validator functions`
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

#### `Child schemas`
As mentioned, if a property in a parent-schema is a mapped-object type (it has a defined set of keys), then you need to call `schema` again for the nested object. If you don't use a generic on the child-schema, typescript will still make sure all the required properties are there; however, because of structural-typing the child could have additional properties. It is highly-recommended that you pass a generic to your child-objects so additional properties don't get added:
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


### <ins>Bonus Features</ins> <a name="bonus-features"></a>
- When passing the `Date` constructor, `jet-schema` sets the type to be a `Date` object and automatically converts all valid date values (i.e. `string/number`, maybe a `Date` object got stringified in an API call) to a `Date` object. The default value will be a `Date` object with the current datetime. 
- You can also use an `enum` as a validator. The default value will be the first value in the enum object and validation will make sure it is value of that enum. **IMPORTANT** this does not work for mixed enums see: `eslint@typescript-eslint/no-mixed-enums`


### <ins>Using jet-schema without TypeScript</ins> <a name="without-typescript"></a>
`jet-schema` is built in TypeScript for TypScript but can be used directly with plain JavaScript. There are two minified files you can import if you want to use plain javascript:
  - `dist/index.min.js`: CommonJS
  - `dist/index.min.mjs`: ESM (es6)
<br>


## Tips <a name="tips"></a>

### <ins>Creating wrapper functions</ins> <a name="creating-wrapper-functions"></a>
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

### <ins>Recommended Globals Settings</ins> <a name="recommended-global-settings"></a>
I highly recommend you set these default values for each of your basic primitive validator-functions, unless of course your application has some other specific need:
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

### <ins>Combining jet-schema with parse() from ts-validators</ins> <a name="parse-from-ts-validators"></a>
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
