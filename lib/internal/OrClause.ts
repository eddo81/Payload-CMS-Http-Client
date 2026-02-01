import type { IClause } from "./contracts/IClause.js";
import type { Json } from "../types/Json.js";

/**
 * OrClause
 *
 * Represents a logical `OR` grouping of multiple clauses.
 */
export class OrClause implements IClause {
  constructor(private readonly clauses: IClause[]) {}

  build(): Json {
    return { or: this.clauses.map(clause => clause.build()) };
  }
}