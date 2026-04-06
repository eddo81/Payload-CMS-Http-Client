import type { Json } from "../../types/Json.js";
import { SelectClause } from "../../internal/SelectClause.js";

/**
 * Fluent builder for Payload CMS `select` query parameters.
 *
 * Composes a set of {@link SelectClause} entries into a nested
 * field-inclusion/exclusion tree that the `QueryStringEncoder`
 * serializes to bracket notation
 * (e.g. `select[group][number]=true`).
 *
 * Use dot notation to target nested fields:
 * `'group.number'` → `select[group][number]=true`.
 */
export class SelectBuilder {
  private readonly _clauses: SelectClause[] = [];

  /**
   * Marks fields for inclusion in the response.
   *
   * Use dot notation for nested paths (e.g. `'group.number'`).
   *
   * @param {string[]} options.fields - Field names to include.
   *
   * @returns {this} The current builder for chaining.
   */
  select(options: { fields: string[] }): this {
    const { fields } = options;

    for (const field of fields) {
      this._clauses.push(new SelectClause({ segments: field.split('.'), value: true }));
    }

    return this;
  }

  /**
   * Marks fields for exclusion from the response.
   *
   * Use dot notation for nested paths (e.g. `'group.number'`).
   *
   * @param {string[]} options.fields - Field names to exclude.
   *
   * @returns {this} The current builder for chaining.
   */
  exclude(options: { fields: string[] }): this {
    const { fields } = options;

    for (const field of fields) {
      this._clauses.push(new SelectClause({ segments: field.split('.'), value: false }));
    }

    return this;
  }

  /**
   * Builds the final `select` object by deep-merging all clauses.
   *
   * @returns {Json | undefined} The merged field map, or `undefined` if no fields were configured.
   */
  build(): Json | undefined {
    if (this._clauses.length === 0) {
      return undefined;
    }

    const result: Json = {};

    for (const clause of this._clauses) {
      this._mergeSelectClauses(result, clause.build());
    }

    return result;
  }

  private _mergeSelectClauses(target: Json, source: Json): void {
    for (const [key, value] of Object.entries(source)) {
      if (typeof target[key] === 'object' && target[key] !== null && !Array.isArray(target[key]) && typeof value === 'object' && value !== null && !Array.isArray(value)) {
        this._mergeSelectClauses(target[key] as Json, value as Json);
      }
      else {
        target[key] = value;
      }
    }
  }
}
