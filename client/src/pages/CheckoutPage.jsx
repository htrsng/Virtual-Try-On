import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

function CheckoutPage({ cartItems, onRemove, onUpdateQuantity, onCheckoutSuccess, showToast }) {
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();

    // Thông tin giao hàng - auto-fill từ user profile
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [city, setCity] = useState('');
    const [district, setDistrict] = useState('');
    const [ward, setWard] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('COD');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Auto-fill thông tin từ user profile
    useEffect(() => {
        if (!isAuthenticated) {
            showToast("Vui lòng đăng nhập để thanh toán!", "warning");
            navigate('/login');
            return;
        }

        if (user) {
            setFullName(user.fullName || '');
            setPhone(user.phone || '');
            setAddress(user.address || '');
            setCity(user.city || '');
            setDistrict(user.district || '');
            setWard(user.ward || '');
        }
    }, [user, isAuthenticated]);

    const parsePrice = (price) => {
        if (typeof price === 'number') {
            return price;
        }
        return parseInt(String(price).replace(/\./g, '').replace(' đ', '').replace(/,/g, '')) || 0;
    };

    const totalAmount = cartItems.reduce((acc, item) => {
        return acc + parsePrice(item.price) * item.quantity;
    }, 0);

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
    };

    const handlePayment = async (e) => {
        e.preventDefault();

        if (cartItems.length === 0) {
            showToast("Giỏ hàng trống!", "warning");
            return;
        }

        if (!fullName || !phone || !address || !city || !district || !ward) {
            showToast("Vui lòng điền đầy đủ thông tin giao hàng!", "warning");
            return;
        }

        setIsSubmitting(true);

        try {
            // Lấy token từ localStorage
            const token = localStorage.getItem('token');
            console.log('🔑 Token:', token ? 'Có token' : 'Không có token');

            if (!token) {
                showToast("Vui lòng đăng nhập lại!", "error");
                navigate('/login');
                return;
            }

            // Chuẩn bị dữ liệu đơn hàng
            const orderData = {
                products: cartItems.map(item => ({
                    productId: item.id,
                    name: item.name,
                    price: parsePrice(item.price),
                    quantity: item.quantity,
                    img: item.img
                })),
                totalAmount,
                shippingInfo: {
                    fullName,
                    phone,
                    address,
                    city,
                    district,
                    ward
                },
                paymentMethod
            };

            console.log('📦 Dữ liệu đơn hàng:', orderData);

            // Gửi đơn hàng lên server với token
            const response = await axios.post('http://localhost:3000/api/orders', orderData, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            console.log('✅ Response:', response.data);

            showToast("Đặt hàng thành công! 🎉", "success");
            onCheckoutSuccess(totalAmount);

            // Chuyển sang trang đơn hàng của tôi sau 1.5s
            setTimeout(() => {
                navigate('/profile');
            }, 1500);

        } catch (error) {
            console.error('❌ Lỗi đặt hàng:', error);
            console.error('❌ Error response:', error.response?.data);
            console.error('❌ Error status:', error.response?.status);
            showToast(error.response?.data?.message || error.response?.data?.error || "Đặt hàng thất bại!", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (cartItems.length === 0) {
        return (
            <div className="container" style={{
                textAlign: 'center',
                padding: '80px 20px',
                background: 'white',
                marginTop: '20px',
                borderRadius: '8px'
            }}>
                <div style={{ fontSize: '80px', marginBottom: '20px' }}>🛒</div>
                <h2 style={{ marginBottom: '10px' }}>Giỏ hàng của bạn còn trống</h2>
                <p style={{ color: '#666', marginBottom: '30px' }}>Hãy thêm sản phẩm để tiếp tục mua sắm!</p>
                <Link
                    to="/"
                    style={{
                        textDecoration: 'none',
                        display: 'inline-block',
                        padding: '12px 40px',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        borderRadius: '6px',
                        fontWeight: 'bold',
                        fontSize: '16px'
                    }}
                >
                    🛍️ MUA NGAY
                </Link>
            </div>
        );
    }

    return (
        <div className="container" style={{ marginTop: '20px', marginBottom: '40px', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            {/* Giỏ hàng */}
            <div style={{ flex: '1 1 600px' }}>
                <div style={{
                    background: 'white',
                    padding: '20px',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                    <h2 style={{ fontSize: '22px', marginBottom: '20px', color: '#333', fontWeight: '700' }}>
                        🛒 Giỏ hàng của bạn ({cartItems.length} sản phẩm)
                    </h2>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid #f0f0f0', color: '#666', fontSize: '14px' }}>
                                    <th style={{ textAlign: 'left', paddingBottom: '15px', fontWeight: '600' }}>Sản Phẩm</th>
                                    <th style={{ paddingBottom: '15px', fontWeight: '600' }}>Đơn Giá</th>
                                    <th style={{ paddingBottom: '15px', fontWeight: '600' }}>Số Lượng</th>
                                    <th style={{ paddingBottom: '15px', fontWeight: '600' }}>Số Tiền</th>
                                    <th style={{ paddingBottom: '15px', fontWeight: '600' }}>Thao Tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cartItems.map((item) => (
                                    <tr key={item.cartId} style={{ borderBottom: '1px solid #f5f5f5' }}>
                                        <td style={{ padding: '20px 10px 20px 0', display: 'flex', alignItems: 'center', gap: '15px' }}>
                                            <img
                                                src={item.img}
                                                alt={item.name}
                                                style={{
                                                    width: '80px',
                                                    height: '80px',
                                                    objectFit: 'cover',
                                                    borderRadius: '6px',
                                                    border: '1px solid #e8e8e8'
                                                }}
                                            />
                                            <div>
                                                <div style={{
                                                    fontSize: '15px',
                                                    marginBottom: '5px',
                                                    fontWeight: '500',
                                                    maxWidth: '250px'
                                                }}>
                                                    {item.name}
                                                </div>
                                                <div style={{ fontSize: '13px', color: '#888' }}>
                                                    Size: {item.size}
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ textAlign: 'center', fontSize: '15px' }}>
                                            {formatPrice(parsePrice(item.price))}
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <button
                                                    className="qty-btn"
                                                    onClick={() => onUpdateQuantity(item.cartId, -1)}
                                                    style={{
                                                        padding: '5px 12px',
                                                        border: '1px solid #ddd',
                                                        background: 'white',
                                                        cursor: 'pointer',
                                                        borderRadius: '4px 0 0 4px'
                                                    }}
                                                >
                                                    -
                                                </button>
                                                <input
                                                    className="qty-input"
                                                    type="text"
                                                    value={item.quantity}
                                                    readOnly
                                                    style={{
                                                        width: '50px',
                                                        textAlign: 'center',
                                                        border: '1px solid #ddd',
                                                        borderLeft: 'none',
                                                        borderRight: 'none',
                                                        padding: '5px'
                                                    }}
                                                />
                                                <button
                                                    className="qty-btn"
                                                    onClick={() => onUpdateQuantity(item.cartId, 1)}
                                                    style={{
                                                        padding: '5px 12px',
                                                        border: '1px solid #ddd',
                                                        background: 'white',
                                                        cursor: 'pointer',
                                                        borderRadius: '0 4px 4px 0'
                                                    }}
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </td>
                                        <td style={{ textAlign: 'center', color: '#ee4d2d', fontWeight: 'bold', fontSize: '16px' }}>
                                            {formatPrice(parsePrice(item.price) * item.quantity)}
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <button
                                                onClick={() => onRemove(item.cartId)}
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    color: '#ee4d2d',
                                                    fontSize: '20px',
                                                    padding: '5px'
                                                }}
                                                title="Xóa sản phẩm"
                                            >
                                                🗑️
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Thông tin thanh toán */}
            <div style={{ flex: '1 1 350px', maxWidth: '450px' }}>
                <div style={{
                    background: 'white',
                    padding: '25px',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    position: 'sticky',
                    top: '20px'
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '25px',
                        paddingBottom: '20px',
                        borderBottom: '2px solid #f0f0f0'
                    }}>
                        <span style={{ color: '#666', fontSize: '16px' }}>Tổng thanh toán:</span>
                        <span style={{ fontSize: '28px', color: '#ee4d2d', fontWeight: 'bold' }}>
                            {formatPrice(totalAmount)}
                        </span>
                    </div>

                    <h3 style={{ fontSize: '18px', marginBottom: '20px', fontWeight: '700' }}>
                        📦 Thông tin nhận hàng
                    </h3>

                    <form onSubmit={handlePayment}>
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', color: '#666', fontSize: '14px' }}>
                                Họ và tên *
                            </label>
                            <input
                                className="pay-input"
                                type="text"
                                placeholder="Nhập họ và tên"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    border: '1px solid #ddd',
                                    borderRadius: '6px',
                                    fontSize: '15px'
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', color: '#666', fontSize: '14px' }}>
                                Số điện thoại *
                            </label>
                            <input
                                className="pay-input"
                                type="tel"
                                placeholder="Nhập số điện thoại"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                required
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    border: '1px solid #ddd',
                                    borderRadius: '6px',
                                    fontSize: '15px'
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', color: '#666', fontSize: '14px' }}>
                                Địa chỉ *
                            </label>
                            <input
                                className="pay-input"
                                type="text"
                                placeholder="Số nhà, tên đường"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                required
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    border: '1px solid #ddd',
                                    borderRadius: '6px',
                                    fontSize: '15px'
                                }}
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', color: '#666', fontSize: '14px' }}>
                                    Phường/Xã *
                                </label>
                                <input
                                    className="pay-input"
                                    type="text"
                                    placeholder="Phường/Xã"
                                    value={ward}
                                    onChange={(e) => setWard(e.target.value)}
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        border: '1px solid #ddd',
                                        borderRadius: '6px',
                                        fontSize: '15px'
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', color: '#666', fontSize: '14px' }}>
                                    Quận/Huyện *
                                </label>
                                <input
                                    className="pay-input"
                                    type="text"
                                    placeholder="Quận/Huyện"
                                    value={district}
                                    onChange={(e) => setDistrict(e.target.value)}
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        border: '1px solid #ddd',
                                        borderRadius: '6px',
                                        fontSize: '15px'
                                    }}
                                />
                            </div>
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', color: '#666', fontSize: '14px' }}>
                                Tỉnh/Thành phố *
                            </label>
                            <input
                                className="pay-input"
                                type="text"
                                placeholder="Tỉnh/Thành phố"
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                                required
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    border: '1px solid #ddd',
                                    borderRadius: '6px',
                                    fontSize: '15px'
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: '25px' }}>
                            <label style={{ display: 'block', marginBottom: '10px', color: '#666', fontSize: '14px', fontWeight: '600' }}>
                                Phương thức thanh toán
                            </label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <label style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '12px',
                                    border: '2px solid ' + (paymentMethod === 'COD' ? '#667eea' : '#ddd'),
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    background: paymentMethod === 'COD' ? '#f0f4ff' : 'white'
                                }}>
                                    <input
                                        type="radio"
                                        name="payment"
                                        value="COD"
                                        checked={paymentMethod === 'COD'}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                        style={{ marginRight: '10px' }}
                                    />
                                    💵 Thanh toán khi nhận hàng (COD)
                                </label>
                                <label style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '12px',
                                    border: '2px solid ' + (paymentMethod === 'Banking' ? '#667eea' : '#ddd'),
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    background: paymentMethod === 'Banking' ? '#f0f4ff' : 'white'
                                }}>
                                    <input
                                        type="radio"
                                        name="payment"
                                        value="Banking"
                                        checked={paymentMethod === 'Banking'}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                        style={{ marginRight: '10px' }}
                                    />
                                    🏦 Chuyển khoản ngân hàng
                                </label>
                            </div>
                        </div>

                        <button
                            className="pay-btn"
                            type="submit"
                            disabled={isSubmitting}
                            style={{
                                width: '100%',
                                padding: '15px',
                                background: isSubmitting
                                    ? '#ccc'
                                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '16px',
                                fontWeight: 'bold',
                                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                                transition: 'all 0.3s'
                            }}
                        >
                            {isSubmitting ? '⏳ Đang xử lý...' : '🎉 ĐẶT HÀNG NGAY'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default CheckoutPage;