import React, { useState, useEffect } from 'react';
import { FiEdit2, FiTrash2, FiPlus, FiSearch, FiFilter, FiEye, FiEyeOff, FiAlertCircle } from 'react-icons/fi';
import axios from 'axios';
import '../styles/admin-products.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const getNumericProductId = (value) => {
    const numericId = Number(value);
    return Number.isInteger(numericId) && numericId > 0 ? numericId : null;
};

function AdminProducts({ showToast, categories = [] }) {
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        category: 'all',
        status: 'all',
        searchTerm: ''
    });
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        basePrice: '',
        salePrice: '',
        category: '',
        stock: '',
        description: '',
        shortDescription: '',
        mainImage: '',
        secondaryImages: [],
        status: 'active'
    });

    const categoryOptions = Array.isArray(categories)
        ? categories.map((cat) => cat?.name).filter(Boolean)
        : [];
    const uniqueCategories = Array.from(new Set([...categoryOptions, 'Khác']));

    // Load products từ dữ liệu gốc + thống kê bán hàng
    useEffect(() => {
        loadProductsData();
    }, []);

    const loadProductsData = async () => {
        try {
            const token = localStorage.getItem('token');
            const [productsResponse, ordersResponse] = await Promise.all([
                axios.get(`${API_URL}/api/products`),
                axios.get(`${API_URL}/api/orders`, {
                    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                })
            ]);

            const sourceProducts = Array.isArray(productsResponse.data) ? productsResponse.data : [];
            const orders = Array.isArray(ordersResponse.data) ? ordersResponse.data : [];

            const salesMap = new Map();
            orders.forEach(order => {
                if (!Array.isArray(order.products)) return;

                order.products.forEach(item => {
                    const productId = getNumericProductId(item.productId || item.id);
                    if (!productId) return;

                    const prev = salesMap.get(productId) || { soldQuantity: 0, totalRevenue: 0 };
                    const quantity = Number(item.quantity) || 0;
                    const price = Number(item.price) || 0;

                    salesMap.set(productId, {
                        soldQuantity: prev.soldQuantity + quantity,
                        totalRevenue: prev.totalRevenue + (price * quantity)
                    });
                });
            });

            const productsArray = sourceProducts
                .map(product => {
                    const productId = getNumericProductId(product.id);
                    if (!productId) return null;

                    const stats = salesMap.get(productId);
                    const fallbackSold = Number(product.sold) || 0;
                    const soldQuantity = stats?.soldQuantity ?? fallbackSold;
                    const totalRevenue = stats?.totalRevenue ?? (soldQuantity * (Number(product.price) || 0));

                    return {
                        _id: product._id,
                        id: productId,
                        name: product.name || 'Không xác định',
                        basePrice: Number(product.price) || 0,
                        salePrice: Number(product.price) || 0,
                        category: product.category || 'Khác',
                        stock: Number(product.stock) || 0,
                        description: product.description || '',
                        shortDescription: product.shortDescription || '',
                        mainImage: product.img || '',
                        secondaryImages: Array.isArray(product.secondaryImages) ? product.secondaryImages : [],
                        status: product.status === 'inactive' ? 'inactive' : 'active',
                        soldQuantity,
                        totalRevenue
                    };
                })
                .filter(Boolean);

            setProducts(productsArray);
            setLoading(false);
        } catch (error) {
            console.error('Error loading products data:', error);
            setLoading(false);
            showToast?.('Lỗi tải dữ liệu sản phẩm', 'error');
        }
    };

    // Filter products on mount and when filters change
    useEffect(() => {
        applyFilters();
    }, [filters, products]);

    const applyFilters = () => {
        let filtered = products;

        // Filter by category
        if (filters.category !== 'all') {
            filtered = filtered.filter(p => p.category === filters.category);
        }

        // Filter by status
        if (filters.status !== 'all') {
            filtered = filtered.filter(p => p.status === filters.status);
        }

        // Filter by search term
        if (filters.searchTerm) {
            const term = filters.searchTerm.toLowerCase();
            filtered = filtered.filter(p =>
                p.name.toLowerCase().includes(term) ||
                String(p.id).toLowerCase().includes(term)
            );
        }

        setFilteredProducts(filtered);
    };

    const handleOpenModal = (product = null) => {
        if (product) {
            setEditingProduct(product);
            setFormData({ ...product });
        } else {
            setEditingProduct(null);
            setFormData({
                name: '',
                basePrice: '',
                salePrice: '',
                category: '',
                stock: '',
                description: '',
                shortDescription: '',
                mainImage: '',
                secondaryImages: [],
                status: 'active'
            });
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingProduct(null);
    };

    const handleSaveProduct = async (e) => {
        e.preventDefault();

        // Validation
        const hasStock = formData.stock !== '' && formData.stock !== null && formData.stock !== undefined;
        if (!formData.name || !formData.basePrice || !formData.category || !hasStock) {
            showToast?.('Vui lòng điền đầy đủ thông tin bắt buộc', 'warning');
            return;
        }

        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        try {
            if (editingProduct) {
                const payload = {
                    name: formData.name,
                    price: Number(formData.basePrice),
                    category: formData.category,
                    stock: Number(formData.stock),
                    description: formData.description,
                    shortDescription: formData.shortDescription,
                    img: formData.mainImage,
                    secondaryImages: formData.secondaryImages,
                    status: formData.status,
                };
                await axios.put(`${API_URL}/api/products/${editingProduct._id}`, payload, { headers });
                const updatedProducts = products.map(p =>
                    p.id === editingProduct.id ? { ...p, ...formData, basePrice: Number(formData.basePrice) } : p
                );
                setProducts(updatedProducts);
                showToast?.('Cập nhật sản phẩm thành công', 'success');
            } else {
                const payload = {
                    name: formData.name,
                    price: Number(formData.basePrice),
                    category: formData.category,
                    stock: Number(formData.stock),
                    description: formData.description,
                    shortDescription: formData.shortDescription,
                    img: formData.mainImage,
                    secondaryImages: formData.secondaryImages,
                    status: formData.status,
                };
                const res = await axios.post(`${API_URL}/api/products`, payload, { headers });
                const saved = res.data;
                const newProduct = {
                    ...formData,
                    _id: saved._id,
                    id: getNumericProductId(saved.id) || Date.now(),
                    basePrice: Number(formData.basePrice),
                    soldQuantity: 0,
                    totalRevenue: 0,
                };
                setProducts(prev => [...prev, newProduct]);
                showToast?.('Thêm sản phẩm thành công', 'success');
            }
        } catch (err) {
            console.error('Lỗi lưu sản phẩm:', err);
            showToast?.('Lỗi lưu sản phẩm: ' + (err.response?.data?.error || err.message), 'error');
            return;
        }

        handleCloseModal();
    };

    const handleDeleteProduct = async (productId) => {
        if (!window.confirm('Bạn chắc chắn muốn xóa sản phẩm này?')) return;
        const target = products.find(p => p.id === productId);
        if (!target?._id) {
            setProducts(products.filter(p => p.id !== productId));
            showToast?.('Xóa sản phẩm thành công', 'success');
            return;
        }
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/api/products/${target._id}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            setProducts(products.filter(p => p.id !== productId));
            showToast?.('Xóa sản phẩm thành công', 'success');
        } catch (err) {
            showToast?.('Lỗi xóa sản phẩm: ' + (err.response?.data?.error || err.message), 'error');
        }
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    };

    const getLowStockWarning = (stock) => {
        if (stock < 5) return 'critical';
        if (stock < 10) return 'warning';
        return 'ok';
    };

    // Pagination
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentProducts = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '40px' }}>
                <p>⏳ Đang tải dữ liệu sản phẩm...</p>
            </div>
        );
    }

    return (
        <div className="admin-products-page">
            <div className="page-header">
                <div>
                    <h1>📦 Quản lý sản phẩm</h1>
                    <p>Quản lý danh sách, giá, kho hàng và hình ảnh sản phẩm</p>
                </div>
                <button className="btn-add-product" onClick={() => handleOpenModal()}>
                    <FiPlus size={20} />
                    <span>Thêm sản phẩm</span>
                </button>
            </div>

            {/* Filters */}
            <div className="filters-section">
                <div className="filter-group" style={{ flex: 0 }}>
                    <label>Danh mục</label>
                    <select
                        value={filters.category}
                        onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                        className="filter-select"
                    >
                        <option value="all">📦 Tất cả danh mục</option>
                        {uniqueCategories.map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>

                <div className="filter-group" style={{ flex: 0 }}>
                    <label>Trạng thái</label>
                    <select
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        className="filter-select"
                    >
                        <option value="all">🔸 Tất cả</option>
                        <option value="active">✅ Hiển thị</option>
                        <option value="inactive">❌ Ẩn</option>
                    </select>
                </div>

                <div className="filter-group">
                    <label>Tìm kiếm</label>
                    <div className="search-input-wrapper">
                        <FiSearch size={18} />
                        <input
                            type="text"
                            placeholder="Tên sản phẩm, ID..."
                            value={filters.searchTerm}
                            onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
                            className="filter-input"
                        />
                    </div>
                </div>
                <button
                    onClick={loadProductsData}
                    style={{
                        padding: '8px 16px',
                        background: 'var(--accent-primary)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: '600'
                    }}
                >
                    🔄 Làm mới
                </button>
            </div>

            {/* Products Table */}
            <div className="products-table-container">
                <table className="products-table">
                    <thead>
                        <tr>
                            <th>Tên sản phẩm</th>
                            <th>ID sản phẩm</th>
                            <th>Danh mục</th>
                            <th>Giá</th>
                            <th>Đã bán</th>
                            <th>Doanh thu</th>
                            <th>Trạng thái</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentProducts.length > 0 ? (
                            currentProducts.map(product => {
                                return (
                                    <tr key={product.id}>
                                        <td>
                                            <div className="product-name-cell">
                                                {product.mainImage && (
                                                    <img src={product.mainImage} alt={product.name} onError={(e) => e.target.style.display = 'none'} />
                                                )}
                                                <span>{product.name}</span>
                                            </div>
                                        </td>
                                        <td className="sku">{product.id || '-'}</td>
                                        <td>{product.category}</td>
                                        <td className="price">{formatCurrency(product.basePrice || 0)}</td>
                                        <td style={{ textAlign: 'center', fontWeight: '600', color: '#10b981' }}>
                                            {product.soldQuantity || 0} cái
                                        </td>
                                        <td style={{ textAlign: 'right', fontWeight: '600', color: '#d4a574' }}>
                                            {formatCurrency(product.totalRevenue || 0)}
                                        </td>
                                        <td>
                                            <span className={`status-badge ${product.status}`}>
                                                {product.status === 'active' ? '✅ Hiển thị' : '❌ Ẩn'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="action-buttons">
                                                <button
                                                    className="action-btn edit-btn"
                                                    onClick={() => handleOpenModal(product)}
                                                    title="Chỉnh sửa"
                                                >
                                                    <FiEdit2 size={14} />
                                                    <span>Sửa</span>
                                                </button>
                                                <button
                                                    className="action-btn delete-btn"
                                                    onClick={() => handleDeleteProduct(product.id)}
                                                    title="Xóa"
                                                >
                                                    <FiTrash2 size={14} />
                                                    <span>Xóa</span>
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
                                        <FiFilter size={32} />
                                        <p>Không tìm thấy sản phẩm nào</p>
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

            {/* Product Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={handleCloseModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingProduct ? '✏️ Chỉnh sửa sản phẩm' : '➕ Thêm sản phẩm mới'}</h2>
                            <button className="close-btn" onClick={handleCloseModal}>✕</button>
                        </div>

                        <form onSubmit={handleSaveProduct} className="product-form">
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Tên sản phẩm *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="form-input"
                                        placeholder="Áo thun nam..."
                                    />
                                </div>
                                <div className="form-group">
                                    <label>ID sản phẩm</label>
                                    <input
                                        type="text"
                                        value={editingProduct ? String(editingProduct.id) : 'Tự động theo dữ liệu gốc'}
                                        className="form-input"
                                        placeholder="ID sản phẩm"
                                        readOnly
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Danh mục *</label>
                                    <select
                                        required
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="form-input"
                                    >
                                        <option value="">-- Chọn danh mục --</option>
                                        {uniqueCategories.map((cat) => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Trạng thái</label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        className="form-input"
                                    >
                                        <option value="active">✅ Hiển thị</option>
                                        <option value="inactive">❌ Ẩn</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Giá gốc *</label>
                                    <input
                                        type="number"
                                        required
                                        value={formData.basePrice}
                                        onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                                        className="form-input"
                                        placeholder="100000"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Giá bán</label>
                                    <input
                                        type="number"
                                        value={formData.salePrice}
                                        onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
                                        className="form-input"
                                        placeholder="80000"
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Số lượng *</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        value={formData.stock}
                                        onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                                        className="form-input"
                                        placeholder="0"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Mô tả ngắn</label>
                                <textarea
                                    value={formData.shortDescription}
                                    onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                                    className="form-input"
                                    rows="2"
                                    placeholder="Mô tả ngắn sản phẩm..."
                                ></textarea>
                            </div>

                            <div className="form-group">
                                <label>Mô tả chi tiết</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="form-input"
                                    rows="4"
                                    placeholder="Mô tả chi tiết sản phẩm..."
                                ></textarea>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Ảnh chính</label>
                                    <input
                                        type="text"
                                        value={formData.mainImage}
                                        onChange={(e) => setFormData({ ...formData, mainImage: e.target.value })}
                                        className="form-input"
                                        placeholder="URL ảnh..."
                                    />
                                </div>
                            </div>

                            <div className="form-actions">
                                <button type="button" className="btn-cancel" onClick={handleCloseModal}>
                                    Hủy
                                </button>
                                <button type="submit" className="btn-save">
                                    {editingProduct ? '💾 Cập nhật' : '➕ Thêm mới'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminProducts;
