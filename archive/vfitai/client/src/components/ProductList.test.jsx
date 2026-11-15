import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import ProductList from './ProductList';
import { MemoryRouter, useLocation } from 'react-router-dom';
import React from 'react';

const wishlist = vi.hoisted(() => ({
  addToWishlist: vi.fn(), removeFromWishlist: vi.fn(), isInWishlist: vi.fn(),
}));
vi.mock('../contexts/WishlistContext', () => ({ useWishlist: () => wishlist }));
vi.mock('../contexts/LanguageContext', () => ({
  useLanguage: () => ({ t: key => ({ suggestions: 'Suggestions', no_products: 'No products',
    view_product: 'View product', view_all: 'View all', add_wishlist: 'Add wishlist',
    remove_wishlist: 'Remove wishlist', quick_view: 'Quick view' })[key] || key }),
}));
vi.mock('./QuickViewModal', () => ({
  default: ({ product, onClose }) => <div role="dialog" aria-label={product.name}>
    <button onClick={onClose}>Close preview</button>
  </div>,
}));

const product = { id: 1, name: 'Test shirt', price: 200000, img: '/shirt.png' };
function Location() {
  return <output data-testid="location">{useLocation().pathname}</output>;
}
function show(props = {}) {
  return render(<MemoryRouter><ProductList products={[product]} {...props} /><Location /></MemoryRouter>);
}

beforeEach(() => { vi.clearAllMocks(); wishlist.isInWishlist.mockReturnValue(false); });
afterEach(cleanup);

describe('ProductList Component', () => {
  it('COMP-PRD-01: displays product name, currency and detail destination', () => {
    show();
    expect(screen.getByRole('img', { name: product.name })).toBeInTheDocument();
    expect(screen.getByText(/^200\.000\s₫$/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Test shirt/ })).toHaveAttribute('href', '/product/1');
  });
  it('COMP-PRD-02: empty products show an empty state', () => {
    show({ products: [] });
    expect(screen.getByText('No products')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
  it('COMP-PRD-03: loading hides stale product actions', () => {
    show({ loading: true });
    expect(screen.queryByRole('img', { name: product.name })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'View product' })).not.toBeInTheDocument();
  });
  it('COMP-PRD-04: adds the correct product to wishlist', () => {
    show();
    fireEvent.click(screen.getByTitle('Add wishlist'));
    expect(wishlist.addToWishlist).toHaveBeenCalledExactlyOnceWith(product);
    expect(wishlist.removeFromWishlist).not.toHaveBeenCalled();
    expect(screen.getByTestId('location')).toHaveTextContent(/^\/$/);
  });
  it('COMP-PRD-05: removes an existing wishlist item', () => {
    wishlist.isInWishlist.mockReturnValue(true);
    show();
    fireEvent.click(screen.getByTitle('Remove wishlist'));
    expect(wishlist.removeFromWishlist).toHaveBeenCalledExactlyOnceWith(product.id);
    expect(wishlist.addToWishlist).not.toHaveBeenCalled();
  });
  it('COMP-PRD-06: opens and closes the preview boundary for the selected product', () => {
    show();
    fireEvent.click(screen.getByTitle('Quick view'));
    expect(screen.getByRole('dialog', { name: product.name })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close preview' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
  it('COMP-PRD-07: view action navigates to the product detail', () => {
    show();
    fireEvent.click(screen.getByRole('button', { name: 'View product' }));
    expect(screen.getByTestId('location')).toHaveTextContent('/product/1');
  });
  it('COMP-PRD-08: custom section title is rendered', () => {
    show({ title: 'Your recommendations' });
    expect(screen.getByRole('heading', { name: 'Your recommendations' })).toBeInTheDocument();
  });
});
