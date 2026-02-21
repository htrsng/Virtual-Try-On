import React, { useState, useEffect } from 'react';
import { FiTrendingUp, FiShoppingCart, FiUsers, FiBox, FiDollarSign, FiArrowUp, FiArrowDown } from 'react-icons/fi';
import axios from 'axios';
import '../styles/admin-dashboard.css';

const normalizeOrderStatus = (status) => {
    const value = String(status || '').trim().toLowerCase();

    if (value === 'pending' || value === 'chờ xác nhận' || value === 'dang xu ly' || value === 'đang xử lý') {
        return 'Đang xử lý';
    }
    if (value === 'confirmed' || value === 'shipping' || value === 'đang giao' || value === 'dang giao') {
        return 'Đang giao';
    }
    if (value === 'completed' || value === 'delivered' || value === 'đã giao' || value === 'da giao' || value === 'hoàn thành' || value === 'hoan thanh') {
        return 'Đã giao';
    }
    if (value === 'cancelled' || value === 'canceled' || value === 'đã hủy' || value === 'da huy') {
        return 'Đã hủy';
    }

    return 'Đang xử lý';
};

function AdminDashboard() {
    const [stats, setStats] = useState({
        todayRevenue: 0,
        totalOrders: 0,
        totalUsers: 0,
        totalProducts: 0,
        topProducts: [],
        monthlyRevenue: [],
        orderStatus: [
            { status: 'Đang xử lý', count: 0, color: '#f59e0b' },
            { status: 'Đang giao', count: 0, color: '#8b5cf6' },
            { status: 'Đã giao', count: 0, color: '#10b981' },
            { status: 'Đã hủy', count: 0, color: '#ef4444' }
        ]
    });

    const [loading, setLoading] = useState(true);

    // Format currency
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    };

    // Load real stats from API
    useEffect(() => {
        fetchRealStats();
    }, []);

    const fetchRealStats = async () => {
        try {
            const token = localStorage.getItem('token');

            // Fetch all orders
            const ordersResponse = await axios.get('http://localhost:3000/api/orders', {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            const orders = ordersResponse.data || [];

            // Fetch users
            const usersResponse = await axios.get('http://localhost:3000/api/users', {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            const users = usersResponse.data || [];

            // Calculate stats from real data
            const todayRevenue = calculateTodayRevenue(orders);
            const totalOrders = orders.length;
            const totalUsers = users.length;

            // Count products from all orders
            const productMap = new Map();
            orders.forEach(order => {
                if (order.products) {
                    order.products.forEach(product => {
                        const key = product.productId || product.id;
                        if (productMap.has(key)) {
                            const existing = productMap.get(key);
                            existing.quantity += product.quantity || 1;
                            existing.revenue = (existing.revenue || 0) + (product.price * (product.quantity || 1));
                        } else {
                            productMap.set(key, {
                                id: key,
                                name: product.name,
                                quantity: product.quantity || 1,
                                revenue: product.price * (product.quantity || 1)
                            });
                        }
                    });
                }
            });

            // Get top 5 products
            const topProducts = Array.from(productMap.values())
                .sort((a, b) => b.revenue - a.revenue)
                .slice(0, 5);

            const totalProducts = productMap.size;

            // Order status breakdown
            const normalizedOrders = orders.map(order => ({
                ...order,
                normalizedStatus: normalizeOrderStatus(order.status)
            }));

            const orderStatus = [
                {
                    status: 'Đang xử lý',
                    count: normalizedOrders.filter(o => o.normalizedStatus === 'Đang xử lý').length,
                    color: '#f59e0b'
                },
                {
                    status: 'Đang giao',
                    count: normalizedOrders.filter(o => o.normalizedStatus === 'Đang giao').length,
                    color: '#8b5cf6'
                },
                {
                    status: 'Đã giao',
                    count: normalizedOrders.filter(o => o.normalizedStatus === 'Đã giao').length,
                    color: '#10b981'
                },
                {
                    status: 'Đã hủy',
                    count: normalizedOrders.filter(o => o.normalizedStatus === 'Đã hủy').length,
                    color: '#ef4444'
                }
            ];

            setStats({
                todayRevenue,
                totalOrders,
                totalUsers,
                totalProducts,
                topProducts,
                monthlyRevenue: generateMonthlyRevenue(orders),
                orderStatus
            });

            setLoading(false);
        } catch (error) {
            console.error('Error fetching stats:', error);
            setLoading(false);
        }
    };

    const calculateTodayRevenue = (orders) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return orders
            .filter(order => {
                const orderDate = new Date(order.createdAt);
                orderDate.setHours(0, 0, 0, 0);
                return orderDate.getTime() === today.getTime();
            })
            .reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    };

    const generateMonthlyRevenue = (orders) => {
        const monthlyData = {};
        const months = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
            'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];

        // Initialize all months
        months.forEach(month => {
            monthlyData[month] = 0;
        });

        // Calculate revenue by month
        orders.forEach(order => {
            const date = new Date(order.createdAt);
            const monthName = `Tháng ${date.getMonth() + 1}`;
            monthlyData[monthName] = (monthlyData[monthName] || 0) + (order.totalAmount || 0);
        });

        return Object.entries(monthlyData).map(([month, revenue]) => ({
            month,
            revenue
        }));
    };

    return (
        <div className="admin-dashboard">
            <div className="dashboard-header">
                <h1>Dashboard</h1>
                <p>Xin chào! Đây là tổng quan hệ thống của bạn.</p>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
                {/* Today Revenue */}
                <div className="stat-card revenue">
                    <div className="stat-icon">
                        <FiDollarSign size={24} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Doanh thu hôm nay</div>
                        <div className="stat-value">{formatCurrency(stats.todayRevenue)}</div>
                        <div className="stat-trend up">
                            <FiArrowUp size={14} />
                            <span>+12.5% so với hôm qua</span>
                        </div>
                    </div>
                </div>

                {/* Total Orders */}
                <div className="stat-card orders">
                    <div className="stat-icon">
                        <FiShoppingCart size={24} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Tổng đơn hàng</div>
                        <div className="stat-value">{stats.totalOrders.toLocaleString('vi-VN')}</div>
                        <div className="stat-trend up">
                            <FiArrowUp size={14} />
                            <span>+8.2% so với tháng trước</span>
                        </div>
                    </div>
                </div>

                {/* Total Users */}
                <div className="stat-card users">
                    <div className="stat-icon">
                        <FiUsers size={24} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Tổng người dùng</div>
                        <div className="stat-value">{stats.totalUsers.toLocaleString('vi-VN')}</div>
                        <div className="stat-trend up">
                            <FiArrowUp size={14} />
                            <span>+25 người mới hôm nay</span>
                        </div>
                    </div>
                </div>

                {/* Total Products */}
                <div className="stat-card products">
                    <div className="stat-icon">
                        <FiBox size={24} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Tổng sản phẩm</div>
                        <div className="stat-value">{stats.totalProducts}</div>
                        <div className="stat-trend down">
                            <FiArrowDown size={14} />
                            <span>12 sản phẩm sắp hết hàng</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="dashboard-grid">
                {/* Top Products */}
                <div className="dashboard-card">
                    <div className="card-header">
                        <h3>🔥 Top 5 sản phẩm bán chạy</h3>
                        <a href="/admin/products-list" className="card-link">Xem tất cả</a>
                    </div>
                    <div className="products-list">
                        {stats.topProducts.map((product, index) => (
                            <div key={product.id} className="product-item">
                                <div className="product-rank">
                                    <span className={`rank-badge rank-${index + 1}`}>{index + 1}</span>
                                </div>
                                <div className="product-info">
                                    <div className="product-name">{product.name}</div>
                                    <div className="product-meta">{product.quantity} đơn vị bán</div>
                                </div>
                                <div className="product-revenue">
                                    {formatCurrency(product.revenue)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Order Status Distribution */}
                <div className="dashboard-card">
                    <div className="card-header">
                        <h3>📊 Phân bố trạng thái đơn hàng</h3>
                    </div>
                    <div className="status-distribution">
                        {stats.orderStatus.map(status => {
                            const total = stats.orderStatus.reduce((a, b) => a + b.count, 0);
                            const percentage = ((status.count / total) * 100).toFixed(1);
                            return (
                                <div key={status.status} className="status-item">
                                    <div className="status-label">{status.status}</div>
                                    <div className="status-bar-container">
                                        <div
                                            className="status-bar"
                                            style={{
                                                width: `${percentage}%`,
                                                backgroundColor: status.color
                                            }}
                                        ></div>
                                    </div>
                                    <div className="status-count">
                                        {status.count} ({percentage}%)
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Monthly Revenue Chart */}
            <div className="dashboard-card full-width">
                <div className="card-header">
                    <h3>📈 Doanh thu theo tháng</h3>
                </div>
                <div className="monthly-chart">
                    <div className="chart-placeholder">
                        <div className="chart-container">
                            <div className="chart-y-axis">
                                <div>500 triệu</div>
                                <div>400 triệu</div>
                                <div>300 triệu</div>
                                <div>200 triệu</div>
                                <div>100 triệu</div>
                                <div>0 đ</div>
                            </div>
                            <div className="chart-bars">
                                {stats.monthlyRevenue.map((item, index) => {
                                    const maxRevenue = Math.max(...stats.monthlyRevenue.map(r => r.revenue));
                                    const height = (item.revenue / maxRevenue) * 100;
                                    return (
                                        <div key={index} className="bar-wrapper">
                                            <div
                                                className="bar"
                                                style={{ height: `${height}%` }}
                                                title={formatCurrency(item.revenue)}
                                            ></div>
                                            <div className="bar-label">{item.month.replace('Tháng ', '')}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="quick-stats">
                <div className="quick-stat-item">
                    <div className="quick-stat-label">Lợi nhuận ước tính</div>
                    <div className="quick-stat-value">{formatCurrency(2156000000)}</div>
                </div>
                <div className="quick-stat-item">
                    <div className="quick-stat-label">Đơn hàng hôm nay</div>
                    <div className="quick-stat-value">28</div>
                </div>
                <div className="quick-stat-item">
                    <div className="quick-stat-label">Tỷ lệ chuyển đổi</div>
                    <div className="quick-stat-value">3.2%</div>
                </div>
                <div className="quick-stat-item">
                    <div className="quick-stat-label">Giá bán trung bình</div>
                    <div className="quick-stat-value">{formatCurrency(285000)}</div>
                </div>
            </div>
        </div>
    );
}

export default AdminDashboard;
