import type { IClause } from "./contracts/IClause.js";
import type { Json } from "../types/Json.js";

/**
 * Represents a single field path in a `select` clause,
 * targeting either inclusion (`true`) or exclusion (`false`).
 *
 * Used internally by {@link SelectBuilder}.
 */
export class SelectClause implements IClause {
  private readonly _segments: string[];
  private readonly _value: boolean;

  constructor(options: { segments: string[]; value: boolean }) {
    const { segments, value } = options;

    this._segments = segments;
    this._value = value;
  }

  /**
   * Builds the nested object structure for this field path.
   *
   * e.g. segments `['group', 'number']` with `value = true`
   * produces `{ group: { number: true } }`.
   *
   * @returns {Json} The nested field structure for this clause.
   */
  build(): Json {
    let result: Json = { [this._segments[this._segments.length - 1]]: this._value };

    for (let i = this._segments.length - 2; i >= 0; i--) {
      result = { [this._segments[i]]: result };
    }

    return result;
  }
}
