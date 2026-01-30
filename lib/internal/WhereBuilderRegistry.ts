import { WhereBuilder } from "../WhereBuilder.js";

/**
 * WhereBuilderRegistry
 *
 * A keyed registry that lazily provisions and caches `WhereBuilder`
 * instances. Each key maps to a single `WhereBuilder`, which is
 * created on first access and reused on subsequent lookups.
 *
 * This ensures that multiple calls targeting the same key accumulate
 * clauses into a shared `WhereBuilder` instance rather than replacing
 * previous state.
 *
 * Used internally by `JoinBuilder` to manage per-join-field where
 * clause composition.
 */
export class WhereBuilderRegistry {
  private readonly _store: Map<string, WhereBuilder> = new Map();

 /**
  * Returns the `WhereBuilder` for the given key.
  *
  * If no `WhereBuilder` exists for the key, a new one is created
  * and stored before being returned.
  *
  * @param {string} key - The registry key (e.g. a join field name).
  * @returns {WhereBuilder} The existing or newly created `WhereBuilder`.
  */
  get(key: string): WhereBuilder {
    let builder = this._store.get(key);

    if(builder === undefined) {
      builder = new WhereBuilder();

      this._store.set(key, builder);
    }

    return builder;
  }
}