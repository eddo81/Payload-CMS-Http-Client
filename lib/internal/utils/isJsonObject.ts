import type { JsonValue, Json } from "../../types/Json.js";

/**
 * Determines whether the provided value is a plain JSON object.
 *
 * Returns `true` for non-null, non-array objects — the shape
 * expected by {@link Json} throughout the library.
 *
 * @param value - The value to inspect.
 * @returns `true` if the value is a plain JSON object.
 */
export function isJsonObject(value: JsonValue): value is Json {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
