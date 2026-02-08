import type { IClause } from "./contracts/IClause.js";
import type { Json } from "../types/Json.js";

/**
 * Represents a logical `AND` grouping of {@link IClause} instances.
 */
export class AndClause implements IClause {
  constructor(private readonly clauses: IClause[]) {}

  /**
   * @returns {Json} The serialized `and` clause array.
   */
  build(): Json {
    return { and: this.clauses.map(clause => clause.build()) };
  }
}