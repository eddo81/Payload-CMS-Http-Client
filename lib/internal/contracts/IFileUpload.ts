/**
 * Defines the shape of a file for Payload CMS `upload` collections.
 */
export interface IFileUpload {
  /** The binary content of the file. */
  readonly content: Blob;

  /** The filename to use for the upload (e.g., "photo.jpg"). */
  readonly filename: string;

  /** Optional MIME type (e.g., "image/jpeg"). If omitted, the content's type is used as-is. */
  readonly mimeType: string | undefined;
}
