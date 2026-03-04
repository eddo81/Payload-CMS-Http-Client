import type { Json } from "../../../types/Json.js";

/**
 * Centralizes JSON serialization and deserialization.
 *
 * Wraps `JSON.parse` and `JSON.stringify` behind a shared
 * vocabulary that mirrors the C# `JsonParser` class.
 */
export class JsonParser {
  /**
   * Serializes a Json object to a JSON string.
   *
   * @param {Json} data - The object to serialize.
   *
   * @returns {string} The JSON string representation.
   */
  static stringify(data: Json): string {
    return JSON.stringify(data);
  }

  /**
   * Parses a JSON string into a Json object.
   *
   * Returns `undefined` if the text is empty or the root
   * value is not a plain object.
   *
   * @param {string} text - The JSON string to parse.
   *
   * @returns {Json | undefined} The parsed object, or `undefined`.
   */
  static parse(text: string): Json | undefined {
    if (text.length === 0) {
      return undefined;
    }

    const parsed = JSON.parse(text);

    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return undefined;
    }

    return parsed as Json;
  }
}
