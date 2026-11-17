import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.resetModules(); });
async function client(api = '') {
  vi.stubEnv('VITE_API_URL', api);
  return (await import('./fetchJson')).fetchJson;
}
describe('App JSON transport contract', () => {
  it('reads same-origin JSON', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response('{"id":50101}', { headers: { 'content-type': 'application/json' } }));
    vi.stubGlobal('fetch', fetch);
    expect(await (await client())('/api/products')).toEqual({ id: 50101 });
    expect(fetch).toHaveBeenCalledExactlyOnceWith('/api/products');
  });
  it('normalizes the configured origin and accepts JSON content-type parameters', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response('[]', { headers: { 'content-type': 'application/json; charset=utf-8' } }));
    vi.stubGlobal('fetch', fetch);
    expect(await (await client('http://example.test/'))('/api/products')).toEqual([]);
    expect(fetch).toHaveBeenCalledExactlyOnceWith('http://example.test/api/products');
  });
  it.each(['network', 'html', 'http'])('falls back to same origin after configured-origin %s failure', async kind => {
    const fetch = vi.fn();
    if (kind === 'network') fetch.mockRejectedValueOnce(new Error('offline'));
    else fetch.mockResolvedValueOnce(new Response('<html>proxy</html>', { status: kind === 'http' ? 503 : 200, headers: { 'content-type': 'text/html' } }));
    fetch.mockResolvedValueOnce(new Response('[]', { headers: { 'content-type': 'application/json' } }));
    vi.stubGlobal('fetch', fetch);
    expect(await (await client('http://example.test'))('/api/products')).toEqual([]);
    expect(fetch.mock.calls.map(args => args[0])).toEqual(['http://example.test/api/products', '/api/products']);
  });
  it('rejects same-origin HTML rather than treating the SPA shell as data', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('<html/>', { headers: { 'content-type': 'text/html' } })));
    await expect((await client())('/api/products')).rejects.toThrow('Expected JSON');
  });
  it('preserves the last HTTP status when both endpoints fail', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => Promise.resolve(new Response('Unavailable', { status: 503 }))));
    await expect((await client('http://example.test'))('/api/products')).rejects.toThrow('Request failed (503) for /api/products');
  });
});
