import type { JsonValue, Json } from "../../types/Json.js";

/**
 * Determines whether the value is a plain JSON object.
 *
 * @param {JsonValue} value - The value to inspect.
 *
 * @returns {boolean} `true` if a plain JSON object, `false` otherwise.
 */
export function isJsonObject(value: JsonValue): value is Json {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
