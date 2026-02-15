/**
 * A structured error thrown on failed Payload CMS requests.
 *
 * Captures the HTTP status code, the originating `Response`,
 * and an optional cause (e.g. parsed JSON error payload).
 *
 * Thrown by {@link HttpClient} on non-2xx responses or
 * fatal transport / parsing errors.
 */
export class PayloadError extends Error {
  public readonly statusCode: number;
  public readonly response?: Response;

  constructor(options: {
    statusCode: number;
    message?: string;
    response?: Response;
    cause?: unknown;
  }) {
    const { statusCode, message, response, cause } = options;

    const resolvedMessage = message ?? `[PayloadError] Request failed with status: ${statusCode}`;

    super(resolvedMessage, { cause });

    this.name = 'PayloadError';
    this.statusCode = statusCode;
    this.response = response;

    Object.setPrototypeOf(this, PayloadError.prototype);
  }
}
