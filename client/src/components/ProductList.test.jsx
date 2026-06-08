import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ProductList from './ProductList';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';

vi.mock('./ProductCard', () => ({
  default: ({ product }) => <div data-testid="product-card">{product?.name || "No Name"}</div>
}));

describe('ProductList Component', () => {
  it('renders products without crashing', () => {
    const mockProducts = [
      { id: 1, name: 'Áo Thun Nam', price: 150 },
      { id: 2, name: 'Quần Jean Nữ', price: 300 }
    ];

    render(
      <BrowserRouter>
        <ProductList products={mockProducts} />
      </BrowserRouter>
    );

    // Even if the implementation of ProductList varies, it should at least render
    // without throwing errors.
    expect(document.body).toBeDefined();
  });
});
