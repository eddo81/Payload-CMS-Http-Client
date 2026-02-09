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
│   ├── public/
│   │   ├── config/
│   │   │   ├── ApiKeyAuth.ts
│   │   │   └── JwtAuth.ts
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
│   │   ├── types/
│   │   │   ├── HttpMethod.ts
│   │   │   ├── Json.ts
│   │   │   └── Operator.ts
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
│   ├── internal/
│   │   ├── contracts/
│   │   │   ├── IAuthCredential.ts
│   │   │   ├── IClause.ts
│   │   │   └── IFileUpload.ts
│   │   │
│   │   ├── upload/
│   │   │   └── FormDataBuilder.ts
│   │   │
│   │   ├── utils/
│   │   │   ├── QueryStringEncoder.ts
│   │   │   └── isJsonObject.ts
│   │   │
│   │   ├── AndClause.ts
│   │   ├── JoinClause.ts
│   │   ├── OrClause.ts
│   │   ├── WhereClause.ts
│   │   └── WhereBuilderRegistry.ts
│   │
│   └── index.ts           # Barrel export
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
├── package-lock.json
├── package.json
└── tsconfig.json
```

---

## Layer Responsibilities

| Folder | Purpose | Notes |
|--------|----------|-------|
| `.github/` | Project documentation and CI/CD meta files. | Holds contributor guidelines and Copilot context. |
| `lib/public/` | Consumer-facing API surface. | Contains `HttpClient`, builders, DTOs, auth, types, and upload. Exported via `index.ts`. |
| `lib/public/config/` | Authentication credentials. | `ApiKeyAuth`, `JwtAuth`. |
| `lib/public/models/` | Data Transfer Objects (DTOs) for API responses. | Split into `auth/` and `collection/` subfolders. |
| `lib/public/types/` | Shared TypeScript types and enums. | `Json`, `Operator`, `HttpMethod`. |
| `lib/public/upload/` | File upload support. | `FileUpload` class. |
| `lib/internal/` | Clause primitives and helpers. | Internal logic not intended for public export (mimics C#'s `internal`). |
| `lib/internal/contracts/` | Internal interfaces. | `IClause`, `IAuthCredential`, `IFileUpload`. |
| `lib/internal/utils/` | General-purpose helpers. | `QueryStringEncoder`, `isJsonObject`. |
| `lib/internal/upload/` | Internal upload helpers. | `FormDataBuilder`. |
| `test/` | Unit and integration tests. | Organized flat in the `test/` folder. |

---

**Last Updated:** Feb 2026
