import { WhereBuilder } from "../WhereBuilder.js";

/**
 * Lazily provisions and caches {@link WhereBuilder} instances by key.
 *
 * Used by {@link JoinBuilder} to accumulate `where` clauses
 * per `Join Field`.
 */
export class WhereBuilderRegistry {
  private readonly _store: Map<string, WhereBuilder> = new Map();

 /**
  * Returns the {@link WhereBuilder} for the given key.
  *
  * Creates and caches a new instance on first access.
  *
  * @param {string} key - The registry key (e.g. a `Join Field` name).
  *
  * @returns {WhereBuilder} The cached or newly created builder.
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