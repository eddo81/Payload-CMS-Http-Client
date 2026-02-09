import { DocumentDTO } from "../collection/DocumentDTO.js";
import { isJsonObject } from "../../../internal/utils/isJsonObject.js";
import type { Json } from "../../types/Json.js";

/**
 * Represents the response from a Payload CMS `login` endpoint.
 */
export class LoginResultDTO {
  token: string = '';
  exp: number = 0;
  user: DocumentDTO = new DocumentDTO();
  message: string = '';

  /**
   * Maps a plain JSON object into a {@link LoginResultDTO}.
   *
   * @param {Json} json - The raw JSON from a Payload CMS `login` endpoint.
   *
   * @returns {LoginResultDTO} A populated instance.
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

    if (isJsonObject(data['user'])) {
      dto.user = DocumentDTO.fromJson(data['user']);
    }

    if (typeof data['message'] === 'string') {
      dto.message = data['message'];
    }

    return dto;
  }
}
