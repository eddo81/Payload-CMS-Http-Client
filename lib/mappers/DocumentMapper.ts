import { DocumentDTO } from "../models/DocumentDTO.js";
import { Json } from "../types/Json.js";

/**
 * DocumentMapper
 *
 * Responsible for mapping between raw JSON data and {@link DocumentDTO}
 * instances.
 *
 * This class centralizes all inbound and outbound transformations
 * between transport-level representations (JSON) and domain-level
 * DTOs, enforcing a clear and explicit mapping boundary.
 *
 * It is intentionally stateless and provides only pure mapping
 * operations.
 */
export class DocumentMapper {
 /**
  * Maps a plain JSON object into a {@link DocumentDTO}.
  *
  * This method performs an inbound transport mapping from a
  * JSON-compatible representation into a domain-level DTO.
  *
  * Transport-level primitives are interpreted and normalized
  * into appropriate domain types (e.g. ISO date strings into
  * {@link Date} instances).
  *
  * @param {Json} json - The raw JSON object received from a Payload CMS endpoint.
  * @returns A populated {@link DocumentDTO} instance.
  */
  static fromJson(json: Json): DocumentDTO {
    const dto = new DocumentDTO();
    const data = (json ?? {}) as Json;

    if(data) {
      dto.json = data;
    }

    if(typeof data['id'] === 'string') {
      dto.id = data['id'];
    }

    if(typeof data['createdAt'] === 'string' && data['createdAt'] !== '') {
      dto.createdAt = new Date(data['createdAt']);
    }

    if(typeof data['updatedAt'] === 'string' && data['updatedAt'] !== '') {
      dto.updatedAt = new Date(data['updatedAt']);
    }
  
    return dto;
  }

 /**
  * Maps a {@link DocumentDTO} into a plain JSON object.
  *
  * This method performs an outbound transport mapping from
  * the domain representation into a JSON-compatible shape
  * suitable for HTTP requests or persistence.
  *
  * Non-JSON primitives (such as {@link Date}) are normalized
  * into transport-safe representations.
  *
  * @param {DocumentDTO} dto - The DocumentDTO to map.
  * @returns A plain JSON object suitable for Payload CMS transport.
  */
  static toJson(dto: DocumentDTO): Json {
    const result: Json = {
      ...dto.json,
      id: dto.id,
    };

    if(dto.createdAt instanceof Date) {
      result.createdAt = dto.createdAt.toISOString();
    }

    if(dto.updatedAt instanceof Date) {
      result.updatedAt = dto.updatedAt.toISOString();
    }

    return result;
  }
}