import { HttpClient } from "./HttpClient.js";

/**
 * PayloadError
 *
 * A structured error type representing a failed request to a Payload CMS API.
 *
 * This error normalizes all failure-related information at construction time
 * so downstream consumers can rely on consistent, invariant state.
 *
 * Responsibilities:
 * - Capture the HTTP status code associated with the failure
 * - Preserve the originating `Response` when available
 * - Provide a meaningful default error message
 * - Safely attach an underlying cause (e.g. parsed JSON error payload)
 *
 * This type is thrown by the {@link HttpClient} when a Payload API request fails
 * with a non-2xx response or encounters a fatal transport / parsing error.
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
    const data = {
      statusCode: options.statusCode,
      message: options.message ?? `[PayloadError] Request failed with status: ${options.statusCode}`,
      response: options.response,
      cause: options.cause,
    };

    super(data.message, { cause: data.cause });

    this.name = 'PayloadError';
    this.statusCode = data.statusCode;
    this.response = data.response;

    Object.setPrototypeOf(this, PayloadError.prototype);
  }
}