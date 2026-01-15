import type { IClause } from "./contracts/IClause.js";
import type { Operator } from "../types/Operator.js";

/**
 * WhereClause
 * 
 * Represents a simple field comparison condition.
 */
export class WhereClause implements IClause {
  constructor(private readonly field: string, private readonly operator: Operator, private readonly value: unknown) {}

  build(): Record<string, unknown> {
    return { [this.field]: { [this.operator]: this.value } };
  }
}