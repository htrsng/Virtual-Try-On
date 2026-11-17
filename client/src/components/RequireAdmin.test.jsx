import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { afterEach, describe, it, expect, vi } from 'vitest';
import RequireAdmin from './RequireAdmin';

const state = vi.hoisted(() => ({ value: {} }));
vi.mock('../contexts/AuthContext', () => ({ useAuth: () => state.value }));
afterEach(cleanup);
function mount(auth) {
    state.value = auth;
    render(<MemoryRouter initialEntries={['/admin']}><Routes>
        <Route path="/admin" element={<RequireAdmin><h1>Admin private content</h1></RequireAdmin>} />
        <Route path="/login" element={<h1>Login destination</h1>} />
        <Route path="/" element={<h1>Store destination</h1>} />
    </Routes></MemoryRouter>);
}
describe('admin route boundary', () => {
    it('waits for stored session resolution without mounting admin content', () => {
        mount({ loading: true, user: null }); expect(screen.getByRole('status')).toBeInTheDocument();
        expect(screen.queryByText('Admin private content')).not.toBeInTheDocument();
    });
    it('redirects anonymous users to login', () => {
        mount({ loading: false, user: null }); expect(screen.getByText('Login destination')).toBeInTheDocument();
    });
    it('redirects customers away from admin', () => {
        mount({ loading: false, user: { role: 'user' } }); expect(screen.getByText('Store destination')).toBeInTheDocument();
    });
    it('renders admin content only for an authenticated admin', () => {
        mount({ loading: false, user: { role: 'admin' } }); expect(screen.getByText('Admin private content')).toBeInTheDocument();
    });
});
