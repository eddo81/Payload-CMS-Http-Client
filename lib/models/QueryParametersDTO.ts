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
  where?: Record<string, unknown>;
  joins?: Record<string, unknown> | false;
}