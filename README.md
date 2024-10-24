# Jet-Schema ✈️

> Simple, zero-dependency, typescript-first schema validation tool, that lets you use your own validation functions (inferring types included!).


## Summary
Most schema validation libraries have fancy functions for validating object properties (i.e. `zod.string().email()`) but problem is I already had a lot of my own custom validation logic unique to my application (i.e. functions to check primitive-types, regexes for validating primtives etc). The only thing that was making me use schema-validation libraries was trying to validate object properties. So I thought, why not figure out a way to integrate my all the functions I had already written with something that can validate them against object properties? Well <b>jet-schema</b> does just that! If you want a library that includes all kinds of special functions for validating things other than objects <b>jet-schema</b> is probably not for you. However, the vast majority of projects I've worked on have involved implementing lots of type checking functions specific to the needs of that project. For example, maybe the email format maybe that's built into the library is different that the one your client needs. Instead of of have to write your own and dig into the library's feature to validate using your custom method, with jet-schema you can just pass your method.

## Preview
```typescript

// An example using "zod", a popular schema validation library
const User: z.ZodType<IUser> = z.object({
  id: z.number().default(-1).min(-1),
  name: z.string().default(''),
  email: z.string().email().or(z.literal('')).default(''),
  age: z.preprocess((arg => Number(arg)), z.number()),
  created: z.preprocess((arg => arg === undefined ? new Date() : arg), z.coerce.date()),
  address: z.object({ 
    street: z.string(),
    zip: z.number(),
    country: z.string().optional(),
  }).optional(),
});

// Equivalent using "jet-schema" (other than schema/transform, you must implement the functions below)
const User = schema<IUser>({
  id: isRelationalKey,
  name: isString,
  email: isEmail,
  age: transform(Number, isNumber),
  created: Date,
  address: schema({
    street: isOptionalString,
    zip: isNumber,
  }, true),
});
```

## 