import type { IClause } from "./contracts/IClause.js";
import type { Operator } from "../types/Operator.js";
import type { Json, JsonValue } from "../types/Json.js";

/**
 * Represents a single field comparison condition.
 */
export class WhereClause implements IClause {
  constructor(private readonly field: string, private readonly operator: Operator, private readonly value: JsonValue) {}

  /**
   * @returns {Json} The serialized `field[operator]=value` structure.
   */
  build(): Json {
    return { [this.field]: { [this.operator]: this.value } };
  }
}