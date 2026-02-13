import * as lib from '../lib/index.ts';
import { QueryStringEncoder } from '../lib/internal/utils/QueryStringEncoder.ts';
import { TestHarness } from './TestHarness.ts';

const encoder = new QueryStringEncoder({ addQueryPrefix: false });
const harness = new TestHarness();

harness.add('JoinBuilder should produce correct nested object structure', () => {
  const params = new lib.QueryBuilder()
    .join(joinBuilder => { 
      joinBuilder
        .where('posts', 'author', lib.Operator.Equals, 'Alice')
        .sortByDescending('posts', 'title')
        .limit('posts', 1);
    })
    .build();

  const actual = encoder.stringify(params);

  const expected = 'joins[posts][limit]=1&joins[posts][sort]=-title&joins[posts][where][author][equals]=Alice';

  TestHarness.assertEqual(actual, expected);
});

harness.add('JoinBuilder should overwrite duplicate results', () => {
  const params = new lib.QueryBuilder()
    .join(joinBuilder => { 
      joinBuilder
        .where('posts', 'author', lib.Operator.Equals, 'Alice')
        .where('posts', 'author', lib.Operator.Equals, 'Bob');
    })
    .build();

  const actual = encoder.stringify(params);

  const expected = 'joins[posts][where][author][equals]=Bob';

  TestHarness.assertEqual(actual, expected);
});

harness.add('JoinBuilder should omit empty values', () => {
  const params = new lib.QueryBuilder()
    .join(joinBuilder => { 
      joinBuilder
        .sort('posts', '');
    })
    .build();

  const actual = encoder.stringify(params);

  const expected = '';

  TestHarness.assertEqual(actual, expected);
});

harness.add('JoinBuilder should support multiple join fields', () => {
  const params = new lib.QueryBuilder()
    .join(joinBuilder => {
      joinBuilder
        .limit('posts', 5)
        .sort('posts', 'title')
        .count('comments')
        .limit('comments', 10);
    })
    .build();

  const actual = encoder.stringify(params);

  const expected = 'joins[posts][limit]=5&joins[posts][sort]=title&joins[comments][limit]=10&joins[comments][count]=true';

  TestHarness.assertEqual(actual, expected);
});

harness.add('JoinBuilder should ignore invalid operations but keep valid ones', () => {
  const params = new lib.QueryBuilder()
    .join(joinBuilder => {
      joinBuilder
        .sort('posts', '')
        .limit('posts', 3);
    })
    .build();

  const actual = encoder.stringify(params);

  const expected = 'joins[posts][limit]=3';

  TestHarness.assertEqual(actual, expected);
});

harness.add('JoinBuilder should accumulate across multiple join() calls', () => {
  const params = new lib.QueryBuilder()
    .join(joinBuilder => {
      joinBuilder.limit('posts', 2);
    })
    .join(joinBuilder => {
      joinBuilder.sortByDescending('posts', 'title');
    })
    .build();

  const actual = encoder.stringify(params);

  const expected = 'joins[posts][limit]=2&joins[posts][sort]=-title';

  TestHarness.assertEqual(actual, expected);
});

harness.add('JoinBuilder should accumulate multiple where() on different fields', () => {
  const params = new lib.QueryBuilder()
    .join(joinBuilder => {
      joinBuilder
        .where('posts', 'status', lib.Operator.Equals, 'published')
        .where('posts', 'author', lib.Operator.Equals, 'Alice');
    })
    .build();

  const actual = encoder.stringify(params);

  const expected = 'joins[posts][where][status][equals]=published&joins[posts][where][author][equals]=Alice';

  TestHarness.assertEqual(actual, expected);
});

harness.add('JoinBuilder should support nested and() groups', () => {
  const params = new lib.QueryBuilder()
    .join(joinBuilder => {
      joinBuilder.and('posts', group => {
        group
          .where('status', lib.Operator.Equals, 'published')
          .where('author', lib.Operator.Equals, 'Alice');
      });
    })
    .build();

  const actual = encoder.stringify(params);

  const expected = 'joins[posts][where][and][0][status][equals]=published&joins[posts][where][and][1][author][equals]=Alice';

  TestHarness.assertEqual(actual, expected);
});

harness.add('JoinBuilder should support nested or() groups', () => {
  const params = new lib.QueryBuilder()
    .join(joinBuilder => {
      joinBuilder.or('posts', group => {
        group
          .where('author', lib.Operator.Equals, 'Alice')
          .where('author', lib.Operator.Equals, 'Bob');
      });
    })
    .build();

  const actual = encoder.stringify(params);

  const expected = 'joins[posts][where][or][0][author][equals]=Alice&joins[posts][where][or][1][author][equals]=Bob';

  TestHarness.assertEqual(actual, expected);
});

harness.add('JoinBuilder should support complex nested and/or combinations', () => {
  const params = new lib.QueryBuilder()
    .join(joinBuilder => {
      joinBuilder.and('posts', group => {
        group
          .where('status', lib.Operator.Equals, 'published')
          .or(inner => {
            inner
              .where('author', lib.Operator.Equals, 'Alice')
              .where('author', lib.Operator.Equals, 'Bob');
          });
      });
    })
    .build();

  const actual = encoder.stringify(params);

  const expected = 'joins[posts][where][and][0][status][equals]=published&joins[posts][where][and][1][or][0][author][equals]=Alice&joins[posts][where][and][1][or][1][author][equals]=Bob';

  TestHarness.assertEqual(actual, expected);
});

harness.add('JoinBuilder should combine where() with other join operations', () => {
  const params = new lib.QueryBuilder()
    .join(joinBuilder => {
      joinBuilder
        .where('posts', 'status', lib.Operator.Equals, 'published')
        .limit('posts', 5)
        .sort('posts', 'createdAt');
    })
    .build();

  const actual = encoder.stringify(params);

  const expected = 'joins[posts][limit]=5&joins[posts][sort]=createdAt&joins[posts][where][status][equals]=published';

  TestHarness.assertEqual(actual, expected);
});

harness.add('JoinBuilder should accumulate where() and and() on the same join field', () => {
  const params = new lib.QueryBuilder()
    .join(joinBuilder => {
      joinBuilder
        .where('posts', 'status', lib.Operator.Equals, 'published')
        .and('posts', group => {
          group
            .where('rating', lib.Operator.GreaterThan, 3)
            .where('featured', lib.Operator.Equals, true);
        });
    })
    .build();

  const actual = encoder.stringify(params);

  const expected = 'joins[posts][where][status][equals]=published&joins[posts][where][and][0][rating][greater_than]=3&joins[posts][where][and][1][featured][equals]=true';

  TestHarness.assertEqual(actual, expected);
});

export async function testJoinBuilder() {
  await harness.run('Running JoinBuilder tests...\n');
}