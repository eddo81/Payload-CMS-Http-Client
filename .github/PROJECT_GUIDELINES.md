# Project Guidelines

## 1. Project Overview

We are building a **HttpClient & Utility Library** intended for RESTful communication with the API endpoints of **[Payload CMS](https://payloadcms.com/)**.

This library’s scope includes the following components:

| Component | Purpose | Should test... |
|----------|---------|----------------|
| **`HttpClient`** | A lightweight HTTP wrapper with error handling and JSON decoding. | |
| **`QueryStringEncoder`** | A **low-level, context-agnostic** encoder that turns arbitrary objects into query strings. | - Generic correctness (objects, arrays, dates, nulls, encoding) <br> - Edge cases and robustness (skip undefined, symbols, etc.) |
| **`QueryBuilder`** | A **Payload-aware façade** that builds structured queries according to Payload’s conventions. Delegates joins, where, sort, etc. to sub-builders. Implements the **Query Specification Pattern**. | - Integration-level correctness <br> - Proper delegation to `WhereBuilder` and `JoinBuilder` <br> - Correct final serialized output |
| **`JoinBuilder`** | A focused builder for Payload CMS `joins` queries. Responsible for collecting and merging per-collection join clauses. | - Nested join structure correctness <br> - Idempotent overwrites <br> - Skipping empty / invalid values |
| **`TestHarness`** | A dependency-free testing utility for cross-runtime validation. | |


The library will be written in **TypeScript** but is explicitly designed for **cross-language portability** to **Dart** and **C#**.

All features must strive for **parity with Payload CMS’s core mechanics**. Implementations should be validated against the official Payload CMS documentation and primitives.

For example:

* Payload’s REST API queries use the **`Where` type**: [payload repo → index.ts](https://github.com/payloadcms/payload/blob/main/packages/payload/src/types/index.ts#L138).
* Payload internally uses **`qs-esm` stringify** for encoding: [qs-esm → stringify.js](https://github.com/payloadcms/qs-esm/blob/main/lib/stringify.js).

Our abstractions should mirror these as closely as possible in semantics and behavior, even if low-level encoding differs slightly (e.g., unencoded vs. percent-encoded brackets).

---

## 2. Design Philosophy

### Cross-Language Portability

* Core patterns and abstractions must **map cleanly across TypeScript, Dart, and C#**.
* Avoid language-specific idioms or “clever” tricks that don’t translate well.
* Favor **explicitness and clarity** over terseness.
* APIs should target **lowest common denominator features** to ease porting.

### Ergonomic Developer Experience

* APIs should feel **fluent and intuitive**, inspired by **LINQ in C#** and builder patterns in Dart/TS.
* Methods should read naturally in code:

  ```ts
  query.where(...).sortByDescending("date").select("title", "author")
  ```
* Prefer **value-object style models** with explicit constructors (no hidden magic).
* Source code should be documented with **Laravel-style docblocks** for readability.

### Minimalism and Maintainability

* **No external dependencies** unless absolutely necessary for Payload CMS compatibility.
* Implementations should be **lightweight, robust, and self-contained**, so they can be ported to ecosystems where equivalents may not exist.
* Abstractions must remain **thin and purposeful** — avoid overengineering.
* Naming should reflect intent clearly (e.g., `segments` instead of `pairs`, `_encodeKey` instead of `_buildKey`).

### Testability and Confidence

* A custom **dependency-free test harness** (`TestHarness`) provides:

  * Simple, portable testing in Node, Deno, or future runtimes.
  * Clear ✅ PASS and ❌ FAIL logs, with diffs for failures.
  * A summary of passed/failed counts at the end.
* Tests should favor **type safety** and use **real Payload CMS patterns**.
* Builder tests should validate **structural correctness**, not internal state.
  * Example: JoinBuilder tests assert final encoded output, not private clause lists.
  * Overwrite behavior (idempotency) must be explicitly tested.
* Edge cases must be covered (e.g., `null`, `undefined`, nested objects, dates, arrays).

---

## 3. Implementation Rules

### Payload-First Query Specification

* `QueryBuilder` follows the **Query Specification Pattern**:

  * A fluent API for building queries.
  * Clear separation of *specification* (building) vs *execution* (sending to API).
  * Queries can serialize into plain JSON or query strings for Payload CMS endpoints.
* **Feature scope is defined by Payload CMS**:

  * Only implement features required for Payload endpoints, not generic ORM/`qs` parity.
  * Arrays are encoded as `key[0]=...&key[1]=...` **(for most cases, but see below exceptions).**
  * Dates are ISO 8601 formatted.
  * Unsupported primitives (`symbol`, `bigint`) are skipped silently.
  * Unencoded brackets (`[]`) are acceptable and considered **semantically equivalent** to percent-encoded (`%5B%5D`) forms, as Payload CMS accepts both.

### Domain → Transport Projection Boundary

Domain-level DTOs (e.g. `QueryParametersDTO`) **must not be serialized directly**.

Before any query parameters are encoded or appended to an HTTP request, they must be
**explicitly projected** into a plain, transport-safe object via a projection layer.

This enforces a clear boundary between:

* **Domain intent** (builders, specifications, DTOs)
* **Transport representation** (plain objects, query strings, HTTP)

#### Rules

* `QueryBuilder.build()` returns a **domain DTO**, not a serializable object.
* Serialization utilities (e.g. `QueryStringEncoder`) operate **only on plain objects**
  (`Record<string, unknown>`), never on domain DTOs.
* Projection is performed explicitly via the `Projections` hub:

  ```ts
  const dto = queryBuilder.build();
  const params = Projections.queryParameters(dto);
  const query = encoder.stringify(params);
  ```

---

## 3.1 JoinBuilder Design Notes

### Purpose

`JoinBuilder` is a **Payload-specific sub-builder** responsible solely for constructing the `joins` portion of a query.

It intentionally does **not** encode or stringify data, and does **not** know about HTTP or execution. Its job is to:

* Collect join-related clauses (`where`, `sort`, `limit`, `page`, `count`)
* Group them by collection name (`on`)
* Merge updates idempotently
* Produce a plain JavaScript object suitable for serialization

Example output shape:

```json
{
  "joins": {
    "posts": {
      "where": { "author": { "equals": "Alice" } },
      "sort": "-title",
      "limit": 1
    }
  }
}
```

### Idempotency & Mutation Semantics

* Each joined collection (`on`) is represented by **exactly one internal join clause**.
* Repeated calls targeting the same collection **do not create duplicates**.
* Subsequent calls **overwrite previously set values** for the same key.

Example:

```ts
joinBuilder
  .where("posts", "author", "equals", "Alice")
  .where("posts", "author", "equals", "Bob");
```

Resulting structure:

```json
{
  "posts": {
    "where": {
      "author": { "equals": "Bob" }
    }
  }
}
```

### Builder Semantics vs WhereBuilder

Although `JoinBuilder` and `WhereBuilder` both collect clauses, they serve different semantic roles:

* `JoinBuilder` is a **configuration builder**: updates are keyed and overwrite previous values.
* `WhereBuilder` is an **expression builder**: clauses are additive and resolved structurally at build time.

This intentional distinction reflects Payload CMS semantics and avoids ambiguity in logical query construction.

### Empty Value Handling

`JoinBuilder` silently omits invalid or empty inputs:

* Empty collection names (`on === ""`)
* `undefined`, `null`, or empty-string values
* Clauses that would result in an empty join

If no valid join clauses remain, `JoinBuilder.build()` returns `undefined`, and the parent `QueryBuilder` omits the `joins` key entirely.

This guarantees that empty or partially constructed joins never leak into serialized queries.

### Separation of Concerns

* `QueryBuilder` controls **whether** joins are included.
* `JoinBuilder` controls **how** joins are built.
* No explicit `disableJoins()` flag is required.

If no joins are added, the absence of output from `JoinBuilder.build()` naturally excludes joins from the final query.

This keeps builders composable and avoids redundant state flags.

---

## 4. Query String Encoding: Modalities, Context Awareness, and Edge Cases

### Multi-Modal Encoding

Encoding is not determined solely by the parameter name, but also by the *shape and type* of the value:

* `populate` can be an array, object, boolean, or mix.
* `select` and `sort` expect **comma-separated strings** when passed arrays of primitives.
* Nested population is supported via objects:

  ```json
  { populate: { pages: { text: true } } }
  → populate[pages][text]=true
  ```
* Mixed arrays/objects are valid:

  ```json
  { populate: ["author", { comments: { text: true } }] }
  → populate[0]=author&populate[1][comments][text]=true
  ```

### Context Awareness

* `populate`: support both arrays (index-based) and objects (nested). Mixed forms must be supported.
* `select` / `sort`: arrays encoded as **comma-separated values**, not index-based.
* All other keys: default to index-based arrays unless Payload CMS docs specify otherwise.

### Edge Cases to Handle

* Skip `null` / `undefined` / empty arrays or objects.
* Dates as ISO 8601.
* Booleans as `true` / `false`.
* URL-encode all keys/values.
* Skip unsupported primitives (`symbol`, `bigint`, functions).
* Recursively handle nested arrays/objects.
* **No support for arrays of arrays** (Payload CMS does not expect this).
* **Unencoded vs. Encoded Brackets**:

  * Brackets are intentionally left **unencoded** for readability and semantic equivalence.
  * Payload CMS interprets both `%5B%5D` and `[]` correctly.
  * Tests confirm semantic parity even when string-level diff exists.

### Summary Table

| Parameter | Input Example                       | Expected Output                        | Encoding Type      |
| --------- | ----------------------------------- | -------------------------------------- | ------------------ |
| populate  | `{ populate: ["a", "b"] }`          | `populate[0]=a&populate[1]=b`          | Indexed array      |
| populate  | `{ populate: { a: true } }`         | `populate[a]=true`                     | Nested object      |
| populate  | `{ populate: ["a", {b:{c:true}}] }` | `populate[0]=a&populate[1][b][c]=true` | Mixed array/object |
| select    | `{ select: ["a", "b"] }`            | `select=a,b`                           | Comma-separated    |
| sort      | `{ sort: ["a", "-b"] }`             | `sort=a,-b`                            | Comma-separated    |
| where.or  | `{ where: { or: [obj1, obj2] } }`   | `where[or][0]...&where[or][1]...`      | Indexed array      |

---

## 5. Non-Goals

* Not intended as a **general-purpose ORM** or query builder.
* No attempt to replicate **full qs-esm parity** beyond what Payload CMS requires.
* No support for non-Payload features (e.g., GraphQL query building).
* No guarantee of **byte-for-byte encoding parity** with `qs-esm`; semantic equivalence is the target.

---

## 6. Cross-Language Mapping

To ensure portability, stick to features that map directly across **TypeScript, Dart, and C#**:

* **Fluent Builder Pattern** (`.where().sort()...`).
* **LINQ-style sorting** → `sort()` and `sortByDescending()` instead of single “order” method.
* **Value Objects** with explicit constructors.
* **No hidden reflection/magic**.
* **Simple data types only** (no reliance on TS-specific features like `symbol`).
* **Deterministic iteration order** for predictable testing across languages.

---

## 7. Open Questions

* Do we need a **test-only escape hatch** (e.g., `serializeAny`) for non-`IQueryParameters` input to test low-level encoder behavior?
* Should unsupported types (`symbol`, `bigint`) be skipped silently (current) or raise explicit errors?
* Do Payload CMS endpoints ever expect **alternative array encodings**, or is index-based (`[0]`, `[1]`) always correct?

  * **Answer so far:**

    > Payload CMS supports *multi-modal* query parameter encoding.
    >
    > * For `populate`, both index-based arrays and nested objects (and mixed arrays/objects) are valid.
    > * For `select` and `sort`, arrays must be encoded as comma-separated strings.
    > * The encoder must be context-aware and select the correct encoding based on the parameter and value type.
* Should we preserve **insertion order** or impose a **sorted order** for keys when serializing (for cross-language test parity)?

---

## 8. Next Steps

1. **Expand test coverage** for encoder and query builder, using real Payload query examples.
2. **Validate serialization** against live Payload CMS endpoints to confirm compatibility.
3. Decide on **query string ordering rules** for predictable, cross-language test results.
4. Document the library’s **API, usage examples, and cross-language mapping**.
5. Prepare for **Dart and C# ports** once TypeScript reaches a stable baseline.
6. Optionally add **semantic diff testing**, verifying equivalence after `decodeURIComponent` normalization.
