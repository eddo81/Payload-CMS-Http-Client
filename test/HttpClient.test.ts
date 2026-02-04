import * as lib from '../lib/index.ts';
import { TestHarness } from './TestHarness.ts';

const harness = new TestHarness();

function getPost() : Promise<void> {
  const baseUrl = 'http://localhost:3000/';
  const httpClient = new lib.HttpClient({ baseUrl: baseUrl });
  const queryBuilder = new lib.QueryBuilder()
    .where('id', 'equals', '6935c48f5fb696db32095b0dz');

    //'6935c48f5fb696db32095b0d'

  return new Promise<void>(async (resolve) => {
      const docs: lib.TotalDocsDTO = await httpClient.count({ slug: 'postz', query: queryBuilder });

      console.dir(docs);

    resolve();
  });
}
 
harness.add('Fetched posts:', getPost);

export async function testHttpClient() {
  await harness.run('Running HttpClient tests...\n');
}
