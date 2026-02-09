# Project Guidelines

We are building a **client-side HttpClient & Utility Library** intended for **RESTful (non-GraphQL)** communication with the API endpoints of **[Payload CMS](https://payloadcms.com/)**. The purpose of this document is to articulate a number of high-level objectives for the project that can be grouped under one of the following three categories: *"alignment"*, *"design philosophy"* and *"desired ergonomics"*.

This library’s scope includes the following components:

| Component | Purpose | Should test... |
|----------|---------|----------------|
| **`HttpClient`** | A lightweight HTTP wrapper with error handling and JSON decoding. | |
| **`QueryStringEncoder`** | A **low-level, context-agnostic** encoder that turns arbitrary objects into query strings. | - Generic correctness (objects, arrays, dates, nulls, encoding) <br> - Edge cases and robustness (skip undefined, symbols, etc.) |
| **`QueryBuilder`** | A **Payload-aware façade** that builds structured queries according to Payload’s conventions. Delegates joins, where, sort, etc. to sub-builders. Implements the **Query Specification Pattern** in a **lightweight, fluent, builder-based form** (not object graphs or expression trees). | - Integration-level correctness <br> - Proper delegation to `WhereBuilder` and `JoinBuilder` <br> - Correct final serialized output |
| **`WhereBuilder`** | A sub-builder of the `QueryBuilder` that configures the query parameters for filtering documents from a Payload CMS endpoint. Responsible for composing where clauses. | - `where` structure correctness |
| **`JoinBuilder`** | A focused builder for Payload CMS `joins` queries. Responsible for collecting and merging per-collection join clauses. | - Nested `joins` structure correctness <br> - Idempotent overwrites <br> - Skipping empty / invalid values |

## 1. Alignment

All features must strive for **parity with Payload CMS’s core mechanics**. As a general rule "Payload behavior always wins" meaning this library must mirror what Payload accepts, not what feels clean. Implementations should be validated against the official Payload CMS documentation and primitives as well as runtime behavior. It's important to note that **Alignment primarily refers to compatibility at the data transfer layer** (query shape, parameter semantics, and runtime behavior), **not internal architecture or abstraction shape**. This implies that our own abstractions at a high-level should try to mirror those of Payload CMS in terms of semantics and behavior while at the same time be allowed to diverge at a low-level in terms of implementation.

Consider the following examples:

* Payload’s REST API queries use the **`Where` type** to specify filters when querying documents: [payload repo → index.ts](https://github.com/payloadcms/payload/blob/main/packages/payload/src/types/index.ts#L138). Our own library performs the same task via the *"and()"*, *"or()"* and *"where()"* methods of the **`QueryBuilder` class** instead: [library repo → QueryBuilder.ts](https://github.com/eddo81/Payload-CMS-Http-Client/blob/main/lib/public/QueryBuilder.ts).

* Payload internally uses **`qs-esm` stringify** for encoding: [qs-esm → stringify.js](https://github.com/payloadcms/qs-esm/blob/main/lib/stringify.js). Instead of relying on a more generalized third party dependency for encoding we provide our own **`QueryStringEncoder` class** for this: [library repo → QueryStringEncoder.ts](https://github.com/eddo81/Payload-CMS-Http-Client/blob/main/lib/internal/utils/QueryStringEncoder.ts).

These examples are illustrative rather than exhaustive and exist to clarify how *"alignment"*, *"design philosophy"*, and *"desired ergonomics"* interact.

## 2. Design Philosophy

### Minimalism and Maintainability

* **No external dependencies** unless absolutely necessary for Payload CMS compatibility.
* Implementations should be **lightweight, robust, and self-contained**, so they can be ported to ecosystems where equivalents may not exist.
* Abstractions must remain **thin and purposeful** — avoid overengineering.
* Naming should reflect intent clearly (e.g., `segments` instead of `pairs`, `_encodeKey` instead of `_buildKey`).
* Favor code clarity and safety by using **Value Objects** when appropriate, avoid patterns such as **implicit Duck Typing for control flow or behavior inference**.
* Favor **explicitness and clarity** over terseness, **No hidden reflection/magic**.

### Cross-Language Portability

The library will be written in **TypeScript** but is explicitly designed for **cross-language portability** to **Dart** and **C#**.

* Core patterns and abstractions must **map cleanly across TypeScript, Dart, and C#**.
* Avoid language-specific idioms or “clever” tricks that don’t translate well.
* Stick to **Simple data types only** (no reliance on TS-specific features like `symbol`).
* APIs should target **lowest common denominator features** to ease porting.
* **Deterministic iteration order** for predictable testing across languages.
* Avoid reliance on runtime type introspection (`instanceof`-heavy logic) where possible.

## 3. Desired Ergonomics

* Source code should be documented with **Laravel-style docblocks** for readability.
* Prefer **value-object style models** with explicit constructors (no hidden magic).
* APIs should feel **fluent and intuitive**, inspired by **LINQ in C#**.
* APIs should prefer **additive configuration** over destructive mutation.

Methods should read naturally in code:

  ```ts
  query.where(...).sortByDescending("date").select("title", "author");
  ```

## 5. Non-Goals

The following are explicitly out of scope for this project:

* Not intended as a **general-purpose ORM** or query builder.
* No attempt to replicate **full qs-esm parity** beyond what Payload CMS requires.
* No support for non-Payload features (e.g., GraphQL query building).
* No guarantee of **byte-for-byte encoding parity** with `qs-esm`; semantic equivalence is the target.
* No automatic schema inference or code generation.
* No opinionated caching, retries, or request batching.
* No runtime reflection or dynamic query inspection.