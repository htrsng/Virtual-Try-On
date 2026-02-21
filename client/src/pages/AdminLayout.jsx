import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
    FiMenu, FiX, FiChevronDown, FiLogOut, FiUser, FiHome,
    FiActivity, FiPackage, FiShoppingCart, FiTag,
    FiUsers, FiImage, FiFileText, FiBox, FiList, FiGift, FiTrendingUp
} from 'react-icons/fi';
import '../styles/admin-layout.css';

function AdminLayout({ children }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [expandedGroups, setExpandedGroups] = useState({
        overview: true,
        orders: false,
        products: false,
        promotions: false,
        users: false,
        content: false
    });

    const menuGroups = [
        {
            id: 'overview',
            label: '📊 Tổng quan',
            icon: <FiActivity size={20} />,
            items: [
                { path: '/admin', label: 'Dashboard', icon: <FiActivity size={18} /> }
            ]
        },
        {
            id: 'orders',
            label: '🛒 Đơn hàng',
            icon: <FiShoppingCart size={20} />,
            items: [
                { path: '/admin/orders', label: 'Danh sách đơn hàng', icon: <FiList size={18} /> }
            ]
        },
        {
            id: 'products',
            label: '📦 Sản phẩm',
            icon: <FiPackage size={20} />,
            items: [
                { path: '/admin/products-list', label: 'Danh sách sản phẩm', icon: <FiList size={18} /> },
                { path: '/admin/categories', label: 'Danh mục', icon: <FiTag size={18} /> },
                { path: '/admin/3d-assets', label: 'Assets 3D', icon: <FiBox size={18} /> }
            ]
        },
        {
            id: 'promotions',
            label: '🎁 Khuyến mãi',
            icon: <FiGift size={20} />,
            items: [
                { path: '/admin/flash-sale', label: 'Flash Sale', icon: <FiTrendingUp size={18} /> },
                { path: '/admin/vouchers', label: 'Vouchers', icon: <FiGift size={18} /> }
            ]
        },
        {
            id: 'users',
            label: '👤 Người dùng',
            icon: <FiUsers size={20} />,
            items: [
                { path: '/admin/users', label: 'Danh sách người dùng', icon: <FiList size={18} /> },
                { path: '/admin/avatars', label: 'Avatar 3D', icon: <FiUser size={18} /> }
            ]
        },
        {
            id: 'content',
            label: '🖼 Nội dung',
            icon: <FiImage size={20} />,
            items: [
                { path: '/admin/banners', label: 'Banner', icon: <FiImage size={18} /> },
                { path: '/admin/banner-content', label: 'Nội dung Banner', icon: <FiFileText size={18} /> }
            ]
        }
    ];

    const toggleGroup = (groupId) => {
        setExpandedGroups(prev => ({
            ...prev,
            [groupId]: !prev[groupId]
        }));
    };

    const isActive = (path) => {
        return location.pathname === path;
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="admin-layout">
            {/* Sidebar */}
            <aside className={`admin-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
                <div className="admin-sidebar-header">
                    <div className="admin-logo">
                        <span className="logo-icon">🏪</span>
                        {sidebarOpen && <span className="logo-text">Admin</span>}
                    </div>
                    <button
                        className="sidebar-toggle-btn"
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                    >
                        {sidebarOpen ? <FiX size={20} /> : <FiMenu size={20} />}
                    </button>
                </div>

                {/* User Info */}
                {sidebarOpen && user && (
                    <div className="admin-user-info">
                        <div className="user-avatar">{user.fullName?.charAt(0) || 'A'}</div>
                        <div className="user-details">
                            <div className="user-name">{user.fullName}</div>
                            <div className="user-role">{user.role === 'admin' ? 'Super Admin' : 'Admin'}</div>
                        </div>
                    </div>
                )}

                {/* Menu Groups */}
                <nav className="admin-menu">
                    {menuGroups.map(group => (
                        <div key={group.id} className="menu-group">
                            {sidebarOpen ? (
                                <>
                                    <button
                                        className="menu-group-header"
                                        onClick={() => toggleGroup(group.id)}
                                    >
                                        <span className="menu-group-icon">{group.icon}</span>
                                        <span className="menu-group-label">{group.label}</span>
                                        <FiChevronDown
                                            size={16}
                                            className={`menu-group-chevron ${expandedGroups[group.id] ? 'expanded' : ''}`}
                                        />
                                    </button>
                                    {expandedGroups[group.id] && (
                                        <div className="menu-group-items">
                                            {group.items.map(item => (
                                                <button
                                                    key={item.path}
                                                    className={`menu-item ${isActive(item.path) ? 'active' : ''}`}
                                                    onClick={() => navigate(item.path)}
                                                >
                                                    <span className="menu-item-icon">{item.icon}</span>
                                                    <span className="menu-item-label">{item.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="menu-group-collapsed">
                                    {group.items.map(item => (
                                        <button
                                            key={item.path}
                                            className={`menu-item-collapsed ${isActive(item.path) ? 'active' : ''}`}
                                            onClick={() => navigate(item.path)}
                                            title={item.label}
                                        >
                                            {item.icon}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </nav>

                {/* Logout Button */}
                {sidebarOpen && (
                    <button className="logout-btn" onClick={handleLogout}>
                        <FiLogOut size={18} />
                        <span>Đăng xuất</span>
                    </button>
                )}
            </aside>

            {/* Main Content */}
            <div className="admin-main">
                {/* Header */}
                <header className="admin-header">
                    <button
                        className="mobile-menu-btn"
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                    >
                        <FiMenu size={24} />
                    </button>

                    <div className="admin-header-right">
                        <button
                            className="admin-header-btn"
                            onClick={() => navigate('/')}
                            title="Về trang chủ"
                        >
                            <FiHome size={20} />
                        </button>
                        <button className="admin-header-btn">
                            <FiUser size={20} />
                        </button>
                        <button className="admin-header-btn" onClick={handleLogout}>
                            <FiLogOut size={20} />
                        </button>
                    </div>
                </header>

                {/* Content Area */}
                <div className="admin-content">
                    {children}
                </div>
            </div>
        </div>
    );
}

export default AdminLayout;
