// have a separate import for types
```ts
import { str, num, bool, uint, int, undef, nil, sym, Primitive, NonEmptyString, ISOString } = 'jet-schema/types';
```

// see if there's a way to do an eslint run so only primitives from the import above can be used


// ---------- Non-empty string ----------

type NonEmptyString = string & { readonly __brand: "NonEmptyString" };

function isNonEmptyString(value: string): value is NonEmptyString {
  return value.length > 0;
}

function assertNonEmptyString(value: string): asserts value is NonEmptyString {
  if (!isNonEmptyString(value)) {
    throw new Error(`Expected a non-empty string, got ${JSON.stringify(value)}`);
  }
}

// ---------- Integer ----------

type Int = number & { readonly __brand: "Int" };

function isInt(value: number): value is Int {
  return Number.isInteger(value);
}

function assertInt(value: number): asserts value is Int {
  if (!isInt(value)) {
    throw new Error(`Expected an integer, got ${value}`);
  }
}

// ---------- Unsigned integer ----------

type UnsignedInt = number & { readonly __brand: "UnsignedInt" };

function isUnsignedInt(value: number): value is UnsignedInt {
  return Number.isInteger(value) && value >= 0;
}

function assertUnsignedInt(value: number): asserts value is UnsignedInt {
  if (!isUnsignedInt(value)) {
    throw new Error(`Expected a non-negative integer, got ${value}`);
  }
}

// ---------- ISO 8601 date-time string ----------

type Digit = `${number}`;

type ISOStringLike =
  `${number}-${number}-${number}T${number}:${number}:${number}${"" | `.${number}`}${"Z" | `${"+" | "-"}${number}:${number}`}`;

type ISOString = ISOStringLike & { readonly __brand: "ISOString" };

const ISO_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;

function isISOString(value: string): value is ISOString {
  if (!ISO_PATTERN.test(value)) return false;
  const time = Date.parse(value);
  return !Number.isNaN(time);
}

function assertISOString(value: string): asserts value is ISOString {
  if (!isISOString(value)) {
    throw new Error(`Expected an ISO 8601 date-time string, got ${JSON.stringify(value)}`);
  }
}
