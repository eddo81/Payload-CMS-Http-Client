import type { IClause } from "./contracts/IClause.js";
import type { Json } from "../types/Json.js";

/**
 * JoinClause
 *
 * Represents a single join target (`on`) and its associated
 * join-scoped operations (e.g. `limit`, `sort`, `where`, `count`).
 *
 * A JoinClause is a **mutable internal value object** used by
 * `JoinBuilder` to accumulate operations for a specific join field.
 * Multiple join operations targeting the same `on` field are
 * coalesced into a single clause instance.
 *
 * The final Payload-compatible structure is produced only when
 * `build()` is called.
 *
 * Example serialized output:
 *
 * ```ts
 * {
 *   relatedPosts: {
 *     limit: 5,
 *     sort: "title",
 *     where: { status: { equals: "published" } }
 *   }
 * }
 * ```
 */
export class JoinClause implements IClause {
 /**
  * The relation field this join targets.
  *
  * This value is immutable for the lifetime of the clause and
  * is used as the top-level join key in the serialized output.
  */
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
   * Serializes the join clause into a Payload-compatible structure.
   *
   * This method does not mutate internal state and may be called
   * multiple times safely.
   *
   * @returns {Json} A nested object suitable for query string encoding.
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
