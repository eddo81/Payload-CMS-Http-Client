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
import { QueryStringEncoder } from "./internal/utils/QueryStringEncoder.js";
import type { IAuthCredential } from "./internal/contracts/IAuthCredential.js";
import type { Json } from "./types/Json";
import type { IFileUpload } from "./internal/contracts/IFileUpload.js";
import { FormDataBuilder } from "./internal/upload/FormDataBuilder.js";
import { HttpMethod } from "./types/HttpMethod.js";

export class HttpClient {
  private _baseUrl: string;
  private _headers: Record<string, string> = {};
  private _auth: IAuthCredential | undefined = undefined;
  private _encoder: QueryStringEncoder = new QueryStringEncoder();

  constructor(options: { baseUrl: string; headers?: Record<string, string>; auth?: IAuthCredential }) {
    this._baseUrl = this._normalizeUrl(options.baseUrl);

    if(options.headers !== undefined) {
      this.setHeaders(options.headers);
    }
    
    if(options.auth !== undefined) {
      this.setAuth(options.auth);
    }
  }

 /**
  * Validates and normalizes a base URL string.
  *
  * Uses the `URL` constructor to reject malformed URLs, then strips
  * any trailing slashes to prevent double-slash paths when building
  * endpoint URLs (e.g. `baseUrl + "/api/..."` ).
  *
  * @param {string} url - The raw base URL to normalize.
  *
  * @returns {string} The normalized URL without a trailing slash.
  *
  * @throws Error if the URL is malformed.
  */
  private _normalizeUrl(url: string): string {
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
  * These headers are merged with the default headers (`Accept` and
  * `Content-Type`) at request time. Any key defined here will
  * override its default counterpart.
  *
  * @param {Record<string, string>} headers - The custom headers to set.
  */
  public setHeaders(headers: Record<string, string>): void {
    this._headers = headers;
  }

 /**
  * Sets or clears the authentication credential used for requests.
  *
  * When set, the credential's `applyTo` method is called at request
  * time to inject the appropriate authorization header.
  *
  * @param {IAuthCredential | undefined} auth - The credential to use, or `undefined` to clear.
  */
  public setAuth(auth?: IAuthCredential | undefined): void {
    this._auth = auth;
  }

 /**
  * Sends a raw HTTP request through the client's pipeline.
  *
  * This is an escape hatch for reaching Payload CMS custom endpoints
  * or any route not covered by the typed methods. The request still
  * benefits from the client's base URL, default headers, authentication,
  * and error handling — but returns raw JSON instead of a DTO.
  *
  * @param options.method - The HTTP method to use.
  * @param options.path - URL path appended to the base URL (e.g. `/api/custom-endpoint`).
  * @param options.body - Optional JSON body to send.
  * @param options.query - Optional QueryBuilder for query parameters.
  *
  * @returns The parsed JSON response, or `undefined` for empty response bodies.
  */
  async request(options: { method: HttpMethod; path: string; body?: Json; query?: QueryBuilder }): Promise<Json | undefined> {
    const { method, path, body, query } = options;
    const url = this._appendQueryString(`${this._baseUrl}${path}`, query);

    const config: RequestInit = { method };

    if (body !== undefined) {
      config.body = JSON.stringify(body);
    }

    return this._fetch(url, config);
  }

 /**
  * Appends a serialized query string to the given URL.
  *
  * If a {@link QueryBuilder} is provided, its built query parameters
  * are encoded using the {@link QueryStringEncoder} and appended
  * to the URL. If no QueryBuilder is provided, the URL is returned
  * unchanged.
  *
  * @param {string} url - The base URL to append query parameters to.
  * @param {QueryBuilder | undefined} queryBuilder - Optional QueryBuilder used to construct query parameters.
  * 
  * @returns {string} The URL with an appended query string, if applicable.
  */
  private _appendQueryString(url: string, queryBuilder?: QueryBuilder): string {
    if(queryBuilder === undefined) {
      return url;
    }

    const params = queryBuilder.build();
    const queryString = this._encoder.stringify(params);
    
    return `${url}${queryString}`;
  }

 /**
  * Executes an HTTP request and returns the parsed JSON response.
  *
  * This method centralizes all fetch-related concerns:
  * - Header merging and default HTTP method handling
  * - Safe JSON parsing (including empty response bodies)
  * - Normalized error handling via {@link PayloadError}
  *
  * Behavior:
  * - If the response body is empty, `undefined` is returned.
  * - If the response body contains JSON, it is parsed and returned.
  * - If the response status is non-2xx, a {@link PayloadError} is thrown with:
  *   - `statusCode` from the response
  *   - The original `Response` object (when available)
  *   - The parsed JSON body attached as `cause` (when present)
  *
  * Error handling:
  * - Network, parsing, and abort errors are normalized into descriptive errors.
  * - Existing {@link PayloadError} instances are rethrown without modification.
  *
  * This method does not perform any Payload-specific decoding — callers are
  * responsible for wrapping the returned JSON into DTOs as appropriate.
  *
  * @param {string} url - Fully resolved request URL.
  * @param {object} config - Optional `fetch` configuration overrides.
  * 
  * @returns {Promise<Json | undefined>} Parsed JSON response, or `undefined` for empty responses.
  * 
  * @throws PayloadError | Error.
  */
  private async _fetch(url: string, config: RequestInit = {}): Promise<Json | undefined> {    
    let response: Response;
    let text: string;
    let json: Json | undefined = undefined;
    let defaultMethod: HttpMethod = 'GET';

    let headers: Record<string, string> = {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...this._headers,
    };

    if (config.body instanceof FormData) {
      delete headers["Content-Type"];
    }

    if (this._auth) {
      this._auth.applyTo(headers);
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
   * Retrieves a paginated list of documents from a collection.
   *
   * @param options.slug - The collection slug.
   * @param options.query - Optional QueryBuilder for filtering, sorting, pagination, etc.
   *
   * @returns A paginated response containing matching documents.
   */
  async find(options: { slug: string; query?: QueryBuilder }): Promise<PaginatedDocsDTO> {
    const { slug, query } = options;
    const url = this._appendQueryString(`${this._baseUrl}/api/${encodeURIComponent(slug)}`, query);
    const json = await this._fetch(url) ?? {};
    const dto = PaginatedDocsDTO.fromJson(json);

    return dto;
  }

  /**
   * Retrieves a single document by its ID.
   *
   * @param options.slug - The collection slug.
   * @param options.id - The document ID.
   * @param options.query - Optional QueryBuilder for depth, locale, etc.
   *
   * @returns The requested document.
   */
  async findById(options: { slug: string; id: string; query?: QueryBuilder }): Promise<DocumentDTO> {
    const { slug, id, query } = options;
    const url = this._appendQueryString(`${this._baseUrl}/api/${encodeURIComponent(slug)}/${encodeURIComponent(id)}`, query);
    const json = await this._fetch(url) ?? {};
    const dto = DocumentDTO.fromJson(json);

    return dto;
  }

  /**
   * Creates a new document in a collection.
   *
   * @param options.slug - The collection slug.
   * @param options.data - The document data to create.
   * @param options.file - Optional file to upload (for upload-enabled collections).
   *
   * @returns The created document.
   */
  async create(options: { slug: string; data: Json; file?: IFileUpload }): Promise<DocumentDTO> {
    const { slug, data, file } = options;
    const url = `${this._baseUrl}/api/${encodeURIComponent(slug)}`;
    const method: HttpMethod = 'POST';

    const config: RequestInit = {
      method: method,
      body: file !== undefined ? FormDataBuilder.build(file, data) : JSON.stringify(data),
    };

    const json = await this._fetch(url, config) ?? {};
    const dto = DocumentDTO.fromJson(json['doc'] as Json ?? {});

    return dto;
  }

  /**
   * Deletes multiple documents matching a query.
   *
   * @param options.slug - The collection slug.
   * @param options.query - QueryBuilder with where clause to select documents.
   *
   * @returns The bulk operation result containing deleted documents.
   */
  async delete(options: { slug: string; query: QueryBuilder }): Promise<PaginatedDocsDTO> {
    const { slug, query } = options;
    const url = this._appendQueryString(`${this._baseUrl}/api/${encodeURIComponent(slug)}`, query);
    const method: HttpMethod = 'DELETE';

    const config: RequestInit = {
      method: method,
    };

    const json = await this._fetch(url, config) ?? {};
    const dto = PaginatedDocsDTO.fromJson(json);

    return dto;
  }

  /**
   * Deletes a single document by its ID.
   *
   * @param options.slug - The collection slug.
   * @param options.id - The document ID.
   *
   * @returns The deleted document.
   */
  async deleteById(options: { slug: string; id: string }): Promise<DocumentDTO> {
    const { slug, id } = options;
    const url = `${this._baseUrl}/api/${encodeURIComponent(slug)}/${encodeURIComponent(id)}`;
    const method: HttpMethod = 'DELETE';

    const config: RequestInit = {
      method: method,
    };

    const json = await this._fetch(url, config) ?? {};
    const dto = DocumentDTO.fromJson(json['doc'] as Json ?? {});

    return dto;
  }

  /**
   * Updates multiple documents matching a query.
   *
   * @param options.slug - The collection slug.
   * @param options.data - The fields to update on all matching documents.
   * @param options.query - QueryBuilder with where clause to select documents.
   * @param options.file - Optional file to upload (for upload-enabled collections).
   *
   * @returns The bulk operation result containing updated documents.
   */
  async update(options: { slug: string; data: Json; query: QueryBuilder; file?: IFileUpload }): Promise<PaginatedDocsDTO> {
    const { slug, data, query, file } = options;
    const url = this._appendQueryString(`${this._baseUrl}/api/${encodeURIComponent(slug)}`, query);
    const method: HttpMethod = 'PATCH';

    const config: RequestInit = {
      method: method,
      body: file !== undefined ? FormDataBuilder.build(file, data) : JSON.stringify(data),
    };

    const json = await this._fetch(url, config) ?? {};
    const dto = PaginatedDocsDTO.fromJson(json);

    return dto;
  }

  /**
   * Updates a single document by its ID.
   *
   * @param options.slug - The collection slug.
   * @param options.id - The document ID.
   * @param options.data - The fields to update.
   * @param options.file - Optional file to upload (for upload-enabled collections).
   *
   * @returns The updated document.
   */
  async updateById(options: { slug: string; id: string; data: Json; file?: IFileUpload }): Promise<DocumentDTO> {
    const { slug, id, data, file } = options;
    const url = `${this._baseUrl}/api/${encodeURIComponent(slug)}/${encodeURIComponent(id)}`;
    const method: HttpMethod = 'PATCH';

    const config: RequestInit = {
      method: method,
      body: file !== undefined ? FormDataBuilder.build(file, data) : JSON.stringify(data),
    };

    const json = await this._fetch(url, config) ?? {};
    const dto = DocumentDTO.fromJson(json['doc'] as Json ?? {});

    return dto;
  }

  /**
   * Retrieves the total count of documents in a collection.
   *
   * @param options.slug - The collection slug.
   * @param options.query - Optional QueryBuilder for filtering (where clause).
   *
   * @returns The total document count.
   */
  async count(options: { slug: string; query?: QueryBuilder }): Promise<number> {
    const { slug, query } = options;
    const url = this._appendQueryString(`${this._baseUrl}/api/${encodeURIComponent(slug)}/count`, query);
    const json = await this._fetch(url) ?? {};
    const dto = TotalDocsDTO.fromJson(json);

    return dto.totalDocs;
  }

  /**
   * Retrieves a global document.
   *
   * @param options.slug - The global slug.
   *
   * @returns The global document.
   */
  async findGlobal(options: { slug: string }): Promise<DocumentDTO> {
    const { slug } = options;
    const url = `${this._baseUrl}/api/globals/${encodeURIComponent(slug)}`;
    const json = await this._fetch(url) ?? {};
    const dto = DocumentDTO.fromJson(json);

    return dto;
  }

  /**
   * Updates a global document.
   *
   * @param options.slug - The global slug.
   * @param options.data - The fields to update.
   *
   * @returns The updated global document.
   */
  async updateGlobal(options: { slug: string; data: Json }): Promise<DocumentDTO> {
    const { slug, data } = options;
    const url = `${this._baseUrl}/api/globals/${encodeURIComponent(slug)}`;
    const method: HttpMethod = 'POST';

    const config: RequestInit = {
      method: method,
      body: JSON.stringify(data),
    };

    const json = await this._fetch(url, config) ?? {};
    const dto = DocumentDTO.fromJson(json['result'] as Json ?? {});

    return dto;
  }

  /**
   * Retrieves a paginated list of versions for a collection document.
   *
   * @param options.slug - The collection slug.
   * @param options.query - Optional QueryBuilder for filtering, sorting, pagination.
   *
   * @returns A paginated response containing version documents.
   */
  async findVersions(options: { slug: string; query?: QueryBuilder }): Promise<PaginatedDocsDTO> {
    const { slug, query } = options;
    const url = this._appendQueryString(`${this._baseUrl}/api/${encodeURIComponent(slug)}/versions`, query);
    const json = await this._fetch(url) ?? {};
    const dto = PaginatedDocsDTO.fromJson(json);

    return dto;
  }

  /**
   * Retrieves a single version document by its ID.
   *
   * @param options.slug - The collection slug.
   * @param options.id - The version ID.
   *
   * @returns The version document.
   */
  async findVersionById(options: { slug: string; id: string }): Promise<DocumentDTO> {
    const { slug, id } = options;
    const url = `${this._baseUrl}/api/${encodeURIComponent(slug)}/versions/${encodeURIComponent(id)}`;
    const json = await this._fetch(url) ?? {};
    const dto = DocumentDTO.fromJson(json);

    return dto;
  }

  /**
   * Restores a collection document to a specific version.
   *
   * @param options.slug - The collection slug.
   * @param options.id - The version ID to restore.
   *
   * @returns The restored document.
   */
  async restoreVersion(options: { slug: string; id: string }): Promise<DocumentDTO> {
    const { slug, id } = options;
    const url = `${this._baseUrl}/api/${encodeURIComponent(slug)}/versions/${encodeURIComponent(id)}`;
    const method: HttpMethod = 'POST'; 
    
    const config: RequestInit = {
      method: method,
    };

    const json = await this._fetch(url, config) ?? {};
    const dto = DocumentDTO.fromJson(json);

    return dto;
  }

  /**
   * Retrieves a paginated list of versions for a global document.
   *
   * @param options.slug - The global slug.
   * @param options.query - Optional QueryBuilder for filtering, sorting, pagination.
   *
   * @returns A paginated response containing version documents.
   */
  async findGlobalVersions(options: { slug: string; query?: QueryBuilder }): Promise<PaginatedDocsDTO> {
    const { slug, query } = options;
    const url = this._appendQueryString(`${this._baseUrl}/api/globals/${encodeURIComponent(slug)}/versions`, query);
    const json = await this._fetch(url) ?? {};
    const dto = PaginatedDocsDTO.fromJson(json);

    return dto;
  }

  /**
   * Retrieves a single global version document by its ID.
   *
   * @param options.slug - The global slug.
   * @param options.id - The version ID.
   *
   * @returns The version document.
   */
  async findGlobalVersionById(options: { slug: string; id: string }): Promise<DocumentDTO> {
    const { slug, id } = options;
    const url = `${this._baseUrl}/api/globals/${encodeURIComponent(slug)}/versions/${encodeURIComponent(id)}`;
    const json = await this._fetch(url) ?? {};
    const dto = DocumentDTO.fromJson(json);

    return dto;
  }

  /**
   * Restores a global document to a specific version.
   *
   * @param options.slug - The global slug.
   * @param options.id - The version ID to restore.
   *
   * @returns The restored document.
   */
  async restoreGlobalVersion(options: { slug: string; id: string }): Promise<DocumentDTO> {
    const { slug, id } = options;
    const url = `${this._baseUrl}/api/globals/${encodeURIComponent(slug)}/versions/${encodeURIComponent(id)}`;
    const method: HttpMethod = 'POST';
    
    const config: RequestInit = {
      method: method,
    };

    const json = await this._fetch(url, config) ?? {};
    const dto = DocumentDTO.fromJson(json['doc'] as Json ?? {});

    return dto;
  }

  /**
   * Authenticates a user and returns a JWT token.
   *
   * @param options.slug - The auth-enabled collection slug.
   * @param options.data - The login credentials (e.g. `{ email, password }`).
   *
   * @returns The login result containing token, expiration, and user document.
   */
  async login(options: { slug: string; data: Json }): Promise<LoginResultDTO> {
    const { slug, data } = options;
    const url = `${this._baseUrl}/api/${encodeURIComponent(slug)}/login`;
    const method: HttpMethod = 'POST';

    const config: RequestInit = {
      method: method,
      body: JSON.stringify(data),
    };

    const json = await this._fetch(url, config) ?? {};
    const dto = LoginResultDTO.fromJson(json);

    return dto;
  }

  /**
   * Retrieves the currently authenticated user.
   *
   * @param options.slug - The auth-enabled collection slug.
   *
   * @returns The current user with optional token and session metadata.
   */
  async me(options: { slug: string }): Promise<MeResultDTO> {
    const { slug } = options;
    const url = `${this._baseUrl}/api/${encodeURIComponent(slug)}/me`;
    const json = await this._fetch(url) ?? {};
    const dto = MeResultDTO.fromJson(json);

    return dto;
  }

  /**
   * Refreshes the current JWT token.
   *
   * @param options.slug - The auth-enabled collection slug.
   *
   * @returns The refresh result containing the new token, expiration, and user document.
   */
  async refreshToken(options: { slug: string }): Promise<RefreshResultDTO> {
    const { slug } = options;
    const url = `${this._baseUrl}/api/${encodeURIComponent(slug)}/refresh-token`;
    const method: HttpMethod = 'POST';

    const config: RequestInit = {
      method: method,
    };

    const json = await this._fetch(url, config) ?? {};
    const dto = RefreshResultDTO.fromJson(json);

    return dto;
  }

  /**
   * Initiates the forgot-password flow.
   *
   * @param options.slug - The auth-enabled collection slug.
   * @param options.data - The request data (e.g. `{ email }`).
   *
   * @returns A message confirming the request was processed.
   */
  async forgotPassword(options: { slug: string; data: Json }): Promise<MessageDTO> {
    const { slug, data } = options;
    const url = `${this._baseUrl}/api/${encodeURIComponent(slug)}/forgot-password`;
    const method: HttpMethod = 'POST';

    const config: RequestInit = {
      method: method,
      body: JSON.stringify(data),
    };

    const json = await this._fetch(url, config) ?? {};
    const dto = MessageDTO.fromJson(json);

    return dto;
  }

  /**
   * Completes a password reset using a reset token.
   *
   * @param options.slug - The auth-enabled collection slug.
   * @param options.data - The reset data (e.g. `{ token, password }`).
   *
   * @returns The result containing the user document and optional new token.
   */
  async resetPassword(options: { slug: string; data: Json }): Promise<ResetPasswordResultDTO> {
    const { slug, data } = options;
    const url = `${this._baseUrl}/api/${encodeURIComponent(slug)}/reset-password`;
    const method: HttpMethod = 'POST';

    const config: RequestInit = {
      method: method,
      body: JSON.stringify(data),
    };

    const json = await this._fetch(url, config) ?? {};
    const dto = ResetPasswordResultDTO.fromJson(json);

    return dto;
  }

  /**
   * Verifies a user's email address using a verification token.
   *
   * @param options.slug - The auth-enabled collection slug.
   * @param options.token - The email verification token.
   *
   * @returns A message confirming the verification result.
   */
  async verifyEmail(options: { slug: string; token: string }): Promise<MessageDTO> {
    const { slug, token } = options;
    const url = `${this._baseUrl}/api/${encodeURIComponent(slug)}/verify/${encodeURIComponent(token)}`;
    const method: HttpMethod = 'POST';

    const config: RequestInit = {
      method: method,
    };

    const json = await this._fetch(url, config) ?? {};
    const dto = MessageDTO.fromJson(json);

    return dto;
  }
}