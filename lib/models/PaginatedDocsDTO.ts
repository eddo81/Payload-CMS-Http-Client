import { DocumentDTO } from "./DocumentDTO.js";

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
}