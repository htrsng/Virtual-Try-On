import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'http://localhost:3000';

const STATUS_CONFIG = {
    'Tất cả':   { color: '#6B7280', bg: '#F3F4F6', icon: '📋' },
    'Đang xử lý': { color: '#D97706', bg: '#FEF3C7', icon: '⏳' },
    'Đang giao':  { color: '#2563EB', bg: '#DBEAFE', icon: '🚚' },
    'Đã giao':    { color: '#059669', bg: '#D1FAE5', icon: '✅' },
    'Đã hủy':    { color: '#DC2626', bg: '#FEE2E2', icon: '❌' },
};

const TRACK_STEPS = [
    { key: 'Đang xử lý', label: 'Đặt hàng', icon: '🧾', color: '#D97706' },
    { key: 'Đang giao',  label: 'Đang giao', icon: '🚚', color: '#2563EB' },
    { key: 'Đã giao',   label: 'Đã nhận',  icon: '✅', color: '#059669' },
];

function OrderPage({ showToast }) {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('Tất cả');
    const [expandedId, setExpandedId] = useState(null);

    useEffect(() => { fetchOrders(); }, []);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) { showToast('Vui lòng đăng nhập', 'warning'); navigate('/login'); return; }
            const res = await axios.get(`${API_URL}/api/orders/my-orders`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setOrders(res.data || []);
        } catch (err) {
            showToast(err.response?.data?.message || 'Không thể tải đơn hàng', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async (orderId) => {
        if (!window.confirm('Xác nhận hủy đơn hàng này?')) return;
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${API_URL}/api/orders/${orderId}/cancel`, { reason: 'Khách hàng hủy' }, { headers: { Authorization: `Bearer ${token}` } });
            showToast('Hủy đơn thành công', 'success'); fetchOrders();
        } catch (err) { showToast(err.response?.data?.message || 'Không thể hủy', 'error'); }
    };

    const handleDelete = async (orderId) => {
        if (!window.confirm('Xóa đơn hàng này khỏi lịch sử?')) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/api/orders/${orderId}`, { headers: { Authorization: `Bearer ${token}` } });
            showToast('Đã xóa đơn hàng', 'success'); fetchOrders();
        } catch (err) { showToast(err.response?.data?.message || 'Không thể xóa', 'error'); }
    };

    const handleReorder = (order) => {
        const items = order.products.map(p => ({ productId: p.productId || p._id, name: p.name, image: p.img, price: p.price, size: p.size, color: p.color, quantity: p.quantity }));
        localStorage.setItem('selectedProductsForCheckout', JSON.stringify(items));
        navigate('/checkout/cart', { state: { selectedProducts: items } });
        showToast('Đã thêm vào giỏ hàng', 'success');
    };

    const fmt = (p) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);
    const fmtDate = (d) => new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    const tabs = ['Tất cả', 'Đang xử lý', 'Đang giao', 'Đã giao', 'Đã hủy'];
    const filtered = activeTab === 'Tất cả' ? orders : orders.filter(o => o.status === activeTab);
    const counts = tabs.reduce((acc, t) => { acc[t] = t === 'Tất cả' ? orders.length : orders.filter(o => o.status === t).length; return acc; }, {});
    const totalSpent = orders.filter(o => o.status === 'Đã giao').reduce((s, o) => s + o.totalAmount, 0);

    if (loading) return (
        <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F9F7F4' }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{ width: 48, height: 48, border: '3px solid #E5E7EB', borderTop: '3px solid #C9963F', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
                <p style={{ color: '#6B7280', fontSize: 15 }}>Đang tải đơn hàng…</p>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', background: '#F9F7F4', padding: '32px 0 64px' }}>
            <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 16px' }}>

                {/* ── Page Header ── */}
                <div style={{ marginBottom: 28 }}>
                    <h1 style={{ fontSize: 26, fontWeight: 800, color: '#1C1009', margin: '0 0 4px', letterSpacing: '-0.5px' }}>
                        📦 Đơn Hàng Của Tôi
                    </h1>
                    <p style={{ color: '#6B7280', fontSize: 14, margin: 0 }}>Theo dõi và quản lý toàn bộ lịch sử mua hàng</p>
                </div>

                {/* ── Stats Row ── */}
                {orders.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
                        {[
                            { label: 'Tổng đơn hàng', value: orders.length, icon: '🧾', color: '#C9963F' },
                            { label: 'Đã giao thành công', value: counts['Đã giao'], icon: '✅', color: '#059669' },
                            { label: 'Tổng chi tiêu', value: fmt(totalSpent), icon: '💰', color: '#7C3AED', big: true },
                        ].map((stat, i) => (
                            <div key={i} style={{ background: '#fff', borderRadius: 14, padding: '18px 20px', boxShadow: '0 1px 6px rgba(0,0,0,0.06)', border: '1px solid #EDE8DF', display: 'flex', alignItems: 'center', gap: 14 }}>
                                <div style={{ width: 44, height: 44, borderRadius: 10, background: stat.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{stat.icon}</div>
                                <div>
                                    <div style={{ fontSize: stat.big ? 14 : 22, fontWeight: 800, color: stat.color, lineHeight: 1.2 }}>{stat.value}</div>
                                    <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{stat.label}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* ── Status Filter Tabs ── */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 20, overflowX: 'auto', paddingBottom: 4 }}>
                    {tabs.map(tab => {
                        const cfg = STATUS_CONFIG[tab];
                        const isActive = activeTab === tab;
                        return (
                            <button key={tab} onClick={() => setActiveTab(tab)} style={{
                                padding: '8px 16px', borderRadius: 24, border: isActive ? `1.5px solid ${tab === 'Tất cả' ? '#C9963F' : cfg.color}` : '1.5px solid #E5E7EB',
                                background: isActive ? (tab === 'Tất cả' ? 'rgba(201,150,63,0.1)' : cfg.bg) : '#fff',
                                color: isActive ? (tab === 'Tất cả' ? '#C9963F' : cfg.color) : '#6B7280',
                                fontWeight: isActive ? 700 : 500, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap',
                                transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 6
                            }}>
                                {tab !== 'Tất cả' && <span>{cfg.icon}</span>}
                                {tab}
                                {counts[tab] > 0 && (
                                    <span style={{ background: isActive ? (tab === 'Tất cả' ? '#C9963F' : cfg.color) : '#E5E7EB', color: isActive ? '#fff' : '#6B7280', borderRadius: 12, padding: '1px 7px', fontSize: 11, fontWeight: 700 }}>
                                        {counts[tab]}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* ── Empty State ── */}
                {filtered.length === 0 && (
                    <div style={{ background: '#fff', borderRadius: 16, padding: '64px 32px', textAlign: 'center', border: '1px solid #EDE8DF' }}>
                        <div style={{ fontSize: 56, marginBottom: 16 }}>📦</div>
                        <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1C1009', margin: '0 0 8px' }}>
                            {activeTab === 'Tất cả' ? 'Chưa có đơn hàng nào' : `Không có đơn "${activeTab}"`}
                        </h3>
                        <p style={{ color: '#6B7280', fontSize: 14, marginBottom: 24 }}>
                            {activeTab === 'Tất cả' ? 'Hãy khám phá và đặt món hàng đầu tiên của bạn!' : 'Chuyển tab khác để xem các đơn hàng.'}
                        </p>
                        {activeTab === 'Tất cả' && (
                            <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg, #C9963F, #D4A942)', color: '#fff', padding: '12px 28px', borderRadius: 10, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
                                🛍️ Khám phá sản phẩm
                            </Link>
                        )}
                    </div>
                )}

                {/* ── Order Cards ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {filtered.map(order => {
                        const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG['Tất cả'];
                        const isOpen = expandedId === order._id;
                        const stepIdx = TRACK_STEPS.findIndex(s => s.key === order.status);
                        const isCancelled = order.status === 'Đã hủy';

                        return (
                            <div key={order._id} style={{ background: '#fff', borderRadius: 16, border: '1px solid #EDE8DF', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', transition: 'box-shadow 0.2s' }}>

                                {/* Card Header */}
                                <div style={{ padding: '18px 22px', borderBottom: '1px solid #F3F0EB', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', cursor: 'pointer', background: '#FDFBF8' }}
                                    onClick={() => setExpandedId(isOpen ? null : order._id)}>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                                            <span style={{ fontWeight: 800, fontSize: 15, color: '#1C1009', letterSpacing: 0.3 }}>
                                                #{order._id.toString().slice(-8).toUpperCase()}
                                            </span>
                                            <span style={{ background: cfg.bg, color: cfg.color, fontWeight: 700, fontSize: 12, padding: '3px 10px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                {cfg.icon} {order.status}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: 12, color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: 14 }}>
                                            <span>🕐 {fmtDate(order.createdAt)}</span>
                                            <span>📦 {order.products?.length || 0} sản phẩm</span>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontWeight: 800, fontSize: 17, color: '#C9963F' }}>{fmt(order.totalAmount)}</div>
                                        <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{isOpen ? '▲ Thu gọn' : '▼ Xem chi tiết'}</div>
                                    </div>
                                </div>

                                {/* Expanded Detail */}
                                {isOpen && (
                                    <div>
                                        {/* Progress Tracker */}
                                        <div style={{ padding: '20px 24px', background: isCancelled ? '#FFF5F5' : '#FAFDF8', borderBottom: '1px solid #F3F0EB' }}>
                                            {isCancelled ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#DC2626' }}>
                                                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>❌</div>
                                                    <div>
                                                        <div style={{ fontWeight: 700, fontSize: 14 }}>Đơn hàng đã bị hủy</div>
                                                        <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>Đơn hàng không được xử lý</div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div>
                                                    <div style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 16 }}>Tiến độ đơn hàng</div>
                                                    <div style={{ display: 'flex', alignItems: 'flex-start', position: 'relative' }}>
                                                        {TRACK_STEPS.map((step, i) => {
                                                            const done = i <= stepIdx;
                                                            const current = i === stepIdx;
                                                            return (
                                                                <React.Fragment key={step.key}>
                                                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1 }}>
                                                                        <div style={{
                                                                            width: 42, height: 42, borderRadius: '50%', fontSize: 18,
                                                                            background: done ? step.color : '#F3F4F6',
                                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                            boxShadow: current ? `0 0 0 5px ${step.color}30` : 'none',
                                                                            transition: 'all 0.4s',
                                                                            animation: current ? 'orderPulse 2s infinite' : 'none',
                                                                        }}>
                                                                            {step.icon}
                                                                        </div>
                                                                        <div style={{ fontSize: 12, fontWeight: done ? 700 : 400, color: done ? step.color : '#9CA3AF', marginTop: 8, textAlign: 'center' }}>{step.label}</div>
                                                                    </div>
                                                                    {i < TRACK_STEPS.length - 1 && (
                                                                        <div style={{ flex: 1, height: 3, background: i < stepIdx ? TRACK_STEPS[i].color : '#E5E7EB', marginTop: 19, borderRadius: 2, transition: 'background 0.5s' }} />
                                                                    )}
                                                                </React.Fragment>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Products */}
                                        <div style={{ padding: '20px 24px', borderBottom: '1px solid #F3F0EB' }}>
                                            <div style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 14 }}>Sản phẩm đặt mua</div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                                {order.products?.map((item, idx) => (
                                                    <div key={idx} style={{ display: 'flex', gap: 14, alignItems: 'center', padding: '12px 14px', background: '#FAFAF9', borderRadius: 10, border: '1px solid #EDE8DF' }}>
                                                        {item.img && (
                                                            <img src={item.img} alt={item.name} style={{ width: 72, height: 72, borderRadius: 8, objectFit: 'cover', border: '1px solid #EDE8DF', flexShrink: 0 }} />
                                                        )}
                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                            <div style={{ fontWeight: 700, fontSize: 14, color: '#1C1009', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                                                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                                                {item.size && <span style={{ background: '#F3F4F6', color: '#374151', fontSize: 11, padding: '2px 8px', borderRadius: 6, fontWeight: 600 }}>Size: {item.size}</span>}
                                                                {item.color && <span style={{ background: '#F3F4F6', color: '#374151', fontSize: 11, padding: '2px 8px', borderRadius: 6, fontWeight: 600 }}>Màu: {item.color}</span>}
                                                                <span style={{ background: '#F3F4F6', color: '#374151', fontSize: 11, padding: '2px 8px', borderRadius: 6, fontWeight: 600 }}>SL: {item.quantity}</span>
                                                            </div>
                                                        </div>
                                                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                                            <div style={{ fontWeight: 800, color: '#C9963F', fontSize: 15 }}>{fmt(item.price * item.quantity)}</div>
                                                            <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{fmt(item.price)} / cái</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Shipping + Total Row */}
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 0 }}>
                                            {/* Shipping Info */}
                                            {order.shippingInfo && (
                                                <div style={{ padding: '18px 24px', borderRight: '1px solid #F3F0EB', background: '#FDFBF8' }}>
                                                    <div style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>Thông tin giao hàng</div>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 7, fontSize: 13 }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                            <span style={{ width: 20, textAlign: 'center' }}>👤</span>
                                                            <span style={{ fontWeight: 600, color: '#1C1009' }}>{order.shippingInfo.fullName}</span>
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                            <span style={{ width: 20, textAlign: 'center' }}>📞</span>
                                                            <span style={{ color: '#4B5563' }}>{order.shippingInfo.phone}</span>
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                                                            <span style={{ width: 20, textAlign: 'center', marginTop: 1 }}>📍</span>
                                                            <span style={{ color: '#4B5563', lineHeight: 1.5 }}>
                                                                {[order.shippingInfo.address, order.shippingInfo.ward, order.shippingInfo.district, order.shippingInfo.city].filter(Boolean).join(', ')}
                                                            </span>
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                            <span style={{ width: 20, textAlign: 'center' }}>💳</span>
                                                            <span style={{ color: '#4B5563' }}>
                                                                {order.paymentMethod === 'COD' ? 'Thanh toán khi nhận hàng' : order.paymentMethod === 'banking' ? 'Chuyển khoản ngân hàng' : order.paymentMethod}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Total Summary */}
                                            <div style={{ padding: '18px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', background: '#FDFBF8', minWidth: 220 }}>
                                                <div style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>Tóm tắt thanh toán</div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#6B7280' }}>
                                                        <span>Tạm tính</span>
                                                        <span>{fmt(order.products?.reduce((s, p) => s + p.price * p.quantity, 0) || 0)}</span>
                                                    </div>
                                                    {order.discountAmount > 0 && (
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#059669' }}>
                                                            <span>Giảm giá {order.discountCode && `(${order.discountCode})`}</span>
                                                            <span>-{fmt(order.discountAmount)}</span>
                                                        </div>
                                                    )}
                                                    <div style={{ height: 1, background: '#EDE8DF', margin: '6px 0' }} />
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 16, color: '#C9963F' }}>
                                                        <span>Tổng cộng</span>
                                                        <span>{fmt(order.totalAmount)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div style={{ padding: '14px 22px', borderTop: '1px solid #F3F0EB', display: 'flex', gap: 10, justifyContent: 'flex-end', background: '#FAFAF9', flexWrap: 'wrap' }}>
                                            {order.status === 'Đang xử lý' && (
                                                <button onClick={() => handleCancel(order._id)} style={{ padding: '9px 18px', background: '#fff', color: '#DC2626', border: '1.5px solid #DC2626', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 6 }}
                                                    onMouseEnter={e => { e.currentTarget.style.background = '#FEE2E2'; }}
                                                    onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}>
                                                    ❌ Hủy đơn hàng
                                                </button>
                                            )}
                                            {order.status === 'Đã giao' && (
                                                <button onClick={() => handleReorder(order)} style={{ padding: '9px 18px', background: 'linear-gradient(135deg, #C9963F, #D4A942)', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    🔄 Mua lại
                                                </button>
                                            )}
                                            {order.status === 'Đã hủy' && (
                                                <>
                                                    <button onClick={() => handleReorder(order)} style={{ padding: '9px 18px', background: 'linear-gradient(135deg, #C9963F, #D4A942)', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                                                        🔄 Đặt lại
                                                    </button>
                                                    <button onClick={() => handleDelete(order._id)} style={{ padding: '9px 18px', background: '#fff', color: '#6B7280', border: '1.5px solid #D1D5DB', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                                                        onMouseEnter={e => { e.currentTarget.style.background = '#F3F4F6'; }}
                                                        onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}>
                                                        🗑️ Xóa
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

            </div>

            <style>{`
                @keyframes orderPulse {
                    0%, 100% { box-shadow: 0 0 0 5px rgba(37,99,235,0.15); }
                    50% { box-shadow: 0 0 0 10px rgba(37,99,235,0.05); }
                }
            `}</style>
        </div>
    );
}

export default OrderPage;