import test from 'node:test';
import assert from 'node:assert/strict';
import { fetchWithTimeout } from '../../../../client/src/utils/fetchWithTimeout.ts';

test('UNIT-HTTP-01: forwards method/body and returns the original response', async (t) => {
  const expected = new Response('{"ok":true}', { status: 201 });
  const request = { method: 'POST', body: '{"item":1}' };
  let observed;
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    observed = { url, ...options };
    return expected;
  });
  assert.equal(await fetchWithTimeout('http://local.test/order', request, 100), expected);
  assert.equal(observed.method, 'POST');
  assert.equal(observed.body, request.body);
  assert.ok(observed.signal instanceof AbortSignal);
  assert.equal(request.signal, undefined);
});

test('UNIT-HTTP-02: aborts a pending request and reports a timeout', async (t) => {
  let observedSignal;
  t.mock.method(globalThis, 'fetch', (_url, { signal }) => new Promise((_resolve, reject) => {
    observedSignal = signal;
    signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
  }));
  await assert.rejects(fetchWithTimeout('http://local.test/slow', {}, 5), /TIMEOUT/);
  assert.equal(observedSignal.aborted, true);
});

test('UNIT-HTTP-03: preserves network errors rather than relabeling them as timeouts', async (t) => {
  const original = new TypeError('Connection unavailable');
  t.mock.method(globalThis, 'fetch', async () => { throw original; });
  await assert.rejects(fetchWithTimeout('http://local.test/offline', {}, 100), e => e === original);
});

test('UNIT-HTTP-04: HTTP 4xx response remains available for application handling', async (t) => {
  const response = new Response('invalid input', { status: 400 });
  t.mock.method(globalThis, 'fetch', async () => response);
  assert.equal((await fetchWithTimeout('http://local.test/invalid')).status, 400);
});
