import type { Json } from "../../types/Json.js";

/**
 * Represents a simple message response from Payload CMS.
 *
 * Used by `forgot-password` and `verify-email` endpoints.
 */
export class MessageDTO {
  message: string = '';

  /**
   * Maps a plain JSON object into a {@link MessageDTO}.
   *
   * @param {Json} json - The raw JSON from a Payload CMS endpoint.
   *
   * @returns {MessageDTO} A populated instance.
   */
  static fromJson(json: Json): MessageDTO {
    const dto = new MessageDTO();
    const data = (json ?? {}) as Json;

    if (typeof data['message'] === 'string') {
      dto.message = data['message'];
    }

    return dto;
  }
}
