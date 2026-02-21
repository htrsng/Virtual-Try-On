import React, { useState } from 'react';
import { FiEdit2, FiTrash2, FiPlus, FiSearch, FiCopy, FiCheck, FiX } from 'react-icons/fi';
import { getManagedVouchers, setManagedVouchers } from '../data/voucherData';
import '../styles/admin-coupons.css';

function AdminCoupons({ showToast }) {
    const [coupons, setCoupons] = useState(() => getManagedVouchers());

    const [showModal, setShowModal] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Form state
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        type: 'percentage',
        value: '',
        minAmount: '',
        maxDiscount: '',
        usageLimit: '',
        startDate: '',
        endDate: '',
        status: 'active',
        description: ''
    });

    const toNumber = (value, defaultValue = 0) => {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : defaultValue;
    };

    const buildCouponPayload = (data) => ({
        ...data,
        code: String(data.code || '').trim().toUpperCase(),
        value: toNumber(data.value),
        minAmount: toNumber(data.minAmount),
        maxDiscount: toNumber(data.maxDiscount),
        usageLimit: toNumber(data.usageLimit, 1),
        usageCount: toNumber(data.usageCount)
    });

    const handleOpenModal = (coupon = null) => {
        if (coupon) {
            setEditingCoupon(coupon);
            setFormData({
                ...coupon,
                value: coupon.value ?? '',
                minAmount: coupon.minAmount ?? '',
                maxDiscount: coupon.maxDiscount ?? '',
                usageLimit: coupon.usageLimit ?? ''
            });
        } else {
            setEditingCoupon(null);
            setFormData({
                code: '',
                name: '',
                type: 'percentage',
                value: '',
                minAmount: '',
                maxDiscount: '',
                usageLimit: '',
                startDate: '',
                endDate: '',
                status: 'active',
                description: ''
            });
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingCoupon(null);
    };

    const handleSaveCoupon = (e) => {
        e.preventDefault();

        // Validation
        if (!formData.code || !formData.name || !formData.value || !formData.maxDiscount) {
            showToast('Vui lòng điền đầy đủ thông tin bắt buộc', 'warning');
            return;
        }

        const normalizedCoupon = buildCouponPayload(formData);

        if (editingCoupon) {
            const updatedCoupons = coupons.map(c => c.id === editingCoupon.id
                ? { ...normalizedCoupon, id: c.id }
                : c);
            setCoupons(updatedCoupons);
            setManagedVouchers(updatedCoupons);
            showToast('Cập nhật mã khuyến mãi thành công', 'success');
        } else {
            const newCoupon = {
                ...normalizedCoupon,
                id: Date.now(),
                usageCount: 0
            };
            const updatedCoupons = [...coupons, newCoupon];
            setCoupons(updatedCoupons);
            setManagedVouchers(updatedCoupons);
            showToast('Thêm mã khuyến mãi thành công', 'success');
        }

        handleCloseModal();
    };

    const handleDeleteCoupon = (couponId) => {
        if (window.confirm('Bạn chắc chắn muốn xóa mã này?')) {
            const updatedCoupons = coupons.filter(c => c.id !== couponId);
            setCoupons(updatedCoupons);
            setManagedVouchers(updatedCoupons);
            showToast('Xóa mã khuyến mãi thành công', 'success');
        }
    };

    const handleCopyCoupon = (code) => {
        navigator.clipboard.writeText(code);
        showToast('Đã sao chép mã: ' + code, 'success');
    };

    const filteredCoupons = coupons.filter(c =>
        c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Pagination
    const totalPages = Math.ceil(filteredCoupons.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentCoupons = filteredCoupons.slice(indexOfFirstItem, indexOfLastItem);

    const getUsagePercent = (usage, limit) => {
        if (!limit || Number(limit) <= 0) return 0;
        return Math.round((usage / limit) * 100);
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    };

    return (
        <div className="admin-coupons-page">
            <div className="page-header">
                <div>
                    <h1>🎁 Quản lý voucher</h1>
                    <p>Tạo và quản lý voucher giảm giá cho khách hàng</p>
                </div>
                <button className="btn-add-coupon" onClick={() => handleOpenModal()}>
                    <FiPlus size={20} />
                    <span>Thêm voucher mới</span>
                </button>
            </div>

            {/* Search Bar */}
            <div className="search-section">
                <div className="search-input-wrapper">
                    <FiSearch size={18} />
                    <input
                        type="text"
                        placeholder="Tìm theo mã voucher hoặc tên..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                </div>
            </div>

            {/* Coupons Table */}
            <div className="coupons-table-container">
                <table className="coupons-table">
                    <thead>
                        <tr>
                            <th>Mã</th>
                            <th>Tên</th>
                            <th>Loại</th>
                            <th>Giá trị</th>
                            <th>Ngày hiệu lực</th>
                            <th>Số lần sử dụng</th>
                            <th>Trạng thái</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentCoupons.length > 0 ? (
                            currentCoupons.map(coupon => {
                                const usagePercent = getUsagePercent(coupon.usageCount, coupon.usageLimit);
                                const isExpired = new Date(coupon.endDate) < new Date();

                                return (
                                    <tr key={coupon.id}>
                                        <td className="coupon-code">
                                            <div className="code-wrapper">
                                                <strong>{coupon.code}</strong>
                                                <button
                                                    className="copy-btn"
                                                    onClick={() => handleCopyCoupon(coupon.code)}
                                                    title="Sao chép voucher"
                                                >
                                                    <FiCopy size={14} />
                                                </button>
                                            </div>
                                        </td>
                                        <td>{coupon.name}</td>
                                        <td>
                                            <span className={`type-badge ${coupon.type}`}>
                                                {coupon.type === 'percentage' ? '%' : coupon.type === 'shipping' ? '🚚' : 'đ'}
                                                {coupon.value}
                                            </span>
                                        </td>
                                        <td>
                                            {coupon.type === 'percentage'
                                                ? `${coupon.value}%`
                                                : coupon.type === 'shipping'
                                                    ? `Miễn phí ship ${formatCurrency(coupon.value)}`
                                                    : formatCurrency(coupon.value)}
                                        </td>
                                        <td>
                                            <div className="date-range">
                                                <span>{coupon.startDate}</span>
                                                <span>→</span>
                                                <span>{coupon.endDate}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="usage-info">
                                                <div className="usage-bar">
                                                    <div
                                                        className="usage-fill"
                                                        style={{
                                                            width: `${Math.min(usagePercent, 100)}%`,
                                                            background: usagePercent > 80 ? '#ef4444' : '#10b981'
                                                        }}
                                                    ></div>
                                                </div>
                                                <span className="usage-text">
                                                    {coupon.usageCount}/{coupon.usageLimit}
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`status-badge ${coupon.status} ${isExpired ? 'expired' : ''}`}>
                                                {isExpired ? '❌ Hết hạn' : (coupon.status === 'active' ? '✅ Hoạt động' : '⏸️ Tạm dừng')}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="action-buttons">
                                                <button
                                                    className="action-btn edit-btn"
                                                    onClick={() => handleOpenModal(coupon)}
                                                    title="Chỉnh sửa"
                                                >
                                                    <FiEdit2 size={16} />
                                                </button>
                                                <button
                                                    className="action-btn delete-btn"
                                                    onClick={() => handleDeleteCoupon(coupon.id)}
                                                    title="Xóa"
                                                >
                                                    <FiTrash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan="8" style={{ textAlign: 'center', padding: '20px' }}>
                                    <div className="empty-state">
                                        <FiSearch size={32} />
                                        <p>Không tìm thấy voucher nào</p>
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

            {/* Coupon Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={handleCloseModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingCoupon ? '✏️ Chỉnh sửa voucher' : '➕ Thêm voucher mới'}</h2>
                            <button className="close-btn" onClick={handleCloseModal}>✕</button>
                        </div>

                        <form onSubmit={handleSaveCoupon} className="coupon-form">
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Mã voucher *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                        className="form-input"
                                        placeholder="SAVE10"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Tên hiển thị *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="form-input"
                                        placeholder="Giảm 10%"
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Loại khuyến mãi *</label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                        className="form-input"
                                    >
                                        <option value="percentage">% - Phần trăm</option>
                                        <option value="fixed">đ - Cố định</option>
                                        <option value="shipping">🚚 - Miễn phí vận chuyển</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Giá trị *</label>
                                    <input
                                        type="number"
                                        required
                                        value={formData.value}
                                        onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                                        className="form-input"
                                        placeholder={formData.type === 'percentage' ? '10' : '100000'}
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Giảm giá tối đa *</label>
                                    <input
                                        type="number"
                                        required
                                        value={formData.maxDiscount}
                                        onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
                                        className="form-input"
                                        placeholder="50000"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Giảm giá tối thiểu</label>
                                    <input
                                        type="number"
                                        value={formData.minAmount}
                                        onChange={(e) => setFormData({ ...formData, minAmount: e.target.value })}
                                        className="form-input"
                                        placeholder="50000"
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Ngày bắt đầu *</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.startDate}
                                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                        className="form-input"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Ngày kết thúc *</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.endDate}
                                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                        className="form-input"
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Số lần có thể sử dụng *</label>
                                    <input
                                        type="number"
                                        required
                                        value={formData.usageLimit}
                                        onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                                        className="form-input"
                                        placeholder="100"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Trạng thái</label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        className="form-input"
                                    >
                                        <option value="active">✅ Hoạt động</option>
                                        <option value="inactive">⏸️ Tạm dừng</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Mô tả</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="form-input"
                                    rows="3"
                                    placeholder="Mô tả voucher..."
                                ></textarea>
                            </div>

                            <div className="form-actions">
                                <button type="button" className="btn-cancel" onClick={handleCloseModal}>
                                    Hủy
                                </button>
                                <button type="submit" className="btn-save">
                                    {editingCoupon ? '💾 Cập nhật' : '➕ Thêm mới'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminCoupons;
