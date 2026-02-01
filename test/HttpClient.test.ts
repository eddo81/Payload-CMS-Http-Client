import * as lib from '../lib/index.ts';
import { TestHarness } from './TestHarness.ts';

const harness = new TestHarness();

function getPost() : Promise<void> {
  const baseUrl = 'http://localhost:3000/';
  const httpClient = new lib.HttpClient({ baseUrl: baseUrl });
  const queryBuilder = new lib.QueryBuilder().where('author', 'equals', 'Alice');

  return new Promise<void>(async (resolve) => {
      const docs: lib.PaginatedDocsDTO = await httpClient.find('posts');
      console.dir(docs);

    resolve();
  });
}
 
harness.add('Fetched posts:', getPost);

export async function testHttpClient() {
  console.log('Running HttpClient tests...\n');
  await harness.run();
}
