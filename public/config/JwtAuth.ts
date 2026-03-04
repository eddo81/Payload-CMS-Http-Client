import type { IAuthCredential } from "../../internal/contracts/IAuthCredential.js";

/**
 * {@link IAuthCredential} for Payload CMS `JWT` authentication.
 *
 * Sets the `Authorization` header to: `Bearer {token}`
 *
 * @see https://payloadcms.com/docs/authentication/token-data
 */
export class JwtAuth implements IAuthCredential {
  private readonly _token: string;

  constructor(options: { token: string }) {
    const { token } = options;

    this._token = token;
  }

  apply(options: { headers: Record<string, string> }): void {
    const { headers } = options;

    headers['Authorization'] = `Bearer ${this._token}`;
  }
}
