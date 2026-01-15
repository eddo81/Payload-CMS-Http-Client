import type { IClause } from "./internal/contracts/IClause.js";
import { AndClause } from "./internal/AndClause.js";
import { OrClause } from "./internal/OrClause.js";
import { WhereClause } from "./internal/WhereClause.js";
import type { Operator } from "./types/Operator.js";

/**
 * WhereBuilder
 *
 * Provides a fluent API for building nested where/and/or
 * clauses using composable clause strategies.
 */
export class WhereBuilder {
  private readonly _clauses: IClause[] = [];

  /**
   * Adds a simple comparison clause.
   */
  where(field: string, operator: Operator, value: unknown): this {
    this._clauses.push(new WhereClause(field, operator, value));

    return this;
  }

  /**
   * Adds a nested `AND` group of clauses.
   */
  and(callback: (builder: WhereBuilder) => void): this {
    const builder = new WhereBuilder();

    callback(builder);

    this._clauses.push(new AndClause(builder.GetClauses()));

    return this;
  }

  /**
   * Adds a nested `OR` group of clauses.
   */
  or(callback: (builder: WhereBuilder) => void): this {
    const builder = new WhereBuilder();

    callback(builder);

    this._clauses.push(new OrClause(builder.GetClauses()));

    return this;
  }

  /**
   * Returns the list of built clauses.
   */
  GetClauses(): IClause[] {
    return this._clauses;
  }

  /**
   * Serializes the entire where/and/or tree into a flat
   * key-value structure ready for query string encoding.
   */
  build(): Record<string, unknown> | null {
    if(this._clauses.length === 0) {
      return null;
    } 

    const result: Record<string, unknown> = {};

    this._clauses.forEach(clause => {
      Object.assign(result, clause.build());
    });

    return result;
  }
}