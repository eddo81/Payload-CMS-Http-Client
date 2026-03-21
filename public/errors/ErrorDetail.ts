/**
 * Represents a single error entry extracted from a {@link PayloadError} response body.
 */
export class ErrorDetail {
  public readonly message: string;
  public readonly field: string | undefined;

  constructor(options: { message: string; field?: string }) {
    const { message, field } = options;

    this.message = message;
    this.field = field;
  }
}
