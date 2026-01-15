/**
 * QueryStringEncoder
 *
 * Serializes a nested object into a query string compatible with **Payload CMS**.
 *
 * This encoder is designed to preserve Payload's nested query structure
 * (e.g. `where[title][equals]=foo`) while ensuring URL-safe encoding. It uses
 * `encodeURIComponent()` internally but selectively preserves certain
 * characters that are meaningful to Payload’s syntax:
 *
 * - Square brackets `[]` — used for representing nested properties
 * - Commas `,` — used for comma-separated lists (e.g. `select=title,author`)
 *
 * The encoder supports:
 * - Nested objects and arrays
 * - Index-based array serialization (e.g. `populate[0][comments][text]=true`)
 * - Primitive values (string, number, boolean, Date)
 * - ISO-8601 date formatting
 *
 * ### Example
 * ```ts
 * const encoder = new QueryStringEncoder();
 * const query = encoder.stringify({
 *   select: ['title', 'author'],
 *   where: {
 *     or: [
 *       { title: { equals: 'foo' } },
 *       { title: { equals: 'bar' } }
 *     ]
 *   }
 * });
 *
 * // Output:
 * // "select=title,author&where[or][0][title][equals]=foo&where[or][1][title][equals]=bar"
 * ```
 *
 * This class is designed for **cross-language portability** (TypeScript, Dart, C#),
 * and avoids language-specific constructs to make porting straightforward.
 */
export class QueryStringEncoder {
  /**
   * Converts the provided object into a Payload-compatible query string.
   *
   * This is the primary entry point for consumers. It returns an empty string
   * if the input object cannot be serialized or contains no valid entries.
   *
   * @param {Record<string, unknown>} obj - The object to serialize into a query string.
   * @returns The serialized query string (never `null`).
   */
  public stringify(obj: Record<string, unknown>): string {
    return this._serialize(obj, '') ?? '';
  }

  /**
   * Encodes a string value for safe inclusion in a query string.
   *
   * Wraps `encodeURIComponent()` but *preserves* characters meaningful to
   * Payload CMS query syntax, specifically square brackets (`[]`) and commas (`,`).
   *
   * @param {string} value - The string to encode.
   * @returns The encoded string, with `[]` and `,` left unescaped.
   */
  private _safeEncode(value: string): string {
    return encodeURIComponent(value)
    .replace(/%5B/g, '[')
    .replace(/%5D/g, ']')
    .replace(/%2C/g, ',');
  }

  /**
   * Recursively serializes an object, array, or primitive into query string segments.
   *
   * This method performs a depth-first traversal of the input value and builds
   * compound keys using Payload's bracketed query syntax. Each key/value pair
   * is encoded and appended to the accumulated query string.
   *
   * @param {Record<string, unknown>} obj - The current object or value being serialized.
   * @param {string} prefix - The key prefix representing the current path in the nested structure.
   *                 For example, in `where[title][equals]`, `prefix` may be `where[title]`.
   * @returns A query string fragment, or `null` if the object contains no valid entries.
   */
  private _serialize(obj: Record<string, unknown>, prefix: string): string | null {
    const segments: string[] = []

    // Return early when hitting a non-object.
    if (typeof obj !== 'object' || obj === null) {
      return null;
    }

    for (const [key, value] of Object.entries(obj)) {
      // Skip null/undefined entries.
      if (value === undefined || value === null) {
        continue;
      }

      // Build the current key path, preserving bracket notation.
      const _key = (prefix) ? `${prefix}[${this._safeEncode(key)}]` : this._safeEncode(key);

      const encoded: string | null = this._isPrimitive(value) ? this._serializePrimitive(_key, value) : null;

      // Handle primitive values first — these are terminal nodes in the structure.
      // Early continue ensures minimal nesting and clearer control flow.
      if (encoded) { 
        segments.push(encoded);
        continue;
      }

      // Handle arrays recursively.
      if (Array.isArray(value)) {
        this._serializeArray(value, _key, segments);
        continue;
      }

      const nested: string | null = this._isPlainObject(value) ? this._serialize(value, _key) : null;

      // Recursively serialize nested objects into query segments.
      if (nested) {
        segments.push(nested);
        continue;
      }

      // Unsupported types (symbol, bigint, function) are skipped implicitly.
    }

    return segments.join('&');
  }

  /**
   * Determines whether the provided value is a plain object.
   *
   * Plain objects are defined as non-null objects that are not arrays or Dates.
   *
   * @param {Record<string, unknown>} value - The value to inspect.
   * @returns {boolean} `true` if the value is a plain object, otherwise `false`.
   */
  private _isPlainObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value) && !(value instanceof Date);
  }

  /**
   * Determines whether the provided value is a supported primitive type.
   *
   * Primitives supported by Payload CMS include strings, numbers, booleans,
   * and Date instances. All other types (e.g. symbols, functions) are ignored.
   *
   * @param value - The value to inspect.
   * @returns `true` if the value is a serializable primitive, otherwise `false`.
   */
  private _isPrimitive(value: unknown): boolean {
    return (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || value instanceof Date);
  }

  /**
   * Serializes an array using index-based notation (e.g. `key[0]=a&key[1]=b`).
   *
   * Each element is serialized based on its type:
   * - **Primitives:** encoded as `key[index]=value`
   * - **Objects:** recursively serialized into nested paths
   * - **Arrays:** handled recursively to any depth
   *
   * Null or undefined entries are skipped. Unsupported types (e.g. symbols,
   * bigints, or functions) are ignored.
   *
   * @param arr - The array to serialize.
   * @param prefix - The current key path (e.g. `populate` or `where[tags]`).
   * @param segments - The array of accumulated query segments.
   */
  private _serializeArray(arr: unknown[], prefix: string, segments: string[]): void {
    for (let i = 0; i < arr.length; i++) {
      const value = arr[i];
      const _prefix = `${prefix}[${i}]`;

      if (value === undefined || value === null) {
        continue;
      } 

      const encoded: string | null = this._isPrimitive(value) ? this._serializePrimitive(_prefix, value) : null;

      // Handle primitive values first — these are terminal nodes in the structure.
      // Early continue ensures minimal nesting and clearer control flow.  
      if (encoded) {
          segments.push(encoded);
          continue;  
      }

      // Handle arrays recursively.
      if (Array.isArray(value)) {
        this._serializeArray(value, _prefix, segments);
        continue;
      }

      const nested: string | null = this._isPlainObject(value) ? this._serialize(value, _prefix) : null;
      
      // Recursively serialize nested objects into query segments.
      if (nested) {
          segments.push(nested);
          continue; 
      }

      // Skips unsupported types (symbol, bigint, function)
    }
  }

  /**
   * Serializes a primitive value into a single `key=value` pair.
   *
   * Dates are converted to ISO 8601 strings.
   * Unsupported types (`symbol`, `bigint`) return `null`.
   *
   * @param key - The full encoded key path (e.g. `where[title][equals]`).
   * @param value - The primitive value to encode.
   * @returns A `key=value` string, or `null` if the value cannot be serialized.
   */
  private _serializePrimitive(key: string, value: unknown): string | null {
    if (typeof value === 'symbol' || typeof value === 'bigint') {
      return null;
    }

    if (value instanceof Date) {
      return `${key}=${this._safeEncode(value.toISOString())}`;
    }

    return `${key}=${this._safeEncode(String(value))}`;
  }
}
