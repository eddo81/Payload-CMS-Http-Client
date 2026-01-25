# JoinBuilder Design Notes

## 1. Purpose

`JoinBuilder` is a **Payload-specific sub-builder** responsible solely for constructing
the `joins` portion of a query.

It intentionally does **not** encode or stringify data, and does **not** know about
HTTP or execution.

Its responsibilities are limited to:

- Collecting join-related clauses (`where`, `sort`, `limit`, `page`, `count`)
- Grouping clauses by collection name (`on`)
- Merging updates **idempotently**
- Producing a plain JavaScript object suitable for downstream serialization

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

## 2. Idempotency & Mutation Semantics

* Each joined collection (`on`) is represented by **exactly one internal join clause**.
* Repeated calls targeting the same collection **do not create duplicates**.
* Subsequent calls **overwrite previously set values** for the same key *within that collection*.

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

## 3. Builder Semantics vs WhereBuilder

Although `JoinBuilder` and `WhereBuilder` both collect clauses, they serve different semantic roles:

* `JoinBuilder` is a **configuration builder**
  * Updates are keyed and overwrite previous values.
  * Later values replace earlier ones.

* `WhereBuilder` is an **expression builder**
  * clauses are additive
  * Resolved structurally at build time.

This intentional distinction reflects Payload CMS semantics and avoids ambiguity in logical query construction.

### Empty Value Handling

`JoinBuilder` silently omits invalid or empty inputs:

* Empty collection names (`on === ""`)
* `undefined`, `null`, or empty-string values
* Clauses that would result in an empty join

If no valid join clauses remain, `JoinBuilder.build()` returns `undefined`.

The parent `QueryBuilder` omits the `joins` key entirely in this case, ensuring that
empty or partially constructed joins never appear in serialized queries.

### Separation of Concerns

* `QueryBuilder` controls **whether** joins are included.
* `JoinBuilder` controls **how** joins are built.
* No explicit `disableJoins()` flag is required.

If no joins are added, the absence of output from `JoinBuilder.build()` naturally excludes joins from the final query.

This keeps builders composable and avoids redundant state flags.