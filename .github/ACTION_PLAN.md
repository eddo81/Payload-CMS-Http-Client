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

### API Key Authentication (High Priority)

The current implementation incorrectly uses `Bearer ${apiKey}` in the `Authorization` header. Payload CMS expects the format `{collection-slug} API-Key {api-key}` (e.g. `users API-Key abc123`).

- **File:** `lib/HttpClient.ts:30-33`, `lib/HttpClient.ts:58-65`
- **Issue:** Wrong header format; missing collection slug parameter
- **Fix:** Update constructor options to accept a collection slug, correct the `Authorization` header format

### JWT Authentication (Medium Priority)

Payload CMS supports JWT-based authentication via login endpoints. Tokens are returned from `POST /api/{collection-slug}/login` and passed as `Bearer {token}` in the `Authorization` header.

- **Scope:** To be designed and implemented after API key auth is corrected

---

## Summary Checklist

- [x] Fix query string `?` prefix (Critical)
- [x] URL-encode `slug` and `id` parameters (Medium)
- [x] Make `QueryBuilder.build()` idempotent (Medium)
- [x] Rename `GetClauses()` to `getClauses()` (Low)
- [x] Document `JoinBuilder.where()` overwrite behavior (Low)
- [x] Evaluate `DocumentDTO.json` redundancy (Low)
- [ ] Fix API key authentication header format (High)
- [ ] Implement JWT authentication support (Medium)
- [ ] Implement `create()` method
- [ ] Implement `delete()` method
- [ ] Implement `deleteById()` method
- [ ] Implement `update()` method
- [ ] Implement `updateById()` method
- [ ] Implement `updateGlobal()` method
