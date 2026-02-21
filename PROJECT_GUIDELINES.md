# Project Guidelines

This document is the single authoritative reference for the **Payload CMS HTTP Client** project. It covers project objectives, design philosophy, architecture, component design notes, and the complete porting guide for translating the TypeScript implementation to **C#** and **Dart**.

---

## 1. Project Overview

A lightweight, zero-dependency HTTP client library for the [Payload CMS](https://payloadcms.com/) REST API. Written in TypeScript with explicit design for cross-language portability to C# and Dart.

The library provides:

- Typed methods for collections, globals, auth, and versions
- A fluent query builder with where clauses, joins, sorting, and pagination
- File upload support via `FormData`
- API key and JWT authentication
- A custom endpoint escape hatch via `request()`

### Scope

| Component | Purpose |
|-----------|---------|
| `HttpClient` | Lightweight HTTP wrapper with error handling and JSON decoding. |
| `QueryStringEncoder` | Low-level, context-agnostic encoder that turns arbitrary objects into query strings. |
| `QueryBuilder` | Payload-aware facade that builds structured queries. Delegates to sub-builders. |
| `WhereBuilder` | Sub-builder for composing where filter clauses. |
| `JoinBuilder` | Sub-builder for collecting and merging per-collection join clauses. |

---

## 2. Design Philosophy

### 2.1 Alignment

All features must strive for **parity with Payload CMS's core mechanics**. As a general rule "Payload behavior always wins" — this library must mirror what Payload accepts, not what feels clean. Implementations should be validated against the official Payload CMS documentation as well as runtime behavior.

Alignment primarily refers to **compatibility at the data transfer layer** (query shape, parameter semantics, and runtime behavior), not internal architecture or abstraction shape. Our own abstractions at a high level should mirror those of Payload CMS in terms of semantics and behavior while being allowed to diverge in terms of implementation.

For example:

- Payload uses the `Where` type for filters. Our library performs the same task via `where()`, `and()`, and `or()` methods on `QueryBuilder`.
- Payload uses `qs-esm` for encoding. We provide our own `QueryStringEncoder` with semantic equivalence.

### 2.2 Minimalism and Maintainability

- **No external dependencies** unless absolutely necessary for Payload CMS compatibility.
- Implementations should be lightweight, robust, and self-contained so they can be ported to ecosystems where equivalents may not exist.
- Abstractions must remain thin and purposeful — avoid overengineering.
- Naming should reflect intent clearly.
- Favor explicitness and clarity over terseness. No hidden reflection or magic.

### 2.3 Cross-Language Portability

The library is explicitly designed for **cross-language portability** to Dart and C#.

- Core patterns and abstractions must map cleanly across TypeScript, Dart, and C#.
- Avoid language-specific idioms or "clever" tricks that don't translate well.
- Stick to simple data types only (no reliance on TS-specific features like `symbol`).
- APIs should target lowest common denominator features to ease porting.
- Deterministic iteration order for predictable testing across languages.
- Avoid reliance on runtime type introspection (`instanceof`-heavy logic) where possible.

### 2.4 Ergonomics

- Source code should be documented with Laravel-style docblocks for readability.
- Prefer value-object style models with explicit constructors.
- APIs should feel fluent and intuitive, inspired by LINQ in C#.
- APIs should prefer additive configuration over destructive mutation.

Methods should read naturally:

```ts
query
  .where({ field: 'status', operator: Operator.Equals, value: 'published' })
  .sortByDescending({ field: 'date' })
  .select({ fields: ['title', 'author'] });
```

### 2.5 Non-Goals

- Not a general-purpose ORM or query builder.
- No attempt to replicate full `qs-esm` parity beyond what Payload CMS requires.
- No support for non-Payload features (e.g., GraphQL query building).
- No guarantee of byte-for-byte encoding parity with `qs-esm`; semantic equivalence is the target.
- No automatic schema inference or code generation.
- No opinionated caching, retries, or request batching.
- No runtime reflection or dynamic query inspection.

---

## 3. Architecture

### 3.1 Project Structure

```
PAYLOAD-CMS-HTTP-CLIENT/
│
├── types/                           # TS-only type aliases (NO equivalent in C#/Dart)
│   └── Json.ts                      # Json, JsonValue, JsonObject, JsonArray, JsonPrimitive
│
├── lib/                             # 1:1 portable — every file has a C#/Dart equivalent
│   ├── public/                      # Consumer-facing API surface (exported)
│   │   ├── config/
│   │   │   ├── ApiKeyAuth.ts
│   │   │   └── JwtAuth.ts
│   │   │
│   │   ├── enums/
│   │   │   ├── Operator.ts
│   │   │   └── HttpMethod.ts
│   │   │
│   │   ├── models/
│   │   │   ├── auth/
│   │   │   │   ├── LoginResultDTO.ts
│   │   │   │   ├── MeResultDTO.ts
│   │   │   │   ├── MessageDTO.ts
│   │   │   │   ├── RefreshResultDTO.ts
│   │   │   │   └── ResetPasswordResultDTO.ts
│   │   │   │
│   │   │   └── collection/
│   │   │       ├── DocumentDTO.ts
│   │   │       ├── PaginatedDocsDTO.ts
│   │   │       └── TotalDocsDTO.ts
│   │   │
│   │   ├── upload/
│   │   │   └── FileUpload.ts
│   │   │
│   │   ├── HttpClient.ts
│   │   ├── JoinBuilder.ts
│   │   ├── PayloadError.ts
│   │   ├── QueryBuilder.ts
│   │   └── WhereBuilder.ts
│   │
│   └── internal/                    # Internal implementation (not exported)
│       ├── contracts/
│       │   ├── IAuthCredential.ts
│       │   ├── IClause.ts
│       │   └── IFileUpload.ts
│       │
│       ├── upload/
│       │   └── FormDataBuilder.ts
│       │
│       ├── utils/
│       │   └── QueryStringEncoder.ts
│       │
│       ├── AndClause.ts
│       ├── JoinClause.ts
│       ├── OrClause.ts
│       └── WhereClause.ts
│
├── CLAUDE.md
├── index.ts                         # Barrel export (TS-only, no C#/Dart equivalent)
│
├── test/
│   ├── ApiKeyAuth.test.ts
│   ├── HttpClient.test.ts
│   ├── JoinBuilder.test.ts
│   ├── QueryBuilder.test.ts
│   ├── QueryStringEncoder.test.ts
│   ├── run-unit-tests.ts
│   ├── run-integration-tests.ts
│   └── TestHarness.ts
│
├── package.json
├── PROJECT_GUIDELINES.md       # This document
├── README.md
└── tsconfig.json
```

### 3.2 Layer Responsibilities

| Folder | Purpose | Notes |
|--------|---------|-------|
| `types/` | TS-only type aliases. | No C#/Dart file equivalent — native dictionary types serve this role. |
| `lib/public/` | Consumer-facing API surface. | Exported via `index.ts`. Everything here has a 1:1 C#/Dart equivalent. |
| `lib/public/config/` | Authentication credentials. | `ApiKeyAuth`, `JwtAuth`. |
| `lib/public/enums/` | String enums. | `Operator`, `HttpMethod`. |
| `lib/public/models/` | DTOs for API responses. | Split into `auth/` and `collection/` subfolders. |
| `lib/public/upload/` | File upload support. | `FileUpload` class. |
| `lib/internal/` | Clause primitives and helpers. | Internal logic not exported (mimics C#'s `internal`). |
| `lib/internal/contracts/` | Internal interfaces. | `IClause`, `IAuthCredential`, `IFileUpload`. |
| `lib/internal/utils/` | Internal utilities. | `QueryStringEncoder`. |
| `lib/internal/upload/` | Internal upload helpers. | `FormDataBuilder`. |
| `test/` | Unit and integration tests. | Custom `TestHarness` framework. |

---

## 4. Code Conventions

### 4.1 General Conventions

- **Interface prefix**: All interfaces use `I` prefix (e.g., `IClause`, `IAuthCredential`).
- **Private fields**: Underscore prefix (e.g., `_clauses`, `_config`).
- **Method chaining**: Builders return `this` for fluent API.
- **JSDoc**: Laravel-style docblocks for public APIs.
- **String enums**: `Operator` and `HttpMethod` are string enums in `lib/public/enums/`, mapping directly to C#/Dart enum equivalents.

### 4.2 Inline Options Pattern

All methods (public, private, and interface) use a single inline object type parameter. The only exception is DTO factory methods (`fromJson`/`toJson`), which keep positional parameters.

Every method that receives an options object destructures it immediately:

```typescript
method(options: { slug: string; id: string }) {
  const { slug, id } = options;
  // use slug, id directly
}
```

This pattern maps to native named parameters in C# and Dart — no separate "options" classes are needed in the ports:

```typescript
// TypeScript — inline options object
async find(options: { slug: string; query?: QueryBuilder }): Promise<PaginatedDocsDTO>
```

```csharp
// C# — native named/optional parameters
public async Task<PaginatedDocsDTO> Find(string slug, QueryBuilder? query = null)
```

```dart
// Dart — required + named optional parameters
Future<PaginatedDocsDTO> find({required String slug, QueryBuilder? query})
```

### 4.3 Json Object Construction

All `build()` methods use explicit assignment instead of inline object literals. This avoids computed property names which have no direct equivalent in C#/Dart:

```typescript
// Correct — explicit assignment
const inner: Json = {};
inner[this._operator] = this._value;
const result: Json = {};
result[this._field] = inner;
return result;

// Avoid — computed property literals
return { [this._field]: { [this._operator]: this._value } };
```

### 4.4 DTO Factory Pattern

All DTOs use `static fromJson(json)` factory methods colocated on the DTO class itself (not in separate mapper classes). The pattern is identical across all DTOs: create instance, guard each field with a type check, assign if valid.

---

## 5. Component Design Notes

### 5.1 QueryBuilder

`QueryBuilder` follows the **Query Specification Pattern**. It is responsible for **describing** a Payload CMS query, not executing it and not serializing it.

**Core principles:**

- **Specification over execution**: Describes *what* to query, not *how* to send it. Execution is handled by the HTTP client.
- **Payload-first feature scope**: Only features supported by Payload CMS are implemented. Unsupported concepts are intentionally excluded.
- **Composable sub-builders**: Orchestrates `WhereBuilder` (for logical query expressions) and `JoinBuilder` (for relational joins).

**Domain vs Transport Boundary:**

`QueryBuilder.build()` returns a domain-level DTO, not a serialized object. No encoding, stringification, or HTTP concerns exist at this layer. Serialization is handled downstream by `QueryStringEncoder`.

`QueryBuilder` intentionally does **not**: encode query strings, apply URL encoding rules, normalize dates or primitives, perform HTTP requests, or validate Payload responses.

### 5.2 WhereBuilder

`WhereBuilder` is an **expression builder** — clauses are additive and resolved structurally at build time. It supports `where()`, `and()`, and `or()` methods. The `and()` and `or()` methods accept a callback that receives a fresh `WhereBuilder` for composing nested groups.

### 5.3 JoinBuilder

`JoinBuilder` is a **configuration builder** responsible solely for constructing the `joins` portion of a query. Updates are keyed by collection name and overwrite previous values (as opposed to `WhereBuilder` where clauses are additive).

**Key behaviors:**

- Each joined collection (`on`) is represented by exactly one internal `JoinClause`.
- Repeated calls targeting the same collection do not create duplicates — subsequent calls overwrite previously set values.
- Uses a **get-or-create pattern** for both `JoinClause` instances and `WhereBuilder` caches, keyed by the join field name.
- Silently omits invalid or empty inputs (empty collection names, undefined/null values).
- If no valid join clauses remain, `build()` returns `undefined`.

**`isDisabled` / `build()` split:**

`JoinBuilder.build()` originally returned `Json | false | undefined`. The `false` literal in a union has no clean C#/Dart equivalent, so this was split into:

- `build(): Json | undefined` — returns the joins object, or `undefined` if no clauses.
- `get isDisabled: boolean` — separate getter for the disabled state.

`QueryBuilder.build()` checks `isDisabled` first, then calls `build()`.

### 5.4 QueryStringEncoder

Custom query string encoder (no external dependencies). Produces `qs-esm` compatible output for Payload CMS.

**Key behaviors to replicate exactly:**

- Nested objects use bracket notation: `where[title][equals]=foo`
- Arrays use indexed notation: `where[or][0][title]=foo`
- `null` and `undefined` values are skipped
- `Date` values serialize as ISO strings
- `boolean` serializes as `"true"` / `"false"` strings
- No `?` prefix by default (configurable via `addQueryPrefix`, defaults to `true` in constructor)
- Square brackets `[` `]` and commas `,` are left unescaped (they carry semantic meaning in Payload queries)
- Skip unsupported primitives (`symbol`, `bigint`, functions)
- No support for arrays of arrays (Payload CMS does not expect this)

**Context-sensitive encoding:**

| Parameter | Input Example | Expected Output | Encoding Type |
|-----------|---------------|-----------------|---------------|
| `populate` | `{ populate: ["a", "b"] }` | `populate[0]=a&populate[1]=b` | Indexed array |
| `populate` | `{ populate: { a: true } }` | `populate[a]=true` | Nested object |
| `populate` | `{ populate: ["a", {b:{c:true}}] }` | `populate[0]=a&populate[1][b][c]=true` | Mixed array/object |
| `select` | `{ select: ["a", "b"] }` | `select=a,b` | Comma-separated |
| `sort` | `{ sort: ["a", "-b"] }` | `sort=a,-b` | Comma-separated |
| `where.or` | `{ where: { or: [obj1, obj2] } }` | `where[or][0]...&where[or][1]...` | Indexed array |

### 5.5 Clause Strategy

`IClause` implementations each have a `build(): Json` method:

- **WhereClause**: Produces `{ field: { operator: value } }`.
- **AndClause**: Produces `{ "and": [ clause.build(), ... ] }`.
- **OrClause**: Produces `{ "or": [ clause.build(), ... ] }`.
- **JoinClause**: Produces `{ joinFieldName: { limit?, page?, sort?, count?, where? } }`.

---

## 6. API Operations

### 6.1 HTTP Methods

| Method | HTTP | Path | Body | Returns |
|--------|------|------|------|---------|
| `find` | GET | `/api/{slug}` | — | `PaginatedDocsDTO` |
| `findById` | GET | `/api/{slug}/{id}` | — | `DocumentDTO` |
| `count` | GET | `/api/{slug}/count` | — | `number` (via `TotalDocsDTO`) |
| `create` | POST | `/api/{slug}` | JSON data | `DocumentDTO` (unwrapped from `doc`) |
| `updateById` | PATCH | `/api/{slug}/{id}` | JSON data | `DocumentDTO` (unwrapped from `doc`) |
| `update` | PATCH | `/api/{slug}` | JSON + where | `PaginatedDocsDTO` (full response) |
| `deleteById` | DELETE | `/api/{slug}/{id}` | — | `DocumentDTO` (unwrapped from `doc`) |
| `delete` | DELETE | `/api/{slug}` | where query | `PaginatedDocsDTO` (full response) |
| `findGlobal` | GET | `/api/globals/{slug}` | — | `DocumentDTO` |
| `updateGlobal` | PATCH | `/api/globals/{slug}` | JSON data | `DocumentDTO` (unwrapped from `result`) |
| `login` | POST | `/api/{slug}/login` | `{ email, password }` | `LoginResultDTO` |
| `me` | GET | `/api/{slug}/me` | — | `MeResultDTO` |
| `refreshToken` | POST | `/api/{slug}/refresh-token` | — | `RefreshResultDTO` |
| `forgotPassword` | POST | `/api/{slug}/forgot-password` | `{ email }` | `MessageDTO` |
| `resetPassword` | POST | `/api/{slug}/reset-password` | `{ token, password }` | `ResetPasswordResultDTO` |
| `verifyEmail` | POST | `/api/{slug}/verify/{token}` | — | `MessageDTO` |
| `logout` | POST | `/api/{slug}/logout` | — | `MessageDTO` |
| `unlock` | POST | `/api/{slug}/unlock` | `{ email }` | `MessageDTO` |
| `findVersions` | GET | `/api/{slug}/versions` | — | `PaginatedDocsDTO` |
| `findVersionById` | GET | `/api/{slug}/versions/{id}` | — | `DocumentDTO` |
| `restoreVersion` | POST | `/api/{slug}/versions/{id}` | — | `DocumentDTO` |
| `findGlobalVersions` | GET | `/api/globals/{slug}/versions` | — | `PaginatedDocsDTO` |
| `findGlobalVersionById` | GET | `/api/globals/{slug}/versions/{id}` | — | `DocumentDTO` |
| `restoreGlobalVersion` | POST | `/api/globals/{slug}/versions/{id}` | — | `DocumentDTO` (unwrapped from `doc`) |
| `request` | any | custom path | optional JSON | raw `Json \| undefined` |

### 6.2 Response Unwrapping Rules

Different methods unwrap the JSON response differently. This must be ported exactly.

| Method category | Unwrapping | Notes |
|----------------|------------|-------|
| `find`, `findVersions`, `findGlobalVersions`, `delete` (bulk), `update` (bulk) | Full response via `PaginatedDocsDTO.fromJson(json)` | |
| `findById`, `findVersionById`, `findGlobalVersionById`, `findGlobal`, `restoreVersion` | Full response via `DocumentDTO.fromJson(json)` | |
| `create`, `updateById`, `deleteById`, `restoreGlobalVersion` | Unwrap `doc` key: `DocumentDTO.fromJson(json['doc'])` | Single-doc ops return a wrapper |
| `updateGlobal` | Unwrap `result` key: `DocumentDTO.fromJson(json['result'])` | NOT `doc` |
| `count` | `TotalDocsDTO.fromJson(json)` then return `dto.totalDocs` | Returns `number` / `int` |
| `login` | `LoginResultDTO.fromJson(json)` | Full response |
| `me` | `MeResultDTO.fromJson(json)` | Full response |
| `refreshToken` | `RefreshResultDTO.fromJson(json)` | Full response |
| `resetPassword` | `ResetPasswordResultDTO.fromJson(json)` | Full response |
| `forgotPassword`, `verifyEmail`, `logout`, `unlock` | `MessageDTO.fromJson(json)` | Full response |
| `request` (escape hatch) | Returns raw `Json \| undefined` | No DTO wrapping |

### 6.3 Authentication

The `IAuthCredential` interface defines `apply(options: { headers })` for injecting auth headers. Two implementations:

- **`ApiKeyAuth`**: Sets `Authorization` to `{collectionSlug} API-Key {apiKey}`.
- **`JwtAuth`**: Sets `Authorization` to `Bearer {token}`.

Design choice: `login()` returns the result only — it does **not** auto-set auth on the HttpClient. The consumer explicitly sets auth:

```typescript
const result = await client.login({ slug: 'users', data: { email, password } });
client.setAuth({ auth: new JwtAuth({ token: result.token }) });
```

### 6.4 File Upload

- `FileUpload` (public) implements `IFileUpload` (internal interface).
- `FormDataBuilder` (internal static class) creates `FormData` with `file` (Blob) + `_payload` (JSON-stringified document data) — matching Payload SDK behavior.
- `HttpClient._fetch()` deletes the `Content-Type` header when body is `FormData` so the runtime auto-sets the multipart boundary.

### 6.5 Error Handling

`PayloadError extends Error` with `statusCode`, optional `response`, and `cause` (the parsed JSON error body). Non-2xx responses throw `PayloadError`. Network failures and JSON parse errors are wrapped in generic `Error`.

---

## 7. DTO Reference

### 7.1 Complete DTO Field Reference

| DTO | Fields | Number types (for C#/Dart) |
|-----|--------|---------------------------|
| `DocumentDTO` | `json` (Json), `id` (string), `createdAt` (Date?), `updatedAt` (Date?) | — |
| `PaginatedDocsDTO` | `docs` (DocumentDTO[]), `hasNextPage` (bool), `hasPrevPage` (bool), `limit` (number), `totalDocs` (number), `totalPages` (number), `page` (number?), `nextPage` (number?), `prevPage` (number?) | All `int` |
| `TotalDocsDTO` | `totalDocs` (number) | `int` |
| `LoginResultDTO` | `token` (string), `exp` (number), `user` (DocumentDTO), `message` (string) | `exp` -> `int` |
| `MeResultDTO` | `user` (DocumentDTO), `token` (string), `exp` (number), `collection` (string), `strategy` (string) | `exp` -> `int` |
| `RefreshResultDTO` | `refreshedToken` (string), `exp` (number), `user` (DocumentDTO) | `exp` -> `int` |
| `ResetPasswordResultDTO` | `user` (DocumentDTO), `token` (string) | — |
| `MessageDTO` | `message` (string) | — |

### 7.2 Factory Method Pattern

All DTOs use `static fromJson(json: Json)`: create instance, guard each field with a type check, assign if valid. No separate mapper classes.

---

## 8. Porting Guide: TypeScript to C# and Dart

### 8.1 Key Principle

The `lib/` folder maps 1:1 to C#/Dart — every file in it has a direct equivalent. The `types/` folder at the project root contains TS-only type aliases that have NO file equivalents in C#/Dart (the native dictionary types serve this role). The `index.ts` barrel export at the project root is TS-only (C# uses namespaces; Dart uses a barrel file at `lib/payload_client.dart`).

### 8.2 Core Type Mappings

| TypeScript | C# | Dart | Notes |
|---|---|---|---|
| `Json` / `JsonObject` (type alias) | `Dictionary<string, object?>` | `Map<String, dynamic>` | No wrapper class — use native dictionary |
| `JsonValue` (union) | `object?` | `dynamic` | No separate type needed |
| `JsonArray` | `List<object?>` | `List<dynamic>` | No separate type needed |
| `JsonPrimitive` | `object?` | `dynamic` | No dedicated primitive union |
| `Record<string, string>` | `Dictionary<string, string>` | `Map<String, String>` | Headers type |
| `Promise<T>` | `Task<T>` | `Future<T>` | |
| `string \| undefined` | `string?` | `String?` | |
| `number` | `int` or `double` (context-dependent) | `int` or `double` | DTO pagination -> `int`, exp timestamps -> `int` |
| `boolean` | `bool` | `bool` | |
| `Date` | `DateTime` | `DateTime` | `DocumentDTO.createdAt`/`updatedAt` |
| `undefined` | `null` | `null` | TS `undefined` = C#/Dart `null` for this codebase |

### 8.3 Enum Mapping

`Operator` and `HttpMethod` are TypeScript string enums. They map directly to native enums but require string-value mappings because the string values are used as JSON keys (e.g., `{ "title": { "equals": "foo" } }`).

**Operator (16 values):**

```typescript
// TypeScript
export enum Operator {
  Equals = 'equals', Contains = 'contains', NotEquals = 'not_equals',
  In = 'in', All = 'all', NotIn = 'not_in', Exists = 'exists',
  GreaterThan = 'greater_than', GreaterThanEqual = 'greater_than_equal',
  LessThan = 'less_than', LessThanEqual = 'less_than_equal',
  Like = 'like', NotLike = 'not_like',
  Within = 'within', Intersects = 'intersects', Near = 'near',
}
```

```csharp
// C# — enum + extension method for string value
public enum Operator { Equals, Contains, NotEquals, In, All, NotIn, Exists, ... }

public static class OperatorExtensions {
    public static string ToValue(this Operator op) => op switch {
        Operator.Equals => "equals",
        Operator.Contains => "contains",
        // ... etc
    };
}
```

```dart
// Dart — enhanced enum with value field
enum Operator {
  equals('equals'), contains('contains'), notEquals('not_equals'),
  inOp('in'),  // 'in' is a Dart keyword
  // ... etc
  const Operator(this.value);
  final String value;
}
```

**HttpMethod (5 values):**

```typescript
export enum HttpMethod { GET = 'GET', POST = 'POST', PUT = 'PUT', PATCH = 'PATCH', DELETE = 'DELETE' }
```

C#: String value matches enum name, so `ToValue()` is just `.ToString()`. Dart: Enhanced enum with `value` field.

### 8.4 JSON Serialization

| TypeScript | C# | Dart |
|---|---|---|
| `JSON.parse(text)` | `JsonSerializer.Deserialize<Dictionary<string, object?>>(text)` | `jsonDecode(text) as Map<String, dynamic>` |
| `JSON.stringify(data)` | `JsonSerializer.Serialize(data)` | `jsonEncode(data)` |

These appear in `HttpClient._fetch()` (parsing response body), HttpClient methods (serializing request body), and `FormDataBuilder.build()` (serializing `_payload` field).

### 8.5 HTTP Layer

| TypeScript | C# | Dart |
|---|---|---|
| `fetch(url, config)` | `httpClient.SendAsync(request)` | `httpClient.send(request)` |
| `Response` | `HttpResponseMessage` | `http.StreamedResponse` |
| `RequestInit` | `HttpRequestMessage` | `http.Request` |
| `response.ok` | `response.IsSuccessStatusCode` | `response.statusCode >= 200 && < 300` |
| `response.text()` | `await response.Content.ReadAsStringAsync()` | `await response.stream.bytesToString()` |
| `response.status` | `(int)response.StatusCode` | `response.statusCode` |
| `FormData` | `MultipartFormDataContent` | `http.MultipartRequest` |
| `new URL(url).toString()` | `new Uri(url).ToString()` | `Uri.parse(url).toString()` |
| `encodeURIComponent(str)` | `Uri.EscapeDataString(str)` | `Uri.encodeComponent(str)` |

**`_fetch()` porting notes:**

1. **Default headers**: Always include `Accept: application/json` and `Content-Type: application/json`, merged with custom `_headers`.
2. **FormData detection**: When body is `FormData`, delete `Content-Type` header so the runtime auto-sets the multipart boundary. In C#, don't set `ContentType` on the `HttpRequestMessage`; the `MultipartFormDataContent` handles it. In Dart, `MultipartRequest` handles it automatically.
3. **Auth injection**: Call `_auth.apply({ headers })` before sending.
4. **Response parsing**: Read body as text, parse as JSON if non-empty.
5. **Error wrapping**: Non-2xx responses throw `PayloadError` with status code and parsed JSON cause. Network failures, JSON parse errors, and abort errors are wrapped in generic `Error`.

**`_normalizeUrl()` porting notes:**

Validates the URL via constructor (`new URL(url)`) and strips trailing slashes. In C#: `new Uri(url)`. In Dart: `Uri.parse(url)`.

### 8.6 Inline Options Pattern

TypeScript uses inline object types for ALL method parameters (public, private, interface). These map to native named parameters in C#/Dart. No separate "options" classes are needed.

The full list of HttpClient methods and their parameters:

| Method | Required params | Optional params |
|---|---|---|
| `find` | `slug` | `query` |
| `findById` | `slug`, `id` | `query` |
| `count` | `slug` | `query` |
| `create` | `slug`, `data` | `file` |
| `update` | `slug`, `data`, `query` | `file` |
| `updateById` | `slug`, `id`, `data` | `file` |
| `delete` | `slug`, `query` | |
| `deleteById` | `slug`, `id` | |
| `findGlobal` | `slug` | |
| `updateGlobal` | `slug`, `data` | |
| `findVersions` | `slug` | `query` |
| `findVersionById` | `slug`, `id` | |
| `restoreVersion` | `slug`, `id` | |
| `findGlobalVersions` | `slug` | `query` |
| `findGlobalVersionById` | `slug`, `id` | |
| `restoreGlobalVersion` | `slug`, `id` | |
| `login` | `slug`, `data` | |
| `me` | `slug` | |
| `refreshToken` | `slug` | |
| `forgotPassword` | `slug`, `data` | |
| `resetPassword` | `slug`, `data` | |
| `verifyEmail` | `slug`, `token` | |
| `logout` | `slug` | |
| `unlock` | `slug`, `data` | |
| `request` | `method`, `path` | `body`, `query` |

### 8.7 Interface / Contract Mapping

| TypeScript | C# | Dart |
|---|---|---|
| `interface IClause` | `interface IClause` | `abstract class IClause` |
| `interface IAuthCredential` | `interface IAuthCredential` | `abstract class IAuthCredential` |
| `interface IFileUpload` | `interface IFileUpload` | `abstract class IFileUpload` |

**IClause**: Implementations are `WhereClause`, `AndClause`, `OrClause`, `JoinClause`.

**IAuthCredential**: The TS options object wraps a single `headers` parameter. In C#/Dart, this maps to a single named parameter — no options class needed.

**IFileUpload**: The `content` field changes type: `Blob` (TS) -> `byte[]` (C#) -> `List<int>` (Dart).

### 8.8 DTO Factory Pattern

All DTOs use `static fromJson(json)` factory methods. The pattern is identical across all DTOs.

**Type guard mapping:**

| TypeScript | C# | Dart |
|---|---|---|
| `typeof data['x'] === 'string'` | `json.TryGetValue("x", out var v) && v is string s` | `json['x'] is String` |
| `typeof data['x'] === 'number'` | `json.TryGetValue("x", out var v) && v is int n` | `json['x'] is int` |
| `typeof data['x'] === 'boolean'` | `json.TryGetValue("x", out var v) && v is bool b` | `json['x'] is bool` |
| `typeof x === 'object' && x !== null && !Array.isArray(x)` | `v is Dictionary<string, object?>` | `v is Map<String, dynamic>` |
| `Array.isArray(data['x'])` | `v is List<object?> list` | `json['x'] is List` |

**Nested object check** (used in 5 DTOs for nested `DocumentDTO`):

```typescript
// TS
if (typeof data['user'] === 'object' && data['user'] !== null && !Array.isArray(data['user'])) {
  dto.user = DocumentDTO.fromJson(data['user'] as Json);
}
```

```csharp
// C#
if (data.TryGetValue("user", out var user) && user is Dictionary<string, object?> u)
    dto.User = DocumentDTO.FromJson(u);
```

```dart
// Dart
if (data['user'] is Map<String, dynamic>) {
  dto.user = DocumentDTO.fromJson(data['user']);
}
```

**PaginatedDocsDTO array filtering** (filter `docs` to only include objects):

```csharp
// C# — OfType filters to dictionaries only
dto.Docs = list.OfType<Dictionary<string, object?>>().Select(doc => DocumentDTO.FromJson(doc)).ToList();
```

```dart
// Dart — whereType filters to maps only
dto.docs = (data['docs'] as List).whereType<Map<String, dynamic>>().map((doc) => DocumentDTO.fromJson(doc)).toList();
```

### 8.9 Builder Pattern

`WhereBuilder`, `JoinBuilder`, and `QueryBuilder` all return `this` for method chaining. This is idiomatic in all three languages.

**Object.assign mapping** (used in `WhereBuilder.build()` and `JoinBuilder.build()`):

```typescript
// TS
const result: Json = {};
this._clauses.forEach(clause => { Object.assign(result, clause.build()); });
```

```csharp
// C#
var result = new Dictionary<string, object?>();
foreach (var clause in _clauses)
    foreach (var kvp in clause.Build())
        result[kvp.Key] = kvp.Value;
```

```dart
// Dart
final result = <String, dynamic>{};
for (final clause in _clauses) { result.addAll(clause.build()); }
```

**Callback pattern** (`and()` / `or()` on WhereBuilder and JoinBuilder):

```typescript
// TS — callback via options object
and(options: { callback: (builder: WhereBuilder) => void }): this
```

```csharp
// C# — Action<T> delegate
public WhereBuilder And(Action<WhereBuilder> callback)
```

```dart
// Dart — Function type
WhereBuilder and(void Function(WhereBuilder builder) callback)
```

Note: `builder._clauses` is private field access from the same class. This works in TypeScript and C# (same-class private access). In Dart, `_` prefix makes fields library-private (file-scoped), so this works if both classes are in the same file. Otherwise, expose a package-private getter.

**JoinBuilder get-or-create pattern:**

```csharp
// C#
private JoinClause? GetOrCreateClause(string on) {
    if (on == "") return null;
    var clause = _clauses.FirstOrDefault(c => c.On == on);
    if (clause == null) { clause = new JoinClause(on); _clauses.Add(clause); }
    return clause;
}
```

```dart
// Dart
JoinClause? _getOrCreateClause(String on) {
  if (on.isEmpty) return null;
  var clause = _clauses.cast<JoinClause?>().firstWhere((c) => c!.on == on, orElse: () => null);
  if (clause == null) { clause = JoinClause(on); _clauses.add(clause); }
  return clause;
}
```

### 8.10 File Upload

**TypeScript** (`FormDataBuilder.build()`):
```typescript
static build(options: { file: IFileUpload; data: Json }): FormData {
  const { file, data } = options;
  const formData = new FormData();
  const blob = (file.mimeType !== undefined) ? new Blob([file.content], { type: file.mimeType }) : file.content;
  formData.append('file', blob, file.filename);
  formData.append('_payload', JSON.stringify(data));
  return formData;
}
```

**C#:**
```csharp
public static MultipartFormDataContent Build(IFileUpload file, Dictionary<string, object?> data) {
    var content = new MultipartFormDataContent();
    var fileContent = new ByteArrayContent(file.Content);
    if (file.MimeType != null) fileContent.Headers.ContentType = new MediaTypeHeaderValue(file.MimeType);
    content.Add(fileContent, "file", file.Filename);
    content.Add(new StringContent(JsonSerializer.Serialize(data)), "_payload");
    return content;
}
```

**Dart** (note: `MultipartRequest` needs URI and method at construction time):
```dart
static http.MultipartRequest build(IFileUpload file, Map<String, dynamic> data, Uri uri, String method) {
  final request = http.MultipartRequest(method, uri);
  request.files.add(http.MultipartFile.fromBytes('file', file.content,
    filename: file.filename,
    contentType: file.mimeType != null ? MediaType.parse(file.mimeType!) : null,
  ));
  request.fields['_payload'] = jsonEncode(data);
  return request;
}
```

### 8.11 Error Handling

| TypeScript | C# | Dart |
|---|---|---|
| `class PayloadError extends Error` | `class PayloadError : Exception` | `class PayloadError implements Exception` |
| `error instanceof PayloadError` | `error is PayloadError` | `error is PayloadError` |
| `Object.setPrototypeOf(this, PayloadError.prototype)` | Not needed | Not needed |
| `error.message` | `error.Message` | `error.toString()` |
| `error.cause` | `error.InnerException` | Custom field |

Note: The TS `response` field (`Response` object) has no portable equivalent. In C#, you could store `HttpResponseMessage`; in Dart, `http.StreamedResponse`. Alternatively, omit it and rely on `statusCode` + `cause`.

### 8.12 QueryStringEncoder

The encoder operates on plain `Record<string, unknown>` objects. It is fully self-contained and can be ported as-is — the logic is a recursive serializer with no language-specific dependencies.

**URL encoding mapping:**

| TypeScript | C# | Dart |
|---|---|---|
| `encodeURIComponent(value)` | `Uri.EscapeDataString(value)` | `Uri.encodeComponent(value)` |

After encoding, unescape brackets and commas (they carry semantic meaning in Payload queries):

```typescript
encoded.replace(/%5B/g, '[').replace(/%5D/g, ']').replace(/%2C/g, ',')
```

Apply the same replacements in C#/Dart.

### 8.13 Visibility Mapping

| TypeScript | C# | Dart | Notes |
|---|---|---|---|
| `public` | `public` | default (public) | |
| `private` | `private` | `_` prefix convention | |
| `private readonly` | `private readonly` | `final` with `_` prefix | |
| `lib/internal/` (not exported) | `internal` access modifier | `src/` directory (not exported) | |
| `lib/public/` (exported) | `public` | `lib/` directory (exported) | |

**C# project structure:**

```
PayloadClient/
  Internal/                    # internal access modifier
    Contracts/
    Upload/
    Utils/
    WhereClause.cs, AndClause.cs, OrClause.cs, JoinClause.cs
  Public/                      # public access modifier
    Config/
    Enums/
    Models/
    Upload/
    HttpClient.cs, QueryBuilder.cs, WhereBuilder.cs, JoinBuilder.cs, PayloadError.cs
```

**Dart package structure:**

```
lib/
  payload_client.dart          # barrel export (equivalent to index.ts)
  src/
    internal/                  # not exported (Dart convention)
      contracts/
      upload/
      utils/
      where_clause.dart, and_clause.dart, or_clause.dart, join_clause.dart
    public/                    # re-exported from barrel
      config/
      enums/
      models/
      upload/
      http_client.dart, query_builder.dart, where_builder.dart, join_builder.dart, payload_error.dart
```

### 8.14 Portability Decisions Log

**Why no `JsonObject` wrapper class**: A wrapper was prototyped and reverted. Each language already has native JSON serialization. The wrapper forced consumers to use `new JsonObject({...})` instead of plain literals. Native dictionary types are the expected JSON representation in C# and Dart.

**Why separate `isDisabled` getter**: `JoinBuilder.build()` originally returned `Json | false | undefined`. The `false` literal in a union has no clean C#/Dart equivalent, so it was split into `build()` + `isDisabled`.

**Blob -> byte[]**: TypeScript uses `Blob` for file content. C# uses `byte[]` and Dart uses `List<int>`.

**Constructor pattern**: ALL constructors use the inline options object pattern (including `ApiKeyAuth`, `JwtAuth`, `FileUpload`, `PayloadError`).

**Private field access from same class**: `WhereBuilder.and()` accesses `builder._clauses`. Valid in TS and C#. In Dart, `_` prefix is library-private, so both classes must be in the same file or expose a getter.

---

## 9. File-by-File Porting Checklist

### Types (no C#/Dart equivalent)
- [ ] `types/Json.ts` — SKIP. Use native dictionary types.

### Barrel export
- [ ] `index.ts` — SKIP in C# (namespace-based). In Dart, create `lib/payload_client.dart` barrel.

### Contracts (internal)
- [ ] `lib/internal/contracts/IClause.ts` -> interface/abstract class
- [ ] `lib/internal/contracts/IAuthCredential.ts` -> interface/abstract class
- [ ] `lib/internal/contracts/IFileUpload.ts` -> interface/abstract class (change `Blob` to `byte[]`/`List<int>`)

### Clauses (internal)
- [ ] `lib/internal/WhereClause.ts` -> implements IClause
- [ ] `lib/internal/AndClause.ts` -> implements IClause
- [ ] `lib/internal/OrClause.ts` -> implements IClause
- [ ] `lib/internal/JoinClause.ts` -> implements IClause

### Utils (internal)
- [ ] `lib/internal/utils/QueryStringEncoder.ts` -> port recursive serializer as-is
- [ ] `lib/internal/upload/FormDataBuilder.ts` -> use platform multipart APIs

### Enums (public)
- [ ] `lib/public/enums/Operator.ts` -> enum with string value mapping
- [ ] `lib/public/enums/HttpMethod.ts` -> enum with string value mapping

### Config (public)
- [ ] `lib/public/config/ApiKeyAuth.ts` -> implements IAuthCredential
- [ ] `lib/public/config/JwtAuth.ts` -> implements IAuthCredential

### Models (public)
- [ ] `lib/public/models/collection/DocumentDTO.ts` -> class with `FromJson` static method
- [ ] `lib/public/models/collection/PaginatedDocsDTO.ts` -> class with `FromJson` static method
- [ ] `lib/public/models/collection/TotalDocsDTO.ts` -> class with `FromJson` static method
- [ ] `lib/public/models/auth/LoginResultDTO.ts` -> class with `FromJson` static method
- [ ] `lib/public/models/auth/MeResultDTO.ts` -> class with `FromJson` static method
- [ ] `lib/public/models/auth/RefreshResultDTO.ts` -> class with `FromJson` static method
- [ ] `lib/public/models/auth/ResetPasswordResultDTO.ts` -> class with `FromJson` static method
- [ ] `lib/public/models/auth/MessageDTO.ts` -> class with `FromJson` static method

### Upload (public)
- [ ] `lib/public/upload/FileUpload.ts` -> implements IFileUpload (change `Blob` to `byte[]`/`List<int>`)

### Builders (public)
- [ ] `lib/public/WhereBuilder.ts` -> fluent builder with callback pattern
- [ ] `lib/public/JoinBuilder.ts` -> fluent builder with get-or-create + isDisabled
- [ ] `lib/public/QueryBuilder.ts` -> fluent facade delegating to WhereBuilder/JoinBuilder

### Core (public)
- [ ] `lib/public/PayloadError.ts` -> extends Exception
- [ ] `lib/public/HttpClient.ts` -> 25 public methods + private `_fetch` / `_appendQueryString` / `_normalizeUrl`
