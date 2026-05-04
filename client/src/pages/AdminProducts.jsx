import React, { useState, useEffect } from 'react';
import { FiEdit2, FiTrash2, FiPlus, FiSearch, FiFilter, FiEye, FiEyeOff, FiAlertCircle } from 'react-icons/fi';
import axios from 'axios';
import '../styles/admin-products.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const getNumericProductId = (value) => {
    const numericId = Number(value);
    return Number.isInteger(numericId) && numericId > 0 ? numericId : null;
};

const createVariantRowId = () => (
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `variant-${Date.now()}-${Math.random().toString(16).slice(2)}`
);

const DEFAULT_SIZE_OPTIONS = ['S', 'M', 'L', 'XL'];

const createDefaultSizeRows = (initialStock = 0) => DEFAULT_SIZE_OPTIONS.map((size, index) => ({
    size,
    stock: index === 1 ? Number(initialStock) || 0 : 0,
    sku: ''
}));

const createDefaultVariant = (initialStock = 0) => ({
    rowId: createVariantRowId(),
    colorName: 'Mặc định',
    colorHex: '#ffffff',
    colorImage: '',
    sizes: createDefaultSizeRows(initialStock)
});

const calculateVariantTotalStock = (variantRows = []) => variantRows.reduce(
    (total, variant) => total + variant.sizes.reduce((sizeTotal, size) => sizeTotal + (Number(size.stock) || 0), 0),
    0
);

const getNextProductIdFromList = (products = []) => {
    const numericIds = products
        .map((product) => Number(product?.id))
        .filter((id) => Number.isInteger(id) && id > 0);

    if (numericIds.length === 0) {
        return 1;
    }

    return Math.max(...numericIds) + 1;
};

const normalizeAdminVariants = (product) => {
    const fallbackStock = Number(product?.totalStock ?? product?.stock) || 0;

    if (Array.isArray(product?.variants) && product.variants.length > 0) {
        return product.variants.map((variant, index) => ({
            rowId: variant?.rowId || variant?._id || variant?.id || `variant-${index}`,
            colorName: variant?.color?.name || variant?.name || variant?.color || 'Mặc định',
            colorHex: variant?.color?.hex || variant?.hex || '#ffffff',
            colorImage: variant?.color?.image || variant?.image || variant?.img || '',
            sizes: Array.isArray(variant?.sizes) && variant.sizes.length > 0
                ? variant.sizes.map((size) => ({
                    size: size?.size || size?.label || 'M',
                    stock: Number(size?.stock) || 0,
                    sku: size?.sku || ''
                }))
                : createDefaultSizeRows(fallbackStock)
        }));
    }

    return [createDefaultVariant(fallbackStock)];
};

function AdminProducts({ showToast, categories = [] }) {
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [nextProductId, setNextProductId] = useState(null);
    const [nextProductIdLoading, setNextProductIdLoading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        category: 'all',
        status: 'all',
        ai: 'all',
        searchTerm: ''
    });
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Form state
    const [formData, setFormData] = useState({
        productId: '',
        name: '',
        basePrice: '',
        salePrice: '',
        originalPrice: '',
        category: '',
        stock: '',
        rating: '',
        description: '',
        shortDescription: '',
        mainImage: '',
        secondaryImagesText: '',
        secondaryImages: [],
        status: 'active'
    });

    // AI Attributes state
    const [aiAttributes, setAiAttributes] = useState({
        style: [],
        weather: [],
        occasion: [],
        color_tone: 'trung tính',
        fit: 'form vừa',
        material: 'cotton',
    });
    const [variantRows, setVariantRows] = useState([createDefaultVariant(0)]);

    useEffect(() => {
        if (!showModal) return;

        const totalStock = calculateVariantTotalStock(variantRows);
        setFormData(prev => {
            const nextStock = String(totalStock);
            if (prev.stock === nextStock) return prev;
            return { ...prev, stock: nextStock };
        });
    }, [variantRows, showModal]);

    useEffect(() => {
        if (!showModal || editingProduct) return;

        const localNextId = getNextProductIdFromList(products);
        setNextProductId(localNextId);
        setNextProductIdLoading(false);
    }, [showModal, editingProduct, products]);

    useEffect(() => {
        if (!showModal || editingProduct) return;
        if (!nextProductId) return;

        setFormData(prev => {
            if (prev.productId) return prev;
            return {
                ...prev,
                productId: String(nextProductId),
            };
        });
    }, [nextProductId, showModal, editingProduct]);

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
                        salePrice: Number(product.salePrice ?? product.price) || 0,
                        originalPrice: Number(product.originalPrice ?? product.price) || 0,
                        category: product.category || 'Khác',
                        stock: Number(product.totalStock ?? product.stock) || 0,
                        totalStock: Number(product.totalStock ?? product.stock) || 0,
                        variants: Array.isArray(product.variants) ? product.variants : [],
                        description: product.description || '',
                        shortDescription: product.shortDescription || '',
                        mainImage: product.img || product.images?.[0] || '',
                        secondaryImages: Array.isArray(product.secondaryImages)
                            ? product.secondaryImages
                            : Array.isArray(product.images)
                                ? product.images.slice(1)
                                : [],
                        rating: Number(product.rating) || 0,
                        status: product.status === 'inactive' ? 'inactive' : 'active',
                        ai_attributes: product.ai_attributes || null,
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

        // Filter by AI configuration
        if (filters.ai === 'configured') {
            filtered = filtered.filter(p => (p.ai_attributes?.style?.length ?? 0) > 0);
        }
        if (filters.ai === 'missing') {
            filtered = filtered.filter(p => (p.ai_attributes?.style?.length ?? 0) === 0);
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

    // Toggle multi-select for AI attributes (style, weather, occasion)
    const toggleMulti = (field, value) => {
        setAiAttributes(prev => {
            const arr = prev[field];
            return {
                ...prev,
                [field]: arr.includes(value)
                    ? arr.filter(v => v !== value)
                    : [...arr, value]
            };
        });
    };

    const handleOpenModal = (product = null) => {
        if (product) {
            setEditingProduct(product);
            const totalStock = Number(product.totalStock ?? product.stock) || 0;
            setFormData({
                ...product,
                productId: String(product.id || ''),
                stock: String(totalStock),
                totalStock,
                basePrice: String(product.basePrice ?? product.price ?? ''),
                salePrice: String(product.salePrice ?? ''),
                originalPrice: String(product.originalPrice ?? product.basePrice ?? product.price ?? ''),
                rating: String(product.rating ?? ''),
                mainImage: product.mainImage || product.img || '',
                secondaryImagesText: Array.isArray(product.secondaryImages) ? product.secondaryImages.join('\n') : '',
            });
            setVariantRows(normalizeAdminVariants(product));
            // Load AI attributes from product if editing
            if (product.ai_attributes) {
                setAiAttributes(product.ai_attributes);
            } else {
                setAiAttributes({
                    style: [],
                    weather: [],
                    occasion: [],
                    color_tone: 'trung tính',
                    fit: 'form vừa',
                    material: 'cotton',
                });
            }
        } else {
            setEditingProduct(null);
            setFormData({
                productId: nextProductId ? String(nextProductId) : '',
                name: '',
                basePrice: '',
                salePrice: '',
                originalPrice: '',
                category: '',
                stock: '0',
                totalStock: 0,
                rating: '',
                description: '',
                shortDescription: '',
                mainImage: '',
                secondaryImagesText: '',
                secondaryImages: [],
                status: 'active'
            });
            setVariantRows([createDefaultVariant(0)]);
            setNextProductId(null);
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingProduct(null);
        setVariantRows([createDefaultVariant(0)]);
        setNextProductId(null);
        setNextProductIdLoading(false);
        setAiAttributes({
            style: [],
            weather: [],
            occasion: [],
            color_tone: 'trung tính',
            fit: 'form vừa',
            material: 'cotton',
        });
    };

    const handleSaveProduct = async (e) => {
        e.preventDefault();

        const submittedProductId = getNumericProductId(formData.productId) || nextProductId || getNextProductIdFromList(products);
        const secondaryImages = String(formData.secondaryImagesText || '')
            .split(/\r?\n|,/)
            .map((item) => item.trim())
            .filter(Boolean);
        const resolvedImages = [formData.mainImage, ...secondaryImages].filter(Boolean);

        const normalizedVariants = variantRows.map((variant) => ({
            color: {
                name: variant.colorName || 'Mặc định',
                hex: variant.colorHex || '#ffffff',
                image: variant.colorImage || ''
            },
            sizes: variant.sizes.map((size) => ({
                size: size.size || 'M',
                stock: Number(size.stock) || 0,
                sku: size.sku || ''
            }))
        }));
        const totalStock = calculateVariantTotalStock(variantRows);

        const missingFields = [];
        if (!submittedProductId) missingFields.push('ID sản phẩm');
        if (!String(formData.name || '').trim()) missingFields.push('Tên sản phẩm');
        if (!String(formData.category || '').trim()) missingFields.push('Danh mục');
        if (!String(formData.originalPrice || '').trim()) missingFields.push('Giá gốc');
        if (!String(formData.basePrice || '').trim()) missingFields.push('Giá bán');
        if (!String(formData.mainImage || '').trim()) missingFields.push('Ảnh chính');

        if (missingFields.length > 0) {
            showToast?.(`Thiếu thông tin bắt buộc: ${missingFields.join(', ')}`, 'warning');
            return;
        }

        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        try {
            if (editingProduct) {
                const payload = {
                    id: submittedProductId,
                    name: formData.name,
                    price: Number(formData.basePrice),
                    originalPrice: Number(formData.originalPrice) || Number(formData.basePrice),
                    category: formData.category,
                    stock: totalStock,
                    totalStock,
                    variants: normalizedVariants,
                    description: formData.description,
                    shortDescription: formData.shortDescription,
                    img: formData.mainImage,
                    secondaryImages,
                    images: resolvedImages,
                    rating: 0,
                    reviewCount: 0,
                    status: formData.status,
                    ai_attributes: aiAttributes
                };
                await axios.put(`${API_URL}/api/products/${editingProduct._id}`, payload, { headers });
                const updatedProducts = products.map(p =>
                    p.id === editingProduct.id ? {
                        ...p,
                        ...formData,
                        id: submittedProductId,
                        basePrice: Number(formData.basePrice),
                        originalPrice: Number(formData.originalPrice) || Number(formData.basePrice),
                        stock: totalStock,
                        totalStock,
                        variants: normalizedVariants,
                        secondaryImages,
                        mainImage: formData.mainImage,
                        images: resolvedImages,
                        rating: 0,
                        reviewCount: 0,
                        ai_attributes: aiAttributes
                    } : p
                );
                setProducts(updatedProducts);
                showToast?.('Cập nhật sản phẩm thành công', 'success');
            } else {
                const payload = {
                    id: submittedProductId,
                    name: formData.name,
                    price: Number(formData.basePrice),
                    originalPrice: Number(formData.originalPrice) || Number(formData.basePrice),
                    category: formData.category,
                    stock: totalStock,
                    totalStock,
                    variants: normalizedVariants,
                    description: formData.description,
                    shortDescription: formData.shortDescription,
                    img: formData.mainImage,
                    secondaryImages,
                    images: resolvedImages,
                    rating: 0,
                    reviewCount: 0,
                    status: formData.status,
                    ai_attributes: aiAttributes
                };
                const res = await axios.post(`${API_URL}/api/products`, payload, { headers });
                const saved = res.data;
                const newProduct = {
                    ...formData,
                    _id: saved._id,
                    id: getNumericProductId(saved.id) || submittedProductId || Date.now(),
                    basePrice: Number(formData.basePrice),
                    originalPrice: Number(formData.originalPrice) || Number(formData.basePrice),
                    stock: totalStock,
                    totalStock,
                    variants: normalizedVariants,
                    secondaryImages,
                    mainImage: formData.mainImage,
                    images: resolvedImages,
                    rating: 0,
                    reviewCount: 0,
                    soldQuantity: 0,
                    totalRevenue: 0,
                    ai_attributes: aiAttributes
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

    const totalStockPreview = calculateVariantTotalStock(variantRows);
    const originalPriceValue = Number(formData.originalPrice) || 0;
    const sellingPriceValue = Number(formData.basePrice) || 0;
    const discountPreview = originalPriceValue > sellingPriceValue
        ? Math.round((1 - (sellingPriceValue / originalPriceValue)) * 100)
        : 0;

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

                <div className="filter-group" style={{ flex: 0 }}>
                    <label>AI Stylist</label>
                    <select
                        value={filters.ai}
                        onChange={(e) => setFilters({ ...filters, ai: e.target.value })}
                        className="filter-select"
                    >
                        <option value="all">Tất cả AI</option>
                        <option value="configured">✦ Đã cấu hình AI</option>
                        <option value="missing">Chưa cấu hình AI</option>
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
                            <th className="col-ai">AI Stylist</th>
                            <th>Giá</th>
                            <th>Tồn kho</th>
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
                                        <td className="col-ai">
                                            {(product.ai_attributes?.style?.length ?? 0) > 0 ? (
                                                <span className="ai-configured-badge">✦ Đã cấu hình</span>
                                            ) : (
                                                <span className="ai-missing-badge">Chưa có</span>
                                            )}
                                        </td>
                                        <td className="price">{formatCurrency(product.basePrice || 0)}</td>
                                        <td style={{ textAlign: 'center', fontWeight: '600', color: '#2563eb' }}>
                                            {Number(product.totalStock ?? product.stock) || 0}
                                        </td>
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
                                <td colSpan="10" style={{ textAlign: 'center', padding: '20px' }}>
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
                    <div className="modal-content product-modal" onClick={(e) => e.stopPropagation()}>
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
                                    <div className="product-id-box">
                                        <span className="product-id-label">
                                            {editingProduct ? 'ID hiện tại' : 'ID tự sinh'}
                                        </span>
                                        <strong className="product-id-badge">
                                            {editingProduct
                                                ? String(editingProduct.id)
                                                : (nextProductIdLoading
                                                    ? 'Đang tải...'
                                                    : (formData.productId || nextProductId || 'Chưa có'))}
                                        </strong>
                                    </div>
                                    <small className="form-help-text">
                                        {editingProduct
                                            ? 'Không chỉnh sửa ID của sản phẩm đang tồn tại.'
                                            : 'Hệ thống tự cấp ID số tăng dần.'}
                                    </small>
                                </div>
                            </div>

                            <div className="form-group form-field--full">
                                <label>Mô tả sản phẩm</label>
                                <textarea
                                    value={formData.description || ''}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Mô tả ngắn về chất liệu, kiểu dáng, đặc điểm nổi bật..."
                                    className="textarea-desc"
                                    rows={3}
                                />
                                <span className="field-hint">{(formData.description || '').length}/500 ký tự</span>
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

                            <div className="price-block form-field--full">
                                <div className="price-block-header">
                                    <span className="price-block-title">Thông tin giá</span>
                                    {discountPreview > 0 && (
                                        <span className="price-discount-preview">
                                            Tiết kiệm {discountPreview}%
                                        </span>
                                    )}
                                </div>
                                <div className="price-grid">
                                    <div className="form-group">
                                        <label>Giá gốc <span className="required">*</span></label>
                                        <input
                                            type="number"
                                            required
                                            value={formData.originalPrice}
                                            onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                                            className="form-input"
                                            placeholder="150000"
                                        />
                                        <span className="field-hint">Giá niêm yết gốc</span>
                                    </div>
                                    <div className="form-group">
                                        <label>Giá bán <span className="required">*</span></label>
                                        <input
                                            type="number"
                                            required
                                            value={formData.basePrice}
                                            onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                                            className="form-input"
                                            placeholder="120000"
                                        />
                                        <span className="field-hint">Giá hiển thị cho khách</span>
                                    </div>
                                    <div className="form-group">
                                        <label>Giá Flash Sale</label>
                                        <input
                                            type="number"
                                            value={formData.salePrice}
                                            onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
                                            className="form-input"
                                            placeholder="Không bắt buộc"
                                        />
                                        <span className="field-hint">Để trống nếu không có</span>
                                    </div>
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Tổng số lượng</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={formData.stock}
                                        readOnly
                                        className="form-input"
                                        placeholder="Tự tính từ biến thể"
                                    />
                                    <small className="form-help-text">Tổng tồn kho được tính tự động từ màu sắc và size.</small>
                                </div>
                            </div>

                            <div className="variant-section">
                                <div className="variant-section-header">
                                    <div>
                                        <h3>Biến thể sản phẩm</h3>
                                        <p>Màu sắc, size và số lượng còn lại cho từng lựa chọn.</p>
                                    </div>
                                    <button
                                        type="button"
                                        className="variant-add-btn"
                                        onClick={() => setVariantRows(prev => [...prev, createDefaultVariant(0)])}
                                    >
                                        + Thêm màu
                                    </button>
                                </div>

                                <div className="variant-summary">
                                    <span>Tổng biến thể: {variantRows.length}</span>
                                    <span>Tồn kho: {formData.stock || 0}</span>
                                </div>

                                <div className="variant-list">
                                    {variantRows.map((variant, variantIndex) => (
                                        <div className="variant-card" key={variant.rowId || variantIndex}>
                                            <div className="variant-card-header">
                                                <strong>Biến thể màu {variantIndex + 1}</strong>
                                                {variantRows.length > 1 && (
                                                    <button
                                                        type="button"
                                                        className="variant-remove-btn"
                                                        onClick={() => setVariantRows(prev => prev.filter((_, index) => index !== variantIndex))}
                                                    >
                                                        Xóa màu
                                                    </button>
                                                )}
                                            </div>

                                            <div className="variant-color-grid">
                                                <div className="form-group">
                                                    <label>Tên màu</label>
                                                    <input
                                                        type="text"
                                                        value={variant.colorName}
                                                        onChange={(e) => setVariantRows(prev => prev.map((item, index) => (
                                                            index === variantIndex ? { ...item, colorName: e.target.value } : item
                                                        )))}
                                                        className="form-input"
                                                        placeholder="Trắng, Đen, Xanh..."
                                                    />
                                                </div>
                                                <div className="form-group">
                                                    <label>Mã màu</label>
                                                    <input
                                                        type="text"
                                                        value={variant.colorHex}
                                                        onChange={(e) => setVariantRows(prev => prev.map((item, index) => (
                                                            index === variantIndex ? { ...item, colorHex: e.target.value } : item
                                                        )))}
                                                        className="form-input"
                                                        placeholder="#ffffff"
                                                    />
                                                </div>
                                                <div className="form-group">
                                                    <label>Ảnh màu</label>
                                                    <input
                                                        type="text"
                                                        value={variant.colorImage}
                                                        onChange={(e) => setVariantRows(prev => prev.map((item, index) => (
                                                            index === variantIndex ? { ...item, colorImage: e.target.value } : item
                                                        )))}
                                                        className="form-input"
                                                        placeholder="URL ảnh màu..."
                                                    />
                                                </div>
                                            </div>

                                            <div className="variant-size-section">
                                                <div className="variant-size-header">
                                                    <span>Size & số lượng</span>
                                                    <button
                                                        type="button"
                                                        className="variant-add-size-btn"
                                                        onClick={() => setVariantRows(prev => prev.map((item, index) => (
                                                            index === variantIndex
                                                                ? { ...item, sizes: [...item.sizes, { size: '', stock: 0, sku: '' }] }
                                                                : item
                                                        )))}
                                                    >
                                                        + Thêm size
                                                    </button>
                                                </div>

                                                <div className="variant-size-list">
                                                    {variant.sizes.map((sizeItem, sizeIndex) => (
                                                        <div className="variant-size-row" key={`${variantIndex}-${sizeIndex}`}>
                                                            <div className="form-group">
                                                                <label>Size</label>
                                                                <input
                                                                    type="text"
                                                                    value={sizeItem.size}
                                                                    onChange={(e) => setVariantRows(prev => prev.map((item, index) => (
                                                                        index === variantIndex ? {
                                                                            ...item,
                                                                            sizes: item.sizes.map((size, currentSizeIndex) => (
                                                                                currentSizeIndex === sizeIndex ? { ...size, size: e.target.value } : size
                                                                            ))
                                                                        } : item
                                                                    )))}
                                                                    className="form-input"
                                                                    placeholder="S, M, L..."
                                                                />
                                                            </div>
                                                            <div className="form-group">
                                                                <label>Số lượng</label>
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    value={sizeItem.stock}
                                                                    onChange={(e) => setVariantRows(prev => prev.map((item, index) => (
                                                                        index === variantIndex ? {
                                                                            ...item,
                                                                            sizes: item.sizes.map((size, currentSizeIndex) => (
                                                                                currentSizeIndex === sizeIndex ? { ...size, stock: Number(e.target.value) || 0 } : size
                                                                            ))
                                                                        } : item
                                                                    )))}
                                                                    className="form-input"
                                                                    placeholder="0"
                                                                />
                                                            </div>
                                                            <div className="form-group">
                                                                <label>SKU</label>
                                                                <input
                                                                    type="text"
                                                                    value={sizeItem.sku}
                                                                    onChange={(e) => setVariantRows(prev => prev.map((item, index) => (
                                                                        index === variantIndex ? {
                                                                            ...item,
                                                                            sizes: item.sizes.map((size, currentSizeIndex) => (
                                                                                currentSizeIndex === sizeIndex ? { ...size, sku: e.target.value } : size
                                                                            ))
                                                                        } : item
                                                                    )))}
                                                                    className="form-input"
                                                                    placeholder="SKU-001"
                                                                />
                                                            </div>
                                                            {variant.sizes.length > 1 && (
                                                                <button
                                                                    type="button"
                                                                    className="variant-remove-size-btn"
                                                                    onClick={() => setVariantRows(prev => prev.map((item, index) => (
                                                                        index === variantIndex ? {
                                                                            ...item,
                                                                            sizes: item.sizes.filter((_, currentSizeIndex) => currentSizeIndex !== sizeIndex)
                                                                        } : item
                                                                    )))}
                                                                >
                                                                    Xóa size
                                                                </button>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="form-group form-field--full">
                                <label>Mô tả ngắn</label>
                                <textarea
                                    value={formData.shortDescription}
                                    onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                                    className="textarea-desc"
                                    rows="2"
                                    placeholder="Mô tả ngắn sản phẩm..."
                                ></textarea>
                                <span className="field-hint">Mô tả ngắn dùng ở card và trang danh sách.</span>
                            </div>

                            <div className="form-field form-field--full">
                                <label>Ảnh chính <span className="required">*</span></label>
                                <input
                                    type="text"
                                    value={formData.mainImage}
                                    onChange={(e) => setFormData({ ...formData, mainImage: e.target.value })}
                                    className="form-input"
                                    placeholder="https://... URL ảnh chính của sản phẩm"
                                />
                                <span className="field-hint">Ảnh hiển thị ngoài trang shop và card sản phẩm</span>

                                {(formData.mainImage || '') && (
                                    <div className="img-preview">
                                        <img
                                            src={formData.mainImage}
                                            alt="Preview"
                                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                        />
                                        <span className="img-preview-label">Preview</span>
                                    </div>
                                )}
                            </div>

                            <div className="form-field form-field--full">
                                <label>Ảnh phụ</label>
                                <textarea
                                    value={formData.secondaryImagesText}
                                    onChange={(e) => setFormData({ ...formData, secondaryImagesText: e.target.value })}
                                    className="textarea-desc"
                                    rows="3"
                                    placeholder="Mỗi URL 1 dòng\nhttps://...\nhttps://..."
                                ></textarea>
                                <span className="field-hint">Mỗi URL một dòng — hiển thị trong gallery trang chi tiết</span>
                            </div>

                            {/* ── AI STYLIST CONFIG SECTION ── */}
                            <div className="ai-config-section form-field--full">
                                <div className="ai-config-header">
                                    <span className="ai-config-icon">✦</span>
                                    <h3 className="ai-config-title">Cấu hình AI Stylist</h3>
                                    <p className="ai-config-desc">Giúp AI gợi ý sản phẩm này đúng người, đúng dịp</p>
                                </div>

                                <div className="ai-field">
                                    <label className="ai-label">Danh mục AI</label>
                                    <div className="form-input" style={{ background: '#f5f5f3', color: '#666' }}>
                                        AI sẽ tự lấy theo danh mục sản phẩm
                                    </div>
                                    <small className="form-help-text">Không cần chọn thủ công. Sau này AI sẽ đọc từ danh mục sản phẩm.</small>
                                </div>

                                {/* Phong cách — multi select dạng tag */}
                                <div className="ai-field">
                                    <label className="ai-label">Phong cách <span className="ai-hint">Chọn nhiều</span></label>
                                    <div className="ai-tags">
                                        {['casual', 'công sở', 'thể thao', 'vintage', 'streetwear', 'thanh lịch', 'tối giản', 'dạo phố'].map(s => (
                                            <button
                                                key={s} type="button"
                                                className={`ai-tag${aiAttributes.style.includes(s) ? ' ai-tag--on' : ''}`}
                                                onClick={() => toggleMulti('style', s)}
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Thời tiết phù hợp */}
                                <div className="ai-field">
                                    <label className="ai-label">Thời tiết phù hợp <span className="ai-hint">Chọn nhiều</span></label>
                                    <div className="ai-tags">
                                        {['nóng', 'mát mẻ', 'lạnh', 'mưa', 'mọi thời tiết'].map(w => (
                                            <button
                                                key={w} type="button"
                                                className={`ai-tag${aiAttributes.weather.includes(w) ? ' ai-tag--on' : ''}`}
                                                onClick={() => toggleMulti('weather', w)}
                                            >
                                                {w}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Dịp mặc */}
                                <div className="ai-field">
                                    <label className="ai-label">Dịp mặc <span className="ai-hint">Chọn nhiều</span></label>
                                    <div className="ai-tags">
                                        {['đi học', 'đi làm', 'đi chơi', 'đi cafe', 'hẹn hò', 'thể thao', 'ở nhà', 'tiệc', 'đi biển'].map(o => (
                                            <button
                                                key={o} type="button"
                                                className={`ai-tag${aiAttributes.occasion.includes(o) ? ' ai-tag--on' : ''}`}
                                                onClick={() => toggleMulti('occasion', o)}
                                            >
                                                {o}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* 3 dropdown còn lại */}
                                <div className="ai-field-row">
                                    <div className="ai-field">
                                        <label className="ai-label">Tông màu</label>
                                        <select className="ai-select" value={aiAttributes.color_tone}
                                            onChange={e => setAiAttributes(prev => ({ ...prev, color_tone: e.target.value }))}>
                                            {['sáng', 'tối', 'trung tính', 'nổi bật', 'pastel'].map(c => <option key={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div className="ai-field">
                                        <label className="ai-label">Form dáng</label>
                                        <select className="ai-select" value={aiAttributes.fit}
                                            onChange={e => setAiAttributes(prev => ({ ...prev, fit: e.target.value }))}>
                                            {['form vừa', 'rộng', 'ôm', 'oversize'].map(f => <option key={f}>{f}</option>)}
                                        </select>
                                    </div>
                                    <div className="ai-field">
                                        <label className="ai-label">Chất liệu</label>
                                        <select className="ai-select" value={aiAttributes.material}
                                            onChange={e => setAiAttributes(prev => ({ ...prev, material: e.target.value }))}>
                                            {['cotton', 'denim', 'linen', 'silk', 'knitwear', 'polyester', 'khác'].map(m => <option key={m}>{m}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="modal-footer form-field--full">
                                <div className="footer-left">
                                    <span className="footer-stock-info">
                                        Tổng kho:{' '}
                                        <strong>{totalStockPreview} sản phẩm</strong>
                                    </span>
                                </div>
                                <div className="footer-right">
                                    <button type="button" className="btn-cancel" onClick={handleCloseModal}>
                                        Hủy
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn-save"
                                        disabled={
                                            !String(formData.name || '').trim()
                                            || !String(formData.category || '').trim()
                                            || !String(formData.originalPrice || '').trim()
                                            || !String(formData.basePrice || '').trim()
                                            || !String(formData.mainImage || '').trim()
                                        }
                                    >
                                        {editingProduct ? '💾 Lưu thay đổi' : '+ Thêm mới'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminProducts;
