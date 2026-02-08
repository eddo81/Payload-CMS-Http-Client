/**
 * Defines the shape of a file to be uploaded alongside
 * document data to a Payload CMS upload collection.
 *
 * Portability:
 * - TypeScript: Blob (content), string (filename), string (mimeType)
 * - C#: byte[] (content), string (filename), string (mimeType)
 * - Dart: Uint8List (content), String (filename), String (mimeType)
 */
export interface IFileUpload {
  /** The binary content of the file. */
  readonly content: Blob;

  /** The filename to use for the upload (e.g., "photo.jpg"). */
  readonly filename: string;

  /** Optional MIME type (e.g., "image/jpeg"). If omitted, the content's type is used as-is. */
  readonly mimeType: string | undefined;
}
