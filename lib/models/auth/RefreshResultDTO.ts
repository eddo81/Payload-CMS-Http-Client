import { DocumentDTO } from "../collection/DocumentDTO.js";
import { isJsonObject } from "../../internal/utils/isJsonObject.js";
import type { Json } from "../../types/Json.js";

/**
 * RefreshResultDTO
 *
 * A data transfer object representing the response from a
 * Payload CMS refresh-token endpoint.
 *
 * Contains the new JWT token, its expiration timestamp,
 * and the authenticated user document.
 */
export class RefreshResultDTO {
  refreshedToken: string = '';
  exp: number = 0;
  user: DocumentDTO = new DocumentDTO();

  /**
   * Maps a plain JSON object into a {@link RefreshResultDTO}.
   *
   * @param {Json} json - The raw JSON object from a Payload CMS refresh-token endpoint.
   * @returns {RefreshResultDTO} A populated RefreshResultDTO instance.
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

    if (isJsonObject(data['user'])) {
      dto.user = DocumentDTO.fromJson(data['user']);
    }

    return dto;
  }
}
