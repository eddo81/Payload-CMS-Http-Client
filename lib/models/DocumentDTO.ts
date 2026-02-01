import type { Json } from "../types/Json";

/**
 * DocumentDTO
 *
 * A data transfer object representing a document; a record with a
 * specific schema defined within Payload CMS.
 *
 * The `json` field retains the full raw response, including `id`,
 * `createdAt`, and `updatedAt`. This intentional redundancy ensures
 * that all user-defined fields remain accessible without the DTO
 * needing to model every possible schema.
 */
export class DocumentDTO {
  json: Json = {};
  id: string = '';
  createdAt?: Date = undefined;
  updatedAt?: Date = undefined;
}