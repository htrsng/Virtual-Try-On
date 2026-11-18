import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { FittingRoomProvider } from '../../contexts/FittingRoomContext';
import VirtualTryOn from './VirtualTryOn';

const renderer = vi.hoisted(() => ({ preload: vi.fn(), load: vi.fn(() => { throw new Error('GLTF loading crossed the DOM test boundary'); }) }));
// Canvas owns the R3F subtree; group/mesh/Avatar must not be mounted into jsdom.
vi.mock('@react-three/fiber', () => ({
  Canvas: () => <div role="img" aria-label="3D renderer boundary" />,
  useFrame: vi.fn(), useLoader: vi.fn(), useThree: vi.fn(),
}));
vi.mock('@react-three/drei', () => ({
  useGLTF: Object.assign(renderer.load, { preload: renderer.preload }),
  useAnimations: vi.fn(), useProgress: () => ({ progress: 0 }),
  OrbitControls: () => null, Environment: () => null, ContactShadows: () => null,
  Html: () => null, Grid: () => null, MeshReflectorMaterial: () => null,
}));

const product = { id: 50101, name: 'QA Shirt', category: 'Áo', price: 200000, img: '/fixture.svg',
  model3D: { enable: true, colors: [{ name: 'White', hex: '#ffffff' }], sizes: { M: { url: '/fixture.glb' } } } };
function Location() { return <output data-testid="location">{useLocation().pathname}</output>; }
function show() {
  return render(<MemoryRouter initialEntries={['/try-on']}><FittingRoomProvider>
    <VirtualTryOn product={product} onAddToCart={vi.fn()} onBuyNow={vi.fn()} showToast={vi.fn()} />
    <Location />
  </FittingRoomProvider></MemoryRouter>);
}
beforeEach(() => {
  renderer.load.mockClear();
  localStorage.clear();
  vi.stubGlobal('fetch', vi.fn(() => { throw new Error('Unexpected network in DOM component test'); }));
});
afterEach(() => { cleanup(); localStorage.clear(); vi.unstubAllGlobals(); });

describe('VirtualTryOn DOM composition (renderer replaced, no GLB/WebGL assertions)', () => {
  it('imports the real Avatar module with a preload-capable GLTF facade', () => {
    expect(renderer.preload).toHaveBeenCalledWith('/assets/models/avatar_morph.glb');
    expect(renderer.load).not.toHaveBeenCalled();
  });
  it('renders the fixture product and Canvas boundary using the real provider', () => {
    show();
    expect(screen.getByText(/QA Shirt.*Size M/)).toBeInTheDocument();
    expect(screen.getByRole('img', { name: '3D renderer boundary' })).toBeInTheDocument();
    expect(renderer.load).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });
  it('lets a guest dismiss avatar setup while retaining the studio', () => {
    show();
    const dialog = screen.getByRole('dialog', { name: 'Bạn chưa tạo avatar nào' });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Bỏ qua' }));
    expect(screen.queryByRole('dialog', { name: 'Bạn chưa tạo avatar nào' })).not.toBeInTheDocument();
    expect(screen.getByRole('img', { name: '3D renderer boundary' })).toBeInTheDocument();
  });
  it('focuses the guest dialog action and allows Escape to dismiss it', () => {
    show();
    const dialog = screen.getByRole('dialog', { name: 'Bạn chưa tạo avatar nào' });
    expect(within(dialog).getByRole('button', { name: 'Tạo Avatar' })).toHaveFocus();
    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(screen.queryByRole('dialog', { name: 'Bạn chưa tạo avatar nào' })).not.toBeInTheDocument();
  });
  it('opens and closes the quick guide', () => {
    show(); fireEvent.click(screen.getByRole('button', { name: 'Bỏ qua' }));
    fireEvent.click(screen.getByRole('button', { name: 'Hướng dẫn' }));
    const guide = screen.getByRole('dialog', { name: 'Hướng dẫn nhanh phòng thử đồ' });
    fireEvent.click(within(guide).getByRole('button', { name: 'Đóng hướng dẫn' }));
    expect(screen.queryByRole('dialog', { name: 'Hướng dẫn nhanh phòng thử đồ' })).not.toBeInTheDocument();
  });
  it('navigates back to home', () => {
    show(); fireEvent.click(screen.getByRole('button', { name: 'Bỏ qua' }));
    fireEvent.click(screen.getByRole('button', { name: /Quay lại/ }));
    expect(screen.getByTestId('location')).toHaveTextContent(/^\/$/);
  });
});
