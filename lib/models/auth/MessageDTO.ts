import type { Json } from "../../types/Json.js";

/**
 * MessageDTO
 *
 * A data transfer object representing a simple message response
 * from Payload CMS.
 *
 * Used by endpoints that return only a status message, such as
 * forgot-password and verify-email.
 */
export class MessageDTO {
  message: string = '';

  /**
   * Maps a plain JSON object into a {@link MessageDTO}.
   *
   * @param {Json} json - The raw JSON object from a Payload CMS endpoint.
   * @returns {MessageDTO} A populated MessageDTO instance.
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
