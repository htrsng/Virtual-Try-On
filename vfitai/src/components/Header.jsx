import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Header({ cartCount, user, onSearch, showToast, onLogout }) {
    const [inputValue, setInputValue] = useState("");
    const navigate = useNavigate();

    const handleSearchClick = () => {
        onSearch(inputValue);
        navigate('/');
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleSearchClick();
    };

    const handleCartClick = () => {
        if (user) {
            navigate('/checkout');
        } else {
            showToast("Vui lòng đăng nhập để xem Giỏ hàng!", "warning");
            navigate('/login');
        }
    };

    return (
        <div className="shopee-header">
            <div className="container header-content">
                <Link to="/" className="logo" style={{ textDecoration: 'none', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" height="36" viewBox="0 -960 960 960" width="36" fill="white">
                        <path d="M280-80q-33 0-56.5-23.5T200-160v-520q0-33 23.5-56.5T280-760h80v-40q0-50 35-85t85-35q50 0 85 35t35 85v40h80q33 0 56.5 23.5T760-680v520q0 33-23.5 56.5T680-80H280Zm0-80h400v-520H280v520Zm120-520h160v-40q0-33-23.5-56.5T480-840q-33 0-56.5 23.5T400-760v40Zm80 360q-50 0-85-35t-35-85h80q0 17 11.5 28.5T480-360q17 0 28.5-11.5T520-400h80q0 50-35 85t-85 35ZM280-160v-520 520Z" />
                    </svg>
                    <span style={{ fontWeight: 'bold', fontSize: '20px', fontFamily: 'Helvetica, Arial, sans-serif' }}>Shopee Fashion</span>
                </Link>

                <div className="search-box">
                    <input
                        type="text" className="search-input"
                        placeholder="Tìm sản phẩm, thương hiệu..."
                        value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={handleKeyDown}
                    />
                    <button className="search-btn" onClick={handleSearchClick}>🔍</button>
                </div>

                <div className="header-actions">
                    {user ? (
                        <>
                            <div className="user-action">Chào, {user.email}</div>
                            {user.role === 'admin' && (
                                <Link to="/admin" className="user-action" style={{ textDecoration: 'none', color: 'white', border: '1px solid white', padding: '2px 8px', borderRadius: '2px' }}>QUẢN TRỊ</Link>
                            )}
                            <div className="user-action" onClick={onLogout} style={{ cursor: 'pointer', fontWeight: 'bold' }}>Đăng Xuất</div>
                        </>
                    ) : (
                        <>
                            <Link to="/login" state={{ mode: 'register' }} className="user-action" style={{ textDecoration: 'none', color: 'white' }}>Đăng Ký</Link>
                            <Link to="/login" state={{ mode: 'login' }} className="user-action" style={{ textDecoration: 'none', color: 'white' }}>Đăng Nhập</Link>
                        </>
                    )}

                    <div className="cart-icon" onClick={handleCartClick}>
                        🛒
                        <span className="cart-badge">{cartCount}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Header;