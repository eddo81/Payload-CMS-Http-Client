import { TestHarness, Normalize } from './TestHarness.ts';
import { QueryStringEncoder } from '../lib/internal/utils/QueryStringEncoder.ts';

const harness = new TestHarness();
const encoder = new QueryStringEncoder();

// ---- BASIC TESTS ----

harness.add('Should serialize flat object', () => {
  const params = { limit: 10, page: 2 };
  const queryString = Normalize(encoder.stringify(params));
  const expected = Normalize('?limit=10&page=2');

  TestHarness.assertEqual(queryString, expected);
});

harness.add('Should encode nested objects', () => {
  const params = { nested: { key: 'value' } };
  const queryString = encoder.stringify(params);
  const expected = '?nested[key]=value';

  TestHarness.assertEqual(queryString, expected);
});

harness.add('Should encode arrays with indices', () => {
  const params = { items: ['a', 'b'] };
  const queryString = Normalize(encoder.stringify(params));
  const expected = Normalize('?items[0]=a&items[1]=b');

  TestHarness.assertEqual(queryString, expected);
});

harness.add('Should encode special characters in keys and values', () => {
  const params = { 'spaced key': 'hello world' };
  const queryString = encoder.stringify(params);
  const expected = '?spaced%20key=hello%20world';

  TestHarness.assertEqual(queryString, expected);
});

harness.add('Should encode Date values as ISO strings', () => {
  const date = new Date('2024-01-01T12:00:00Z');
  const params = { createdAt: date };
  const queryString = encoder.stringify(params);
  const expected = `?createdAt=2024-01-01T12%3A00%3A00.000Z`;

  TestHarness.assertEqual(queryString, expected);
});

harness.add('Should skip null and undefined values', () => {
  const params = { keep: 'yes', skip: null as any, alsoSkip: undefined };
  const queryString = encoder.stringify(params);
  const expected = '?keep=yes';

  TestHarness.assertEqual(queryString, expected);
});

harness.add('Should skip unsupported types (symbol, bigint, function)', () => {
  const params = {
    ok: 'fine',
    nope: Symbol('x') as any,
    large: BigInt(42) as any,
    fn: (() => {}) as any
  };
  const queryString = encoder.stringify(params);
  const expected = '?ok=fine';

  TestHarness.assertEqual(queryString, expected);
});

harness.add('Should return empty string for empty object', () => {
  const params = {};
  const queryString = encoder.stringify(params);
  const expected = '';

  TestHarness.assertEqual(queryString, expected);
});

export function testQueryStringEncoder() {
  console.log('Running QueryStringEncoder tests...\n');
  harness.run();
}
