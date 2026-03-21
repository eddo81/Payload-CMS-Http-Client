import { PayloadError } from '../public/errors/PayloadError.ts';
import { TestHarness } from './TestHarness.ts';

const harness = new TestHarness();

// ── cause is not a navigable object ──────────────────────────────

harness.add('getDetails() returns empty array when cause is null', () => {
  const error = new PayloadError({ statusCode: 400, cause: null });

  TestHarness.assertEqual(error.getDetails(), []);
});

harness.add('getDetails() returns empty array when cause is not an object', () => {
  const error = new PayloadError({ statusCode: 400, cause: 'unexpected string' });

  TestHarness.assertEqual(error.getDetails(), []);
});

// ── errors array ──────────────────────────────────────────────────

harness.add('getDetails() extracts message and field from errors array', () => {
  const error = new PayloadError({
    statusCode: 400,
    cause: {
      errors: [
        { message: 'The following field has failed validation: email', field: 'email' },
      ],
    },
  });

  const details = error.getDetails();

  TestHarness.assertEqual(details.length, 1);
  TestHarness.assertEqual(details[0].message, 'The following field has failed validation: email');
  TestHarness.assertEqual(details[0].field, 'email');
});

harness.add('getDetails() returns null field when field is absent from errors array item', () => {
  const error = new PayloadError({
    statusCode: 400,
    cause: {
      errors: [
        { message: 'Something went wrong' },
      ],
    },
  });

  const details = error.getDetails();

  TestHarness.assertEqual(details.length, 1);
  TestHarness.assertEqual(details[0].message, 'Something went wrong');
  TestHarness.assertEqual(details[0].field, undefined);
});

harness.add('getDetails() skips invalid items in errors array', () => {
  const error = new PayloadError({
    statusCode: 400,
    cause: {
      errors: [
        null,
        { message: 'Valid error', field: 'email' },
        { field: 'password' },
      ],
    },
  });

  const details = error.getDetails();

  TestHarness.assertEqual(details.length, 1);
  TestHarness.assertEqual(details[0].message, 'Valid error');
  TestHarness.assertEqual(details[0].field, 'email');
});

harness.add('getDetails() returns empty array when errors array is empty', () => {
  const error = new PayloadError({
    statusCode: 400,
    cause: { errors: [] },
  });

  TestHarness.assertEqual(error.getDetails(), []);
});

// ── top-level message fallback ────────────────────────────────────

harness.add('getDetails() returns single item from top-level message with no field', () => {
  const error = new PayloadError({
    statusCode: 401,
    cause: { message: 'You are not allowed to perform this action.' },
  });

  const details = error.getDetails();

  TestHarness.assertEqual(details.length, 1);
  TestHarness.assertEqual(details[0].message, 'You are not allowed to perform this action.');
  TestHarness.assertEqual(details[0].field, undefined);
});

// ── unrecognised shape ────────────────────────────────────────────

harness.add('getDetails() returns empty array when cause has no errors or message', () => {
  const error = new PayloadError({
    statusCode: 400,
    cause: { status: 400 },
  });

  TestHarness.assertEqual(error.getDetails(), []);
});

export async function testPayloadError() {
  await harness.run('Running PayloadError tests...\n');
}
