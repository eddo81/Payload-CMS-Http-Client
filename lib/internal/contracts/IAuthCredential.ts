/**
 * Defines a credential that can apply authentication
 * to an outbound HTTP request's headers.
 */
export interface IAuthCredential {
  /**
   * Applies authentication to the given headers object.
   *
   * Implementations should add, update, or remove headers
   * as required by their authentication method.
   *
   * @param {Record<string, string>} headers - The mutable headers object to modify.
   */
  applyTo(headers: Record<string, string>): void;
}
