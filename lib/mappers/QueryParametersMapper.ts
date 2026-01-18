import { QueryParametersDTO } from "../models/QueryParametersDTO.js";
import { Json } from "../types/Json.js";

/**
 * QueryParametersMapper
 *
 * Responsible for mapping {@link QueryParametersDTO} instances
 * into transport-level representations suitable for serialization
 * and HTTP transmission.
 *
 * This class enforces the boundary between domain-level query intent
 * and the concrete shape required by Payload CMS REST endpoints.
 *
 * It is intentionally unidirectional, as query parameters are only
 * constructed outbound.
 */
export class QueryParametersMapper {
 /**
  * Maps a {@link QueryParametersDTO} into a plain JSON object.
  *
  * This method performs an outbound transport mapping from
  * domain-level query intent into a JSON-compatible shape
  * suitable for query string serialization.
  *
  * Only defined and meaningful values are included in the
  * resulting object.
  *
  * @param {QueryParametersDTO} dto - The QueryParametersDTO to map.
  * @returns A plain JSON object suitable for query string serialization.
  */
  static toJson(dto: QueryParametersDTO): Json {
    const result: Json = {};

    // Copy only defined, meaningful values
    if (dto.where !== undefined) {
      result.where = dto.where;
    }

    if (dto.joins !== undefined) {
      result.joins = dto.joins;
    }

    if (dto.limit !== undefined) {
      result.limit = dto.limit;
    }

    if (dto.page !== undefined) {
      result.page = dto.page;
    }

    if (dto.sort !== undefined) {
      result.sort = dto.sort;
    }

    if (dto.select !== undefined) {
      result.select = dto.select;
    }

    if (dto.depth !== undefined) {
      result.depth = dto.depth;
    }

    if (dto.locale !== undefined) {
      result.locale = dto.locale;
    }

    return result;
  }
}