# Mock expressions

Expressions use native LiquidJS value and filter syntax. The synchronous evaluator
returns the original value type (including arrays, objects, numbers and booleans).
Unknown variables, invalid filters and generator failures leave the input unresolved.
Plain text is returned unchanged. Template tags and filesystem templates are not part
of this API.

```liquid
{{ token | upcase }}
{{ text | slice: 1, 2 | append: "!" }}
{{ "number.int" | faker: min: 7, max: 7 }}
{{ "person.firstName" | faker }}
{{ "string.idcard" | faker: areacode: "110101", birth: "19900101" }}
{{ "date.past" | faker | format: "YYYY-MM-DD", "+08:00" }}
```

- [expressions.ts](./expressions.ts): evaluation boundary and per-call custom filters.
- [filters.ts](./filters.ts): hashes, Base64, numeric conversion, padding and date formatting.
  Other text/array operations use Liquid's built-in filters.
- [faker.ts](./faker.ts): named arguments and catalog-based generator dispatch.
  The shared catalog controls available generators and parameter types. Structured
  parameters can be supplied from variables or as JSON strings. Nested option names
  accept their catalog leaf names, such as `min` and `max`.
- [schema.ts](./schema.ts): JSON Schema generation, independent of expression parsing.

Custom `fn_*` scripts are explicitly registered as Liquid filters for one evaluation.
They execute JavaScript with the existing application privileges; Liquid does not
sandbox these scripts.

The previous `$fakerjs`, `$function`, and `filter(args)` syntax is removed. Existing
saved expressions must be edited to Liquid syntax; there is no compatibility layer
or automatic migration.
