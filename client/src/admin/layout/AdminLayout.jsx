import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
    FiMenu, FiChevronDown, FiLogOut, FiHome,
    FiActivity, FiPackage, FiShoppingCart, FiTag,
    FiUsers, FiImage, FiFileText, FiBox, FiList,
    FiGift, FiTrendingUp, FiSearch, FiBell,
    FiUser, FiSun, FiMoon, FiDatabase, FiX, FiCheckCircle, FiMessageSquare
} from 'react-icons/fi';
import axios from 'axios';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
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
    {
        id: 'support',
        label: 'Hỗ trợ',
        items: [
            { path: '/admin/chat', label: 'Phản hồi khách hàng', icon: <FiMessageSquare size={18} /> },
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

    // Notification state
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [readIds, setReadIds] = useState(() => {
        try { return JSON.parse(localStorage.getItem('admin-read-notifs') || '[]'); }
        catch { return []; }
    });
    const notifRef = useRef(null);

    const fetchNotifications = useCallback(async () => {
        try {
            const res = await axios.get(`${API_URL}/api/orders`);
            const orders = res.data.slice(0, 10);
            setNotifications(orders.map(o => ({
                id: o._id,
                orderId: o._id?.slice(-6)?.toUpperCase() || '------',
                customer: o.userId?.fullName || o.shippingInfo?.fullName || 'Khách',
                status: o.status || 'Đang xử lý',
                total: o.totalPrice || o.total || 0,
                time: o.createdAt,
            })));
        } catch (_) { }
    }, []);

    useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

    // Poll every 30s for new orders
    useEffect(() => {
        const id = setInterval(fetchNotifications, 30000);
        return () => clearInterval(id);
    }, [fetchNotifications]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handler = (e) => {
            if (notifRef.current && !notifRef.current.contains(e.target)) {
                setShowNotifications(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const markAllRead = () => {
        const all = notifications.map(n => n.id);
        setReadIds(all);
        localStorage.setItem('admin-read-notifs', JSON.stringify(all));
    };

    const unreadCount = notifications.filter(n => !readIds.includes(n.id)).length;

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
                    <span className="adm-sidebar__brand-text">VFitAI Admin</span>
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
                        {/* Notification Bell */}
                        <div className="adm-notif-wrap" ref={notifRef}>
                            <button
                                className="adm-topbar__btn adm-topbar__btn--badge"
                                title="Thông báo"
                                onClick={() => setShowNotifications(v => !v)}
                            >
                                <FiBell size={20} />
                                {unreadCount > 0 && (
                                    <span className="adm-notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                                )}
                            </button>

                            {showNotifications && (
                                <div className="adm-notif-dropdown">
                                    <div className="adm-notif-header">
                                        <span className="adm-notif-title">
                                            Thông báo {unreadCount > 0 && <span className="adm-notif-count">{unreadCount} mới</span>}
                                        </span>
                                        <button className="adm-notif-markall" onClick={markAllRead}>
                                            <FiCheckCircle size={14} /> Đánh dấu đã đọc
                                        </button>
                                    </div>

                                    <div className="adm-notif-list">
                                        {notifications.length === 0 ? (
                                            <div className="adm-notif-empty">Không có thông báo nào</div>
                                        ) : notifications.map(n => {
                                            const isRead = readIds.includes(n.id);
                                            const statusColor =
                                                n.status === 'Đã giao' ? '#22c55e' :
                                                    n.status === 'Đang giao' ? '#3b82f6' :
                                                        n.status === 'Đã hủy' ? '#ef4444' : '#f59e0b';
                                            return (
                                                <div
                                                    key={n.id}
                                                    className={`adm-notif-item ${isRead ? 'adm-notif-item--read' : ''}`}
                                                    onClick={() => {
                                                        const updated = [...new Set([...readIds, n.id])];
                                                        setReadIds(updated);
                                                        localStorage.setItem('admin-read-notifs', JSON.stringify(updated));
                                                        setShowNotifications(false);
                                                        navigate('/admin/orders');
                                                    }}
                                                >
                                                    <div className="adm-notif-item__dot" style={{ background: statusColor }} />
                                                    <div className="adm-notif-item__body">
                                                        <div className="adm-notif-item__text">
                                                            Đơn hàng <strong>#{n.orderId}</strong> — {n.customer}
                                                        </div>
                                                        <div className="adm-notif-item__meta">
                                                            <span style={{ color: statusColor }}>{n.status}</span>
                                                            <span>•</span>
                                                            <span>{Number(n.total).toLocaleString('vi-VN')}đ</span>
                                                            {n.time && <span>• {new Date(n.time).toLocaleDateString('vi-VN')}</span>}
                                                        </div>
                                                    </div>
                                                    {!isRead && <div className="adm-notif-item__unread-dot" />}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="adm-notif-footer">
                                        <button
                                            className="adm-notif-viewall"
                                            onClick={() => { setShowNotifications(false); navigate('/admin/orders'); }}
                                        >
                                            Xem tất cả đơn hàng →
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

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
