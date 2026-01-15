import type { IClause } from "./contracts/IClause.js";

/**
 * OrClause
 * 
 * Represents a logical `OR` grouping of multiple clauses.
 */
export class OrClause implements IClause {
  constructor(private readonly clauses: IClause[]) {}

  build(): Record<string, unknown> {
    return { or: this.clauses.map(clause => clause.build()) };
  }
}