import React from 'react';

function CartModal({ isOpen, onClose, cartItems, onRemove, onCheckout }) {
    if (!isOpen) return null;

    const total = cartItems.reduce((sum, item) => {
        const price = parseInt(item.price.replace(/\./g, '').replace(' đ', ''));
        return sum + price * item.quantity;
    }, 0);

    return (
        <div className="modal-overlay">
            <div className="modal-content large">
                <div className="modal-header">
                    <div className="modal-title">Giỏ Hàng Của Bạn</div>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>
                <div className="modal-body">
                    {cartItems.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '20px' }}>
                            Chưa có sản phẩm nào trong giỏ.
                        </div>
                    ) : (
                        <>
                            {cartItems.map((item) => (
                                <div key={item.id} className="cart-item">
                                    <div className="cart-item-info">
                                        <img src={item.img} alt="" className="cart-img" />
                                        <div>
                                            <div style={{ fontWeight: 'bold' }}>{item.name}</div>
                                            <div style={{ color: '#888', fontSize: '12px' }}>{item.price}</div>
                                        </div>
                                    </div>
                                    <div className="cart-actions">
                                        <span>Số lượng: {item.quantity}</span>
                                        <button
                                            style={{ color: 'red', border: 'none', background: 'none' }}
                                            onClick={() => onRemove(item.id)}
                                        >
                                            Xóa
                                        </button>
                                    </div>
                                </div>
                            ))}
                            <div className="cart-total">
                                Tổng thanh toán: {total.toLocaleString('vi-VN')} đ
                            </div>
                            <button className="checkout-btn" onClick={onCheckout}>
                                Mua Hàng
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default CartModal;