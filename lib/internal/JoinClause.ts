import type { IClause } from "./contracts/IClause.js";

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

  /**
   * Internal key-value store for join operations.
   *
   * Keys correspond to Payload join options such as:
   * - `limit`
   * - `page`
   * - `sort`
   * - `count`
   * - `where`
   *
   * Values are overwritten when the same operation is set multiple times.
   */
  private readonly _kvp: Record<string, unknown> = {};

 /**
  * Creates a new JoinClause for a given join field.
  *
  * @param {string} on - The name of the `Join Field` to join on (e.g. "relatedPosts").
  * @param {string} field - Optional initial join operation key (e.g. "limit", "sort").
  * @param {unknown} value - Optional value for the join operation.
  */
  constructor(on: string, field?: string, value?: unknown) {
    this.on = on;
    if (field !== undefined && value !== undefined) {
      this.set(field, value);
    }
  }

 /**
  * Sets or replaces a join operation for this clause.
  *
  * If the same operation key is set multiple times, the
  * previous value is overwritten (last-write-wins).
  *
  * @param {string} field - The join operation key.
  * @param {unknown} value - The operation value.
  */
  set(field: string, value: unknown): void {
    this._kvp[field] = value;
  }

  /**
   * Serializes the join clause into a Payload-compatible structure.
   *
   * This method does not mutate internal state and may be called
   * multiple times safely.
   *
   * @returns {Record<string, unknown>} A nested object suitable for query string encoding.
   */
  build(): Record<string, unknown> {
    return { [this.on]: { ...this._kvp } };
  }
}
