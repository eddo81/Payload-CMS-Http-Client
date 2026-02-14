import type { Operator } from "./enums/Operator.js";
import type { JsonValue } from "../../types/Json.js";
import { WhereBuilder } from "./WhereBuilder.js";
import { JoinBuilder } from "./JoinBuilder.js";
import type { Json } from "../../types/Json.js";

/**
 * Fluent builder for Payload CMS REST API query parameters.
 *
 * Delegates filtering to {@link WhereBuilder} and
 * join configuration to {@link JoinBuilder}.
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
   * Limits the number of documents returned.
   *
   * @param {number} value - Maximum document count.
   *
   * @returns {this} The current builder for chaining.
   */
  limit(value: number): this {
    this._limit = value;

    return this;
  }

  /**
   * Sets the page of results to retrieve (1-based).
   *
   * @param {number} value - The page number.
   *
   * @returns {this} The current builder for chaining.
   */
  page(value: number): this {
    this._page = value;

    return this;
  }

  /**
   * Sorts results ascending by the given field.
   *
   * Can be called multiple times for multi-field sorts.
   *
   * @param {string} field - The field name to sort by.
   *
   * @returns {this} The current builder for chaining.
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
   * Sorts results descending by the given field.
   *
   * Automatically prefixes the field with `-` if needed.
   *
   * @param {string} field - The field name to sort by.
   *
   * @returns {this} The current builder for chaining.
   */
  sortByDescending(field: string): this {
    const _field = field.startsWith('-') ? field : `-${field}`;

    return this.sort(_field);
  }

  /**
   * Sets the population `depth` for related documents.
   *
   * @param {number} value - Depth level (0 = none, 1 = direct, etc.).
   *
   * @returns {this} The current builder for chaining.
   */
  depth(value: number): this {
    this._depth = value;

    return this;
  }

  /**
   * Sets the `locale` for querying localized fields.
   *
   * @param {string} value - A locale string (e.g. `'en'`, `'sv'`).
   *
   * @returns {this} The current builder for chaining.
   */
  locale(value: string): this {
    this._locale = value;

    return this;
  }

  /**
   * Sets a `fallback locale` when localized values are missing.
   *
   * @param {string} value - A fallback locale string (e.g. `'en'`).
   *
   * @returns {this} The current builder for chaining.
   */
  fallbackLocale(value: string): this {
    this._fallbackLocale = value;

    return this;
  }

  /**
   * Specifies which fields to include in the result.
   *
   * Supports dot notation for nested selections
   * (e.g. `['title', 'author.name']`).
   *
   * @param {string[]} fields - Field names to include.
   *
   * @returns {this} The current builder for chaining.
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
   * Flags top-level `relationship` fields for population.
   *
   * @param {string[]} fields - Relationship field names to populate.
   *
   * @returns {this} The current builder for chaining.
   */
  populate(fields: string[]): this {
    this._populate = fields.join(',');

    return this;
  }

  /**
   * Adds a field comparison to the `where` clause.
   *
   * Delegates to the internal {@link WhereBuilder}.
   *
   * @param {string} field - The field name.
   * @param {Operator} operator - The comparison operator.
   * @param {JsonValue} value - The value to compare against.
   *
   * @returns {this} The current builder for chaining.
   */
  where(field: string, operator: Operator, value: JsonValue): this {
    this._whereBuilder.where(field, operator, value);

    return this;
  }

  /**
   * Adds a nested `AND` group of `where` conditions.
   *
   * Delegates to a fresh {@link WhereBuilder} via callback.
   *
   * @param {Function} callback - Receives a {@link WhereBuilder} for nested conditions.
   *
   * @returns {this} The current builder for chaining.
   */
  and(callback: (builder: WhereBuilder) => void): this {
    this._whereBuilder.and(callback);

    return this;
  }

  /**
   * Adds a nested `OR` group of `where` conditions.
   *
   * Delegates to a fresh {@link WhereBuilder} via callback.
   *
   * @param {Function} callback - Receives a {@link WhereBuilder} for nested conditions.
   *
   * @returns {this} The current builder for chaining.
   */
  or(callback: (builder: WhereBuilder) => void): this {
    this._whereBuilder.or(callback);

    return this;
  }

  /**
   * Configures `Join Field` population via callback.
   *
   * Delegates to the internal {@link JoinBuilder} for
   * filtering, sorting, and limiting joined data.
   *
   * @param {Function} callback - Receives the {@link JoinBuilder} instance.
   *
   * @returns {this} The current builder for chaining.
   *
   * @example
   * query.join(j => {
   *   j.where('posts', 'author', 'equals', 'Alice')
   *    .sortByDescending('posts', 'title')
   *    .limit('posts', 1);
   * });
   */
  join(callback: (builder: JoinBuilder) => void): this {
    callback(this._joinBuilder);

    return this;
  }

  /**
   * Builds the final query parameters object.
   *
   * Serializes all configured options into a plain
   * JSON object for query string encoding.
   *
   * @returns {Json} Query parameters ready for serialization.
   */
  build(): Json {
    const where: Json | undefined = this._whereBuilder.build();
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

    if (this._joinBuilder.isDisabled) {
      result.joins = false;
    } else {
      const joins = this._joinBuilder.build();

      if (joins !== undefined) {
        result.joins = joins;
      }
    }

    return result;
  }
}