import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import MapPicker from '../components/MapPicker';
import { getCities, getDistricts, getWards } from '../data/vietnamAddress';
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
    const [showMapPicker, setShowMapPicker] = useState(false);

    // Danh sách dropdown
    const [cities] = useState(getCities());
    const [districts, setDistricts] = useState([]);
    const [wards, setWards] = useState([]);

    // Cập nhật districts khi chọn city
    useEffect(() => {
        if (city) {
            const districtList = getDistricts(city);
            setDistricts(districtList);
            // Reset district và ward nếu không hợp lệ
            if (!districtList.includes(district)) {
                setDistrict('');
                setWard('');
            }
        } else {
            setDistricts([]);
            setWards([]);
        }
    }, [city]);

    // Cập nhật wards khi chọn district
    useEffect(() => {
        if (city && district) {
            const wardList = getWards(city, district);
            setWards(wardList);
            // Reset ward nếu không hợp lệ
            if (!wardList.includes(ward)) {
                setWard('');
            }
        } else {
            setWards([]);
        }
    }, [city, district]);

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

    const handleReorder = (order) => {
        // Chuyển đổi các products từ đơn hàng sang format của selectedProducts
        const selectedProducts = order.products.map(product => ({
            productId: product.productId || product._id,
            name: product.name,
            image: product.img,
            price: product.price,
            size: product.size,
            color: product.color,
            quantity: product.quantity
        }));

        // Lưu vào localStorage để CheckoutPage có thể đọc
        localStorage.setItem('selectedProductsForCheckout', JSON.stringify(selectedProducts));

        // Navigate đến trang checkout với state
        navigate('/checkout/cart', {
            state: { selectedProducts }
        });

        showToast('Đã thêm sản phẩm vào giỏ hàng!', 'success');
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
        <div className="container user-profile-page">
            <div className="user-profile-shell">
                {/* Header */}
                <div className="user-profile-hero">
                    <div className="user-profile-hero-inner">
                        <div className="user-profile-avatar">👤</div>
                        <div className="user-profile-info">
                            <h2>{user?.fullName || user?.email}</h2>
                            <p>📧 {user?.email}</p>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="user-profile-tabs">
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`user-profile-tab ${activeTab === 'profile' ? 'active' : ''}`}
                    >
                        📝 Thông tin cá nhân
                    </button>
                    <button
                        onClick={() => setActiveTab('orders')}
                        className={`user-profile-tab ${activeTab === 'orders' ? 'active' : ''}`}
                    >
                        📦 Đơn hàng của tôi ({orders.length})
                    </button>
                </div>

                {/* Content */}
                <div className="user-profile-content">
                    {activeTab === 'profile' && (
                        <div>
                            <div className="profile-section-header">
                                <h3 className="profile-section-title">Thông tin cá nhân</h3>
                                <button
                                    onClick={() => setIsEditing(!isEditing)}
                                    className={`profile-edit-btn ${isEditing ? 'danger' : ''}`}
                                >
                                    {isEditing ? '❌ Hủy' : '✏️ Chỉnh sửa'}
                                </button>
                            </div>

                            <form onSubmit={handleUpdateProfile}>
                                <div className="profile-grid">
                                    <div className="profile-field">
                                        <label className="profile-label">
                                            Họ và tên
                                        </label>
                                        <input
                                            type="text"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            disabled={!isEditing}
                                            className="profile-input"
                                        />
                                    </div>

                                    <div className="profile-field">
                                        <label className="profile-label">
                                            Số điện thoại
                                        </label>
                                        <input
                                            type="tel"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            disabled={!isEditing}
                                            className="profile-input"
                                        />
                                    </div>

                                    <div className="profile-field">
                                        <label className="profile-label">
                                            Tỉnh/Thành phố <span style={{ color: 'red' }}>*</span>
                                        </label>
                                        <select
                                            value={city}
                                            onChange={(e) => setCity(e.target.value)}
                                            disabled={!isEditing}
                                            className="profile-select"
                                        >
                                            <option value="">-- Chọn Tỉnh/Thành phố --</option>
                                            {cities.map(c => (
                                                <option key={c} value={c}>{c}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="profile-field">
                                        <label className="profile-label">
                                            Quận/Huyện <span style={{ color: 'red' }}>*</span>
                                        </label>
                                        <select
                                            value={district}
                                            onChange={(e) => setDistrict(e.target.value)}
                                            disabled={!isEditing || !city}
                                            className="profile-select"
                                        >
                                            <option value="">-- Chọn Quận/Huyện --</option>
                                            {districts.map(d => (
                                                <option key={d} value={d}>{d}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="profile-field">
                                        <label className="profile-label">
                                            Phường/Xã <span style={{ color: 'red' }}>*</span>
                                        </label>
                                        <select
                                            value={ward}
                                            onChange={(e) => setWard(e.target.value)}
                                            disabled={!isEditing || !district}
                                            className="profile-select"
                                        >
                                            <option value="">-- Chọn Phường/Xã --</option>
                                            {wards.map(w => (
                                                <option key={w} value={w}>{w}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="profile-field full">
                                        <label className="profile-label">
                                            Số nhà, tên đường <span style={{ color: 'red' }}>*</span>
                                        </label>
                                        <div className="profile-input-wrapper">
                                            <input
                                                type="text"
                                                value={address}
                                                onChange={(e) => setAddress(e.target.value)}
                                                disabled={!isEditing}
                                                placeholder={isEditing ? "Ví dụ: Số 123, Đường Nguyễn Văn A" : ""}
                                                className={`profile-input ${!isEditing && address ? 'has-action' : ''}`}
                                            />
                                            {!isEditing && address && city && district && ward && (
                                                <button
                                                    type="button"
                                                    onClick={() => setShowMapPicker(!showMapPicker)}
                                                    className="profile-map-btn"
                                                    title="Xem vị trí trên bản đồ"
                                                >
                                                    📍
                                                </button>
                                            )}
                                        </div>
                                        {showMapPicker && !isEditing && address && city && district && ward && (
                                            <div className="profile-map">
                                                <MapPicker address={`${address}, ${ward}, ${district}, ${city}`} />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {isEditing && (
                                    <button
                                        type="submit"
                                        className="profile-save-btn"
                                    >
                                        💾 Lưu thông tin
                                    </button>
                                )}
                            </form>
                        </div>
                    )}

                    {activeTab === 'orders' && (
                        <div>
                            <h3 className="profile-section-title">Đơn hàng của tôi</h3>

                            {loadingOrders ? (
                                <div className="profile-orders-loading">
                                    Đang tải đơn hàng...
                                </div>
                            ) : orders.length === 0 ? (
                                <div className="profile-orders-empty">
                                    <div className="profile-orders-empty-icon">📦</div>
                                    <p>Bạn chưa có đơn hàng nào</p>
                                    <button
                                        onClick={() => navigate('/')}
                                        className="profile-orders-cta"
                                    >
                                        🛍️ Mua sắm ngay
                                    </button>
                                </div>
                            ) : (
                                <div className="profile-order-list">
                                    {orders.map((order) => (
                                        <div
                                            key={order._id}
                                            className="profile-order-card"
                                        >
                                            {/* Order Header */}
                                            <div className="profile-order-header">
                                                <div className="profile-order-meta">
                                                    <span className="profile-order-id">
                                                        Đơn hàng: #{order._id.slice(-8)}
                                                    </span>
                                                    <span className="profile-order-date">
                                                        {formatDate(order.createdAt)}
                                                    </span>
                                                </div>
                                                <div
                                                    className="profile-order-status"
                                                    style={{ background: getStatusColor(order.status) }}
                                                >
                                                    {order.status}
                                                </div>
                                            </div>

                                            {/* Order Products */}
                                            <div className="profile-order-body">
                                                {order.products.map((product, index) => (
                                                    <div
                                                        key={index}
                                                        className={`profile-order-item ${index < order.products.length - 1 ? 'with-divider' : ''}`}
                                                    >
                                                        <img
                                                            src={product.img}
                                                            alt={product.name}
                                                            className="profile-order-image"
                                                        />
                                                        <div className="profile-order-info">
                                                            <div className="profile-order-name">
                                                                {product.name}
                                                            </div>
                                                            <div className="profile-order-qty">
                                                                Số lượng: {product.quantity}
                                                            </div>
                                                        </div>
                                                        <div className="profile-order-price">
                                                            {formatPrice(product.price)}
                                                        </div>
                                                    </div>
                                                ))}

                                                {/* Order Total */}
                                                <div className="profile-order-total">
                                                    <span className="profile-order-total-label">
                                                        Tổng tiền:
                                                    </span>
                                                    <span className="profile-order-total-value">
                                                        {formatPrice(order.totalAmount)}
                                                    </span>
                                                </div>

                                                {/* Shipping Info */}
                                                <div className="profile-shipping">
                                                    <div className="profile-shipping-title">
                                                        📍 Thông tin giao hàng
                                                    </div>
                                                    <div>👤 {order.shippingInfo.fullName}</div>
                                                    <div>📞 {order.shippingInfo.phone}</div>
                                                    <div>🏠 {order.shippingInfo.address}, {order.shippingInfo.ward}, {order.shippingInfo.district}, {order.shippingInfo.city}</div>
                                                    <div>💳 {order.paymentMethod}</div>
                                                </div>

                                                {/* Nút hủy đơn hàng */}
                                                {order.status === 'Đang xử lý' && (
                                                    <div className="profile-order-actions">
                                                        <button
                                                            onClick={() => handleCancelOrder(order._id)}
                                                            className="btn-danger"
                                                        >
                                                            ❌ Hủy đơn hàng
                                                        </button>
                                                    </div>
                                                )}

                                                {/* Nút xóa đơn hàng đã hủy */}
                                                {order.status === 'Đã hủy' && (
                                                    <div className="profile-order-actions">
                                                        <button
                                                            onClick={() => handleReorder(order)}
                                                            className="btn-success"
                                                        >
                                                            🔄 Đặt lại
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteOrder(order._id)}
                                                            className="btn-muted"
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
