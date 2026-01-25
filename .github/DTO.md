## Domain ↔ Transport Mapping Boundary

Domain-level DTOs **must not contain transport logic** and **must not be serialized directly**.

All transformations between domain representations and transport-safe data
(JSON, query parameters, HTTP payloads) are handled explicitly by **mapper classes**.

This enforces a clear boundary between:

- **Domain intent**
  - Builders
  - Specifications
  - DTOs (plain data holders)
- **Transport representation**
  - Plain JSON objects
  - Query parameter objects
  - HTTP payloads and responses

### Rules

- `QueryBuilder.build()` returns a **domain DTO**, never a serializable object.
- DTOs are **dumb containers** with public fields and no transport logic.
- All inbound transformations occur in `*Mapper.fromJson(...)`.
- All outbound transformations occur in `*Mapper.toJson(...)`.
- Low-level utilities (e.g. `QueryStringEncoder`) operate **only on plain objects**.
- Mapping is **explicit**, never implicit or hidden inside DTOs.

### Example

```ts
const dto = queryBuilder.build();
const params = QueryParametersMapper.toJson(dto);
const query = encoder.stringify(params);
```
