import type { IClause } from "./contracts/IClause.js";
import type { Json } from "../../types/Json.js";

/**
 * Represents a logical `OR` grouping of {@link IClause} instances.
 */
export class OrClause implements IClause {
  constructor(private readonly clauses: IClause[]) {}

  /**
   * @returns {Json} The serialized `or` clause array.
   */
  build(): Json {
    return { or: this.clauses.map(clause => clause.build()) };
  }
}