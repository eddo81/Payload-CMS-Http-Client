import type { Json } from "../types/Json";

/**
 * DocumentDTO
 * 
 * A data transfer object representing a document; a record with a  
 * specific schema defined within Payload CMS.
 */
export class DocumentDTO {
  private _json: Json;
  id: string;
  createdAt?: Date;
  updatedAt?: Date;

  constructor(json?: Json) {
    const data = (json ?? {}) as Json;

    this._json = data;
    this.id = (typeof data['id'] === 'string') ? data['id'] : '';
    this.createdAt = (typeof data['createdAt'] === 'string' && data['createdAt'] !== '') ? new Date(data['createdAt']) : undefined;
    this.updatedAt = (typeof data['updatedAt'] === 'string' && data['updatedAt'] !== '') ? new Date(data['updatedAt']) : undefined;
  }

  public serialize(): Json {
    return {
      ...this._json,
      id: this.id,
      createdAt: this.createdAt?.toISOString(),
      updatedAt: this.updatedAt?.toISOString()
    };
  }
}