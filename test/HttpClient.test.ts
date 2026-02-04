import * as lib from '../lib/index.ts';
import { TestHarness } from './TestHarness.ts';

const harness = new TestHarness();

function getPost() : Promise<void> {
  const baseUrl = 'http://localhost:3000/';
  const httpClient = new lib.HttpClient({ baseUrl: baseUrl });
  const queryBuilder = new lib.QueryBuilder()
    .where('author', 'equals', 'Alice')
    .or(group => {
      group
        .where('title', 'contains', 'Deckbuilding')
        .where('title', 'contains', 'Gloomhaven');
    });

  return new Promise<void>(async (resolve) => {
      const docs: lib.PaginatedDocsDTO = await httpClient.find('posts', queryBuilder);
      console.dir(docs);

      for (const doc of docs.docs) {
        console.log(`Post id: ${doc.id}}`);
      }

    resolve();
  });
}
 
harness.add('Fetched posts:', getPost);

export async function testHttpClient() {
  await harness.run('Running HttpClient tests...\n');
}
