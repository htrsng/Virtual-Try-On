import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

function AdminPage({
    products, setProducts,
    topSearch, setTopSearch,
    topProducts, setTopProducts,
    categories, setCategories,
    users, setUsers,
    bannerData, setBannerData,
    flashSaleProducts, setFlashSaleProducts,
    currentUser, showToast
}) {
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();
    const [activeTab, setActiveTab] = useState('products');
    const [editingItem, setEditingItem] = useState(null);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    // State cho banner content
    const [bannerContents, setBannerContents] = useState([]);
    const [editingBannerContent, setEditingBannerContent] = useState(null);

    // Sử dụng user từ AuthContext, fallback về currentUser nếu cần
    const adminUser = user || currentUser;

    // Load banner contents
    useEffect(() => {
        if (activeTab === 'banner_content') {
            fetchBannerContents();
        }
    }, [activeTab]);

    const fetchBannerContents = async () => {
        try {
            const response = await axios.get('http://localhost:3000/api/banner-contents');
            setBannerContents(response.data);
        } catch (error) {
            console.error('Error fetching banner contents:', error);
        }
    };

    if (!isAuthenticated || !adminUser || adminUser.role !== 'admin') {
        return (
            <div style={{ textAlign: 'center', marginTop: '50px', padding: '40px' }}>
                <h2 style={{
                    fontSize: '28px',
                    marginBottom: '20px',
                    color: 'var(--text-primary)'
                }}>
                    ⚠️ Bạn không có quyền truy cập trang này!
                </h2>
                <p style={{
                    fontSize: '16px',
                    color: 'var(--text-secondary)',
                    marginBottom: '30px'
                }}>
                    Chỉ quản trị viên mới có thể truy cập trang quản lý.
                </p>
                <button
                    onClick={() => navigate('/')}
                    className="pay-btn"
                    style={{
                        width: '200px',
                        background: 'var(--accent-gradient)',
                        border: 'none',
                        color: 'white',
                        padding: '12px 24px',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '16px',
                        fontWeight: '600',
                        cursor: 'pointer'
                    }}
                >
                    Về Trang Chủ
                </button>
            </div>
        );
    }

    const getCurrentList = () => {
        if (activeTab === 'products') return products;
        if (activeTab === 'top_search') return topSearch;
        if (activeTab === 'top_products_manage') return topProducts;
        if (activeTab === 'categories') return categories;
        if (activeTab === 'users') return users;
        if (activeTab === 'flash_sale') return flashSaleProducts;
        return [];
    };

    const currentList = getCurrentList();
    const totalPages = Math.ceil(currentList.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = currentList.slice(indexOfFirstItem, indexOfLastItem);

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const handleDelete = async (list, setList, id) => {
        if (window.confirm("Bạn chắc chắn muốn xóa?")) {
            // Xóa Sản Phẩm từ database (luôn gọi API vì tất cả sản phẩm đều lưu trong DB)
            if (activeTab === 'products') {
                try {
                    // Tìm sản phẩm để lấy _id
                    const product = list.find(p => String(p.id) === String(id));
                    if (product && product._id) {
                        await fetch(`http://localhost:3000/api/products/${product._id}`, { method: 'DELETE' });
                    }
                } catch (err) {
                    console.error('Lỗi xóa sản phẩm:', err);
                }
            }
            // Xóa User
            if (activeTab === 'users') {
                try {
                    const user = list.find(u => String(u.id) === String(id));
                    if (user && user._id) {
                        await fetch(`http://localhost:3000/api/users/${user._id}`, { method: 'DELETE' });
                    }
                } catch (err) {
                    console.error('Lỗi xóa user:', err);
                }
            }

            // So sánh id bằng String() để tránh lỗi type mismatch
            const updatedList = list.filter(item => String(item.id) !== String(id));
            setList(updatedList);

            // Lưu vào localStorage (KHÔNG lưu users vì đã load từ database)
            if (activeTab === 'products') localStorage.setItem('products', JSON.stringify(updatedList));
            else if (activeTab === 'top_search') localStorage.setItem('topSearch', JSON.stringify(updatedList));
            else if (activeTab === 'top_products_manage') localStorage.setItem('topProducts', JSON.stringify(updatedList));
            else if (activeTab === 'flash_sale') localStorage.setItem('flashSaleProducts', JSON.stringify(updatedList));
            else if (activeTab === 'categories') localStorage.setItem('categories', JSON.stringify(updatedList));
            // KHÔNG lưu users vào localStorage nữa, nó sẽ load từ database

            showToast("Đã xóa thành công!", "success");
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        const form = e.target;

        if (activeTab === 'banner') {
            const newBannerData = {
                big: [form.big1.value, form.big2.value, form.big3.value],
                smallTop: form.smallTop.value,
                smallBottom: form.smallBottom.value
            };
            setBannerData(newBannerData);
            localStorage.setItem('bannerData', JSON.stringify(newBannerData));
            showToast("Đã cập nhật Banner!", "success");
            return;
        }

        if (activeTab === 'products') {
            const isNew = !editingItem || !editingItem.id;
            const defaultImg = "https://placehold.co/200x200?text=No+Image";

            const newItemData = {
                name: form.name.value,
                price: Number(form.price.value),
                category: form.category.value,
                img: form.img.value || defaultImg,
                description: form.description.value,
                sold: 0
            };

            if (isNew) {
                try {
                    const res = await fetch('http://localhost:3000/api/products', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(newItemData)
                    });
                    const savedProduct = await res.json();
                    // Ưu tiên id numeric từ server, fallback về _id
                    const formattedProduct = { 
                        ...savedProduct, 
                        id: savedProduct.id || savedProduct._id 
                    };

                    const updatedProducts = [...products, formattedProduct];
                    setProducts(updatedProducts);
                    localStorage.setItem('products', JSON.stringify(updatedProducts));
                    showToast("Đã lưu vào CSDL thành công!", "success");
                } catch (err) {
                    showToast("Lỗi kết nối Server!", "error");
                }
            } else {
                if (typeof editingItem.id === 'string' && editingItem.id.length > 20) {
                    await fetch(`http://localhost:3000/api/products/${editingItem.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(newItemData)
                    });
                }
                // So sánh id bằng String() để tránh lỗi type mismatch
                const updatedProducts = products.map(p => String(p.id) === String(editingItem.id) ? { ...p, ...newItemData } : p);
                setProducts(updatedProducts);
                localStorage.setItem('products', JSON.stringify(updatedProducts));
                showToast("Đã cập nhật sản phẩm!", "success");
            }
        } else {
            // Kiểm tra xem có phải sản phẩm được chọn từ dropdown không
            // Nếu có _fromExisting = true và có id, dùng id đó thay vì tạo mới
            const useExistingId = editingItem._fromExisting && editingItem.id;

            const newItem = {
                id: useExistingId ? editingItem.id : (editingItem.id || Date.now()),
                name: form.name.value,
                img: form.img.value || "https://placehold.co/200x200?text=No+Image",
                sold: form.sold?.value,
                price: form.price ? Number(form.price.value) : 0,
                category: form.category?.value,
                description: form.description?.value,
                discount: form.discount ? Number(form.discount.value) : 50,
                stock: form.stock ? Number(form.stock.value) : 20,
                originalPrice: form.price ? Math.round(Number(form.price.value) * (1 + (form.discount ? Number(form.discount.value) / 100 : 0.5))) : 0
            };

            if (activeTab === 'flash_sale') {
                const updatedFlashSale = editingItem
                    ? flashSaleProducts.map(p => String(p.id) === String(newItem.id) ? newItem : p)
                    : [...flashSaleProducts, newItem];
                setFlashSaleProducts(updatedFlashSale);
                localStorage.setItem('flashSaleProducts', JSON.stringify(updatedFlashSale));
            } else if (activeTab === 'top_search') {
                const updatedTopSearch = editingItem
                    ? topSearch.map(p => String(p.id) === String(newItem.id) ? newItem : p)
                    : [...topSearch, newItem];
                setTopSearch(updatedTopSearch);
                localStorage.setItem('topSearch', JSON.stringify(updatedTopSearch));
            } else if (activeTab === 'top_products_manage') {
                const updatedTopProducts = editingItem
                    ? topProducts.map(p => String(p.id) === String(newItem.id) ? newItem : p)
                    : [...topProducts, newItem];
                setTopProducts(updatedTopProducts);
                localStorage.setItem('topProducts', JSON.stringify(updatedTopProducts));
            } else if (activeTab === 'categories') {
                const updatedCategories = editingItem
                    ? categories.map(c => String(c.id) === String(newItem.id) ? newItem : c)
                    : [...categories, newItem];
                setCategories(updatedCategories);
                localStorage.setItem('categories', JSON.stringify(updatedCategories));
            }
            showToast("Đã lưu thay đổi!", "success");
        }

        setEditingItem(null);
        setCurrentPage(1);
        form.reset();
    };

    const toggleAdminRole = async (userId) => {
        const user = users.find(u => String(u.id) === String(userId));
        const newRole = user.role === 'admin' ? 'user' : 'admin';

        // Cập nhật Server nếu là user thật
        if (typeof userId === 'string' && userId.length > 20) {
            await fetch(`http://localhost:3000/api/users/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: newRole })
            });
        }

        setUsers(users.map(u => {
            if (String(u.id) === String(userId)) {
                return { ...u, role: newRole };
            }
            return u;
        }));
        showToast("Đã thay đổi quyền thành viên!", "success");
    }

    return (
        <div className="container admin-container">
            <div className="admin-sidebar">
                <h3 style={{ marginTop: 0, color: '#ee4d2d' }}>QUẢN TRỊ VIÊN</h3>
                <div className={`admin-menu-item ${activeTab === 'products' ? 'active' : ''}`} onClick={() => { setActiveTab('products'); setEditingItem(null); setCurrentPage(1); }}>Gợi ý hôm nay</div>
                <div className={`admin-menu-item ${activeTab === 'top_search' ? 'active' : ''}`} onClick={() => { setActiveTab('top_search'); setEditingItem(null); setCurrentPage(1); }}>Tìm kiếm hàng đầu</div>
                <div className={`admin-menu-item ${activeTab === 'top_products_manage' ? 'active' : ''}`} onClick={() => { setActiveTab('top_products_manage'); setEditingItem(null); setCurrentPage(1); }}>Quản lý sản phẩm hàng đầu</div>
                <div className={`admin-menu-item ${activeTab === 'flash_sale' ? 'active' : ''}`} onClick={() => { setActiveTab('flash_sale'); setEditingItem(null); setCurrentPage(1); }}>⚡ Flash Sale</div>
                <div className={`admin-menu-item ${activeTab === 'categories' ? 'active' : ''}`} onClick={() => { setActiveTab('categories'); setEditingItem(null); setCurrentPage(1); }}>Danh mục</div>
                <div className={`admin-menu-item ${activeTab === 'banner' ? 'active' : ''}`} onClick={() => { setActiveTab('banner'); setEditingItem(null); }}>Quản lý Banner</div>
                <div className={`admin-menu-item ${activeTab === 'banner_content' ? 'active' : ''}`} onClick={() => { setActiveTab('banner_content'); setEditingItem(null); setCurrentPage(1); }}>Nội dung Banner</div>
                <div className={`admin-menu-item ${activeTab === 'users' ? 'active' : ''}`} onClick={() => { setActiveTab('users'); setEditingItem(null); setCurrentPage(1); }}>Quản lý tài khoản</div>
                <div className="admin-menu-item" onClick={() => navigate('/')}>← Về trang chủ</div>
            </div>

            <div className="admin-content">
                <div className="admin-header">
                    <h2>
                        {activeTab === 'products' && 'Quản lý Sản Phẩm Gợi Ý'}
                        {activeTab === 'top_search' && 'Quản lý Tìm Kiếm Hàng Đầu'}
                        {activeTab === 'top_products_manage' && 'Quản lý Sản Phẩm Hàng Đầu'}                        {activeTab === 'flash_sale' && '⚡ Quản lý Flash Sale'}                        {activeTab === 'categories' && 'Quản lý Danh Mục'}
                        {activeTab === 'banner' && 'Thay đổi Hình ảnh Banner'}
                        {activeTab === 'users' && 'Quản lý Người Dùng'}
                    </h2>
                    {activeTab !== 'users' && activeTab !== 'banner' && (
                        <button className="admin-btn btn-add" onClick={() => setEditingItem({})}>+ Thêm Mới</button>
                    )}
                </div>

                {activeTab === 'banner' && (
                    <form onSubmit={handleSave} style={{ background: '#fff', padding: '20px' }}>
                        <h3 style={{ marginTop: 0 }}>Banner Lớn (Chạy Slide)</h3>
                        <div className="form-group">
                            <label className="form-label">Link Ảnh 1:</label>
                            <input name="big1" className="form-input" defaultValue={bannerData.big[0]} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Link Ảnh 2:</label>
                            <input name="big2" className="form-input" defaultValue={bannerData.big[1]} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Link Ảnh 3:</label>
                            <input name="big3" className="form-input" defaultValue={bannerData.big[2]} required />
                        </div>

                        <h3 style={{ marginTop: '30px' }}>Banner Nhỏ (Bên phải)</h3>
                        <div className="form-group">
                            <label className="form-label">Link Ảnh Trên:</label>
                            <input name="smallTop" className="form-input" defaultValue={bannerData.smallTop} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Link Ảnh Dưới:</label>
                            <input name="smallBottom" className="form-input" defaultValue={bannerData.smallBottom} required />
                        </div>

                        <div className="form-actions">
                            <button type="submit" className="admin-btn btn-add" style={{ fontSize: '16px', padding: '10px 30px' }}>Lưu Thay Đổi</button>
                        </div>
                    </form>
                )}

                {editingItem && activeTab !== 'users' && activeTab !== 'banner' && (
                    <form onSubmit={handleSave} style={{ background: '#f9f9f9', padding: '20px', marginBottom: '20px', border: '1px solid #eee' }}>
                        <h3>{editingItem.id ? 'Sửa thông tin' : 'Thêm mới'}</h3>

                        {/* Dropdown chọn từ sản phẩm có sẵn (chỉ khi thêm mới vào topSearch, topProducts, flashSale) */}
                        {!editingItem.id && (activeTab === 'top_search' || activeTab === 'top_products_manage' || activeTab === 'flash_sale') && (
                            <div className="form-group" style={{ background: '#fff3cd', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
                                <label className="form-label" style={{ fontWeight: 'bold', color: '#856404' }}>
                                    📌 Chọn nhanh từ sản phẩm có sẵn (ID sẽ đồng bộ với database):
                                </label>
                                <select
                                    className="form-input"
                                    onChange={(e) => {
                                        if (e.target.value) {
                                            const selectedProduct = products.find(p => String(p.id) === e.target.value);
                                            if (selectedProduct) {
                                                // Auto-fill form
                                                document.querySelector('input[name="name"]').value = selectedProduct.name;
                                                document.querySelector('input[name="img"]').value = selectedProduct.img;
                                                if (document.querySelector('input[name="price"]')) {
                                                    document.querySelector('input[name="price"]').value = selectedProduct.price;
                                                }
                                                if (document.querySelector('select[name="category"]')) {
                                                    document.querySelector('select[name="category"]').value = selectedProduct.category;
                                                }
                                                if (document.querySelector('textarea[name="description"]')) {
                                                    document.querySelector('textarea[name="description"]').value = selectedProduct.description || '';
                                                }
                                                // Lưu id gốc để dùng sau
                                                setEditingItem({ ...editingItem, id: selectedProduct.id, _fromExisting: true });
                                            }
                                        }
                                    }}
                                    style={{ background: 'white' }}
                                >
                                    <option value="">-- Chọn sản phẩm từ database --</option>
                                    {products.map(p => (
                                        <option key={p.id} value={p.id}>
                                            {p.name} (ID: {p.id})
                                        </option>
                                    ))}
                                </select>
                                <small style={{ color: '#856404', display: 'block', marginTop: '5px' }}>
                                    💡 Khuyến nghị: Chọn từ danh sách này để ID đồng bộ với "Gợi ý hôm nay"
                                </small>
                            </div>
                        )}

                        <div className="form-group">
                            <label className="form-label">Tên:</label>
                            <input name="name" className="form-input" defaultValue={editingItem.name} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Link Ảnh:</label>
                            <input name="img" className="form-input" defaultValue={editingItem.img} placeholder="https://..." />
                        </div>

                        {(activeTab === 'products' || activeTab === 'flash_sale') && (
                            <>
                                <div className="form-group">
                                    <label className="form-label">Giá tiền (Nhập số):</label>
                                    <input name="price" type="number" className="form-input" defaultValue={editingItem.price} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Danh mục:</label>
                                    <select name="category" className="form-input" defaultValue={editingItem.category}>
                                        {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Mô tả chi tiết:</label>
                                    <textarea name="description" className="form-input" rows="3" defaultValue={editingItem.description || "Chất liệu cao cấp, bền đẹp..."}></textarea>
                                </div>
                            </>
                        )}

                        {activeTab === 'flash_sale' && (
                            <>
                                <div className="form-group">
                                    <label className="form-label">Giảm giá (%):</label>
                                    <input name="discount" type="number" className="form-input" defaultValue={editingItem.discount || 50} min="1" max="99" required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Số lượng trong kho:</label>
                                    <input name="stock" type="number" className="form-input" defaultValue={editingItem.stock || 20} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Đã bán:</label>
                                    <input name="sold" type="number" className="form-input" defaultValue={editingItem.sold || 0} required />
                                </div>
                            </>
                        )}

                        {activeTab === 'top_search' && (
                            <>
                                <div className="form-group">
                                    <label className="form-label">Giá tiền (Nhập số):</label>
                                    <input name="price" type="number" className="form-input" defaultValue={editingItem.price || ""} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Danh mục:</label>
                                    <select name="category" className="form-input" defaultValue={editingItem.category || ""}>
                                        <option value="">-- Chọn danh mục --</option>
                                        {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Số lượng bán (VD: Bán 50k+):</label>
                                    <input name="sold" className="form-input" defaultValue={editingItem.sold || ""} required />
                                </div>
                            </>
                        )}

                        {activeTab === 'top_products_manage' && (
                            <>
                                <div className="form-group">
                                    <label className="form-label">Giá tiền (Nhập số):</label>
                                    <input name="price" type="number" className="form-input" defaultValue={editingItem.price || ""} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Danh mục:</label>
                                    <select name="category" className="form-input" defaultValue={editingItem.category || ""}>
                                        <option value="">-- Chọn danh mục --</option>
                                        {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Mô tả chi tiết:</label>
                                    <textarea name="description" className="form-input" rows="3" defaultValue={editingItem.description || "Chất liệu cao cấp, bền đẹp..."}></textarea>
                                </div>
                            </>
                        )}

                        <div className="form-actions">
                            <button type="button" className="admin-btn" onClick={() => setEditingItem(null)}>Hủy</button>
                            <button type="submit" className="admin-btn btn-add">Lưu Lại</button>
                        </div>
                    </form>
                )}

                {activeTab !== 'banner' && (
                    <>
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Hình ảnh</th>
                                    <th>Tên</th>
                                    {(activeTab === 'products' || activeTab === 'flash_sale') && <th>Giá</th>}
                                    {activeTab === 'flash_sale' && <><th>Giảm</th><th>Kho</th><th>Bán</th></>}
                                    {(activeTab === 'top_search') && <th>Đã bán</th>}
                                    {activeTab === 'users' && <><th>Email</th><th>Vai trò</th></>}
                                    <th>Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentItems.map((item, index) => (
                                    <tr key={`${item.id}-${activeTab}-${index}`}>
                                        <td>{item.id}</td>
                                        {activeTab === 'users' ? (
                                            <>
                                                <td>-</td>
                                                <td>{item.email}</td>
                                            </>
                                        ) : (
                                            <>
                                                <td>
                                                    <img
                                                        src={item.img} width="50" height="50" style={{ objectFit: 'cover' }} alt=""
                                                        onError={(e) => { e.target.src = "https://placehold.co/50x50?text=Error" }}
                                                    />
                                                </td>
                                                <td>{item.name}</td>
                                            </>
                                        )}

                                        {(activeTab === 'products' || activeTab === 'flash_sale') && <td>{item.price ? item.price.toLocaleString('vi-VN') : 0} đ</td>}
                                        {activeTab === 'flash_sale' && (
                                            <>
                                                <td>{item.discount || 0}%</td>
                                                <td>{item.stock || 0}</td>
                                                <td>{item.sold || 0}</td>
                                            </>
                                        )}
                                        {activeTab === 'top_search' && <td>{item.sold}</td>}

                                        {activeTab === 'users' && (
                                            <td>
                                                <span style={{
                                                    padding: '4px 8px', borderRadius: '4px', fontSize: '12px',
                                                    background: item.role === 'admin' ? '#ee4d2d' : '#eee',
                                                    color: item.role === 'admin' ? 'white' : 'black'
                                                }}>
                                                    {item.role}
                                                </span>
                                            </td>
                                        )}

                                        <td>
                                            {activeTab !== 'users' ? (
                                                <>
                                                    <button className="admin-btn btn-edit" onClick={() => setEditingItem(item)}>Sửa</button>
                                                    <button className="admin-btn btn-delete" onClick={() => handleDelete(activeTab === 'products' ? products : activeTab === 'top_search' ? topSearch : activeTab === 'top_products_manage' ? topProducts : categories, activeTab === 'products' ? setProducts : activeTab === 'top_search' ? setTopSearch : activeTab === 'top_products_manage' ? setTopProducts : setCategories, item.id)}>Xóa</button>
                                                </>
                                            ) : (
                                                item.email !== 'admin' && (
                                                    <button className="admin-btn btn-delete" onClick={() => handleDelete(users, setUsers, item.id)}>Xóa</button>
                                                )
                                            )}

                                            {activeTab === 'users' && item.email !== 'admin' && (
                                                <button className="admin-btn btn-edit" onClick={() => toggleAdminRole(item.id)} style={{ marginLeft: '5px' }}>
                                                    {item.role === 'admin' ? 'Hủy Admin' : 'Cấp quyền'}
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {totalPages > 1 && (
                            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px', gap: '5px' }}>
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    style={{ padding: '5px 10px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                                >
                                    Trước
                                </button>
                                {[...Array(totalPages)].map((_, index) => (
                                    <button
                                        key={`page-${index}`}
                                        onClick={() => handlePageChange(index + 1)}
                                        style={{
                                            padding: '5px 10px',
                                            background: currentPage === index + 1 ? '#ee4d2d' : '#eee',
                                            color: currentPage === index + 1 ? 'white' : 'black',
                                            border: '1px solid #ddd',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {index + 1}
                                    </button>
                                ))}
                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    style={{ padding: '5px 10px', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
                                >
                                    Sau
                                </button>
                            </div>
                        )}
                    </>
                )}

                {/* TAB NỘI DUNG BANNER */}
                {activeTab === 'banner_content' && (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2>📝 Quản Lý Nội Dung Banner</h2>
                            <button className="admin-btn btn-add" onClick={() => setEditingBannerContent({ bannerId: '', title: '', content: '', imageUrl: '' })}>+ Thêm Banner Content</button>
                        </div>

                        {editingBannerContent && (
                            <form onSubmit={async (e) => {
                                e.preventDefault();
                                const formData = {
                                    bannerId: e.target.bannerId.value,
                                    title: e.target.title.value,
                                    content: e.target.content.value,
                                    imageUrl: e.target.imageUrl.value || '',
                                    isActive: e.target.isActive?.checked ?? true
                                };

                                try {
                                    if (editingBannerContent._id) {
                                        // Update
                                        await axios.put(`http://localhost:3000/api/banner-contents/${editingBannerContent.bannerId}`, formData);
                                        showToast('Đã cập nhật nội dung banner!', 'success');
                                    } else {
                                        // Create
                                        await axios.post('http://localhost:3000/api/banner-contents', formData);
                                        showToast('Đã thêm nội dung banner mới!', 'success');
                                    }
                                    setEditingBannerContent(null);
                                    fetchBannerContents();
                                } catch (error) {
                                    console.error('Error saving banner content:', error);
                                    showToast(error.response?.data?.message || 'Có lỗi xảy ra!', 'error');
                                }
                            }} style={{ background: '#f9f9f9', padding: '20px', marginBottom: '20px', border: '1px solid #eee', borderRadius: '8px' }}>
                                <h3>{editingBannerContent._id ? 'Sửa Nội Dung Banner' : 'Thêm Nội Dung Banner Mới'}</h3>

                                <div className="form-group">
                                    <label className="form-label">Banner ID (VD: banner1, banner2, banner3):</label>
                                    <input
                                        name="bannerId"
                                        className="form-input"
                                        defaultValue={editingBannerContent.bannerId}
                                        required
                                        disabled={!!editingBannerContent._id}
                                        placeholder="banner1"
                                    />
                                    <small style={{ color: '#666', fontSize: '12px' }}>Banner chính: banner1, banner2, banner3. Banner phụ: banner4, banner5</small>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Tiêu đề:</label>
                                    <input name="title" className="form-input" defaultValue={editingBannerContent.title} required />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Nội dung (HTML được hỗ trợ):</label>
                                    <textarea
                                        name="content"
                                        className="form-input"
                                        rows="8"
                                        defaultValue={editingBannerContent.content}
                                        required
                                        placeholder="Nhập nội dung chi tiết. Hỗ trợ HTML như <h2>, <p>, <ul>, <li>, <strong>, v.v."
                                    ></textarea>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Link Ảnh (tùy chọn):</label>
                                    <input name="imageUrl" className="form-input" defaultValue={editingBannerContent.imageUrl} placeholder="https://..." />
                                </div>

                                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <input
                                        type="checkbox"
                                        name="isActive"
                                        defaultChecked={editingBannerContent.isActive !== false}
                                        style={{ width: 'auto', cursor: 'pointer' }}
                                    />
                                    <label style={{ margin: 0, cursor: 'pointer' }}>Hiển thị banner này</label>
                                </div>

                                <div className="form-actions" style={{ display: 'flex', gap: '10px' }}>
                                    <button type="submit" className="admin-btn btn-add">💾 Lưu</button>
                                    <button type="button" className="admin-btn btn-delete" onClick={() => setEditingBannerContent(null)}>❌ Hủy</button>
                                </div>
                            </form>
                        )}

                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Banner ID</th>
                                    <th>Tiêu đề</th>
                                    <th>Nội dung (preview)</th>
                                    <th>Ảnh</th>
                                    <th>Trạng thái</th>
                                    <th>Cập nhật</th>
                                    <th>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bannerContents.map((banner) => (
                                    <tr key={banner._id}>
                                        <td><strong>{banner.bannerId}</strong></td>
                                        <td>{banner.title}</td>
                                        <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {banner.content.substring(0, 50)}...
                                        </td>
                                        <td>
                                            {banner.imageUrl ? (
                                                <img src={banner.imageUrl} alt="" style={{ width: '60px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                                            ) : (
                                                <span style={{ color: '#999' }}>Không có</span>
                                            )}
                                        </td>
                                        <td>
                                            <span style={{
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                fontSize: '12px',
                                                background: banner.isActive ? '#52c41a' : '#999',
                                                color: 'white'
                                            }}>
                                                {banner.isActive ? 'Hoạt động' : 'Ẩn'}
                                            </span>
                                        </td>
                                        <td>{new Date(banner.updatedAt).toLocaleDateString('vi-VN')}</td>
                                        <td>
                                            <button className="admin-btn btn-edit" onClick={() => setEditingBannerContent(banner)}>Sửa</button>
                                            <button className="admin-btn btn-delete" onClick={async () => {
                                                if (window.confirm('Xóa nội dung banner này?')) {
                                                    try {
                                                        await axios.delete(`http://localhost:3000/api/banner-contents/${banner.bannerId}`);
                                                        showToast('Đã xóa!', 'success');
                                                        fetchBannerContents();
                                                    } catch (error) {
                                                        console.error('Error deleting:', error);
                                                        showToast('Có lỗi xảy ra!', 'error');
                                                    }
                                                }
                                            }}>Xóa</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {bannerContents.length === 0 && (
                            <p style={{ textAlign: 'center', color: '#999', marginTop: '30px' }}>
                                Chưa có nội dung banner nào. Nhấn "Thêm Banner Content" để bắt đầu!
                            </p>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default AdminPage;