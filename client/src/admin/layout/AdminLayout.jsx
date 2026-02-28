import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
    FiMenu, FiChevronDown, FiLogOut, FiHome,
    FiActivity, FiPackage, FiShoppingCart, FiTag,
    FiUsers, FiImage, FiFileText, FiBox, FiList,
    FiGift, FiTrendingUp, FiSearch, FiBell,
    FiUser, FiSun, FiMoon, FiDatabase, FiX
} from 'react-icons/fi';
import '../styles/admin-layout.css';

/* ── Menu definition ── */
const MENU_GROUPS = [
    {
        id: 'overview',
        label: 'Tổng quan',
        items: [
            { path: '/admin', label: 'Dashboard', icon: <FiActivity size={18} /> },
        ],
    },
    {
        id: 'orders',
        label: 'Đơn hàng',
        items: [
            { path: '/admin/orders', label: 'Danh sách đơn hàng', icon: <FiShoppingCart size={18} /> },
        ],
    },
    {
        id: 'products',
        label: 'Sản phẩm',
        items: [
            { path: '/admin/products-list', label: 'Sản phẩm', icon: <FiPackage size={18} /> },
            { path: '/admin/categories', label: 'Danh mục', icon: <FiTag size={18} /> },
            { path: '/admin/3d-assets', label: 'Assets 3D', icon: <FiBox size={18} /> },
        ],
    },
    {
        id: 'promotions',
        label: 'Khuyến mãi',
        items: [
            { path: '/admin/flash-sale', label: 'Flash Sale', icon: <FiTrendingUp size={18} /> },
            { path: '/admin/vouchers', label: 'Vouchers', icon: <FiGift size={18} /> },
        ],
    },
    {
        id: 'users',
        label: 'Người dùng',
        items: [
            { path: '/admin/users', label: 'Người dùng', icon: <FiUsers size={18} /> },
            { path: '/admin/avatars', label: 'Avatar 3D', icon: <FiUser size={18} /> },
        ],
    },
    {
        id: 'content',
        label: 'Nội dung',
        items: [
            { path: '/admin/banners', label: 'Banner', icon: <FiImage size={18} /> },
            { path: '/admin/banner-content', label: 'Nội dung Banner', icon: <FiFileText size={18} /> },
            { path: '/admin/sync', label: 'Đồng bộ dữ liệu', icon: <FiDatabase size={18} /> },
        ],
    },
];

export default function AdminLayout({ children }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();

    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [darkMode, setDarkMode] = useState(() =>
        localStorage.getItem('admin-theme') === 'dark'
    );

    // Expand groups containing the active route on mount
    const [expanded, setExpanded] = useState(() => {
        const initial = {};
        MENU_GROUPS.forEach(g => {
            initial[g.id] = g.items.some(i => location.pathname === i.path);
        });
        return initial;
    });

    // Apply theme
    useEffect(() => {
        document.documentElement.setAttribute('data-admin-theme', darkMode ? 'dark' : 'light');
        localStorage.setItem('admin-theme', darkMode ? 'dark' : 'light');
    }, [darkMode]);

    // Close mobile menu on navigate
    useEffect(() => {
        setMobileOpen(false);
    }, [location.pathname]);

    const toggleGroup = (id) =>
        setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

    const isActive = (path) => location.pathname === path;

    const handleLogout = () => { logout(); navigate('/login'); };

    return (
        <div className="adm">
            {/* ── Overlay (mobile) ── */}
            {mobileOpen && (
                <div className="adm-overlay adm-overlay--visible" onClick={() => setMobileOpen(false)} />
            )}

            {/* ══════ SIDEBAR ══════ */}
            <aside className={`adm-sidebar ${collapsed ? 'adm-sidebar--collapsed' : ''} ${mobileOpen ? 'adm-sidebar--open' : ''}`}>
                {/* Brand */}
                <div className="adm-sidebar__brand">
                    <div className="adm-sidebar__brand-icon">V</div>
                    <span className="adm-sidebar__brand-text">VFit Admin</span>
                </div>

                {/* User card */}
                <div className="adm-sidebar__user">
                    <div className="adm-sidebar__avatar">
                        {user?.fullName?.charAt(0) || 'A'}
                    </div>
                    <div className="adm-sidebar__user-info">
                        <div className="adm-sidebar__user-name">{user?.fullName || 'Admin'}</div>
                        <div className="adm-sidebar__user-role">
                            {user?.role === 'admin' ? 'Super Admin' : 'Admin'}
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="adm-sidebar__nav">
                    {MENU_GROUPS.map(group => (
                        <div key={group.id} className="adm-menu-group">
                            {/* Group label (only when expanded sidebar) */}
                            {!collapsed && (
                                <button
                                    className="adm-menu-group__label"
                                    onClick={() => toggleGroup(group.id)}
                                >
                                    <span>{group.label}</span>
                                    <FiChevronDown
                                        size={15}
                                        className={`adm-menu-group__chevron ${expanded[group.id] ? 'adm-menu-group__chevron--open' : ''}`}
                                    />
                                </button>
                            )}

                            {/* Items */}
                            {(collapsed || expanded[group.id]) && (
                                <div className="adm-menu-group__items">
                                    {group.items.map(item => (
                                        <button
                                            key={item.path}
                                            className={`adm-menu-item ${isActive(item.path) ? 'adm-menu-item--active' : ''}`}
                                            onClick={() => navigate(item.path)}
                                            title={collapsed ? item.label : undefined}
                                        >
                                            <span className="adm-menu-item__icon">{item.icon}</span>
                                            <span>{item.label}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </nav>

                {/* Footer — logout */}
                <div className="adm-sidebar__footer">
                    <button className="adm-sidebar__logout" onClick={handleLogout}>
                        <FiLogOut size={18} />
                        <span>Đăng xuất</span>
                    </button>
                </div>
            </aside>

            {/* ══════ MAIN ══════ */}
            <div className="adm-main">
                {/* ── Topbar ── */}
                <header className="adm-topbar">
                    {/* Mobile toggle */}
                    <button className="adm-topbar__toggle" onClick={() => setMobileOpen(!mobileOpen)}>
                        <FiMenu size={22} />
                    </button>

                    {/* Desktop collapse toggle */}
                    <button
                        className="adm-topbar__btn"
                        onClick={() => setCollapsed(!collapsed)}
                        title={collapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
                        style={{ display: 'none' }}
                        ref={el => { if (el) el.style.display = window.innerWidth > 1024 ? 'grid' : 'none'; }}
                    >
                        <FiMenu size={20} />
                    </button>

                    {/* Search */}
                    <div className="adm-topbar__search">
                        <FiSearch size={16} className="adm-topbar__search-icon" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm sản phẩm, đơn hàng, khách hàng..."
                            className="adm-topbar__search-input"
                        />
                    </div>

                    <div className="adm-topbar__spacer" />

                    {/* Actions */}
                    <div className="adm-topbar__actions">
                        <button className="adm-topbar__btn" onClick={() => navigate('/')} title="Về trang chủ">
                            <FiHome size={20} />
                        </button>
                        <button className="adm-topbar__btn adm-topbar__btn--badge" title="Thông báo">
                            <FiBell size={20} />
                        </button>

                        <button
                            className="adm-topbar__theme"
                            onClick={() => setDarkMode(!darkMode)}
                            title={darkMode ? 'Sáng' : 'Tối'}
                        >
                            {darkMode ? <FiSun size={18} /> : <FiMoon size={18} />}
                        </button>

                        <div className="adm-topbar__divider" />

                        <button className="adm-topbar__profile" onClick={() => navigate('/admin/users')}>
                            <div className="adm-topbar__profile-avatar">
                                {user?.fullName?.charAt(0) || 'A'}
                            </div>
                            <span className="adm-topbar__profile-name">{user?.fullName || 'Admin'}</span>
                        </button>
                    </div>
                </header>

                {/* ── Content area ── */}
                <main className="adm-content">
                    {children}
                </main>
            </div>
        </div>
    );
}
