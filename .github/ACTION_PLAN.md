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
- **Count**: Uses same path as `find()` but with `/count` suffix
- **File uploads**: Extend `create()` with optional `file` parameter using a portable `FilePayload` interface:
  ```typescript
  // TypeScript
  interface FilePayload { content: Blob; filename: string; mimeType?: string }
  // C#:  byte[] content  → same structure
  // Dart: Uint8List content → same structure
  ```
  Uses `FormData` with `file` + `_payload` fields (matching Payload SDK behavior).
  Only the binary type changes per language; the interface shape is portable.

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
- [x] Implement JWT authentication support (Medium)
- [x] Align `IClause.build()` return type to `Json` (type safety)
- [x] Replace `JoinClause` magic strings with typed fields
- [x] Colocate mapper logic into DTO factory methods (`fromJson`/`toJson`)
**Tier 1 - Core (Priority)**
- [x] Implement `count()` method
- [x] Implement `create()` method
- [x] Implement `updateById()` method
- [x] Implement `update()` method (bulk)
- [x] Implement `deleteById()` method
- [x] Implement `delete()` method (bulk)
- [ ] Add file upload support to `create()` (see notes below)
- [ ] Consider `disableErrors` option for `findById()`
- [ ] Integration test write operations with `ApiKeyAuth`

**Tier 2 - Globals**
- [x] Implement `findGlobal()` method
- [x] Implement `updateGlobal()` method

**Tier 3 - Auth**
- [x] Implement JWT authentication support (`JwtAuth` class)
- [x] Implement `login()` method
- [x] Implement `me()` method
- [x] Implement `refreshToken()` method
- [x] Implement `forgotPassword()` method
- [x] Implement `resetPassword()` method
- [x] Implement `verifyEmail()` method

**Tier 5 - Extensibility**
- [ ] Expose public `request()` method for custom endpoints (mirrors SDK's escape hatch for non-standard routes)

**Tier 4 - Versions**
- [x] Implement `findVersions()` method
- [x] Implement `findVersionById()` method
- [x] Implement `restoreVersion()` method
- [x] Implement `findGlobalVersions()` method
- [x] Implement `findGlobalVersionById()` method
- [x] Implement `restoreGlobalVersion()` method

---

## Post-Implementation Phase

Now that Tiers 1–4 are implemented, the following should be tackled in order:

### 1. Integration Testing
- [ ] Formalize integration tests covering all HttpClient methods against a running Payload instance
- [ ] Test auth flow end-to-end: login → use token → me → refreshToken
- [ ] Test write operations with `ApiKeyAuth` and `JwtAuth`
- [ ] Test error paths (invalid credentials, expired tokens, 403/404 responses)

### 2. Refinement & Simplification
- [ ] Review all methods for opportunities to reduce duplication or simplify
- [ ] Evaluate whether any DTOs can be consolidated without losing clarity
- [ ] Audit portability: ensure no TypeScript-specific idioms that block C#/Dart porting

### 3. Documentation & Cleanup
- [ ] Ensure all public methods and classes have terse, accurate JSDoc (move detailed descriptions to README)
- [ ] Create `README.md` with:
  - Library overview and installation
  - Detailed descriptions of each public class and method
  - Code examples for common use cases (CRUD, auth, queries, joins, globals, versions)
  - Portability notes for C#/Dart consumers
