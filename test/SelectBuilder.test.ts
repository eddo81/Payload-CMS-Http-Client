import * as lib from '../index.ts';
import { QueryStringEncoder } from '../internal/utils/QueryStringEncoder.ts';
import { TestHarness } from './TestHarness.ts';

const encoder = new QueryStringEncoder({ addQueryPrefix: false });
const harness = new TestHarness();

harness.add('select() should serialize as bracket notation', () => {
  const params = new lib.QueryBuilder()
    .select({ fields: ['title', 'author'] })
    .build();

  const actual = encoder.stringify({ obj: params });
  const expected = 'select[title]=true&select[author]=true';

  TestHarness.assertEqual(actual, expected);
});

harness.add('select() with dot notation should serialize as nested bracket notation', () => {
  const params = new lib.QueryBuilder()
    .select({ fields: ['title', 'group.number'] })
    .build();

  const actual = encoder.stringify({ obj: params });
  const expected = 'select[title]=true&select[group][number]=true';

  TestHarness.assertEqual(actual, expected);
});

harness.add('select() with sibling nested fields should deep-merge under shared parent', () => {
  const params = new lib.QueryBuilder()
    .select({ fields: ['group.number', 'group.text'] })
    .build();

  const actual = encoder.stringify({ obj: params });
  const expected = 'select[group][number]=true&select[group][text]=true';

  TestHarness.assertEqual(actual, expected);
});

harness.add('exclude() should serialize as false', () => {
  const params = new lib.QueryBuilder()
    .exclude({ fields: ['content'] })
    .build();

  const actual = encoder.stringify({ obj: params });
  const expected = 'select[content]=false';

  TestHarness.assertEqual(actual, expected);
});

harness.add('mixed select() and exclude() should serialize correctly', () => {
  const params = new lib.QueryBuilder()
    .select({ fields: ['title'] })
    .exclude({ fields: ['content'] })
    .build();

  const actual = encoder.stringify({ obj: params });
  const expected = 'select[title]=true&select[content]=false';

  TestHarness.assertEqual(actual, expected);
});

harness.add('no select/exclude calls should produce no output', () => {
  const params = new lib.QueryBuilder()
    .build();

  const actual = encoder.stringify({ obj: params });
  const expected = '';

  TestHarness.assertEqual(actual, expected);
});

harness.add('multiple select() calls should accumulate fields', () => {
  const params = new lib.QueryBuilder()
    .select({ fields: ['title'] })
    .select({ fields: ['author'] })
    .build();

  const actual = encoder.stringify({ obj: params });
  const expected = 'select[title]=true&select[author]=true';

  TestHarness.assertEqual(actual, expected);
});

export async function testSelectBuilder() {
  await harness.run('Running SelectBuilder tests...\n');
}
