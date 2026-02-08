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

## Quick Start

### Setup

```typescript
import { HttpClient } from 'payload-cms-http-client';

const client = new HttpClient({ baseUrl: 'http://localhost:3000' });
```

### CRUD Operations

```typescript
import { HttpClient, PayloadError } from 'payload-cms-http-client';

try {
  // Create
  const post = await client.create({
    slug: 'posts',
    data: { title: 'Hello World', content: 'My first post.' },
  });
  console.log(post.id); // "6801a..."

  // Find all
  const posts = await client.find({ slug: 'posts' });
  console.log(posts.docs.length); // 1

  // Find by ID
  const found = await client.findById({ slug: 'posts', id: post.id });
  console.log(found.json['title']); // "Hello World"

  // Update by ID
  const updated = await client.updateById({
    slug: 'posts',
    id: post.id,
    data: { title: 'Updated Title' },
  });

  // Delete by ID
  const deleted = await client.deleteById({ slug: 'posts', id: post.id });

} catch (error) {
  if (error instanceof PayloadError) {
    console.log(error.statusCode); // 400, 404, 500, etc.
    console.log(error.cause);      // Parsed JSON error body from Payload
  }
}
```

### Querying

```typescript
import { QueryBuilder } from 'payload-cms-http-client';

const results = await client.find({
  slug: 'posts',
  query: new QueryBuilder()
    .where('status', 'equals', 'published')
    .sort('createdAt')
    .limit(10)
    .page(2),
});

// Query string: ?where[status][equals]=published&sort=createdAt&limit=10&page=2
```

#### Nested Where Clauses

```typescript
const results = await client.find({
  slug: 'posts',
  query: new QueryBuilder()
    .where('status', 'equals', 'published')
    .or((builder) => {
      builder
        .where('category', 'equals', 'news')
        .where('category', 'equals', 'blog');
    }),
});

// Query string: ?where[status][equals]=published&where[or][0][category][equals]=news&where[or][1][category][equals]=blog
```

#### Joins

```typescript
const results = await client.find({
  slug: 'posts',
  query: new QueryBuilder()
    .join((join) => {
      join
        .limit('comments', 5)
        .sort('comments', 'createdAt')
        .where('comments', 'status', 'equals', 'approved');
    }),
});
```

### Authentication

#### JWT Authentication

```typescript
import { HttpClient, JwtAuth } from 'payload-cms-http-client';

const client = new HttpClient({ baseUrl: 'http://localhost:3000' });

// Login to get a token
const loginResult = await client.login({
  slug: 'users',
  data: { email: 'user@example.com', password: 'secret' },
});

// Set the token on the client
client.setAuth(new JwtAuth(loginResult.token));

// Authenticated requests now include the Bearer token
const me = await client.me({ slug: 'users' });
console.log(me.user.json['email']); // "user@example.com"
```

#### API Key Authentication

```typescript
import { HttpClient, ApiKeyAuth } from 'payload-cms-http-client';

const client = new HttpClient({
  baseUrl: 'http://localhost:3000',
  auth: new ApiKeyAuth('users', 'your-api-key-here'),
});
```

### File Uploads

```typescript
import { HttpClient, FileUpload } from 'payload-cms-http-client';

const client = new HttpClient({ baseUrl: 'http://localhost:3000' });

const media = await client.create({
  slug: 'media',
  data: { alt: 'My image' },
  file: new FileUpload({
    content: new Blob([imageBuffer]),
    filename: 'photo.png',
    mimeType: 'image/png',
  }),
});
```

### Custom Endpoints

```typescript
const result = await client.request({
  method: 'POST',
  path: '/api/custom-endpoint',
  body: { key: 'value' },
});
```

---

## API Reference

### HttpClient

The main client class. All methods accept a single options object.

#### Constructor

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

#### setHeaders

Replaces custom headers included with every request.

```typescript
setHeaders(headers: Record<string, string>): void
```

#### setAuth

Sets or clears the authentication credential.

```typescript
setAuth(auth?: IAuthCredential): void
```

#### request

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

---

#### Collection Operations

##### find

Retrieves a paginated list of documents.

```typescript
async find(options: { slug: string; query?: QueryBuilder }): Promise<PaginatedDocsDTO>
```

##### findById

Retrieves a single document by ID.

```typescript
async findById(options: { slug: string; id: string; query?: QueryBuilder }): Promise<DocumentDTO>
```

##### count

Returns the total count of documents matching an optional query.

```typescript
async count(options: { slug: string; query?: QueryBuilder }): Promise<number>
```

##### create

Creates a new document. Supports file uploads on upload-enabled collections.

```typescript
async create(options: { slug: string; data: Json; file?: IFileUpload }): Promise<DocumentDTO>
```

##### updateById

Updates a single document by ID. Supports file replacement.

```typescript
async updateById(options: { slug: string; id: string; data: Json; file?: IFileUpload }): Promise<DocumentDTO>
```

##### update

Bulk-updates all documents matching a query. Supports file uploads.

```typescript
async update(options: { slug: string; data: Json; query: QueryBuilder; file?: IFileUpload }): Promise<PaginatedDocsDTO>
```

##### deleteById

Deletes a single document by ID.

```typescript
async deleteById(options: { slug: string; id: string }): Promise<DocumentDTO>
```

##### delete

Bulk-deletes all documents matching a query.

```typescript
async delete(options: { slug: string; query: QueryBuilder }): Promise<PaginatedDocsDTO>
```

---

#### Global Operations

##### findGlobal

Retrieves a global document.

```typescript
async findGlobal(options: { slug: string }): Promise<DocumentDTO>
```

##### updateGlobal

Updates a global document.

```typescript
async updateGlobal(options: { slug: string; data: Json }): Promise<DocumentDTO>
```

---

#### Version Operations

##### findVersions

Retrieves a paginated list of versions for a collection.

```typescript
async findVersions(options: { slug: string; query?: QueryBuilder }): Promise<PaginatedDocsDTO>
```

##### findVersionById

Retrieves a single version by ID.

```typescript
async findVersionById(options: { slug: string; id: string }): Promise<DocumentDTO>
```

##### restoreVersion

Restores a collection document to a specific version.

```typescript
async restoreVersion(options: { slug: string; id: string }): Promise<DocumentDTO>
```

##### findGlobalVersions

Retrieves a paginated list of versions for a global.

```typescript
async findGlobalVersions(options: { slug: string; query?: QueryBuilder }): Promise<PaginatedDocsDTO>
```

##### findGlobalVersionById

Retrieves a single global version by ID.

```typescript
async findGlobalVersionById(options: { slug: string; id: string }): Promise<DocumentDTO>
```

##### restoreGlobalVersion

Restores a global document to a specific version.

```typescript
async restoreGlobalVersion(options: { slug: string; id: string }): Promise<DocumentDTO>
```

---

#### Authentication Operations

##### login

Authenticates a user and returns a JWT token.

```typescript
async login(options: { slug: string; data: Json }): Promise<LoginResultDTO>
```

##### me

Retrieves the currently authenticated user.

```typescript
async me(options: { slug: string }): Promise<MeResultDTO>
```

##### refreshToken

Refreshes the current JWT token.

```typescript
async refreshToken(options: { slug: string }): Promise<RefreshResultDTO>
```

##### forgotPassword

Initiates the forgot-password flow.

```typescript
async forgotPassword(options: { slug: string; data: Json }): Promise<MessageDTO>
```

##### resetPassword

Completes a password reset using a reset token.

```typescript
async resetPassword(options: { slug: string; data: Json }): Promise<ResetPasswordResultDTO>
```

##### verifyEmail

Verifies a user's email address.

```typescript
async verifyEmail(options: { slug: string; token: string }): Promise<MessageDTO>
```

---

### QueryBuilder

Fluent builder for query parameters. All methods return `this` for chaining.

```typescript
new QueryBuilder()
  .limit(10)
  .page(2)
  .sort('createdAt')
  .sortByDescending('updatedAt')
  .depth(2)
  .locale('en')
  .fallbackLocale('es')
  .select(['title', 'status'])
  .populate(['author', 'category'])
  .where('status', 'equals', 'published')
  .and((builder) => { /* nested AND group */ })
  .or((builder) => { /* nested OR group */ })
  .join((builder) => { /* join configuration */ })
```

| Method | Parameters | Description |
|--------|-----------|-------------|
| `limit` | `value: number` | Maximum documents per page. |
| `page` | `value: number` | Page number. |
| `sort` | `field: string` | Sort ascending by field. |
| `sortByDescending` | `field: string` | Sort descending by field. |
| `depth` | `value: number` | Population depth for relationships. |
| `locale` | `value: string` | Locale for localized fields. |
| `fallbackLocale` | `value: string` | Fallback locale. |
| `select` | `fields: string[]` | Fields to include in response. |
| `populate` | `fields: string[]` | Relationships to populate. |
| `where` | `field, operator, value` | Add a where condition. |
| `and` | `callback: (WhereBuilder) => void` | Nested AND group. |
| `or` | `callback: (WhereBuilder) => void` | Nested OR group. |
| `join` | `callback: (JoinBuilder) => void` | Configure joins. |

---

### WhereBuilder

Used inside `and()` and `or()` callbacks to compose nested where clauses.

```typescript
new QueryBuilder()
  .where('status', 'equals', 'published')
  .and((builder) => {
    builder
      .where('views', 'greater_than', 100)
      .where('featured', 'equals', true);
  })
  .or((builder) => {
    builder
      .where('category', 'equals', 'news')
      .where('category', 'equals', 'blog');
  });
```

| Method | Parameters | Description |
|--------|-----------|-------------|
| `where` | `field, operator, value` | Add a where condition. |
| `and` | `callback: (WhereBuilder) => void` | Nested AND group. |
| `or` | `callback: (WhereBuilder) => void` | Nested OR group. |

---

### JoinBuilder

Used inside the `join()` callback to configure relationship joins.

```typescript
new QueryBuilder()
  .join((join) => {
    join
      .limit('comments', 5)
      .page('comments', 1)
      .sort('comments', 'createdAt')
      .count('comments', true)
      .where('comments', 'approved', 'equals', true)
      .and('comments', (builder) => {
        builder.where('hidden', 'equals', false);
      });
  });
```

| Method | Parameters | Description |
|--------|-----------|-------------|
| `limit` | `on, value` | Limit documents for a join field. |
| `page` | `on, page` | Page number for a join field. |
| `sort` | `on, field` | Sort ascending by field. |
| `sortByDescending` | `on, field` | Sort descending by field. |
| `count` | `on, value?` | Enable/disable counting. |
| `where` | `on, field, operator, value` | Where condition on a join field. |
| `and` | `on, callback` | Nested AND group on a join field. |
| `or` | `on, callback` | Nested OR group on a join field. |
| `disable` | — | Disable all joins. |
| `isDisabled` | — | (getter) Whether joins are disabled. |

---

### Authentication Classes

#### ApiKeyAuth

Authenticates using Payload CMS API keys. Sets the `Authorization` header to `{slug} API-Key {key}`.

```typescript
new ApiKeyAuth(collectionSlug: string, apiKey: string)
```

#### JwtAuth

Authenticates using a JWT token. Sets the `Authorization` header to `Bearer {token}`.

```typescript
new JwtAuth(token: string)
```

Both implement `IAuthCredential` and can be passed to the `HttpClient` constructor or `setAuth()`.

---

### FileUpload

Represents a file to upload alongside document data on upload-enabled collections.

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

---

### DTOs

#### DocumentDTO

Returned by single-document operations (`create`, `findById`, `updateById`, `deleteById`, globals, versions).

| Property | Type | Description |
|----------|------|-------------|
| `id` | `string` | Document ID. |
| `json` | `Json` | The full raw JSON payload. |
| `createdAt` | `Date \| undefined` | Creation timestamp. |
| `updatedAt` | `Date \| undefined` | Last update timestamp. |

Access any field via `doc.json['fieldName']`.

#### PaginatedDocsDTO

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

#### TotalDocsDTO

Used internally by `count()`. Not typically used directly.

| Property | Type |
|----------|------|
| `totalDocs` | `number` |

#### LoginResultDTO

Returned by `login()`.

| Property | Type | Description |
|----------|------|-------------|
| `token` | `string` | JWT token. |
| `exp` | `number` | Token expiration (Unix timestamp). |
| `user` | `DocumentDTO` | The authenticated user document. |
| `message` | `string` | Status message. |

#### MeResultDTO

Returned by `me()`.

| Property | Type | Description |
|----------|------|-------------|
| `user` | `DocumentDTO` | The current user (empty if unauthenticated). |
| `token` | `string` | Current token. |
| `exp` | `number` | Token expiration. |
| `collection` | `string` | Auth collection slug. |
| `strategy` | `string` | Auth strategy used. |

#### RefreshResultDTO

Returned by `refreshToken()`.

| Property | Type | Description |
|----------|------|-------------|
| `refreshedToken` | `string` | The new JWT token. |
| `exp` | `number` | New expiration. |
| `user` | `DocumentDTO` | The user document. |

#### ResetPasswordResultDTO

Returned by `resetPassword()`.

| Property | Type | Description |
|----------|------|-------------|
| `user` | `DocumentDTO` | The user document. |
| `token` | `string` | New JWT token (if issued). |

#### MessageDTO

Returned by `forgotPassword()` and `verifyEmail()`.

| Property | Type | Description |
|----------|------|-------------|
| `message` | `string` | Status message from the server. |

---

### PayloadError

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
try {
  await client.findById({ slug: 'posts', id: 'nonexistent' });
} catch (error) {
  if (error instanceof PayloadError) {
    console.log(error.statusCode); // 404
    console.log(error.cause);      // { errors: [...] }
  }
}
```

---

### Types

#### Json

The core serialization type used for document data and request/response bodies.

```typescript
type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonObject | JsonArray;
type JsonObject = { [key: string]: JsonValue };
type JsonArray = JsonValue[];
type Json = JsonObject;
```

#### Operator

All supported Payload CMS where operators.

```typescript
type Operator =
  | 'equals' | 'not_equals'
  | 'contains' | 'like' | 'not_like'
  | 'in' | 'not_in' | 'all'
  | 'exists'
  | 'greater_than' | 'greater_than_equal'
  | 'less_than' | 'less_than_equal'
  | 'within' | 'intersects' | 'near';
```

#### HttpMethod

HTTP methods accepted by `request()`.

```typescript
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
```

---

## Portability

This library is designed for mechanical translation to C# and Dart. Key mappings:

| TypeScript | C# | Dart |
|---|---|---|
| `Json` | `Dictionary<string, object?>` | `Map<String, dynamic>` |
| `Promise<T>` | `Task<T>` | `Future<T>` |
| `Record<string, string>` | `Dictionary<string, string>` | `Map<String, String>` |
| `Blob` | `byte[]` | `Uint8List` |
| Inline option objects | Native named parameters | Required + named optional params |
| `fetch()` | `HttpClient.SendAsync()` | `http.Client.send()` |
| `??` / `?.` | `??` / `?.` | `??` / `?.` |
