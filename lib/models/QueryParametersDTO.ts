import { Json } from "../types/Json";

/**
 * QueryParametersDTO
 * 
 * Data Transfer Object for query parameters used in QueryBuilder.
 */
export class QueryParametersDTO {
  limit?: number;
  page?: number;
  sort?: string;
  depth?: number;
  locale?: string;
  'fallback-locale'?: string;
  select?: string;
  populate?: string;
  where?: Json;
  joins?: Json | false;
}