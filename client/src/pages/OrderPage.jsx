import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import OrderTracking from '../components/OrderTracking';

function OrderPage({ showToast }) {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');

            if (!token) {
                showToast('Vui lòng đăng nhập để xem đơn hàng', 'warning');
                navigate('/login');
                return;
            }

            const response = await axios.get('http://localhost:3000/api/orders/my-orders', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            setOrders(response.data || []);
        } catch (error) {
            console.error('Lỗi lấy đơn hàng:', error);
            const errorMessage = error.response?.data?.message || 'Không thể tải danh sách đơn hàng';
            showToast(errorMessage, 'error');
            setOrders([]);
        } finally {
            setLoading(false);
        }
    };

    const handleCancelOrder = async (orderId) => {
        if (!window.confirm('Bạn chắc chắn muốn hủy đơn hàng này?')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            await axios.put(
                `http://localhost:3000/api/orders/${orderId}/cancel`,
                { reason: 'Khách hàng hủy đơn' },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            showToast('Hủy đơn hàng thành công', 'success');
            fetchOrders();
        } catch (error) {
            console.error('Lỗi hủy đơn hàng:', error);
            const errorMessage = error.response?.data?.message || 'Không thể hủy đơn hàng';
            showToast(errorMessage, 'error');
        }
    };

    const handleDeleteOrder = async (orderId) => {
        if (!window.confirm('Bạn chắc chắn muốn xóa đơn hàng này?')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:3000/api/orders/${orderId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            showToast('Xóa đơn hàng thành công', 'success');
            fetchOrders();
        } catch (error) {
            console.error('Lỗi xóa đơn hàng:', error);
            const errorMessage = error.response?.data?.message || 'Không thể xóa đơn hàng';
            showToast(errorMessage, 'error');
        }
    };

    const handleReorder = (order) => {
        const selectedProducts = order.products.map(product => ({
            productId: product.productId || product._id,
            name: product.name,
            image: product.img,
            price: product.price,
            size: product.size,
            color: product.color,
            quantity: product.quantity
        }));

        localStorage.setItem('selectedProductsForCheckout', JSON.stringify(selectedProducts));

        navigate('/checkout/cart', {
            state: { selectedProducts }
        });

        showToast('Đã thêm vào giỏ hàng', 'success');
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Đang xử lý': return '#ffa726';
            case 'Đang giao': return '#3498db';
            case 'Đã giao': return '#66bb6a';
            case 'Đã hủy': return '#ef5350';
            default: return '#999';
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="container" style={{ marginTop: '20px' }}>
                <div style={{ background: 'white', padding: '20px', borderRadius: '4px', textAlign: 'center' }}>
                    <p>⏳ Đang tải đơn hàng...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container" style={{ marginTop: '20px', marginBottom: '40px' }}>
            <div style={{ background: 'white', padding: '20px', borderRadius: '4px' }}>
                <h2 style={{ borderBottom: '1px solid #eee', paddingBottom: '15px', marginTop: 0 }}>📦 Đơn Hàng Của Tôi</h2>

                {orders.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '50px' }}>
                        <div style={{ fontSize: '48px', marginBottom: '20px' }}>📦</div>
                        <p style={{ fontSize: '16px', color: '#666', marginBottom: '20px' }}>Bạn chưa có đơn hàng nào.</p>
                        <Link to="/" style={{ color: '#ee4d2d', textDecoration: 'none', fontWeight: 600, padding: '10px 20px', border: '1px solid #ee4d2d', borderRadius: '4px', display: 'inline-block' }}>🛍️ Tiếp tục mua sắm</Link>
                    </div>
                ) : (
                    <div style={{ marginTop: '20px' }}>
                        {orders.map((order) => (
                            <div key={order._id} style={{ border: '1px solid #ddd', marginBottom: '20px', borderRadius: '4px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                                {/* Đầu đơn hàng */}
                                <div style={{ background: '#fafafa', padding: '15px 20px', borderBottom: '1px solid #ddd', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                                    <div>
                                        <strong style={{ fontSize: '16px' }}>Đơn hàng #{order._id.toString().slice(-8).toUpperCase()}</strong>
                                        <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
                                            Ngày đặt: {formatDate(order.createdAt)}
                                        </div>
                                    </div>
                                    <span style={{ color: getStatusColor(order.status), fontWeight: 'bold', fontSize: '14px', background: getStatusColor(order.status) + '20', padding: '6px 12px', borderRadius: '4px' }}>
                                        {order.status}
                                    </span>
                                </div>

                                {/* Theo dõi đơn hàng */}
                                <OrderTracking status={order.status} />

                                {/* Chi tiết sản phẩm */}
                                <div style={{ padding: '20px', borderBottom: '1px solid #ddd' }}>
                                    <h4 style={{ margin: '0 0 15px', fontSize: '14px', fontWeight: 600, color: '#333' }}>Sản phẩm:</h4>
                                    {order.products && order.products.map((item, idx) => (
                                        <div key={idx} style={{ display: 'flex', gap: '15px', marginBottom: '15px', paddingBottom: '15px', borderBottom: idx < order.products.length - 1 ? '1px solid #eee' : 'none' }}>
                                            {item.img && (
                                                <img
                                                    src={item.img}
                                                    width="80"
                                                    height="80"
                                                    style={{ objectFit: 'cover', border: '1px solid #eee', borderRadius: '4px' }}
                                                    alt={item.name}
                                                />
                                            )}
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 600, marginBottom: '4px' }}>{item.name}</div>
                                                <div style={{ color: '#888', fontSize: '13px', marginBottom: '4px' }}>Số lượng: x{item.quantity}</div>
                                                <div style={{ color: '#ee4d2d', fontWeight: 600 }}>
                                                    {formatPrice(item.price)}
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'right', fontWeight: 600, color: '#ee4d2d', minWidth: '80px' }}>
                                                {formatPrice(item.price * item.quantity)}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Thông tin giao hàng */}
                                {order.shippingInfo && (
                                    <div style={{ padding: '15px 20px', background: '#f9f9f9', borderBottom: '1px solid #ddd', fontSize: '13px' }}>
                                        <div style={{ marginBottom: '8px', fontWeight: 600 }}>📍 Thông tin giao hàng:</div>
                                        <div style={{ marginBottom: '4px' }}>👤 {order.shippingInfo.fullName}</div>
                                        <div style={{ marginBottom: '4px' }}>📞 {order.shippingInfo.phone}</div>
                                        <div style={{ marginBottom: '4px' }}>🏠 {order.shippingInfo.address}{order.shippingInfo.ward ? ', ' + order.shippingInfo.ward : ''}{order.shippingInfo.district ? ', ' + order.shippingInfo.district : ''}{order.shippingInfo.city ? ', ' + order.shippingInfo.city : ''}</div>
                                        <div>💳 {order.paymentMethod === 'COD' ? 'Thanh toán khi nhận hàng (COD)' : order.paymentMethod === 'banking' ? 'Chuyển khoản ngân hàng' : order.paymentMethod}</div>
                                    </div>
                                )}

                                {/* Tổng tiền */}
                                <div style={{ padding: '15px 20px', background: '#fafafa', borderBottom: '1px solid #ddd' }}>
                                    {order.discountAmount > 0 && (
                                        <div style={{ marginBottom: '8px', color: '#e74c3c', fontSize: '13px' }}>
                                            Giảm giá {order.discountCode ? `(${order.discountCode})` : ''}: -{formatPrice(order.discountAmount)}
                                        </div>
                                    )}
                                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ee4d2d', textAlign: 'right' }}>
                                        Tổng tiền: {formatPrice(order.totalAmount)}
                                    </div>
                                </div>

                                {/* Nút hành động */}
                                <div style={{ padding: '15px 20px', display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                    {order.status === 'Đang xử lý' && (
                                        <button
                                            onClick={() => handleCancelOrder(order._id)}
                                            style={{
                                                padding: '8px 16px',
                                                background: '#ef5350',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                fontWeight: 600,
                                                fontSize: '13px'
                                            }}
                                        >
                                            ❌ Hủy đơn hàng
                                        </button>
                                    )}

                                    {order.status === 'Đã hủy' && (
                                        <>
                                            <button
                                                onClick={() => handleReorder(order)}
                                                style={{
                                                    padding: '8px 16px',
                                                    background: '#4CAF50',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    fontWeight: 600,
                                                    fontSize: '13px'
                                                }}
                                            >
                                                🔄 Đặt lại
                                            </button>
                                            <button
                                                onClick={() => handleDeleteOrder(order._id)}
                                                style={{
                                                    padding: '8px 16px',
                                                    background: '#999',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    fontWeight: 600,
                                                    fontSize: '13px'
                                                }}
                                            >
                                                🗑️ Xóa
                                            </button>
                                        </>
                                    )}
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