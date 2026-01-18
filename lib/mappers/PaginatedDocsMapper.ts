import { PaginatedDocsDTO } from "../models/PaginatedDocsDTO.js";
import { DocumentMapper } from "./DocumentMapper.js";
import { Json, JsonValue } from "../types/Json.js";

function isJsonObject(value: JsonValue): value is Json {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * PaginatedDocsMapper
 *
 * Responsible for mapping paginated collection responses from
 * Payload CMS REST endpoints into {@link PaginatedDocsDTO} instances.
 *
 * This mapper represents an inbound transport boundary, converting
 * untyped JSON payloads into structured, domain-safe DTOs.
 *
 * It performs defensive checks against malformed or partial API
 * responses and normalizes nested document records via
 * {@link DocumentMapper}.
 *
 * This class is intentionally unidirectional, as paginated document
 * collections are only constructed from API responses.
 */
export class PaginatedDocsMapper {
 /**
  * Maps a paginated Payload CMS JSON response into a
  * {@link PaginatedDocsDTO}.
  *
  * This method performs an inbound transport mapping from a raw,
  * untyped JSON payload into a structured DTO representation.
  *
  * Nested document records are mapped individually using
  * {@link DocumentMapper.fromJson}, and only valid JSON objects
  * are considered during mapping.
  *
  * Missing or malformed fields are ignored, allowing the mapper
  * to safely handle partial or unexpected API responses.
  *
  * @param {Json} json - The raw JSON payload returned by a Payload CMS endpoint.
  * @returns {PaginatedDocsDTO} A populated PaginatedDocsDTO instance.
  */
  static fromJson(json: Json): PaginatedDocsDTO {
    const dto = new PaginatedDocsDTO();
    const data = (json ?? {}) as Json;

    if (Array.isArray(data['docs'])) {
      dto.docs = data['docs']
        .filter(isJsonObject)
        .map(doc => DocumentMapper.fromJson(doc));
    }
      
    if(typeof data['hasNextPage'] === 'boolean') {
      dto.hasNextPage = data['hasNextPage']
    }

    if(typeof data['hasPrevPage'] === 'boolean') {
      dto.hasPrevPage = data['hasPrevPage']
    }

    if(typeof data['limit'] === 'number') {
      dto.limit = data['limit']
    }

    if(typeof data['totalDocs'] === 'number') {
      dto.totalDocs = data['totalDocs']
    }

    if(typeof data['totalPages'] === 'number') {
      dto.totalPages = data['totalPages']
    }

    if(typeof data['page'] === 'number') {
      dto.page = data['page']
    }

    if(typeof data['nextPage'] === 'number') {
      dto.nextPage = data['nextPage']
    }

    if(typeof data['prevPage'] === 'number') {
      dto.prevPage = data['prevPage']
    }

    return dto;
  }
}