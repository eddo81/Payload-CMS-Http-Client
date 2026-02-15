import { PaginatedDocsDTO } from "./models/collection/PaginatedDocsDTO.js";
import { DocumentDTO } from "./models/collection/DocumentDTO.js";
import { TotalDocsDTO } from "./models/collection/TotalDocsDTO.js";
import { LoginResultDTO } from "./models/auth/LoginResultDTO.js";
import { MeResultDTO } from "./models/auth/MeResultDTO.js";
import { RefreshResultDTO } from "./models/auth/RefreshResultDTO.js";
import { ResetPasswordResultDTO } from "./models/auth/ResetPasswordResultDTO.js";
import { MessageDTO } from "./models/auth/MessageDTO.js";
import { PayloadError } from "./PayloadError.js";
import { QueryBuilder } from "./QueryBuilder.js";
import { QueryStringEncoder } from "../internal/utils/QueryStringEncoder.js";
import type { IAuthCredential } from "../internal/contracts/IAuthCredential.js";
import type { Json } from "../../types/Json.js";
import type { IFileUpload } from "../internal/contracts/IFileUpload.js";
import { FormDataBuilder } from "../internal/upload/FormDataBuilder.js";
import { HttpMethod } from "./enums/HttpMethod.js";

/**
 * HTTP client for the Payload CMS REST API.
 *
 * Provides typed methods for `collections`, `globals`,
 * `auth`, `versions`, and file uploads.
 */
export class HttpClient {
  private _baseUrl: string;
  private _headers: Record<string, string> = {};
  private _auth: IAuthCredential | undefined = undefined;
  private _encoder: QueryStringEncoder = new QueryStringEncoder();

  constructor(options: { baseUrl: string; headers?: Record<string, string>; auth?: IAuthCredential }) {
    const { baseUrl, headers, auth } = options;

    this._baseUrl = this._normalizeUrl({ url: baseUrl });

    if(headers !== undefined) {
      this.setHeaders({ headers });
    }

    if(auth !== undefined) {
      this.setAuth({ auth });
    }
  }

 /**
  * Validates and normalizes a base URL string.
  *
  * Strips trailing slashes to prevent double-slash
  * paths when building endpoint URLs.
  *
  * @param {string} options.url - The raw base URL to normalize.
  *
  * @returns {string} The normalized URL without a trailing slash.
  *
  * @throws {Error} If the URL is malformed.
  */
  private _normalizeUrl(options: { url: string }): string {
    const { url } = options;

    try {
      const urlString = new URL(url).toString();
      const normalized = urlString.replace(/\/+$/, '');

      return normalized;
    }
    catch (error) {
      throw new Error(`[PayloadError] Invalid base URL: ${url}`, { cause: error });
    }
  }

 /**
  * Sets the custom headers to include with every request.
  *
  * These are merged with the default `Accept` and
  * `Content-Type` headers at request time.
  *
  * @param {Record<string, string>} options.headers - The custom headers to set.
  *
  * @returns {void}
  */
  public setHeaders(options: { headers: Record<string, string> }): void {
    const { headers } = options;

    this._headers = headers;
  }

 /**
  * Sets or clears the authentication credential.
  *
  * Pass an {@link IAuthCredential} to inject authorization
  * headers, or `undefined` to clear.
  *
  * @param {IAuthCredential | undefined} options.auth - The credential to use, or `undefined` to clear.
  *
  * @returns {void}
  */
  public setAuth(options: { auth?: IAuthCredential }): void {
    const { auth } = options;

    this._auth = auth;
  }

 /**
  * Sends a raw HTTP request through the client pipeline.
  *
  * An escape hatch for `Payload CMS` custom endpoints.
  * Uses the same headers, auth, and error handling
  * but returns raw JSON instead of a DTO.
  *
  * @param {HttpMethod} options.method - The HTTP method to use.
  * @param {string} options.path - URL path appended to the base URL (e.g. `/api/custom-endpoint`).
  * @param {Json} [options.body] - Optional JSON body to send.
  * @param {QueryBuilder} [options.query] - Optional {@link QueryBuilder} for query parameters.
  *
  * @returns {Promise<Json | undefined>} The parsed JSON response, or `undefined` for empty bodies.
  */
  async request(options: { method: HttpMethod; path: string; body?: Json; query?: QueryBuilder }): Promise<Json | undefined> {
    const { method, path, body, query } = options;
    const url = this._appendQueryString({ url: `${this._baseUrl}${path}`, query });

    const config: RequestInit = { method };

    if (body !== undefined) {
      config.body = JSON.stringify(body);
    }

    return this._fetch({ url, config });
  }

 /**
  * Appends a serialized query string to the given URL.
  *
  * Encodes the {@link QueryBuilder} parameters via
  * {@link QueryStringEncoder} and appends them.
  *
  * @param {string} options.url - The base URL to append query parameters to.
  * @param {QueryBuilder | undefined} options.query - Optional query parameters.
  *
  * @returns {string} The URL with an appended query string, if applicable.
  */
  private _appendQueryString(options: { url: string; query?: QueryBuilder }): string {
    const { url, query } = options;

    if(query === undefined) {
      return url;
    }

    const params = query.build();
    const queryString = this._encoder.stringify({ obj: params });

    return `${url}${queryString}`;
  }

 /**
  * Executes an HTTP request and returns parsed JSON.
  *
  * Merges default headers, applies auth, parses the
  * response body, and normalizes errors into
  * {@link PayloadError} instances.
  *
  * @param {string} options.url - Fully resolved request URL.
  * @param {RequestInit} options.config - Optional `fetch` configuration overrides.
  *
  * @returns {Promise<Json | undefined>} Parsed JSON, or `undefined` for empty responses.
  *
  * @throws {PayloadError} On non-2xx responses.
  * @throws {Error} On network, parsing, or abort failures.
  */
  private async _fetch(options: { url: string; config?: RequestInit }): Promise<Json | undefined> {
    const { url, config = {} } = options;

    let response: Response;
    let text: string;
    let json: Json | undefined = undefined;
    let defaultMethod: HttpMethod = HttpMethod.GET;

    let headers: Record<string, string> = {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...this._headers,
    };

    if (config.body instanceof FormData) {
      delete headers["Content-Type"];
    }

    if (this._auth) {
      this._auth.applyTo({ headers });
    }

    try {
      response = await fetch(url, {
        method: defaultMethod,
        ...config,
        headers: headers,
      });

      text = await response.text();

      if(text.length > 0) {
        json = JSON.parse(text);
      }

      if(!response.ok) {
        throw new PayloadError({
          statusCode: response.status,
          response,
          cause: json
        });
      }

      return json;
    }
    catch (error: any) {
      let message: string = '[PayloadError] Fetch failed';

      if (error instanceof SyntaxError) {
        message = `[PayloadError] Failed to parse JSON response`;
      }
      else if (error instanceof TypeError) {
        message = `[PayloadError] Network failure or CORS issue`;
      }
      else if (error.name === 'AbortError') {
        message = `[PayloadError] Request was aborted or timed out`;
      }
      else if (error instanceof PayloadError) {
        throw error;
      }
      else if (error instanceof Error) {
        message = `[PayloadError] ${error.message}`;
      }

      throw new Error(message, { cause: error });
    }
  }

  /**
   * Retrieves a paginated list of documents from a `collection`.
   *
   * @param {string} options.slug - The `collection` slug.
   * @param {QueryBuilder} [options.query] - Optional {@link QueryBuilder} for filtering, sorting, pagination.
   *
   * @returns {Promise<PaginatedDocsDTO>} A paginated response containing matching documents.
   */
  async find(options: { slug: string; query?: QueryBuilder }): Promise<PaginatedDocsDTO> {
    const { slug, query } = options;
    const url = this._appendQueryString({ url: `${this._baseUrl}/api/${encodeURIComponent(slug)}`, query });
    const json = await this._fetch({ url }) ?? {};
    const dto = PaginatedDocsDTO.fromJson(json);

    return dto;
  }

  /**
   * Retrieves a single document by its ID.
   *
   * @param {string} options.slug - The `collection` slug.
   * @param {string} options.id - The document ID.
   * @param {QueryBuilder} [options.query] - Optional {@link QueryBuilder} for depth, locale, etc.
   *
   * @returns {Promise<DocumentDTO>} The requested document.
   */
  async findById(options: { slug: string; id: string; query?: QueryBuilder }): Promise<DocumentDTO> {
    const { slug, id, query } = options;
    const url = this._appendQueryString({ url: `${this._baseUrl}/api/${encodeURIComponent(slug)}/${encodeURIComponent(id)}`, query });
    const json = await this._fetch({ url }) ?? {};
    const dto = DocumentDTO.fromJson(json);

    return dto;
  }

  /**
   * Creates a new document in a `collection`.
   *
   * @param {string} options.slug - The `collection` slug.
   * @param {Json} options.data - The document data to create.
   * @param {IFileUpload} [options.file] - Optional file for `upload`-enabled collections.
   *
   * @returns {Promise<DocumentDTO>} The created document.
   */
  async create(options: { slug: string; data: Json; file?: IFileUpload }): Promise<DocumentDTO> {
    const { slug, data, file } = options;
    const url = `${this._baseUrl}/api/${encodeURIComponent(slug)}`;
    const method: HttpMethod = HttpMethod.POST;

    const config: RequestInit = {
      method: method,
      body: file !== undefined ? FormDataBuilder.build({ file, data }) : JSON.stringify(data),
    };

    const json = await this._fetch({ url, config }) ?? {};
    const dto = DocumentDTO.fromJson(json['doc'] as Json ?? {});

    return dto;
  }

  /**
   * Deletes multiple documents matching a query.
   *
   * @param {string} options.slug - The `collection` slug.
   * @param {QueryBuilder} options.query - {@link QueryBuilder} with `where` clause to select documents.
   *
   * @returns {Promise<PaginatedDocsDTO>} The bulk result containing deleted documents.
   */
  async delete(options: { slug: string; query: QueryBuilder }): Promise<PaginatedDocsDTO> {
    const { slug, query } = options;
    const url = this._appendQueryString({ url: `${this._baseUrl}/api/${encodeURIComponent(slug)}`, query });
    const method: HttpMethod = HttpMethod.DELETE;

    const config: RequestInit = {
      method: method,
    };

    const json = await this._fetch({ url, config }) ?? {};
    const dto = PaginatedDocsDTO.fromJson(json);

    return dto;
  }

  /**
   * Deletes a single document by its ID.
   *
   * @param {string} options.slug - The `collection` slug.
   * @param {string} options.id - The document ID.
   *
   * @returns {Promise<DocumentDTO>} The deleted document.
   */
  async deleteById(options: { slug: string; id: string }): Promise<DocumentDTO> {
    const { slug, id } = options;
    const url = `${this._baseUrl}/api/${encodeURIComponent(slug)}/${encodeURIComponent(id)}`;
    const method: HttpMethod = HttpMethod.DELETE;

    const config: RequestInit = {
      method: method,
    };

    const json = await this._fetch({ url, config }) ?? {};
    const dto = DocumentDTO.fromJson(json['doc'] as Json ?? {});

    return dto;
  }

  /**
   * Updates multiple documents matching a query.
   *
   * @param {string} options.slug - The `collection` slug.
   * @param {Json} options.data - The fields to update on matching documents.
   * @param {QueryBuilder} options.query - {@link QueryBuilder} with `where` clause to select documents.
   * @param {IFileUpload} [options.file] - Optional file for `upload`-enabled collections.
   *
   * @returns {Promise<PaginatedDocsDTO>} The bulk result containing updated documents.
   */
  async update(options: { slug: string; data: Json; query: QueryBuilder; file?: IFileUpload }): Promise<PaginatedDocsDTO> {
    const { slug, data, query, file } = options;
    const url = this._appendQueryString({ url: `${this._baseUrl}/api/${encodeURIComponent(slug)}`, query });
    const method: HttpMethod = HttpMethod.PATCH;

    const config: RequestInit = {
      method: method,
      body: file !== undefined ? FormDataBuilder.build({ file, data }) : JSON.stringify(data),
    };

    const json = await this._fetch({ url, config }) ?? {};
    const dto = PaginatedDocsDTO.fromJson(json);

    return dto;
  }

  /**
   * Updates a single document by its ID.
   *
   * @param {string} options.slug - The `collection` slug.
   * @param {string} options.id - The document ID.
   * @param {Json} options.data - The fields to update.
   * @param {IFileUpload} [options.file] - Optional file for `upload`-enabled collections.
   *
   * @returns {Promise<DocumentDTO>} The updated document.
   */
  async updateById(options: { slug: string; id: string; data: Json; file?: IFileUpload }): Promise<DocumentDTO> {
    const { slug, id, data, file } = options;
    const url = `${this._baseUrl}/api/${encodeURIComponent(slug)}/${encodeURIComponent(id)}`;
    const method: HttpMethod = HttpMethod.PATCH;

    const config: RequestInit = {
      method: method,
      body: file !== undefined ? FormDataBuilder.build({ file, data }) : JSON.stringify(data),
    };

    const json = await this._fetch({ url, config }) ?? {};
    const dto = DocumentDTO.fromJson(json['doc'] as Json ?? {});

    return dto;
  }

  /**
   * Retrieves the total document count for a `collection`.
   *
   * @param {string} options.slug - The `collection` slug.
   * @param {QueryBuilder} [options.query] - Optional {@link QueryBuilder} for filtering.
   *
   * @returns {Promise<number>} The total document count.
   */
  async count(options: { slug: string; query?: QueryBuilder }): Promise<number> {
    const { slug, query } = options;
    const url = this._appendQueryString({ url: `${this._baseUrl}/api/${encodeURIComponent(slug)}/count`, query });
    const json = await this._fetch({ url }) ?? {};
    const dto = TotalDocsDTO.fromJson(json);

    return dto.totalDocs;
  }

  /**
   * Retrieves a `global` document.
   *
   * @param {string} options.slug - The `global` slug.
   *
   * @returns {Promise<DocumentDTO>} The `global` document.
   */
  async findGlobal(options: { slug: string }): Promise<DocumentDTO> {
    const { slug } = options;
    const url = `${this._baseUrl}/api/globals/${encodeURIComponent(slug)}`;
    const json = await this._fetch({ url }) ?? {};
    const dto = DocumentDTO.fromJson(json);

    return dto;
  }

  /**
   * Updates a `global` document.
   *
   * @param {string} options.slug - The `global` slug.
   * @param {Json} options.data - The fields to update.
   *
   * @returns {Promise<DocumentDTO>} The updated `global` document.
   */
  async updateGlobal(options: { slug: string; data: Json }): Promise<DocumentDTO> {
    const { slug, data } = options;
    const url = `${this._baseUrl}/api/globals/${encodeURIComponent(slug)}`;
    const method: HttpMethod = HttpMethod.POST;

    const config: RequestInit = {
      method: method,
      body: JSON.stringify(data),
    };

    const json = await this._fetch({ url, config }) ?? {};
    const dto = DocumentDTO.fromJson(json['result'] as Json ?? {});

    return dto;
  }

  /**
   * Retrieves a paginated list of `versions` for a `collection`.
   *
   * @param {string} options.slug - The `collection` slug.
   * @param {QueryBuilder} [options.query] - Optional {@link QueryBuilder} for filtering, sorting, pagination.
   *
   * @returns {Promise<PaginatedDocsDTO>} A paginated response containing `version` documents.
   */
  async findVersions(options: { slug: string; query?: QueryBuilder }): Promise<PaginatedDocsDTO> {
    const { slug, query } = options;
    const url = this._appendQueryString({ url: `${this._baseUrl}/api/${encodeURIComponent(slug)}/versions`, query });
    const json = await this._fetch({ url }) ?? {};
    const dto = PaginatedDocsDTO.fromJson(json);

    return dto;
  }

  /**
   * Retrieves a single `version` document by its ID.
   *
   * @param {string} options.slug - The `collection` slug.
   * @param {string} options.id - The `version` ID.
   *
   * @returns {Promise<DocumentDTO>} The `version` document.
   */
  async findVersionById(options: { slug: string; id: string }): Promise<DocumentDTO> {
    const { slug, id } = options;
    const url = `${this._baseUrl}/api/${encodeURIComponent(slug)}/versions/${encodeURIComponent(id)}`;
    const json = await this._fetch({ url }) ?? {};
    const dto = DocumentDTO.fromJson(json);

    return dto;
  }

  /**
   * Restores a `collection` document to a specific `version`.
   *
   * @param {string} options.slug - The `collection` slug.
   * @param {string} options.id - The `version` ID to restore.
   *
   * @returns {Promise<DocumentDTO>} The restored document.
   */
  async restoreVersion(options: { slug: string; id: string }): Promise<DocumentDTO> {
    const { slug, id } = options;
    const url = `${this._baseUrl}/api/${encodeURIComponent(slug)}/versions/${encodeURIComponent(id)}`;
    const method: HttpMethod = HttpMethod.POST;

    const config: RequestInit = {
      method: method,
    };

    const json = await this._fetch({ url, config }) ?? {};
    const dto = DocumentDTO.fromJson(json);

    return dto;
  }

  /**
   * Retrieves a paginated list of `versions` for a `global`.
   *
   * @param {string} options.slug - The `global` slug.
   * @param {QueryBuilder} [options.query] - Optional {@link QueryBuilder} for filtering, sorting, pagination.
   *
   * @returns {Promise<PaginatedDocsDTO>} A paginated response containing `version` documents.
   */
  async findGlobalVersions(options: { slug: string; query?: QueryBuilder }): Promise<PaginatedDocsDTO> {
    const { slug, query } = options;
    const url = this._appendQueryString({ url: `${this._baseUrl}/api/globals/${encodeURIComponent(slug)}/versions`, query });
    const json = await this._fetch({ url }) ?? {};
    const dto = PaginatedDocsDTO.fromJson(json);

    return dto;
  }

  /**
   * Retrieves a single `global` `version` document by its ID.
   *
   * @param {string} options.slug - The `global` slug.
   * @param {string} options.id - The `version` ID.
   *
   * @returns {Promise<DocumentDTO>} The `version` document.
   */
  async findGlobalVersionById(options: { slug: string; id: string }): Promise<DocumentDTO> {
    const { slug, id } = options;
    const url = `${this._baseUrl}/api/globals/${encodeURIComponent(slug)}/versions/${encodeURIComponent(id)}`;
    const json = await this._fetch({ url }) ?? {};
    const dto = DocumentDTO.fromJson(json);

    return dto;
  }

  /**
   * Restores a `global` document to a specific `version`.
   *
   * @param {string} options.slug - The `global` slug.
   * @param {string} options.id - The `version` ID to restore.
   *
   * @returns {Promise<DocumentDTO>} The restored document.
   */
  async restoreGlobalVersion(options: { slug: string; id: string }): Promise<DocumentDTO> {
    const { slug, id } = options;
    const url = `${this._baseUrl}/api/globals/${encodeURIComponent(slug)}/versions/${encodeURIComponent(id)}`;
    const method: HttpMethod = HttpMethod.POST;

    const config: RequestInit = {
      method: method,
    };

    const json = await this._fetch({ url, config }) ?? {};
    const dto = DocumentDTO.fromJson(json['doc'] as Json ?? {});

    return dto;
  }

  /**
   * Authenticates a user and returns a JWT token.
   *
   * @param {string} options.slug - The `auth`-enabled `collection` slug.
   * @param {Json} options.data - The login credentials (e.g. `{ email, password }`).
   *
   * @returns {Promise<LoginResultDTO>} The login result containing token, expiration, and user.
   */
  async login(options: { slug: string; data: Json }): Promise<LoginResultDTO> {
    const { slug, data } = options;
    const url = `${this._baseUrl}/api/${encodeURIComponent(slug)}/login`;
    const method: HttpMethod = HttpMethod.POST;

    const config: RequestInit = {
      method: method,
      body: JSON.stringify(data),
    };

    const json = await this._fetch({ url, config }) ?? {};
    const dto = LoginResultDTO.fromJson(json);

    return dto;
  }

  /**
   * Retrieves the currently authenticated user.
   *
   * @param {string} options.slug - The `auth`-enabled `collection` slug.
   *
   * @returns {Promise<MeResultDTO>} The current user with token and session metadata.
   */
  async me(options: { slug: string }): Promise<MeResultDTO> {
    const { slug } = options;
    const url = `${this._baseUrl}/api/${encodeURIComponent(slug)}/me`;
    const json = await this._fetch({ url }) ?? {};
    const dto = MeResultDTO.fromJson(json);

    return dto;
  }

  /**
   * Refreshes the current JWT token.
   *
   * @param {string} options.slug - The `auth`-enabled `collection` slug.
   *
   * @returns {Promise<RefreshResultDTO>} The new token, expiration, and user.
   */
  async refreshToken(options: { slug: string }): Promise<RefreshResultDTO> {
    const { slug } = options;
    const url = `${this._baseUrl}/api/${encodeURIComponent(slug)}/refresh-token`;
    const method: HttpMethod = HttpMethod.POST;

    const config: RequestInit = {
      method: method,
    };

    const json = await this._fetch({ url, config }) ?? {};
    const dto = RefreshResultDTO.fromJson(json);

    return dto;
  }

  /**
   * Initiates the forgot-password flow.
   *
   * @param {string} options.slug - The `auth`-enabled `collection` slug.
   * @param {Json} options.data - The request data (e.g. `{ email }`).
   *
   * @returns {Promise<MessageDTO>} A message confirming the request was processed.
   */
  async forgotPassword(options: { slug: string; data: Json }): Promise<MessageDTO> {
    const { slug, data } = options;
    const url = `${this._baseUrl}/api/${encodeURIComponent(slug)}/forgot-password`;
    const method: HttpMethod = HttpMethod.POST;

    const config: RequestInit = {
      method: method,
      body: JSON.stringify(data),
    };

    const json = await this._fetch({ url, config }) ?? {};
    const dto = MessageDTO.fromJson(json);

    return dto;
  }

  /**
   * Completes a password reset using a reset token.
   *
   * @param {string} options.slug - The `auth`-enabled `collection` slug.
   * @param {Json} options.data - The reset data (e.g. `{ token, password }`).
   *
   * @returns {Promise<ResetPasswordResultDTO>} The user document and optional new token.
   */
  async resetPassword(options: { slug: string; data: Json }): Promise<ResetPasswordResultDTO> {
    const { slug, data } = options;
    const url = `${this._baseUrl}/api/${encodeURIComponent(slug)}/reset-password`;
    const method: HttpMethod = HttpMethod.POST;

    const config: RequestInit = {
      method: method,
      body: JSON.stringify(data),
    };

    const json = await this._fetch({ url, config }) ?? {};
    const dto = ResetPasswordResultDTO.fromJson(json);

    return dto;
  }

  /**
   * Verifies a user's email address using a verification token.
   *
   * @param {string} options.slug - The `auth`-enabled `collection` slug.
   * @param {string} options.token - The email verification token.
   *
   * @returns {Promise<MessageDTO>} A message confirming the verification result.
   */
  async verifyEmail(options: { slug: string; token: string }): Promise<MessageDTO> {
    const { slug, token } = options;
    const url = `${this._baseUrl}/api/${encodeURIComponent(slug)}/verify/${encodeURIComponent(token)}`;
    const method: HttpMethod = HttpMethod.POST;

    const config: RequestInit = {
      method: method,
    };

    const json = await this._fetch({ url, config }) ?? {};
    const dto = MessageDTO.fromJson(json);

    return dto;
  }

  /**
   * Logs out the currently authenticated user.
   *
   * @param {string} options.slug - The `auth`-enabled `collection` slug.
   *
   * @returns {Promise<MessageDTO>} A message confirming the logout.
   */
  async logout(options: { slug: string }): Promise<MessageDTO> {
    const { slug } = options;
    const url = `${this._baseUrl}/api/${encodeURIComponent(slug)}/logout`;
    const method: HttpMethod = HttpMethod.POST;

    const config: RequestInit = {
      method: method,
    };

    const json = await this._fetch({ url, config }) ?? {};
    const dto = MessageDTO.fromJson(json);

    return dto;
  }

  /**
   * Unlocks a user account locked by failed login attempts.
   *
   * @param {string} options.slug - The `auth`-enabled `collection` slug.
   * @param {Json} options.data - The request data (e.g. `{ email }`).
   *
   * @returns {Promise<MessageDTO>} A message confirming the unlock.
   */
  async unlock(options: { slug: string; data: Json }): Promise<MessageDTO> {
    const { slug, data } = options;
    const url = `${this._baseUrl}/api/${encodeURIComponent(slug)}/unlock`;
    const method: HttpMethod = HttpMethod.POST;

    const config: RequestInit = {
      method: method,
      body: JSON.stringify(data),
    };

    const json = await this._fetch({ url, config }) ?? {};
    const dto = MessageDTO.fromJson(json);

    return dto;
  }
}
