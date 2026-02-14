import type { IClause } from "../internal/contracts/IClause.js";
import { AndClause } from "../internal/AndClause.js";
import { OrClause } from "../internal/OrClause.js";
import { WhereClause } from "../internal/WhereClause.js";
import type { Operator } from "./enums/Operator.js";
import type { Json, JsonValue } from "../../types/Json.js";

/**
 * Fluent builder for nested `where`/`and`/`or` clauses.
 */
export class WhereBuilder {
  private readonly _clauses: IClause[] = [];

  /**
   * Adds a field comparison clause.
   *
   * @param {string} field - The field name.
   * @param {Operator} operator - The comparison operator.
   * @param {JsonValue} value - The value to compare against.
   *
   * @returns {this} The current builder for chaining.
   */
  where(field: string, operator: Operator, value: JsonValue): this {
    this._clauses.push(new WhereClause(field, operator, value));

    return this;
  }

  /**
   * Adds a nested `AND` group of clauses.
   *
   * @param {Function} callback - Receives a {@link WhereBuilder} for nested conditions.
   *
   * @returns {this} The current builder for chaining.
   */
  and(callback: (builder: WhereBuilder) => void): this {
    const builder = new WhereBuilder();

    callback(builder);

    this._clauses.push(new AndClause(builder._clauses));

    return this;
  }

  /**
   * Adds a nested `OR` group of clauses.
   *
   * @param {Function} callback - Receives a {@link WhereBuilder} for nested conditions.
   *
   * @returns {this} The current builder for chaining.
   */
  or(callback: (builder: WhereBuilder) => void): this {
    const builder = new WhereBuilder();

    callback(builder);

    this._clauses.push(new OrClause(builder._clauses));

    return this;
  }

  /**
   * Builds the `where` clause object.
   *
   * @returns {Json | undefined} The clause object, or `undefined` if empty.
   */
  build(): Json | undefined {
    if(this._clauses.length === 0) {
      return undefined;
    } 

    const result: Json = {};

    this._clauses.forEach(clause => {
      Object.assign(result, clause.build());
    });

    return result;
  }
}