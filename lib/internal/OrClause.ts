import type { IClause } from "./contracts/IClause.js";
import type { Json } from "../../types/Json.js";

/**
 * Represents a logical `OR` grouping of {@link IClause} instances.
 */
export class OrClause implements IClause {
  private readonly _clauses: IClause[];

  constructor(options: { clauses: IClause[] }) {
    const { clauses } = options;

    this._clauses = clauses;
  }

  /**
   * @returns {Json} The serialized `or` clause array.
   */
  build(): Json {
    const result: Json = {};
    result['or'] = this._clauses.map(clause => clause.build());

    return result;
  }
}
