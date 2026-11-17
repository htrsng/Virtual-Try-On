import { test, expect } from '../fixtures';

test('managed API and UI proxy share readiness and fresh fixtures', async ({ request, qaData }) => {
  const direct = await request.get(`${qaData.apiURL}/api/health/ready`);
  const proxied = await request.get('/api/health/ready');
  expect(direct.status()).toBe(200); expect(proxied.status()).toBe(200);
  expect(await direct.json()).toEqual(await proxied.json());
  const catalog = await request.get('/api/products');
  expect(catalog.status()).toBe(200);
  expect((await catalog.json()).map((p: { id: number }) => p.id).sort()).toEqual(qaData.fixture.productIds);
});

test('owner fixtures authenticate and persist a server-priced checkout', async ({ request, qaData }) => {
  const login = await request.post('/api/auth/login', { data: qaData.accounts.customer });
  expect(login.status()).toBe(200); const { token } = await login.json();
  const headers = { Authorization: `Bearer ${token}` };
  const before = await request.get('/api/orders/my-orders', { headers });
  expect(before.status()).toBe(200);
  expect((await before.json()).length).toBe(2);
  const placed = await request.post('/api/orders', { headers, data: {
    products: [{ productId: 50101, quantity: 1, color: 'White', size: 'M' }],
    shippingInfo: { fullName: 'QA', phone: '0900000000', address: 'Synthetic fixture address' },
  } });
  expect(placed.status()).toBe(201); expect((await placed.json()).order.totalAmount).toBe(230000);
  const after = await request.get('/api/orders/my-orders', { headers });
  expect(after.status()).toBe(200);
  const saved = await after.json();
  expect(saved).toHaveLength(3);
  const order = await placed.json();
  expect(saved.find((item: { _id: string }) => item._id === order.order._id).totalAmount).toBe(230000);
});

test('3D fixture assets are real GLB resources and owner closet has a model', async ({ request, qaData }) => {
  const catalogResponse = await request.get('/api/products');
  expect(catalogResponse.status()).toBe(200);
  const catalog = await catalogResponse.json();
  expect(catalog.find((product: { id: number }) => product.id === 50101).model3D.enable).toBe(true);
  const login = await request.post('/api/auth/login', { data: qaData.accounts.customer });
  expect(login.status()).toBe(200); const { token } = await login.json();
  const outfits = await request.get('/api/saved-outfits', { headers: { Authorization: `Bearer ${token}` } });
  expect(outfits.status()).toBe(200); expect((await outfits.json()).outfits).toHaveLength(1);
  const closet = await request.get('/api/virtual-closet', { headers: { Authorization: `Bearer ${token}` } });
  expect(closet.status()).toBe(200); expect((await closet.json()).items[0].glbUrl).toBe('/models/Ao_Thun_sizeM.glb');
  const session = await request.get(`/api/tryon/session/${qaData.fixture.ids.session}`);
  expect(session.status()).toBe(200); expect((await session.json()).session.items).toHaveLength(1);
  for (const asset of qaData.fixture.assets) {
    const response = await request.get(asset, { headers: { Range: 'bytes=0-19' } });
    expect([200, 206]).toContain(response.status());
    expect((await response.body()).subarray(0, 4).toString()).toBe('glTF');
  }
});
