import { JoinClause } from "../internal/JoinClause.js";
import { WhereBuilder } from "./WhereBuilder.js";
import type { Operator } from "./types/Operator.js";
import type { Json, JsonValue } from "./types/Json.js";

/**
 * Collects and composes `Join Field` query operations.
 *
 * Scoped to the `joins` query parameter and invoked
 * via {@link QueryBuilder.join}.
 */
export class JoinBuilder {
  private readonly _clauses: JoinClause[] = [];
  private readonly _whereBuilders: Map<string, WhereBuilder> = new Map();
  private _disabled = false;

  /**
   * Finds or creates a `JoinClause` for the given join field.
   *
   * If `on` is an empty string, returns `undefined` and the
   * caller should skip the operation.
   *
   * @param {string} on - The `Join Field` name (e.g. "relatedPosts").
   * @returns {JoinClause | undefined} The clause instance, or undefined if `on` is empty.
   */
  private _getOrCreateClause(on: string): JoinClause | undefined {
    if (on === '') {
      return undefined;
    }

    let clause = this._clauses.find((clause) => {
      return clause.on === on;
    });

    if (clause === undefined) {
      clause = new JoinClause(on);
      this._clauses.push(clause);
    }

    return clause;
  }

  /**
   * Returns the {@link WhereBuilder} for the given join field.
   *
   * Creates and caches a new instance on first access.
   *
   * @param {string} on - The `Join Field` name.
   * @returns {WhereBuilder} The cached or newly created builder.
   */
  private _getOrCreateWhereBuilder(on: string): WhereBuilder {
    let builder = this._whereBuilders.get(on);

    if (builder === undefined) {
      builder = new WhereBuilder();
      this._whereBuilders.set(on, builder);
    }

    return builder;
  }

 /**
  * Limits the number of joined documents returned.
  *
  * @param {string} on - The `Join Field` name.
  * @param {number} value - Maximum document count (default 10).
  *
  * @returns {this} The current builder for chaining.
  */
  limit(on: string, value: number): this {
    const clause = this._getOrCreateClause(on);
    
    if (clause !== undefined) {
      clause.limit = value;
    }

    return this;
  }

 /**
  * Sets the page of joined documents to retrieve (1-based).
  *
  * @param {string} on - The `Join Field` name.
  * @param {number} page - The page number.
  *
  * @returns {this} The current builder for chaining.
  */
  page(on: string, page: number): this {
    const clause = this._getOrCreateClause(on);

    if (clause !== undefined) {
      clause.page = page;
    } 

    return this;
  }

 /**
  * Sorts joined documents ascending by the given field.
  *
  * @param {string} on - The `Join Field` name.
  * @param {string} field - The field name to sort by.
  *
  * @returns {this} The current builder for chaining.
  */
  sort(on: string, field: string): this {
    if (field === '') {
      return this;
    } 

    const clause = this._getOrCreateClause(on);
    
    if (clause !== undefined) {
      clause.sort = field;
    } 

    return this;
  }

 /**
  * Sorts joined documents descending by the given field.
  *
  * Automatically prefixes the field with `-` if needed.
  *
  * @param {string} on - The `Join Field` name.
  * @param {string} field - The field name to sort by.
  *
  * @returns {this} The current builder for chaining.
  */
  sortByDescending(on: string, field: string): this {
    const _field = field.startsWith('-') ? field : `-${field}`;
    
    return this.sort(on, _field);
  }

 /**
  * Toggles the count of joined documents in the response.
  *
  * @param {string} on - The `Join Field` name.
  * @param {boolean} value - Whether to include the count.
  *
  * @returns {this} The current builder for chaining.
  */
  count(on: string, value: boolean = true): this {
    const clause = this._getOrCreateClause(on);
    
    if (clause !== undefined) {
       clause.count = value;
    }

    return this;
  }

 /**
  * Adds a `where` condition scoped to a `Join Field`.
  *
  * Multiple calls for the same join accumulate via
  * an internal {@link WhereBuilder} cache.
  *
  * @param {string} on - The `Join Field` name.
  * @param {string} field - The field to compare.
  * @param {Operator} operator - The comparison operator.
  * @param {JsonValue} value - The value to compare against.
  *
  * @returns {this} The current builder for chaining.
  */
  where(on: string, field: string, operator: Operator, value: JsonValue): this {
    const builder = this._getOrCreateWhereBuilder(on);
    
    builder.where(field, operator, value);

    const clause = this._getOrCreateClause(on);
    
    if (clause !== undefined) {
      clause.where = builder.build();
    } 

    return this;
  }

 /**
  * Adds a nested `AND` group scoped to a `Join Field`.
  *
  * @param {string} on - The `Join Field` name.
  * @param {Function} callback - Receives a {@link WhereBuilder} for nested conditions.
  *
  * @returns {this} The current builder for chaining.
  */
  and(on: string, callback: (builder: WhereBuilder) => void): this {
    const builder = this._getOrCreateWhereBuilder(on);

    builder.and(callback);

    const clause = this._getOrCreateClause(on);
    
    if (clause !== undefined) {
      clause.where = builder.build();
    } 

    return this;
  }

 /**
  * Adds a nested `OR` group scoped to a `Join Field`.
  *
  * @param {string} on - The `Join Field` name.
  * @param {Function} callback - Receives a {@link WhereBuilder} for nested conditions.
  *
  * @returns {this} The current builder for chaining.
  */
  or(on: string, callback: (builder: WhereBuilder) => void): this {
    const builder = this._getOrCreateWhereBuilder(on);
    
    builder.or(callback);

    const clause = this._getOrCreateClause(on);

    if (clause !== undefined) {
      clause.where = builder.build(); 
    } 

    return this;
  }

 /**
  * Whether all joins have been explicitly disabled.
  *
  * When `true`, the caller should set `joins=false` in the
  * query parameters instead of calling `build()`.
  */
  get isDisabled(): boolean {
    return this._disabled;
  }

 /**
  * Disables all `Join Fields` for the query.
  *
  * Sets `joins=false` in the query string, overriding
  * any previously configured join clauses.
  *
  * @returns {this} The current builder for chaining.
  */
  disable(): this {
    this._disabled = true;

    return this;
  }

 /**
  * Builds the `joins` query parameter object.
  *
  * @returns {Json | undefined} The joins object, or `undefined` if empty.
  */
  build(): Json | undefined {
    if (this._clauses.length === 0) {
      return undefined;
    }

    const result: Json = {};

    this._clauses.forEach((clause) => {
      Object.assign(result, clause.build());
    });

    return result;
  }
}
