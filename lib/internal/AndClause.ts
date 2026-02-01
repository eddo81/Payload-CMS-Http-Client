import type { IClause } from "./contracts/IClause.js";
import type { Json } from "../types/Json.js";

/**
 * AndClause
 *
 * Represents a logical `AND` grouping of multiple clauses.
 */
export class AndClause implements IClause {
  constructor(private readonly clauses: IClause[]) {}

  build(): Json {
    return { and: this.clauses.map(clause => clause.build()) };
  }
}