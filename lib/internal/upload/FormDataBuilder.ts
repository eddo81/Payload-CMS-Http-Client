import type { IFileUpload } from "../contracts/IFileUpload.js";
import type { Json } from "../../../types/Json.js";

/**
 * Constructs a `FormData` body for file upload requests.
 *
 * Payload CMS expects `file` (Blob) and `_payload`
 * (JSON string) fields.
 */
export class FormDataBuilder {
  /**
   * Builds a FormData instance from a file and document data.
   *
   * @param {IFileUpload} options.file - The file to upload.
   * @param {Json} options.data - The document data to include alongside the file.
   *
   * @returns {FormData} A FormData object ready to be used as a request body.
   */
  static build(options: { file: IFileUpload; data: Json }): FormData {
    const { file, data } = options;
    const formData = new FormData();

    const blob = (file.mimeType !== undefined) ? new Blob([file.content], { type: file.mimeType }) : file.content;

    formData.append('file', blob, file.filename);
    formData.append('_payload', JSON.stringify(data));

    return formData;
  }
}
