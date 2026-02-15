import * as lib from '../index.ts';
import { QueryStringEncoder } from '../lib/internal/utils/QueryStringEncoder.ts';
import { TestHarness } from './TestHarness.ts';

const encoder = new QueryStringEncoder({ addQueryPrefix: false });
const harness = new TestHarness();

harness.add('JoinBuilder should produce correct nested object structure', () => {
  const params = new lib.QueryBuilder()
    .join({ callback: joinBuilder => {
      joinBuilder
        .where({ on: 'posts', field: 'author', operator: lib.Operator.Equals, value: 'Alice' })
        .sortByDescending({ on: 'posts', field: 'title' })
        .limit({ on: 'posts', value: 1 });
    }})
    .build();

  const actual = encoder.stringify({ obj: params });

  const expected = 'joins[posts][limit]=1&joins[posts][sort]=-title&joins[posts][where][author][equals]=Alice';

  TestHarness.assertEqual(actual, expected);
});

harness.add('JoinBuilder should overwrite duplicate results', () => {
  const params = new lib.QueryBuilder()
    .join({ callback: joinBuilder => {
      joinBuilder
        .where({ on: 'posts', field: 'author', operator: lib.Operator.Equals, value: 'Alice' })
        .where({ on: 'posts', field: 'author', operator: lib.Operator.Equals, value: 'Bob' });
    }})
    .build();

  const actual = encoder.stringify({ obj: params });

  const expected = 'joins[posts][where][author][equals]=Bob';

  TestHarness.assertEqual(actual, expected);
});

harness.add('JoinBuilder should omit empty values', () => {
  const params = new lib.QueryBuilder()
    .join({ callback: joinBuilder => {
      joinBuilder
        .sort({ on: 'posts', field: '' });
    }})
    .build();

  const actual = encoder.stringify({ obj: params });

  const expected = '';

  TestHarness.assertEqual(actual, expected);
});

harness.add('JoinBuilder should support multiple join fields', () => {
  const params = new lib.QueryBuilder()
    .join({ callback: joinBuilder => {
      joinBuilder
        .limit({ on: 'posts', value: 5 })
        .sort({ on: 'posts', field: 'title' })
        .count({ on: 'comments' })
        .limit({ on: 'comments', value: 10 });
    }})
    .build();

  const actual = encoder.stringify({ obj: params });

  const expected = 'joins[posts][limit]=5&joins[posts][sort]=title&joins[comments][limit]=10&joins[comments][count]=true';

  TestHarness.assertEqual(actual, expected);
});

harness.add('JoinBuilder should ignore invalid operations but keep valid ones', () => {
  const params = new lib.QueryBuilder()
    .join({ callback: joinBuilder => {
      joinBuilder
        .sort({ on: 'posts', field: '' })
        .limit({ on: 'posts', value: 3 });
    }})
    .build();

  const actual = encoder.stringify({ obj: params });

  const expected = 'joins[posts][limit]=3';

  TestHarness.assertEqual(actual, expected);
});

harness.add('JoinBuilder should accumulate across multiple join() calls', () => {
  const params = new lib.QueryBuilder()
    .join({ callback: joinBuilder => {
      joinBuilder.limit({ on: 'posts', value: 2 });
    }})
    .join({ callback: joinBuilder => {
      joinBuilder.sortByDescending({ on: 'posts', field: 'title' });
    }})
    .build();

  const actual = encoder.stringify({ obj: params });

  const expected = 'joins[posts][limit]=2&joins[posts][sort]=-title';

  TestHarness.assertEqual(actual, expected);
});

harness.add('JoinBuilder should accumulate multiple where() on different fields', () => {
  const params = new lib.QueryBuilder()
    .join({ callback: joinBuilder => {
      joinBuilder
        .where({ on: 'posts', field: 'status', operator: lib.Operator.Equals, value: 'published' })
        .where({ on: 'posts', field: 'author', operator: lib.Operator.Equals, value: 'Alice' });
    }})
    .build();

  const actual = encoder.stringify({ obj: params });

  const expected = 'joins[posts][where][status][equals]=published&joins[posts][where][author][equals]=Alice';

  TestHarness.assertEqual(actual, expected);
});

harness.add('JoinBuilder should support nested and() groups', () => {
  const params = new lib.QueryBuilder()
    .join({ callback: joinBuilder => {
      joinBuilder.and({ on: 'posts', callback: group => {
        group
          .where({ field: 'status', operator: lib.Operator.Equals, value: 'published' })
          .where({ field: 'author', operator: lib.Operator.Equals, value: 'Alice' });
      }});
    }})
    .build();

  const actual = encoder.stringify({ obj: params });

  const expected = 'joins[posts][where][and][0][status][equals]=published&joins[posts][where][and][1][author][equals]=Alice';

  TestHarness.assertEqual(actual, expected);
});

harness.add('JoinBuilder should support nested or() groups', () => {
  const params = new lib.QueryBuilder()
    .join({ callback: joinBuilder => {
      joinBuilder.or({ on: 'posts', callback: group => {
        group
          .where({ field: 'author', operator: lib.Operator.Equals, value: 'Alice' })
          .where({ field: 'author', operator: lib.Operator.Equals, value: 'Bob' });
      }});
    }})
    .build();

  const actual = encoder.stringify({ obj: params });

  const expected = 'joins[posts][where][or][0][author][equals]=Alice&joins[posts][where][or][1][author][equals]=Bob';

  TestHarness.assertEqual(actual, expected);
});

harness.add('JoinBuilder should support complex nested and/or combinations', () => {
  const params = new lib.QueryBuilder()
    .join({ callback: joinBuilder => {
      joinBuilder.and({ on: 'posts', callback: group => {
        group
          .where({ field: 'status', operator: lib.Operator.Equals, value: 'published' })
          .or({ callback: inner => {
            inner
              .where({ field: 'author', operator: lib.Operator.Equals, value: 'Alice' })
              .where({ field: 'author', operator: lib.Operator.Equals, value: 'Bob' });
          }});
      }});
    }})
    .build();

  const actual = encoder.stringify({ obj: params });

  const expected = 'joins[posts][where][and][0][status][equals]=published&joins[posts][where][and][1][or][0][author][equals]=Alice&joins[posts][where][and][1][or][1][author][equals]=Bob';

  TestHarness.assertEqual(actual, expected);
});

harness.add('JoinBuilder should combine where() with other join operations', () => {
  const params = new lib.QueryBuilder()
    .join({ callback: joinBuilder => {
      joinBuilder
        .where({ on: 'posts', field: 'status', operator: lib.Operator.Equals, value: 'published' })
        .limit({ on: 'posts', value: 5 })
        .sort({ on: 'posts', field: 'createdAt' });
    }})
    .build();

  const actual = encoder.stringify({ obj: params });

  const expected = 'joins[posts][limit]=5&joins[posts][sort]=createdAt&joins[posts][where][status][equals]=published';

  TestHarness.assertEqual(actual, expected);
});

harness.add('JoinBuilder should accumulate where() and and() on the same join field', () => {
  const params = new lib.QueryBuilder()
    .join({ callback: joinBuilder => {
      joinBuilder
        .where({ on: 'posts', field: 'status', operator: lib.Operator.Equals, value: 'published' })
        .and({ on: 'posts', callback: group => {
          group
            .where({ field: 'rating', operator: lib.Operator.GreaterThan, value: 3 })
            .where({ field: 'featured', operator: lib.Operator.Equals, value: true });
        }});
    }})
    .build();

  const actual = encoder.stringify({ obj: params });

  const expected = 'joins[posts][where][status][equals]=published&joins[posts][where][and][0][rating][greater_than]=3&joins[posts][where][and][1][featured][equals]=true';

  TestHarness.assertEqual(actual, expected);
});

export async function testJoinBuilder() {
  await harness.run('Running JoinBuilder tests...\n');
}
