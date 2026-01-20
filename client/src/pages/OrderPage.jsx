import React from 'react';
import { Link } from 'react-router-dom';

function OrderPage({ orders }) {
    return (
        <div className="container" style={{ marginTop: '20px' }}>
            <div style={{ background: 'white', padding: '20px', borderRadius: '2px' }}>
                <h2 style={{ borderBottom: '1px solid #eee', paddingBottom: '15px', marginTop: 0 }}>Đơn Hàng Của Tôi</h2>

                {orders.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '50px' }}>
                        <p>Bạn chưa có đơn hàng nào.</p>
                        <Link to="/" style={{ color: '#ee4d2d', textDecoration: 'none' }}>Tiếp tục mua sắm</Link>
                    </div>
                ) : (
                    <div>
                        {orders.map((order, index) => (
                            <div key={index} style={{ border: '1px solid #ddd', marginBottom: '20px', borderRadius: '4px' }}>
                                <div style={{ background: '#fafafa', padding: '10px 20px', borderBottom: '1px solid #ddd', display: 'flex', justifyContent: 'space-between' }}>
                                    <strong>Đơn hàng #{index + 1}</strong>
                                    <span style={{ color: '#26aa99', fontWeight: 'bold' }}>Giao hàng thành công</span>
                                </div>

                                <div style={{ padding: '20px' }}>
                                    {order.items.map((item) => (
                                        <div key={item.id} style={{ display: 'flex', gap: '15px', marginBottom: '10px' }}>
                                            <img src={item.img} width="60" height="60" style={{ objectFit: 'cover', border: '1px solid #eee' }} />
                                            <div>
                                                <div>{item.name}</div>
                                                <div style={{ color: '#888' }}>x{item.quantity}</div>
                                                <div style={{ color: '#ee4d2d' }}>{item.price}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div style={{ padding: '10px 20px', borderTop: '1px solid #ddd', textAlign: 'right' }}>
                                    Tổng tiền: <span style={{ fontSize: '18px', color: '#ee4d2d', fontWeight: 'bold' }}>{order.total.toLocaleString('vi-VN')} đ</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default OrderPage;