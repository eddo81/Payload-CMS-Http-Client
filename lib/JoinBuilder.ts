import { JoinClause } from "./internal/JoinClause.js";
import { WhereBuilder } from "./WhereBuilder.js";
import { WhereBuilderRegistry } from "./internal/WhereBuilderRegistry.js";
import type { Operator } from "./types/Operator.js";
import type { Json, JsonValue } from "./types/Json.js";

/**
 * JoinBuilder
 *
 * Collects and composes join-specific query operations for Payload CMS.
 *
 * This builder is scoped to the `joins` query parameter and is invoked
 * exclusively via `QueryBuilder.join(...)`.
 *
 * Design principles:
 * - Collects join operations internally without mutating **QueryParametersDTO**
 * - Supports idempotent updates per join target (last write wins)
 * - Final query shape is produced only in `build()`
 * - May return `undefined` (no joins) or a joins object
 * - Exposes `isDisabled` for callers to check the disabled state separately
 *
 * The internal representation is intentionally decoupled from the final
 * Payload query shape. Mapping to `{ joins: ... }` occurs at build time.
 */
export class JoinBuilder {
  private readonly _clauses: JoinClause[] = [];
  private readonly _registry: WhereBuilderRegistry = new WhereBuilderRegistry();
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
  * Limit the number of results to be returned, default is 10.
  *
  * @param {string} on - The `Join Field` name (e.g. "relatedPosts") to join on.
  * @param {number} value - Maximum number of related documents to return.
  *
  * @example
  * const query = new QueryBuilder();
  * query
  *   .join(joinBuilder => {
  *     joinBuilder.limit('posts', 1);
  *   });
  *
  * @returns {JoinBuilder} The current JoinBuilder instance for further chaining.
  */
  limit(on: string, value: number): this {
    const clause = this._getOrCreateClause(on);
    
    if (clause !== undefined) {
      clause.limit = value;
    }

    return this;
  }

 /**
  * Sets the page of related documents to retrieve for a join.
  *
  * Used together with `limit()` to paginate related documents.
  * Pagination is scoped to the joined relation only and does not
  * affect the root query.
  *
  * @param {string} on - The name of the `Join Field` to join on (e.g. "relatedPosts").
  * @param {number} page - The page number (1-based).
  *
  * @example
  * const query = new QueryBuilder();
  * query
  *   .join(joinBuilder => {
  *     joinBuilder.page('posts', 2);
  *   });
  *
  * @returns {JoinBuilder} The current JoinBuilder instance for further chaining.
  */
  page(on: string, page: number): this {
    const clause = this._getOrCreateClause(on);

    if (clause !== undefined) {
      clause.page = page;
    } 

    return this;
  }

 /**
  * Sort results in ascending order by the specified field.
  *
  * @param {string} on - The name of the `Join Field` to join on (e.g. "relatedPosts").
  * @param {string} field - The field to sort by.
  *
  * @example
  * const query = new QueryBuilder();
  * query
  *   .join(joinBuilder => {
  *     joinBuilder.sort('posts', 'title');
  *   });
  *
  * @returns {JoinBuilder} The current JoinBuilder instance for further chaining.
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
  * Sort results in descending order by the specified field.
  *
  * @param {string} on - The name of the `Join Field` to join on (e.g. "relatedPosts").
  * @param {string} field - The field to sort by in descending order.
  *
  * @example
  * const query = new QueryBuilder();
  * query
  *   .join(joinBuilder => {
  *     joinBuilder.sortByDescending('posts', 'title');
  *   });
  *
  * @returns {JoinBuilder} The current JoinBuilder instance for further chaining.
  */
  sortByDescending(on: string, field: string): this {
    const _field = field.startsWith('-') ? field : `-${field}`;
    
    return this.sort(on, _field);
  }

 /**
  * Determines whether the count of related documents are include or not.
  *
  * @param {string} on - The name of the `Join Field` to join on (e.g. "relatedPosts").
  * @param {boolean} value - Whether to include the count of related documents.
  *
  * @example
  * const query = new QueryBuilder();
  * query
  *   .join(joinBuilder => {
  *     joinBuilder.count('posts', true);
  *   });
  *
  * @returns {JoinBuilder} The current JoinBuilder instance for further chaining.
  */
  count(on: string, value: boolean = true): this {
    const clause = this._getOrCreateClause(on);
    
    if (clause !== undefined) {
       clause.count = value;
    }

    return this;
  }

 /**
  * Adds a where condition scoped to a specific join.
  *
  * Multiple calls to `where()` for the same join field will accumulate
  * conditions via the internal `WhereBuilderRegistry`. Use `and()` or
  * `or()` for explicit grouping of conditions.
  *
  * @param {string} on - The name of the `Join Field` to join on (e.g. "relatedPosts").
  * @param {string} field - The field to compare.
  * @param {Operator} operator - The comparison operator (e.g., 'equals', 'not_equals', 'in', etc.).
  * @param {JsonValue} value - The value to compare the field against.
  *
  * @example
  * const query = new QueryBuilder();
  * query
  *   .join(joinBuilder => {
  *     joinBuilder
  *       .where('posts', 'status', 'equals', 'published')
  *       .where('posts', 'author', 'equals', 'Alice');
  *   });
  *
  * @returns {JoinBuilder} The current JoinBuilder instance for further chaining.
  */
  where(on: string, field: string, operator: Operator, value: JsonValue): this {
    const builder = this._registry.get(on);
    
    builder.where(field, operator, value);

    const clause = this._getOrCreateClause(on);
    
    if (clause !== undefined) {
      clause.where = builder.build();
    } 

    return this;
  }

 /**
  * Adds a nested `AND` group of conditions scoped to a specific join.
  *
  * Use this to group multiple conditions that must all be true.
  *
  * @param {string} on - The name of the `Join Field` to join on (e.g. "relatedPosts").
  * @param {Function} callback - Callback function receiving a WhereBuilder for nested conditions.
  *
  * @example
  * const query = new QueryBuilder();
  * query
  *   .join(joinBuilder => {
  *     joinBuilder.and('posts', group => {
  *       group
  *         .where('status', 'equals', 'published')
  *         .where('author', 'equals', 'Alice');
  *     });
  *   });
  *
  * @returns {JoinBuilder} The current JoinBuilder instance for further chaining.
  */
  and(on: string, callback: (builder: WhereBuilder) => void): this {
    const builder = this._registry.get(on);

    builder.and(callback);

    const clause = this._getOrCreateClause(on);
    
    if (clause !== undefined) {
      clause.where = builder.build();
    } 

    return this;
  }

 /**
  * Adds a nested `OR` group of conditions scoped to a specific join.
  *
  * Use this to group multiple conditions where at least one must be true.
  *
  * @param {string} on - The name of the `Join Field` to join on (e.g. "relatedPosts").
  * @param {Function} callback - Callback function receiving a WhereBuilder for nested conditions.
  *
  * @example
  * const query = new QueryBuilder();
  * query
  *   .join(joinBuilder => {
  *     joinBuilder.or('posts', group => {
  *       group
  *         .where('author', 'equals', 'Alice')
  *         .where('author', 'equals', 'Bob');
  *     });
  *   });
  *
  * @returns {JoinBuilder} The current JoinBuilder instance for further chaining.
  */
  or(on: string, callback: (builder: WhereBuilder) => void): this {
    const builder = this._registry.get(on);
    
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
  * Disables all `Join Fields` from returning for the query.
  *
  * When disabled, callers should check `isDisabled` and set
  * `joins=false` in the query string. Any previously collected
  * join clauses are discarded by the caller.
  *
  * @example
  * const query = new QueryBuilder();
  * query
  *   .join(joinBuilder => {
  *     joinBuilder.disable();
  *   });
  *
  * @returns {JoinBuilder} The current JoinBuilder instance for further chaining.
  */
  disable(): this {
    this._disabled = true;

    return this;
  }

 /**
  * Builds the joins object for the query.
  *
  * @returns {Json | undefined}
  * - `undefined` if no join operations were added
  * - A joins object compatible with Payload's REST API otherwise
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
