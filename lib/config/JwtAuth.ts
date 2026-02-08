import type { IAuthCredential } from "../internal/contracts/IAuthCredential.js";

/**
 * {@link IAuthCredential} for Payload CMS `JWT` authentication.
 *
 * Sets the `Authorization` header to: `Bearer {token}`
 *
 * @see https://payloadcms.com/docs/authentication/token-data
 */
export class JwtAuth implements IAuthCredential {
  private readonly _token: string;

  constructor(token: string) {
    this._token = token;
  }

  applyTo(headers: Record<string, string>): void {
    headers['Authorization'] = `Bearer ${this._token}`;
  }
}
