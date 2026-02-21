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
   * @param {Record<string, string>} options.headers - The mutable headers object to modify.
   */
  apply(options: { headers: Record<string, string> }): void;
}
