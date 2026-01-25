# Action Plan

This document outlines the prioritized tasks identified during the project audit. Items are grouped by priority and include references to specific files and line numbers.

### 5. Document JoinBuilder.where() Overwrite Behavior

**File:** `lib/JoinBuilder.ts:199-205`

**Issue:** Multiple calls to `where()` for the same join field overwrite the previous `where` clause (last-write-wins). This may be unexpected to consumers.

**Action:** Add documentation clarifying this behavior, or consider supporting multiple where clauses per join if Payload CMS supports it.

---

### 6. Consider Deduplicating DocumentDTO.json

**File:** `lib/models/DocumentDTO.ts:10`

**Issue:** `DocumentDTO.json` stores the entire raw response, including `id`, `createdAt`, and `updatedAt` which are also extracted into dedicated fields. This creates redundancy.

**Action:** Evaluate whether `json` should exclude the extracted fields to reduce duplication, or document the intentional design choice.

---

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

## Summary Checklist

- [x] Fix query string `?` prefix (Critical)
- [x] URL-encode `slug` and `id` parameters (Medium)
- [x] Make `QueryBuilder.build()` idempotent (Medium)
- [x] Rename `GetClauses()` to `getClauses()` (Low)
- [ ] Document `JoinBuilder.where()` overwrite behavior (Low)
- [ ] Evaluate `DocumentDTO.json` redundancy (Low)
- [ ] Implement `create()` method
- [ ] Implement `delete()` method
- [ ] Implement `deleteById()` method
- [ ] Implement `update()` method
- [ ] Implement `updateById()` method
- [ ] Implement `updateGlobal()` method
