import type { IClause } from "./contracts/IClause.js";
import type { Operator } from "../public/enums/Operator.js";
import type { Json, JsonValue } from "../../types/Json.js";

/**
 * Represents a single field comparison condition.
 */
export class WhereClause implements IClause {
  private readonly _field: string;
  private readonly _operator: Operator;
  private readonly _value: JsonValue;

  constructor(options: { field: string; operator: Operator; value: JsonValue }) {
    const { field, operator, value } = options;

    this._field = field;
    this._operator = operator;
    this._value = value;
  }

  /**
   * @returns {Json} The serialized `field[operator]=value` structure.
   */
  build(): Json {
    const inner: Json = {};
    inner[this._operator] = this._value;

    const result: Json = {};
    result[this._field] = inner;

    return result;
  }
}
