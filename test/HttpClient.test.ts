import * as lib from '../lib/index.ts';
import { TestHarness } from './TestHarness.ts';

const harness = new TestHarness();

function createPost(): Promise<void> {
  const baseUrl = 'http://localhost:3000/';
  const httpClient = new lib.HttpClient({ baseUrl: baseUrl });

  const postData = {
    title: 'Foobar',
    published: true,
    tags: [
      { tag: 'Hacked' }
    ],
    // category: ['category-id-here'], // relationship field - uncomment if you have categories
  };

  return new Promise<void>(async (resolve) => {
    const docs: lib.PaginatedDocsDTO = await httpClient.delete({
      slug: 'posts',
      query: new lib.QueryBuilder().or(builder => 
        builder
        .where('author', 'equals', 'Bob')
        .where('author', 'equals', 'Me')
      )
    });

    console.log('Delete post:');
    console.dir(docs, { depth: null });

    resolve();
  });
}
 
harness.add('Create post:', createPost);

export async function testHttpClient() {
  await harness.run('Running HttpClient tests...\n');
}
