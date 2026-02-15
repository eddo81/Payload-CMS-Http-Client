import type { IAuthCredential } from "../../internal/contracts/IAuthCredential.js";

/**
 * {@link IAuthCredential} for Payload CMS `API Key` authentication.
 *
 * Sets the `Authorization` header to:
 * `{collectionSlug} API-Key {apiKey}`
 *
 * @see https://payloadcms.com/docs/authentication/api-keys
 */
export class ApiKeyAuth implements IAuthCredential {
  private readonly _collectionSlug: string;
  private readonly _apiKey: string;

  constructor(options: { collectionSlug: string; apiKey: string }) {
    const { collectionSlug, apiKey } = options;

    this._collectionSlug = collectionSlug;
    this._apiKey = apiKey;
  }

  applyTo(options: { headers: Record<string, string> }): void {
    const { headers } = options;

    headers['Authorization'] = `${this._collectionSlug} API-Key ${this._apiKey}`;
  }
}
