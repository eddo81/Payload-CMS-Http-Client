/**
 * Serializes nested objects into Payload CMS query strings.
 *
 * Preserves Payload's bracketed syntax (e.g. `where[title][equals]=foo`)
 * while URL-encoding values. Square brackets `[]` and commas `,` are
 * left unescaped by default as they carry semantic meaning.
 */
export class QueryStringEncoder {
  private readonly _addQueryPrefix: boolean;
  private readonly _strictEncoding: boolean;

 /**
  * Creates a new QueryStringEncoder.
  *
  * @param {boolean} [options.addQueryPrefix=true] - Prefix output with `?`.
  * @param {boolean} [options.strictEncoding=false] - Keep brackets and commas percent-encoded.
  */
  public constructor(options?: { addQueryPrefix?: boolean; strictEncoding?: boolean }) {
    this._addQueryPrefix = options?.addQueryPrefix ?? true;
    this._strictEncoding = options?.strictEncoding ?? false;
  }

  private get _prefix(): string {
    return this._addQueryPrefix ? '?' : '';
  }

  /**
   * Converts an object into a Payload-compatible query string.
   *
   * @param {Record<string, unknown>} obj - The object to serialize.
   *
   * @returns {string} The query string (prefixed with `?`), or empty string.
   */
  public stringify(obj: Record<string, unknown>): string {
    const result = this._serialize(obj, '') ?? '';

    if (result === '') {
      return '';
    }

    return `${this._prefix}${result}`;
  }

  /**
   * Encodes a string for safe query string inclusion.
   *
   * Preserves `[]` and `,` which are meaningful
   * to Payload CMS query syntax.
   *
   * @param {string} value - The string to encode.
   *
   * @returns {string} The encoded string.
   */
  private _safeEncode(value: string): string {
    const encoded = encodeURIComponent(value);

    if (this._strictEncoding) {
      return encoded;
    }

    return encoded
      .replace(/%5B/g, '[')
      .replace(/%5D/g, ']')
      .replace(/%2C/g, ',');
  }

  /**
   * Recursively serializes an object into query string segments.
   *
   * @param {Record<string, unknown>} obj - The object to serialize.
   * @param {string} parentKey - The accumulated key path (e.g. `where[title]`).
   *
   * @returns {string | null} A query string fragment, or `null` if empty.
   */
  private _serialize(obj: Record<string, unknown>, parentKey: string): string | null {
    const segments: string[] = [];

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
      const _key = (parentKey) ? `${parentKey}[${this._safeEncode(key)}]` : this._safeEncode(key);

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
   * Determines whether the value is a plain object.
   *
   * @param {unknown} value - The value to inspect.
   *
   * @returns {boolean} `true` if a plain object, `false` otherwise.
   */
  private _isPlainObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value) && !(value instanceof Date);
  }

  /**
   * Determines whether the value is a serializable primitive.
   *
   * @param {unknown} value - The value to inspect.
   *
   * @returns {boolean} `true` if serializable, `false` otherwise.
   */
  private _isPrimitive(value: unknown): boolean {
    return (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || value instanceof Date);
  }

  /**
   * Serializes an array using index-based notation.
   *
   * @param {unknown[]} arr - The array to serialize.
   * @param {string} parentKey - The current key path (e.g. `where[tags]`).
   * @param {string[]} segments - The accumulated query segments.
   */
  private _serializeArray(arr: unknown[], parentKey: string, segments: string[]): void {
    for (let i = 0; i < arr.length; i++) {
      const value = arr[i];
      const elementKey = `${parentKey}[${i}]`;

      if (value === undefined || value === null) {
        continue;
      } 

      const encoded: string | null = this._isPrimitive(value) ? this._serializePrimitive(elementKey, value) : null;

      // Handle primitive values first — these are terminal nodes in the structure.
      // Early continue ensures minimal nesting and clearer control flow.
      if (encoded) {
          segments.push(encoded);
          continue;
      }

      // Handle arrays recursively.
      if (Array.isArray(value)) {
        this._serializeArray(value, elementKey, segments);
        continue;
      }

      const nested: string | null = this._isPlainObject(value) ? this._serialize(value, elementKey) : null;
      
      // Recursively serialize nested objects into query segments.
      if (nested) {
          segments.push(nested);
          continue; 
      }

      // Skips unsupported types (symbol, bigint, function)
    }
  }

  /**
   * Serializes a primitive into a `key=value` pair.
   *
   * @param {string} key - The full key path (e.g. `where[title][equals]`).
   * @param {unknown} value - The primitive value to encode.
   *
   * @returns {string | null} A `key=value` string, or `null` if unsupported.
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
