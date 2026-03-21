import { ErrorDetail } from './ErrorDetail.js';

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
  public readonly response: Response | undefined;
  public readonly cause: unknown;

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
    this.cause = cause;

    Object.setPrototypeOf(this, PayloadError.prototype);
  }

  /**
   * Extracts structured error entries from the response body.
   *
   * Navigates `cause["errors"]` for validation-style errors (e.g. duplicate
   * email, missing required field), or falls back to a top-level
   * `cause["message"]` for simpler error shapes (e.g. auth errors).
   *
   * Returns an empty array if no recognisable error structure is found.
   */
  getDetails(): ErrorDetail[] {
    if (typeof this.cause !== 'object' || this.cause === null) {
      return [];
    }

    const cause = this.cause as Record<string, unknown>;

    if (Array.isArray(cause['errors'])) {
      const details: ErrorDetail[] = [];

      for (const item of cause['errors']) {
        if (typeof item !== 'object' || item === null) {
          continue;
        }

        const error = item as Record<string, unknown>;

        if (typeof error['message'] !== 'string') {
          continue;
        }

        const message = error['message'];
        const field = typeof error['field'] === 'string' ? error['field'] : undefined;

        details.push(new ErrorDetail({ message, field }));
      }

      return details;
    }

    if (typeof cause['message'] === 'string') {
      return [new ErrorDetail({ message: cause['message'] })];
    }

    return [];
  }
}
