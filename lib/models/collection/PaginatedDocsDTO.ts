import { DocumentDTO } from "./DocumentDTO.js";
import { isJsonObject } from "../../internal/utils/isJsonObject.js";
import type { Json } from "../../types/Json.js";

/**
 * PaginatedDocsDTO
 *
 * A data transfer object representing a paginated collection of
 * documents from a Payload CMS API endpoint.
 */
export class PaginatedDocsDTO {
  docs: DocumentDTO[] = [];
  hasNextPage: boolean = false;
  hasPrevPage: boolean = false;
  limit: number = 10;
  totalDocs: number = 0;
  totalPages: number = 1;
  page?: number | undefined = undefined;
  nextPage?: number | undefined = undefined;
  prevPage?: number | undefined = undefined;

 /**
  * Maps a paginated Payload CMS JSON response into a
  * {@link PaginatedDocsDTO}.
  *
  * Nested document records are mapped individually using
  * {@link DocumentDTO.fromJson}, and only valid JSON objects
  * are considered during mapping.
  *
  * Missing or malformed fields are ignored, allowing the factory
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
        .map(doc => DocumentDTO.fromJson(doc));
    }

    if(typeof data['hasNextPage'] === 'boolean') {
      dto.hasNextPage = data['hasNextPage'];
    }

    if(typeof data['hasPrevPage'] === 'boolean') {
      dto.hasPrevPage = data['hasPrevPage'];
    }

    if(typeof data['limit'] === 'number') {
      dto.limit = data['limit'];
    }

    if(typeof data['totalDocs'] === 'number') {
      dto.totalDocs = data['totalDocs'];
    }

    if(typeof data['totalPages'] === 'number') {
      dto.totalPages = data['totalPages'];
    }

    if(typeof data['page'] === 'number') {
      dto.page = data['page'];
    }

    if(typeof data['nextPage'] === 'number') {
      dto.nextPage = data['nextPage'];
    }

    if(typeof data['prevPage'] === 'number') {
      dto.prevPage = data['prevPage'];
    }

    return dto;
  }
}
