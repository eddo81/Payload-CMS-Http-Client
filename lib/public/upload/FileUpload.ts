import type { IFileUpload } from "../../internal/contracts/IFileUpload.js";

/**
 * Represents a file to upload to a Payload CMS `upload` collection.
 *
 * Pass to the `file` parameter of {@link HttpClient.create},
 * {@link HttpClient.updateById}, or {@link HttpClient.update}.
 */
export class FileUpload implements IFileUpload {
  readonly content: Blob;
  readonly filename: string;
  readonly mimeType: string | undefined;

  constructor(options: { content: Blob; filename: string; mimeType?: string }) {
    this.content = options.content;
    this.filename = options.filename;
    this.mimeType = options.mimeType;
  }
}
