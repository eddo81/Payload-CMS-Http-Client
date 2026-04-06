import { testQueryStringEncoder } from './QueryStringEncoder.test.ts';
import { testQueryBuilder } from './QueryBuilder.test.ts';
import { testSelectBuilder } from './SelectBuilder.test.ts';
import { testJoinBuilder } from './JoinBuilder.test.ts';
import { testApiKeyAuth } from './ApiKeyAuth.test.ts';
import { testPayloadError } from './PayloadError.test.ts';

// Run all test suites sequentially
async function main() {
  await testQueryStringEncoder();
  await testQueryBuilder();
  await testSelectBuilder();
  await testJoinBuilder();
  await testApiKeyAuth();
  await testPayloadError();
}

main();