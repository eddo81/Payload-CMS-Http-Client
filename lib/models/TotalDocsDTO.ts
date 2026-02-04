import type { Json } from "../types/Json.js";

/**
 * TotalDocsDTO
 *
 * A data transfer object representing the total document count 
 * for a collection in Payload CMS.
 *
 */
export class TotalDocsDTO {
  totalDocs: number = 0;

 /**
  * Maps a plain JSON object into a {@link TotalDocsDTO}.
  *
  * Non-JSON primitives (such as {@link Date}) are normalized
  * into transport-safe representations.
  * 
  * @param {Json} json - The raw JSON object received from a Payload CMS endpoint.
  * @returns {TotalDocsDTO} A populated TotalDocsDTO instance.
  */
  static fromJson(json: Json): TotalDocsDTO {
    const dto = new TotalDocsDTO();
    const data = (json ?? {}) as Json;

    if(typeof data['totalDocs'] === 'number') {
      dto.totalDocs = data['totalDocs'];
    }

    return dto;
  }

 /**
  * Maps a {@link TotalDocsDTO} into a plain JSON object.
  *
  * Non-JSON primitives (such as {@link Date}) are normalized
  * into transport-safe representations.
  *
  * @param {TotalDocsDTO} dto - The TotalDocsDTO to map.
  * @returns {Json} A plain JSON object suitable for Payload CMS transport.
  */
  static toJson(dto: TotalDocsDTO): Json {
    const result: Json = {
      totalDocs: dto.totalDocs,
    };

    return result;
  }
}
