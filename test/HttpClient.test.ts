import * as lib from '../lib/index.ts';
import { TestHarness } from './TestHarness.ts';

const harness = new TestHarness();

const BASE_URL = 'http://localhost:3000/';
const TEST_EMAIL = 'claude@outlook.com';
const TEST_PASSWORD = '123456789';

// Shared state across sequential tests
let createdPostId: string = '';
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
    query: new lib.QueryBuilder().where('title', 'equals', 'Integration Test Post'),
  });

  TestHarness.assertTrue(result.totalDocs >= 1);
  TestHarness.assertTrue(result.docs.length >= 1);
  TestHarness.assertEqual(result.docs[0].json['title'], 'Integration Test Post');
});

harness.add('count() should return the correct document count', async () => {
  const client = new lib.HttpClient({ baseUrl: BASE_URL });

  const total = await client.count({
    slug: 'posts',
    query: new lib.QueryBuilder().where('title', 'equals', 'Integration Test Post'),
  });

  TestHarness.assertTrue(total >= 1);
});

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
    query: new lib.QueryBuilder().where('title', 'equals', 'Integration Test Post'),
  });

  TestHarness.assertTrue(result.docs.length >= 1);
  TestHarness.assertEqual(result.docs[0].json['published'], false);
});

// ── Version Tests (posts) ──────────────────────────────────────

harness.add('findVersions() should return versions for the post collection', async () => {
  const client = new lib.HttpClient({ baseUrl: BASE_URL });

  const result = await client.findVersions({
    slug: 'posts',
    query: new lib.QueryBuilder().where('parent', 'equals', createdPostId),
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
    auth: new lib.JwtAuth(loginToken),
  });

  const result = await client.me({ slug: 'users' });

  TestHarness.assertTrue(result.user.id !== '');
  TestHarness.assertEqual(result.user.json['email'], TEST_EMAIL);
  TestHarness.assertEqual(result.collection, 'users');
});

harness.add('refreshToken() should return a new token', async () => {
  const client = new lib.HttpClient({
    baseUrl: BASE_URL,
    auth: new lib.JwtAuth(loginToken),
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

// ── Cleanup: delete test posts ─────────────────────────────────

harness.add('deleteById() should delete the test post', async () => {
  const client = new lib.HttpClient({ baseUrl: BASE_URL });

  const result = await client.deleteById({ slug: 'posts', id: createdPostId });

  TestHarness.assertEqual(result.id, createdPostId);
});

harness.add('delete() bulk should clean up any remaining test posts', async () => {
  const client = new lib.HttpClient({ baseUrl: BASE_URL });

  const result = await client.delete({
    slug: 'posts',
    query: new lib.QueryBuilder().where('title', 'contains', 'Integration Test'),
  });

  TestHarness.assertTrue(Array.isArray(result.docs));
});

export async function testHttpClient() {
  await harness.run('Running HttpClient integration tests...\n');
}
