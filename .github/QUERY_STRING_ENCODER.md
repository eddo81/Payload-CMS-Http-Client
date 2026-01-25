# QueryStringEncoder design notes

## 1. Multi-Modal Encoding

Encoding is not determined solely by the parameter name, but also by the *shape and type* of the value:

* `populate` can be an array, object, boolean, or mix.
* `select` and `sort` expect **comma-separated strings** when passed arrays of primitives.
* Nested population is supported via objects:

  ```json
  { populate: { pages: { text: true } } }
  → populate[pages][text]=true
  ```
* Mixed arrays/objects are valid:

  ```json
  { populate: ["author", { comments: { text: true } }] }
  → populate[0]=author&populate[1][comments][text]=true
  ```

## 2. Context Awareness

* `populate`: support both arrays (index-based) and objects (nested). Mixed forms must be supported.
* `select` / `sort`: arrays encoded as **comma-separated values**, not index-based.
* All other keys: default to index-based arrays unless Payload CMS docs specify otherwise.

### Edge Cases to Handle

* Skip `null` / `undefined` / empty arrays or objects.
* Dates as ISO 8601.
* Booleans as `true` / `false`.
* URL-encode all keys/values.
* Skip unsupported primitives (`symbol`, `bigint`, functions).
* Recursively handle nested arrays/objects.
* **No support for arrays of arrays** (Payload CMS does not expect this).
* **Unencoded vs. Encoded Brackets**:

  * Brackets are intentionally left **unencoded** for readability and semantic equivalence.
  * Payload CMS interprets both `%5B%5D` and `[]` correctly.
  * Tests confirm semantic parity even when string-level diff exists.

### Summary Table

| Parameter | Input Example                       | Expected Output                        | Encoding Type      |
| --------- | ----------------------------------- | -------------------------------------- | ------------------ |
| populate  | `{ populate: ["a", "b"] }`          | `populate[0]=a&populate[1]=b`          | Indexed array      |
| populate  | `{ populate: { a: true } }`         | `populate[a]=true`                     | Nested object      |
| populate  | `{ populate: ["a", {b:{c:true}}] }` | `populate[0]=a&populate[1][b][c]=true` | Mixed array/object |
| select    | `{ select: ["a", "b"] }`            | `select=a,b`                           | Comma-separated    |
| sort      | `{ sort: ["a", "-b"] }`             | `sort=a,-b`                            | Comma-separated    |
| where.or  | `{ where: { or: [obj1, obj2] } }`   | `where[or][0]...&where[or][1]...`      | Indexed array      |
