import { DocumentDTO } from "../collection/DocumentDTO.js";
import type { Json } from "../../types/Json.js";

/**
 * LoginResultDTO
 *
 * A data transfer object representing the response from a
 * Payload CMS login endpoint.
 *
 * Contains the JWT token, its expiration timestamp, the
 * authenticated user document, and a status message.
 */
export class LoginResultDTO {
  token: string = '';
  exp: number = 0;
  user: DocumentDTO = new DocumentDTO();
  message: string = '';

  /**
   * Maps a plain JSON object into a {@link LoginResultDTO}.
   *
   * @param {Json} json - The raw JSON object from a Payload CMS login endpoint.
   * @returns {LoginResultDTO} A populated LoginResultDTO instance.
   */
  static fromJson(json: Json): LoginResultDTO {
    const dto = new LoginResultDTO();
    const data = (json ?? {}) as Json;

    if (typeof data['token'] === 'string') {
      dto.token = data['token'];
    }

    if (typeof data['exp'] === 'number') {
      dto.exp = data['exp'];
    }

    if (typeof data['user'] === 'object' && data['user'] !== null && !Array.isArray(data['user'])) {
      dto.user = DocumentDTO.fromJson(data['user'] as Json);
    }

    if (typeof data['message'] === 'string') {
      dto.message = data['message'];
    }

    return dto;
  }
}
