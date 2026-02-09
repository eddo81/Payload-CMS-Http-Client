import type { Json } from "../../public/types/Json.js";

/**
 * Contract for a serializable query clause strategy.
 */
export interface IClause {
  /**
   * Serializes the clause into a Payload CMS query object.
   *
   * @returns {Json} A nested object for query string encoding.
   */
   build(): Json;
}