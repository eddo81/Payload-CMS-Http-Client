import { QueryBuilder } from '../lib/public/QueryBuilder.ts';
import { QueryStringEncoder } from '../lib/internal/utils/QueryStringEncoder.ts';
import { TestHarness, Normalize } from './TestHarness.ts';

const encoder = new QueryStringEncoder({ addQueryPrefix: false });
const harness = new TestHarness();

harness.add('select() should serialize as comma-separated list', () => {
  const params = new QueryBuilder()
    .select(['title', 'author'])
    .build();

  const actual = encoder.stringify(params);
  const expected = 'select=title,author';

  TestHarness.assertEqual(actual, expected);
});

harness.add('sort() and sortByDescending() should serialize as comma-separated list', () => {
  const params = new QueryBuilder()
    .sort('date')
    .sortByDescending('title')
    .build();

  const actual = encoder.stringify(params);
  const expected = 'sort=date,-title';

  TestHarness.assertEqual(actual, expected);
});

harness.add('populate() should serialize as comma-separated list', () => {
  const params = new QueryBuilder()
    .populate(['author', 'comments'])
    .build();

  const actual = encoder.stringify(params);
  const expected = 'populate=author,comments';

  TestHarness.assertEqual(actual, expected);
});

harness.add('where() with nested OR group should flatten correctly', () => {
  const params = new QueryBuilder()
    .or(group => {
      group.where('title', 'equals', 'foo')
           .where('title', 'equals', 'bar');
    })
    .build();

  const actual = encoder.stringify(params);
  const expected = 'where[or][0][title][equals]=foo&where[or][1][title][equals]=bar';

  TestHarness.assertEqual(actual, expected);
});

harness.add('Mixed logical nesting (AND containing OR) should flatten correctly', () => {
  const params = new QueryBuilder()
    .and(group => {
      group.where('status', 'equals', 'published')
           .or(inner => {
             inner.where('title', 'equals', 'foo')
                  .where('title', 'equals', 'bar');
           });
    })
    .build();

  const actual = encoder.stringify(params);
  const expected = [
    'where[and][0][status][equals]=published',
    'where[and][1][or][0][title][equals]=foo',
    'where[and][1][or][1][title][equals]=bar',
  ].join('&');

  TestHarness.assertEqual(actual, expected);
});

harness.add('Multiple where() calls should merge fields correctly', () => {
  const params = new QueryBuilder()
    .where('title', 'equals', 'foo')
    .where('status', 'equals', 'published')
    .build();

  const actual = encoder.stringify(params);
  const expected = 'where[title][equals]=foo&where[status][equals]=published';

  TestHarness.assertEqual(Normalize(actual), Normalize(expected));
});

harness.add('Or groups should produce correct nested tree', () => {
  const params = new QueryBuilder()
    .or(group => {
      group.where('title', 'equals', 'foo')
           .where('status', 'equals', 'published');
    })
    .build();

  const actual = encoder.stringify(params);
  const expected = 'where[or][0][title][equals]=foo&where[or][1][status][equals]=published';
  
  TestHarness.assertEqual(actual, expected);
});

harness.add('QueryBuilder should overwrite where result instead of merging', () => {
  const params = new QueryBuilder()
    .where('title', 'equals', 'foo')
    .where('title', 'equals', 'bar')
    .build();

  const actual = encoder.stringify(params);
  const expected = 'where[title][equals]=bar';

  TestHarness.assertEqual(actual, expected);
});

export async function testQueryBuilder() {
  await harness.run('Running QueryBuilder tests...\n');
}