import { ApiKeyAuth } from '../lib/public/config/ApiKeyAuth.ts';
import { TestHarness } from './TestHarness.ts';

const harness = new TestHarness();

harness.add('ApiKeyAuth should set Authorization header in Payload CMS format', () => {
  const auth = new ApiKeyAuth('users', 'abc123');
  const headers: Record<string, string> = {};

  auth.applyTo(headers);

  TestHarness.assertEqual(headers['Authorization'], 'users API-Key abc123');
});

harness.add('ApiKeyAuth should overwrite an existing Authorization header', () => {
  const auth = new ApiKeyAuth('users', 'abc123');
  const headers: Record<string, string> = {
    'Authorization': 'Bearer old-token',
  };

  auth.applyTo(headers);

  TestHarness.assertEqual(headers['Authorization'], 'users API-Key abc123');
});

harness.add('ApiKeyAuth should preserve other headers', () => {
  const auth = new ApiKeyAuth('users', 'abc123');
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'X-Custom': 'value',
  };

  auth.applyTo(headers);

  TestHarness.assertEqual(headers['Accept'], 'application/json');
  TestHarness.assertEqual(headers['X-Custom'], 'value');
  TestHarness.assertEqual(headers['Authorization'], 'users API-Key abc123');
});

harness.add('ApiKeyAuth should use collection slug and key values as provided', () => {
  const auth = new ApiKeyAuth('admin-users', 'key-with-dashes-123');
  const headers: Record<string, string> = {};

  auth.applyTo(headers);

  TestHarness.assertEqual(headers['Authorization'], 'admin-users API-Key key-with-dashes-123');
});

export async function testApiKeyAuth() {
  await harness.run('Running ApiKeyAuth tests...\n');
}
