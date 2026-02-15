# Payload CMS HTTP Client

A lightweight, zero-dependency HTTP client for the [Payload CMS](https://payloadcms.com/) REST API. Built in TypeScript with explicit design for porting to **C#** and **Dart**.

- Typed methods for collections, globals, auth, and versions
- Fluent query builder with where clauses, joins, sorting, and pagination
- File upload support via `FormData`
- API key and JWT authentication
- Custom endpoint escape hatch via `request()`
- No external dependencies

## Installation

```bash
npm install payload-cms-http-client
```

## Usage

```typescript
import { HttpClient } from 'payload-cms-http-client';

const httpClient = new HttpClient({ baseUrl: 'http://localhost:3000' });
```

### Constructor

```typescript
new HttpClient(options: {
  baseUrl: string;
  headers?: Record<string, string>;
  auth?: IAuthCredential;
})
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `baseUrl` | `string` | Payload CMS instance URL. Trailing slashes are stripped automatically. |
| `headers` | `Record<string, string>` | Optional custom headers included with every request. |
| `auth` | `IAuthCredential` | Optional authentication credential (`ApiKeyAuth` or `JwtAuth`). |

### Set headers

Replaces custom headers included with every request.

```typescript
setHeaders(options: { headers: Record<string, string> }): void
```

### Set auth

Sets or clears the authentication credential.

```typescript
setAuth(options: { auth?: IAuthCredential }): void
```

---

## Collections

### Find documents

Retrieves a paginated list of documents.

```typescript
async find(options: { slug: string; query?: QueryBuilder }): Promise<PaginatedDocsDTO>
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `slug` | `string` | Collection slug. |
| `query` | `QueryBuilder` | Optional query parameters (where, sort, limit, etc.). |

#### Example
```typescript
const result: PaginatedDocsDTO = await httpClient.find({ slug: 'posts' });

// Outputs: { docs: [DocumentDTO, ...], totalDocs: 42, totalPages: 5, page: 1, limit: 10, hasNextPage: true, hasPrevPage: false }
```

### Find by ID

Retrieves a single document by ID.

```typescript
async findById(options: { slug: string; id: string; query?: QueryBuilder }): Promise<DocumentDTO>
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `slug` | `string` | Collection slug. |
| `id` | `string` | Document ID. |
| `query` | `QueryBuilder` | Optional query parameters. |

#### Example
```typescript
const document: DocumentDTO = await httpClient.findById({ slug: 'posts', id: '123' });

// Outputs: { id: '123', json: { id: '123', title: 'Hello World', ... }, createdAt: Date, updatedAt: Date }
```

### Count

Returns the total count of documents matching an optional query.

```typescript
async count(options: { slug: string; query?: QueryBuilder }): Promise<number>
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `slug` | `string` | Collection slug. |
| `query` | `QueryBuilder` | Optional query parameters to filter the count. |

#### Example
```typescript
const total: number = await httpClient.count({ slug: 'posts' });

// Outputs: 42
```

### Create

Creates a new document. Supports file uploads on upload-enabled collections.

```typescript
async create(options: { slug: string; data: Json; file?: IFileUpload }): Promise<DocumentDTO>
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `slug` | `string` | Collection slug. |
| `data` | `Json` | Document data. |
| `file` | `IFileUpload` | Optional file to upload (for upload-enabled collections). |

#### Example
```typescript
const document: DocumentDTO = await httpClient.create({
  slug: 'posts',
  data: { title: 'Hello World', content: 'My first post.' },
});

// Outputs: { id: 'abc123', json: { id: 'abc123', title: 'Hello World', content: 'My first post.', ... }, createdAt: Date, updatedAt: Date }
```

#### File Uploads

`FileUpload` constructor:

```typescript
new FileUpload(options: {
  content: Blob;
  filename: string;
  mimeType?: string;
})
```

| Property | Type | Description |
|----------|------|-------------|
| `content` | `Blob` | The file content. |
| `filename` | `string` | The filename (including extension). |
| `mimeType` | `string \| undefined` | Optional MIME type. When set, the `Blob` is created with this type. |

#### Example
```typescript
import { FileUpload } from 'payload-cms-http-client';

const file = new FileUpload({
  content: new Blob([imageBuffer]),
  filename: 'photo.png',
  mimeType: 'image/png',
});

const document: DocumentDTO = await httpClient.create({
  slug: 'media',
  data: { alt: 'My image' },
  file: file,
});

// Outputs: { id: 'def456', json: { id: 'def456', alt: 'My image', filename: 'photo.png', mimeType: 'image/png', ... }, createdAt: Date, updatedAt: Date }
```

### Update by ID

Updates a single document by ID. Supports file replacement.

```typescript
async updateById(options: { slug: string; id: string; data: Json; file?: IFileUpload }): Promise<DocumentDTO>
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `slug` | `string` | Collection slug. |
| `id` | `string` | Document ID. |
| `data` | `Json` | Fields to update. |
| `file` | `IFileUpload` | Optional replacement file. |

#### Example
```typescript
const document: DocumentDTO = await httpClient.updateById({
  slug: 'posts',
  id: '123',
  data: { title: 'Updated Title' },
});

// Outputs: { id: '123', json: { id: '123', title: 'Updated Title', ... }, createdAt: Date, updatedAt: Date }
```

### Bulk update

Bulk-updates all documents matching a query. Supports file uploads.

```typescript
async update(options: { slug: string; data: Json; query: QueryBuilder; file?: IFileUpload }): Promise<PaginatedDocsDTO>
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `slug` | `string` | Collection slug. |
| `data` | `Json` | Fields to update on all matching documents. |
| `query` | `QueryBuilder` | Query to select documents to update. |
| `file` | `IFileUpload` | Optional file to upload. |

#### Example
```typescript
const query = new QueryBuilder()
  .where({ field: 'status', operator: Operator.Equals, value: 'draft' });

const result: PaginatedDocsDTO = await httpClient.update({
  slug: 'posts',
  data: { status: 'published' },
  query: query,
});

// Outputs: { docs: [DocumentDTO, ...], totalDocs: 3, totalPages: 1, page: 1, limit: 10, hasNextPage: false, hasPrevPage: false }
```

### Delete by ID

Deletes a single document by ID.

```typescript
async deleteById(options: { slug: string; id: string }): Promise<DocumentDTO>
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `slug` | `string` | Collection slug. |
| `id` | `string` | Document ID. |

#### Example
```typescript
const document: DocumentDTO = await httpClient.deleteById({ slug: 'posts', id: '123' });

// Outputs: { id: '123', json: { id: '123', title: 'Hello World', ... }, createdAt: Date, updatedAt: Date }
```

### Bulk delete

Bulk-deletes all documents matching a query.

```typescript
async delete(options: { slug: string; query: QueryBuilder }): Promise<PaginatedDocsDTO>
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `slug` | `string` | Collection slug. |
| `query` | `QueryBuilder` | Query to select documents to delete. |

#### Example
```typescript
const query = new QueryBuilder()
  .where({ field: 'status', operator: Operator.Equals, value: 'archived' });

const result: PaginatedDocsDTO = await httpClient.delete({
  slug: 'posts',
  query: query,
});

// Outputs: { docs: [DocumentDTO, ...], totalDocs: 5, totalPages: 1, page: 1, limit: 10, hasNextPage: false, hasPrevPage: false }
```

---

## Globals

### Find global

Retrieves a global document.

```typescript
async findGlobal(options: { slug: string }): Promise<DocumentDTO>
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `slug` | `string` | Global slug. |

#### Example
```typescript
const document: DocumentDTO = await httpClient.findGlobal({ slug: 'site-settings' });

// Outputs: { id: '', json: { siteName: 'My Site', locale: 'en', ... }, createdAt: Date, updatedAt: Date }
```

### Update global

Updates a global document.

```typescript
async updateGlobal(options: { slug: string; data: Json }): Promise<DocumentDTO>
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `slug` | `string` | Global slug. |
| `data` | `Json` | Fields to update. |

#### Example
```typescript
const document: DocumentDTO = await httpClient.updateGlobal({
  slug: 'site-settings',
  data: { siteName: 'My Site' },
});

// Outputs: { id: '', json: { siteName: 'My Site', ... }, createdAt: Date, updatedAt: Date }
```

---

## Authentication

### Login

Authenticates a user and returns a JWT token.

```typescript
async login(options: { slug: string; data: Json }): Promise<LoginResultDTO>
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `slug` | `string` | Auth-enabled collection slug. |
| `data` | `Json` | Credentials (e.g. `{ email, password }`). |

#### Example
```typescript
const result: LoginResultDTO = await httpClient.login({
  slug: 'users',
  data: { email: 'user@example.com', password: 'secret' },
});

// Outputs: { token: 'eyJhbGciOi...', exp: 1700000000, user: DocumentDTO, message: 'Authentication Passed' }
```

### Me

Retrieves the currently authenticated user.

```typescript
async me(options: { slug: string }): Promise<MeResultDTO>
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `slug` | `string` | Auth-enabled collection slug. |

#### Example
```typescript
const me: MeResultDTO = await httpClient.me({ slug: 'users' });

// Outputs: { user: DocumentDTO, token: 'eyJhbGciOi...', exp: 1700000000, collection: 'users', strategy: 'local-jwt' }
```

### Refresh token

Refreshes the current JWT token.

```typescript
async refreshToken(options: { slug: string }): Promise<RefreshResultDTO>
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `slug` | `string` | Auth-enabled collection slug. |

#### Example
```typescript
const result: RefreshResultDTO = await httpClient.refreshToken({ slug: 'users' });

// Outputs: { refreshedToken: 'eyJhbGciOi...', exp: 1700003600, user: DocumentDTO }
```

### Forgot password

Initiates the forgot-password flow.

```typescript
async forgotPassword(options: { slug: string; data: Json }): Promise<MessageDTO>
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `slug` | `string` | Auth-enabled collection slug. |
| `data` | `Json` | Request body (e.g. `{ email }`). |

#### Example
```typescript
const result: MessageDTO = await httpClient.forgotPassword({
  slug: 'users',
  data: { email: 'user@example.com' },
});

// Outputs: { message: 'Success' }
```

### Reset password

Completes a password reset using a reset token.

```typescript
async resetPassword(options: { slug: string; data: Json }): Promise<ResetPasswordResultDTO>
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `slug` | `string` | Auth-enabled collection slug. |
| `data` | `Json` | Reset data (e.g. `{ token, password }`). |

#### Example
```typescript
const result: ResetPasswordResultDTO = await httpClient.resetPassword({
  slug: 'users',
  data: { token: 'reset-token', password: 'newPassword123' },
});

// Outputs: { user: DocumentDTO, token: 'eyJhbGciOi...' }
```

### Verify email

Verifies a user's email address.

```typescript
async verifyEmail(options: { slug: string; token: string }): Promise<MessageDTO>
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `slug` | `string` | Auth-enabled collection slug. |
| `token` | `string` | Email verification token. |

#### Example
```typescript
const result: MessageDTO = await httpClient.verifyEmail({
  slug: 'users',
  token: 'verification-token',
});

// Outputs: { message: 'Email verified successfully.' }
```

### Logout

Logs out the currently authenticated user.

```typescript
async logout(options: { slug: string }): Promise<MessageDTO>
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `slug` | `string` | Auth-enabled collection slug. |

#### Example
```typescript
const result: MessageDTO = await httpClient.logout({ slug: 'users' });

// Outputs: { message: 'You have been logged out successfully.' }
```

### Unlock

Unlocks a user account that has been locked due to failed login attempts.

```typescript
async unlock(options: { slug: string; data: Json }): Promise<MessageDTO>
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `slug` | `string` | Auth-enabled collection slug. |
| `data` | `Json` | Unlock data (e.g. `{ email }`). |

#### Example
```typescript
const result: MessageDTO = await httpClient.unlock({
  slug: 'users',
  data: { email: 'user@example.com' },
});

// Outputs: { message: 'Success' }
```

### JWT Authentication

#### Example
```typescript
import { HttpClient, JwtAuth } from 'payload-cms-http-client';

const httpClient = new HttpClient({ baseUrl: 'http://localhost:3000' });

// Login to get a token
const loginResult: LoginResultDTO = await httpClient.login({
  slug: 'users',
  data: { email: 'user@example.com', password: 'secret' },
});

// Set the token on the client
httpClient.setAuth({ auth: new JwtAuth({ token: loginResult.token }) });

// Authenticated requests now include the Bearer token
const me: MeResultDTO = await httpClient.me({ slug: 'users' });
```

### API Key Authentication

#### Example
```typescript
import { HttpClient, ApiKeyAuth } from 'payload-cms-http-client';

const httpClient = new HttpClient({
  baseUrl: 'http://localhost:3000',
  auth: new ApiKeyAuth({ collectionSlug: 'users', apiKey: 'your-api-key-here' }),
});
```

#### ApiKeyAuth

Sets the `Authorization` header to `{slug} API-Key {key}`.

```typescript
new ApiKeyAuth(options: { collectionSlug: string; apiKey: string })
```

#### JwtAuth

Sets the `Authorization` header to `Bearer {token}`.

```typescript
new JwtAuth(options: { token: string })
```

Both implement `IAuthCredential` and can be passed to the `HttpClient` constructor or `setAuth()`.

---

## Versions

### Find versions

Retrieves a paginated list of versions for a collection.

```typescript
async findVersions(options: { slug: string; query?: QueryBuilder }): Promise<PaginatedDocsDTO>
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `slug` | `string` | Collection slug. |
| `query` | `QueryBuilder` | Optional query parameters. |

#### Example
```typescript
const result: PaginatedDocsDTO = await httpClient.findVersions({ slug: 'posts' });

// Outputs: { docs: [DocumentDTO, ...], totalDocs: 12, totalPages: 2, page: 1, limit: 10, hasNextPage: true, hasPrevPage: false }
```

### Find version by ID

Retrieves a single version by ID.

```typescript
async findVersionById(options: { slug: string; id: string }): Promise<DocumentDTO>
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `slug` | `string` | Collection slug. |
| `id` | `string` | Version ID. |

#### Example
```typescript
const document: DocumentDTO = await httpClient.findVersionById({ slug: 'posts', id: 'version-id' });

// Outputs: { id: 'version-id', json: { id: 'version-id', version: { title: 'Hello World', ... }, ... }, createdAt: Date, updatedAt: Date }
```

### Restore version

Restores a collection document to a specific version.

```typescript
async restoreVersion(options: { slug: string; id: string }): Promise<DocumentDTO>
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `slug` | `string` | Collection slug. |
| `id` | `string` | Version ID to restore. |

#### Example
```typescript
const document: DocumentDTO = await httpClient.restoreVersion({ slug: 'posts', id: 'version-id' });

// Outputs: { id: '123', json: { id: '123', title: 'Restored Title', ... }, createdAt: Date, updatedAt: Date }
```

### Find global versions

Retrieves a paginated list of versions for a global.

```typescript
async findGlobalVersions(options: { slug: string; query?: QueryBuilder }): Promise<PaginatedDocsDTO>
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `slug` | `string` | Global slug. |
| `query` | `QueryBuilder` | Optional query parameters. |

#### Example
```typescript
const result: PaginatedDocsDTO = await httpClient.findGlobalVersions({ slug: 'site-settings' });

// Outputs: { docs: [DocumentDTO, ...], totalDocs: 8, totalPages: 1, page: 1, limit: 10, hasNextPage: false, hasPrevPage: false }
```

### Find global version by ID

Retrieves a single global version by ID.

```typescript
async findGlobalVersionById(options: { slug: string; id: string }): Promise<DocumentDTO>
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `slug` | `string` | Global slug. |
| `id` | `string` | Version ID. |

#### Example
```typescript
const document: DocumentDTO = await httpClient.findGlobalVersionById({
  slug: 'site-settings',
  id: 'version-id',
});

// Outputs: { id: 'version-id', json: { id: 'version-id', version: { siteName: 'Old Name', ... }, ... }, createdAt: Date, updatedAt: Date }
```

### Restore global version

Restores a global document to a specific version.

```typescript
async restoreGlobalVersion(options: { slug: string; id: string }): Promise<DocumentDTO>
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `slug` | `string` | Global slug. |
| `id` | `string` | Version ID to restore. |

#### Example
```typescript
const document: DocumentDTO = await httpClient.restoreGlobalVersion({
  slug: 'site-settings',
  id: 'version-id',
});

// Outputs: { id: '', json: { siteName: 'Restored Name', ... }, createdAt: Date, updatedAt: Date }
```

---

## Custom Endpoints

Escape hatch for custom endpoints. Returns raw JSON instead of a DTO.

```typescript
async request(options: {
  method: HttpMethod;
  path: string;
  body?: Json;
  query?: QueryBuilder;
}): Promise<Json | undefined>
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `method` | `HttpMethod` | HTTP method (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`). |
| `path` | `string` | URL path appended to base URL (e.g. `/api/custom-endpoint`). |
| `body` | `Json` | Optional JSON request body. |
| `query` | `QueryBuilder` | Optional query parameters. |

#### Example
```typescript
import { HttpMethod } from 'payload-cms-http-client';

const result: Json | undefined = await httpClient.request({
  method: HttpMethod.POST,
  path: '/api/custom-endpoint',
  body: { key: 'value' },
});

// Outputs: { success: true, data: { ... } }
```

---

## Querying

### QueryBuilder

Fluent builder for query parameters. All methods return `this` for chaining.

#### Example
```typescript
import { QueryBuilder, Operator } from 'payload-cms-http-client';

const query = new QueryBuilder()
  .where({ field: 'status', operator: Operator.Equals, value: 'published' })
  .sort({ field: 'createdAt' })
  .limit({ value: 10 })
  .page({ value: 2 });

const result = await httpClient.find({ slug: 'posts', query: query });

// Outputs: ?where[status][equals]=published&sort=createdAt&limit=10&page=2
```

| Method | Parameters | Description |
|--------|-----------|-------------|
| `limit` | `options: { value: number }` | Maximum documents per page. |
| `page` | `options: { value: number }` | Page number. |
| `sort` | `options: { field: string }` | Sort ascending by field. |
| `sortByDescending` | `options: { field: string }` | Sort descending by field. |
| `depth` | `options: { value: number }` | Population depth for relationships. |
| `locale` | `options: { value: string }` | Locale for localized fields. |
| `fallbackLocale` | `options: { value: string }` | Fallback locale. |
| `select` | `options: { fields: string[] }` | Fields to include in response. |
| `populate` | `options: { fields: string[] }` | Relationships to populate. |
| `where` | `options: { field, operator, value }` | Add a where condition. |
| `and` | `options: { callback: (WhereBuilder) => void }` | Nested AND group. |
| `or` | `options: { callback: (WhereBuilder) => void }` | Nested OR group. |
| `join` | `options: { callback: (JoinBuilder) => void }` | Configure joins. |

### WhereBuilder

Used inside `and()` and `or()` callbacks to compose nested where clauses.

#### Example
```typescript
const query = new QueryBuilder()
  .where({ field: 'status', operator: Operator.Equals, value: 'published' })
  .or({ callback: (builder) => {
    builder
      .where({ field: 'category', operator: Operator.Equals, value: 'news' })
      .where({ field: 'category', operator: Operator.Equals, value: 'blog' });
  }});

const result = await httpClient.find({ slug: 'posts', query: query });

// Outputs: ?where[status][equals]=published&where[or][0][category][equals]=news&where[or][1][category][equals]=blog
```

Nested AND groups work the same way:

#### Example
```typescript
const query = new QueryBuilder()
  .where({ field: 'status', operator: Operator.Equals, value: 'published' })
  .and({ callback: (builder) => {
    builder
      .where({ field: 'views', operator: Operator.GreaterThan, value: 100 })
      .where({ field: 'featured', operator: Operator.Equals, value: true });
  }});
```

| Method | Parameters | Description |
|--------|-----------|-------------|
| `where` | `options: { field, operator, value }` | Add a where condition. |
| `and` | `options: { callback: (WhereBuilder) => void }` | Nested AND group. |
| `or` | `options: { callback: (WhereBuilder) => void }` | Nested OR group. |

### JoinBuilder

Used inside the `join()` callback to configure relationship joins.

#### Example
```typescript
const query = new QueryBuilder()
  .join({ callback: (join) => {
    join
      .limit({ on: 'comments', value: 5 })
      .sort({ on: 'comments', field: 'createdAt' })
      .where({ on: 'comments', field: 'status', operator: Operator.Equals, value: 'approved' });
  }});

const result = await httpClient.find({ slug: 'posts', query: query });
```

| Method | Parameters | Description |
|--------|-----------|-------------|
| `limit` | `options: { on, value }` | Limit documents for a join field. |
| `page` | `options: { on, value }` | Page number for a join field. |
| `sort` | `options: { on, field }` | Sort ascending by field. |
| `sortByDescending` | `options: { on, field }` | Sort descending by field. |
| `count` | `options: { on, value? }` | Enable/disable counting. |
| `where` | `options: { on, field, operator, value }` | Where condition on a join field. |
| `and` | `options: { on, callback }` | Nested AND group on a join field. |
| `or` | `options: { on, callback }` | Nested OR group on a join field. |
| `disable` | — | Disable all joins. |
| `isDisabled` | — | (getter) Whether joins are disabled. |

---

## DTOs

The included DTOs represent the **lowest common denominator** of a Payload CMS response. Because Payload collections are schema-defined by the consumer, this library cannot know the shape of your documents at compile time. Instead, `DocumentDTO` captures the universal fields (`id`, `createdAt`, `updatedAt`) and exposes the full response as a raw `json` dictionary.

These DTOs are **not intended to be your final domain models**. They serve as a transport-level representation that you should map into richer, typed models in your own application. For example:

```typescript
// Your domain model
interface BlogPost {
  id: string;
  title: string;
  content: string;
  author: string;
  publishedAt: Date;
}

// Map from DTO to your model
function toBlogPost(dto: DocumentDTO): BlogPost {
  return {
    id: dto.id,
    title: dto.json['title'] as string,
    content: dto.json['content'] as string,
    author: dto.json['author'] as string,
    publishedAt: new Date(dto.json['publishedAt'] as string),
  };
}

const dto = await httpClient.findById({ slug: 'posts', id: '123' });
const post: BlogPost = toBlogPost(dto);
```

### DocumentDTO

Returned by single-document operations (`create`, `findById`, `updateById`, `deleteById`, globals, versions).

| Property | Type | Description |
|----------|------|-------------|
| `id` | `string` | Document ID. |
| `json` | `Json` | The full raw JSON payload. |
| `createdAt` | `Date \| undefined` | Creation timestamp. |
| `updatedAt` | `Date \| undefined` | Last update timestamp. |

### PaginatedDocsDTO

Returned by paginated operations (`find`, `update`, `delete`, `findVersions`).

| Property | Type | Description |
|----------|------|-------------|
| `docs` | `DocumentDTO[]` | Array of documents. |
| `totalDocs` | `number` | Total matching documents. |
| `totalPages` | `number` | Total pages. |
| `page` | `number \| undefined` | Current page. |
| `limit` | `number` | Documents per page. |
| `hasNextPage` | `boolean` | Whether a next page exists. |
| `hasPrevPage` | `boolean` | Whether a previous page exists. |
| `nextPage` | `number \| undefined` | Next page number. |
| `prevPage` | `number \| undefined` | Previous page number. |

### Auth DTOs

| DTO | Returned by | Properties |
|-----|-------------|------------|
| `LoginResultDTO` | `login()` | `token`, `exp`, `user` (DocumentDTO), `message` |
| `MeResultDTO` | `me()` | `user`, `token`, `exp`, `collection`, `strategy` |
| `RefreshResultDTO` | `refreshToken()` | `refreshedToken`, `exp`, `user` |
| `ResetPasswordResultDTO` | `resetPassword()` | `user`, `token` |
| `MessageDTO` | `forgotPassword()`, `verifyEmail()`, `logout()`, `unlock()` | `message` |

---

## Error Handling

Thrown when a Payload CMS API request fails with a non-2xx status code.

```typescript
class PayloadError extends Error {
  readonly statusCode: number;
  readonly response?: Response;
}
```

| Property | Type | Description |
|----------|------|-------------|
| `statusCode` | `number` | HTTP status code. |
| `response` | `Response \| undefined` | The original `Response` object. |
| `message` | `string` | Error message. |
| `cause` | `unknown` | The parsed JSON error body (if available). |

```typescript
import { PayloadError } from 'payload-cms-http-client';

try {
  const document: DocumentDTO = await httpClient.findById({ slug: 'posts', id: 'nonexistent' });
} 
catch (error) {
  if (error instanceof PayloadError) {
    // Handle Payload-specific errors
  } 
  else {
    // Handle Exceptions
  }
}
```

---

## Types

### Json

The core serialization type used for document data and request/response bodies.

```typescript
type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonObject | JsonArray;
type JsonObject = { [key: string]: JsonValue };
type JsonArray = JsonValue[];
type Json = JsonObject;
```

### Operator

All supported Payload CMS where operators, exposed as a string enum.

```typescript
enum Operator {
  Equals = 'equals',
  NotEquals = 'not_equals',
  Contains = 'contains',
  Like = 'like',
  NotLike = 'not_like',
  In = 'in',
  NotIn = 'not_in',
  All = 'all',
  Exists = 'exists',
  GreaterThan = 'greater_than',
  GreaterThanEqual = 'greater_than_equal',
  LessThan = 'less_than',
  LessThanEqual = 'less_than_equal',
  Within = 'within',
  Intersects = 'intersects',
  Near = 'near',
}
```

### HttpMethod

HTTP methods accepted by `request()`, exposed as a string enum.

```typescript
enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
}
```

