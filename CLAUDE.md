# CLAUDE.md

This file provides context for Claude Code when working on the **Payload CMS HTTP Client** project.

## Project Overview

A lightweight, cross-language portable HTTP client library for Payload CMS's REST API. Written in TypeScript with explicit design for porting to **C#** and **Dart**.

## Quick Reference

| Command | Description |
|---------|-------------|
| `npm start` | Run unit tests |
| `npm run test:integration` | Run integration tests (requires local Payload instance) |

## Architecture

```
lib/
├── public/                # Consumer-facing API surface (exported)
│   ├── config/            # Auth credentials (ApiKeyAuth, JwtAuth)
│   ├── models/            # DTOs with fromJson/toJson factory methods
│   ├── enums/             # String enums (Operator, HttpMethod)
│   ├── types/             # Shared types (Json, JsonValue, JsonObject, etc.)
│   ├── upload/            # File upload (FileUpload)
│   ├── HttpClient.ts      # Main HTTP client
│   ├── QueryBuilder.ts    # Fluent query builder facade
│   ├── WhereBuilder.ts    # Where clause composition
│   ├── JoinBuilder.ts     # Join clause composition
│   └── PayloadError.ts    # Structured error type
├── internal/              # Internal implementation (not exported)
│   ├── contracts/         # Internal interfaces (IClause, IAuthCredential, IFileUpload)
│   ├── upload/            # FormDataBuilder
│   └── utils/             # Utilities (QueryStringEncoder)
└── index.ts               # Barrel export
```

## Key Design Principles

1. **Payload Alignment**: Mirror Payload CMS REST API behavior exactly. "Payload behavior always wins."

2. **Cross-Language Portability**: Avoid TypeScript-specific idioms. Code should map cleanly to C# and Dart.
   - No `symbol`, minimal `instanceof`
   - Simple data types, explicit constructors
   - Interfaces over abstract classes where possible

3. **No External Dependencies**: Self-contained implementations (e.g., `QueryStringEncoder` instead of `qs-esm`).

4. **Explicit Over Terse**: Favor clarity and readability. No hidden magic or reflection.

5. **Factory Methods on DTOs**: Use `static fromJson(json: Json)` and `static toJson(dto)` patterns instead of separate mapper classes.

## Code Conventions

- **Interface prefix**: All interfaces use `I` prefix (e.g., `IClause`, `IAuthCredential`)
- **Private fields**: Underscore prefix (e.g., `_clauses`, `_config`)
- **Config objects**: Prefer typed config interfaces over positional constructor parameters
- **Method chaining**: Builders return `this` for fluent API
- **JSDoc**: Laravel-style docblocks for public APIs
- **Inline option types**: Use inline object types for method parameters (see below)

### Inline Option Types (Portability Pattern)

For methods with multiple parameters, use a single inline object type in TypeScript:

```typescript
// TypeScript - inline object type, no separate interface file
create(options: { slug: string; data: Json; locale?: string; depth?: number }): Promise<DocumentDTO>
```

This maps to native named parameters in C#/Dart:

```csharp
// C# - native named/optional params
Task<DocumentDTO> Create(string slug, Dictionary<string, object?> data, string? locale = null, int? depth = null)
```

```dart
// Dart - required + named optional
Future<DocumentDTO> create({required String slug, required Map<String, dynamic> data, String? locale, int? depth})
```

**Porting rule**: Inline option objects in TS → native named parameters in C#/Dart. No separate interface/class files needed.

## Type System

The `Json` type alias (`lib/public/types/Json.ts`) is the core serialization type — a plain string-keyed dictionary. Each language uses its native equivalent directly.

```typescript
type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonObject | JsonArray;
type JsonObject = { [key: string]: JsonValue };
type JsonArray = JsonValue[];
type Json = JsonObject;  // convenience alias
```

`Operator` and `HttpMethod` are string enums (`lib/public/enums/`) mapping directly to C#/Dart enum equivalents.

Maps to:
- C#: `Dictionary<string, object?>` with `JsonSerializer.Serialize()`/`Deserialize()`
- Dart: `Map<String, dynamic>` with `jsonEncode()`/`jsonDecode()`

## Common Patterns

### Get-or-Create Pattern
Used in `JoinBuilder` for both `JoinClause` and `WhereBuilder` caching. If a third consumer emerges, extract to generic `Registry<T>`.

### Clause Strategy
`IClause` implementations (`WhereClause`, `AndClause`, `OrClause`, `JoinClause`) each have a `build(): Json` method for serialization.

### Authentication
`IAuthCredential` interface with `applyTo(headers)` method. Concrete implementations:
- `ApiKeyAuth`: `{slug} API-Key {key}` format

## Testing

- **TestHarness**: Custom lightweight test framework in `test/TestHarness.ts`
- Tests are async: `export async function testXxx() { await harness.run(...); }`
- Integration tests require a running Payload CMS instance at `http://localhost:3000`

## Current Status

All tiers complete (Core, Globals, Auth, Versions, Extensibility). Full API parity with Payload CMS REST API. See `.github/ACTION_PLAN.md` for task tracking.

## Reference: @shopnex/payload-sdk

The official Payload SDK (`node_modules/@shopnex/payload-sdk`) is installed as a dev dependency for reference.

### SDK vs Our Library Comparison

| Aspect | Payload SDK | Our Library |
|--------|-------------|-------------|
| Query encoding | `qs-esm` (external) | Custom `QueryStringEncoder` (no deps) |
| Query building | Raw options objects | Fluent `QueryBuilder` with chaining |
| Method signature | `find(options, init?)` | `find(slug, queryBuilder?)` |
| Central request | `sdk.request()` public | `_fetch()` private |
| Error handling | Generic `Error` | Custom `PayloadError` with status/cause |
| API Key auth | Manual header setup | `ApiKeyAuth` class |

### HTTP Methods (from SDK analysis)

| Operation | HTTP | Path | Body | Returns |
|-----------|------|------|------|---------|
| find | GET | `/{collection}` | — | `PaginatedDocs` |
| findByID | GET | `/{collection}/{id}` | — | Document |
| create | POST | `/{collection}` | JSON data | `response.doc` |
| updateById | PATCH | `/{collection}/{id}` | JSON data | `response.doc` |
| update (bulk) | PATCH | `/{collection}` | JSON + where | Full response |
| deleteById | DELETE | `/{collection}/{id}` | — | `response.doc` |
| delete (bulk) | DELETE | `/{collection}` | where query | Full response |

### Key Implementation Notes

1. **Response unwrapping**: Single-document operations (create, updateById, deleteById) return `json.doc`, not the wrapper.

2. **Bulk vs ID operations**: SDK uses `options.id` presence to differentiate. We use separate methods (`update` vs `updateById`) for explicitness.

3. **`disableErrors` pattern**: SDK's `findByID` can return `null` instead of throwing when `disableErrors: true`. Consider for our implementation.

4. **File uploads**: SDK handles via `FormData` with `file` + `_payload` fields. Out of scope for now but noted for future.

## Documentation Fetching

For up-to-date Payload CMS documentation, use Context7 MCP:
```
use context7 to look up Payload CMS REST API documentation
```

## File Locations

| What | Where |
|------|-------|
| Project guidelines | `.github/PROJECT_GUIDELINES.md` |
| Action plan/tasks | `.github/ACTION_PLAN.md` |
| Project structure | `.github/PROJECT_STRUCTURE.md` |
| Builder docs | `.github/QUERY_BUILDER.md`, `.github/JOIN_BUILDER.md` |
| DTO docs | `.github/DTO.md` |
