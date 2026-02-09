import { DocumentDTO } from "./DocumentDTO.js";
import { isJsonObject } from "../../../internal/utils/isJsonObject.js";
import type { Json } from "../../types/Json.js";

/**
 * Represents a paginated collection of Payload CMS documents.
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
  * Maps a paginated JSON response into a {@link PaginatedDocsDTO}.
  *
  * @param {Json} json - The raw JSON from a Payload CMS endpoint.
  *
  * @returns {PaginatedDocsDTO} A populated instance.
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
