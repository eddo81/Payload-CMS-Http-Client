import type { Json } from "../types/Json";

/**
 * DocumentDTO
 * 
 * A data transfer object representing a document; a record with a  
 * specific schema defined within Payload CMS.
 */
export class DocumentDTO {
  json: Json = {};
  id: string = '';
  createdAt?: Date = undefined;
  updatedAt?: Date = undefined;
}