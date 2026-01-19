import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// --- 1. IMPORT CÁC COMPONENT CỦA WEB BÁN HÀNG ---
import Header from './components/Header';
import CategoryPage from './pages/CategoryPage';
import LoginPage from './pages/LoginPage';
import CheckoutPage from './pages/CheckoutPage';
import ProductDetailPage from './pages/ProductDetailPage';
import OrderPage from './pages/OrderPage';
import AdminPage from './pages/AdminPage';
import Toast from './components/Toast';
import Banner from './components/Banner';
import Category from './components/Category';
import TopSearch from './components/TopSearch';
import ProductList from './components/ProductList';

// --- 2. IMPORT TÍNH NĂNG 3D (MỚI) ---
import VirtualTryOn from "./features/virtual-tryon/VirtualTryOn";

// --- DỮ LIỆU MẪU (FALLBACK DATA) ---
const fallbackUsers = [
  { id: 1, email: "admin", password: "123", role: "admin" },
  { id: 2, email: "user", password: "123", role: "user" },
];

const initTopSearch = [
  { id: 101, category: "Áo Thun", name: "Áo Thun Form Rộng", price: "99.000 đ", sold: "Bán 45k+ / tháng", img: "https://down-vn.img.susercontent.com/file/sg-11134201-22100-3051405021iv33_tn" },
  { id: 102, category: "Quần Jeans", name: "Quần Jean Ống Suông", price: "185.000 đ", sold: "Bán 50k+ / tháng", img: "https://down-vn.img.susercontent.com/file/sg-11134201-22120-5643425557kv6d_tn" },
  { id: 103, category: "Váy & Đầm", name: "Váy Hoa Nhí Vintage", price: "120.000 đ", sold: "Bán 32k+ / tháng", img: "https://down-vn.img.susercontent.com/file/cn-11134207-7r98o-lmg020294192b6_tn" },
  { id: 104, category: "Phụ Kiện", name: "Túi Tote Vải Canvas", price: "45.000 đ", sold: "Bán 88k+ / tháng", img: "https://down-vn.img.susercontent.com/file/vn-11134207-7qukw-lf522039201942_tn" },
  { id: 105, category: "Áo Croptop", name: "Áo Croptop Kiểu", price: "79.000 đ", sold: "Bán 60k+ / tháng", img: "https://down-vn.img.susercontent.com/file/cn-11134207-7r98o-lm193z6e1086e3_tn" },
  { id: 106, category: "Phụ Kiện", name: "Giày Sneaker Trắng", price: "150.000 đ", sold: "Bán 25k+ / tháng", img: "https://down-vn.img.susercontent.com/file/sg-11134201-7qvd3-lf620029304123_tn" },
];

const fallbackSuggestions = [
  {
    id: 1,
    category: "Áo Thun",
    name: 'Áo Thun Xám Basic (Premium)',
    price: 350000,
    img: '/assets/clothes/ao_xam.png', // Ảnh đại diện bên ngoài
    variants: [
      {
        color: 'grey',
        hex: '#E0E0E0',
        name: 'Xám Tiêu',
        img: '/assets/clothes/ao_xam.png' // Texture áo xám
      },
      {
        color: 'green',
        hex: '#115327',
        name: 'Xanh Lá',
        img: '/assets/clothes/ao_xanh.png' // Texture áo xanh
      }
    ]
  },
  {
    id: 2,
    category: "Quần Jeans",
    name: 'Quần Jean ống rộng Hàn Quốc',
    price: 350000,
    img: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=500'
  },
];
const initCategories = [
  { id: 1001, name: "Áo Thun", img: "https://down-vn.img.susercontent.com/file/sg-11134201-22100-3051405021iv33_tn" },
  { id: 1002, name: "Áo Sơ Mi", img: "https://down-vn.img.susercontent.com/file/cn-11134207-7r98o-lm193z6e1086e3_tn" },
  { id: 1003, name: "Áo Khoác", img: "https://down-vn.img.susercontent.com/file/sg-11134201-22120-7469736467kvf4_tn" },
  { id: 1004, name: "Quần Jeans", img: "https://down-vn.img.susercontent.com/file/sg-11134201-22120-5643425557kv6d_tn" },
  { id: 1005, name: "Váy & Đầm", img: "https://down-vn.img.susercontent.com/file/cn-11134207-7r98o-lmg020294192b6_tn" },
  { id: 1006, name: "Chân Váy", img: "https://down-vn.img.susercontent.com/file/cn-11134207-7r98o-ll943805391295_tn" },
  { id: 1007, name: "Phụ Kiện", img: "https://down-vn.img.susercontent.com/file/vn-11134207-7qukw-lf522039201942_tn" },
];

const initBanners = {
  big: [
    "https://cf.shopee.vn/file/vn-50009109-c8c772213d4eb0c102a2815c32d9136c_xxhdpi",
    "https://cf.shopee.vn/file/vn-50009109-7756e18722421c4558e8b0b5550a2995_xxhdpi",
    "https://cf.shopee.vn/file/vn-50009109-ca7d751537233ba49a37e199f36f339c_xxhdpi"
  ],
  smallTop: "https://cf.shopee.vn/file/vn-50009109-1a8df9e82936a71e721c5db605021571_xhdpi",
  smallBottom: "https://cf.shopee.vn/file/vn-50009109-00569106043234b68e77a10271b0586e_xhdpi"
};

const formatPrice = (price: any) => {
  if (typeof price === 'string') return price;
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

function App() {
  // --- STATE QUẢN LÝ DỮ LIỆU ---
  const [suggestionProducts, setSuggestionProducts] = useState(fallbackSuggestions);
  const [topProducts, setTopProducts] = useState(initTopSearch);
  const [categories, setCategories] = useState(initCategories);
  const [users, setUsers] = useState(fallbackUsers);
  const [bannerData, setBannerData] = useState(initBanners);

  const [cartItems, setCartItems] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [toast, setToast] = useState<{ message: string, type: string } | null>(null);

  // --- FETCH API TỪ SERVER ---
  useEffect(() => {
    // 1. Lấy Sản Phẩm
    fetch('http://localhost:3000/api/products')
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          const formattedData = data.map((item: any) => ({
            ...item,
            id: item._id, // Map _id của Mongo sang id
            price: item.price
          }));
          setSuggestionProducts(formattedData);
        }
      })
      .catch(err => console.error("Lỗi lấy sản phẩm (Có thể do chưa bật Server Nodejs):", err));

    // 2. Lấy Người Dùng
    fetch('http://localhost:3000/api/users')
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          const formattedUsers = data.map((u: any) => ({ ...u, id: u._id }));
          setUsers(prev => [...prev, ...formattedUsers]);
        }
      })
      .catch(err => console.error("Lỗi lấy user:", err));
  }, []);

  const showToast = (message: string, type = 'success') => { setToast({ message, type }); };

  // Chuẩn bị dữ liệu hiển thị (Format giá)
  const displayProducts = suggestionProducts.map(p => ({
    ...p,
    priceDisplay: formatPrice(p.price)
  }));

  const allProducts = [...topProducts, ...displayProducts];

  // --- CÁC HÀM XỬ LÝ LOGIC ---
  const handleAddToCart = (product: any, size: string) => {
    setCartItems(prev => {
      const exist = prev.find(item => item.id === product.id && item.size === size);
      if (exist) {
        return prev.map(item => (item.id === product.id && item.size === size) ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, size, quantity: 1, cartId: Date.now() }];
    });
    showToast("Đã thêm vào giỏ hàng!", 'success');
  };

  const handleUpdateQuantity = (cartId: number, amount: number) => {
    setCartItems(prev => prev.map(item => {
      if (item.cartId === cartId) {
        const newQty = item.quantity + amount;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }));
  };

  const handleRemoveFromCart = (cartId: number) => { setCartItems(prev => prev.filter(item => item.cartId !== cartId)); };

  const handleCheckoutSuccess = (totalAmount: number) => {
    const newOrder = { items: cartItems, total: totalAmount, date: new Date().toISOString() };
    setOrders([...orders, newOrder]);
    setCartItems([]);
    showToast("Đặt hàng thành công!", 'success');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    showToast("Đã đăng xuất thành công!", "info");
  };

  const filteredProducts = displayProducts.filter(p => p.name.toLowerCase().includes(searchKeyword.toLowerCase()));

  // --- RENDER GIAO DIỆN ---
  return (
    <BrowserRouter>
      <div>
        {/* Header luôn hiển thị ở trên cùng */}
        <Header
          cartCount={cartItems.reduce((acc, item) => acc + item.quantity, 0)}
          user={currentUser}
          onSearch={setSearchKeyword}
          showToast={showToast}
          onLogout={handleLogout}
        />

        {/* --- CẤU HÌNH ROUTER (ĐỊNH TUYẾN) --- */}
        <Routes>
          {/* 1. TRANG CHỦ */}
          <Route path="/" element={
            <div>
              <Banner data={bannerData} />
              <Category data={categories} />
              <TopSearch products={topProducts} />
              <ProductList products={filteredProducts} />
            </div>
          } />

          {/* 2. TRANG ADMIN */}
          <Route path="/admin" element={
            <AdminPage
              products={suggestionProducts} setProducts={setSuggestionProducts}
              topProducts={topProducts} setTopProducts={setTopProducts}
              categories={categories} setCategories={setCategories}
              users={users} setUsers={setUsers}
              bannerData={bannerData} setBannerData={setBannerData}
              currentUser={currentUser} showToast={showToast}
            />
          } />

          {/* 3. CÁC TRANG CHỨC NĂNG KHÁC */}
          <Route path="/category/:id" element={<CategoryPage products={allProducts} categories={categories} />} />

          {/* 👇 QUAN TRỌNG: Truyền user vào ProductDetailPage để check đăng nhập */}
          <Route path="/product/:id" element={<ProductDetailPage products={allProducts} onAddToCart={handleAddToCart} user={currentUser} showToast={showToast} />} />

          <Route path="/login" element={<LoginPage users={users} setUsers={setUsers} onLogin={setCurrentUser} showToast={showToast} />} />
          <Route path="/checkout" element={<CheckoutPage cartItems={cartItems} onRemove={handleRemoveFromCart} onUpdateQuantity={handleUpdateQuantity} onCheckoutSuccess={handleCheckoutSuccess} />} />
          <Route path="/orders" element={<OrderPage orders={orders} />} />

          {/* --- 👇 4. TRANG 3D VIRTUAL TRY-ON (ĐÃ TÍCH HỢP) --- */}
          <Route path="/try-on" element={<VirtualTryOn />} />

        </Routes>

        {/* Thông báo (Toast) hiển thị đè lên trên cùng */}
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    </BrowserRouter>
  );
}

export default App;