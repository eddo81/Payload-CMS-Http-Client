# Action Plan

This document outlines the prioritized tasks identified during the project audit. Items are grouped by priority and include references to specific files and line numbers.

---

## Critical Priority

### 1. Fix Missing Query String Prefix

**File:** `lib/HttpClient.ts:90`

**Issue:** The `_appendQueryString` method returns `${url}${queryString}` without a `?` separator. This produces malformed URLs.

**Current behavior:**
```
https://example.com/api/postspage=1&limit=10
```

**Expected behavior:**
```
https://example.com/api/posts?page=1&limit=10
```

**Action:** Modify `_appendQueryString` to prepend `?` when `queryString` is non-empty.

---

## Medium Priority

### 2. URL-Encode Slug Parameters

**Files:** `lib/HttpClient.ts:179`, `lib/HttpClient.ts:187`

**Issue:** The `slug` and `id` parameters are interpolated directly into URLs without encoding. Special characters in slugs could break URL parsing or cause injection issues.

**Action:** Apply `encodeURIComponent()` to `slug` and `id` parameters in `find()` and `findById()` methods.

---

### 3. Make QueryBuilder.build() Idempotent

**File:** `lib/QueryBuilder.ts:311-324`

**Issue:** The `build()` method mutates `_queryParameters` and returns the internal reference. This causes:
- Non-idempotent behavior (calling `build()` twice with changes between calls produces unexpected results)
- External mutations to the returned DTO affect the builder's internal state

**Action:** Construct a new `QueryParametersDTO` instance in `build()` and copy values into it, rather than mutating and returning the internal instance.

---

## Low Priority

### 4. Rename GetClauses() Method

**File:** `lib/WhereBuilder.ts:55`

**Issue:** `GetClauses()` uses PascalCase, which is inconsistent with TypeScript/JavaScript naming conventions (camelCase for methods).

**Action:** Rename to `getClauses()` and update the single call site in `AndClause.ts:34` and `OrClause.ts:47`.

---

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

- [ ] Fix query string `?` prefix (Critical)
- [ ] URL-encode `slug` and `id` parameters (Medium)
- [ ] Make `QueryBuilder.build()` idempotent (Medium)
- [ ] Rename `GetClauses()` to `getClauses()` (Low)
- [ ] Document `JoinBuilder.where()` overwrite behavior (Low)
- [ ] Evaluate `DocumentDTO.json` redundancy (Low)
- [ ] Implement `create()` method
- [ ] Implement `delete()` method
- [ ] Implement `deleteById()` method
- [ ] Implement `update()` method
- [ ] Implement `updateById()` method
- [ ] Implement `updateGlobal()` method
