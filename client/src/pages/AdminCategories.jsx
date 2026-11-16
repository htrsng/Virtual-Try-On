import React, { useState, useRef, useMemo } from 'react';
import {
    FiFolder, FiPlus, FiEdit2, FiTrash2, FiX,
    FiSave, FiImage, FiLayers, FiClock
} from 'react-icons/fi';
import SectionHeader from '../admin/components/SectionHeader';
import DataTable from '../admin/components/DataTable';
import ConfirmModal from '../admin/components/ConfirmModal';
import './AdminCategories.css';

function AdminCategories({ categories, setCategories, showToast }) {
    const formRef = useRef(null);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ id: '', name: '', img: '' });
    const [deleteTarget, setDeleteTarget] = useState(null);

    /* ---- Handlers ---- */
    const handleOpenForm = (category = null) => {
        if (category) {
            setEditingId(category.id);
            setFormData({ id: category.id, name: category.name, img: category.img });
        } else {
            setEditingId(null);
            setFormData({ id: '', name: '', img: '' });
        }
        setShowForm(true);
        setTimeout(() => {
            formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditingId(null);
        setFormData({ id: '', name: '', img: '' });
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = (e) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            showToast('Tên danh mục không được để trống!', 'error');
            return;
        }

        if (editingId) {
            const updated = categories.map(cat =>
                cat.id === editingId
                    ? { id: cat.id, name: formData.name, img: formData.img || 'https://placehold.co/200x200?text=No+Image' }
                    : cat
            );
            setCategories(updated);
            localStorage.setItem('categories', JSON.stringify(updated));
            showToast('Đã cập nhật danh mục!', 'success');
        } else {
            const newCat = {
                id: Math.max(...categories.map(c => c.id), 0) + 1,
                name: formData.name,
                img: formData.img || 'https://placehold.co/200x200?text=No+Image'
            };
            const updated = [...categories, newCat];
            setCategories(updated);
            localStorage.setItem('categories', JSON.stringify(updated));
            showToast('Đã thêm danh mục mới!', 'success');
        }
        handleCancel();
    };

    const confirmDelete = () => {
        if (!deleteTarget) return;
        const updated = categories.filter(cat => cat.id !== deleteTarget.id);
        setCategories(updated);
        localStorage.setItem('categories', JSON.stringify(updated));
        showToast('Đã xóa danh mục!', 'success');
        setDeleteTarget(null);
    };

    const handleBulkDelete = (ids) => {
        const idSet = new Set(ids);
        const updated = categories.filter(cat => !idSet.has(cat.id));
        setCategories(updated);
        localStorage.setItem('categories', JSON.stringify(updated));
        showToast(`Đã xóa ${ids.length} danh mục!`, 'success');
    };

    /* ---- DataTable columns ---- */
    const columns = useMemo(() => [
        {
            key: 'id',
            label: 'ID',
            width: '80px',
            render: (val) => <span className="acat__id-cell">#{val}</span>
        },
        {
            key: 'img',
            label: 'Hình ảnh',
            width: '90px',
            render: (val, row) => (
                <div className="acat__img-cell">
                    <img
                        className="acat__img"
                        src={val}
                        alt={row.name}
                        onError={(e) => { e.target.src = 'https://placehold.co/100x100?text=No+Image'; }}
                    />
                </div>
            )
        },
        {
            key: 'name',
            label: 'Tên danh mục',
            render: (val, row) => (
                <div className="acat__name-cell">
                    <span className="acat__name">{val}</span>
                    <span className="acat__name-sub">ID: {row.id}</span>
                </div>
            )
        },
        {
            key: 'actions',
            label: 'Hành động',
            width: '120px',
            align: 'center',
            render: (_val, row) => (
                <div className="acat__actions">
                    <button
                        className="acat__action-btn acat__action-btn--edit"
                        onClick={() => handleOpenForm(row)}
                        title="Sửa"
                    >
                        <FiEdit2 size={15} />
                    </button>
                    <button
                        className="acat__action-btn acat__action-btn--delete"
                        onClick={() => setDeleteTarget(row)}
                        title="Xóa"
                    >
                        <FiTrash2 size={15} />
                    </button>
                </div>
            )
        }
    ], []);

    /* ---- Bulk actions ---- */
    const bulkActions = useMemo(() => [
        {
            label: 'Xóa đã chọn',
            variant: 'danger',
            onClick: handleBulkDelete
        }
    ], [categories]);

    return (
        <div className="acat">
            {/* Page Header */}
            <SectionHeader
                title="Danh mục"
                subtitle="Quản lý danh mục sản phẩm"
                action={
                    <button className="acat__btn-add" onClick={() => handleOpenForm()}>
                        <FiPlus size={16} /> Thêm mới
                    </button>
                }
            />

            {/* Stats Row */}
            <div className="acat__stats">
                <div className="acat__stat">
                    <div className="acat__stat-icon acat__stat-icon--total">
                        <FiFolder size={22} />
                    </div>
                    <div className="acat__stat-text">
                        <span className="acat__stat-value">{categories.length}</span>
                        <span className="acat__stat-label">Tổng danh mục</span>
                    </div>
                </div>
                <div className="acat__stat">
                    <div className="acat__stat-icon acat__stat-icon--active">
                        <FiLayers size={22} />
                    </div>
                    <div className="acat__stat-text">
                        <span className="acat__stat-value">{categories.filter(c => c.img && !c.img.includes('placehold')).length}</span>
                        <span className="acat__stat-label">Có hình ảnh</span>
                    </div>
                </div>
                <div className="acat__stat">
                    <div className="acat__stat-icon acat__stat-icon--recent">
                        <FiClock size={22} />
                    </div>
                    <div className="acat__stat-text">
                        <span className="acat__stat-value">{categories.length > 0 ? categories[categories.length - 1].name : '—'}</span>
                        <span className="acat__stat-label">Mới nhất</span>
                    </div>
                </div>
            </div>

            {/* Add / Edit Form */}
            {showForm && (
                <div className="acat__form-card" ref={formRef}>
                    <div className="acat__form-head">
                        <h3 className="acat__form-title">
                            <span className={`acat__form-title-icon ${editingId ? 'acat__form-title-icon--edit' : 'acat__form-title-icon--add'}`}>
                                {editingId ? <FiEdit2 size={16} /> : <FiPlus size={16} />}
                            </span>
                            {editingId ? 'Sửa Danh Mục' : 'Thêm Danh Mục Mới'}
                        </h3>
                        <button className="acat__form-close" onClick={handleCancel}>
                            <FiX size={18} />
                        </button>
                    </div>
                    <form onSubmit={handleSave} className="acat__form-body">
                        <div className="acat__form-row">
                            <div className="acat__field">
                                <label className="acat__label">Tên danh mục *</label>
                                <input
                                    type="text"
                                    name="name"
                                    className="acat__input"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Vd: Áo Thun, Quần Jeans..."
                                    required
                                />
                            </div>
                            <div className="acat__field">
                                <label className="acat__label">Link hình ảnh</label>
                                <input
                                    type="url"
                                    name="img"
                                    className="acat__input"
                                    value={formData.img}
                                    onChange={handleChange}
                                    placeholder="https://..."
                                />
                            </div>
                        </div>

                        {/* Image preview */}
                        {formData.img && (
                            <div className="acat__form-preview">
                                <img
                                    src={formData.img}
                                    alt="Preview"
                                    onError={(e) => { e.target.src = 'https://placehold.co/100x100?text=Invalid'; }}
                                />
                                <span className="acat__form-preview-text">Xem trước hình ảnh</span>
                            </div>
                        )}

                        <div className="acat__form-actions">
                            <button type="submit" className="acat__btn-save">
                                <FiSave size={16} />
                                {editingId ? 'Cập Nhật' : 'Thêm Mới'}
                            </button>
                            <button type="button" onClick={handleCancel} className="acat__btn-cancel">
                                <FiX size={15} /> Hủy
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Data Table */}
            <DataTable
                columns={columns}
                data={categories}
                rowKey="id"
                selectable
                bulkActions={bulkActions}
                searchable
                searchPlaceholder="Tìm kiếm danh mục..."
                pageSize={8}
                emptyMessage={
                    <div className="acat__empty-state">
                        <div className="acat__empty-icon"><FiImage size={28} /></div>
                        <span className="acat__empty-text">Chưa có danh mục nào</span>
                        <button className="acat__empty-action" onClick={() => handleOpenForm()}>
                            <FiPlus size={14} /> Thêm danh mục đầu tiên
                        </button>
                    </div>
                }
            />

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                open={!!deleteTarget}
                title="Xóa danh mục"
                message={deleteTarget ? `Bạn có chắc muốn xóa danh mục "${deleteTarget.name}"? Hành động này không thể hoàn tác.` : ''}
                confirmLabel="Xóa"
                variant="danger"
                onConfirm={confirmDelete}
                onCancel={() => setDeleteTarget(null)}
            />
        </div>
    );
}

export default AdminCategories;
