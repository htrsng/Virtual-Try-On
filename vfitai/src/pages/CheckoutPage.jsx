import React from 'react';
import { Link } from 'react-router-dom';

function CheckoutPage({ cartItems, onRemove, onUpdateQuantity, onCheckoutSuccess }) {

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

    const handlePayment = (e) => {
        e.preventDefault();
        if (cartItems.length === 0) {
            alert("Giỏ hàng trống!");
            return;
        }
        onCheckoutSuccess(totalAmount);
    };

    if (cartItems.length === 0) {
        return (
            <div className="container" style={{ textAlign: 'center', padding: '50px', background: 'white', marginTop: '20px' }}>
                <img src="https://deo.shopeemobile.com/shopee/shopee-pcmall-live-sg/cart/9bdd8040b334d31946f49e36beaf32db.png" alt="Empty Cart" style={{ width: '100px' }} />
                <p>Giỏ hàng của bạn còn trống</p>
                <Link to="/" className="pay-btn" style={{ textDecoration: 'none', display: 'inline-block', width: 'auto', padding: '10px 30px' }}>MUA NGAY</Link>
            </div>
        );
    }

    return (
        <div className="container" style={{ marginTop: '20px', display: 'flex', gap: '20px' }}>
            <div style={{ width: '70%' }}>
                <div style={{ background: 'white', padding: '15px', borderRadius: '2px', boxShadow: '0 1px 1px 0 rgba(0,0,0,.05)' }}>
                    <h2 style={{ fontSize: '18px', marginBottom: '20px', color: '#222' }}>Giỏ hàng của bạn</h2>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid #ddd', color: '#888', fontSize: '14px' }}>
                                <th style={{ textAlign: 'left', paddingBottom: '10px' }}>Sản Phẩm</th>
                                <th>Đơn Giá</th>
                                <th>Số Lượng</th>
                                <th>Số Tiền</th>
                                <th>Thao Tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cartItems.map((item) => (
                                <tr key={item.cartId} style={{ borderBottom: '1px solid #f5f5f5' }}>
                                    <td style={{ padding: '20px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <img src={item.img} alt={item.name} style={{ width: '80px', height: '80px', objectFit: 'cover', border: '1px solid #e8e8e8' }} />
                                        <div>
                                            <div style={{ fontSize: '14px', marginBottom: '5px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                                            <div style={{ fontSize: '12px', color: '#888' }}>Phân loại: {item.size}</div>
                                        </div>
                                    </td>
                                    <td style={{ textAlign: 'center', fontSize: '14px' }}>{formatPrice(parsePrice(item.price))}</td>
                                    <td style={{ textAlign: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <button className="qty-btn" onClick={() => onUpdateQuantity(item.cartId, -1)}>-</button>
                                            <input className="qty-input" type="text" value={item.quantity} readOnly />
                                            <button className="qty-btn" onClick={() => onUpdateQuantity(item.cartId, 1)}>+</button>
                                        </div>
                                    </td>
                                    <td style={{ textAlign: 'center', color: '#ee4d2d', fontWeight: 'bold' }}>
                                        {formatPrice(parsePrice(item.price) * item.quantity)}
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <button
                                            onClick={() => onRemove(item.cartId)}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#333' }}
                                        >
                                            Xóa
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div style={{ width: '30%' }}>
                <div style={{ background: 'white', padding: '20px', borderRadius: '2px', boxShadow: '0 1px 1px 0 rgba(0,0,0,.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                        <span style={{ color: '#888' }}>Tổng thanh toán:</span>
                        <span style={{ fontSize: '24px', color: '#ee4d2d', fontWeight: 'bold' }}>
                            {formatPrice(totalAmount)}
                        </span>
                    </div>

                    <h3 style={{ fontSize: '16px', marginBottom: '15px' }}>Thông tin nhận hàng</h3>
                    <form onSubmit={handlePayment}>
                        <input className="pay-input" type="text" placeholder="Họ và tên" required />
                        <input className="pay-input" type="text" placeholder="Số điện thoại" required />
                        <input className="pay-input" type="text" placeholder="Địa chỉ nhận hàng" required />
                        <button className="pay-btn" type="submit">ĐẶT HÀNG</button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default CheckoutPage;