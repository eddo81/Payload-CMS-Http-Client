import { DocumentDTO } from "../collection/DocumentDTO.js";
import type { Json } from "../../../../types/Json.js";

/**
 * Represents the response from a Payload CMS `reset-password` endpoint.
 */
export class ResetPasswordResultDTO {
  user: DocumentDTO = new DocumentDTO();
  token: string = '';

  /**
   * Maps a plain JSON object into a {@link ResetPasswordResultDTO}.
   *
   * @param {Json} json - The raw JSON from a Payload CMS `reset-password` endpoint.
   *
   * @returns {ResetPasswordResultDTO} A populated instance.
   */
  static fromJson(json: Json): ResetPasswordResultDTO {
    const dto = new ResetPasswordResultDTO();
    const data = (json ?? {}) as Json;

    if (typeof data['user'] === 'object' && data['user'] !== null && !Array.isArray(data['user'])) {
      dto.user = DocumentDTO.fromJson(data['user'] as Json);
    }

    if (typeof data['token'] === 'string') {
      dto.token = data['token'];
    }

    return dto;
  }
}
