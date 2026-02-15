import type { IClause } from "./contracts/IClause.js";
import type { Json } from "../../types/Json.js";

/**
 * Represents a logical `AND` grouping of {@link IClause} instances.
 */
export class AndClause implements IClause {
  private readonly _clauses: IClause[];

  constructor(options: { clauses: IClause[] }) {
    const { clauses } = options;

    this._clauses = clauses;
  }

  /**
   * @returns {Json} The serialized `and` clause array.
   */
  build(): Json {
    const result: Json = {};
    result['and'] = this._clauses.map(clause => clause.build());

    return result;
  }
}
