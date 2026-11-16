import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiUser, FiMail, FiCalendar, FiMapPin, FiShoppingBag, FiTag, FiDollarSign, FiArrowLeft, FiShield } from 'react-icons/fi';
import SectionHeader from '../components/SectionHeader';
import AdminCard from '../components/AdminCard';
import './AdminUserDetail.css';

export default function AdminUserDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [orders, setOrders] = useState([]);
    const [usedCoupons, setUsedCoupons] = useState([]);
    const [stats, setStats] = useState({ totalOrders: 0, totalSpent: 0, usedCoupons: 0 });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('orders');

    useEffect(() => {
        const fetchUserData = async () => {
            setLoading(true);
            try {
                const [userRes, ordersRes, couponsRes, statsRes] = await Promise.all([
                    fetch(`/api/users/${id}`),
                    fetch(`/api/users/${id}/orders`),
                    fetch(`/api/users/${id}/used-coupons`),
                    fetch(`/api/users/${id}/stats`)
                ]);

                if (userRes.ok) setUser(await userRes.json());
                if (ordersRes.ok) setOrders(await ordersRes.json());
                if (couponsRes.ok) setUsedCoupons(await couponsRes.json());
                if (statsRes.ok) setStats(await statsRes.json());
            } catch (err) {
                console.error("Error fetching user details:", err);
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchUserData();
    }, [id]);

    if (loading) {
        return (
            <div className="user-detail-page">
                <SectionHeader title="Đang tải dữ liệu..." />
                <div className="dtable__skeleton" style={{ height: '200px' }}></div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="user-detail-page">
                <SectionHeader title="Không tìm thấy người dùng" />
                <button className="adm-page__btn-cancel" onClick={() => navigate('/admin')}>Quay lại</button>
            </div>
        );
    }

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('vi-VN', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
    };

    const getStatusBadge = (status) => {
        let colorClass = 'sbadge--gray';
        const s = status?.toLowerCase() || '';
        if (s.includes('chờ') || s.includes('xử lý')) colorClass = 'sbadge--yellow';
        else if (s.includes('giao') || s.includes('vận chuyển')) colorClass = 'sbadge--blue';
        else if (s.includes('hoàn thành') || s.includes('đã giao')) colorClass = 'sbadge--green';
        else if (s.includes('hủy')) colorClass = 'sbadge--red';

        return (
            <span className={`sbadge ${colorClass}`}>
                <span className="sbadge__dot"></span>
                {status || 'Unknown'}
            </span>
        );
    };

    return (
        <div className="user-detail-page">
            <SectionHeader 
                title="Chi tiết thành viên" 
                subtitle="Quản lý thông tin, lịch sử mua hàng và khuyến mãi đã sử dụng"
                action={
                    <button className="adm-topbar__btn" onClick={() => navigate('/admin')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'var(--a-surface)', border: '1px solid var(--a-border)', borderRadius: 'var(--r-md)', cursor: 'pointer', fontWeight: 600 }}>
                        <FiArrowLeft /> Quay lại
                    </button>
                }
            />

            {/* Profile Header */}
            <div className="user-profile-header">
                <div className={`user-avatar-lg ${user.role === 'admin' ? 'admin' : ''}`}>
                    {user.role === 'admin' ? <FiShield /> : <FiUser />}
                </div>
                <div className="user-info-main">
                    <h2 className="user-name">{user.fullName || user.email.split('@')[0]}</h2>
                    <div className="user-email"><FiMail /> {user.email}</div>
                    <div className="user-meta-tags">
                        <span className="user-meta-tag"><FiCalendar /> Tham gia: {formatDate(user.createdAt)}</span>
                        {user.phone && <span className="user-meta-tag"><FiUser /> {user.phone}</span>}
                        {user.role === 'admin' && <span className="user-meta-tag" style={{ color: 'var(--a-primary)', borderColor: 'var(--a-primary-ring)', background: 'var(--a-primary-light)' }}><FiShield /> Quản trị viên</span>}
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="user-stats-grid">
                <div className="scard scard--primary">
                    <div className="scard__body">
                        <div className="scard__label">Tổng đơn hàng</div>
                        <div className="scard__value">{stats.totalOrders}</div>
                    </div>
                    <div className="scard__icon-wrap"><FiShoppingBag /></div>
                </div>
                <div className="scard scard--success">
                    <div className="scard__body">
                        <div className="scard__label">Tổng chi tiêu</div>
                        <div className="scard__value">{formatCurrency(stats.totalSpent)}</div>
                    </div>
                    <div className="scard__icon-wrap"><FiDollarSign /></div>
                </div>
                <div className="scard scard--warning">
                    <div className="scard__body">
                        <div className="scard__label">Voucher đã dùng</div>
                        <div className="scard__value">{stats.usedCoupons}</div>
                    </div>
                    <div className="scard__icon-wrap"><FiTag /></div>
                </div>
            </div>

            {/* Content Tabs */}
            <AdminCard noPadding>
                <div style={{ padding: '0 var(--sp-7)', paddingTop: 'var(--sp-5)' }}>
                    <div className="user-tabs">
                        <button className={`user-tab-btn ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>
                            Lịch sử đơn hàng ({orders.length})
                        </button>
                        <button className={`user-tab-btn ${activeTab === 'coupons' ? 'active' : ''}`} onClick={() => setActiveTab('coupons')}>
                            Voucher đã dùng ({usedCoupons.length})
                        </button>
                    </div>
                </div>

                <div className="dtable__wrap">
                    {activeTab === 'orders' && (
                        orders.length > 0 ? (
                            <table className="dtable__table">
                                <thead>
                                    <tr>
                                        <th className="dtable__th">Mã đơn</th>
                                        <th className="dtable__th">Ngày đặt</th>
                                        <th className="dtable__th">Sản phẩm</th>
                                        <th className="dtable__th">Tổng tiền</th>
                                        <th className="dtable__th">Giảm giá</th>
                                        <th className="dtable__th">Trạng thái</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.map(order => (
                                        <tr key={order._id} className="dtable__tr">
                                            <td className="dtable__td" style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--a-primary)' }}>
                                                #{order._id.substring(order._id.length - 6).toUpperCase()}
                                            </td>
                                            <td className="dtable__td">{formatDate(order.createdAt)}</td>
                                            <td className="dtable__td">{order.products?.length || 0} món</td>
                                            <td className="dtable__td" style={{ fontWeight: 600 }}>{formatCurrency(order.totalAmount)}</td>
                                            <td className="dtable__td" style={{ color: 'var(--a-danger)' }}>
                                                {order.discountAmount || order.voucherDiscount ? `-${formatCurrency((order.discountAmount || 0) + (order.voucherDiscount || 0))}` : '0 ₫'}
                                            </td>
                                            <td className="dtable__td">{getStatusBadge(order.status)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="user-empty-state">
                                <div className="user-empty-icon"><FiShoppingBag /></div>
                                <h3>Chưa có đơn hàng nào</h3>
                                <p>Người dùng này chưa thực hiện giao dịch nào trên hệ thống.</p>
                            </div>
                        )
                    )}

                    {activeTab === 'coupons' && (
                        usedCoupons.length > 0 ? (
                            <table className="dtable__table">
                                <thead>
                                    <tr>
                                        <th className="dtable__th">Mã Voucher</th>
                                        <th className="dtable__th">Ngày sử dụng</th>
                                        <th className="dtable__th">Mã đơn hàng</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {usedCoupons.map(coupon => (
                                        <tr key={coupon._id} className="dtable__tr">
                                            <td className="dtable__td">
                                                <span style={{ background: 'var(--a-surface-alt)', padding: '4px 12px', borderRadius: '4px', fontWeight: 700, letterSpacing: '1px' }}>
                                                    {coupon.couponCode}
                                                </span>
                                            </td>
                                            <td className="dtable__td">{formatDate(coupon.usedAt)}</td>
                                            <td className="dtable__td" style={{ fontFamily: 'monospace', color: 'var(--a-primary)' }}>
                                                {coupon.orderId ? `#${coupon.orderId.substring(coupon.orderId.length - 6).toUpperCase()}` : 'N/A'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="user-empty-state">
                                <div className="user-empty-icon"><FiTag /></div>
                                <h3>Chưa sử dụng voucher</h3>
                                <p>Người dùng này chưa áp dụng bất kỳ mã giảm giá nào.</p>
                            </div>
                        )
                    )}
                </div>
            </AdminCard>
        </div>
    );
}
