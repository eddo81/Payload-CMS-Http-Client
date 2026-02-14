# Porting Guide: TypeScript to C# and Dart

Comprehensive reference for porting the Payload CMS HTTP Client from TypeScript to C# and Dart.

## Project Overview

A lightweight HTTP client library for Payload CMS's REST API. Written in TypeScript, explicitly designed for porting to C# and Dart.

## Key Principle

The `lib/` folder maps 1:1 to C#/Dart -- every file in it has a direct equivalent. The `types/` folder at project root contains TS-only type aliases that have NO file equivalents in C#/Dart (the native dictionary types serve this role).

## Current Folder Structure

```
types/                               -> TS-only type aliases (NO equivalent in C#/Dart)
  Json.ts                            -> Json, JsonValue, JsonObject, JsonArray, JsonPrimitive
lib/
  public/                            -> Consumer-facing API surface
    config/                          -> ApiKeyAuth, JwtAuth
    enums/                           -> Operator (string enum), HttpMethod (string enum)
    models/collection/               -> DocumentDTO, PaginatedDocsDTO, TotalDocsDTO
    models/auth/                     -> LoginResultDTO, MeResultDTO, RefreshResultDTO, ResetPasswordResultDTO, MessageDTO
    upload/                          -> FileUpload
    HttpClient.ts                    -> Main HTTP client
    QueryBuilder.ts                  -> Fluent query builder
    WhereBuilder.ts                  -> Where clause composition
    JoinBuilder.ts                   -> Join clause composition
    PayloadError.ts                  -> Structured error type
  internal/                          -> Internal implementation (not exported)
    contracts/                       -> IClause, IAuthCredential, IFileUpload
    upload/                          -> FormDataBuilder
    utils/                           -> QueryStringEncoder
    WhereClause.ts                   -> Single field comparison clause
    AndClause.ts                     -> Logical AND grouping of clauses
    OrClause.ts                      -> Logical OR grouping of clauses
    JoinClause.ts                    -> Per-join-field accumulator
  index.ts                           -> Barrel export (TS-only, no equivalent)
test/                                -> Unit + integration tests
```

---

## Section 1: Core Type Mappings

| TypeScript | C# | Dart | Notes |
|---|---|---|---|
| `Json` / `JsonObject` (type alias: `{ [key: string]: JsonValue }`) | `Dictionary<string, object?>` | `Map<String, dynamic>` | No wrapper class needed -- use native dictionary |
| `JsonValue` (union: primitive \| object \| array) | `object?` | `dynamic` | No separate type needed |
| `JsonArray` (`JsonValue[]`) | `List<object?>` | `List<dynamic>` | No separate type needed |
| `JsonPrimitive` (`string \| number \| boolean \| null`) | `object?` | `dynamic` | C#/Dart don't need a dedicated primitive union |
| `Record<string, string>` | `Dictionary<string, string>` | `Map<String, String>` | Headers type |
| `Promise<T>` | `Task<T>` | `Future<T>` | |
| `string \| undefined` | `string?` | `String?` | |
| `number` | `int` or `double` (context-dependent) | `int` or `double` | DTO pagination fields -> `int`, exp timestamps -> `int` |
| `boolean` | `bool` | `bool` | |
| `Date` | `DateTime` | `DateTime` | `DocumentDTO.createdAt`/`updatedAt` |
| `undefined` | `null` | `null` | TS `undefined` and C#/Dart `null` are equivalent for this codebase |

The `types/Json.ts` file defines these type aliases:

```typescript
export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;
export type JsonObject = { [key: string]: JsonValue };
export type JsonArray = JsonValue[];
export type Json = JsonObject;
```

None of these types need dedicated files in C#/Dart. Use the native dictionary types directly.

---

## Section 2: Enum Mapping

`Operator` and `HttpMethod` are TypeScript string enums in `lib/public/enums/`. They map directly to native enums but require string-value mappings because the string values are used as JSON keys in where clauses (e.g. `{ "title": { "equals": "foo" } }`).

### Operator (16 values)

**TypeScript** (`lib/public/enums/Operator.ts`):
```typescript
export enum Operator {
  Equals = 'equals',
  Contains = 'contains',
  NotEquals = 'not_equals',
  In = 'in',
  All = 'all',
  NotIn = 'not_in',
  Exists = 'exists',
  GreaterThan = 'greater_than',
  GreaterThanEqual = 'greater_than_equal',
  LessThan = 'less_than',
  LessThanEqual = 'less_than_equal',
  Like = 'like',
  NotLike = 'not_like',
  Within = 'within',
  Intersects = 'intersects',
  Near = 'near',
}
```

**C#:**
```csharp
public enum Operator
{
    Equals,
    Contains,
    NotEquals,
    In,
    All,
    NotIn,
    Exists,
    GreaterThan,
    GreaterThanEqual,
    LessThan,
    LessThanEqual,
    Like,
    NotLike,
    Within,
    Intersects,
    Near,
}

public static class OperatorExtensions
{
    public static string ToValue(this Operator op) => op switch
    {
        Operator.Equals => "equals",
        Operator.Contains => "contains",
        Operator.NotEquals => "not_equals",
        Operator.In => "in",
        Operator.All => "all",
        Operator.NotIn => "not_in",
        Operator.Exists => "exists",
        Operator.GreaterThan => "greater_than",
        Operator.GreaterThanEqual => "greater_than_equal",
        Operator.LessThan => "less_than",
        Operator.LessThanEqual => "less_than_equal",
        Operator.Like => "like",
        Operator.NotLike => "not_like",
        Operator.Within => "within",
        Operator.Intersects => "intersects",
        Operator.Near => "near",
        _ => throw new ArgumentOutOfRangeException(nameof(op)),
    };
}
```

**Dart:**
```dart
enum Operator {
  equals('equals'),
  contains('contains'),
  notEquals('not_equals'),
  inOp('in'),        // 'in' is a Dart keyword
  all('all'),
  notIn('not_in'),
  exists('exists'),
  greaterThan('greater_than'),
  greaterThanEqual('greater_than_equal'),
  lessThan('less_than'),
  lessThanEqual('less_than_equal'),
  like('like'),
  notLike('not_like'),
  within('within'),
  intersects('intersects'),
  near('near');

  const Operator(this.value);
  final String value;
}
```

### HttpMethod (5 values)

**TypeScript** (`lib/public/enums/HttpMethod.ts`):
```typescript
export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
}
```

**C#:**
```csharp
public enum HttpMethod
{
    GET,
    POST,
    PUT,
    PATCH,
    DELETE,
}
// String value matches enum name for HttpMethod, so ToValue() is just .ToString()
```

**Dart:**
```dart
enum HttpMethod {
  get('GET'),
  post('POST'),
  put('PUT'),
  patch('PATCH'),
  delete('DELETE');

  const HttpMethod(this.value);
  final String value;
}
```

---

## Section 3: JSON Serialization

| TypeScript | C# | Dart |
|---|---|---|
| `JSON.parse(text)` | `JsonSerializer.Deserialize<Dictionary<string, object?>>(text)` | `jsonDecode(text) as Map<String, dynamic>` |
| `JSON.stringify(data)` | `JsonSerializer.Serialize(data)` | `jsonEncode(data)` |

These calls appear in:
- `HttpClient._fetch()` -- parsing response body, line 188: `json = JSON.parse(text)`
- `HttpClient` methods -- serializing request body: `JSON.stringify(data)`
- `FormDataBuilder.build()` -- serializing `_payload` field: `JSON.stringify(data)`

---

## Section 4: HTTP Layer

| TypeScript | C# | Dart |
|---|---|---|
| `fetch(url, config)` | `httpClient.SendAsync(request)` | `httpClient.send(request)` |
| `Response` | `HttpResponseMessage` | `http.StreamedResponse` |
| `RequestInit` | `HttpRequestMessage` | `http.Request` |
| `response.ok` | `response.IsSuccessStatusCode` | `response.statusCode >= 200 && response.statusCode < 300` |
| `response.text()` | `await response.Content.ReadAsStringAsync()` | `await response.stream.bytesToString()` |
| `response.status` | `(int)response.StatusCode` | `response.statusCode` |
| `FormData` | `MultipartFormDataContent` | `http.MultipartRequest` |
| `new URL(url).toString()` | `new Uri(url).ToString()` | `Uri.parse(url).toString()` |
| `encodeURIComponent(str)` | `Uri.EscapeDataString(str)` | `Uri.encodeComponent(str)` |

### _fetch() Porting Notes

The `_fetch()` method (line 158-222 of `HttpClient.ts`) is the central request pipeline. Key behaviors to replicate:

1. **Default headers**: Always include `Accept: application/json` and `Content-Type: application/json`, merged with custom `_headers`.
2. **FormData detection**: When body is `FormData`, delete `Content-Type` header so the runtime auto-sets the multipart boundary. In C#, don't set `ContentType` on the `HttpRequestMessage`; the `MultipartFormDataContent` handles it. In Dart, `MultipartRequest` handles it automatically.
3. **Auth injection**: Call `_auth.applyTo(headers)` before sending.
4. **Response parsing**: Read body as text, parse as JSON if non-empty.
5. **Error wrapping**: Non-2xx responses throw `PayloadError` with status code and parsed JSON cause. Network failures, JSON parse errors, and abort errors are wrapped in generic `Error` with descriptive messages.

### _normalizeUrl() Porting Notes

Validates the URL via constructor (`new URL(url)`) and strips trailing slashes. In C#: `new Uri(url)`. In Dart: `Uri.parse(url)`.

---

## Section 5: Inline Options Pattern

TypeScript uses inline object types for method parameters. These map to native named parameters in C#/Dart. No separate "options" classes are needed.

**TypeScript:**
```typescript
constructor(options: { baseUrl: string; headers?: Record<string, string>; auth?: IAuthCredential })

async create(options: { slug: string; data: Json; file?: IFileUpload }): Promise<DocumentDTO>

async find(options: { slug: string; query?: QueryBuilder }): Promise<PaginatedDocsDTO>

async findById(options: { slug: string; id: string; query?: QueryBuilder }): Promise<DocumentDTO>

async request(options: { method: HttpMethod; path: string; body?: Json; query?: QueryBuilder }): Promise<Json | undefined>
```

**C#:**
```csharp
public HttpClient(string baseUrl, Dictionary<string, string>? headers = null, IAuthCredential? auth = null)

public async Task<DocumentDTO> Create(string slug, Dictionary<string, object?> data, IFileUpload? file = null)

public async Task<PaginatedDocsDTO> Find(string slug, QueryBuilder? query = null)

public async Task<DocumentDTO> FindById(string slug, string id, QueryBuilder? query = null)

public async Task<Dictionary<string, object?>?> Request(HttpMethod method, string path, Dictionary<string, object?>? body = null, QueryBuilder? query = null)
```

**Dart:**
```dart
HttpClient({required String baseUrl, Map<String, String>? headers, IAuthCredential? auth})

Future<DocumentDTO> create({required String slug, required Map<String, dynamic> data, IFileUpload? file})

Future<PaginatedDocsDTO> find({required String slug, QueryBuilder? query})

Future<DocumentDTO> findById({required String slug, required String id, QueryBuilder? query})

Future<Map<String, dynamic>?> request({required HttpMethod method, required String path, Map<String, dynamic>? body, QueryBuilder? query})
```

This applies to ALL public methods. The full list of HttpClient methods:

| Method | Required params | Optional params |
|---|---|---|
| `find` | `slug` | `query` |
| `findById` | `slug`, `id` | `query` |
| `count` | `slug` | `query` |
| `create` | `slug`, `data` | `file` |
| `update` | `slug`, `data`, `query` | `file` |
| `updateById` | `slug`, `id`, `data` | `file` |
| `delete` | `slug`, `query` | |
| `deleteById` | `slug`, `id` | |
| `findGlobal` | `slug` | |
| `updateGlobal` | `slug`, `data` | |
| `findVersions` | `slug` | `query` |
| `findVersionById` | `slug`, `id` | |
| `restoreVersion` | `slug`, `id` | |
| `findGlobalVersions` | `slug` | `query` |
| `findGlobalVersionById` | `slug`, `id` | |
| `restoreGlobalVersion` | `slug`, `id` | |
| `login` | `slug`, `data` | |
| `me` | `slug` | |
| `refreshToken` | `slug` | |
| `forgotPassword` | `slug`, `data` | |
| `resetPassword` | `slug`, `data` | |
| `verifyEmail` | `slug`, `token` | |
| `logout` | `slug` | |
| `unlock` | `slug`, `data` | |
| `request` | `method`, `path` | `body`, `query` |

---

## Section 6: DTO Factory Pattern

All DTOs use `static fromJson(json)` factory methods. The pattern is identical across all DTOs: create instance, guard each field with a type check, assign if valid.

### Type Guard Mapping

| TypeScript | C# | Dart |
|---|---|---|
| `typeof data['x'] === 'string'` | `json.TryGetValue("x", out var v) && v is string s` | `json['x'] is String` |
| `typeof data['x'] === 'number'` | `json.TryGetValue("x", out var v) && v is int n` (or `double`) | `json['x'] is int` (or `double`) |
| `typeof data['x'] === 'boolean'` | `json.TryGetValue("x", out var v) && v is bool b` | `json['x'] is bool` |
| `typeof x === 'object' && x !== null && !Array.isArray(x)` | `v is Dictionary<string, object?>` | `v is Map<String, dynamic>` |
| `Array.isArray(data['x'])` | `json.TryGetValue("x", out var v) && v is List<object?> list` | `json['x'] is List` |

### Full DTO Port: DocumentDTO

**TypeScript** (`lib/public/models/collection/DocumentDTO.ts`):
```typescript
export class DocumentDTO {
  json: Json = {};
  id: string = '';
  createdAt?: Date = undefined;
  updatedAt?: Date = undefined;

  static fromJson(json: Json): DocumentDTO {
    const dto = new DocumentDTO();
    const data = (json ?? {}) as Json;
    if(data) { dto.json = data; }
    if(typeof data['id'] === 'string') { dto.id = data['id']; }
    if(typeof data['createdAt'] === 'string' && data['createdAt'] !== '') {
      dto.createdAt = new Date(data['createdAt']);
    }
    if(typeof data['updatedAt'] === 'string' && data['updatedAt'] !== '') {
      dto.updatedAt = new Date(data['updatedAt']);
    }
    return dto;
  }
}
```

**C#:**
```csharp
public class DocumentDTO
{
    public Dictionary<string, object?> Json { get; set; } = new();
    public string Id { get; set; } = "";
    public DateTime? CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    public static DocumentDTO FromJson(Dictionary<string, object?> json)
    {
        var dto = new DocumentDTO();
        var data = json ?? new Dictionary<string, object?>();

        dto.Json = data;

        if (data.TryGetValue("id", out var id) && id is string idStr)
            dto.Id = idStr;

        if (data.TryGetValue("createdAt", out var ca) && ca is string caStr && caStr != "")
            dto.CreatedAt = DateTime.Parse(caStr, null, System.Globalization.DateTimeStyles.RoundtripKind);

        if (data.TryGetValue("updatedAt", out var ua) && ua is string uaStr && uaStr != "")
            dto.UpdatedAt = DateTime.Parse(uaStr, null, System.Globalization.DateTimeStyles.RoundtripKind);

        return dto;
    }
}
```

**Dart:**
```dart
class DocumentDTO {
  Map<String, dynamic> json = {};
  String id = '';
  DateTime? createdAt;
  DateTime? updatedAt;

  static DocumentDTO fromJson(Map<String, dynamic> json) {
    final dto = DocumentDTO();
    final data = json;

    dto.json = data;

    if (data['id'] is String) dto.id = data['id'];

    if (data['createdAt'] is String && (data['createdAt'] as String).isNotEmpty) {
      dto.createdAt = DateTime.parse(data['createdAt']);
    }

    if (data['updatedAt'] is String && (data['updatedAt'] as String).isNotEmpty) {
      dto.updatedAt = DateTime.parse(data['updatedAt']);
    }

    return dto;
  }
}
```

### Nested Object Check (used in 5 DTOs)

The inline expression `typeof x === 'object' && x !== null && !Array.isArray(x)` for checking if a JSON value is an object (not array, not null) appears in `LoginResultDTO`, `MeResultDTO`, `RefreshResultDTO`, `ResetPasswordResultDTO`, and `PaginatedDocsDTO`. The translation:

**TypeScript:**
```typescript
if (typeof data['user'] === 'object' && data['user'] !== null && !Array.isArray(data['user'])) {
  dto.user = DocumentDTO.fromJson(data['user'] as Json);
}
```

**C#:**
```csharp
if (data.TryGetValue("user", out var user) && user is Dictionary<string, object?> u)
    dto.User = DocumentDTO.FromJson(u);
```

**Dart:**
```dart
if (data['user'] is Map<String, dynamic>) {
  dto.user = DocumentDTO.fromJson(data['user']);
}
```

### PaginatedDocsDTO Array Filtering

`PaginatedDocsDTO.fromJson` filters the `docs` array to only include objects (not arrays, not nulls, not primitives):

**TypeScript:**
```typescript
if (Array.isArray(data['docs'])) {
  dto.docs = data['docs']
    .filter((item): item is Json => typeof item === 'object' && item !== null && !Array.isArray(item))
    .map(doc => DocumentDTO.fromJson(doc));
}
```

**C#:**
```csharp
if (data.TryGetValue("docs", out var docs) && docs is List<object?> list)
{
    dto.Docs = list
        .OfType<Dictionary<string, object?>>()
        .Select(doc => DocumentDTO.FromJson(doc))
        .ToList();
}
```

**Dart:**
```dart
if (data['docs'] is List) {
  dto.docs = (data['docs'] as List)
      .whereType<Map<String, dynamic>>()
      .map((doc) => DocumentDTO.fromJson(doc))
      .toList();
}
```

### Complete DTO Field Reference

| DTO | Fields | Number types |
|---|---|---|
| `DocumentDTO` | `json`, `id` (string), `createdAt` (Date?), `updatedAt` (Date?) | -- |
| `PaginatedDocsDTO` | `docs` (DocumentDTO[]), `hasNextPage` (bool), `hasPrevPage` (bool), `limit` (number), `totalDocs` (number), `totalPages` (number), `page` (number?), `nextPage` (number?), `prevPage` (number?) | All `int` |
| `TotalDocsDTO` | `totalDocs` (number) | `int` |
| `LoginResultDTO` | `token` (string), `exp` (number), `user` (DocumentDTO), `message` (string) | `exp` -> `int` |
| `MeResultDTO` | `user` (DocumentDTO), `token` (string), `exp` (number), `collection` (string), `strategy` (string) | `exp` -> `int` |
| `RefreshResultDTO` | `refreshedToken` (string), `exp` (number), `user` (DocumentDTO) | `exp` -> `int` |
| `ResetPasswordResultDTO` | `user` (DocumentDTO), `token` (string) | -- |
| `MessageDTO` | `message` (string) | -- |

---

## Section 7: Interface / Contract Pattern

| TypeScript | C# | Dart |
|---|---|---|
| `interface IClause` | `interface IClause` | `abstract class IClause` |
| `interface IAuthCredential` | `interface IAuthCredential` | `abstract class IAuthCredential` |
| `interface IFileUpload` | `interface IFileUpload` | `abstract class IFileUpload` |

### IClause

```typescript
// TypeScript
export interface IClause {
  build(): Json;
}
```

```csharp
// C#
public interface IClause
{
    Dictionary<string, object?> Build();
}
```

```dart
// Dart
abstract class IClause {
  Map<String, dynamic> build();
}
```

Implementations: `WhereClause`, `AndClause`, `OrClause`, `JoinClause`.

### IAuthCredential

```typescript
// TypeScript
export interface IAuthCredential {
  applyTo(headers: Record<string, string>): void;
}
```

```csharp
// C#
public interface IAuthCredential
{
    void ApplyTo(Dictionary<string, string> headers);
}
```

```dart
// Dart
abstract class IAuthCredential {
  void applyTo(Map<String, String> headers);
}
```

Implementations:
- `ApiKeyAuth`: sets `Authorization` to `{collectionSlug} API-Key {apiKey}`
- `JwtAuth`: sets `Authorization` to `Bearer {token}`

### IFileUpload

```typescript
// TypeScript
export interface IFileUpload {
  readonly content: Blob;
  readonly filename: string;
  readonly mimeType: string | undefined;
}
```

```csharp
// C#
public interface IFileUpload
{
    byte[] Content { get; }       // Blob -> byte[]
    string Filename { get; }
    string? MimeType { get; }
}
```

```dart
// Dart
abstract class IFileUpload {
  List<int> get content;          // Blob -> List<int> (bytes)
  String get filename;
  String? get mimeType;
}
```

---

## Section 8: Builder Pattern

`WhereBuilder`, `JoinBuilder`, and `QueryBuilder` all return `this` for method chaining. This is idiomatic in all three languages.

### Object.assign Mapping

`WhereBuilder.build()` and `JoinBuilder.build()` both iterate clauses and merge with `Object.assign(result, clause.build())`:

```typescript
// TypeScript
const result: Json = {};
this._clauses.forEach(clause => {
  Object.assign(result, clause.build());
});
```

**C#:**
```csharp
var result = new Dictionary<string, object?>();
foreach (var clause in _clauses)
{
    foreach (var kvp in clause.Build())
    {
        result[kvp.Key] = kvp.Value;
    }
}
```

**Dart:**
```dart
final result = <String, dynamic>{};
for (final clause in _clauses) {
  result.addAll(clause.build());
}
```

### Clause Implementations

**WhereClause** -- produces `{ field: { operator: value } }`:

```typescript
// TypeScript
build(): Json {
  return { [this.field]: { [this.operator]: this.value } };
}
```

```csharp
// C# -- note Operator.ToValue() for the string key
public Dictionary<string, object?> Build()
{
    return new Dictionary<string, object?>
    {
        [_field] = new Dictionary<string, object?> { [_operator.ToValue()] = _value }
    };
}
```

```dart
// Dart
Map<String, dynamic> build() {
  return { _field: { _operator.value: _value } };
}
```

**AndClause** -- produces `{ "and": [ clause.build(), ... ] }`:
```typescript
build(): Json {
  return { and: this.clauses.map(clause => clause.build()) };
}
```

**OrClause** -- identical structure with key `"or"` instead of `"and"`.

**JoinClause** -- produces `{ joinFieldName: { limit?, page?, sort?, count?, where? } }`:
```typescript
build(): Json {
  const inner: Json = {};
  if (this.limit !== undefined) inner.limit = this.limit;
  if (this.page !== undefined) inner.page = this.page;
  if (this.sort !== undefined) inner.sort = this.sort;
  if (this.count !== undefined) inner.count = this.count;
  if (this.where !== undefined) inner.where = this.where;
  return { [this.on]: inner };
}
```

### JoinBuilder.isDisabled / build() Split

`JoinBuilder.build()` originally returned `Json | false | undefined`. The `false` literal in a union has no clean C#/Dart equivalent. Split into:
- `build(): Json | undefined` -- returns the joins object, or undefined if no clauses
- `get isDisabled: boolean` -- separate getter for the disabled state

`QueryBuilder.build()` checks `isDisabled` first, then calls `build()`:

```typescript
if (this._joinBuilder.isDisabled) {
  result.joins = false;
} else {
  const joins = this._joinBuilder.build();
  if (joins !== undefined) {
    result.joins = joins;
  }
}
```

In C#/Dart, `false` is a valid `object?` / `dynamic` dictionary value, so this works directly:

```csharp
if (_joinBuilder.IsDisabled)
{
    result["joins"] = false;
}
else
{
    var joins = _joinBuilder.Build();
    if (joins != null)
    {
        result["joins"] = joins;
    }
}
```

### Callback Pattern (WhereBuilder and/or)

`WhereBuilder.and()` and `WhereBuilder.or()` accept a callback that receives a fresh `WhereBuilder`. This also applies to `JoinBuilder.and()` / `JoinBuilder.or()`.

```typescript
// TypeScript
and(callback: (builder: WhereBuilder) => void): this {
  const builder = new WhereBuilder();
  callback(builder);
  this._clauses.push(new AndClause(builder._clauses));
  return this;
}
```

**C#:**
```csharp
public WhereBuilder And(Action<WhereBuilder> callback)
{
    var builder = new WhereBuilder();
    callback(builder);
    _clauses.Add(new AndClause(builder._clauses));
    return this;
}
```

**Dart:**
```dart
WhereBuilder and(void Function(WhereBuilder builder) callback) {
  final builder = WhereBuilder();
  callback(builder);
  _clauses.add(AndClause(builder._clauses));
  return this;
}
```

Note: `builder._clauses` is private field access from the same class. This works in TypeScript and C# (same-class private access). In Dart, private is file-scoped (underscore prefix), so this works as long as `WhereBuilder` and `AndClause`/`OrClause` share the same file, or you provide a public getter.

---

## Section 9: File Upload

`FormDataBuilder.build(file, data)` creates a `FormData` with:
- `file` field: the binary content as a `Blob`, with optional MIME type override
- `_payload` field: `JSON.stringify(data)` (the document data as a JSON string)

**TypeScript** (`lib/internal/upload/FormDataBuilder.ts`):
```typescript
static build(file: IFileUpload, data: Json): FormData {
  const formData = new FormData();
  const blob = (file.mimeType !== undefined)
    ? new Blob([file.content], { type: file.mimeType })
    : file.content;
  formData.append('file', blob, file.filename);
  formData.append('_payload', JSON.stringify(data));
  return formData;
}
```

**C#:**
```csharp
public static MultipartFormDataContent Build(IFileUpload file, Dictionary<string, object?> data)
{
    var content = new MultipartFormDataContent();
    var fileContent = new ByteArrayContent(file.Content);
    if (file.MimeType != null)
    {
        fileContent.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue(file.MimeType);
    }
    content.Add(fileContent, "file", file.Filename);
    content.Add(new StringContent(JsonSerializer.Serialize(data)), "_payload");
    return content;
}
```

**Dart:**
```dart
static http.MultipartRequest build(IFileUpload file, Map<String, dynamic> data, Uri uri, String method) {
  final request = http.MultipartRequest(method, uri);
  request.files.add(http.MultipartFile.fromBytes(
    'file',
    file.content,
    filename: file.filename,
    contentType: file.mimeType != null ? MediaType.parse(file.mimeType!) : null,
  ));
  request.fields['_payload'] = jsonEncode(data);
  return request;
}
```

Note: In Dart, `MultipartRequest` needs the URI and method at construction time, so the signature differs slightly from TS/C#.

---

## Section 10: Error Handling

**TypeScript** (`lib/public/PayloadError.ts`):
```typescript
export class PayloadError extends Error {
  public readonly statusCode: number;
  public readonly response?: Response;

  constructor(options: { statusCode: number; message?: string; response?: Response; cause?: unknown }) {
    super(data.message, { cause: data.cause });
    this.name = 'PayloadError';
    this.statusCode = data.statusCode;
    this.response = data.response;
    Object.setPrototypeOf(this, PayloadError.prototype);
  }
}
```

| TypeScript | C# | Dart |
|---|---|---|
| `class PayloadError extends Error` | `class PayloadError : Exception` | `class PayloadError implements Exception` |
| `error instanceof PayloadError` | `error is PayloadError` | `error is PayloadError` |
| `Object.setPrototypeOf(this, PayloadError.prototype)` | Not needed | Not needed |
| `error.message` | `error.Message` | `error.toString()` |
| `error.cause` | `error.InnerException` | Custom field |

**C#:**
```csharp
public class PayloadError : Exception
{
    public int StatusCode { get; }

    public PayloadError(int statusCode, string? message = null, Exception? innerException = null)
        : base(message ?? $"[PayloadError] Request failed with status: {statusCode}", innerException)
    {
        StatusCode = statusCode;
    }
}
```

**Dart:**
```dart
class PayloadError implements Exception {
  final int statusCode;
  final String message;
  final Object? cause;

  PayloadError({required this.statusCode, String? message, this.cause})
      : message = message ?? '[PayloadError] Request failed with status: $statusCode';

  @override
  String toString() => message;
}
```

Note: The TS `response` field (`Response` object) has no portable equivalent. In C#, you could store `HttpResponseMessage`; in Dart, `http.StreamedResponse`. Alternatively, omit it and rely on `statusCode` + `cause` (the parsed JSON error body).

---

## Section 11: QueryStringEncoder

Custom query string encoder (no external dependencies). Produces `qs-esm` compatible output for Payload CMS. Located at `lib/internal/utils/QueryStringEncoder.ts`.

Key behaviors to replicate exactly:
- Nested objects use bracket notation: `where[title][equals]=foo`
- Arrays use indexed notation: `where[or][0][title]=foo`
- `null` and `undefined` values are skipped
- `Date` values serialize as ISO strings
- `boolean` serializes as `"true"` / `"false"` strings
- No `?` prefix by default (configurable via `addQueryPrefix`, defaults to `true` in constructor)
- Square brackets `[` `]` and commas `,` are left unescaped (they carry semantic meaning in Payload queries)

The encoder operates on plain `Record<string, unknown>` objects. It is fully self-contained and can be ported as-is -- the logic is a recursive serializer with no language-specific dependencies.

### URL Encoding Mapping

| TypeScript | C# | Dart |
|---|---|---|
| `encodeURIComponent(value)` | `Uri.EscapeDataString(value)` | `Uri.encodeComponent(value)` |

After encoding, the TS code unescapes brackets and commas:
```typescript
encoded.replace(/%5B/g, '[').replace(/%5D/g, ']').replace(/%2C/g, ',')
```

Apply the same replacements in C#/Dart.

---

## Section 12: Visibility Mapping

| TypeScript | C# | Dart | Notes |
|---|---|---|---|
| `public` | `public` | default (public) | |
| `private` | `private` | `_` prefix convention | |
| `private readonly` | `private readonly` | `final` with `_` prefix | |
| `lib/internal/` (not exported) | `internal` access modifier | `src/` directory (not exported from package) | |
| `lib/public/` (exported) | `public` | `lib/` directory (exported) | |

### Dart Package Structure

```
lib/
  payload_client.dart          -> barrel export (equivalent to index.ts)
  src/
    internal/                  -> not exported (Dart convention)
      contracts/
      upload/
      utils/
      where_clause.dart
      and_clause.dart
      or_clause.dart
      join_clause.dart
    public/                    -> re-exported from barrel
      config/
      enums/
      models/
      upload/
      http_client.dart
      query_builder.dart
      where_builder.dart
      join_builder.dart
      payload_error.dart
```

### C# Project Structure

```
PayloadClient/
  Internal/                    -> internal access modifier
    Contracts/
    Upload/
    Utils/
    WhereClause.cs
    AndClause.cs
    OrClause.cs
    JoinClause.cs
  Public/                      -> public access modifier
    Config/
    Enums/
    Models/
    Upload/
    HttpClient.cs
    QueryBuilder.cs
    WhereBuilder.cs
    JoinBuilder.cs
    PayloadError.cs
```

---

## Section 13: Response Unwrapping Rules

Different HttpClient methods unwrap the JSON response differently. This must be ported exactly.

| Method category | Unwrapping | Code |
|---|---|---|
| `find`, `findVersions`, `findGlobalVersions`, `delete` (bulk), `update` (bulk) | Full response -> `PaginatedDocsDTO.fromJson(json)` | `json` is the entire response |
| `findById`, `findVersionById`, `findGlobalVersionById`, `findGlobal`, `restoreVersion` | Full response -> `DocumentDTO.fromJson(json)` | `json` is the entire response |
| `create`, `updateById`, `deleteById` | Unwrap `doc` key -> `DocumentDTO.fromJson(json['doc'])` | Single-doc ops return a wrapper |
| `updateGlobal` | Unwrap `result` key -> `DocumentDTO.fromJson(json['result'])` | NOT `doc` |
| `restoreGlobalVersion` | Unwrap `doc` key -> `DocumentDTO.fromJson(json['doc'])` | Same as single-doc ops |
| `count` | `TotalDocsDTO.fromJson(json)` -> return `dto.totalDocs` | Returns `number` / `int` |
| `login` | `LoginResultDTO.fromJson(json)` | Full response |
| `me` | `MeResultDTO.fromJson(json)` | Full response |
| `refreshToken` | `RefreshResultDTO.fromJson(json)` | Full response |
| `resetPassword` | `ResetPasswordResultDTO.fromJson(json)` | Full response |
| `forgotPassword`, `verifyEmail`, `logout`, `unlock` | `MessageDTO.fromJson(json)` | Full response |
| `request` (escape hatch) | Returns raw `Json \| undefined` | No DTO wrapping |

---

## Section 14: JoinBuilder Get-or-Create Pattern

`JoinBuilder` uses a get-or-create pattern for both `JoinClause` instances and `WhereBuilder` caches, keyed by the join field name (`on` parameter). This avoids creating duplicate clauses when multiple operations target the same join field.

**TypeScript:**
```typescript
private _getOrCreateClause(on: string): JoinClause | undefined {
  if (on === '') return undefined;
  let clause = this._clauses.find((clause) => clause.on === on);
  if (clause === undefined) {
    clause = new JoinClause(on);
    this._clauses.push(clause);
  }
  return clause;
}
```

**C#:**
```csharp
private JoinClause? GetOrCreateClause(string on)
{
    if (on == "") return null;
    var clause = _clauses.FirstOrDefault(c => c.On == on);
    if (clause == null)
    {
        clause = new JoinClause(on);
        _clauses.Add(clause);
    }
    return clause;
}
```

**Dart:**
```dart
JoinClause? _getOrCreateClause(String on) {
  if (on.isEmpty) return null;
  var clause = _clauses.cast<JoinClause?>().firstWhere((c) => c!.on == on, orElse: () => null);
  if (clause == null) {
    clause = JoinClause(on);
    _clauses.add(clause);
  }
  return clause;
}
```

The `_whereBuilders` cache uses the same pattern with a `Map<string, WhereBuilder>` (TS `Map` -> C# `Dictionary` -> Dart `Map`).

---

## Section 15: Portability Decisions Log

### Why No JsonObject Wrapper Class

A `JsonObject` wrapper class was prototyped and reverted because:
- Each language already has native JSON serialization (C#: `JsonSerializer`, Dart: `jsonDecode`/`jsonEncode`)
- The wrapper forced consumers to use `new JsonObject({...})` instead of plain object literals
- Native dictionary types are the expected JSON representation in C# and Dart
- Replacing `JSON.stringify` with `JsonSerializer.Serialize` is a mechanical find-and-replace

### Why Separate isDisabled Getter

`JoinBuilder.build()` originally returned `Json | false | undefined`. The `false` literal in a union has no clean C#/Dart equivalent. Split into `build()` (returns `Json | undefined`) and `isDisabled` (returns `boolean`).

### Blob -> byte[]

TypeScript uses `Blob` for file content. C# uses `byte[]` and Dart uses `List<int>`. The `FileUpload` class and `IFileUpload` interface should use the native byte array type in each language.

### Constructor Pattern

`ApiKeyAuth` and `JwtAuth` use positional constructor parameters (not inline options) because they have 1-2 required parameters with no optional ones. This is the one exception to the inline options rule -- use positional parameters when there are only required params and the count is small.

```typescript
// ApiKeyAuth -- positional (2 required, 0 optional)
constructor(collectionSlug: string, apiKey: string)

// JwtAuth -- positional (1 required, 0 optional)
constructor(token: string)

// HttpClient -- inline options (1 required, 2 optional)
constructor(options: { baseUrl: string; headers?: Record<string, string>; auth?: IAuthCredential })

// FileUpload -- inline options (2 required, 1 optional)
constructor(options: { content: Blob; filename: string; mimeType?: string })
```

### Private Field Access from Same Class

`WhereBuilder.and()` creates a new `WhereBuilder` and accesses `builder._clauses` (private). This is valid in TS and C# (same-class private access). In Dart, `_` prefix makes fields library-private (file-scoped), so this works if both classes are in the same file. Otherwise, expose a package-private getter.

---

## Section 16: File-by-File Porting Checklist

### Types (no C#/Dart equivalent)
- [ ] `types/Json.ts` -- SKIP. Use native dictionary types.

### Barrel export
- [ ] `lib/index.ts` -- SKIP in C# (namespace-based). In Dart, create `lib/payload_client.dart` barrel.

### Contracts (internal)
- [ ] `lib/internal/contracts/IClause.ts` -> interface/abstract class
- [ ] `lib/internal/contracts/IAuthCredential.ts` -> interface/abstract class
- [ ] `lib/internal/contracts/IFileUpload.ts` -> interface/abstract class (change `Blob` to `byte[]`/`List<int>`)

### Clauses (internal)
- [ ] `lib/internal/WhereClause.ts` -> implements IClause
- [ ] `lib/internal/AndClause.ts` -> implements IClause
- [ ] `lib/internal/OrClause.ts` -> implements IClause
- [ ] `lib/internal/JoinClause.ts` -> implements IClause

### Utils (internal)
- [ ] `lib/internal/utils/QueryStringEncoder.ts` -> port recursive serializer as-is
- [ ] `lib/internal/upload/FormDataBuilder.ts` -> use platform multipart APIs

### Enums (public)
- [ ] `lib/public/enums/Operator.ts` -> enum with string value mapping
- [ ] `lib/public/enums/HttpMethod.ts` -> enum with string value mapping

### Config (public)
- [ ] `lib/public/config/ApiKeyAuth.ts` -> implements IAuthCredential
- [ ] `lib/public/config/JwtAuth.ts` -> implements IAuthCredential

### Models (public)
- [ ] `lib/public/models/collection/DocumentDTO.ts` -> class with `FromJson` static method
- [ ] `lib/public/models/collection/PaginatedDocsDTO.ts` -> class with `FromJson` static method
- [ ] `lib/public/models/collection/TotalDocsDTO.ts` -> class with `FromJson` static method
- [ ] `lib/public/models/auth/LoginResultDTO.ts` -> class with `FromJson` static method
- [ ] `lib/public/models/auth/MeResultDTO.ts` -> class with `FromJson` static method
- [ ] `lib/public/models/auth/RefreshResultDTO.ts` -> class with `FromJson` static method
- [ ] `lib/public/models/auth/ResetPasswordResultDTO.ts` -> class with `FromJson` static method
- [ ] `lib/public/models/auth/MessageDTO.ts` -> class with `FromJson` static method

### Upload (public)
- [ ] `lib/public/upload/FileUpload.ts` -> implements IFileUpload (change `Blob` to `byte[]`/`List<int>`)

### Builders (public)
- [ ] `lib/public/WhereBuilder.ts` -> fluent builder with callback pattern
- [ ] `lib/public/JoinBuilder.ts` -> fluent builder with get-or-create + isDisabled
- [ ] `lib/public/QueryBuilder.ts` -> fluent facade delegating to WhereBuilder/JoinBuilder

### Core (public)
- [ ] `lib/public/PayloadError.ts` -> extends Exception
- [ ] `lib/public/HttpClient.ts` -> 25 public methods + private `_fetch` / `_appendQueryString` / `_normalizeUrl`
