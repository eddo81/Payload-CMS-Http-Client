import type { Operator } from "./types/Operator";
import type { JsonValue } from "./types/Json.js";
import { WhereBuilder } from "./WhereBuilder.js";
import { JoinBuilder } from "./JoinBuilder.js";
import type { Json } from "./types/Json.js";

/**
 * QueryBuilder
 *
 * Orchestrates the construction of PayloadCMS query parameters.
 * Supports method chaining for configuring limits, pagination, sorting,
 * filtering, population, and joins.
 *
 * Acts as a facade that utilizes WhereBuilder and JoinBuilder
 * for composing advanced query logic.
 */
export class QueryBuilder {
  private _limit?: number;
  private _page?: number;
  private _sort?: string;
  private _depth?: number;
  private _locale?: string;
  private _fallbackLocale?: string;
  private _select?: string;
  private _populate?: string;
  private readonly _whereBuilder: WhereBuilder = new WhereBuilder();
  private readonly _joinBuilder: JoinBuilder = new JoinBuilder();

  /**
   * Limit the number of results returned by the query.
   *
   * @param {number} value - Maximum number of documents to return.
   * 
   * @example
   * const query = new QueryBuilder();
   * query.limit(10);
   * 
   * @returns {QueryBuilder} The current QueryBuilder instance for further chaining.
   */
  limit(value: number): this {
    this._limit = value;

    return this;
  }

  /**
   * Set the page of results to retrieve.
   * Used together with `.limit()` to paginate results.
   *
   * @param {number} value - The page number (1-based).
   *
   * @example
   * const query = new QueryBuilder();
   * query.page(2).limit(20);
   *
   * @returns {QueryBuilder} The current QueryBuilder instance for further chaining.
   */
  page(value: number): this {
    this._page = value;

    return this;
  }

  /**
   * Sort results in ascending order by the specified field.
   * Can be called multiple times to sort by multiple fields.
   *
   * @param {string} field - The field to sort by.
   *
   * @example
   * const query = new QueryBuilder();
   * query.sort('title').sort('createdAt');
   *
   * @returns {QueryBuilder} The current QueryBuilder instance for further chaining.
   */
  sort(field: string): this {
    if (!this._sort) {
      this._sort = field;
    } 
    else {
      this._sort += `,${field}`;
    }

    return this;
  }

  /**
   * Sort results in descending order by the specified field.
   * Can be called multiple times to sort by multiple fields.
   *
   * @param {string} field - The field to sort by. If not prefixed with '-', it will be automatically prefixed.
   *
   * @example
   * const query = new QueryBuilder();
   * query.sortByDescending('createdAt');
   *
   * @returns {QueryBuilder} The current QueryBuilder instance for further chaining.
   */
  sortByDescending(field: string): this {
    const _field = field.startsWith('-') ? field : `-${field}`;

    if (!this._sort) {
      this._sort = _field;
    } 
    else {
      this._sort += `,${_field}`;
    }

    return this;
  }

  /**
   * Specify the population depth of related documents.
   *
   * @param {number} value - Depth level to populate (0 = none, 1 = direct relations, etc.).
   *
   * @example
   * const query = new QueryBuilder();
   * query.depth(2);
   *
   * @returns {QueryBuilder} The current QueryBuilder instance for further chaining.
   */
  depth(value: number): this {
    this._depth = value;

    return this;
  }

  /**
   * Set the locale used for querying localized fields.
   *
   * @param {string} value - A locale string such as 'en', 'sv', etc.
   *
   * @example
   * const query = new QueryBuilder();
   * query.locale('sv');
   *
   * @returns {QueryBuilder} The current QueryBuilder instance for further chaining.
   */
  locale(value: string): this {
    this._locale = value;

    return this;
  }

  /**
   * Set a fallback locale to use when localized values are missing.
   *
   * @param {string} value - A fallback locale string (e.g., 'en' or 'default').
   *
   * @example
   * const query = new QueryBuilder();
   * query.fallbackLocale('default');
   *
   * @returns {QueryBuilder} The current QueryBuilder instance for further chaining.
   */
  fallbackLocale(value: string): this {
    this._fallbackLocale = value;

    return this;
  }

  /**
   * Specify which fields to include in the result.
   *
   * Supports dot notation for nested selections. For example:
   *   .select(['title', 'author.name', 'comments.user.email'])
   *
   * This will result in: 
   *   select=title,author.name,comments.user.email
   *
   * @param {string[]} fields - An array of field names, optionally using dot notation for nesting.
   * 
   * @example
   * const query = new QueryBuilder();
   * query.select(['title', 'author.name']);
   * 
   * @returns {QueryBuilder} The current QueryBuilder instance for further chaining.
   */
  select(fields: string[]): this {
    if (!this._select) {
      this._select = fields.join(',');
    } 
    else {
      this._select += `,${fields.join(',')}`;
    }

    return this;
  }

  /**
   * Define which relational fields to populate in the result.
   * Unlike `select()`, this doesn't support nested population.
   * It simply flags top-level relationships for inclusion.
   *
   * @param {string[]} fields - An array of field names to populate.
   * 
   * @example
   * const query = new QueryBuilder();
   * query.populate(['author', 'comments']);
   * 
   * @returns {QueryBuilder} The current QueryBuilder instance for further chaining.
   */
  populate(fields: string[]): this {
    this._populate = fields.join(',');

    return this;
  }

  /**
   * Add a field comparison to the query's filtering logic.
   * Delegates to the internal WhereBuilder.
   *
   * @param {string} field - The field name.
   * @param {Operator} operator - The comparison operator.
   * @param {string} value - The value to compare against.
   * 
   * @example
   * const query = new QueryBuilder();
   * query.where('category', 'equals', 'news');
   * 
   * @returns {QueryBuilder} The current QueryBuilder instance for further chaining.
   */
  where(field: string, operator: Operator, value: JsonValue): this {
    this._whereBuilder.where(field, operator, value);

    return this;
  }

  /**
   * Add a nested `AND` group of conditions. Delegates to a fresh WhereBuilder 
   * instance via callback. This method allows you to group multiple conditions 
   * together using logical `AND`, enabling deeply nested conditional queries.
   * 
   * @example
   * const query = new QueryBuilder();
   * query.and(builder => {
   *   builder
   *      .where('status', 'published')
   *      .where('category', 'news');
   * });
   * 
   * @param callback - Callback function receiving a new WhereBuilder for nested conditions.
   * 
   * @returns {QueryBuilder} The current QueryBuilder instance for further chaining.
   */
  and(callback: (builder: WhereBuilder) => void): this {
    this._whereBuilder.and(callback);

    return this;
  }

  /**
   * Adds a nested `OR` group of conditions. Delegates to a fresh WhereBuilder
   * instance via callback. This method allows you to group multiple conditions
   * together using logical `OR`, enabling complex nested conditional logic.
   * 
   * @example
   * const query = new QueryBuilder();
   * query.or(builder => {
   *   builder
   *      .where('title', 'like', 'draft')
   *      .where('status', 'not_equals', 'archived');
   * });
   * 
   * @param callback - Callback function receiving a new WhereBuilder for nested conditions.
   * 
   * @returns {QueryBuilder} The current QueryBuilder instance for further chaining.
   */
  or(callback: (builder: WhereBuilder) => void): this {
    this._whereBuilder.or(callback);

    return this;
  }

  /**
   * Adds a join clause to include related documents in the query. This method 
   * allows specifying a relation to join, optionally aliasing the joined data 
   * and applying nested join conditions. Joins in PayloadCMS act as a population 
   * mechanism, ie they expand the returned documents with related data.
   *
   * @param callback - Callback function using a JoinBuilder.
   *
   * @example
   * const query = new QueryBuilder();
   * query
   *    .join(joinBuilder => { 
   *        joinBuilder
   *          .where('posts', 'author', 'equals', 'Alice')
   *          .sortByDescending('posts', 'title')
   *          .limit('posts', 1);
   *    });
   *
   * @returns {QueryBuilder} The current QueryBuilder instance for further chaining.
   */
  join(callback: (builder: JoinBuilder) => void): this {
    callback(this._joinBuilder);

    return this;
  }

  /**
   * Build the final set of query parameters to be submitted to a PayloadCMS REST API 
   * endpoint. This method performs an outbound transport mapping from domain-level query
   * intent into a JSON-compatible shape suitable for query string serialization.
   * 
   * @example
   * const query = new QueryBuilder();
   * query
   *   .limit(10)
   *   .page(2)
   *   .sort('title');
   *   
   * const params = query.build();
   * 
   * @returns {Json} A plain JSON object suitable for query string serialization.
   */
  build(): Json {
    const where: Json | undefined = this._whereBuilder.build();
    const joins: Json | false | undefined = this._joinBuilder.build();
    const result: Json = {};

    if (this._limit !== undefined) {
      result.limit = this._limit;
    }

    if (this._page !== undefined) {
      result.page = this._page;
    }

    if (this._sort !== undefined) {
      result.sort = this._sort;
    }

    if (this._depth !== undefined) {
      result.depth = this._depth;
    }

    if (this._locale !== undefined) {
      result.locale = this._locale;
    }

    if (this._fallbackLocale !== undefined) {
      result['fallback-locale'] = this._fallbackLocale;
    }

    if (this._select !== undefined) {
      result.select = this._select;
    }

    if (this._populate !== undefined) {
      result.populate = this._populate;
    }

    if (where !== undefined) {
      result.where = where;
    }

    if (joins !== undefined) {
      result.joins = joins;
    }

    return result;
  }
}