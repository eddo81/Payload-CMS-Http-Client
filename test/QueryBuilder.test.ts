import * as lib from '../index.ts';
import { QueryStringEncoder } from '../lib/internal/utils/QueryStringEncoder.ts';
import { TestHarness, Normalize } from './TestHarness.ts';

const encoder = new QueryStringEncoder({ addQueryPrefix: false });
const harness = new TestHarness();

harness.add('select() should serialize as comma-separated list', () => {
  const params = new lib.QueryBuilder()
    .select({ fields: ['title', 'author'] })
    .build();

  const actual = encoder.stringify({ obj: params });
  const expected = 'select=title,author';

  TestHarness.assertEqual(actual, expected);
});

harness.add('sort() and sortByDescending() should serialize as comma-separated list', () => {
  const params = new lib.QueryBuilder()
    .sort({ field: 'date' })
    .sortByDescending({ field: 'title' })
    .build();

  const actual = encoder.stringify({ obj: params });
  const expected = 'sort=date,-title';

  TestHarness.assertEqual(actual, expected);
});

harness.add('populate() should serialize as comma-separated list', () => {
  const params = new lib.QueryBuilder()
    .populate({ fields: ['author', 'comments'] })
    .build();

  const actual = encoder.stringify({ obj: params });
  const expected = 'populate=author,comments';

  TestHarness.assertEqual(actual, expected);
});

harness.add('where() with nested OR group should flatten correctly', () => {
  const params = new lib.QueryBuilder()
    .or({ callback: group => {
      group.where({ field: 'title', operator: lib.Operator.Equals, value: 'foo' })
           .where({ field: 'title', operator: lib.Operator.Equals, value: 'bar' });
    }})
    .build();

  const actual = encoder.stringify({ obj: params });
  const expected = 'where[or][0][title][equals]=foo&where[or][1][title][equals]=bar';

  TestHarness.assertEqual(actual, expected);
});

harness.add('Mixed logical nesting (AND containing OR) should flatten correctly', () => {
  const params = new lib.QueryBuilder()
    .and({ callback: group => {
      group.where({ field: 'status', operator: lib.Operator.Equals, value: 'published' })
           .or({ callback: inner => {
             inner.where({ field: 'title', operator: lib.Operator.Equals, value: 'foo' })
                  .where({ field: 'title', operator: lib.Operator.Equals, value: 'bar' });
           }});
    }})
    .build();

  const actual = encoder.stringify({ obj: params });
  const expected = [
    'where[and][0][status][equals]=published',
    'where[and][1][or][0][title][equals]=foo',
    'where[and][1][or][1][title][equals]=bar',
  ].join('&');

  TestHarness.assertEqual(actual, expected);
});

harness.add('Multiple where() calls should merge fields correctly', () => {
  const params = new lib.QueryBuilder()
    .where({ field: 'title', operator: lib.Operator.Equals, value: 'foo' })
    .where({ field: 'status', operator: lib.Operator.Equals, value: 'published' })
    .build();

  const actual = encoder.stringify({ obj: params });
  const expected = 'where[title][equals]=foo&where[status][equals]=published';

  TestHarness.assertEqual(Normalize(actual), Normalize(expected));
});

harness.add('Or groups should produce correct nested tree', () => {
  const params = new lib.QueryBuilder()
    .or({ callback: group => {
      group.where({ field: 'title', operator: lib.Operator.Equals, value: 'foo' })
           .where({ field: 'status', operator: lib.Operator.Equals, value: 'published' });
    }})
    .build();

  const actual = encoder.stringify({ obj: params });
  const expected = 'where[or][0][title][equals]=foo&where[or][1][status][equals]=published';

  TestHarness.assertEqual(actual, expected);
});

harness.add('QueryBuilder should overwrite where result instead of merging', () => {
  const params = new lib.QueryBuilder()
    .where({ field: 'title', operator: lib.Operator.Equals, value: 'foo' })
    .where({ field: 'title', operator: lib.Operator.Equals, value: 'bar' })
    .build();

  const actual = encoder.stringify({ obj: params });
  const expected = 'where[title][equals]=bar';

  TestHarness.assertEqual(actual, expected);
});

export async function testQueryBuilder() {
  await harness.run('Running QueryBuilder tests...\n');
}
