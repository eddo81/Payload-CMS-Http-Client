import type { IAuthCredential } from "../internal/contracts/IAuthCredential.js";

/**
 * JwtAuth
 *
 * An {@link IAuthCredential} implementation for Payload CMS JWT
 * authentication.
 *
 * Payload CMS expects JWT credentials in the `Authorization`
 * header using the format:
 *
 *     Bearer {token}
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
