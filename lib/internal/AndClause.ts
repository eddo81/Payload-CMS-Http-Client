import type { IClause } from "./contracts/IClause.js";

/**
 * AndClause
 * 
 * Represents a logical `AND` grouping of multiple clauses.
 */
export class AndClause implements IClause {
  constructor(private readonly clauses: IClause[]) {}

  build(): Record<string, unknown> {
    return { and: this.clauses.map(clause => clause.build()) };
  }
}