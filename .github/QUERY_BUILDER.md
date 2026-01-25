# QueryBuilder design notes

## 1. Purpose

`QueryBuilder` follows the **Query Specification Pattern**.

It is responsible for **describing** a Payload CMS query, not executing it and not serializing it.

The builder provides a fluent, composable API for expressing query intent in a
Payload-specific way, while remaining independent of transport concerns such as
HTTP, JSON, or query string encoding.

---

## 2. Core Design Principles

- **Specification over execution**
  - `QueryBuilder` describes *what* to query, not *how* to send it.
  - Execution is handled elsewhere (e.g. HTTP client).

- **Payload-first feature scope**
  - Only features supported by Payload CMS are implemented.
  - The API is not designed to mirror generic ORMs or `qs` libraries.
  - Unsupported concepts are intentionally excluded rather than emulated.

- **Composable sub-builders**
  - `QueryBuilder` orchestrates specialized builders:
    - `WhereBuilder` for logical query expressions
    - `JoinBuilder` for relational joins
  - Each sub-builder is responsible for its own domain and semantics.

---

## 3. Domain vs Transport Boundary

- `QueryBuilder.build()` returns a **domain-level DTO**, not a serialized object.
- The returned DTO expresses query intent using plain data structures.
- No encoding, stringification, or HTTP concerns exist at this layer.

Serialization is handled explicitly downstream:

```ts
const dto = queryBuilder.build();
const params = QueryParametersMapper.toJson(dto);
const query = encoder.stringify(params);
```

## 4. Non-Responsibilities

`QueryBuilder` intentionally does not:

* Encode query strings.
* Apply URL encoding rules.
* Normalize dates or primitives.
* Perform HTTP requests.
* Validate Payload responses.