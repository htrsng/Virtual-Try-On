import React, { useState, useRef } from 'react';
import './AdminFlashSale.css';

function AdminFlashSale({ flashSaleProducts, setFlashSaleProducts, categories, showToast }) {
    const formRef = useRef(null);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        id: '',
        name: '',
        img: '',
        price: '',
        category: '',
        discount: ''
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const filteredProducts = flashSaleProducts.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(product.id).includes(searchTerm) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);

    const handleOpenForm = (product = null) => {
        if (product) {
            setEditingId(product.id);
            setFormData({
                id: product.id,
                name: product.name,
                img: product.img,
                price: product.price,
                category: product.category,
                discount: product.discount || 0
            });
        } else {
            setEditingId(null);
            setFormData({
                id: '',
                name: '',
                img: '',
                price: '',
                category: '',
                discount: ''
            });
        }
        setShowForm(true);
        setTimeout(() => {
            formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditingId(null);
        setFormData({
            id: '',
            name: '',
            img: '',
            price: '',
            category: '',
            discount: ''
        });
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

        if (!formData.name.trim() || !formData.price) {
            showToast('Vui lòng điền đầy đủ thông tin sản phẩm!', 'error');
            return;
        }

        const product = editingId ? flashSaleProducts.find(p => p.id === editingId) : null;
        const newProduct = {
            id: editingId || Math.max(...flashSaleProducts.map(p => p.id), 2000) + 1,
            name: formData.name,
            img: formData.img || 'https://placehold.co/200x200?text=No+Image',
            price: Number(formData.price),
            category: formData.category || 'Khác',
            description: product?.description || '',
            discount: Number(formData.discount) || 0,
            stock: product?.stock || 100,
            originalPrice: product?.originalPrice || Number(formData.price),
            sold: product?.sold || 0
        };

        let updatedProducts;
        if (editingId) {
            updatedProducts = flashSaleProducts.map(p => p.id === editingId ? newProduct : p);
            showToast('✅ Đã cập nhật sản phẩm!', 'success');
        } else {
            updatedProducts = [...flashSaleProducts, newProduct];
            showToast('✅ Đã thêm sản phẩm mới!', 'success');
        }

        setFlashSaleProducts(updatedProducts);
        localStorage.setItem('flashSaleProducts', JSON.stringify(updatedProducts));

        handleCancel();
        setCurrentPage(1);
    };

    const handleDelete = (id) => {
        if (window.confirm('Bạn chắc chắn muốn xóa sản phẩm này?')) {
            const updatedProducts = flashSaleProducts.filter(p => p.id !== id);
            setFlashSaleProducts(updatedProducts);
            localStorage.setItem('flashSaleProducts', JSON.stringify(updatedProducts));
            showToast('🗑️ Đã xóa sản phẩm!', 'success');
            if (currentPage > Math.ceil(updatedProducts.length / itemsPerPage)) {
                setCurrentPage(Math.ceil(updatedProducts.length / itemsPerPage) || 1);
            }
        }
    };

    return (
        <div className="admin-flashsale-container">
            <div className="admin-flashsale-header">
                <h2>⚡ Flash Sale</h2>
                <button className="btn-quick-add" onClick={() => handleOpenForm()}>
                    + Thêm
                </button>
            </div>

            {showForm && (
                <div className="form-container" ref={formRef}>
                    <div className="form-header">
                        <h3>{editingId ? '✏️ Sửa Sản Phẩm' : '➕ Thêm Sản Phẩm Mới'}</h3>
                        <button className="btn-close-form" onClick={handleCancel}>✕</button>
                    </div>
                    <form onSubmit={handleSave}>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Tên Sản Phẩm *</label>
                                <input type="text" name="name" value={formData.name} onChange={handleChange}
                                    placeholder="Tên sản phẩm..." required />
                            </div>
                            <div className="form-group">
                                <label>Danh Mục</label>
                                <select name="category" value={formData.category} onChange={handleChange}>
                                    <option value="">-- Chọn danh mục --</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                                    ))}
                                    <option value="Khác">Khác</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Giá Bán (đ) *</label>
                                <input type="number" name="price" value={formData.price} onChange={handleChange}
                                    placeholder="0" min="0" required />
                            </div>
                            <div className="form-group">
                                <label>Giảm Giá (%)</label>
                                <input type="number" name="discount" value={formData.discount} onChange={handleChange}
                                    placeholder="0" min="0" max="100" />
                            </div>
                            <div className="form-group">
                                <label>Link Hình Ảnh</label>
                                <input type="url" name="img" value={formData.img} onChange={handleChange}
                                    placeholder="https://..." />
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

            <div className="search-container">
                <input type="text" placeholder="🔍 Tìm kiếm..." value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    className="search-input" />
                <span className="result-count">{filteredProducts.length} sản phẩm</span>
            </div>

            <div className="table-wrapper">
                <table className="flashsale-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Hình Ảnh</th>
                            <th>Tên Sản Phẩm</th>
                            <th>Danh Mục</th>
                            <th>Giá (đ)</th>
                            <th>Giảm (%)</th>
                            <th>Hành Động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentItems.length > 0 ? (
                            currentItems.map(product => (
                                <tr key={product.id}>
                                    <td className="id-cell">{product.id}</td>
                                    <td className="img-cell">
                                        <img src={product.img} alt={product.name}
                                            onError={(e) => { e.target.src = 'https://placehold.co/100x100?text=No+Image'; }} />
                                    </td>
                                    <td className="name-cell">{product.name}</td>
                                    <td>{product.category}</td>
                                    <td className="price-cell">
                                        <span className="price">{product.price.toLocaleString()}</span>
                                    </td>
                                    <td className="discount-cell">
                                        <span className="discount-badge">{product.discount || 0}%</span>
                                    </td>
                                    <td className="action-cell">
                                        <button className="btn-edit" onClick={() => handleOpenForm(product)} title="Sửa">✏️</button>
                                        <button className="btn-delete" onClick={() => handleDelete(product.id)} title="Xóa">🗑️</button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="7" className="empty-state">Không có sản phẩm flash sale nào</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className="pagination">
                    <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1}
                        className="pagination-btn">← Trước</button>
                    <span className="page-info">Trang {currentPage} / {totalPages}</span>
                    <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages}
                        className="pagination-btn">Tiếp →</button>
                </div>
            )}
        </div>
    );
}

export default AdminFlashSale;
