import * as lib from '../index.ts';
import { TestHarness } from './TestHarness.ts';

const harness = new TestHarness();

const BASE_URL = 'http://localhost:3000/';
const TEST_EMAIL = 'claude@outlook.com';
const TEST_PASSWORD = '123456789';
const TEST_API_KEY = '96d1c330-f9eb-4a30-89c3-be1c180c16d6';

// Shared state across sequential tests
let createdPostId: string = '';
let createdMediaId: string = '';
let versionId: string = '';
let loginToken: string = '';

// ── CRUD Tests (posts) ─────────────────────────────────────────

harness.add('create() should create a post and return DocumentDTO', async () => {
  const client = new lib.HttpClient({ baseUrl: BASE_URL });

  const result = await client.create({
    slug: 'posts',
    data: { title: 'Integration Test Post', content: 'Hello from tests', published: true },
  });

  TestHarness.assertTrue(result.id !== '');
  TestHarness.assertEqual(result.json['title'], 'Integration Test Post');
  TestHarness.assertEqual(result.json['content'], 'Hello from tests');
  TestHarness.assertEqual(result.json['published'], true);

  createdPostId = result.id;
});

harness.add('findById() should retrieve the created post', async () => {
  const client = new lib.HttpClient({ baseUrl: BASE_URL });

  const result = await client.findById({ slug: 'posts', id: createdPostId });

  TestHarness.assertEqual(result.id, createdPostId);
  TestHarness.assertEqual(result.json['title'], 'Integration Test Post');
});

harness.add('find() should return a paginated list containing the post', async () => {
  const client = new lib.HttpClient({ baseUrl: BASE_URL });

  const result = await client.find({
    slug: 'posts',
    query: new lib.QueryBuilder().where({ field: 'title', operator: lib.Operator.Equals, value: 'Integration Test Post' }),
  });

  TestHarness.assertTrue(result.totalDocs >= 1);
  TestHarness.assertTrue(result.docs.length >= 1);
  TestHarness.assertEqual(result.docs[0].json['title'], 'Integration Test Post');
});

harness.add('count() should return the correct document count', async () => {
  const client = new lib.HttpClient({ baseUrl: BASE_URL });

  const total = await client.count({
    slug: 'posts',
    query: new lib.QueryBuilder().where({ field: 'title', operator: lib.Operator.Equals, value: 'Integration Test Post' }),
  });

  TestHarness.assertTrue(total >= 1);
});

// ── QueryBuilder Integration Tests ──────────────────────────────

harness.add('find() with limit should constrain returned documents', async () => {
  const client = new lib.HttpClient({ baseUrl: BASE_URL });

  const result = await client.find({
    slug: 'posts',
    query: new lib.QueryBuilder().limit({ value: 1 }),
  });

  TestHarness.assertEqual(result.limit, 1);
  TestHarness.assertTrue(result.docs.length <= 1);
});

harness.add('find() with page should return the specified page', async () => {
  const client = new lib.HttpClient({ baseUrl: BASE_URL });

  const result = await client.find({
    slug: 'posts',
    query: new lib.QueryBuilder().limit({ value: 1 }).page({ value: 1 }),
  });

  TestHarness.assertEqual(result.page, 1);
  TestHarness.assertEqual(result.limit, 1);
});

harness.add('find() with sort should accept sort parameter', async () => {
  const client = new lib.HttpClient({ baseUrl: BASE_URL });

  const result = await client.find({
    slug: 'posts',
    query: new lib.QueryBuilder().sortByDescending({ field: 'createdAt' }),
  });

  TestHarness.assertTrue(result.docs.length >= 1);
});

// ── CRUD Tests (continued) ──────────────────────────────────────

harness.add('updateById() should update a single post', async () => {
  const client = new lib.HttpClient({ baseUrl: BASE_URL });

  const result = await client.updateById({
    slug: 'posts',
    id: createdPostId,
    data: { content: 'Updated content' },
  });

  TestHarness.assertEqual(result.id, createdPostId);
  TestHarness.assertEqual(result.json['content'], 'Updated content');
  TestHarness.assertEqual(result.json['title'], 'Integration Test Post');
});

harness.add('update() bulk should update matching posts', async () => {
  const client = new lib.HttpClient({ baseUrl: BASE_URL });

  const result = await client.update({
    slug: 'posts',
    data: { published: false },
    query: new lib.QueryBuilder().where({ field: 'title', operator: lib.Operator.Equals, value: 'Integration Test Post' }),
  });

  TestHarness.assertTrue(result.docs.length >= 1);
  TestHarness.assertEqual(result.docs[0].json['published'], false);
});

// ── Version Tests (posts) ──────────────────────────────────────

harness.add('findVersions() should return versions for the post collection', async () => {
  const client = new lib.HttpClient({ baseUrl: BASE_URL });

  const result = await client.findVersions({
    slug: 'posts',
    query: new lib.QueryBuilder().where({ field: 'parent', operator: lib.Operator.Equals, value: createdPostId }),
  });

  TestHarness.assertTrue(result.totalDocs >= 1);
  TestHarness.assertTrue(result.docs.length >= 1);

  versionId = result.docs[0].id;
});

harness.add('findVersionById() should return a specific version', async () => {
  const client = new lib.HttpClient({ baseUrl: BASE_URL });

  const result = await client.findVersionById({ slug: 'posts', id: versionId });

  TestHarness.assertTrue(result.id !== '');
  TestHarness.assertEqual(result.id, versionId);
});

harness.add('restoreVersion() should restore a post to a previous version', async () => {
  const client = new lib.HttpClient({ baseUrl: BASE_URL });

  const result = await client.restoreVersion({ slug: 'posts', id: versionId });

  TestHarness.assertTrue(result.json !== undefined);
});

// ── Global Tests (site-settings) ───────────────────────────────

harness.add('updateGlobal() should update the site settings', async () => {
  const client = new lib.HttpClient({ baseUrl: BASE_URL });

  const result = await client.updateGlobal({
    slug: 'site-settings',
    data: { siteName: 'Test Site', description: 'A test site for integration tests' },
  });

  TestHarness.assertEqual(result.json['siteName'], 'Test Site');
  TestHarness.assertEqual(result.json['description'], 'A test site for integration tests');
});

harness.add('findGlobal() should retrieve the site settings', async () => {
  const client = new lib.HttpClient({ baseUrl: BASE_URL });

  const result = await client.findGlobal({ slug: 'site-settings' });

  TestHarness.assertEqual(result.json['siteName'], 'Test Site');
  TestHarness.assertEqual(result.json['description'], 'A test site for integration tests');
});

// ── Global Version Tests (site-settings) ───────────────────────

let globalVersionId: string = '';

harness.add('findGlobalVersions() should return versions for site-settings', async () => {
  const client = new lib.HttpClient({ baseUrl: BASE_URL });

  // Update again to ensure we have at least one version
  await client.updateGlobal({
    slug: 'site-settings',
    data: { siteName: 'Test Site v2' },
  });

  const result = await client.findGlobalVersions({ slug: 'site-settings' });

  TestHarness.assertTrue(result.totalDocs >= 1);
  TestHarness.assertTrue(result.docs.length >= 1);

  globalVersionId = result.docs[0].id;
});

harness.add('findGlobalVersionById() should return a specific global version', async () => {
  const client = new lib.HttpClient({ baseUrl: BASE_URL });

  const result = await client.findGlobalVersionById({ slug: 'site-settings', id: globalVersionId });

  TestHarness.assertTrue(result.id !== '');
  TestHarness.assertEqual(result.id, globalVersionId);
});

harness.add('restoreGlobalVersion() should restore site-settings to a previous version', async () => {
  const client = new lib.HttpClient({ baseUrl: BASE_URL });

  const result = await client.restoreGlobalVersion({ slug: 'site-settings', id: globalVersionId });

  TestHarness.assertTrue(result.json !== undefined);
});

// ── Auth Tests (users) ─────────────────────────────────────────

harness.add('login() should authenticate and return a token', async () => {
  const client = new lib.HttpClient({ baseUrl: BASE_URL });

  const result = await client.login({
    slug: 'users',
    data: { email: TEST_EMAIL, password: TEST_PASSWORD },
  });

  TestHarness.assertTrue(result.token !== '');
  TestHarness.assertTrue(result.exp > 0);
  TestHarness.assertTrue(result.user.id !== '');
  TestHarness.assertEqual(result.user.json['email'], TEST_EMAIL);
  TestHarness.assertTrue(result.message !== '');

  loginToken = result.token;
});

harness.add('me() should return the authenticated user', async () => {
  const client = new lib.HttpClient({
    baseUrl: BASE_URL,
    auth: new lib.JwtAuth({ token: loginToken }),
  });

  const result = await client.me({ slug: 'users' });

  TestHarness.assertTrue(result.user.id !== '');
  TestHarness.assertEqual(result.user.json['email'], TEST_EMAIL);
  TestHarness.assertEqual(result.collection, 'users');
});

harness.add('refreshToken() should return a new token', async () => {
  const client = new lib.HttpClient({
    baseUrl: BASE_URL,
    auth: new lib.JwtAuth({ token: loginToken }),
  });

  const result = await client.refreshToken({ slug: 'users' });

  TestHarness.assertTrue(result.refreshedToken !== '');
  TestHarness.assertTrue(result.exp > 0);
  TestHarness.assertTrue(result.user.id !== '');
});

harness.add('forgotPassword() should return a message', async () => {
  const client = new lib.HttpClient({ baseUrl: BASE_URL });

  const result = await client.forgotPassword({
    slug: 'users',
    data: { email: TEST_EMAIL },
  });

  TestHarness.assertTrue(result.message !== '');
});

harness.add('logout() should return a message', async () => {
  const client = new lib.HttpClient({ baseUrl: BASE_URL });

  // Login first to get a valid session
  const loginResult = await client.login({
    slug: 'users',
    data: { email: TEST_EMAIL, password: TEST_PASSWORD },
  });

  client.setAuth({ auth: new lib.JwtAuth({ token: loginResult.token }) });

  const result = await client.logout({ slug: 'users' });

  TestHarness.assertTrue(result.message !== '');
});

harness.add('unlock() should return a message', async () => {
  const client = new lib.HttpClient({ baseUrl: BASE_URL });

  const result = await client.unlock({
    slug: 'users',
    data: { email: TEST_EMAIL },
  });

  TestHarness.assertTrue(result.message !== '');
});

harness.add('me() without auth should return an empty user', async () => {
  const client = new lib.HttpClient({ baseUrl: BASE_URL });

  const result = await client.me({ slug: 'users' });

  // Payload returns 200 with { user: null } when unauthenticated
  TestHarness.assertEqual(result.user.id, '');
});

harness.add('refreshToken() without auth should throw PayloadError', async () => {
  const client = new lib.HttpClient({ baseUrl: BASE_URL });
  let caught: lib.PayloadError | undefined;

  try {
    await client.refreshToken({ slug: 'users' });
  } catch (error) {
    if (error instanceof lib.PayloadError) {
      caught = error;
    }
  }

  TestHarness.assertTrue(caught !== undefined);
  TestHarness.assertTrue(caught!.statusCode >= 400);
});

harness.add('setAuth() should enable auth after construction', async () => {
  const client = new lib.HttpClient({ baseUrl: BASE_URL });

  // Without auth, me() returns an empty user
  const before = await client.me({ slug: 'users' });
  TestHarness.assertEqual(before.user.id, '');

  // After setting auth, me() returns the authenticated user
  client.setAuth({ auth: new lib.JwtAuth({ token: loginToken }) });
  const after = await client.me({ slug: 'users' });

  TestHarness.assertTrue(after.user.id !== '');
  TestHarness.assertEqual(after.user.json['email'], TEST_EMAIL);
});

// ── Error Path Tests ────────────────────────────────────────────

harness.add('login() with invalid credentials should throw PayloadError', async () => {
  const client = new lib.HttpClient({ baseUrl: BASE_URL });
  let threw = false;

  try {
    await client.login({
      slug: 'users',
      data: { email: TEST_EMAIL, password: 'wrong-password' },
    });
  } catch (error) {
    threw = true;
    TestHarness.assertTrue(error instanceof lib.PayloadError);
  }

  TestHarness.assertTrue(threw);
});

harness.add('findById() with non-existent ID should throw PayloadError', async () => {
  const client = new lib.HttpClient({ baseUrl: BASE_URL });
  let caught: lib.PayloadError | undefined;

  try {
    await client.findById({ slug: 'posts', id: '000000000000000000000000' });
  } catch (error) {
    if (error instanceof lib.PayloadError) {
      caught = error;
    }
  }

  TestHarness.assertTrue(caught !== undefined);
});

harness.add('updateById() with non-existent ID should throw PayloadError', async () => {
  const client = new lib.HttpClient({ baseUrl: BASE_URL });
  let caught: lib.PayloadError | undefined;

  try {
    await client.updateById({ slug: 'posts', id: '000000000000000000000000', data: { title: 'x' } });
  } catch (error) {
    if (error instanceof lib.PayloadError) {
      caught = error;
    }
  }

  TestHarness.assertTrue(caught !== undefined);
});

harness.add('deleteById() with non-existent ID should throw PayloadError', async () => {
  const client = new lib.HttpClient({ baseUrl: BASE_URL });
  let caught: lib.PayloadError | undefined;

  try {
    await client.deleteById({ slug: 'posts', id: '000000000000000000000000' });
  } catch (error) {
    if (error instanceof lib.PayloadError) {
      caught = error;
    }
  }

  TestHarness.assertTrue(caught !== undefined);
});

harness.add('PayloadError should expose statusCode and cause from failed request', async () => {
  const client = new lib.HttpClient({ baseUrl: BASE_URL });
  let caught: lib.PayloadError | undefined;

  try {
    await client.login({
      slug: 'users',
      data: { email: 'nobody@example.com', password: 'wrong' },
    });
  } catch (error) {
    if (error instanceof lib.PayloadError) {
      caught = error;
    }
  }

  TestHarness.assertTrue(caught !== undefined);
  TestHarness.assertTrue(caught!.statusCode >= 400);
  TestHarness.assertTrue(caught!.cause !== undefined);
});

// ── ApiKeyAuth Tests ────────────────────────────────────────────

harness.add('ApiKeyAuth should authenticate and allow creating a post', async () => {
  const client = new lib.HttpClient({
    baseUrl: BASE_URL,
    auth: new lib.ApiKeyAuth({ collectionSlug: 'users', apiKey: TEST_API_KEY }),
  });

  const result = await client.create({
    slug: 'posts',
    data: { title: 'ApiKey Test Post', content: 'Created with API key auth' },
  });

  TestHarness.assertTrue(result.id !== '');
  TestHarness.assertEqual(result.json['title'], 'ApiKey Test Post');
});

harness.add('ApiKeyAuth should authenticate and allow reading via me()', async () => {
  const client = new lib.HttpClient({
    baseUrl: BASE_URL,
    auth: new lib.ApiKeyAuth({ collectionSlug: 'users', apiKey: TEST_API_KEY }),
  });

  const result = await client.me({ slug: 'users' });

  TestHarness.assertTrue(result.user.id !== '');
  TestHarness.assertEqual(result.user.json['email'], TEST_EMAIL);
});

// ── File Upload Tests (media) ──────────────────────────────────

harness.add('create() with file should upload and return DocumentDTO', async () => {
  const client = new lib.HttpClient({ baseUrl: BASE_URL });

  // 1x1 red PNG (68 bytes)
  const pngBytes = new Uint8Array([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xde, 0x00, 0x00, 0x00,
    0x0c, 0x49, 0x44, 0x41, 0x54, 0x08, 0xd7, 0x63, 0xf8, 0xcf, 0xc0, 0x00,
    0x00, 0x00, 0x02, 0x00, 0x01, 0xe2, 0x21, 0xbc, 0x33, 0x00, 0x00, 0x00,
    0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
  ]);

  const result = await client.create({
    slug: 'media',
    data: { alt: 'test image' },
    file: new lib.FileUpload({
      content: new Blob([pngBytes]),
      filename: 'test-upload.png',
      mimeType: 'image/png',
    }),
  });

  TestHarness.assertTrue(result.id !== '');
  TestHarness.assertTrue((result.json['filename'] as string).startsWith('test-upload'));
  TestHarness.assertEqual(result.json['mimeType'], 'image/png');
  TestHarness.assertEqual(result.json['alt'], 'test image');

  createdMediaId = result.id;
});

harness.add('updateById() with file should replace the file on a media document', async () => {
  const client = new lib.HttpClient({ baseUrl: BASE_URL });

  // Different 1x1 PNG (blue pixel)
  const pngBytes = new Uint8Array([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xde, 0x00, 0x00, 0x00,
    0x0c, 0x49, 0x44, 0x41, 0x54, 0x08, 0xd7, 0x63, 0xf8, 0xcf, 0xc0, 0x00,
    0x00, 0x00, 0x02, 0x00, 0x01, 0xe2, 0x21, 0xbc, 0x33, 0x00, 0x00, 0x00,
    0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
  ]);

  const result = await client.updateById({
    slug: 'media',
    id: createdMediaId,
    data: { alt: 'updated image' },
    file: new lib.FileUpload({
      content: new Blob([pngBytes]),
      filename: 'updated-upload.png',
      mimeType: 'image/png',
    }),
  });

  TestHarness.assertEqual(result.id, createdMediaId);
  TestHarness.assertTrue((result.json['filename'] as string).startsWith('updated-upload'));
  TestHarness.assertEqual(result.json['alt'], 'updated image');
});

harness.add('deleteById() should delete the test media document', async () => {
  const client = new lib.HttpClient({ baseUrl: BASE_URL });

  const result = await client.deleteById({ slug: 'media', id: createdMediaId });

  TestHarness.assertEqual(result.id, createdMediaId);
});

// ── Request Escape Hatch Tests ─────────────────────────────────

harness.add('request() GET should return raw JSON', async () => {
  const client = new lib.HttpClient({ baseUrl: BASE_URL });

  const result = await client.request({
    method: lib.HttpMethod.GET,
    path: '/api/posts',
  });

  TestHarness.assertTrue(result !== undefined);
  TestHarness.assertTrue(Array.isArray(result!['docs']));
});

harness.add('request() POST with body should create and return raw JSON', async () => {
  const client = new lib.HttpClient({ baseUrl: BASE_URL });

  const result = await client.request({
    method: lib.HttpMethod.POST,
    path: '/api/posts',
    body: { title: 'Test Post (request)' },
  });

  TestHarness.assertTrue(result !== undefined);
  TestHarness.assertTrue((result!['doc'] as Record<string, unknown>)['id'] !== '');
});

harness.add('request() GET with query should append query string', async () => {
  const client = new lib.HttpClient({ baseUrl: BASE_URL });

  const result = await client.request({
    method: lib.HttpMethod.GET,
    path: '/api/posts',
    query: new lib.QueryBuilder().where({ field: 'title', operator: lib.Operator.Contains, value: 'request' }),
  });

  TestHarness.assertTrue(result !== undefined);
  TestHarness.assertTrue(Array.isArray(result!['docs']));
});

// ── Cleanup ────────────────────────────────────────────────────

harness.add('cleanup: delete the test post', async () => {
  const client = new lib.HttpClient({ baseUrl: BASE_URL });

  const result = await client.deleteById({ slug: 'posts', id: createdPostId });

  TestHarness.assertEqual(result.id, createdPostId);
});

harness.add('cleanup: delete any remaining test posts', async () => {
  const client = new lib.HttpClient({ baseUrl: BASE_URL });

  const result = await client.delete({
    slug: 'posts',
    query: new lib.QueryBuilder().where({ field: 'title', operator: lib.Operator.Contains, value: 'Test Post' }),
  });

  TestHarness.assertTrue(Array.isArray(result.docs));
});

harness.add('cleanup: delete any remaining test media', async () => {
  const client = new lib.HttpClient({ baseUrl: BASE_URL });

  const result = await client.delete({
    slug: 'media',
    query: new lib.QueryBuilder().where({ field: 'filename', operator: lib.Operator.Contains, value: 'upload' }),
  });

  TestHarness.assertTrue(Array.isArray(result.docs));
});

export async function testHttpClient() {
  await harness.run('Running HttpClient integration tests...\n');
}
