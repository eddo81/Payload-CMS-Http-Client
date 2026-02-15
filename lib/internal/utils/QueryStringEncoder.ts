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
    const { addQueryPrefix, strictEncoding } = options ?? {};

    this._addQueryPrefix = addQueryPrefix ?? true;
    this._strictEncoding = strictEncoding ?? false;
  }

  private get _prefix(): string {
    return this._addQueryPrefix ? '?' : '';
  }

  /**
   * Converts an object into a Payload-compatible query string.
   *
   * @param {Record<string, unknown>} options.obj - The object to serialize.
   *
   * @returns {string} The query string (prefixed with `?`), or empty string.
   */
  public stringify(options: { obj: Record<string, unknown> }): string {
    const { obj } = options;
    const result = this._serialize({ obj, parentKey: '' }) ?? '';

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
   * @param {string} options.value - The string to encode.
   *
   * @returns {string} The encoded string.
   */
  private _safeEncode(options: { value: string }): string {
    const { value } = options;
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
   * @param {Record<string, unknown>} options.obj - The object to serialize.
   * @param {string} options.parentKey - The accumulated key path (e.g. `where[title]`).
   *
   * @returns {string | null} A query string fragment, or `null` if empty.
   */
  private _serialize(options: { obj: Record<string, unknown>; parentKey: string }): string | null {
    const { obj, parentKey } = options;
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
      const _key = (parentKey) ? `${parentKey}[${this._safeEncode({ value: key })}]` : this._safeEncode({ value: key });

      const encoded: string | null = this._isPrimitive({ value }) ? this._serializePrimitive({ key: _key, value }) : null;

      // Handle primitive values first — these are terminal nodes in the structure.
      // Early continue ensures minimal nesting and clearer control flow.
      if (encoded) {
        segments.push(encoded);
        continue;
      }

      // Handle arrays recursively.
      if (Array.isArray(value)) {
        this._serializeArray({ arr: value, parentKey: _key, segments });
        continue;
      }

      const nested: string | null = this._isPlainObject({ value }) ? this._serialize({ obj: value as Record<string, unknown>, parentKey: _key }) : null;

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
   * @param {unknown} options.value - The value to inspect.
   *
   * @returns {boolean} `true` if a plain object, `false` otherwise.
   */
  private _isPlainObject(options: { value: unknown }): options is { value: Record<string, unknown> } {
    const { value } = options;

    return typeof value === 'object' && value !== null && !Array.isArray(value) && !(value instanceof Date);
  }

  /**
   * Determines whether the value is a serializable primitive.
   *
   * @param {unknown} options.value - The value to inspect.
   *
   * @returns {boolean} `true` if serializable, `false` otherwise.
   */
  private _isPrimitive(options: { value: unknown }): boolean {
    const { value } = options;

    return (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || value instanceof Date);
  }

  /**
   * Serializes an array using index-based notation.
   *
   * @param {unknown[]} options.arr - The array to serialize.
   * @param {string} options.parentKey - The current key path (e.g. `where[tags]`).
   * @param {string[]} options.segments - The accumulated query segments.
   */
  private _serializeArray(options: { arr: unknown[]; parentKey: string; segments: string[] }): void {
    const { arr, parentKey, segments } = options;

    for (let i = 0; i < arr.length; i++) {
      const value = arr[i];
      const elementKey = `${parentKey}[${i}]`;

      if (value === undefined || value === null) {
        continue;
      }

      const encoded: string | null = this._isPrimitive({ value }) ? this._serializePrimitive({ key: elementKey, value }) : null;

      // Handle primitive values first — these are terminal nodes in the structure.
      // Early continue ensures minimal nesting and clearer control flow.
      if (encoded) {
          segments.push(encoded);
          continue;
      }

      // Handle arrays recursively.
      if (Array.isArray(value)) {
        this._serializeArray({ arr: value, parentKey: elementKey, segments });
        continue;
      }

      const nested: string | null = this._isPlainObject({ value }) ? this._serialize({ obj: value as Record<string, unknown>, parentKey: elementKey }) : null;

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
   * @param {string} options.key - The full key path (e.g. `where[title][equals]`).
   * @param {unknown} options.value - The primitive value to encode.
   *
   * @returns {string | null} A `key=value` string, or `null` if unsupported.
   */
  private _serializePrimitive(options: { key: string; value: unknown }): string | null {
    const { key, value } = options;

    if (typeof value === 'symbol' || typeof value === 'bigint') {
      return null;
    }

    if (value instanceof Date) {
      return `${key}=${this._safeEncode({ value: value.toISOString() })}`;
    }

    return `${key}=${this._safeEncode({ value: String(value) })}`;
  }
}
