import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FiX, FiZoomIn, FiPackage, FiTruck, FiShield, FiCheckCircle } from 'react-icons/fi';
import axios from 'axios';
import './CheckoutPage.css';

function CheckoutPage({ onCheckoutSuccess, showToast }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, isAuthenticated, loading } = useAuth();
    const hasRedirected = useRef(false);
    const hasLoadedProducts = useRef(false);

    // Load sản phẩm đã chọn từ localStorage hoặc state
    const [selectedProducts, setSelectedProducts] = useState([]);

    // State cho modal xem ảnh
    const [imageModalOpen, setImageModalOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState('');

    // State cho modal xác nhận đơn hàng
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);

    // State cho phương thức vận chuyển
    const [shippingMethod, setShippingMethod] = useState('standard');
    const shippingOptions = [
        { id: 'standard', name: 'Giao hàng tiêu chuẩn', time: '3-5 ngày', price: 30000 },
        { id: 'express', name: 'Giao hàng nhanh', time: '1-2 ngày', price: 50000 },
        { id: 'super', name: 'Giao hàng siêu tốc', time: 'Trong ngày', price: 100000 }
    ];

    useEffect(() => {
        if (!imageModalOpen && !confirmModalOpen) return;

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                setImageModalOpen(false);
                setConfirmModalOpen(false);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [imageModalOpen, confirmModalOpen]);

    useEffect(() => {
        // Tránh load nhiều lần
        if (hasLoadedProducts.current) {
            console.log('⏭️ Already loaded products, skipping...');
            return;
        }

        console.log('🔍 CheckoutPage: Checking for products...');
        console.log('📍 Location state:', location.state);

        // Ưu tiên lấy từ location.state trước
        const stateProducts = location.state?.selectedProducts;
        if (stateProducts && stateProducts.length > 0) {
            console.log('✅ Loaded from location.state:', stateProducts);
            setSelectedProducts(stateProducts);
            hasLoadedProducts.current = true;
            // Lưu vào localStorage để backup
            localStorage.setItem('selectedProductsForCheckout', JSON.stringify(stateProducts));
            return;
        }

        // Fallback: Lấy từ localStorage
        const saved = localStorage.getItem('selectedProductsForCheckout');
        console.log('📦 Checking localStorage:', saved);

        if (saved) {
            try {
                const products = JSON.parse(saved);
                console.log('✅ Loaded products from localStorage:', products);
                if (products && products.length > 0) {
                    setSelectedProducts(products);
                    hasLoadedProducts.current = true;
                } else {
                    console.warn('⚠️ Products array is empty');
                    if (!hasRedirected.current) {
                        hasRedirected.current = true;
                        showToast("Không tìm thấy sản phẩm!", "error");
                        setTimeout(() => navigate('/checkout/choseproduct', { replace: true }), 100);
                    }
                }
            } catch (e) {
                console.error('❌ Error parsing selectedProducts:', e);
                if (!hasRedirected.current) {
                    hasRedirected.current = true;
                    showToast("Không tìm thấy sản phẩm!", "error");
                    setTimeout(() => navigate('/checkout/choseproduct', { replace: true }), 100);
                }
            }
        } else {
            console.warn('⚠️ No data in localStorage');
            if (!hasRedirected.current) {
                hasRedirected.current = true;
                showToast("Vui lòng chọn sản phẩm trước!", "warning");
                setTimeout(() => navigate('/checkout/choseproduct', { replace: true }), 100);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Chỉ chạy 1 lần khi mount

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
        setDiscountCode('');
        setAppliedDiscount(null);
        setDiscountError('');
    }, []);

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



    const parsePrice = (price) => {
        if (typeof price === 'number') {
            return price;
        }
        return parseInt(String(price).replace(/\./g, '').replace(' đ', '').replace(/,/g, '')) || 0;
    };

    // Tính tổng tiền từ selectedProducts
    const totalAmount = selectedProducts.reduce((acc, item) => {
        return acc + parsePrice(item.price) * item.quantity;
    }, 0);

    // Tính toán giảm giá
    const selectedShipping = shippingOptions.find(opt => opt.id === shippingMethod);
    const shippingFee = selectedShipping?.price || 0;
    const discountAmount = appliedDiscount ? (totalAmount * appliedDiscount.discount) / 100 : 0;
    const finalAmount = totalAmount + shippingFee - discountAmount;

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
    };

    const getDeliveryRange = (methodId) => {
        switch (methodId) {
            case 'express':
                return { from: 1, to: 2 };
            case 'super':
                return { from: 0, to: 0 };
            default:
                return { from: 3, to: 5 };
        }
    };

    const formatDate = (date) => {
        return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    };

    const getDeliveryRangeText = (methodId) => {
        const { from, to } = getDeliveryRange(methodId);
        const start = new Date();
        const end = new Date();
        start.setDate(start.getDate() + from);
        end.setDate(end.getDate() + to);

        if (from === 0 && to === 0) {
            return 'Hôm nay';
        }

        return `${formatDate(start)} - ${formatDate(end)}`;
    };

    // Hàm áp dụng mã giảm giá
    const applyDiscountCode = async () => {
        const normalizedCode = discountCode.trim().toUpperCase();
        if (!normalizedCode) {
            setDiscountError('Vui lòng nhập mã giảm giá');
            return;
        }

        // Kiểm tra mã cố định trước
        const coupon = validCoupons.find(c => c.code.toUpperCase() === normalizedCode);

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
                    body: JSON.stringify({ couponCode: normalizedCode })
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
        if (normalizedCode.startsWith('NEWS10')) {
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
                    body: JSON.stringify({ couponCode: normalizedCode })
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
                    body: JSON.stringify({ couponCode: normalizedCode })
                });

                const data = await response.json();

                if (response.ok && data.valid) {
                    setAppliedDiscount({
                        code: normalizedCode,
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

        // Kiểm tra xem user đã có địa chỉ đầy đủ chưa
        if (!user?.address || !user?.city || !user?.district || !user?.ward) {
            showToast("Vui lòng cập nhật địa chỉ giao hàng trong Hồ sơ của bạn!", "warning");
            setTimeout(() => {
                navigate('/profile');
            }, 1500);
            return;
        }

        if (!fullName || !phone || !address || !city || !district || !ward) {
            showToast("Vui lòng cập nhật đầy đủ thông tin giao hàng trong Hồ sơ!", "warning");
            setTimeout(() => {
                navigate('/profile');
            }, 1500);
            return;
        }

        // Mở modal xác nhận thay vì đặt hàng ngay
        setConfirmModalOpen(true);
    };

    // Hàm xác nhận và thực sự đặt hàng
    const confirmAndPlaceOrder = async () => {
        setConfirmModalOpen(false);
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
                totalAmount: finalAmount, // Dùng finalAmount đã trừ giảm giá và cộng phí ship
                shippingFee: shippingFee,
                shippingMethod: selectedShipping.name,
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

            selectedProducts.forEach(item => {
                // So sánh id bằng String() để tránh lỗi type mismatch
                const flashIndex = flashSaleProducts.findIndex(p => String(p.id) === String(item.id));
                if (flashIndex !== -1) {
                    flashSaleProducts[flashIndex].sold = (flashSaleProducts[flashIndex].sold || 0) + item.quantity;
                    flashSaleProducts[flashIndex].stock = Math.max(0, flashSaleProducts[flashIndex].stock - item.quantity);
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

            // Xóa selectedProducts khỏi localStorage
            localStorage.removeItem('selectedProductsForCheckout');

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

    if (selectedProducts.length === 0 && !loading) {
        return (
            <div className="empty-state container">
                <div className="empty-icon">🛒</div>
                <h2 className="empty-title">Chưa có sản phẩm nào được chọn</h2>
                <p className="empty-description">Vui lòng chọn sản phẩm để thanh toán!</p>
                <Link to="/checkout/choseproduct" className="empty-btn">
                    🛍️ CHỌN SẢN PHẨM
                </Link>
            </div>
        );
    }

    return (
        <>
            {/* Modal xem ảnh */}
            {imageModalOpen && (
                <div className="image-modal" role="dialog" aria-modal="true" aria-label="Xem ảnh sản phẩm" onClick={() => setImageModalOpen(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close" type="button" aria-label="Đóng ảnh" onClick={() => setImageModalOpen(false)}>
                            <FiX size={20} /> Đóng
                        </button>
                        <img src={selectedImage} alt="Product" className="modal-image" />
                    </div>
                </div>
            )}

            {/* Modal xác nhận đơn hàng */}
            {confirmModalOpen && (
                <div className="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="confirm-modal-title" onClick={() => setConfirmModalOpen(false)}>
                    <div className="confirm-modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2 className="confirm-header" id="confirm-modal-title">
                            <FiCheckCircle size={28} color="#22c55e" />
                            Xác nhận đơn hàng
                        </h2>
                        <div className="confirm-body">
                            <p style={{ marginBottom: '16px' }}>Vui lòng kiểm tra lại thông tin đơn hàng của bạn:</p>
                            <div className="confirm-summary-item">
                                <span>Sản phẩm:</span>
                                <strong>{selectedProducts.length} sản phẩm</strong>
                            </div>
                            <div className="confirm-summary-item">
                                <span>Tạm tính:</span>
                                <strong>{formatPrice(totalAmount)}</strong>
                            </div>
                            <div className="confirm-summary-item">
                                <span>Phí vận chuyển:</span>
                                <strong>{formatPrice(shippingFee)}</strong>
                            </div>
                            {appliedDiscount && (
                                <div className="confirm-summary-item" style={{ color: 'var(--success)' }}>
                                    <span>Giảm giá ({appliedDiscount.discount}%):</span>
                                    <strong>-{formatPrice(discountAmount)}</strong>
                                </div>
                            )}
                            <div className="confirm-summary-item" style={{ borderTop: '2px solid var(--accent-primary)', paddingTop: '16px' }}>
                                <span style={{ fontSize: '18px', fontWeight: '700' }}>Tổng thanh toán:</span>
                                <strong style={{ fontSize: '24px', color: 'var(--accent-primary)' }}>{formatPrice(finalAmount)}</strong>
                            </div>
                            <div className="confirm-summary-item" style={{ border: 'none' }}>
                                <span>Phương thức thanh toán:</span>
                                <strong>{paymentMethod === 'COD' ? '💵 Thanh toán khi nhận hàng' : '🏦 Chuyển khoản'}</strong>
                            </div>
                            <div className="confirm-summary-item" style={{ border: 'none' }}>
                                <span>Vận chuyển:</span>
                                <strong>{selectedShipping.name}</strong>
                            </div>
                            <div className="confirm-summary-item" style={{ border: 'none' }}>
                                <span>Giao dự kiến:</span>
                                <strong>{getDeliveryRangeText(selectedShipping.id)}</strong>
                            </div>
                        </div>
                        <div className="confirm-actions">
                            <button className="confirm-btn confirm-btn-secondary" type="button" onClick={() => setConfirmModalOpen(false)}>
                                Hủy
                            </button>
                            <button className="confirm-btn confirm-btn-primary" type="button" onClick={confirmAndPlaceOrder}>
                                Xác nhận đặt hàng
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="checkout-container">
                <div className="checkout-steps" aria-label="Tiến trình thanh toán">
                    <div className="checkout-step completed">1. Giỏ hàng</div>
                    <div className="checkout-step completed">2. Vận chuyển</div>
                    <div className="checkout-step active">3. Thanh toán</div>
                </div>
                <div className="checkout-wrapper">
                    {/* Left Side - Products List */}
                    <div className="checkout-left">
                        <div className="checkout-card">
                            <h2 className="section-header">
                                <span className="section-icon"><FiPackage /></span>
                                Sản phẩm đã chọn ({selectedProducts.length})
                            </h2>
                            <table className="product-table">
                                <thead>
                                    <tr>
                                        <th>Sản Phẩm</th>
                                        <th style={{ textAlign: 'center' }}>Đơn Giá</th>
                                        <th style={{ textAlign: 'center' }}>Số Lượng</th>
                                        <th style={{ textAlign: 'center' }}>Tổng</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedProducts.map((item) => (
                                        <tr key={item.cartId}>
                                            <td className="product-cell">
                                                <div className="product-info">
                                                    <div
                                                        className="product-image-wrapper"
                                                        onClick={() => {
                                                            setSelectedImage(item.img);
                                                            setImageModalOpen(true);
                                                        }}
                                                    >
                                                        <img
                                                            src={item.img}
                                                            alt={item.name}
                                                            className="product-image"
                                                        />
                                                        <div className="zoom-icon">
                                                            <FiZoomIn size={20} />
                                                        </div>
                                                    </div>
                                                    <div className="product-details">
                                                        <div className="product-name">{item.name}</div>
                                                        <span className="product-size">Size: {item.size}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="product-cell" style={{ textAlign: 'center' }}>
                                                <span className="product-price">{formatPrice(parsePrice(item.price))}</span>
                                            </td>
                                            <td className="product-cell" style={{ textAlign: 'center' }}>
                                                <span className="product-quantity">x{item.quantity}</span>
                                            </td>
                                            <td className="product-cell" style={{ textAlign: 'center' }}>
                                                <span className="product-total">{formatPrice(parsePrice(item.price) * item.quantity)}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Shipping Options */}
                        <div className="checkout-card">
                            <h3 className="section-header">
                                <span className="section-icon"><FiTruck /></span>
                                Phương thức vận chuyển
                            </h3>
                            <div className="shipping-info-box">
                                <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>
                                    💡 Chọn phương thức giao hàng phù hợp với bạn
                                </p>
                            </div>
                            <div className="shipping-options">
                                {shippingOptions.map((option) => (
                                    <label
                                        key={option.id}
                                        className={`shipping-option ${shippingMethod === option.id ? 'selected' : ''}`}
                                    >
                                        <input
                                            type="radio"
                                            name="shipping"
                                            value={option.id}
                                            checked={shippingMethod === option.id}
                                            onChange={(e) => setShippingMethod(e.target.value)}
                                        />
                                        <div className="shipping-details">
                                            <div className="shipping-name">{option.name}</div>
                                            <div className="shipping-time">⏱️ {option.time} • Dự kiến {getDeliveryRangeText(option.id)}</div>
                                        </div>
                                        <div className="shipping-price">{formatPrice(option.price)}</div>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Side - Summary & Payment */}
                    <div className="checkout-right">
                        <div className="checkout-card">
                            <h3 className="section-header">
                                <span className="section-icon">💰</span>
                                Thanh toán
                            </h3>

                            <div className="summary-row">
                                <span className="summary-label">Tạm tính:</span>
                                <span className="summary-value">{formatPrice(totalAmount)}</span>
                            </div>

                            <div className="summary-row">
                                <span className="summary-label">Phí vận chuyển:</span>
                                <span className="summary-value">{formatPrice(shippingFee)}</span>
                            </div>

                            <div className="summary-row">
                                <span className="summary-label">Giao dự kiến:</span>
                                <span className="summary-value">{getDeliveryRangeText(selectedShipping.id)}</span>
                            </div>

                            {/* Discount Section */}
                            <div className="discount-section">
                                <div className="discount-header">
                                    <h4 className="discount-title">
                                        🎟️ Mã giảm giá
                                    </h4>
                                    {myCoupons.length > 0 && !appliedDiscount && (
                                        <button
                                            type="button"
                                            onClick={() => setShowCouponList(!showCouponList)}
                                            className="view-coupons-btn"
                                        >
                                            {showCouponList ? 'Ẩn' : `${myCoupons.filter(c => !usedCoupons.includes(c)).length} mã`}
                                        </button>
                                    )}
                                </div>

                                {/* Coupon List */}
                                {showCouponList && myCoupons.length > 0 && (
                                    (() => {
                                        const availableCoupons = myCoupons.filter(coupon => !usedCoupons.includes(coupon));

                                        if (availableCoupons.length === 0) {
                                            return (
                                                <div className="coupon-list" style={{ textAlign: 'center', color: 'var(--text-tertiary)' }}>
                                                    😔 Bạn đã sử dụng hết mã giảm giá
                                                </div>
                                            );
                                        }

                                        return (
                                            <div className="coupon-list">
                                                {availableCoupons.map((coupon, index) => (
                                                    <div
                                                        key={index}
                                                        onClick={() => selectCoupon(coupon)}
                                                        className="coupon-item"
                                                    >
                                                        <div className="coupon-info">
                                                            <div className="coupon-code">{coupon}</div>
                                                            <div className="coupon-desc">
                                                                {coupon.startsWith('NEWS10') ? 'Mã từ đăng ký nhận tin' : 'Mã giảm giá'}
                                                            </div>
                                                        </div>
                                                        <button className="coupon-select-btn">Chọn</button>
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    })()
                                )}

                                <div className="discount-input-wrapper">
                                    <input
                                        type="text"
                                        placeholder="Nhập mã giảm giá"
                                        value={discountCode}
                                        onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                                        disabled={appliedDiscount !== null}
                                        className="discount-input"
                                    />
                                    {appliedDiscount ? (
                                        <button
                                            type="button"
                                            onClick={removeDiscount}
                                            className="remove-btn"
                                        >
                                            Xóa
                                        </button>
                                    ) : (
                                        <button
                                            id="apply-coupon-btn"
                                            type="button"
                                            onClick={applyDiscountCode}
                                            className="apply-btn"
                                        >
                                            Áp dụng
                                        </button>
                                    )}
                                </div>

                                {discountError && (
                                    <p className="discount-error">{discountError}</p>
                                )}

                                {appliedDiscount && (
                                    <div className="discount-success">
                                        <p className="discount-success-text">
                                            <FiCheckCircle size={16} />
                                            Đã áp dụng mã <strong>{appliedDiscount.code}</strong> - Giảm {appliedDiscount.discount}%
                                        </p>
                                    </div>
                                )}
                            </div>

                            {appliedDiscount && (
                                <div className="summary-row">
                                    <span className="summary-label summary-discount">Giảm giá ({appliedDiscount.discount}%):</span>
                                    <span className="summary-value summary-discount">-{formatPrice(discountAmount)}</span>
                                </div>
                            )}

                            <div className="summary-row summary-total">
                                <div className="summary-label">
                                    Tổng thanh toán
                                    <span className="item-count">({selectedProducts.length} sản phẩm)</span>
                                </div>
                                <span className="summary-value">{formatPrice(finalAmount)}</span>
                            </div>

                            {/* Shipping Info */}
                            <div className="shipping-section">
                                <h3 className="section-header" style={{ fontSize: '16px', marginBottom: '16px' }}>
                                    <span className="section-icon">📦</span>
                                    Thông tin nhận hàng
                                </h3>

                                <form onSubmit={handlePayment}>
                                    <div className="form-group">
                                        <label className="form-label">Họ và tên *</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={fullName}
                                            readOnly
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Số điện thoại *</label>
                                        <input
                                            type="tel"
                                            className="form-input"
                                            value={phone}
                                            readOnly
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Địa chỉ *</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={address}
                                            readOnly
                                        />
                                        <p className="form-hint">
                                            💡 Để thay đổi địa chỉ, vui lòng cập nhật trong <a href="/profile">Hồ sơ của bạn</a>
                                        </p>
                                    </div>

                                    <div className="form-row">
                                        <div className="form-group">
                                            <label className="form-label">Phường/Xã *</label>
                                            <input type="text" className="form-input" value={ward} readOnly />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Quận/Huyện *</label>
                                            <input type="text" className="form-input" value={district} readOnly />
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Tỉnh/Thành phố *</label>
                                        <input type="text" className="form-input" value={city} readOnly />
                                    </div>

                                    {/* Payment Methods */}
                                    <div className="form-group">
                                        <label className="form-label">Phương thức thanh toán</label>
                                        <div className="payment-methods">
                                            <label className={`payment-option ${paymentMethod === 'COD' ? 'selected' : ''}`}>
                                                <input
                                                    type="radio"
                                                    name="payment"
                                                    value="COD"
                                                    checked={paymentMethod === 'COD'}
                                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                                />
                                                <span className="payment-label">💵 Thanh toán khi nhận hàng (COD)</span>
                                            </label>
                                            <label className={`payment-option ${paymentMethod === 'Banking' ? 'selected' : ''}`}>
                                                <input
                                                    type="radio"
                                                    name="payment"
                                                    value="Banking"
                                                    checked={paymentMethod === 'Banking'}
                                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                                />
                                                <span className="payment-label">🏦 Chuyển khoản ngân hàng</span>
                                            </label>
                                        </div>
                                    </div>

                                    {/* Security Notice */}
                                    <div className="security-notice">
                                        <div className="security-icon"><FiShield /></div>
                                        <p className="security-text">
                                            <strong>Bảo mật thông tin:</strong> Thông tin của bạn được mã hóa và bảo mật tuyệt đối.
                                            Chúng tôi cam kết không chia sẻ dữ liệu cá nhân với bên thứ ba.
                                        </p>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="checkout-btn"
                                    >
                                        <span className="checkout-btn-content">
                                            {isSubmitting ? (
                                                <>
                                                    <span className="loading-spinner"></span>
                                                    Đang xử lý...
                                                </>
                                            ) : (
                                                <>
                                                    🎉 Đặt hàng ngay ({selectedProducts.length} sản phẩm)
                                                </>
                                            )}
                                        </span>
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default CheckoutPage;
