import { PaginatedDocsDTO } from "./models/PaginatedDocsDTO.js";
import { DocumentDTO } from "./models/DocumentDTO.js";
import { PayloadError } from "./PayloadError.js";
import { QueryBuilder } from "./QueryBuilder.js";
import { QueryStringEncoder } from "./internal/utils/QueryStringEncoder.js";
import type { HttpClientConfig } from "./config/HttpClientConfig.js";
import type { IAuthCredential } from "./internal/contracts/IAuthCredential.js";
import type { Json } from "./types/Json";

export class HttpClient {
  private _baseUrl: string;
  private _headers: Record<string, string>;
  private _auth: IAuthCredential | undefined = undefined;
  private _encoder: QueryStringEncoder = new QueryStringEncoder();

  constructor(config: HttpClientConfig) {
    try {
      this._baseUrl = new URL(config.baseUrl).toString();
    }
    catch (error) {
      throw new Error(`[PayloadError] Invalid base URL: ${config.baseUrl}`, { cause: error });
    }

    this._headers = {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(config.headers ?? {}),
    };

    if (config.auth) {
      this._auth = config.auth;
      this._auth.applyTo(this._headers);
    }
  }

  set headers(headers: Record<string, string>) {
    this._headers = {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...headers,
    };

    this._syncAuth();
  }

  set auth(auth: IAuthCredential | undefined) {
    this._auth = auth;

    this._syncAuth();
  }

  /**
   * Synchronizes the `Authorization` header with the current
   * authentication credential.
   *
   * - If a credential is set, delegates to its `applyTo` method.
   * - If no credential is set, removes the `Authorization` header.
   */
  private _syncAuth(): void {
    if (this._auth) {
      this._auth.applyTo(this._headers);
    }
    else {
      delete this._headers["Authorization"];
    }
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

    const _config: RequestInit = {
      method: 'GET',
      ...config,
      headers: {
        ...this._headers,
        ...(config.headers ?? {}),
      },
    };

    try {
      response = await fetch(url, _config);
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

  async find(slug: string, queryBuilder?: QueryBuilder): Promise<PaginatedDocsDTO> {
    const url = this._appendQueryString(`${this._baseUrl}/api/${encodeURIComponent(slug)}`, queryBuilder);
    const json = await this._fetch(url) ?? {};
    const dto = PaginatedDocsDTO.fromJson(json);
    
    return dto;
  }

  async findById(slug: string, id: string, queryBuilder?: QueryBuilder): Promise<DocumentDTO> {
    const url = this._appendQueryString(`${this._baseUrl}/api/${encodeURIComponent(slug)}/${encodeURIComponent(id)}`, queryBuilder);
    const json = await this._fetch(url) ?? {};
    const dto = DocumentDTO.fromJson(json);
    
    return dto;
  }

  async create(slug: string): Promise<DocumentDTO> {
    // TODO
    throw new Error('not implemented');
  }

  async delete(slug: string): Promise<PaginatedDocsDTO> {
    // TODO
    throw new Error('not implemented');
  }

  async deleteById(slug: string): Promise<PaginatedDocsDTO> {
    // TODO
    throw new Error('not implemented');
  }

  async update(slug: string): Promise<DocumentDTO> {
    // TODO
    throw new Error('not implemented');
  }

  async updateById(slug: string): Promise<DocumentDTO> {
    // TODO
    throw new Error('not implemented');
  }

  async updateGlobal(slug: string): Promise<DocumentDTO> {
    // TODO
    throw new Error('not implemented');
  }
}