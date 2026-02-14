import type { IClause } from "./contracts/IClause.js";
import type { Json } from "../../types/Json.js";

/**
 * Accumulates join-scoped operations for a single `Join Field`.
 *
 * Used internally by {@link JoinBuilder} to collect `limit`,
 * `sort`, `where`, and `count` per join target.
 */
export class JoinClause implements IClause {
 /** The `Join Field` name this clause targets. */
  public readonly on: string;

  limit?: number;
  page?: number;
  sort?: string;
  count?: boolean;
  where?: Json;

 /**
  * Creates a new JoinClause for a given join field.
  *
  * @param {string} on - The name of the `Join Field` to join on (e.g. "relatedPosts").
  */
  constructor(on: string) {
    this.on = on;
  }

  /**
   * Serializes the clause into a Payload-compatible structure.
   *
   * @returns {Json} A nested object for query string encoding.
   */
  build(): Json {
    const inner: Json = {};

    if (this.limit !== undefined) inner.limit = this.limit;
    if (this.page !== undefined) inner.page = this.page;
    if (this.sort !== undefined) inner.sort = this.sort;
    if (this.count !== undefined) inner.count = this.count;
    if (this.where !== undefined) inner.where = this.where;

    return { [this.on]: inner };
  }
}
