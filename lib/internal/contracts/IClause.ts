import type { Json } from "../../types/Json.js";

export interface IClause {
  /**
   * Serializes the clause into a nested object compatible with Payload CMS query syntax.
   */
   build(): Json;
}