/**
 * EncoderConfig
 *
 * Configuration options for constructing a {@link QueryStringEncoder} instance.
 *
 * All properties are optional. When omitted, sensible defaults are applied.
 *
 * @property {boolean} addQueryPrefix - When `true`, the output of `stringify()` is prefixed with `?`. Defaults to `true`.
 * @property {boolean} strictEncoding - When `true`, all characters (including brackets and commas) remain percent-encoded,
 *   matching the encoding style of `qs-esm`. When `false`, brackets and commas are unescaped for readability. Defaults to `false`.
 */
export interface EncoderConfig {
  addQueryPrefix?: boolean; 
  strictEncoding?: boolean;
}
