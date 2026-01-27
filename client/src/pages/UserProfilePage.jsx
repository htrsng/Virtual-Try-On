import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

function UserProfilePage({ showToast }) {
    const navigate = useNavigate();
    const { user, isAuthenticated, updateProfile } = useAuth();

    const [activeTab, setActiveTab] = useState('profile'); // profile, orders
    const [orders, setOrders] = useState([]);
    const [loadingOrders, setLoadingOrders] = useState(false);

    // Thông tin người dùng để chỉnh sửa
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [city, setCity] = useState('');
    const [district, setDistrict] = useState('');
    const [ward, setWard] = useState('');

    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        if (!isAuthenticated) {
            showToast("Vui lòng đăng nhập để xem trang này!", "warning");
            navigate('/login');
            return;
        }

        // Load thông tin user
        if (user) {
            setFullName(user.fullName || '');
            setPhone(user.phone || '');
            setAddress(user.address || '');
            setCity(user.city || '');
            setDistrict(user.district || '');
            setWard(user.ward || '');
        }

        // Load đơn hàng
        fetchOrders();
    }, [user, isAuthenticated]);

    const fetchOrders = async () => {
        setLoadingOrders(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:3000/api/orders/my-orders', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setOrders(response.data);
        } catch (error) {
            console.error('Lỗi lấy đơn hàng:', error);
            showToast('Không thể tải đơn hàng', 'error');
        } finally {
            setLoadingOrders(false);
        }
    };

    const handleCancelOrder = async (orderId) => {
        if (!window.confirm('Bạn có chắc chắn muốn hủy đơn hàng này?')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await axios.put(
                `http://localhost:3000/api/orders/${orderId}/cancel`,
                { reason: 'Khách hàng hủy đơn' },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            showToast('Đã hủy đơn hàng thành công', 'success');
            fetchOrders(); // Reload danh sách đơn hàng
        } catch (error) {
            console.error('Lỗi hủy đơn hàng:', error);
            const errorMessage = error.response?.data?.message || 'Không thể hủy đơn hàng';
            showToast(errorMessage, 'error');
        }
    };

    const handleDeleteOrder = async (orderId) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa đơn hàng này?')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:3000/api/orders/${orderId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            showToast('Đã xóa đơn hàng thành công', 'success');
            fetchOrders(); // Reload danh sách đơn hàng
        } catch (error) {
            console.error('Lỗi xóa đơn hàng:', error);
            const errorMessage = error.response?.data?.message || 'Không thể xóa đơn hàng';
            showToast(errorMessage, 'error');
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();

        const result = await updateProfile({
            fullName,
            phone,
            address,
            city,
            district,
            ward
        });

        if (result.success) {
            showToast(result.message, 'success');
            setIsEditing(false);
        } else {
            showToast(result.message, 'error');
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
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

    const getStatusColor = (status) => {
        switch (status) {
            case 'Đang xử lý': return '#ffa726';
            case 'Đã giao': return '#66bb6a';
            case 'Đã hủy': return '#ef5350';
            default: return '#999';
        }
    };

    return (
        <div className="container" style={{ marginTop: '20px', marginBottom: '50px' }}>
            <div style={{
                background: 'white',
                borderRadius: '8px',
                overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
                {/* Header */}
                <div style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    padding: '30px',
                    color: 'white'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '50%',
                            background: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '40px'
                        }}>
                            👤
                        </div>
                        <div>
                            <h2 style={{ margin: '0 0 5px 0', fontSize: '28px' }}>
                                {user?.fullName || user?.email}
                            </h2>
                            <p style={{ margin: 0, opacity: 0.9 }}>
                                📧 {user?.email}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div style={{
                    display: 'flex',
                    borderBottom: '2px solid #f0f0f0',
                    background: '#fafafa'
                }}>
                    <button
                        onClick={() => setActiveTab('profile')}
                        style={{
                            flex: 1,
                            padding: '15px',
                            border: 'none',
                            background: activeTab === 'profile' ? 'white' : 'transparent',
                            color: activeTab === 'profile' ? '#667eea' : '#666',
                            fontWeight: activeTab === 'profile' ? 'bold' : 'normal',
                            cursor: 'pointer',
                            fontSize: '16px',
                            borderBottom: activeTab === 'profile' ? '3px solid #667eea' : 'none'
                        }}
                    >
                        📝 Thông tin cá nhân
                    </button>
                    <button
                        onClick={() => setActiveTab('orders')}
                        style={{
                            flex: 1,
                            padding: '15px',
                            border: 'none',
                            background: activeTab === 'orders' ? 'white' : 'transparent',
                            color: activeTab === 'orders' ? '#667eea' : '#666',
                            fontWeight: activeTab === 'orders' ? 'bold' : 'normal',
                            cursor: 'pointer',
                            fontSize: '16px',
                            borderBottom: activeTab === 'orders' ? '3px solid #667eea' : 'none'
                        }}
                    >
                        📦 Đơn hàng của tôi ({orders.length})
                    </button>
                </div>

                {/* Content */}
                <div style={{ padding: '30px' }}>
                    {activeTab === 'profile' && (
                        <div>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '20px'
                            }}>
                                <h3 style={{ margin: 0 }}>Thông tin cá nhân</h3>
                                <button
                                    onClick={() => setIsEditing(!isEditing)}
                                    style={{
                                        padding: '8px 20px',
                                        background: isEditing ? '#f44336' : '#667eea',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    {isEditing ? '❌ Hủy' : '✏️ Chỉnh sửa'}
                                </button>
                            </div>

                            <form onSubmit={handleUpdateProfile}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '5px', color: '#666', fontWeight: '500' }}>
                                            Họ và tên
                                        </label>
                                        <input
                                            type="text"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            disabled={!isEditing}
                                            style={{
                                                width: '100%',
                                                padding: '10px',
                                                border: '1px solid #ddd',
                                                borderRadius: '4px',
                                                background: isEditing ? 'white' : '#f5f5f5'
                                            }}
                                        />
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', marginBottom: '5px', color: '#666', fontWeight: '500' }}>
                                            Số điện thoại
                                        </label>
                                        <input
                                            type="tel"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            disabled={!isEditing}
                                            style={{
                                                width: '100%',
                                                padding: '10px',
                                                border: '1px solid #ddd',
                                                borderRadius: '4px',
                                                background: isEditing ? 'white' : '#f5f5f5'
                                            }}
                                        />
                                    </div>

                                    <div style={{ gridColumn: '1 / -1' }}>
                                        <label style={{ display: 'block', marginBottom: '5px', color: '#666', fontWeight: '500' }}>
                                            Địa chỉ
                                        </label>
                                        <input
                                            type="text"
                                            value={address}
                                            onChange={(e) => setAddress(e.target.value)}
                                            disabled={!isEditing}
                                            style={{
                                                width: '100%',
                                                padding: '10px',
                                                border: '1px solid #ddd',
                                                borderRadius: '4px',
                                                background: isEditing ? 'white' : '#f5f5f5'
                                            }}
                                        />
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', marginBottom: '5px', color: '#666', fontWeight: '500' }}>
                                            Thành phố/Tỉnh
                                        </label>
                                        <input
                                            type="text"
                                            value={city}
                                            onChange={(e) => setCity(e.target.value)}
                                            disabled={!isEditing}
                                            style={{
                                                width: '100%',
                                                padding: '10px',
                                                border: '1px solid #ddd',
                                                borderRadius: '4px',
                                                background: isEditing ? 'white' : '#f5f5f5'
                                            }}
                                        />
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', marginBottom: '5px', color: '#666', fontWeight: '500' }}>
                                            Quận/Huyện
                                        </label>
                                        <input
                                            type="text"
                                            value={district}
                                            onChange={(e) => setDistrict(e.target.value)}
                                            disabled={!isEditing}
                                            style={{
                                                width: '100%',
                                                padding: '10px',
                                                border: '1px solid #ddd',
                                                borderRadius: '4px',
                                                background: isEditing ? 'white' : '#f5f5f5'
                                            }}
                                        />
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', marginBottom: '5px', color: '#666', fontWeight: '500' }}>
                                            Phường/Xã
                                        </label>
                                        <input
                                            type="text"
                                            value={ward}
                                            onChange={(e) => setWard(e.target.value)}
                                            disabled={!isEditing}
                                            style={{
                                                width: '100%',
                                                padding: '10px',
                                                border: '1px solid #ddd',
                                                borderRadius: '4px',
                                                background: isEditing ? 'white' : '#f5f5f5'
                                            }}
                                        />
                                    </div>
                                </div>

                                {isEditing && (
                                    <button
                                        type="submit"
                                        style={{
                                            marginTop: '20px',
                                            padding: '12px 40px',
                                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            fontWeight: 'bold',
                                            fontSize: '16px'
                                        }}
                                    >
                                        💾 Lưu thông tin
                                    </button>
                                )}
                            </form>
                        </div>
                    )}

                    {activeTab === 'orders' && (
                        <div>
                            <h3 style={{ marginTop: 0 }}>Đơn hàng của tôi</h3>

                            {loadingOrders ? (
                                <div style={{ textAlign: 'center', padding: '40px' }}>
                                    Đang tải đơn hàng...
                                </div>
                            ) : orders.length === 0 ? (
                                <div style={{
                                    textAlign: 'center',
                                    padding: '60px 20px',
                                    background: '#f9f9f9',
                                    borderRadius: '8px'
                                }}>
                                    <div style={{ fontSize: '60px', marginBottom: '20px' }}>📦</div>
                                    <p style={{ fontSize: '18px', color: '#666' }}>
                                        Bạn chưa có đơn hàng nào
                                    </p>
                                    <button
                                        onClick={() => navigate('/')}
                                        style={{
                                            marginTop: '20px',
                                            padding: '12px 30px',
                                            background: '#667eea',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            fontWeight: 'bold'
                                        }}
                                    >
                                        🛍️ Mua sắm ngay
                                    </button>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    {orders.map((order) => (
                                        <div
                                            key={order._id}
                                            style={{
                                                border: '1px solid #e0e0e0',
                                                borderRadius: '8px',
                                                overflow: 'hidden'
                                            }}
                                        >
                                            {/* Order Header */}
                                            <div style={{
                                                background: '#f5f5f5',
                                                padding: '15px 20px',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center'
                                            }}>
                                                <div>
                                                    <span style={{ fontWeight: 'bold', marginRight: '15px' }}>
                                                        Đơn hàng: #{order._id.slice(-8)}
                                                    </span>
                                                    <span style={{ color: '#666' }}>
                                                        {formatDate(order.createdAt)}
                                                    </span>
                                                </div>
                                                <div style={{
                                                    padding: '5px 15px',
                                                    borderRadius: '20px',
                                                    background: getStatusColor(order.status),
                                                    color: 'white',
                                                    fontWeight: 'bold',
                                                    fontSize: '14px'
                                                }}>
                                                    {order.status}
                                                </div>
                                            </div>

                                            {/* Order Products */}
                                            <div style={{ padding: '20px' }}>
                                                {order.products.map((product, index) => (
                                                    <div
                                                        key={index}
                                                        style={{
                                                            display: 'flex',
                                                            gap: '15px',
                                                            marginBottom: index < order.products.length - 1 ? '15px' : '0',
                                                            paddingBottom: index < order.products.length - 1 ? '15px' : '0',
                                                            borderBottom: index < order.products.length - 1 ? '1px solid #f0f0f0' : 'none'
                                                        }}
                                                    >
                                                        <img
                                                            src={product.img}
                                                            alt={product.name}
                                                            style={{
                                                                width: '80px',
                                                                height: '80px',
                                                                objectFit: 'cover',
                                                                borderRadius: '4px',
                                                                border: '1px solid #e0e0e0'
                                                            }}
                                                        />
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ fontWeight: '500', marginBottom: '5px' }}>
                                                                {product.name}
                                                            </div>
                                                            <div style={{ color: '#666', fontSize: '14px' }}>
                                                                Số lượng: {product.quantity}
                                                            </div>
                                                        </div>
                                                        <div style={{
                                                            color: '#ee4d2d',
                                                            fontWeight: 'bold',
                                                            alignSelf: 'center'
                                                        }}>
                                                            {formatPrice(product.price)}
                                                        </div>
                                                    </div>
                                                ))}

                                                {/* Order Total */}
                                                <div style={{
                                                    marginTop: '20px',
                                                    paddingTop: '15px',
                                                    borderTop: '2px solid #f0f0f0',
                                                    textAlign: 'right'
                                                }}>
                                                    <span style={{ fontSize: '16px', marginRight: '10px' }}>
                                                        Tổng tiền:
                                                    </span>
                                                    <span style={{
                                                        fontSize: '24px',
                                                        fontWeight: 'bold',
                                                        color: '#ee4d2d'
                                                    }}>
                                                        {formatPrice(order.totalAmount)}
                                                    </span>
                                                </div>

                                                {/* Shipping Info */}
                                                <div style={{
                                                    marginTop: '15px',
                                                    padding: '15px',
                                                    background: '#f9f9f9',
                                                    borderRadius: '4px',
                                                    fontSize: '14px'
                                                }}>
                                                    <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                                                        📍 Thông tin giao hàng
                                                    </div>
                                                    <div>👤 {order.shippingInfo.fullName}</div>
                                                    <div>📞 {order.shippingInfo.phone}</div>
                                                    <div>🏠 {order.shippingInfo.address}, {order.shippingInfo.ward}, {order.shippingInfo.district}, {order.shippingInfo.city}</div>
                                                    <div>💳 {order.paymentMethod}</div>
                                                </div>

                                                {/* Nút hủy đơn hàng */}
                                                {order.status === 'Đang xử lý' && (
                                                    <div style={{ marginTop: '15px', textAlign: 'right' }}>
                                                        <button
                                                            onClick={() => handleCancelOrder(order._id)}
                                                            style={{
                                                                padding: '10px 25px',
                                                                background: '#f44336',
                                                                color: 'white',
                                                                border: 'none',
                                                                borderRadius: '4px',
                                                                cursor: 'pointer',
                                                                fontWeight: 'bold',
                                                                fontSize: '14px',
                                                                transition: 'background 0.3s'
                                                            }}
                                                            onMouseOver={(e) => e.target.style.background = '#d32f2f'}
                                                            onMouseOut={(e) => e.target.style.background = '#f44336'}
                                                        >
                                                            ❌ Hủy đơn hàng
                                                        </button>
                                                    </div>
                                                )}

                                                {/* Nút xóa đơn hàng đã hủy */}
                                                {order.status === 'Đã hủy' && (
                                                    <div style={{ marginTop: '15px', textAlign: 'right' }}>
                                                        <button
                                                            onClick={() => handleDeleteOrder(order._id)}
                                                            style={{
                                                                padding: '10px 25px',
                                                                background: '#757575',
                                                                color: 'white',
                                                                border: 'none',
                                                                borderRadius: '4px',
                                                                cursor: 'pointer',
                                                                fontWeight: 'bold',
                                                                fontSize: '14px',
                                                                transition: 'background 0.3s'
                                                            }}
                                                            onMouseOver={(e) => e.target.style.background = '#616161'}
                                                            onMouseOut={(e) => e.target.style.background = '#757575'}
                                                        >
                                                            🗑️ Xóa đơn hàng
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default UserProfilePage;
