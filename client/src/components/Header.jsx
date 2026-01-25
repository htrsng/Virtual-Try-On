import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { FiShoppingCart, FiUser, FiLogOut, FiHeart, FiSearch, FiSun, FiMoon, FiRepeat, FiX } from 'react-icons/fi';

function Header({ cartCount, onSearch, showToast }) {
    const [inputValue, setInputValue] = useState("");
    const [scrolled, setScrolled] = useState(false);
    const navigate = useNavigate();
    const { user, logout, isAuthenticated } = useAuth();
    const { theme, toggleTheme } = useTheme();

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
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
            navigate('/checkout');
        } else {
            showToast("Vui lòng đăng nhập để xem Giỏ hàng!", "warning");
            navigate('/login');
        }
    };

    const handleLogout = () => {
        logout();
        showToast("Đã đăng xuất thành công!", "success");
        navigate('/');
    };

    return (
        <div className={`shopee-header ${scrolled ? 'header-scrolled' : ''}`}>
            <div className="container header-content">
                <Link to="/" className="logo">
                    <span className="logo-shopee">Shopee</span>
                    <span className="logo-divider">|</span>
                    <span className="logo-subtitle">Thời Trang</span>
                </Link>

                <div className="search-box">
                    <FiSearch className="search-icon" />
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Tìm sản phẩm, thương hiệu..."
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                    {inputValue && (
                        <button className="clear-search-btn" onClick={handleClearSearch} title="Xóa">
                            <FiX />
                        </button>
                    )}
                    <button className="search-btn" onClick={handleSearchClick}>Tìm kiếm</button>
                </div>

                <div className="header-actions">
                    <button
                        className="icon-btn theme-toggle"
                        onClick={toggleTheme}
                        title={theme === 'light' ? 'Chuyển sang Dark Mode' : 'Chuyển sang Light Mode'}
                    >
                        {theme === 'light' ? <FiMoon size={20} /> : <FiSun size={20} />}
                    </button>

                    {isAuthenticated && (
                        <>
                            <Link to="/wishlist" className="icon-btn" title="Yêu thích">
                                <FiHeart size={20} />
                            </Link>
                            <Link to="/compare" className="icon-btn" title="So sánh">
                                <FiRepeat size={20} />
                            </Link>
                        </>
                    )}

                    {isAuthenticated ? (
                        <>
                            <Link to="/profile" className="user-action">
                                <FiUser />
                                <span>{user?.fullName || user?.email}</span>
                            </Link>
                            {user?.role === 'admin' && (
                                <Link to="/admin" className="admin-btn">
                                    ⚙️ QUẢN TRỊ
                                </Link>
                            )}
                            <button className="user-action logout-btn" onClick={handleLogout}>
                                <FiLogOut />
                                <span>Đăng Xuất</span>
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" state={{ mode: 'register' }} className="header-link">
                                📝 Đăng Ký
                            </Link>
                            <Link to="/login" state={{ mode: 'login' }} className="header-link">
                                🔑 Đăng Nhập
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
    );
}

export default Header;