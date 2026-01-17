import { QueryParametersDTO } from "../models/QueryParametersDTO.js";

export class Projections {
  /**
   * Projects a {@link QueryParametersDTO} into a plain object.
   *
   * This enforces the boundary between domain intent
   * and transport representation.
   * 
   * @param {QueryParametersDTO} dto - The QueryParametersDTO to operate on.
   * @returns A plain object suitable for query string serialization.
   */
  static queryParameters(dto: QueryParametersDTO): Record<string, unknown> {
    const result: Record<string, unknown> = {};

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