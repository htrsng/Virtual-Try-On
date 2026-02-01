import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function CheckoutSelectPage({ cartItems, onRemove, onUpdateQuantity, showToast }) {
    const navigate = useNavigate();
    const { user, isAuthenticated, loading } = useAuth();
    const hasRedirected = useRef(false);

    // State cho chọn sản phẩm
    const [selectedItems, setSelectedItems] = useState({});

    // Initialize selected items: KHÔNG auto-select
    useEffect(() => {
        const initialSelected = {};
        cartItems.forEach(item => {
            initialSelected[item.cartId] = false; // Mặc định KHÔNG chọn
        });
        setSelectedItems(initialSelected);
        console.log('🛍️ CHỌN SẢN PHẨM: Không tự động chọn');
    }, [cartItems]);

    // Kiểm tra authentication
    useEffect(() => {
        if (loading) return;
        if (hasRedirected.current) return;

        if (!isAuthenticated) {
            hasRedirected.current = true;
            showToast("Vui lòng đăng nhập để thanh toán!", "warning");
            navigate('/login', { replace: true });
        }
    }, [loading, isAuthenticated, navigate, showToast]);

    const parsePrice = (price) => {
        if (typeof price === 'number') return price;
        return parseInt(String(price).replace(/\./g, '').replace(' đ', '').replace(/,/g, '')) || 0;
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
    };

    const totalAmount = cartItems.reduce((acc, item) => {
        if (selectedItems[item.cartId]) {
            return acc + parsePrice(item.price) * item.quantity;
        }
        return acc;
    }, 0);

    const selectedCount = Object.values(selectedItems).filter(Boolean).length;
    const allSelected = selectedCount === cartItems.length && cartItems.length > 0;

    const handleSelectAll = (e) => {
        const checked = e.target.checked;
        const newSelected = {};
        cartItems.forEach(item => {
            newSelected[item.cartId] = checked;
        });
        setSelectedItems(newSelected);
    };

    const handleSelectItem = (cartId) => {
        setSelectedItems(prev => ({
            ...prev,
            [cartId]: !prev[cartId]
        }));
    };

    const handleContinue = () => {
        const selected = cartItems.filter(item => selectedItems[item.cartId]);

        if (selected.length === 0) {
            showToast("Vui lòng chọn ít nhất 1 sản phẩm!", "warning");
            return;
        }

        console.log('💾 Saving and navigating with products:', selected);

        // Lưu vào localStorage
        try {
            localStorage.setItem('selectedProductsForCheckout', JSON.stringify(selected));
            console.log('✅ Saved to localStorage');
        } catch (error) {
            console.error('❌ Failed to save to localStorage:', error);
        }

        // Navigate với state backup
        navigate('/checkout/cart', {
            state: { selectedProducts: selected },
            replace: false
        });
    };

    if (!cartItems || cartItems.length === 0) {
        return (
            <div style={{ textAlign: 'center', padding: '50px', minHeight: '60vh' }}>
                <h2>🛒 Giỏ hàng trống</h2>
                <p style={{ color: '#666', marginTop: '15px' }}>Hãy thêm sản phẩm vào giỏ hàng!</p>
                <Link to="/" style={{
                    display: 'inline-block',
                    marginTop: '20px',
                    padding: '12px 30px',
                    background: '#667eea',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '6px'
                }}>
                    Tiếp tục mua sắm
                </Link>
            </div>
        );
    }

    return (
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', minHeight: '70vh' }}>
            <h1 style={{ fontSize: '28px', marginBottom: '30px', color: '#333' }}>
                🛒 Chọn sản phẩm thanh toán
            </h1>

            <div style={{
                background: 'white',
                padding: '20px',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
                <h2 style={{ fontSize: '22px', marginBottom: '20px', color: '#333', fontWeight: '700' }}>
                    Giỏ hàng của bạn ({cartItems.length} sản phẩm)
                </h2>

                <div style={{
                    padding: '12px',
                    background: '#f9f9f9',
                    borderRadius: '6px',
                    marginBottom: '15px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                }}>
                    <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={handleSelectAll}
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <span style={{ fontWeight: '500', color: '#555' }}>
                        Chọn tất cả ({cartItems.length} sản phẩm) - Đã chọn: {selectedCount}
                    </span>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #f0f0f0', color: '#666', fontSize: '14px' }}>
                                <th style={{ width: '40px', paddingBottom: '15px', fontWeight: '600' }}></th>
                                <th style={{ textAlign: 'left', paddingBottom: '15px', fontWeight: '600' }}>Sản Phẩm</th>
                                <th style={{ paddingBottom: '15px', fontWeight: '600' }}>Đơn Giá</th>
                                <th style={{ paddingBottom: '15px', fontWeight: '600' }}>Số Lượng</th>
                                <th style={{ paddingBottom: '15px', fontWeight: '600' }}>Số Tiền</th>
                                <th style={{ paddingBottom: '15px', fontWeight: '600' }}>Thao Tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cartItems.map((item) => (
                                <tr key={item.cartId} style={{
                                    borderBottom: '1px solid #f5f5f5',
                                    backgroundColor: selectedItems[item.cartId] ? '#fff' : '#f9f9f9',
                                }}>
                                    <td style={{ padding: '15px 10px', textAlign: 'center' }}>
                                        <input
                                            type="checkbox"
                                            checked={selectedItems[item.cartId] || false}
                                            onChange={() => handleSelectItem(item.cartId)}
                                            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                        />
                                    </td>
                                    <td style={{ padding: '15px 10px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                                        <img src={item.img} alt={item.name} style={{
                                            width: '80px', height: '80px', objectFit: 'cover',
                                            borderRadius: '6px', border: '1px solid #e8e8e8'
                                        }} />
                                        <div>
                                            <div style={{ fontSize: '15px', fontWeight: '500', marginBottom: '5px' }}>
                                                {item.name}
                                            </div>
                                            <div style={{ fontSize: '13px', color: '#888' }}>
                                                Size: {item.size}
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ textAlign: 'center', fontSize: '15px', padding: '15px 10px' }}>
                                        {formatPrice(parsePrice(item.price))}
                                    </td>
                                    <td style={{ textAlign: 'center', padding: '15px 10px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                            <button onClick={() => onUpdateQuantity(item.cartId, -1)}
                                                style={{
                                                    width: '28px', height: '28px', border: '1px solid #ddd',
                                                    background: 'white', borderRadius: '4px', cursor: 'pointer'
                                                }}>-</button>
                                            <span style={{ minWidth: '30px', textAlign: 'center' }}>{item.quantity}</span>
                                            <button onClick={() => onUpdateQuantity(item.cartId, 1)}
                                                style={{
                                                    width: '28px', height: '28px', border: '1px solid #ddd',
                                                    background: 'white', borderRadius: '4px', cursor: 'pointer'
                                                }}>+</button>
                                        </div>
                                    </td>
                                    <td style={{ textAlign: 'center', color: '#ee4d2d', fontWeight: 'bold', fontSize: '16px', padding: '15px 10px' }}>
                                        {formatPrice(parsePrice(item.price) * item.quantity)}
                                    </td>
                                    <td style={{ textAlign: 'center', padding: '15px 10px' }}>
                                        <button onClick={() => onRemove(item.cartId)}
                                            style={{
                                                padding: '6px 12px', background: '#ff4d4f', color: 'white',
                                                border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px'
                                            }}>Xóa</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div style={{
                    marginTop: '25px', padding: '20px', background: '#f8f9fa',
                    borderRadius: '6px', display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', flexWrap: 'wrap', gap: '15px'
                }}>
                    <div style={{ fontSize: '18px', fontWeight: '600', color: '#333' }}>
                        Tổng thanh toán ({selectedCount} sản phẩm):
                        <span style={{ color: '#ee4d2d', fontSize: '24px', marginLeft: '10px' }}>
                            {formatPrice(totalAmount)}
                        </span>
                    </div>
                    <button
                        onClick={handleContinue}
                        disabled={selectedCount === 0}
                        style={{
                            padding: '14px 40px',
                            background: selectedCount > 0 ? '#ee4d2d' : '#ccc',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: selectedCount > 0 ? 'pointer' : 'not-allowed',
                            fontSize: '16px',
                            fontWeight: '600'
                        }}
                    >
                        Tiếp tục thanh toán →
                    </button>
                </div>
            </div>
        </div>
    );
}

export default CheckoutSelectPage;
