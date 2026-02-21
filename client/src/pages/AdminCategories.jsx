import React, { useState, useRef } from 'react';
import './AdminCategories.css';

function AdminCategories({ categories, setCategories, showToast }) {
    const formRef = useRef(null);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        id: '',
        name: '',
        img: ''
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    // Lọc danh mục theo search term
    const filteredCategories = categories.filter(cat =>
        cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(cat.id).includes(searchTerm)
    );

    const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredCategories.slice(indexOfFirstItem, indexOfLastItem);

    const handleOpenForm = (category = null) => {
        if (category) {
            setEditingId(category.id);
            setFormData({
                id: category.id,
                name: category.name,
                img: category.img
            });
        } else {
            setEditingId(null);
            setFormData({ id: '', name: '', img: '' });
        }
        setShowForm(true);
        // Scroll to form
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
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSave = (e) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            showToast('Tên danh mục không được để trống!', 'error');
            return;
        }

        if (editingId) {
            // Cập nhật danh mục
            const updatedCategories = categories.map(cat =>
                cat.id === editingId
                    ? {
                        id: cat.id,
                        name: formData.name,
                        img: formData.img || 'https://placehold.co/200x200?text=No+Image'
                    }
                    : cat
            );
            setCategories(updatedCategories);
            localStorage.setItem('categories', JSON.stringify(updatedCategories));
            showToast('✅ Đã cập nhật danh mục!', 'success');
        } else {
            // Thêm danh mục mới
            const newCategory = {
                id: Math.max(...categories.map(c => c.id), 0) + 1,
                name: formData.name,
                img: formData.img || 'https://placehold.co/200x200?text=No+Image'
            };
            const updatedCategories = [...categories, newCategory];
            setCategories(updatedCategories);
            localStorage.setItem('categories', JSON.stringify(updatedCategories));
            showToast('✅ Đã thêm danh mục mới!', 'success');
        }

        handleCancel();
        setCurrentPage(1);
    };

    const handleDelete = (id) => {
        if (window.confirm('Bạn chắc chắn muốn xóa danh mục này?')) {
            const updatedCategories = categories.filter(cat => cat.id !== id);
            setCategories(updatedCategories);
            localStorage.setItem('categories', JSON.stringify(updatedCategories));
            showToast('🗑️ Đã xóa danh mục!', 'success');
            if (currentPage > Math.ceil(updatedCategories.length / itemsPerPage)) {
                setCurrentPage(Math.ceil(updatedCategories.length / itemsPerPage) || 1);
            }
        }
    };

    return (
        <div className="admin-categories-container">
            {/* Header với nút thêm gọn */}
            <div className="admin-categories-header">
                <h2>📁 Danh Mục</h2>
                <button
                    className="btn-quick-add"
                    onClick={() => handleOpenForm()}
                >
                    + Thêm
                </button>
            </div>

            {/* Form (hiện/ẩn toggle) */}
            {showForm && (
                <div className="form-container" ref={formRef}>
                    <div className="form-header">
                        <h3>{editingId ? '✏️ Sửa Danh Mục' : '➕ Thêm Danh Mục Mới'}</h3>
                        <button className="btn-close-form" onClick={handleCancel}>✕</button>
                    </div>
                    <form onSubmit={handleSave}>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Tên Danh Mục *</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Vd: Áo Thun, Quần Jeans..."
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Link Hình Ảnh</label>
                                <input
                                    type="url"
                                    name="img"
                                    value={formData.img}
                                    onChange={handleChange}
                                    placeholder="https://..."
                                />
                            </div>
                        </div>

                        <div className="form-buttons">
                            <button type="submit" className="btn-save-form">
                                {editingId ? '💾 Cập Nhật' : '➕ Thêm'}
                            </button>
                            <button type="button" onClick={handleCancel} className="btn-cancel-form">
                                ✖ Hủy
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Search */}
            <div className="search-container">
                <input
                    type="text"
                    placeholder="🔍 Tìm kiếm..."
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                    }}
                    className="search-input"
                />
                <span className="result-count">{filteredCategories.length} danh mục</span>
            </div>

            {/* Bảng */}
            <div className="table-wrapper">
                <table className="categories-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Hình Ảnh</th>
                            <th>Tên Danh Mục</th>
                            <th>Hành Động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentItems.length > 0 ? (
                            currentItems.map(cat => (
                                <tr key={cat.id}>
                                    <td className="id-cell">{cat.id}</td>
                                    <td className="img-cell">
                                        <img src={cat.img} alt={cat.name} onError={(e) => {
                                            e.target.src = 'https://placehold.co/100x100?text=No+Image';
                                        }} />
                                    </td>
                                    <td>{cat.name}</td>
                                    <td className="action-cell">
                                        <button
                                            className="btn-edit"
                                            onClick={() => handleOpenForm(cat)}
                                            title="Sửa"
                                        >
                                            ✏️
                                        </button>
                                        <button
                                            className="btn-delete"
                                            onClick={() => handleDelete(cat.id)}
                                            title="Xóa"
                                        >
                                            🗑️
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="4" className="empty-state">
                                    Không có danh mục nào
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="pagination">
                    <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="pagination-btn"
                    >
                        ← Trước
                    </button>
                    <span className="page-info">
                        Trang {currentPage} / {totalPages}
                    </span>
                    <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="pagination-btn"
                    >
                        Tiếp →
                    </button>
                </div>
            )}
        </div>
    );
}

export default AdminCategories;
