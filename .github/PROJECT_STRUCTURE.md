# Project Structure

This document provides an overview of the folder and file organization for the **Payload CMS HTTP Client** project.
It follows modular and layered principles inspired by C# and TypeScript best practices, emphasizing cross-language
portability and clear separation of concerns.

---

## Folder Overview

```
PAYLOAD-CMS-HTTP-CLIENT/
│
├── .github/
│   ├── copilot-instructions.md
│   ├── PROJECT_GUIDELINES.md
│   └── PROJECT_STRUCTURE.md
│
├── lib/
│   ├── internal/
│   │   ├── contracts/
│   │   │   └── IClause.ts
│   │   │
│   │   ├── utils/
│   │   │    └── QueryStringEncoder.ts
│   │   │
│   │   ├── AndClause.ts
│   │   ├── JoinClause.ts
│   │   ├── OrClause.ts
│   │   └── WhereClause.ts
│   │
│   ├── models/
│   │   ├── DocumentDTO.ts
│   │   ├── PaginatedDocsDTO.ts
│   │   └── QueryParametersDTO.ts
│   │
│   ├── types/
│   │   ├── Json.ts
│   │   └── Operator.ts   
│   │
│   ├── HttpClient.ts
│   ├── index.ts           # Barrel export for main library modules
│   ├── JoinBuilder.ts
│   ├── PayloadError.ts
│   ├── QueryBuilder.ts
│   └── WhereBuilder.ts
│
├── node_modules/
│
├── test/
│   ├── HttpClient.test.ts
│   ├── JoinBuilder.test.ts
│   ├── QueryBuilder.test.ts
│   ├── QueryStringEncoder.test.ts
│   ├── run-tests.ts
│   └── TestHarness.ts
│
├── package-lock.json
├── package.json
└── tsconfig.json
```

---

## Layer Responsibilities

| Folder | Purpose | Notes |
|--------|----------|-------|
| `.github/` | Project documentation and CI/CD meta files. | Holds contributor guidelines and Copilot context. |
| `lib/internal/` | Clause primitives for building Payload queries. | Internal logic not intended for public export (mimics C#’s `internal`). |
| `lib/internal/contracts/` | Internal interfaces. | `IClause` lives here. |
| `lib/internal/utils/` | General-purpose helpers. | `QueryStringEncoder` lives here. |
| `lib/models/` | Data Transfer Objects (DTOs) for API responses. | Keeps schema-related code separate from builders. |
| `lib/types/` | Shared TypeScript types and enums. | E.g., `Operator`, `Json`. |

| `lib/` root | Core public-facing API surface. | Contains `QueryBuilder`, `JoinBuilder`, `WhereBuilder`, `HttpClient`, and `PayloadError`. |
| `test/` | Unit tests for all library components. | Organized parallel to `lib/`. |

---

## Optional Refinements

### 1. Mirror Structure in Test Folder

For large projects:
```
test/
  ├── utils/
  ├── internal/
  ├── models/
  └── HttpClient.test.ts
```

### 2. Add Specs Folder (Optional)

For mock Payload CMS requests or sample JSON fixtures:
```
specs/
  ├── example-requests.http
  └── sample-response.json
```

---

**Last Updated:** Jan 2026