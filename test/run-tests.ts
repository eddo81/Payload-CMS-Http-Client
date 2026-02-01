import { testQueryStringEncoder } from './QueryStringEncoder.test.ts';
import { testQueryBuilder } from './QueryBuilder.test.ts';
import { testJoinBuilder } from './JoinBuilder.test.ts';
import { testApiKeyAuth } from './ApiKeyAuth.test.ts';

// Run all test suites
testQueryStringEncoder();
testQueryBuilder();
testJoinBuilder();
testApiKeyAuth();