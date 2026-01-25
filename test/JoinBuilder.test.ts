import { QueryBuilder } from '../lib/QueryBuilder.ts';
import { QueryStringEncoder } from '../lib/internal/utils/QueryStringEncoder.ts';
import { TestHarness } from './TestHarness.ts';

const encoder = new QueryStringEncoder();
const harness = new TestHarness();

harness.add('JoinBuilder should produce correct nested object structure', () => {
  const params = new QueryBuilder()
    .join(joinBuilder => { 
      joinBuilder
        .where('posts', 'author', 'equals', 'Alice')
        .sortByDescending('posts', 'title')
        .limit('posts', 1);
    })
    .build();

  const actual = encoder.stringify(params);

  const expected = encoder.stringify({
    joins: {
      posts: {
        where: {
          author: { equals: 'Alice' }
        },
        sort: '-title',
        limit: 1
      },
    }
  });

  TestHarness.assertEqual(actual, expected);
});

harness.add('JoinBuilder should overwrite duplicate results', () => {
  const params = new QueryBuilder()
    .join(joinBuilder => { 
      joinBuilder
        .where('posts', 'author', 'equals', 'Alice')
        .where('posts', 'author', 'equals', 'Bob');
    })
    .build();

  const actual = encoder.stringify(params);

  const expected = encoder.stringify({
    joins: {
      posts: {
        where: {
          author: { equals: 'Bob' }
        }
      },
    }
  });

  TestHarness.assertEqual(actual, expected);
});

harness.add('JoinBuilder should omit empty values', () => {
  const params = new QueryBuilder()
    .join(joinBuilder => { 
      joinBuilder
        .sort('posts', '');
    })
    .build();

  const actual = encoder.stringify(params);

  const expected = encoder.stringify({});

  TestHarness.assertEqual(actual, expected);
});

harness.add('JoinBuilder should support multiple join fields', () => {
  const params = new QueryBuilder()
    .join(joinBuilder => {
      joinBuilder
        .limit('posts', 5)
        .sort('posts', 'title')
        .count('comments')
        .limit('comments', 10);
    })
    .build();

  const actual = encoder.stringify(params);

  const expected = encoder.stringify({
    joins: {
      posts: {
        limit: 5,
        sort: 'title',
      },
      comments: {
        count: true,
        limit: 10,
      }
    }
  });

  TestHarness.assertEqual(actual, expected);
});

harness.add('JoinBuilder should ignore invalid operations but keep valid ones', () => {
  const params = new QueryBuilder()
    .join(joinBuilder => {
      joinBuilder
        .sort('posts', '')
        .limit('posts', 3);
    })
    .build();

  const actual = encoder.stringify(params);

  const expected = encoder.stringify({
    joins: {
      posts: {
        limit: 3
      }
    }
  });

  TestHarness.assertEqual(actual, expected);
});

harness.add('JoinBuilder should accumulate across multiple join() calls', () => {
  const params = new QueryBuilder()
    .join(joinBuilder => {
      joinBuilder.limit('posts', 2);
    })
    .join(joinBuilder => {
      joinBuilder.sortByDescending('posts', 'title');
    })
    .build();

  const actual = encoder.stringify(params);

  const expected = encoder.stringify({
    joins: {
      posts: {
        limit: 2,
        sort: '-title',
      }
    }
  });

  TestHarness.assertEqual(actual, expected);
});

export function testJoinBuilder() {
  console.log('Running JoinBuilder tests...\n');
  harness.run();
}