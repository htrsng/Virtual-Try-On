import React, { useState, useEffect } from 'react';
import { FiEye, FiSearch, FiDownload, FiX, FiPackage } from 'react-icons/fi';
import axios from 'axios';
import '../styles/admin-orders.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function AdminOrders({ showToast }) {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({
        status: 'all',
        startDate: '',
        endDate: '',
        searchTerm: ''
    });
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const statuses = [
        { id: 'all', label: '🔸 Tất cả', color: '#6b7280' },
        { id: 'Đang xử lý', label: '⏳ Đang xử lý', color: '#f59e0b' },
        { id: 'Đang giao', label: '🚚 Đang giao', color: '#8b5cf6' },
        { id: 'Đã giao', label: '✔️ Đã giao', color: '#10b981' },
        { id: 'Đã hủy', label: '❌ Đã hủy', color: '#ef4444' }
    ];

    useEffect(() => {
        loadOrders();
    }, []);

    useEffect(() => {
        setCurrentPage(1);
    }, [filters]);

    const loadOrders = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/api/orders`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });

            const normalizedOrders = (response.data || []).map(order => {
                const items = Array.isArray(order.products)
                    ? order.products.reduce((sum, product) => sum + (product.quantity || 1), 0)
                    : 0;

                return {
                    ...order,
                    id: order._id,
                    customer: order.shippingInfo?.fullName || order.userId?.fullName || order.userId?.email || 'Khách hàng',
                    phone: order.shippingInfo?.phone || '-',
                    date: order.createdAt ? new Date(order.createdAt).toLocaleDateString('vi-VN') : '-',
                    totalAmount: order.totalAmount || 0,
                    status: order.status || 'Đang xử lý',
                    items,
                    address: [
                        order.shippingInfo?.address,
                        order.shippingInfo?.ward,
                        order.shippingInfo?.district,
                        order.shippingInfo?.city,
                    ].filter(Boolean).join(', '),
                };
            });

            setOrders(normalizedOrders);
        } catch (error) {
            console.error('Error loading orders:', error);
            showToast('Lỗi tải đơn hàng', 'error');
        } finally {
            setLoading(false);
        }
    };

    const getStatusInfo = (status) => {
        return statuses.find(s => s.id === status);
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    };

    const handleStatusChange = async (orderId, newStatus) => {
        try {
            await axios.put(`${API_URL}/api/orders/${orderId}`, { status: newStatus });

            const updatedOrders = orders.map(o =>
                o.id === orderId ? { ...o, status: newStatus } : o
            );
            setOrders(updatedOrders);
            setSelectedOrder(prev => prev && prev.id === orderId ? { ...prev, status: newStatus } : prev);
            showToast('Cập nhật trạng thái thành công', 'success');
        } catch (error) {
            showToast('Lỗi cập nhật trạng thái', 'error');
        }
    };

    const handleExportPDF = () => {
        showToast('Tính năng xuất PDF đang phát triển', 'info');
    };

    const filteredOrders = orders.filter(order => {
        if (filters.status !== 'all' && order.status !== filters.status) {
            return false;
        }

        if (filters.searchTerm) {
            const term = filters.searchTerm.toLowerCase();
            const matchSearch =
                String(order.id || '').toLowerCase().includes(term) ||
                String(order.customer || '').toLowerCase().includes(term) ||
                String(order.phone || '').toLowerCase().includes(term);
            if (!matchSearch) return false;
        }

        if (filters.startDate) {
            const orderDate = new Date(order.createdAt || order.date);
            const startDate = new Date(filters.startDate);
            startDate.setHours(0, 0, 0, 0);
            if (orderDate < startDate) return false;
        }

        if (filters.endDate) {
            const orderDate = new Date(order.createdAt || order.date);
            const endDate = new Date(filters.endDate);
            endDate.setHours(23, 59, 59, 999);
            if (orderDate > endDate) return false;
        }

        return true;
    });

    // Pagination
    const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentOrders = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);

    return (
        <div className="admin-orders-page">
            <div className="page-header">
                <div>
                    <h1>📦 Quản lý đơn hàng</h1>
                    <p>Quản lý và theo dõi tất cả đơn hàng của khách</p>
                </div>
                <button className="export-btn" onClick={handleExportPDF}>
                    <FiDownload size={18} />
                    <span>Xuất báo cáo</span>
                </button>
            </div>

            {/* Filters */}
            <div className="filters-section">
                <div className="filter-group">
                    <label>Trạng thái</label>
                    <select
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        className="filter-select"
                    >
                        {statuses.map(s => (
                            <option key={s.id} value={s.id}>{s.label}</option>
                        ))}
                    </select>
                </div>

                <div className="filter-group">
                    <label>Tìm kiếm</label>
                    <div className="search-input-wrapper">
                        <FiSearch size={18} />
                        <input
                            type="text"
                            placeholder="Mã đơn, tên khách, SĐT..."
                            value={filters.searchTerm}
                            onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
                            className="filter-input"
                        />
                    </div>
                </div>

                <div className="filter-group">
                    <label>Từ ngày</label>
                    <input
                        type="date"
                        value={filters.startDate}
                        onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                        className="filter-input"
                    />
                </div>

                <div className="filter-group">
                    <label>Đến ngày</label>
                    <input
                        type="date"
                        value={filters.endDate}
                        onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                        className="filter-input"
                    />
                </div>
            </div>

            {/* Orders Table */}
            <div className="orders-table-container">
                <table className="orders-table">
                    <thead>
                        <tr>
                            <th>Mã đơn hàng</th>
                            <th>Khách hàng</th>
                            <th>SĐT</th>
                            <th>Ngày đặt</th>
                            <th>Số SP</th>
                            <th>Tổng tiền</th>
                            <th>Trạng thái</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentOrders.length > 0 ? (
                            currentOrders.map(order => {
                                const statusInfo = getStatusInfo(order.status);
                                return (
                                    <tr key={order.id}>
                                        <td className="order-id">
                                            <strong>{order.id}</strong>
                                        </td>
                                        <td>{order.customer}</td>
                                        <td>{order.phone}</td>
                                        <td>{order.date}</td>
                                        <td className="items-count">{order.items}</td>
                                        <td className="amount">
                                            {formatCurrency(order.totalAmount)}
                                        </td>
                                        <td>
                                            <span
                                                className="status-badge"
                                                style={{
                                                    background: statusInfo?.color,
                                                    color: 'white'
                                                }}
                                            >
                                                {statusInfo?.label.replace(/^[^\s]+\s/, '')}
                                            </span>
                                        </td>
                                        <td>
                                            <button
                                                className="action-btn view-btn"
                                                onClick={() => {
                                                    setSelectedOrder(order);
                                                    setShowModal(true);
                                                }}
                                            >
                                                <FiEye size={16} />
                                                Chi tiết
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan="8" style={{ textAlign: 'center', padding: '20px' }}>
                                    <div className="empty-state">
                                        <FiPackage size={32} />
                                        <p>Không có đơn hàng nào</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="pagination">
                    {Array.from({ length: totalPages }).map((_, i) => (
                        <button
                            key={i + 1}
                            className={`page-btn ${currentPage === i + 1 ? 'active' : ''}`}
                            onClick={() => setCurrentPage(i + 1)}
                        >
                            {i + 1}
                        </button>
                    ))}
                </div>
            )}

            {/* Order Detail Modal */}
            {showModal && selectedOrder && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Chi tiết đơn hàng {selectedOrder.id}</h2>
                            <button
                                className="close-btn"
                                onClick={() => setShowModal(false)}
                            >
                                <FiX size={24} />
                            </button>
                        </div>

                        <div className="modal-body">
                            {/* Customer Info */}
                            <div className="info-section">
                                <h3>👤 Thông tin khách hàng</h3>
                                <div className="info-grid">
                                    <div className="info-item">
                                        <label>Tên khách</label>
                                        <p>{selectedOrder.customer}</p>
                                    </div>
                                    <div className="info-item">
                                        <label>Số điện thoại</label>
                                        <p>{selectedOrder.phone}</p>
                                    </div>
                                    <div className="info-item">
                                        <label>Địa chỉ</label>
                                        <p>{selectedOrder.address}</p>
                                    </div>
                                    <div className="info-item">
                                        <label>Ngày đặt</label>
                                        <p>{selectedOrder.date}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Order Status */}
                            <div className="info-section">
                                <h3>📦 Trạng thái đơn hàng</h3>
                                <div className="status-select-wrapper">
                                    <select
                                        value={selectedOrder.status}
                                        onChange={(e) => handleStatusChange(selectedOrder.id, e.target.value)}
                                        className="status-select"
                                    >
                                        {statuses.slice(1).map(s => (
                                            <option key={s.id} value={s.id}>{s.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Order Details */}
                            <div className="info-section">
                                <h3>💰 Chi tiết thanh toán</h3>
                                <div className="payment-details">
                                    <div className="detail-row">
                                        <span>Tổng cộng:</span>
                                        <strong>{formatCurrency(selectedOrder.totalAmount)}</strong>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button
                                className="btn-primary"
                                onClick={() => setShowModal(false)}
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminOrders;
