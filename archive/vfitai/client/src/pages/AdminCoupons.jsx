import React, { useState, useEffect } from 'react';
import { FiEdit2, FiTrash2, FiPlus, FiSearch, FiCopy, FiCheck, FiX, FiUsers, FiTag } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { getManagedVouchers, setManagedVouchers } from '../data/voucherData';
import SectionHeader from '../admin/components/SectionHeader';
import AdminCard from '../admin/components/AdminCard';
import DataTable from '../admin/components/DataTable';
import StatusBadge from '../admin/components/StatusBadge';
import '../styles/admin-coupons.css';

function AdminCoupons({ showToast }) {
    const [coupons, setCoupons] = useState(() => getManagedVouchers());

    const [showModal, setShowModal] = useState(false);
    const [showUsersModal, setShowUsersModal] = useState(false);
    const [selectedCouponCode, setSelectedCouponCode] = useState('');
    const [couponUsages, setCouponUsages] = useState([]);
    const [loadingUsages, setLoadingUsages] = useState(false);

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

    const handleViewUsages = async (code) => {
        setSelectedCouponCode(code);
        setShowUsersModal(true);
        setLoadingUsages(true);
        try {
            const res = await fetch(`/api/coupons/${code}/users`);
            if (res.ok) {
                const data = await res.json();
                setCouponUsages(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingUsages(false);
        }
    };

    const filteredCoupons = coupons.filter(c =>
        c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    };

    const getStatusText = (status, isExpired) => {
        if (isExpired) return 'Hết hạn';
        if (status === 'active') return 'Hoạt động';
        return 'Tạm dừng';
    };

    const getStatusType = (status, isExpired) => {
        if (isExpired) return 'danger';
        if (status === 'active') return 'success';
        return 'warning';
    };

    return (
        <div className="adm-page">
            <SectionHeader
                title="Quản lý Voucher"
                subtitle="Tạo và quản lý voucher giảm giá cho khách hàng"
                action={
                    <button className="adm-topbar__btn" onClick={() => handleOpenModal()} style={{ background: 'var(--a-primary)', color: 'white', border: 'none' }}>
                        <FiPlus /> Thêm voucher mới
                    </button>
                }
            />

            <AdminCard title="Danh sách Voucher">
                <DataTable
                    columns={[
                        { header: 'Mã Voucher', accessor: 'code' },
                        { header: 'Chi tiết', accessor: 'details' },
                        { header: 'Hiệu lực', accessor: 'dates' },
                        { header: 'Đã dùng', accessor: 'usage' },
                        { header: 'Trạng thái', accessor: 'status' },
                        { header: 'Thao tác', accessor: 'actions' }
                    ]}
                    data={filteredCoupons}
                    renderRow={(coupon) => {
                        const usagePercent = coupon.usageLimit ? Math.round((coupon.usageCount / coupon.usageLimit) * 100) : 0;
                        const isExpired = new Date(coupon.endDate) < new Date();
                        return (
                            <tr key={coupon.id} className="dtable__tr">
                                <td className="dtable__td">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontWeight: 700, fontFamily: 'monospace', letterSpacing: '1px', background: 'var(--a-surface-alt)', padding: '4px 8px', borderRadius: '4px', color: 'var(--a-primary)' }}>{coupon.code}</span>
                                        <button onClick={() => handleCopyCoupon(coupon.code)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--a-text-tertiary)' }} title="Copy mã"><FiCopy size={14}/></button>
                                    </div>
                                </td>
                                <td className="dtable__td">
                                    <div style={{ fontWeight: 600 }}>{coupon.name}</div>
                                    <div style={{ fontSize: '13px', color: 'var(--a-text-secondary)', marginTop: '4px' }}>
                                        {coupon.type === 'percentage'
                                            ? `Giảm ${coupon.value}%`
                                            : coupon.type === 'shipping'
                                                ? `Miễn phí ship tối đa ${formatCurrency(coupon.value)}`
                                                : `Giảm ${formatCurrency(coupon.value)}`}
                                    </div>
                                </td>
                                <td className="dtable__td">
                                    <div style={{ fontSize: '13px' }}>
                                        <div style={{ color: 'var(--a-text-secondary)' }}>Từ: {coupon.startDate}</div>
                                        <div style={{ color: 'var(--a-text)', fontWeight: 500, marginTop: '2px' }}>Đến: {coupon.endDate}</div>
                                    </div>
                                </td>
                                <td className="dtable__td">
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                                            <span style={{ fontWeight: 600 }}>{coupon.usageCount} / {coupon.usageLimit}</span>
                                            <span style={{ color: 'var(--a-text-tertiary)' }}>{usagePercent}%</span>
                                        </div>
                                        <div style={{ height: '4px', background: 'var(--a-surface-alt)', borderRadius: '2px', overflow: 'hidden' }}>
                                            <div style={{ height: '100%', width: `${Math.min(usagePercent, 100)}%`, background: usagePercent >= 100 ? 'var(--a-danger)' : 'var(--a-primary)' }}></div>
                                        </div>
                                        {coupon.usageCount > 0 && (
                                            <button 
                                                onClick={() => handleViewUsages(coupon.code)}
                                                style={{ marginTop: '4px', fontSize: '12px', background: 'none', border: 'none', color: 'var(--a-primary)', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '4px' }}
                                            >
                                                <FiUsers /> Xem danh sách
                                            </button>
                                        )}
                                    </div>
                                </td>
                                <td className="dtable__td">
                                    <StatusBadge status={getStatusText(coupon.status, isExpired)} type={getStatusType(coupon.status, isExpired)} />
                                </td>
                                <td className="dtable__td">
                                    <div className="adm-page__actions">
                                        <button className="adm-page__act-btn adm-page__act-btn--edit" onClick={() => handleOpenModal(coupon)}>
                                            <FiEdit2 size={14} /> Sửa
                                        </button>
                                        <button className="adm-page__act-btn adm-page__act-btn--delete" onClick={() => handleDeleteCoupon(coupon.id)}>
                                            <FiTrash2 size={14} /> Xóa
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        );
                    }}
                />
            </AdminCard>

            {/* Modal: View Users who used the coupon */}
            {showUsersModal && (
                <div className="modal-overlay" onClick={() => setShowUsersModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                        <div className="modal-header">
                            <h2><FiUsers /> Người dùng đã áp dụng mã {selectedCouponCode}</h2>
                            <button className="close-btn" onClick={() => setShowUsersModal(false)}><FiX size={20}/></button>
                        </div>
                        <div style={{ padding: 'var(--sp-6)' }}>
                            {loadingUsages ? (
                                <p style={{ textAlign: 'center', color: 'var(--a-text-tertiary)' }}>Đang tải danh sách...</p>
                            ) : couponUsages.length > 0 ? (
                                <table className="dtable__table">
                                    <thead>
                                        <tr>
                                            <th className="dtable__th">Người dùng</th>
                                            <th className="dtable__th">Ngày sử dụng</th>
                                            <th className="dtable__th">Mã đơn</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {couponUsages.map(usage => (
                                            <tr key={usage._id} className="dtable__tr">
                                                <td className="dtable__td">
                                                    {usage.userId ? (
                                                        <Link to={`/admin/users/${usage.userId._id}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--a-text)', textDecoration: 'none' }}>
                                                            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--a-surface-alt)', display: 'grid', placeItems: 'center', fontSize: '12px' }}>
                                                                <FiUser />
                                                            </div>
                                                            <span style={{ fontWeight: 600, color: 'var(--a-primary)' }}>{usage.userId.fullName || usage.userId.email}</span>
                                                        </Link>
                                                    ) : (
                                                        <span style={{ color: 'var(--a-text-tertiary)' }}>N/A</span>
                                                    )}
                                                </td>
                                                <td className="dtable__td">
                                                    {new Date(usage.usedAt).toLocaleDateString('vi-VN')}
                                                </td>
                                                <td className="dtable__td" style={{ fontFamily: 'monospace' }}>
                                                    {usage.orderId ? `#${usage.orderId.substring(usage.orderId.length - 6).toUpperCase()}` : ''}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div style={{ textAlign: 'center', padding: 'var(--sp-10)', color: 'var(--a-text-tertiary)' }}>
                                    <FiTag size={40} style={{ opacity: 0.3, marginBottom: 'var(--sp-4)' }} />
                                    <p>Chưa có ai sử dụng mã giảm giá này.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Create/Edit Coupon */}
            {showModal && (
                <div className="modal-overlay" onClick={handleCloseModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingCoupon ? '✏️ Chỉnh sửa voucher' : '➕ Thêm voucher mới'}</h2>
                            <button className="close-btn" onClick={handleCloseModal}><FiX size={20}/></button>
                        </div>

                        <form onSubmit={handleSaveCoupon} className="coupon-form" style={{ padding: 'var(--sp-6)' }}>
                            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-5)', marginBottom: 'var(--sp-4)' }}>
                                <div className="form-group">
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--a-text-secondary)', marginBottom: '8px' }}>Mã voucher *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                        style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--a-border)', borderRadius: 'var(--r-md)', background: 'var(--a-surface)' }}
                                        placeholder="SAVE10"
                                    />
                                </div>
                                <div className="form-group">
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--a-text-secondary)', marginBottom: '8px' }}>Tên hiển thị *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--a-border)', borderRadius: 'var(--r-md)', background: 'var(--a-surface)' }}
                                        placeholder="Giảm 10%"
                                    />
                                </div>
                            </div>

                            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-5)', marginBottom: 'var(--sp-4)' }}>
                                <div className="form-group">
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--a-text-secondary)', marginBottom: '8px' }}>Loại khuyến mãi *</label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                        style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--a-border)', borderRadius: 'var(--r-md)', background: 'var(--a-surface)' }}
                                    >
                                        <option value="percentage">% - Phần trăm</option>
                                        <option value="fixed">đ - Cố định</option>
                                        <option value="shipping">🚚 - Miễn phí vận chuyển</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--a-text-secondary)', marginBottom: '8px' }}>Giá trị *</label>
                                    <input
                                        type="number"
                                        required
                                        value={formData.value}
                                        onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                                        style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--a-border)', borderRadius: 'var(--r-md)', background: 'var(--a-surface)' }}
                                        placeholder={formData.type === 'percentage' ? '10' : '100000'}
                                    />
                                </div>
                            </div>

                            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-5)', marginBottom: 'var(--sp-4)' }}>
                                <div className="form-group">
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--a-text-secondary)', marginBottom: '8px' }}>Giảm giá tối đa *</label>
                                    <input
                                        type="number"
                                        required
                                        value={formData.maxDiscount}
                                        onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
                                        style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--a-border)', borderRadius: 'var(--r-md)', background: 'var(--a-surface)' }}
                                        placeholder="50000"
                                    />
                                </div>
                                <div className="form-group">
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--a-text-secondary)', marginBottom: '8px' }}>Giảm giá tối thiểu</label>
                                    <input
                                        type="number"
                                        value={formData.minAmount}
                                        onChange={(e) => setFormData({ ...formData, minAmount: e.target.value })}
                                        style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--a-border)', borderRadius: 'var(--r-md)', background: 'var(--a-surface)' }}
                                        placeholder="50000"
                                    />
                                </div>
                            </div>

                            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-5)', marginBottom: 'var(--sp-4)' }}>
                                <div className="form-group">
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--a-text-secondary)', marginBottom: '8px' }}>Ngày bắt đầu *</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.startDate}
                                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                        style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--a-border)', borderRadius: 'var(--r-md)', background: 'var(--a-surface)' }}
                                    />
                                </div>
                                <div className="form-group">
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--a-text-secondary)', marginBottom: '8px' }}>Ngày kết thúc *</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.endDate}
                                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                        style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--a-border)', borderRadius: 'var(--r-md)', background: 'var(--a-surface)' }}
                                    />
                                </div>
                            </div>

                            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-5)', marginBottom: 'var(--sp-4)' }}>
                                <div className="form-group">
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--a-text-secondary)', marginBottom: '8px' }}>Số lần có thể sử dụng *</label>
                                    <input
                                        type="number"
                                        required
                                        value={formData.usageLimit}
                                        onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                                        style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--a-border)', borderRadius: 'var(--r-md)', background: 'var(--a-surface)' }}
                                        placeholder="100"
                                    />
                                </div>
                                <div className="form-group">
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--a-text-secondary)', marginBottom: '8px' }}>Trạng thái</label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--a-border)', borderRadius: 'var(--r-md)', background: 'var(--a-surface)' }}
                                    >
                                        <option value="active">✅ Hoạt động</option>
                                        <option value="inactive">⏸️ Tạm dừng</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-group" style={{ marginBottom: 'var(--sp-6)' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--a-text-secondary)', marginBottom: '8px' }}>Mô tả</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--a-border)', borderRadius: 'var(--r-md)', background: 'var(--a-surface)', minHeight: '80px', resize: 'vertical' }}
                                    placeholder="Mô tả voucher..."
                                ></textarea>
                            </div>

                            <div className="form-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--sp-3)', paddingTop: 'var(--sp-4)', borderTop: '1px solid var(--a-border)' }}>
                                <button type="button" className="adm-page__act-btn" onClick={handleCloseModal}>
                                    Hủy
                                </button>
                                <button type="submit" style={{ padding: '8px 24px', background: 'var(--a-primary)', color: 'white', border: 'none', borderRadius: 'var(--r-md)', fontWeight: 600, cursor: 'pointer' }}>
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
