import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useWishlist } from '../contexts/WishlistContext';
import { useCompare } from '../contexts/CompareContext';
import { FiShoppingCart, FiUser, FiLogOut, FiHeart, FiSearch, FiSun, FiMoon, FiRepeat, FiX, FiChevronDown, FiPackage, FiSettings } from 'react-icons/fi';
import NotificationBell from './NotificationBell';
import LanguageSwitcher from './LanguageSwitcher';
import { useLanguage } from '../contexts/LanguageContext';
import logo from '../assets/logo.svg';

function Header({ cartCount, onSearch, showToast }) {
    const [inputValue, setInputValue] = useState("");
    const [scrolled, setScrolled] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const userMenuRef = useRef(null);
    const navigate = useNavigate();
    const { user, logout, isAuthenticated } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const { wishlistCount } = useWishlist();
    const { compareCount } = useCompare();
    const { t } = useLanguage();

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                setShowUserMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearchClick = () => {
        if (!inputValue.trim()) {
            showToast && showToast('Vui lòng nhập từ khóa tìm kiếm', 'warning');
            return;
        }

        console.log('Search clicked with keyword:', inputValue.trim());

        // Navigate to search results page
        navigate(`/search?q=${encodeURIComponent(inputValue.trim())}`);
        showToast && showToast(`Đang tìm kiếm: "${inputValue.trim()}"`, 'info');
    };

    const handleClearSearch = () => {
        setInputValue('');
        if (onSearch) {
            onSearch('');
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSearchClick();
        }
    };

    const handleCartClick = () => {
        if (isAuthenticated) {
            // Xóa selectedProducts để đảm bảo vào trang chọn sản phẩm
            localStorage.removeItem('selectedProductsForCheckout');
            navigate('/checkout/choseproduct');
        } else {
            showToast("Vui lòng đăng nhập để xem Giỏ hàng!", "warning");
            navigate('/login');
        }
    };

    const handleLogout = () => {
        logout();
        showToast("Đã đăng xuất thành công!", "success");
        // Reload trang để xóa sạch state giỏ hàng
        setTimeout(() => {
            window.location.href = '/';
        }, 300);
    };

    return (
        <div className={`shopee-header ${scrolled ? 'header-scrolled' : ''}`}>
            <div className="container header-content">
                <Link to="/" className="logo">
                    <img src={logo} alt="Beauty Clothes" className="brand-logo" />
                </Link>

                <div className="search-box">
                    <FiSearch className="search-icon" />
                    <input
                        type="text"
                        className="search-input"
                        placeholder={t('search_placeholder')}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                    {inputValue && (
                        <button className="clear-search-btn" onClick={handleClearSearch} title={t('close')}>
                            <FiX />
                        </button>
                    )}
                    <button className="search-btn" onClick={handleSearchClick}>{t('search_btn')}</button>
                </div>

                <div className="header-actions">
                    {/* Group 1: Settings */}
                    <div className="header-actions-group">
                        <LanguageSwitcher />
                        <button
                            className="icon-btn theme-toggle"
                            onClick={toggleTheme}
                            title={theme === 'light' ? 'Chuyển sang Dark Mode' : 'Chuyển sang Light Mode'}
                        >
                            {theme === 'light' ? <FiMoon size={20} /> : <FiSun size={20} />}
                        </button>
                    </div>
                    <div className="header-actions-divider"></div>

                    {/* Group 2: Actions - Only show if authenticated */}
                    {isAuthenticated && (
                        <>
                            <div className="header-actions-group">
                                <NotificationBell />
                                <Link to="/wishlist" className="icon-btn" title={t('wishlist')}>
                                    <div style={{ position: 'relative', display: 'flex' }}>
                                        <FiHeart size={20} />
                                        {wishlistCount > 0 && <span className="cart-badge">{wishlistCount}</span>}
                                    </div>
                                </Link>
                                <Link to="/compare" className="icon-btn" title={t('compare')}>
                                    <div style={{ position: 'relative', display: 'flex' }}>
                                        <FiRepeat size={20} />
                                        {compareCount > 0 && <span className="cart-badge">{compareCount}</span>}
                                    </div>
                                </Link>
                            </div>
                            <div className="header-actions-divider"></div>
                        </>
                    )}

                    {/* Group 3: User & Cart */}
                    <div className="header-actions-group">
                        {isAuthenticated ? (
                            <div className="user-menu-wrapper" ref={userMenuRef}>
                                <button
                                    className="user-menu-trigger"
                                    onClick={() => setShowUserMenu(!showUserMenu)}
                                    title={user?.fullName || user?.email}
                                >
                                    <FiUser size={20} />
                                    <span>{user?.firstName || user?.fullName?.split(' ')[0] || 'User'}</span>
                                    <FiChevronDown size={16} style={{ marginLeft: '4px', transition: 'transform 0.3s' }} />
                                </button>
                                {showUserMenu && (
                                    <div className="user-menu-dropdown">
                                        <Link to="/profile" className="user-menu-item">
                                            <FiUser size={16} />
                                            <span>{t('profile') || 'Profile'}</span>
                                        </Link>
                                        <Link to="/orders" className="user-menu-item" onClick={() => setShowUserMenu(false)}>
                                            <FiPackage size={16} />
                                            <span>{t('orders') || 'My Orders'}</span>
                                        </Link>
                                        {user?.role === 'admin' && (
                                            <Link to="/admin" className="user-menu-item">
                                                <FiSettings size={16} />
                                                <span>{t('admin') || 'Admin'}</span>
                                            </Link>
                                        )}
                                        <div className="user-menu-divider"></div>
                                        <button className="user-menu-item logout" onClick={handleLogout}>
                                            <FiLogOut size={16} />
                                            <span>{t('logout') || 'Logout'}</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <>
                                <Link to="/login" state={{ mode: 'login' }} className="header-link">
                                    {t('login') || 'Login'}
                                </Link>
                                <Link to="/login" state={{ mode: 'register' }} className="header-link">
                                    {t('register') || 'Register'}
                                </Link>
                            </>
                        )}

                        <div className="cart-icon-wrapper" onClick={handleCartClick}>
                            <FiShoppingCart size={24} />
                            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Header;