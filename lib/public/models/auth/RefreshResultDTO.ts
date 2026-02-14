import { DocumentDTO } from "../collection/DocumentDTO.js";
import type { Json } from "../../../../types/Json.js";

/**
 * Represents the response from a Payload CMS `refresh-token` endpoint.
 */
export class RefreshResultDTO {
  refreshedToken: string = '';
  exp: number = 0;
  user: DocumentDTO = new DocumentDTO();

  /**
   * Maps a plain JSON object into a {@link RefreshResultDTO}.
   *
   * @param {Json} json - The raw JSON from a Payload CMS `refresh-token` endpoint.
   *
   * @returns {RefreshResultDTO} A populated instance.
   */
  static fromJson(json: Json): RefreshResultDTO {
    const dto = new RefreshResultDTO();
    const data = (json ?? {}) as Json;

    if (typeof data['refreshedToken'] === 'string') {
      dto.refreshedToken = data['refreshedToken'];
    }

    if (typeof data['exp'] === 'number') {
      dto.exp = data['exp'];
    }

    if (typeof data['user'] === 'object' && data['user'] !== null && !Array.isArray(data['user'])) {
      dto.user = DocumentDTO.fromJson(data['user'] as Json);
    }

    return dto;
  }
}
