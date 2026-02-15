# CLAUDE.md

This file provides context for Claude Code when working on the **Payload CMS HTTP Client** project.

## Project Overview

A lightweight, zero-dependency HTTP client library for Payload CMS's REST API. Written in TypeScript with explicit design for porting to **C#** and **Dart**.

## Quick Reference

| Command | Description |
|---------|-------------|
| `npm start` | Run unit tests |
| `npm run test:integration` | Run integration tests (requires local Payload instance) |

## Architecture

```
types/                     # TS-only type aliases (NO equivalent in C#/Dart)
│   └── Json.ts            # Json, JsonValue, JsonObject, JsonArray, JsonPrimitive
lib/                       # 1:1 portable — every file has a C#/Dart equivalent
├── public/                # Consumer-facing API surface (exported)
│   ├── config/            # Auth credentials (ApiKeyAuth, JwtAuth)
│   ├── models/            # DTOs with fromJson factory methods
│   ├── enums/             # String enums (Operator, HttpMethod)
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
index.ts                   # Barrel export (project root, not inside lib/)
```

## Key Design Principles

1. **Payload Alignment**: Mirror Payload CMS REST API behavior exactly. "Payload behavior always wins."
2. **Cross-Language Portability**: Avoid TypeScript-specific idioms. Code should map cleanly to C# and Dart.
3. **No External Dependencies**: Self-contained implementations (e.g., `QueryStringEncoder` instead of `qs-esm`).
4. **Explicit Over Terse**: Favor clarity and readability. No hidden magic or reflection.
5. **Factory Methods on DTOs**: Use `static fromJson(json: Json)` patterns colocated on DTOs (not separate mapper classes).

## Code Conventions

- **Interface prefix**: All interfaces use `I` prefix (e.g., `IClause`, `IAuthCredential`)
- **Private fields**: Underscore prefix (e.g., `_clauses`, `_config`)
- **Method chaining**: Builders return `this` for fluent API
- **JSDoc**: Laravel-style docblocks for public APIs
- **Inline options pattern**: All methods use a single inline object type, destructured immediately
- **Json construction**: All `build()` methods use explicit assignment (not inline object literals)

## Testing

- **TestHarness**: Custom lightweight test framework in `test/TestHarness.ts`
- Tests are async: `export async function testXxx() { await harness.run(...); }`
- Integration tests require a running Payload CMS instance at `http://localhost:3000`

## Current Status

All tiers complete (Core, Globals, Auth, Versions, Extensibility). Full API parity with Payload CMS REST API. Pre-port refactoring complete (options pattern, destructuring, Json construction).

## Documentation

All project documentation — design philosophy, architecture, component design notes, API operations, and the complete porting guide — is consolidated in a single file:

**`PROJECT_GUIDELINES.md`** (project root)

This is the authoritative reference for both maintaining the TypeScript implementation and porting to C# and Dart.

## Documentation Fetching

For up-to-date Payload CMS documentation, use Context7 MCP:
```
use context7 to look up Payload CMS REST API documentation
```
