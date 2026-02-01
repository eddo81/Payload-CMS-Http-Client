import type { IAuthCredential } from "../internal/contracts/IAuthCredential.js";

/**
 * ApiKeyAuth
 *
 * An {@link IAuthCredential} implementation for Payload CMS API key
 * authentication.
 *
 * Payload CMS expects API key credentials in the `Authorization`
 * header using the format:
 *
 *     {collectionSlug} API-Key {apiKey}
 *
 * For example: `users API-Key abc123`
 *
 * @see https://payloadcms.com/docs/authentication/api-keys
 */
export class ApiKeyAuth implements IAuthCredential {
  private readonly _collectionSlug: string;
  private readonly _apiKey: string;

  constructor(collectionSlug: string, apiKey: string) {
    this._collectionSlug = collectionSlug;
    this._apiKey = apiKey;
  }

  applyTo(headers: Record<string, string>): void {
    headers['Authorization'] = `${this._collectionSlug} API-Key ${this._apiKey}`;
  }
}
