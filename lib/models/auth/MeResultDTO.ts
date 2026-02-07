import { DocumentDTO } from "../collection/DocumentDTO.js";
import { isJsonObject } from "../../internal/utils/isJsonObject.js";
import type { Json } from "../../types/Json.js";

/**
 * MeResultDTO
 *
 * A data transfer object representing the response from a
 * Payload CMS "me" endpoint.
 *
 * Contains the currently authenticated user document and
 * optional token/session metadata.
 */
export class MeResultDTO {
  user: DocumentDTO = new DocumentDTO();
  token: string = '';
  exp: number = 0;
  collection: string = '';
  strategy: string = '';

  /**
   * Maps a plain JSON object into a {@link MeResultDTO}.
   *
   * @param {Json} json - The raw JSON object from a Payload CMS me endpoint.
   * @returns {MeResultDTO} A populated MeResultDTO instance.
   */
  static fromJson(json: Json): MeResultDTO {
    const dto = new MeResultDTO();
    const data = (json ?? {}) as Json;

    if (isJsonObject(data['user'])) {
      dto.user = DocumentDTO.fromJson(data['user']);
    }

    if (typeof data['token'] === 'string') {
      dto.token = data['token'];
    }

    if (typeof data['exp'] === 'number') {
      dto.exp = data['exp'];
    }

    if (typeof data['collection'] === 'string') {
      dto.collection = data['collection'];
    }

    if (typeof data['strategy'] === 'string') {
      dto.strategy = data['strategy'];
    }

    return dto;
  }
}
