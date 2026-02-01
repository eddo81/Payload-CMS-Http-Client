import type { IAuthCredential } from "../internal/contracts/IAuthCredential.js";

/**
 * HttpClientConfig
 *
 * Configuration options for constructing an {@link HttpClient} instance.
 *
 * @property {string} baseUrl - The root URL of the Payload CMS instance (e.g. "https://cms.example.com").
 * @property {Record<string, string>} [headers] - Optional additional HTTP headers to include with every request.
 * @property {IAuthCredential} [auth] - Optional authentication credential applied to outbound requests.
 */
export interface HttpClientConfig {
  baseUrl: string;
  headers?: Record<string, string>;
  auth?: IAuthCredential;
}
