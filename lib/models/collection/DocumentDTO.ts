import type { Json } from "../../types/Json.js";

/**
 * DocumentDTO
 *
 * A data transfer object representing a document; a record with a
 * specific schema defined within Payload CMS.
 *
 * The `json` field retains the full raw response, including `id`,
 * `createdAt`, and `updatedAt`. This intentional redundancy ensures
 * that all user-defined fields remain accessible without the DTO
 * needing to model every possible schema.
 */
export class DocumentDTO {
  json: Json = {};
  id: string = '';
  createdAt?: Date = undefined;
  updatedAt?: Date = undefined;

 /**
  * Maps a plain JSON object into a {@link DocumentDTO}.
  *
  * Transport-level primitives are interpreted and normalized
  * into appropriate domain types (e.g. ISO date strings into
  * {@link Date} instances).
  *
  * @param {Json} json - The raw JSON object received from a Payload CMS endpoint.
  * @returns {DocumentDTO} A populated DocumentDTO instance.
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
  * Non-JSON primitives (such as {@link Date}) are normalized
  * into transport-safe representations.
  *
  * @param {DocumentDTO} dto - The DocumentDTO to map.
  * @returns {Json} A plain JSON object suitable for Payload CMS transport.
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
