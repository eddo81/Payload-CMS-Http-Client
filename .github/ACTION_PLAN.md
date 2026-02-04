# Action Plan

This document outlines the prioritized tasks identified during the project audit. Items are grouped by priority and include references to specific files and line numbers.

## API Operations (from SDK analysis)

### Tier 1: Core Collection Operations

| Method | HTTP | Path | Body | Returns |
|--------|------|------|------|---------|
| `find()` | GET | `/api/{slug}` | — | `PaginatedDocs` |
| `findById()` | GET | `/api/{slug}/{id}` | — | Document |
| `count()` | GET | `/api/{slug}` | — | `{ totalDocs }` |
| `create()` | POST | `/api/{slug}` | JSON data | `response.doc` (unwrapped) |
| `updateById()` | PATCH | `/api/{slug}/{id}` | JSON data | `response.doc` (unwrapped) |
| `update()` | PATCH | `/api/{slug}` | JSON + where | Full response (bulk) |
| `deleteById()` | DELETE | `/api/{slug}/{id}` | — | `response.doc` (unwrapped) |
| `delete()` | DELETE | `/api/{slug}` | where query | Full response (bulk) |

### Tier 2: Global Operations

| Method | HTTP | Path | Body | Returns |
|--------|------|------|------|---------|
| `findGlobal()` | GET | `/api/globals/{slug}` | — | Document |
| `updateGlobal()` | PATCH | `/api/globals/{slug}` | JSON data | Full response |

### Tier 3: Auth Operations

| Method | HTTP | Path | Body | Returns |
|--------|------|------|------|---------|
| `login()` | POST | `/api/{slug}/login` | `{ email, password }` | `{ token, user }` |
| `me()` | GET | `/api/{slug}/me` | — | User document |
| `refreshToken()` | POST | `/api/{slug}/refresh-token` | — | `{ token, user }` |
| `forgotPassword()` | POST | `/api/{slug}/forgot-password` | `{ email }` | `{ message }` |
| `resetPassword()` | POST | `/api/{slug}/reset-password` | `{ token, password }` | `{ token, user }` |

### Tier 4: Version Operations

| Method | HTTP | Path | Body | Returns |
|--------|------|------|------|---------|
| `findVersions()` | GET | `/api/{slug}/versions` | — | `PaginatedDocs` |
| `findVersionById()` | GET | `/api/{slug}/versions/{id}` | — | Version document |
| `restoreVersion()` | POST | `/api/{slug}/versions/{id}` | — | Restored document |
| `findGlobalVersions()` | GET | `/api/globals/{slug}/versions` | — | `PaginatedDocs` |
| `findGlobalVersionById()` | GET | `/api/globals/{slug}/versions/{id}` | — | Version document |
| `restoreGlobalVersion()` | POST | `/api/globals/{slug}/versions/{id}` | — | Restored document |

### Implementation Notes

- **Single-doc operations** (`create`, `updateById`, `deleteById`): Return `json.doc`, not the wrapper
- **Bulk operations** (`update`, `delete`): Return full response with `docs[]` and `errors[]`
- **Request body**: Use `_fetch()` with `method` and `body: JSON.stringify(data)`
- **Where clause for bulk ops**: Pass through QueryBuilder, encode in query string
- **Count**: Uses same path as `find()` but with different query params

---

## Testing Recommendations

Based on the component responsibilities outlined in `PROJECT_GUIDELINES.md`:

| Component | Test Focus |
|-----------|------------|
| `QueryStringEncoder` | Generic correctness, edge cases (undefined, symbols, nested objects, arrays, dates) |
| `QueryBuilder` | Integration-level correctness, proper delegation, final serialized output |
| `WhereBuilder` | `where` structure correctness, nested `and`/`or` groups |
| `JoinBuilder` | Nested `joins` structure, idempotent overwrites, skipping empty/invalid values |
| `HttpClient` | URL construction, error handling, response mapping |

---

## Authentication

The `HttpClient` authentication configuration needs to be fixed and extended to support the strategies used by Payload CMS's REST API.

### API Key Authentication (Resolved)

Implemented via `IAuthCredential` interface (`lib/internal/contracts/IAuthCredential.ts`) and `ApiKeyAuth` class (`lib/config/ApiKeyAuth.ts`). The `HttpClient` constructor now accepts `HttpClientConfig` with an optional `auth` field. The `Authorization` header uses the correct Payload CMS format: `{collection-slug} API-Key {api-key}`.

### JWT Authentication (Medium Priority)

Payload CMS supports JWT-based authentication via login endpoints. Tokens are returned from `POST /api/{collection-slug}/login` and passed as `Bearer {token}` in the `Authorization` header.

**From SDK analysis:**
- `login()`: POST to `/{collection}/login` with `{ email, password }` → returns `{ token, user, ... }`
- `me()`: GET to `/{collection}/me` → returns current user
- `refreshToken()`: POST to `/{collection}/refresh-token`

**Implementation approach:**
- Create `JwtAuth` class implementing `IAuthCredential`
- `applyTo(headers)` sets `Authorization: Bearer {token}`
- Consider adding `login()`, `me()`, `logout()` methods to HttpClient

---

## Portability Notes

### Json Type

The `Json` type (`lib/types/Json.ts`) is portable by concept. The core shape `Json = { [key: string]: JsonValue }` maps directly to `Dictionary<string, object?>` in C# and `Map<String, dynamic>` in Dart. The recursive union subtypes (`JsonValue`, `JsonPrimitive`, `JsonArray`) provide compile-time safety specific to TypeScript and have no direct equivalent in C#/Dart, but are unnecessary there since those languages use `object`/`dynamic` for the same purpose.

### Generic Registry Pattern

The "get-or-create by string key" pattern appears in both `WhereBuilderRegistry` and `JoinBuilder._getOrCreateClause()`. If a third consumer emerges, consider extracting a generic `Registry<T>` with a factory callback. Maps to `Registry<T>` in C# and Dart with no portability concerns.

---

## Summary Checklist

- [x] Fix query string `?` prefix (Critical)
- [x] URL-encode `slug` and `id` parameters (Medium)
- [x] Make `QueryBuilder.build()` idempotent (Medium)
- [x] Rename `GetClauses()` to `getClauses()` (Low)
- [x] Document `JoinBuilder.where()` overwrite behavior (Low)
- [x] Evaluate `DocumentDTO.json` redundancy (Low)
- [x] Fix API key authentication header format (High)
- [ ] Implement JWT authentication support (Medium)
- [x] Align `IClause.build()` return type to `Json` (type safety)
- [x] Replace `JoinClause` magic strings with typed fields
- [x] Colocate mapper logic into DTO factory methods (`fromJson`/`toJson`)
**Tier 1 - Core (Priority)**
- [ ] Implement `count()` method
- [ ] Implement `create()` method
- [ ] Implement `updateById()` method
- [ ] Implement `update()` method (bulk)
- [ ] Implement `deleteById()` method
- [ ] Implement `delete()` method (bulk)
- [ ] Consider `disableErrors` option for `findById()`

**Tier 2 - Globals**
- [ ] Implement `findGlobal()` method
- [ ] Implement `updateGlobal()` method

**Tier 3 - Auth**
- [ ] Implement JWT authentication support (`JwtAuth` class)
- [ ] Implement `login()` method
- [ ] Implement `me()` method
- [ ] Implement `refreshToken()` method
- [ ] Implement `forgotPassword()` method
- [ ] Implement `resetPassword()` method

**Tier 4 - Versions (Future)**
- [ ] Implement `findVersions()` method
- [ ] Implement `findVersionById()` method
- [ ] Implement `restoreVersion()` method
- [ ] Implement `findGlobalVersions()` method
- [ ] Implement `findGlobalVersionById()` method
- [ ] Implement `restoreGlobalVersion()` method
