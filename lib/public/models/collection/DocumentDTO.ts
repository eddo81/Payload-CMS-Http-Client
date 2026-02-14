import type { Json } from "../../../../types/Json.js";

/**
 * Represents a Payload CMS document.
 *
 * The `json` field retains the full raw response so
 * user-defined fields remain accessible without the
 * DTO modeling every possible schema.
 */
export class DocumentDTO {
  json: Json = {};
  id: string = '';
  createdAt?: Date = undefined;
  updatedAt?: Date = undefined;

 /**
  * Maps a plain JSON object into a {@link DocumentDTO}.
  *
  * @param {Json} json - The raw JSON from a Payload CMS endpoint.
  *
  * @returns {DocumentDTO} A populated instance.
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
  * @param {DocumentDTO} dto - The instance to serialize.
  *
  * @returns {Json} A plain JSON object for transport.
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
