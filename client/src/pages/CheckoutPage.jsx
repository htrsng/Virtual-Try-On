import React, { useState, useEffect, useRef } from 'react';
import MapPicker from '../components/MapPicker';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

function CheckoutPage({ cartItems, onRemove, onUpdateQuantity, onCheckoutSuccess, showToast }) {
    const navigate = useNavigate();
    const { user, isAuthenticated, loading } = useAuth();
    const hasRedirected = useRef(false); // Đánh dấu đã redirect chưa

    // Thông tin giao hàng - auto-fill từ user profile
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [city, setCity] = useState('');
    const [district, setDistrict] = useState('');
    const [ward, setWard] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('COD');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // State cho mã giảm giá
    const [discountCode, setDiscountCode] = useState('');
    const [appliedDiscount, setAppliedDiscount] = useState(null);
    const [discountError, setDiscountError] = useState('');
    const [showCouponList, setShowCouponList] = useState(false);
    const [myCoupons, setMyCoupons] = useState([]);
    const [usedCoupons, setUsedCoupons] = useState([]); // Mã đã sử dụng

    // State cho chọn sản phẩm
    const [selectedItems, setSelectedItems] = useState({});

    // State cho checkout 2 bước
    const [checkoutStep, setCheckoutStep] = useState(1); // 1: Chọn sản phẩm, 2: Nhập thông tin
    const [selectedProducts, setSelectedProducts] = useState([]); // Sản phẩm đã chọn ở bước 1

    // Danh sách mã giảm giá hợp lệ
    const validCoupons = [
        { code: 'GIAM10', discount: 10, minOrder: 0 },
        { code: 'GIAM15', discount: 15, minOrder: 200000 },
        { code: 'GIAM20', discount: 20, minOrder: 500000 },
        { code: 'GIAM30', discount: 30, minOrder: 1000000 },
        { code: 'GIAM50', discount: 50, minOrder: 2000000 },
    ];

    // Reset mã giảm giá khi vào trang checkout
    useEffect(() => {
        // Reset mã giảm giá mỗi khi vào trang checkout
        setDiscountCode('');
        setAppliedDiscount(null);
        setDiscountError('');
    }, []); // Chạy 1 lần khi component mount

    // Initialize all items as selected when cart changes
    useEffect(() => {
        const initialSelected = {};
        cartItems.forEach(item => {
            initialSelected[item.cartId] = true;
        });
        setSelectedItems(initialSelected);
    }, [cartItems]);

    // Kiểm tra authentication - chỉ chạy 1 lần khi mount
    useEffect(() => {
        if (loading) return;
        if (hasRedirected.current) return; // Đã redirect rồi thì không làm gì

        if (!isAuthenticated) {
            hasRedirected.current = true; // Đánh dấu đã redirect
            showToast("Vui lòng đăng nhập để thanh toán!", "warning");
            navigate('/login', { replace: true });
        }
    }, [loading, isAuthenticated]); // Bỏ navigate và showToast khỏi dependencies

    // Auto-fill thông tin từ user profile
    useEffect(() => {
        if (user) {
            setFullName(user.fullName || '');
            setPhone(user.phone || '');
            setAddress(user.address || '');
            setCity(user.city || '');
            setDistrict(user.district || '');
            setWard(user.ward || '');
        }
    }, [user]);

    // Load mã giảm giá và coupons đã dùng
    useEffect(() => {
        if (!isAuthenticated) return;

        // Load danh sách mã đã sử dụng từ server
        const fetchUsedCoupons = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;

                const response = await fetch('http://localhost:3000/api/used-coupons', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    setUsedCoupons(data.coupons || []);
                }
            } catch (err) {
                console.error('Lỗi load mã đã dùng:', err);
            }
        };

        fetchUsedCoupons();

        // Load mã giảm giá từ localStorage (chỉ mã từ vòng quay và newsletter)
        const loadCoupons = () => {
            const savedCoupons = JSON.parse(localStorage.getItem('myCoupons') || '[]');
            console.log('📦 Load mã giảm giá từ localStorage:', savedCoupons);
            setMyCoupons(savedCoupons);
        };

        loadCoupons();

        // Lắng nghe sự kiện storage để cập nhật khi có mã mới từ vòng quay
        const handleStorageChange = (e) => {
            if (e.key === 'myCoupons') {
                loadCoupons();
            }
        };

        // Lắng nghe custom event từ vòng quay (trong cùng tab)
        const handleCouponUpdate = () => {
            console.log('🎯 Nhận event couponUpdated - đang reload mã...');
            loadCoupons();
        };

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('couponUpdated', handleCouponUpdate);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('couponUpdated', handleCouponUpdate);
        };
    }, [isAuthenticated]);

    const handleSelectItem = (itemId) => {
        setSelectedItems(prev => ({
            ...prev,
            [itemId]: !prev[itemId]
        }));
    };

    const handleSelectAll = () => {
        const allSelected = Object.values(selectedItems).every(val => val);
        const newSelected = {};
        cartItems.forEach(item => {
            newSelected[item.cartId] = !allSelected;
        });
        setSelectedItems(newSelected);
    };

    // Hàm chuyển sang bước 2 (nhập thông tin)
    const proceedToCheckout = () => {
        const selected = cartItems.filter(item => selectedItems[item.cartId]);
        if (selected.length === 0) {
            showToast("Vui lòng chọn ít nhất một sản phẩm để mua hàng!", "warning");
            return;
        }
        setSelectedProducts(selected);
        setCheckoutStep(2);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Hàm quay lại bước 1
    const backToCart = () => {
        setCheckoutStep(1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const parsePrice = (price) => {
        if (typeof price === 'number') {
            return price;
        }
        return parseInt(String(price).replace(/\./g, '').replace(' đ', '').replace(/,/g, '')) || 0;
    };

    // Tính tổng tiền dựa trên step hiện tại
    const totalAmount = checkoutStep === 1
        ? cartItems.reduce((acc, item) => {
            if (selectedItems[item.cartId]) {
                return acc + parsePrice(item.price) * item.quantity;
            }
            return acc;
        }, 0)
        : selectedProducts.reduce((acc, item) => {
            return acc + parsePrice(item.price) * item.quantity;
        }, 0);

    const selectedCount = Object.values(selectedItems).filter(Boolean).length;
    const allSelected = selectedCount === cartItems.length && cartItems.length > 0;

    // Tính toán giảm giá
    const discountAmount = appliedDiscount ? (totalAmount * appliedDiscount.discount) / 100 : 0;
    const finalAmount = totalAmount - discountAmount;

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
    };

    // Hàm áp dụng mã giảm giá
    const applyDiscountCode = async () => {
        if (!discountCode.trim()) {
            setDiscountError('Vui lòng nhập mã giảm giá');
            return;
        }

        // Kiểm tra mã cố định trước
        const coupon = validCoupons.find(c => c.code.toUpperCase() === discountCode.toUpperCase());

        if (coupon) {
            // Mã cố định
            if (totalAmount < coupon.minOrder) {
                setDiscountError(`Đơn hàng tối thiểu ${formatPrice(coupon.minOrder)} để dùng mã này`);
                setAppliedDiscount(null);
                return;
            }

            // Kiểm tra mã đã sử dụng chưa (gọi API - BẮT BUỘC)
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    setDiscountError('Vui lòng đăng nhập để sử dụng mã giảm giá');
                    setAppliedDiscount(null);
                    return;
                }

                const checkResponse = await fetch('http://localhost:3000/api/check-coupon-used', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ couponCode: discountCode })
                });

                if (!checkResponse.ok) {
                    setDiscountError('Không thể kiểm tra mã giảm giá. Vui lòng thử lại');
                    setAppliedDiscount(null);
                    return;
                }

                const checkData = await checkResponse.json();
                if (checkData.used) {
                    setDiscountError('Bạn đã sử dụng mã giảm giá này rồi');
                    setAppliedDiscount(null);
                    return;
                }
            } catch (err) {
                console.error('Lỗi kiểm tra mã:', err);
                setDiscountError('Lỗi kiểm tra mã giảm giá. Vui lòng thử lại');
                setAppliedDiscount(null);
                return; // Chặn không cho áp dụng nếu API lỗi
            }

            setAppliedDiscount(coupon);
            setDiscountError('');
            showToast(`Áp dụng mã giảm ${coupon.discount}% thành công! 🎉`, 'success');
            return;
        }

        // Kiểm tra mã từ newsletter
        if (discountCode.startsWith('NEWS10')) {
            try {
                // Kiểm tra mã đã dùng chưa trong UsedCouponModel
                const token = localStorage.getItem('token');
                if (!token) {
                    setDiscountError('Vui lòng đăng nhập để sử dụng mã giảm giá');
                    setAppliedDiscount(null);
                    return;
                }

                const checkUsedResponse = await fetch('http://localhost:3000/api/check-coupon-used', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ couponCode: discountCode })
                });

                if (checkUsedResponse.ok) {
                    const checkData = await checkUsedResponse.json();
                    if (checkData.used) {
                        setDiscountError('Bạn đã sử dụng mã giảm giá này rồi');
                        setAppliedDiscount(null);
                        return;
                    }
                }

                // Kiểm tra mã newsletter có hợp lệ không
                const response = await fetch('http://localhost:3000/api/newsletter/validate-coupon', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ couponCode: discountCode })
                });

                const data = await response.json();

                if (response.ok && data.valid) {
                    setAppliedDiscount({
                        code: discountCode,
                        discount: data.discount,
                        minOrder: 0,
                        isNewsletter: true
                    });
                    setDiscountError('');
                    showToast(`Áp dụng mã newsletter giảm ${data.discount}% thành công! 🎉`, 'success');
                } else {
                    setDiscountError(data.message || 'Mã giảm giá không hợp lệ');
                    setAppliedDiscount(null);
                }
            } catch (err) {
                console.error('Lỗi kiểm tra mã newsletter:', err);
                setDiscountError('Không thể kiểm tra mã giảm giá');
                setAppliedDiscount(null);
            }
        } else {
            setDiscountError('Mã giảm giá không hợp lệ');
            setAppliedDiscount(null);
        }
    };

    // Hàm xóa mã giảm giá
    const removeDiscount = () => {
        setAppliedDiscount(null);
        setDiscountCode('');
        setDiscountError('');
    };

    // Hàm chọn mã từ danh sách
    const selectCoupon = (code) => {
        setDiscountCode(code);
        setShowCouponList(false);
        // Tự động áp dụng
        setTimeout(() => {
            document.getElementById('apply-coupon-btn')?.click();
        }, 100);
    };

    const handlePayment = async (e) => {
        e.preventDefault();

        if (selectedProducts.length === 0) {
            showToast("Không có sản phẩm nào được chọn!", "warning");
            return;
        }

        if (!fullName || !phone || !address || !city || !district || !ward) {
            showToast("Vui lòng điền đầy đủ thông tin giao hàng!", "warning");
            return;
        }

        setIsSubmitting(true);

        try {
            // Lấy token từ localStorage
            const token = localStorage.getItem('token');
            console.log('🔑 Token:', token ? 'Có token' : 'Không có token');

            if (!token) {
                showToast("Vui lòng đăng nhập lại!", "error");
                navigate('/login');
                return;
            }

            // Chuẩn bị dữ liệu đơn hàng - sử dụng selectedProducts
            const orderData = {
                products: selectedProducts.map(item => ({
                    productId: item.id,
                    name: item.name,
                    price: parsePrice(item.price),
                    quantity: item.quantity,
                    img: item.img
                })),
                totalAmount: finalAmount, // Dùng finalAmount đã trừ giảm giá
                discountCode: appliedDiscount?.code || null,
                discountAmount: discountAmount,
                shippingInfo: {
                    fullName,
                    phone,
                    address,
                    city,
                    district,
                    ward
                },
                paymentMethod
            };

            console.log('📦 Dữ liệu đơn hàng:', orderData);

            // Gửi đơn hàng lên server với token
            const response = await axios.post('http://localhost:3000/api/orders', orderData, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            console.log('✅ Response:', response.data);

            // Đánh dấu mã newsletter đã sử dụng
            if (appliedDiscount && appliedDiscount.isNewsletter) {
                try {
                    await fetch('http://localhost:3000/api/newsletter/use-coupon', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ couponCode: appliedDiscount.code })
                    });
                    console.log('✅ Đã đánh dấu mã newsletter đã sử dụng');
                } catch (err) {
                    console.error('Lỗi đánh dấu mã:', err);
                }
            }

            showToast("Đặt hàng thành công! 🎉", "success");

            // CẬP NHẬT SỐ "ĐÃ BÁN" CHO SẢN PHẨM FLASH SALE
            const flashSaleProducts = JSON.parse(localStorage.getItem('flashSaleProducts') || '[]');
            let hasFlashSaleUpdate = false;

            cartItems.forEach(cartItem => {
                const flashIndex = flashSaleProducts.findIndex(p => p.id === cartItem.id);
                if (flashIndex !== -1) {
                    flashSaleProducts[flashIndex].sold = (flashSaleProducts[flashIndex].sold || 0) + cartItem.quantity;
                    flashSaleProducts[flashIndex].stock = Math.max(0, flashSaleProducts[flashIndex].stock - cartItem.quantity);
                    hasFlashSaleUpdate = true;
                }
            });

            if (hasFlashSaleUpdate) {
                localStorage.setItem('flashSaleProducts', JSON.stringify(flashSaleProducts));
                console.log('✅ Đã cập nhật số đã bán cho flash sale');
            }

            // Reset mã giảm giá sau khi đặt hàng thành công
            setDiscountCode('');
            setAppliedDiscount(null);
            setDiscountError('');

            onCheckoutSuccess(finalAmount); // Dùng finalAmount

            // Chuyển sang trang đơn hàng của tôi sau 1.5s
            setTimeout(() => {
                navigate('/profile');
            }, 1500);

        } catch (error) {
            console.error('❌ Lỗi đặt hàng:', error);
            console.error('❌ Error response:', error.response?.data);
            console.error('❌ Error status:', error.response?.status);
            console.error('❌ Full error:', JSON.stringify(error.response, null, 2));

            const errorMessage = error.response?.data?.message ||
                error.response?.data?.error ||
                error.response?.data?.details ||
                "Đặt hàng thất bại!";

            showToast(errorMessage, "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Hiển thị loading khi đang kiểm tra authentication
    if (loading) {
        return (
            <div className="container" style={{
                textAlign: 'center',
                padding: '100px 20px',
                background: 'white',
                marginTop: '20px',
                borderRadius: '8px'
            }}>
                <div style={{ fontSize: '40px', marginBottom: '20px' }}>⏳</div>
                <p style={{ color: '#666' }}>Đang tải...</p>
            </div>
        );
    }

    if (cartItems.length === 0) {
        return (
            <div className="container" style={{
                textAlign: 'center',
                padding: '80px 20px',
                background: 'white',
                marginTop: '20px',
                borderRadius: '8px'
            }}>
                <div style={{ fontSize: '80px', marginBottom: '20px' }}>🛒</div>
                <h2 style={{ marginBottom: '10px' }}>Giỏ hàng của bạn còn trống</h2>
                <p style={{ color: '#666', marginBottom: '30px' }}>Hãy thêm sản phẩm để tiếp tục mua sắm!</p>
                <Link
                    to="/"
                    style={{
                        textDecoration: 'none',
                        display: 'inline-block',
                        padding: '12px 40px',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        borderRadius: '6px',
                        fontWeight: 'bold',
                        fontSize: '16px'
                    }}
                >
                    🛍️ MUA NGAY
                </Link>
            </div>
        );
    }

    return (
        <div className="container" style={{ marginTop: '20px', marginBottom: '40px' }}>
            {/* Step Indicator */}
            <div style={{
                background: 'white',
                padding: '20px',
                borderRadius: '8px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '20px'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    color: checkoutStep === 1 ? '#667eea' : '#52c41a',
                    fontWeight: 'bold'
                }}>
                    <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: checkoutStep === 1 ? '#667eea' : '#52c41a',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '16px'
                    }}>
                        {checkoutStep === 1 ? '1' : '✓'}
                    </div>
                    <span>Chọn sản phẩm</span>
                </div>
                <div style={{
                    width: '60px',
                    height: '2px',
                    background: checkoutStep === 2 ? '#667eea' : '#ddd'
                }}></div>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    color: checkoutStep === 2 ? '#667eea' : '#999',
                    fontWeight: checkoutStep === 2 ? 'bold' : 'normal'
                }}>
                    <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: checkoutStep === 2 ? '#667eea' : '#ddd',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '16px'
                    }}>
                        2
                    </div>
                    <span>Thanh toán</span>
                </div>
            </div>

            {/* STEP 1: Chọn sản phẩm */}
            {checkoutStep === 1 && (
                <div>
                    <div style={{
                        background: 'white',
                        padding: '20px',
                        borderRadius: '8px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}>
                        <h2 style={{ fontSize: '22px', marginBottom: '20px', color: '#333', fontWeight: '700' }}>
                            🛒 Giỏ hàng của bạn ({cartItems.length} sản phẩm)
                        </h2>
                        <div style={{
                            padding: '12px',
                            background: '#f9f9f9',
                            borderRadius: '6px',
                            marginBottom: '15px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px'
                        }}>
                            <input
                                type="checkbox"
                                checked={allSelected}
                                onChange={handleSelectAll}
                                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                            />
                            <span style={{ fontWeight: '500', color: '#555' }}>
                                Chọn tất cả ({cartItems.length} sản phẩm) - Đã chọn: {selectedCount}
                            </span>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid #f0f0f0', color: '#666', fontSize: '14px' }}>
                                        <th style={{ width: '40px', paddingBottom: '15px', fontWeight: '600' }}></th>
                                        <th style={{ textAlign: 'left', paddingBottom: '15px', fontWeight: '600' }}>Sản Phẩm</th>
                                        <th style={{ paddingBottom: '15px', fontWeight: '600' }}>Đơn Giá</th>
                                        <th style={{ paddingBottom: '15px', fontWeight: '600' }}>Số Lượng</th>
                                        <th style={{ paddingBottom: '15px', fontWeight: '600' }}>Số Tiền</th>
                                        <th style={{ paddingBottom: '15px', fontWeight: '600' }}>Thao Tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cartItems.map((item) => (
                                        <tr key={item.cartId} style={{
                                            borderBottom: '1px solid #f5f5f5',
                                            backgroundColor: selectedItems[item.cartId] ? '#fff' : '#f9f9f9',
                                            opacity: selectedItems[item.cartId] ? 1 : 0.6
                                        }}>
                                            <td style={{ padding: '20px 10px', textAlign: 'center', verticalAlign: 'middle' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedItems[item.cartId] || false}
                                                    onChange={() => handleSelectItem(item.cartId)}
                                                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                                />
                                            </td>
                                            <td style={{ padding: '20px 10px 20px 0', display: 'flex', alignItems: 'center', gap: '15px' }}>
                                                <img
                                                    src={item.img}
                                                    alt={item.name}
                                                    style={{
                                                        width: '80px',
                                                        height: '80px',
                                                        objectFit: 'cover',
                                                        borderRadius: '6px',
                                                        border: '1px solid #e8e8e8'
                                                    }}
                                                />
                                                <div>
                                                    <div style={{
                                                        fontSize: '15px',
                                                        marginBottom: '5px',
                                                        fontWeight: '500',
                                                        maxWidth: '250px'
                                                    }}>
                                                        {item.name}
                                                    </div>
                                                    <div style={{ fontSize: '13px', color: '#888' }}>
                                                        Size: {item.size}
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ textAlign: 'center', fontSize: '15px' }}>
                                                {formatPrice(parsePrice(item.price))}
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <button
                                                        className="qty-btn"
                                                        onClick={() => onUpdateQuantity(item.cartId, -1)}
                                                        style={{
                                                            padding: '5px 12px',
                                                            border: '1px solid #ddd',
                                                            background: 'white',
                                                            cursor: 'pointer',
                                                            borderRadius: '4px 0 0 4px'
                                                        }}
                                                    >
                                                        -
                                                    </button>
                                                    <input
                                                        className="qty-input"
                                                        type="text"
                                                        value={item.quantity}
                                                        readOnly
                                                        style={{
                                                            width: '50px',
                                                            textAlign: 'center',
                                                            border: '1px solid #ddd',
                                                            borderLeft: 'none',
                                                            borderRight: 'none',
                                                            padding: '5px'
                                                        }}
                                                    />
                                                    <button
                                                        className="qty-btn"
                                                        onClick={() => onUpdateQuantity(item.cartId, 1)}
                                                        style={{
                                                            padding: '5px 12px',
                                                            border: '1px solid #ddd',
                                                            background: 'white',
                                                            cursor: 'pointer',
                                                            borderRadius: '0 4px 4px 0'
                                                        }}
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                            </td>
                                            <td style={{ textAlign: 'center', color: '#ee4d2d', fontWeight: 'bold', fontSize: '16px' }}>
                                                {formatPrice(parsePrice(item.price) * item.quantity)}
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <button
                                                    onClick={() => onRemove(item.cartId)}
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        color: '#ee4d2d',
                                                        fontSize: '20px',
                                                        padding: '5px'
                                                    }}
                                                    title="Xóa sản phẩm"
                                                >
                                                    🗑️
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Nút Mua hàng - Chuyển sang bước 2 */}
                    <div style={{
                        background: 'white',
                        padding: '20px',
                        borderRadius: '8px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        marginTop: '20px'
                    }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '15px'
                        }}>
                            <span style={{ fontSize: '16px', fontWeight: '600' }}>
                                Tổng tạm tính ({selectedCount} sản phẩm):
                            </span>
                            <span style={{ fontSize: '24px', color: '#ee4d2d', fontWeight: 'bold' }}>
                                {formatPrice(totalAmount)}
                            </span>
                        </div>
                        <button
                            onClick={proceedToCheckout}
                            disabled={selectedCount === 0}
                            style={{
                                width: '100%',
                                padding: '15px',
                                background: selectedCount === 0
                                    ? '#ccc'
                                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '18px',
                                fontWeight: 'bold',
                                cursor: selectedCount === 0 ? 'not-allowed' : 'pointer',
                                transition: 'all 0.3s',
                                opacity: selectedCount === 0 ? 0.5 : 1
                            }}
                        >
                            🛒 MUA HÀNG ({selectedCount} sản phẩm)
                        </button>
                    </div>
                </div>
            )}

            {/* STEP 2: Thanh toán */}
            {checkoutStep === 2 && (
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                    {/* Danh sách sản phẩm đã chọn */}
                    <div style={{ flex: '1 1 600px' }}>
                        <div style={{
                            background: 'white',
                            padding: '20px',
                            borderRadius: '8px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                                <h2 style={{ fontSize: '22px', color: '#333', fontWeight: '700', margin: 0 }}>
                                    📦 Sản phẩm đã chọn ({selectedProducts.length})
                                </h2>
                                <button
                                    onClick={backToCart}
                                    style={{
                                        padding: '8px 16px',
                                        background: '#fff',
                                        border: '1px solid #ddd',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        color: '#666'
                                    }}
                                >
                                    ← Quay lại
                                </button>
                            </div>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '2px solid #f0f0f0', color: '#666', fontSize: '14px' }}>
                                            <th style={{ textAlign: 'left', paddingBottom: '15px', fontWeight: '600' }}>Sản Phẩm</th>
                                            <th style={{ paddingBottom: '15px', fontWeight: '600', textAlign: 'center' }}>Đơn Giá</th>
                                            <th style={{ paddingBottom: '15px', fontWeight: '600', textAlign: 'center' }}>Số Lượng</th>
                                            <th style={{ paddingBottom: '15px', fontWeight: '600', textAlign: 'center' }}>Tổng</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedProducts.map((item) => (
                                            <tr key={item.cartId} style={{ borderBottom: '1px solid #f5f5f5' }}>
                                                <td style={{ padding: '15px 10px 15px 0', display: 'flex', alignItems: 'center', gap: '15px' }}>
                                                    <img
                                                        src={item.img}
                                                        alt={item.name}
                                                        style={{
                                                            width: '70px',
                                                            height: '70px',
                                                            objectFit: 'cover',
                                                            borderRadius: '6px',
                                                            border: '1px solid #e8e8e8'
                                                        }}
                                                    />
                                                    <div>
                                                        <div style={{
                                                            fontSize: '15px',
                                                            marginBottom: '5px',
                                                            fontWeight: '500'
                                                        }}>
                                                            {item.name}
                                                        </div>
                                                        <div style={{ fontSize: '13px', color: '#888' }}>
                                                            Size: {item.size}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ textAlign: 'center', fontSize: '15px', padding: '15px 5px' }}>
                                                    {formatPrice(parsePrice(item.price))}
                                                </td>
                                                <td style={{ textAlign: 'center', fontSize: '15px', padding: '15px 5px' }}>
                                                    x{item.quantity}
                                                </td>
                                                <td style={{ textAlign: 'center', color: '#ee4d2d', fontWeight: 'bold', fontSize: '16px', padding: '15px 5px' }}>
                                                    {formatPrice(parsePrice(item.price) * item.quantity)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Thông tin thanh toán */}
                    <div style={{ flex: '1 1 350px', maxWidth: '450px' }}>
                        <div style={{
                            background: 'white',
                            padding: '25px',
                            borderRadius: '8px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                            position: 'sticky',
                            top: '20px'
                        }}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '15px',
                                paddingBottom: '15px',
                                borderBottom: '1px solid #f0f0f0'
                            }}>
                                <span style={{ color: '#666', fontSize: '16px' }}>Tạm tính:</span>
                                <span style={{ fontSize: '18px', fontWeight: '600' }}>
                                    {formatPrice(totalAmount)}
                                </span>
                            </div>

                            {/* Mã giảm giá */}
                            <div style={{ marginBottom: '20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                                    <h4 style={{ margin: 0, fontSize: '15px', color: '#333' }}>Mã giảm giá</h4>
                                    {myCoupons.length > 0 && !appliedDiscount && (
                                        <button
                                            type="button"
                                            onClick={() => setShowCouponList(!showCouponList)}
                                            style={{
                                                background: 'none',
                                                border: '1px solid #ee4d2d',
                                                color: '#ee4d2d',
                                                padding: '5px 12px',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                fontSize: '13px',
                                                fontWeight: '600'
                                            }}
                                        >
                                            {showCouponList ? 'Ẩn danh sách' : `${myCoupons.filter(c => !usedCoupons.includes(c)).length} mã có sẵn`}
                                        </button>
                                    )}
                                </div>

                                {/* Danh sách mã đã có */}
                                {showCouponList && myCoupons.length > 0 && (
                                    (() => {
                                        // Filter ra mã đã sử dụng
                                        const availableCoupons = myCoupons.filter(coupon => !usedCoupons.includes(coupon));

                                        if (availableCoupons.length === 0) {
                                            return (
                                                <div style={{
                                                    background: '#f9f9f9',
                                                    border: '1px solid #e0e0e0',
                                                    borderRadius: '6px',
                                                    padding: '20px',
                                                    marginBottom: '12px',
                                                    textAlign: 'center',
                                                    color: '#999'
                                                }}>
                                                    😔 Bạn đã sử dụng hết mã giảm giá
                                                </div>
                                            );
                                        }

                                        return (
                                            <div style={{
                                                background: '#f9f9f9',
                                                border: '1px solid #e0e0e0',
                                                borderRadius: '6px',
                                                padding: '12px',
                                                marginBottom: '12px',
                                                maxHeight: '150px',
                                                overflowY: 'auto'
                                            }}>
                                                {availableCoupons.map((coupon, index) => (
                                                    <div
                                                        key={index}
                                                        onClick={() => selectCoupon(coupon)}
                                                        style={{
                                                            background: 'white',
                                                            border: '1px solid #ddd',
                                                            borderRadius: '4px',
                                                            padding: '10px 12px',
                                                            marginBottom: index < availableCoupons.length - 1 ? '8px' : 0,
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center',
                                                            transition: 'all 0.2s'
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.borderColor = '#ee4d2d';
                                                            e.currentTarget.style.background = '#fff5f5';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.borderColor = '#ddd';
                                                            e.currentTarget.style.background = 'white';
                                                        }}
                                                    >
                                                        <div>
                                                            <div style={{ fontWeight: '600', fontSize: '14px', color: '#333', marginBottom: '3px' }}>
                                                                {coupon}
                                                            </div>
                                                            <div style={{ fontSize: '12px', color: '#666' }}>
                                                                {coupon.startsWith('NEWS10') ? 'Mã từ đăng ký nhận tin' : 'Mã giảm giá'}
                                                            </div>
                                                        </div>
                                                        <div style={{
                                                            background: '#ee4d2d',
                                                            color: 'white',
                                                            padding: '4px 10px',
                                                            borderRadius: '12px',
                                                            fontSize: '11px',
                                                            fontWeight: '600'
                                                        }}>
                                                            Chọn
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    })()
                                )}

                                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                                    <input
                                        type="text"
                                        placeholder="Nhập mã giảm giá"
                                        value={discountCode}
                                        onChange={(e) => setDiscountCode(e.target.value)}
                                        disabled={appliedDiscount !== null}
                                        style={{
                                            flex: 1,
                                            padding: '10px 15px',
                                            border: '1px solid #ddd',
                                            borderRadius: '4px',
                                            fontSize: '14px'
                                        }}
                                    />
                                    {appliedDiscount ? (
                                        <button
                                            type="button"
                                            onClick={removeDiscount}
                                            style={{
                                                padding: '10px 20px',
                                                background: '#ff4d4f',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                fontSize: '14px',
                                                fontWeight: '600'
                                            }}
                                        >
                                            Xóa
                                        </button>
                                    ) : (
                                        <button
                                            id="apply-coupon-btn"
                                            type="button"
                                            onClick={applyDiscountCode}
                                            style={{
                                                padding: '10px 20px',
                                                background: '#52c41a',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                fontSize: '14px',
                                                fontWeight: '600'
                                            }}
                                        >
                                            Áp dụng
                                        </button>
                                    )}
                                </div>
                                {discountError && (
                                    <p style={{ color: '#ff4d4f', fontSize: '12px', margin: '5px 0 0 0' }}>
                                        {discountError}
                                    </p>
                                )}
                                {appliedDiscount && (
                                    <div style={{
                                        background: '#f6ffed',
                                        border: '1px solid #b7eb8f',
                                        borderRadius: '4px',
                                        padding: '10px',
                                        marginTop: '10px'
                                    }}>
                                        <p style={{ color: '#52c41a', fontSize: '13px', margin: 0 }}>
                                            ✅ Đã áp dụng mã <strong>{appliedDiscount.code}</strong> - Giảm {appliedDiscount.discount}%
                                        </p>
                                    </div>
                                )}
                            </div>

                            {appliedDiscount && (
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: '15px',
                                    paddingBottom: '15px',
                                    borderBottom: '1px solid #f0f0f0'
                                }}>
                                    <span style={{ color: '#52c41a', fontSize: '14px' }}>Giảm giá ({appliedDiscount.discount}%):</span>
                                    <span style={{ fontSize: '16px', color: '#52c41a', fontWeight: '600' }}>
                                        -{formatPrice(discountAmount)}
                                    </span>
                                </div>
                            )}

                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '25px',
                                paddingBottom: '20px',
                                borderBottom: '2px solid #f0f0f0'
                            }}>
                                <div>
                                    <div style={{ color: '#666', fontSize: '16px', fontWeight: 'bold' }}>Tổng thanh toán:</div>
                                    <div style={{ color: '#999', fontSize: '13px', marginTop: '4px' }}>
                                        ({selectedProducts.length} sản phẩm)
                                    </div>
                                </div>
                                <span style={{ fontSize: '28px', color: '#ee4d2d', fontWeight: 'bold' }}>
                                    {formatPrice(finalAmount)}
                                </span>
                            </div>

                            <h3 style={{ fontSize: '18px', marginBottom: '20px', fontWeight: '700' }}>
                                📦 Thông tin nhận hàng
                            </h3>

                            <form onSubmit={handlePayment}>
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', color: '#666', fontSize: '14px' }}>
                                        Họ và tên *
                                    </label>
                                    <input
                                        className="pay-input"
                                        type="text"
                                        placeholder="Nhập họ và tên"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            border: '1px solid #ddd',
                                            borderRadius: '6px',
                                            fontSize: '15px'
                                        }}
                                    />
                                </div>

                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', color: '#666', fontSize: '14px' }}>
                                        Số điện thoại *
                                    </label>
                                    <input
                                        className="pay-input"
                                        type="tel"
                                        placeholder="Nhập số điện thoại"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            border: '1px solid #ddd',
                                            borderRadius: '6px',
                                            fontSize: '15px'
                                        }}
                                    />
                                </div>

                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', color: '#666', fontSize: '14px' }}>
                                        Địa chỉ *
                                    </label>
                                    <input
                                        className="pay-input"
                                        type="text"
                                        placeholder="Số nhà, tên đường"
                                        value={address}
                                        onChange={(e) => setAddress(e.target.value)}
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            border: '1px solid #ddd',
                                            borderRadius: '6px',
                                            fontSize: '15px',
                                            marginBottom: 8
                                        }}
                                    />
                                    {/* Hiển thị bản đồ Google Maps preview */}
                                    <MapPicker address={address} />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '5px', color: '#666', fontSize: '14px' }}>
                                            Phường/Xã *
                                        </label>
                                        <input
                                            className="pay-input"
                                            type="text"
                                            placeholder="Phường/Xã"
                                            value={ward}
                                            onChange={(e) => setWard(e.target.value)}
                                            required
                                            style={{
                                                width: '100%',
                                                padding: '12px',
                                                border: '1px solid #ddd',
                                                borderRadius: '6px',
                                                fontSize: '15px'
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '5px', color: '#666', fontSize: '14px' }}>
                                            Quận/Huyện *
                                        </label>
                                        <input
                                            className="pay-input"
                                            type="text"
                                            placeholder="Quận/Huyện"
                                            value={district}
                                            onChange={(e) => setDistrict(e.target.value)}
                                            required
                                            style={{
                                                width: '100%',
                                                padding: '12px',
                                                border: '1px solid #ddd',
                                                borderRadius: '6px',
                                                fontSize: '15px'
                                            }}
                                        />
                                    </div>
                                </div>

                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', color: '#666', fontSize: '14px' }}>
                                        Tỉnh/Thành phố *
                                    </label>
                                    <input
                                        className="pay-input"
                                        type="text"
                                        placeholder="Tỉnh/Thành phố"
                                        value={city}
                                        onChange={(e) => setCity(e.target.value)}
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            border: '1px solid #ddd',
                                            borderRadius: '6px',
                                            fontSize: '15px'
                                        }}
                                    />
                                </div>

                                <div style={{ marginBottom: '25px' }}>
                                    <label style={{ display: 'block', marginBottom: '10px', color: '#666', fontSize: '14px', fontWeight: '600' }}>
                                        Phương thức thanh toán
                                    </label>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        <label style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            padding: '12px',
                                            border: '2px solid ' + (paymentMethod === 'COD' ? '#667eea' : '#ddd'),
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            background: paymentMethod === 'COD' ? '#f0f4ff' : 'white'
                                        }}>
                                            <input
                                                type="radio"
                                                name="payment"
                                                value="COD"
                                                checked={paymentMethod === 'COD'}
                                                onChange={(e) => setPaymentMethod(e.target.value)}
                                                style={{ marginRight: '10px' }}
                                            />
                                            💵 Thanh toán khi nhận hàng (COD)
                                        </label>
                                        <label style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            padding: '12px',
                                            border: '2px solid ' + (paymentMethod === 'Banking' ? '#667eea' : '#ddd'),
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            background: paymentMethod === 'Banking' ? '#f0f4ff' : 'white'
                                        }}>
                                            <input
                                                type="radio"
                                                name="payment"
                                                value="Banking"
                                                checked={paymentMethod === 'Banking'}
                                                onChange={(e) => setPaymentMethod(e.target.value)}
                                                style={{ marginRight: '10px' }}
                                            />
                                            🏦 Chuyển khoản ngân hàng
                                        </label>
                                    </div>
                                </div>

                                <button
                                    className="pay-btn"
                                    type="submit"
                                    disabled={isSubmitting}
                                    style={{
                                        width: '100%',
                                        padding: '15px',
                                        background: isSubmitting
                                            ? '#ccc'
                                            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        fontSize: '16px',
                                        fontWeight: 'bold',
                                        cursor: isSubmitting ? 'not-allowed' : 'pointer',
                                        transition: 'all 0.3s'
                                    }}
                                >
                                    {isSubmitting ? '⏳ Đang xử lý...' : `🎉 ĐẶT HÀNG NGAY (${selectedProducts.length} sản phẩm)`}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )
            }
        </div >
    );
}

export default CheckoutPage;