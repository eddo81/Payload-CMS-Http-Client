import { QueryBuilder } from '../lib/QueryBuilder.ts';
import { QueryStringEncoder } from '../lib/internal/utils/QueryStringEncoder.ts';
import { QueryParametersMapper } from '../lib/mappers/QueryParametersMapper.ts';
import { Json } from '../lib/types/Json.ts';

import { TestHarness, Normalize } from './TestHarness.ts';


const encoder = new QueryStringEncoder();
const harness = new TestHarness();

harness.add('select() should serialize as comma-separated list', () => {
  const dto = new QueryBuilder()
    .select(['title', 'author'])
    .build();

  const json: Json = QueryParametersMapper.toJson(dto); 
  const actual = encoder.stringify(json);
  const expected = 'select=title,author';

  TestHarness.assertEqual(actual, expected);
});

harness.add('sort() and sortByDescending() should serialize as comma-separated list', () => {
  const dto = new QueryBuilder()
    .sort('date')
    .sortByDescending('title')
    .build();

  const json: Json = QueryParametersMapper.toJson(dto); 
  const actual = encoder.stringify(json);
  const expected = 'sort=date,-title';

  TestHarness.assertEqual(actual, expected);
});

harness.add('populate() should serialize as comma-separated list', () => {
  const dto = new QueryBuilder()
    .populate(['author', 'comments'])
    .build();

  const json: Json = QueryParametersMapper.toJson(dto); 
  const actual = encoder.stringify(json);
  const expected = 'populate=author,comments';

  TestHarness.assertEqual(actual, expected);
});

harness.add('where() with nested OR group should flatten correctly', () => {
  const dto = new QueryBuilder()
    .or(group => {
      group.where('title', 'equals', 'foo')
           .where('title', 'equals', 'bar');
    })
    .build();

  const json: Json = QueryParametersMapper.toJson(dto); 
  const actual = encoder.stringify(json);
  const expected = 'where[or][0][title][equals]=foo&where[or][1][title][equals]=bar';

  TestHarness.assertEqual(actual, expected);
});

harness.add('Mixed logical nesting (AND containing OR) should flatten correctly', () => {
  const dto = new QueryBuilder()
    .and(group => {
      group.where('status', 'equals', 'published')
           .or(inner => {
             inner.where('title', 'equals', 'foo')
                  .where('title', 'equals', 'bar');
           });
    })
    .build();

  const json: Json = QueryParametersMapper.toJson(dto); 
  const actual = encoder.stringify(json);
  const expected = [
    'where[and][0][status][equals]=published',
    'where[and][1][or][0][title][equals]=foo',
    'where[and][1][or][1][title][equals]=bar',
  ].join('&');

  TestHarness.assertEqual(actual, expected);
});

harness.add('Multiple where() calls should merge fields correctly', () => {
  const dto = new QueryBuilder()
    .where('title', 'equals', 'foo')
    .where('status', 'equals', 'published')
    .build();

  const json: Json = QueryParametersMapper.toJson(dto); 
  const actual = encoder.stringify(json);
  const expected = 'where[title][equals]=foo&where[status][equals]=published';

  TestHarness.assertEqual(Normalize(actual), Normalize(expected));
});

harness.add('Or groups should produce correct nested tree', () => {
  const dto = new QueryBuilder()
    .or(group => {
      group.where('title', 'equals', 'foo')
           .where('status', 'equals', 'published');
    })
    .build();

  const json: Json = QueryParametersMapper.toJson(dto);
  const actual = encoder.stringify(json);
  const expected = 'where[or][0][title][equals]=foo&where[or][1][status][equals]=published';
  
  TestHarness.assertEqual(actual, expected);
});

harness.add('QueryBuilder should overwrite where result instead of merging', () => {
  const dto = new QueryBuilder()
    .where('title', 'equals', 'foo')
    .where('title', 'equals', 'bar')
    .build();

  const json: Json = QueryParametersMapper.toJson(dto);
  const actual = encoder.stringify(json);
  const expected = 'where[title][equals]=bar';

  TestHarness.assertEqual(actual, expected);
});

export function testQueryBuilder() {
  console.log('Running QueryBuilder tests...\n');
  harness.run();
}