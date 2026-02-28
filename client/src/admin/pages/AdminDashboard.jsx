import React, { useState, useEffect, useMemo } from 'react';
import {
    FiDollarSign,
    FiShoppingCart,
    FiUsers,
    FiBox,
    FiExternalLink,
} from 'react-icons/fi';
import axios from 'axios';
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    PieChart,
    Pie,
    Cell,
    Legend,
} from 'recharts';
import { useNavigate } from 'react-router-dom';

import { StatCard, AdminCard, StatusBadge, SectionHeader } from '../components';
import '../styles/admin-tokens.css';
import './AdminDashboard.css';

/* ===== helpers ===== */
const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const fmtVND = (v) =>
    new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(v);

const normalizeStatus = (s) => {
    const v = String(s || '').trim().toLowerCase();
    if (['pending', 'chờ xác nhận', 'dang xu ly', 'đang xử lý'].includes(v)) return 'Đang xử lý';
    if (['confirmed', 'shipping', 'đang giao', 'dang giao'].includes(v)) return 'Đang giao';
    if (['completed', 'delivered', 'đã giao', 'da giao', 'hoàn thành', 'hoan thanh'].includes(v)) return 'Đã giao';
    if (['cancelled', 'canceled', 'đã hủy', 'da huy'].includes(v)) return 'Đã hủy';
    return 'Đang xử lý';
};

const STATUS_COLORS = {
    'Đang xử lý': '#f59e0b',
    'Đang giao': '#8b5cf6',
    'Đã giao': '#10b981',
    'Đã hủy': '#ef4444',
};

/* ===== component ===== */
export default function AdminDashboard() {
    const navigate = useNavigate();

    /* ---------- state ---------- */
    const [orders, setOrders] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [chartRange, setChartRange] = useState('12m'); // '7d' | '30d' | '12m'

    /* ---------- fetch ---------- */
    useEffect(() => {
        const load = async () => {
            try {
                const token = localStorage.getItem('token');
                const headers = token ? { Authorization: `Bearer ${token}` } : {};
                const [ordRes, usrRes] = await Promise.all([
                    axios.get(`${API}/api/orders`, { headers }),
                    axios.get(`${API}/api/users`, { headers }),
                ]);
                setOrders(ordRes.data || []);
                setUsers(usrRes.data || []);
            } catch (err) {
                console.error('Dashboard fetch error:', err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    /* ---------- derived ---------- */
    const derived = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Today revenue
        const todayRevenue = orders
            .filter((o) => {
                const d = new Date(o.createdAt);
                d.setHours(0, 0, 0, 0);
                return d.getTime() === today.getTime();
            })
            .reduce((s, o) => s + (o.totalAmount || 0), 0);

        const todayOrders = orders.filter((o) => {
            const d = new Date(o.createdAt);
            d.setHours(0, 0, 0, 0);
            return d.getTime() === today.getTime();
        }).length;

        // Product map
        const pMap = new Map();
        orders.forEach((o) =>
            (o.products || []).forEach((p) => {
                const k = p.productId || p.id;
                if (pMap.has(k)) {
                    const e = pMap.get(k);
                    e.qty += p.quantity || 1;
                    e.rev += p.price * (p.quantity || 1);
                } else {
                    pMap.set(k, { name: p.name, qty: p.quantity || 1, rev: p.price * (p.quantity || 1) });
                }
            })
        );
        const topProducts = [...pMap.values()].sort((a, b) => b.rev - a.rev).slice(0, 5);

        // Order status
        const statusMap = { 'Đang xử lý': 0, 'Đang giao': 0, 'Đã giao': 0, 'Đã hủy': 0 };
        orders.forEach((o) => {
            const ns = normalizeStatus(o.status);
            statusMap[ns] = (statusMap[ns] || 0) + 1;
        });
        const statusData = Object.entries(statusMap).map(([name, value]) => ({
            name,
            value,
            color: STATUS_COLORS[name],
        }));

        // Revenue chart data
        let revenueData = [];
        if (chartRange === '7d') {
            for (let i = 6; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                d.setHours(0, 0, 0, 0);
                const label = `${d.getDate()}/${d.getMonth() + 1}`;
                const rev = orders
                    .filter((o) => {
                        const od = new Date(o.createdAt);
                        od.setHours(0, 0, 0, 0);
                        return od.getTime() === d.getTime();
                    })
                    .reduce((s, o) => s + (o.totalAmount || 0), 0);
                revenueData.push({ label, revenue: rev });
            }
        } else if (chartRange === '30d') {
            for (let i = 29; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                d.setHours(0, 0, 0, 0);
                const label = `${d.getDate()}/${d.getMonth() + 1}`;
                const rev = orders
                    .filter((o) => {
                        const od = new Date(o.createdAt);
                        od.setHours(0, 0, 0, 0);
                        return od.getTime() === d.getTime();
                    })
                    .reduce((s, o) => s + (o.totalAmount || 0), 0);
                revenueData.push({ label, revenue: rev });
            }
        } else {
            const months = [
                'T1', 'T2', 'T3', 'T4', 'T5', 'T6',
                'T7', 'T8', 'T9', 'T10', 'T11', 'T12',
            ];
            const year = new Date().getFullYear();
            revenueData = months.map((m, i) => {
                const rev = orders
                    .filter((o) => {
                        const d = new Date(o.createdAt);
                        return d.getFullYear() === year && d.getMonth() === i;
                    })
                    .reduce((s, o) => s + (o.totalAmount || 0), 0);
                return { label: m, revenue: rev };
            });
        }

        // Recent orders (latest 6)
        const recentOrders = [...orders]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 6);

        // Total revenue
        const totalRevenue = orders.reduce((s, o) => s + (o.totalAmount || 0), 0);

        return {
            todayRevenue,
            todayOrders,
            totalOrders: orders.length,
            totalUsers: users.length,
            totalProducts: pMap.size,
            topProducts,
            statusData,
            revenueData,
            recentOrders,
            totalRevenue,
        };
    }, [orders, users, chartRange]);

    /* ---------- chart tooltip ---------- */
    const RevenueTooltip = ({ active, payload, label }) => {
        if (!active || !payload?.length) return null;
        return (
            <div
                style={{
                    background: 'var(--a-surface)',
                    border: '1px solid var(--a-border)',
                    borderRadius: 12,
                    padding: '12px 16px',
                    fontSize: 14,
                    boxShadow: '0 8px 24px rgba(0,0,0,.12)',
                    minWidth: 140,
                }}
            >
                <p style={{ margin: '0 0 4px', color: 'var(--a-text-secondary)', fontSize: 12, fontWeight: 500 }}>{label}</p>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 16, color: 'var(--a-text)' }}>{fmtVND(payload[0].value)}</p>
            </div>
        );
    };

    /* ---------- loading skeleton ---------- */
    if (loading) {
        return (
            <div className="adash">
                <SectionHeader title="Dashboard" subtitle="Đang tải dữ liệu..." />
                <div className="adash__stats">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="adash__skeleton" style={{ height: 120 }} />
                    ))}
                </div>
                <div className="adash__skeleton" style={{ height: 320 }} />
            </div>
        );
    }

    /* ---------- render ---------- */
    return (
        <div className="adash">
            <SectionHeader
                title="Dashboard"
                subtitle="Tổng quan hệ thống — dữ liệu realtime"
            />

            {/* ---- Stat cards ---- */}
            <div className="adash__stats">
                <StatCard
                    icon={FiDollarSign}
                    label="Doanh thu hôm nay"
                    value={fmtVND(derived.todayRevenue)}
                    trend={derived.todayOrders > 0 ? `${derived.todayOrders} đơn hôm nay` : 'Chưa có đơn'}
                    trendUp={derived.todayOrders > 0}
                    color="primary"
                />
                <StatCard
                    icon={FiShoppingCart}
                    label="Tổng đơn hàng"
                    value={derived.totalOrders.toLocaleString('vi-VN')}
                    trend={`${derived.todayOrders} đơn mới hôm nay`}
                    trendUp={derived.todayOrders > 0}
                    color="info"
                />
                <StatCard
                    icon={FiUsers}
                    label="Tổng người dùng"
                    value={derived.totalUsers.toLocaleString('vi-VN')}
                    trend="Khách đã đăng ký"
                    trendUp
                    color="success"
                />
                <StatCard
                    icon={FiBox}
                    label="Sản phẩm đã bán"
                    value={derived.totalProducts}
                    trend={`Tổng DT: ${fmtVND(derived.totalRevenue)}`}
                    trendUp
                    color="warning"
                />
            </div>

            {/* ---- Revenue chart ---- */}
            <AdminCard
                title="Biểu đồ doanh thu"
                action={
                    <div className="adash__chart-toggle">
                        {[
                            { key: '7d', label: '7 ngày' },
                            { key: '30d', label: '30 ngày' },
                            { key: '12m', label: '12 tháng' },
                        ].map((opt) => (
                            <button
                                key={opt.key}
                                className={`adash__chart-toggle-btn${chartRange === opt.key ? ' adash__chart-toggle-btn--active' : ''}`}
                                onClick={() => setChartRange(opt.key)}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                }
            >
                <ResponsiveContainer width="100%" height={360}>
                    <AreaChart data={derived.revenueData} margin={{ top: 12, right: 12, left: 4, bottom: 4 }}>
                        <defs>
                            <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="var(--a-primary)" stopOpacity={0.25} />
                                <stop offset="100%" stopColor="var(--a-primary)" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--a-border-light)" />
                        <XAxis dataKey="label" tick={{ fontSize: 12, fontWeight: 500 }} stroke="var(--a-text-tertiary)" />
                        <YAxis
                            tickFormatter={(v) => (v >= 1e6 ? `${(v / 1e6).toFixed(0)}tr` : v >= 1e3 ? `${(v / 1e3).toFixed(0)}k` : v)}
                            tick={{ fontSize: 12, fontWeight: 500 }}
                            stroke="var(--a-text-tertiary)"
                            width={56}
                        />
                        <Tooltip content={<RevenueTooltip />} />
                        <Area
                            type="monotone"
                            dataKey="revenue"
                            stroke="var(--a-primary)"
                            strokeWidth={2}
                            fill="url(#revGradient)"
                            dot={false}
                            activeDot={{ r: 4, strokeWidth: 2, fill: '#fff', stroke: 'var(--a-primary)' }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </AdminCard>

            {/* ---- Bottom row ---- */}
            <div className="adash__bottom-row">
                {/* Recent orders */}
                <AdminCard
                    title="Đơn hàng gần đây"
                    action={
                        <button
                            style={{
                                background: 'none', border: 'none', color: 'var(--a-primary)',
                                cursor: 'pointer', fontSize: 14, fontWeight: 600, display: 'flex',
                                alignItems: 'center', gap: 6, fontFamily: 'var(--admin-font)',
                            }}
                            onClick={() => navigate('/admin/orders')}
                        >
                            Xem tất cả <FiExternalLink size={14} />
                        </button>
                    }
                >
                    {derived.recentOrders.length === 0 ? (
                        <p style={{ color: 'var(--a-text-tertiary)', fontSize: 14, textAlign: 'center', padding: '32px 0' }}>
                            Chưa có đơn hàng nào
                        </p>
                    ) : (
                        derived.recentOrders.map((order) => (
                            <div className="adash__order-item" key={order._id || order.id}>
                                <span className="adash__order-id">#{String(order.orderId || order._id || '').slice(-6)}</span>
                                <span className="adash__order-customer">
                                    {order.shippingAddress?.fullName || order.userId?.name || 'Khách'}
                                </span>
                                <StatusBadge status={normalizeStatus(order.status)} />
                                <span className="adash__order-amount">{fmtVND(order.totalAmount || 0)}</span>
                            </div>
                        ))
                    )}
                </AdminCard>

                {/* Order status pie */}
                <AdminCard title="Phân bố trạng thái đơn">
                    {derived.totalOrders === 0 ? (
                        <p style={{ color: 'var(--a-text-tertiary)', fontSize: 14, textAlign: 'center', padding: '32px 0' }}>
                            Chưa có dữ liệu
                        </p>
                    ) : (
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={derived.statusData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={64}
                                    outerRadius={100}
                                    paddingAngle={3}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {derived.statusData.map((entry) => (
                                        <Cell key={entry.name} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value, name) => [`${value} đơn`, name]}
                                    contentStyle={{
                                        background: 'var(--a-surface)',
                                        border: '1px solid var(--a-border)',
                                        borderRadius: 12,
                                        fontSize: 14,
                                        boxShadow: '0 8px 24px rgba(0,0,0,.12)',
                                    }}
                                />
                                <Legend
                                    verticalAlign="bottom"
                                    iconType="circle"
                                    iconSize={10}
                                    wrapperStyle={{ fontSize: 13, fontWeight: 500 }}
                                    formatter={(value) => <span style={{ color: 'var(--a-text-secondary)' }}>{value}</span>}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </AdminCard>
            </div>

            {/* ---- Top products ---- */}
            <AdminCard
                title="Top 5 sản phẩm bán chạy"
                action={
                    <button
                        style={{
                            background: 'none', border: 'none', color: 'var(--a-primary)',
                            cursor: 'pointer', fontSize: 14, fontWeight: 600, display: 'flex',
                            alignItems: 'center', gap: 6, fontFamily: 'var(--admin-font)',
                        }}
                        onClick={() => navigate('/admin/products-list')}
                    >
                        Xem tất cả <FiExternalLink size={14} />
                    </button>
                }
            >
                {derived.topProducts.length === 0 ? (
                    <p style={{ color: 'var(--a-text-tertiary)', fontSize: 14, textAlign: 'center', padding: '32px 0' }}>
                        Chưa có dữ liệu bán hàng
                    </p>
                ) : (
                    derived.topProducts.map((p, i) => (
                        <div className="adash__product-item" key={i}>
                            <span className={`adash__product-rank adash__product-rank--${i + 1}`}>{i + 1}</span>
                            <span className="adash__product-name">{p.name}</span>
                            <span className="adash__product-revenue">{fmtVND(p.rev)}</span>
                        </div>
                    ))
                )}
            </AdminCard>
        </div>
    );
}
