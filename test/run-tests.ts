import { testQueryStringEncoder } from './QueryStringEncoder.test.ts';
import { testQueryBuilder } from './QueryBuilder.test.ts';
import { testJoinBuilder } from './JoinBuilder.test.ts';

// Run all test suites
testQueryStringEncoder();
testQueryBuilder();
testJoinBuilder();