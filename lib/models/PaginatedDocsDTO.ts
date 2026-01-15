import { DocumentDTO } from "./DocumentDTO.js";
import type { Json } from '../types/Json';

/**
 * PaginatedDocsDTO
 * 
 * A data transfer object representing a paginated collection of 
 * documents from a Payload CMS API endpoint.
 */
export class PaginatedDocsDTO {
  docs: DocumentDTO[];
  hasNextPage: boolean;
  hasPrevPage: boolean; 
  limit: number; 
  totalDocs: number; 
  totalPages: number;
  page?: number;
  nextPage?: number | undefined;
  prevPage?: number | undefined;

  constructor(json?: Json) {
      const data = (json ?? {}) as any;
      this.docs = Array.isArray(data.docs) ? data.docs.map((doc: Json) => new DocumentDTO(doc)) : [];
      this.hasNextPage = data['hasNextPage'] ?? false;
      this.hasPrevPage = data['hasPrevPage'] ?? false;
      this.limit = data['limit'] ?? 10;
      this.totalDocs = data['totalDocs'] ?? 0;
      this.totalPages = data['totalPages'] ?? 1;
      this.page = data['page'] ?? undefined;
      this.nextPage = data['nextPage'] ?? undefined;
      this.prevPage = data['prevPage'] ?? undefined;
  }
}