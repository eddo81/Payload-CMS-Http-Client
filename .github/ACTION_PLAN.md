# Action Plan

This document outlines the prioritized tasks identified during the project audit. Items are grouped by priority and include references to specific files and line numbers.

## Incomplete Features

The following `HttpClient` methods are stubbed and need implementation:

| Method | File Location | Purpose |
|--------|---------------|---------|
| `create()` | `lib/HttpClient.ts:194-197` | Create a new document |
| `delete()` | `lib/HttpClient.ts:199-202` | Bulk delete documents |
| `deleteById()` | `lib/HttpClient.ts:204-207` | Delete a specific document |
| `update()` | `lib/HttpClient.ts:209-212` | Bulk update documents |
| `updateById()` | `lib/HttpClient.ts:214-217` | Update a specific document |
| `updateGlobal()` | `lib/HttpClient.ts:219-222` | Update a global document |

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

- **Scope:** To be designed and implemented after API key auth is corrected

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
- [ ] Implement `create()` method
- [ ] Implement `delete()` method
- [ ] Implement `deleteById()` method
- [ ] Implement `update()` method
- [ ] Implement `updateById()` method
- [ ] Implement `updateGlobal()` method
