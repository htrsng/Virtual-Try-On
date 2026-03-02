import { useState, useEffect, lazy, Suspense, useCallback, useRef } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';

// --- 1. IMPORT CÁC COMPONENT CỦA WEB BÁN HÀNG ---
import { MODEL_INJECTION } from './data/ThreeDConfig';
import Header from './components/Header';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import Toast from './components/Toast';
import { FittingRoomProvider } from './contexts/FittingRoomContext';

// --- LAZY LOAD CÁC TRANG (Performance Optimization) ---
const HomePage = lazy(() => import('./pages/HomePage'));
const CategoryPage = lazy(() => import('./pages/CategoryPage'));
const TopProductsPage = lazy(() => import('./pages/TopProductsPage'));
const FlashSalePage = lazy(() => import('./pages/FlashSalePage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const CartPage = lazy(() => import('./pages/CartPage'));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'));
const OrderPage = lazy(() => import('./pages/OrderPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
// @ts-ignore
const AdminLayout = lazy(() => import('./admin/layout/AdminLayout'));
// @ts-ignore
const AdminDashboard = lazy(() => import('./admin/pages/AdminDashboard'));
const AdminOrders = lazy(() => import('./pages/AdminOrders'));
const AdminProducts = lazy(() => import('./pages/AdminProducts'));
const AdminCategories = lazy(() => import('./pages/AdminCategories'));
const AdminFlashSale = lazy(() => import('./pages/AdminFlashSale'));
const AdminCoupons = lazy(() => import('./pages/AdminCoupons'));
const AdminDataSync = lazy(() => import('./components/AdminDataSync'));
const AdminChat = lazy(() => import('./pages/AdminChat'));
const UserProfilePage = lazy(() => import('./pages/UserProfilePage'));
const HelpPage = lazy(() => import('./pages/HelpPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const SearchResultsPage = lazy(() => import('./pages/SearchResultsPage'));
const PolicyPage = lazy(() => import('./pages/PolicyPage'));
const BannerContentPage = lazy(() => import('./pages/BannerContentPage'));
const WishlistPage = lazy(() => import('./pages/WishlistPage'));
const ComparePage = lazy(() => import('./pages/ComparePage'));
const ChatWidget = lazy(() => import('./components/ChatWidget'));

// --- 2. IMPORT TÍNH NĂNG 3D (MỚI) ---
const VirtualTryOn = lazy(() => import('./features/virtual-tryon/VirtualTryOn.tsx'));

// --- 3. IMPORT CONTEXTS ---
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { WishlistProvider } from './contexts/WishlistContext';
import { CompareProvider } from './contexts/CompareContext';
import { LanguageProvider } from './contexts/LanguageContext';

// --- 4. IMPORT DỮ LIỆU MẪU (INITIAL DATA) ---
import { initTopSearch, fallbackSuggestions, initCategories, initBanners } from './data/initialData';
import { initFlashSaleProducts } from './data/flashSaleData';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// --- LOADING FALLBACK COMPONENT ---
const PageLoader = () => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    minHeight: '60vh', flexDirection: 'column', gap: '16px',
  }}>
    <div style={{
      width: '48px', height: '48px', borderRadius: '50%',
      border: '4px solid #f0f0f0', borderTopColor: '#ee4d2d',
      animation: 'spin 1s linear infinite',
    }} />
    <span style={{ color: '#999', fontSize: '14px' }}>Đang tải...</span>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

type PriceValue = number | string;

type ProductRecord = {
  id: number | string;
  name: string;
  price: PriceValue;
  quantity?: number;
  size?: string;
  cartId?: number;
  img?: string;
  image?: string;
  [key: string]: unknown;
};

type CartItem = ProductRecord & {
  quantity: number;
  size: string;
  cartId: number;
};

type UserRecord = {
  _id?: string;
  id: number | null;
  email: string;
  role?: string;
  fullName: string;
  phone: string;
  address: string;
  [key: string]: unknown;
};

type OrderRecord = {
  items: CartItem[];
  total: number;
  date: string;
};

const formatPrice = (price: PriceValue) => {
  if (typeof price === 'string') return price;
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

function App() {
  // --- STATE QUẢN LÝ DỮ LIỆU ---
  const [suggestionProducts, setSuggestionProducts] = useState(fallbackSuggestions);
  const [topSearch, setTopSearch] = useState(initTopSearch);
  const [topProducts, setTopProducts] = useState(initTopSearch);
  const [categories, setCategories] = useState(initCategories);
  const [users, setUsers] = useState<UserRecord[]>([]); // Bắt đầu với mảng rỗng
  const [bannerData, setBannerData] = useState(initBanners);
  const [flashSaleProducts, setFlashSaleProducts] = useState(initFlashSaleProducts);

  // Load cart từ localStorage ngay khi khởi tạo state
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    const savedCart = localStorage.getItem('cartItems');
    if (savedCart) {
      try {
        const parsed = JSON.parse(savedCart) as CartItem[];
        console.log('🛒 Khởi tạo giỏ hàng từ localStorage:', parsed);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        console.error("Lỗi parse cart:", e);
        return [];
      }
    }
    return [];
  });

  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [currentUser, setCurrentUser] = useState<Record<string, unknown> | null>(null);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [toast, setToast] = useState<{ message: string, type: string } | null>(null);
  const toastGuardRef = useRef<{ message: string; type: string; at: number } | null>(null);


  // Lưu cart vào localStorage mỗi khi thay đổi
  useEffect(() => {
    if (cartItems.length > 0) {
      localStorage.setItem('cartItems', JSON.stringify(cartItems));
      console.log('💾 Đã lưu giỏ hàng:', cartItems);
    } else {
      // Xóa localStorage khi giỏ hàng rỗng
      localStorage.removeItem('cartItems');
      console.log('🗑️ Đã xóa giỏ hàng khỏi localStorage');
    }
  }, [cartItems]);

  // Lắng nghe sự kiện logout và xóa giỏ hàng
  useEffect(() => {
    const handleLogout = () => {
      console.log('🔄 Phát hiện logout - đang xóa giỏ hàng...');
      setCartItems([]);
    };

    window.addEventListener('userLogout', handleLogout);

    return () => {
      window.removeEventListener('userLogout', handleLogout);
    };
  }, []);

  // Debug search keyword changes
  useEffect(() => {
    console.log('🔍 Search keyword changed to:', searchKeyword);
  }, [searchKeyword]);

  // --- KHÔI PHỤC CURRENTUSER TỪ LOCALSTORAGE KHI COMPONENT MOUNT ---
  useEffect(() => {
    const savedCurrentUser = localStorage.getItem('currentUser');
    if (savedCurrentUser) {
      try {
        setCurrentUser(JSON.parse(savedCurrentUser));
      } catch (e) {
        console.error("Lỗi parse currentUser:", e);
      }
    }

    // Cart đã được load trong useState initializer, không cần load lại

    // Load categories từ localStorage
    const savedCategories = localStorage.getItem('categories');
    if (savedCategories) {
      try {
        setCategories(JSON.parse(savedCategories));
      } catch (e) {
        console.error("Lỗi parse categories:", e);
      }
    }

    // Products chỉ lấy từ API để tránh lệch dữ liệu cũ/mới
    setSuggestionProducts(fallbackSuggestions);

    // Load banner từ localStorage
    const savedBanner = localStorage.getItem('bannerData');
    if (savedBanner) {
      try {
        setBannerData(JSON.parse(savedBanner));
      } catch (e) {
        console.error("Lỗi parse banner:", e);
      }
    }

    // Load topProducts từ localStorage
    const savedTopProducts = localStorage.getItem('topProducts');
    if (savedTopProducts) {
      try {
        setTopProducts(JSON.parse(savedTopProducts));
      } catch (e) {
        console.error("Lỗi parse topProducts:", e);
      }
    } else {
      // Nếu chưa có, dùng initTopSearch làm default
      localStorage.setItem('topProducts', JSON.stringify(initTopSearch));
    }

    // Load topSearch từ localStorage
    const savedTopSearch = localStorage.getItem('topSearch');
    if (savedTopSearch) {
      try {
        setTopSearch(JSON.parse(savedTopSearch));
      } catch (e) {
        console.error("Lỗi parse topSearch:", e);
      }
    } else {
      // Nếu chưa có, lưu initTopSearch
      localStorage.setItem('topSearch', JSON.stringify(initTopSearch));
    }

    // XÓA users cũ trong localStorage (dữ liệu rác)
    // Users sẽ được load từ database thật
    localStorage.removeItem('users');
    console.log('🗑️ Đã xóa users cũ từ localStorage');

    // Load flashSaleProducts từ localStorage - NẾU KHÔNG CÓ THÌ DÙNG DEFAULT
    const savedFlashSale = localStorage.getItem('flashSaleProducts');
    if (savedFlashSale) {
      try {
        const parsed = JSON.parse(savedFlashSale);
        if (parsed && parsed.length > 0) {
          setFlashSaleProducts(parsed);
        }
      } catch (e) {
        console.error("Lỗi parse flashSaleProducts:", e);
      }
    }
  }, []);

  // --- FETCH API TỪ SERVER ---
  useEffect(() => {
    // --- 1. LẤY SẢN PHẨM TỪ SERVER VÀ GHÉP 3D ---
    fetch(`${API_URL}/api/products`)
      .then(res => res.json())
      .then((data: unknown) => {
        if (Array.isArray(data) && data.length > 0) {
          console.log("🔥 DANH SÁCH ID SẢN PHẨM NUMERIC:");

          // MAP DỮ LIỆU: bắt buộc dùng id numeric duy nhất từ server
          const formattedData = data.map((item) => {
            const productItem = item as Record<string, unknown>;
            const numericId = Number(item.id);
            if (!Number.isInteger(numericId) || numericId <= 0) {
              throw new Error(`Sản phẩm ${String(productItem.name || productItem._id || 'N/A')} không có id numeric hợp lệ`);
            }

            console.log(`- ${String(productItem.name || 'Sản phẩm')}: ID=${numericId}`);

            const product: ProductRecord = {
              ...(productItem as ProductRecord),
              id: numericId,
              price: productItem.price as PriceValue
            };

            // KIỂM TRA VÀ TIÊM DỮ LIỆU 3D
            // Nếu ID của sản phẩm này có trong file cấu hình ThreeDConfig
            const productId = numericId;
            if (MODEL_INJECTION[productId]) {
              console.log(`=> Đã kích hoạt 3D cho sản phẩm: ${item.name}`);
              product.model3D = MODEL_INJECTION[productId];
            }

            return product;
          });

          // Cập nhật State (không cache products vào localStorage)
          setSuggestionProducts(formattedData as typeof suggestionProducts);
        }
      })
      .catch(err => {
        console.error("Lỗi lấy sản phẩm:", err);
        // Nếu lỗi server thì dùng tạm dữ liệu mẫu
        // setSuggestionProducts(fallbackSuggestions); 
      });

    // --- 2. Lấy Người Dùng (THAY THẾ HOÀN TOÀN từ database) ---
    fetch(`${API_URL}/api/users`)
      .then(res => res.json())
      .then((data: unknown) => {
        if (Array.isArray(data) && data.length > 0) {
          // Lọc bỏ dữ liệu rỗng/undefined và loại duplicate
          const validUsers = data.filter((u): u is Record<string, unknown> => Boolean(
            u && typeof u === 'object' && '_id' in u && 'email' in u
          ));
          const uniqueUsers = validUsers.reduce<Record<string, unknown>[]>((acc, current) => {
            const exists = acc.find(item => item._id === current._id);
            if (!exists) {
              acc.push(current);
            }
            return acc;
          }, []);

          // Dùng id numeric rõ ràng cho user
          const formattedUsers = uniqueUsers.map((u): UserRecord => ({
            ...u,
            id: Number.isInteger(Number(u.id)) ? Number(u.id) : null,
            email: String(u.email || ''),
            role: String(u.role || ''),
            fullName: String(u.fullName || ''),
            phone: String(u.phone || ''),
            address: String(u.address || '')
          })).filter(u => u.id !== null);

          setUsers(formattedUsers);
          console.log('✅ Đã load', formattedUsers.length, 'users từ database');
          console.log('📋 Danh sách users:', formattedUsers.map(u => u.email));
        } else {
          // Nếu database trống, để mảng rỗng
          setUsers([]);
          console.log('⚠️ Database không có users');
        }
      })
      .catch(err => {
        console.error("Lỗi lấy user:", err);
        setUsers([]);
      });
  }, []);

  const showToast = useCallback((message: string, type = 'success') => {
    const now = Date.now();
    const lastToast = toastGuardRef.current;

    if (
      lastToast &&
      lastToast.message === message &&
      lastToast.type === type &&
      now - lastToast.at < 1500
    ) {
      return;
    }

    toastGuardRef.current = { message, type, at: now };
    setToast((prev) => {
      if (prev && prev.message === message && prev.type === type) {
        return prev;
      }
      return { message, type };
    });
  }, []);

  const handleToastClose = useCallback(() => {
    setToast(null);
  }, []);

  // Chuẩn bị dữ liệu hiển thị (Format giá)
  const displayProducts = suggestionProducts.map(p => ({
    ...p,
    priceDisplay: formatPrice(p.price)
  }));

  // Tất cả sản phẩm bao gồm: topProducts, displayProducts, và flashSaleProducts
  const allProducts = [
    ...topProducts,
    ...displayProducts,
    ...flashSaleProducts.map(p => ({ ...p, priceDisplay: formatPrice(p.price) }))
  ];

  // --- CÁC HÀM XỬ LÝ LOGIC ---
  const handleAddToCart = (product: ProductRecord, size?: string) => {
    const actualSize = size || 'M'; // Sử dụng size mặc định nếu không được cung cấp
    setCartItems(prev => {
      // So sánh id bằng String() để tránh lỗi giữa MongoDB _id và id số
      const exist = prev.find(item => String(item.id) === String(product.id) && item.size === actualSize);
      if (exist) {
        return prev.map(item => (String(item.id) === String(product.id) && item.size === actualSize) ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, size: actualSize, quantity: 1, cartId: Date.now() }];
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
    showToast("🎉 Đặt hàng thành công! Cảm ơn bạn đã mua sắm cùng tụi mình.", 'success');
  };

  // Mua ngay 1 sản phẩm (Buy Now): chỉ chuyển sang checkout với đúng sản phẩm đó
  const handleBuyNow = (product: ProductRecord, size?: string) => {
    // Kiểm tra đăng nhập trước - DÙNG LOCALSTORAGE ĐỂ CHECK CHÍNH XÁC
    const isLoggedIn = localStorage.getItem('currentUser') || localStorage.getItem('token');
    if (!isLoggedIn) {
      showToast("Vui lòng đăng nhập để mua hàng!", "warning");
      setTimeout(() => {
        window.location.href = '/login';
      }, 500);
      return;
    }

    const actualSize = size || 'M';
    const newItem = { ...product, size: actualSize, quantity: 1, cartId: Date.now() };

    // Lưu sản phẩm "Mua ngay" vào localStorage
    localStorage.setItem('selectedProductsForCheckout', JSON.stringify([newItem]));
    console.log('🚀 MUA NGAY: Lưu sản phẩm và chuyển đến /checkout/cart');

    setCartItems([newItem]);

    setTimeout(() => {
      window.location.href = '/checkout/cart';
    }, 100);
  };

  const filteredProducts = displayProducts.filter(p => {
    const productName = p.name.toLowerCase();
    const keyword = searchKeyword.toLowerCase();
    return productName.includes(keyword);
  });

  // Wrapper component để lấy product từ location.state
  const VirtualTryOnWrapper = ({ defaultProduct, onAddToCart, onBuyNow, showToast }: {
    defaultProduct: ProductRecord;
    onAddToCart: (product: ProductRecord, size?: string) => void;
    onBuyNow: (product: ProductRecord, size?: string) => void;
    showToast: (message: string, type?: string) => void;
  }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const locState = location.state as {
      product?: ProductRecord;
      selectedItems?: ProductRecord[];
    } | null;

    // Resolve outfit items: selectedItems array → outfitItems
    const selectedItems = locState?.selectedItems;
    const singleProduct = locState?.product;

    // Redirect to cart if selectedItems is explicitly empty
    useEffect(() => {
      if (selectedItems && selectedItems.length === 0) {
        showToast('Chưa chọn sản phẩm nào — quay lại giỏ hàng', 'warning');
        navigate('/cart', { replace: true });
      }
    }, [selectedItems, navigate, showToast]);

    // Determine the primary product for the component
    const product = (selectedItems && selectedItems.length > 0)
      ? selectedItems[0]
      : singleProduct || defaultProduct;

    // Build outfitItems array
    const outfitItems = (selectedItems && selectedItems.length > 0)
      ? selectedItems
      : singleProduct
        ? [singleProduct]
        : undefined;

    return (
      <VirtualTryOn
        product={product}
        outfitItems={outfitItems}
        onAddToCart={onAddToCart}
        onBuyNow={onBuyNow}
        handleBack={() => window.history.back()}
        showToast={showToast}
      />
    );
  };

  const AppShell = () => {
    const location = useLocation();
    const isTryOnPage = location.pathname === '/try-on';
    const isAdminRoute = location.pathname.startsWith('/admin');

    return (
      <div>
        {!isTryOnPage && !isAdminRoute && (
          <Header
            cartCount={cartItems.reduce((acc, item) => acc + item.quantity, 0)}
            onSearch={setSearchKeyword}
            showToast={showToast}
          />
        )}

        {/* --- CẤU HÌNH ROUTER (ĐỊNH TUYẾN) --- */}
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* 1. TRANG CHỦ */}
            <Route path="/" element={
              <HomePage
                products={filteredProducts}
                categories={categories}
                topSearch={topSearch}
                bannerData={bannerData}
                flashSaleProducts={flashSaleProducts}
                onBuy={handleAddToCart}
              />
            } />

            {/* Tạo trang tìm kiếm */}
            <Route path="/search" element={
              <SearchResultsPage
                allProducts={allProducts}
                onBuy={handleAddToCart}
                showToast={showToast}
              />
            } />

            {/* 2. TRANG ADMIN */}
            <Route path="/admin/*" element={
              <AdminLayout>
                <Routes>
                  <Route
                    index
                    element={<AdminDashboard />}
                  />
                  <Route
                    path="orders"
                    element={<AdminOrders showToast={showToast} />}
                  />
                  <Route
                    path="users"
                    element={
                      <AdminPage
                        products={suggestionProducts} setProducts={setSuggestionProducts}
                        topSearch={topSearch} setTopSearch={setTopSearch}
                        topProducts={topProducts} setTopProducts={setTopProducts}
                        categories={categories} setCategories={setCategories}
                        users={users} setUsers={setUsers}
                        bannerData={bannerData} setBannerData={setBannerData}
                        flashSaleProducts={flashSaleProducts} setFlashSaleProducts={setFlashSaleProducts}
                        currentUser={currentUser} showToast={showToast}
                        initialTab="users"
                      />
                    }
                  />
                  <Route
                    path="banners"
                    element={
                      <AdminPage
                        products={suggestionProducts} setProducts={setSuggestionProducts}
                        topSearch={topSearch} setTopSearch={setTopSearch}
                        topProducts={topProducts} setTopProducts={setTopProducts}
                        categories={categories} setCategories={setCategories}
                        users={users} setUsers={setUsers}
                        bannerData={bannerData} setBannerData={setBannerData}
                        flashSaleProducts={flashSaleProducts} setFlashSaleProducts={setFlashSaleProducts}
                        currentUser={currentUser} showToast={showToast}
                        initialTab="banner"
                      />
                    }
                  />
                  <Route
                    path="categories"
                    element={
                      <AdminCategories
                        categories={categories}
                        setCategories={setCategories}
                        showToast={showToast}
                      />
                    }
                  />
                  <Route
                    path="flash-sale"
                    element={
                      <AdminFlashSale
                        flashSaleProducts={flashSaleProducts}
                        setFlashSaleProducts={setFlashSaleProducts}
                        categories={categories}
                        showToast={showToast}
                      />
                    }
                  />
                  <Route
                    path="banner-content"
                    element={
                      <AdminPage
                        products={suggestionProducts} setProducts={setSuggestionProducts}
                        topSearch={topSearch} setTopSearch={setTopSearch}
                        topProducts={topProducts} setTopProducts={setTopProducts}
                        categories={categories} setCategories={setCategories}
                        users={users} setUsers={setUsers}
                        bannerData={bannerData} setBannerData={setBannerData}
                        flashSaleProducts={flashSaleProducts} setFlashSaleProducts={setFlashSaleProducts}
                        currentUser={currentUser} showToast={showToast}
                        initialTab="banner_content"
                      />
                    }
                  />
                  <Route
                    path="products-list"
                    element={<AdminProducts showToast={showToast} categories={categories} />}
                  />
                  <Route
                    path="vouchers"
                    element={<AdminCoupons showToast={showToast} />}
                  />
                  <Route
                    path="sync"
                    element={<AdminDataSync />}
                  />
                  <Route
                    path="chat"
                    element={<AdminChat showToast={showToast} />}
                  />
                </Routes>
              </AdminLayout>
            } />

            {/* 3. CÁC TRANG CHỨC NĂNG KHÁC */}
            <Route path="/category/:id" element={<CategoryPage products={displayProducts} categories={categories} />} />

            {/* 3a. TRANG SẢN PHẨM BÁN CHẠY */}
            <Route path="/top-products" element={<TopProductsPage products={topProducts} onBuy={handleAddToCart} categories={categories} />} />

            {/* 3b. TRANG FLASH SALE */}
            <Route path="/flash-sale" element={<FlashSalePage flashSaleProducts={flashSaleProducts} onBuy={handleAddToCart} />} />

            {/* TRANG CHI TIẾT SẢN PHẨM */}
            <Route path="/product/:id" element={<ProductDetailPage products={allProducts} flashSaleProducts={flashSaleProducts} onAddToCart={handleAddToCart} onBuyNow={handleBuyNow} showToast={showToast} />} />

            {/* TRANG ĐĂNG NHẬP/ĐĂNG KÝ */}
            <Route path="/login" element={<LoginPage showToast={showToast} />} />

            {/* TRANG YÊU THÍCH */}
            <Route path="/wishlist" element={<WishlistPage onAddToCart={handleAddToCart} showToast={showToast} />} />

            {/* TRANG SO SÁNH */}
            <Route path="/compare" element={<ComparePage onAddToCart={handleAddToCart} showToast={showToast} />} />

            {/* TRANG GIỎ HÀNG MỚI (LUXURY CART) */}
            <Route path="/cart" element={<CartPage cartItems={cartItems} onRemove={handleRemoveFromCart} onUpdateQuantity={handleUpdateQuantity} onAddToCart={handleAddToCart} showToast={showToast} suggestionProducts={suggestionProducts} />} />

            {/* TRANG CHỌN SẢN PHẨM THANH TOÁN */}
            <Route path="/checkout/choseproduct" element={<CartPage cartItems={cartItems} onRemove={handleRemoveFromCart} onUpdateQuantity={handleUpdateQuantity} onAddToCart={handleAddToCart} showToast={showToast} suggestionProducts={suggestionProducts} />} />

            {/* TRANG THANH TOÁN */}
            <Route path="/checkout/cart" element={<CheckoutPage cartItems={cartItems} onCheckoutSuccess={handleCheckoutSuccess} showToast={showToast} suggestionProducts={suggestionProducts} onAddToCart={handleAddToCart} />} />

            {/* TRANG GIỎ HÀNG & THANH TOÁN (Redirect cũ) */}
            <Route path="/checkout" element={<CartPage cartItems={cartItems} onRemove={handleRemoveFromCart} onUpdateQuantity={handleUpdateQuantity} onAddToCart={handleAddToCart} showToast={showToast} suggestionProducts={suggestionProducts} />} />

            {/* TRANG CÁ NHÂN NGƯỜI DÙNG */}
            <Route path="/profile" element={<UserProfilePage showToast={showToast} />} />

            {/* TRANG ĐƠN HÀNG (CŨ - GIỮ LẠI ĐỂ TƯƠNG THÍCH) */}
            <Route path="/orders" element={<OrderPage showToast={showToast} />} />

            {/* TRANG 3D VIRTUAL TRY-ON */}
            <Route path="/try-on" element={
              <VirtualTryOnWrapper
                defaultProduct={suggestionProducts[0]}
                onAddToCart={handleAddToCart}
                onBuyNow={handleBuyNow}
                showToast={showToast}
              />
            } />

            {/* TRANG NỘI DUNG BANNER */}
            <Route path="/banner/:bannerId" element={<BannerContentPage />} />

            {/* TRANG TRUNG TÂM TRỢ GIÚP */}
            <Route path="/help" element={<HelpPage />} />

            {/* TRANG GIỚI THIỆU */}
            <Route path="/about" element={<AboutPage />} />

            {/* TRANG CHÍNH SÁCH */}
            <Route path="/guide" element={<PolicyPage />} />
            <Route path="/sell-guide" element={<PolicyPage />} />
            <Route path="/payment" element={<PolicyPage />} />
            <Route path="/shipping" element={<PolicyPage />} />
            <Route path="/return-policy" element={<PolicyPage />} />
            <Route path="/privacy" element={<PolicyPage />} />
            <Route path="/terms" element={<PolicyPage />} />
            <Route path="/cookies" element={<PolicyPage />} />

          </Routes>
        </Suspense>

        {/* Thông báo (Toast) hiển thị đè lên trên cùng */}
        {toast && <Toast message={toast.message} type={toast.type} onClose={handleToastClose} />}

        {/* Chat Widget - Hiển thị trên các trang khách */}
        {!isAdminRoute && !isTryOnPage && (
          <Suspense fallback={null}>
            <ChatWidget />
          </Suspense>
        )}

        {!isTryOnPage && !isAdminRoute && <Footer />}
      </div>
    );
  };

  // --- RENDER GIAO DIỆN ---
  return (
    <ThemeProvider>
      <AuthProvider>
        <FittingRoomProvider>
          <WishlistProvider>
            <CompareProvider>
              <LanguageProvider>
                <BrowserRouter>
                  <ScrollToTop />
                  <AppShell />
                </BrowserRouter>
              </LanguageProvider>
            </CompareProvider>
          </WishlistProvider>
        </FittingRoomProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;