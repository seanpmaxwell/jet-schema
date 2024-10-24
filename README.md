# Jet-Schema ✈️
> Simple, zero-dependency, typescript-first schema validation tool, that lets you use your own validation functions (inferring types included!).


## Introduction
Most schema validation libraries have fancy functions for validating object properties (i.e. `zod.string().email()`) but problem is I already had a lot of my own custom validation logic unique to my application (i.e. functions to check primitive-types, regexes for validating primtives etc). The only thing that was making me use schema-validation libraries was trying to validate object properties. So I thought, why not figure out a way to integrate my all the functions I had already written with something that can validate them against object properties? Well <b>jet-schema</b> does just that!
<br/>

If you want a library that includes all kinds of special functions for validating things other than objects <b>jet-schema</b> is probably not for you. However, the vast majority of projects I've worked on have involved implementing lots of type checking functions specific to the needs of that project. For example, maybe the email format maybe that's built into the library is different that the one your client needs. Instead of of have to write your own and dig into the library's feature to validate using your custom method, with jet-schema you can just pass your method.
<br/>

Reasons to use Jet-Schema
- TypeScript first
- Quick, terse, simple, easy-to-use (there are only 2 function exports and 3 type exports).
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

// Equivalent using "jet-schema" (other than "schema/transform", the other are application custom-functions)
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
<br/>


## Guide
