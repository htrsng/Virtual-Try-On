import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import TryOnPanel from './TryOnPanel';
import type { OutfitResult } from '../../types/outfit';

const outfit: OutfitResult = { id: 'synthetic', name: 'Synthetic outfit', matchScore: 90, totalPrice: 200000, aiReason: '', items: [
  { id: '50101', name: 'QA shirt', category: 'top', price: 200000, imageUrl: '/fixture.svg', productUrl: '/product/50101', color: '#fff', source: 'shop', selectedSize: 'S' },
] };
afterEach(cleanup);
it('keeps manual purchase choice on an equivalent rerender and resets for a changed variant', () => {
  const props = { isOpen: true, currentIndex: 0, onClose: vi.fn(), onIndexChange: vi.fn(), onUpdateItem: vi.fn(), onAddToCart: vi.fn(), onBuyNow: vi.fn() };
  const closetItems = [{ productId: '50101', size: 'S', colorHex: '#fff' }];
  const view = render(<TryOnPanel {...props} outfits={[outfit]} closetItems={closetItems} />);
  expect(screen.getByRole('checkbox', { name: 'Chọn mua QA shirt' })).not.toBeChecked();
  const changed = { ...outfit, items: [{ ...outfit.items[0], selectedSize: 'M' }] };
  view.rerender(<TryOnPanel {...props} outfits={[changed]} closetItems={closetItems} />);
  const checkbox = screen.getByRole('checkbox', { name: 'Chọn mua QA shirt' });
  expect(checkbox).toBeChecked();
  fireEvent.click(checkbox);
  view.rerender(<TryOnPanel {...props} outfits={[{ ...changed }]} closetItems={[...closetItems]} />);
  expect(checkbox).not.toBeChecked();
});
