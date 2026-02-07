import { DocumentDTO } from "../collection/DocumentDTO.js";
import { isJsonObject } from "../../internal/utils/isJsonObject.js";
import type { Json } from "../../types/Json.js";

/**
 * ResetPasswordResultDTO
 *
 * A data transfer object representing the response from a
 * Payload CMS reset-password endpoint.
 *
 * Contains the user document and an optional new JWT token
 * issued after the password reset.
 */
export class ResetPasswordResultDTO {
  user: DocumentDTO = new DocumentDTO();
  token: string = '';

  /**
   * Maps a plain JSON object into a {@link ResetPasswordResultDTO}.
   *
   * @param {Json} json - The raw JSON object from a Payload CMS reset-password endpoint.
   * @returns {ResetPasswordResultDTO} A populated ResetPasswordResultDTO instance.
   */
  static fromJson(json: Json): ResetPasswordResultDTO {
    const dto = new ResetPasswordResultDTO();
    const data = (json ?? {}) as Json;

    if (isJsonObject(data['user'])) {
      dto.user = DocumentDTO.fromJson(data['user']);
    }

    if (typeof data['token'] === 'string') {
      dto.token = data['token'];
    }

    return dto;
  }
}
