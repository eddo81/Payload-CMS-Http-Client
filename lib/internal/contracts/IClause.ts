export interface IClause {
  /**
   * Serializes the clause into a nested object compatible with Payload CMS query syntax.
   */
   build(): Record<string, unknown>;
}