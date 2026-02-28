import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { FiX, FiZoomIn, FiPackage, FiTruck, FiShield, FiCheckCircle } from 'react-icons/fi';
import axios from 'axios';
import OnlinePaymentModal from '../components/OnlinePaymentModal';
import AddressPicker from '../components/AddressPicker';
import VoucherSelector from '../components/VoucherSelector';
import { calculateDiscount } from '../data/voucherData';
import OrderSummary from './checkout/OrderSummary';
import PaymentMethod from './checkout/PaymentMethod';
import TrustSignals from './checkout/TrustSignals';
import OutfitPreview from './checkout/OutfitPreview';
import ShippingForm from './checkout/ShippingForm';
import './CheckoutPage.css';

function CheckoutPage({ onCheckoutSuccess, showToast, suggestionProducts, onAddToCart }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, isAuthenticated, loading } = useAuth();
    const { t } = useLanguage();
    const hasRedirected = useRef(false);
    const hasLoadedProducts = useRef(false);
    const hasLoadedCouponsRef = useRef(false);
    const hasLoggedUsedCouponsErrorRef = useRef(false);

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
        { id: 'standard', nameKey: 'standard_shipping', timeKey: 'standard_time', price: 30000 },
        { id: 'express', nameKey: 'express_shipping', timeKey: 'express_time', price: 50000 },
        { id: 'super', nameKey: 'super_shipping', timeKey: 'super_time', price: 100000 }
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
            return;
        }

        const redirectToChooseProduct = (messageKey, type) => {
            if (hasRedirected.current) return;
            if (location.pathname !== '/checkout/cart') return;

            hasRedirected.current = true;
            showToast(messageKey, type);
            navigate('/checkout/choseproduct', { replace: true });
        };

        // Ưu tiên lấy từ location.state trước
        const stateProducts = location.state?.selectedProducts;
        if (stateProducts && stateProducts.length > 0) {
            setSelectedProducts(stateProducts);
            hasLoadedProducts.current = true;
            // Lưu vào localStorage để backup
            localStorage.setItem('selectedProductsForCheckout', JSON.stringify(stateProducts));
            return;
        }

        // Fallback: Lấy từ localStorage
        const saved = localStorage.getItem('selectedProductsForCheckout');

        if (saved) {
            try {
                const products = JSON.parse(saved);
                if (products && products.length > 0) {
                    setSelectedProducts(products);
                    hasLoadedProducts.current = true;
                } else {
                    redirectToChooseProduct(t('no_product_found'), 'error');
                }
            } catch (e) {
                redirectToChooseProduct(t('no_product_found'), 'error');
            }
        } else {
            redirectToChooseProduct(t('please_select_products'), 'warning');
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
    const [showOnlinePayment, setShowOnlinePayment] = useState(false);
    const [selectedVoucher, setSelectedVoucher] = useState(null);

    // State cho mã giảm giá
    const [discountCode, setDiscountCode] = useState('');
    const [appliedDiscount, setAppliedDiscount] = useState(null);
    const [discountError, setDiscountError] = useState('');
    const [isApplyingDiscount, setIsApplyingDiscount] = useState(false);
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
            showToast(t('please_login_checkout'), "warning");
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
        if (!isAuthenticated || hasLoadedCouponsRef.current) return;
        hasLoadedCouponsRef.current = true;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        // Load danh sách mã đã sử dụng từ server
        const fetchUsedCoupons = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;

                const response = await fetch('http://localhost:3000/api/used-coupons', {
                    signal: controller.signal,
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    setUsedCoupons(data.coupons || []);
                    hasLoggedUsedCouponsErrorRef.current = false;
                }
            } catch (err) {
                if (err?.name === 'AbortError') return;
                if (!hasLoggedUsedCouponsErrorRef.current) {
                    console.warn('Không thể tải danh sách mã đã dùng lúc này.');
                    hasLoggedUsedCouponsErrorRef.current = true;
                }
            }
        };

        fetchUsedCoupons();

        // Load mã giảm giá từ localStorage (chỉ mã từ vòng quay và newsletter)
        const loadCoupons = () => {
            try {
                const rawCoupons = JSON.parse(localStorage.getItem('myCoupons') || '[]');
                const savedCoupons = [...new Set((Array.isArray(rawCoupons) ? rawCoupons : [])
                    .map(code => String(code || '').trim().toUpperCase())
                    .filter(Boolean))];
                setMyCoupons(prev => {
                    const prevSerialized = JSON.stringify(prev || []);
                    const nextSerialized = JSON.stringify(savedCoupons || []);
                    return prevSerialized === nextSerialized ? prev : savedCoupons;
                });
            } catch {
                setMyCoupons(prev => (Array.isArray(prev) && prev.length === 0 ? prev : []));
            }
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
            loadCoupons();
        };

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('couponUpdated', handleCouponUpdate);

        return () => {
            clearTimeout(timeoutId);
            controller.abort();
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

    // Tính voucher discount
    const voucherDiscount = selectedVoucher ? calculateDiscount(selectedVoucher, totalAmount) : 0;

    // Tính tổng final = subtotal + shipping - coupon discount - voucher discount
    const finalAmount = totalAmount + shippingFee - discountAmount - voucherDiscount;

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
            return t('today_text');
        }

        return `${formatDate(start)} - ${formatDate(end)}`;
    };

    // Hàm áp dụng mã giảm giá
    const applyDiscountCode = async (inputCode = null) => {
        if (isApplyingDiscount) return;

        const normalizedCode = String(inputCode ?? discountCode).trim().toUpperCase();
        if (!normalizedCode) {
            setDiscountError(t('enter_discount_error'));
            return;
        }

        setIsApplyingDiscount(true);

        try {

            // Kiểm tra mã cố định trước
            const coupon = validCoupons.find(c => c.code.toUpperCase() === normalizedCode);

            if (coupon) {
                // Mã cố định
                if (totalAmount < coupon.minOrder) {
                    setDiscountError(`${t('subtotal')} ${formatPrice(coupon.minOrder)}`);
                    setAppliedDiscount(null);
                    return;
                }

                // Kiểm tra mã đã sử dụng chưa (gọi API - BẮT BUỘC)
                try {
                    const token = localStorage.getItem('token');
                    if (!token) {
                        setDiscountError(t('please_login_coupon'));
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
                        setDiscountError(t('cannot_check_coupon'));
                        setAppliedDiscount(null);
                        return;
                    }

                    const checkData = await checkResponse.json();
                    if (checkData.used) {
                        setDiscountError(t('coupon_already_used'));
                        setAppliedDiscount(null);
                        return;
                    }
                } catch (err) {
                    console.error('Lỗi kiểm tra mã:', err);
                    setDiscountError(t('coupon_check_error'));
                    setAppliedDiscount(null);
                    return; // Chặn không cho áp dụng nếu API lỗi
                }

                setAppliedDiscount(coupon);
                setDiscountError('');
                showToast(`${t('apply')} -${coupon.discount}% ${t('success')} 🎉`, 'success');
                return;
            }

            // Kiểm tra mã từ newsletter
            if (normalizedCode.startsWith('NEWS10')) {
                try {
                    // Kiểm tra mã đã dùng chưa trong UsedCouponModel
                    const token = localStorage.getItem('token');
                    if (!token) {
                        setDiscountError(t('please_login_coupon'));
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
                            setDiscountError(t('coupon_already_used'));
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
                        showToast(`${t('apply')} -${data.discount}% ${t('success')} 🎉`, 'success');
                    } else {
                        setDiscountError(data.message || t('coupon_invalid'));
                        setAppliedDiscount(null);
                    }
                } catch (err) {
                    console.error('Lỗi kiểm tra mã newsletter:', err);
                    setDiscountError(t('cannot_check_coupon'));
                    setAppliedDiscount(null);
                }
            } else {
                setDiscountError(t('coupon_invalid'));
                setAppliedDiscount(null);
            }
        } finally {
            setIsApplyingDiscount(false);
        }
    };

    // Hàm xóa mã giảm giá
    const removeDiscount = () => {
        setAppliedDiscount(null);
        setDiscountCode('');
        setDiscountError('');
    };

    // Hàm chọn mã từ danh sách
    const selectCoupon = async (code) => {
        setDiscountCode(code);
        setShowCouponList(false);
        setDiscountError('');
        await applyDiscountCode(code);
    };

    const consumeCouponAfterSuccess = (couponCode) => {
        const normalized = String(couponCode || '').trim().toUpperCase();
        if (!normalized) return;

        setUsedCoupons(prev => {
            if (prev.includes(normalized)) return prev;
            return [...prev, normalized];
        });

        setMyCoupons(prev => {
            const nextCoupons = (Array.isArray(prev) ? prev : []).filter(
                code => String(code || '').trim().toUpperCase() !== normalized
            );
            localStorage.setItem('myCoupons', JSON.stringify(nextCoupons));
            return nextCoupons;
        });
    };

    // Hàm xử lý khi user chọn address từ AddressPicker
    const handleAddressChange = (addressData) => {
        setCity(addressData.city);
        setDistrict(addressData.district);
        setWard(addressData.ward);
        setAddress(addressData.address);
    };

    const handlePayment = async (e) => {
        e.preventDefault();

        if (selectedProducts.length === 0) {
            showToast(t('no_products_warning'), "warning");
            return;
        }

        // Kiểm tra form fields có được điền đủ không
        if (!fullName || !phone || !address || !city || !district || !ward) {
            showToast(t('update_full_info'), "warning");
            return;
        }

        // Mở modal xác nhận thay vì đặt hàng ngay
        setConfirmModalOpen(true);
    };

    // Hàm xác nhận và thực sự đặt hàng
    const confirmAndPlaceOrder = async () => {
        setConfirmModalOpen(false);

        // Nếu chọn thanh toán online, mở modal thanh toán
        if (paymentMethod === 'Online') {
            setShowOnlinePayment(true);
            return;
        }

        await placeOrderToServer();
    };

    // Xử lý khi thanh toán online thành công
    const handleOnlinePaymentSuccess = async (paymentData) => {
        setShowOnlinePayment(false);
        await placeOrderToServer(paymentData);
    };

    // Gửi đơn hàng lên server
    const placeOrderToServer = async (paymentData = null) => {
        setIsSubmitting(true);

        try {
            // Lấy token từ localStorage
            const token = localStorage.getItem('token');
            console.log('🔑 Token:', token ? 'Có token' : 'Không có token');

            if (!token) {
                showToast(t('please_login_again'), "error");
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
                shippingMethod: t(selectedShipping.nameKey),
                discountCode: appliedDiscount?.code || null,
                discountAmount: discountAmount,
                voucherCode: selectedVoucher?.code || null,
                voucherDiscount: voucherDiscount,
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

            if (appliedDiscount?.code) {
                consumeCouponAfterSuccess(appliedDiscount.code);
            }

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
                <div style={{ fontSize: '32px', marginBottom: '16px' }}>⏳</div>
                <p style={{ color: '#666' }}>{t('loading')}</p>
            </div>
        );
    }

    if (selectedProducts.length === 0 && !loading) {
        return (
            <div className="empty-state container">
                <div className="empty-icon">🛒</div>
                <h2 className="empty-title">{t('no_products_selected')}</h2>
                <p className="empty-description">{t('select_products_hint')}</p>
                <Link to="/checkout/choseproduct" className="empty-btn">
                    🛍️ {t('select_products_btn')}
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
                            <FiX size={20} /> {t('close')}
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
                            {t('confirm_order_title')}
                        </h2>
                        <div className="confirm-body">
                            <p style={{ marginBottom: '12px' }}>{t('confirm_check_info')}</p>
                            <div className="confirm-summary-item">
                                <span>{t('product_col')}:</span>
                                <strong>{selectedProducts.length} {t('products_unit')}</strong>
                            </div>
                            <div className="confirm-summary-item">
                                <span>{t('subtotal')}</span>
                                <strong>{formatPrice(totalAmount)}</strong>
                            </div>
                            <div className="confirm-summary-item">
                                <span>{t('shipping_fee_label')}</span>
                                <strong>{formatPrice(shippingFee)}</strong>
                            </div>
                            {appliedDiscount && (
                                <div className="confirm-summary-item" style={{ color: 'var(--success)' }}>
                                    <span>{t('discount_code')} ({appliedDiscount.discount}%):</span>
                                    <strong>-{formatPrice(discountAmount)}</strong>
                                </div>
                            )}
                            <div className="confirm-summary-item" style={{ borderTop: '2px solid var(--accent-primary)', paddingTop: '12px' }}>
                                <span style={{ fontSize: '16px', fontWeight: '700' }}>{t('total_payment')}:</span>
                                <strong style={{ fontSize: '20px', color: 'var(--accent-primary)' }}>{formatPrice(finalAmount)}</strong>
                            </div>
                            <div className="confirm-summary-item" style={{ border: 'none' }}>
                                <span>{t('payment_method')}:</span>
                                <strong>{paymentMethod === 'COD' ? `💵 ${t('cod_full')}` : paymentMethod === 'Online' ? `💳 ${t('online_full')}` : `🏦 ${t('banking_full')}`}</strong>
                            </div>
                            <div className="confirm-summary-item" style={{ border: 'none' }}>
                                <span>{t('shipping_method_label')}:</span>
                                <strong>{t(selectedShipping.nameKey)}</strong>
                            </div>
                            <div className="confirm-summary-item" style={{ border: 'none' }}>
                                <span>{t('expected_delivery')}</span>
                                <strong>{getDeliveryRangeText(selectedShipping.id)}</strong>
                            </div>
                        </div>
                        <div className="confirm-actions">
                            <button className="confirm-btn confirm-btn-secondary" type="button" onClick={() => setConfirmModalOpen(false)}>
                                {t('cancel')}
                            </button>
                            <button className="confirm-btn confirm-btn-primary" type="button" onClick={confirmAndPlaceOrder}>
                                {t('confirm_order_btn')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="checkout-container">
                <div className="checkout-steps" aria-label={t('payment_step')}>
                    <div className="checkout-step completed">{t('cart_step')}</div>
                    <div className="checkout-step completed">{t('shipping_step')}</div>
                    <div className="checkout-step active">{t('payment_step')}</div>
                </div>
                <div className="checkout-wrapper">
                    {/* Left Side - Products List */}
                    <div className="checkout-left">
                        <div className="checkout-card">
                            <h2 className="section-header">
                                <span className="section-icon"><FiPackage /></span>
                                {t('selected_products')} ({selectedProducts.length})
                            </h2>
                            <table className="product-table">
                                <thead>
                                    <tr>
                                        <th>{t('product_col')}</th>
                                        <th style={{ textAlign: 'center' }}>{t('unit_price')}</th>
                                        <th style={{ textAlign: 'center' }}>{t('quantity_col')}</th>
                                        <th style={{ textAlign: 'center' }}>{t('total_col')}</th>
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
                                {t('shipping_method_label')}
                            </h3>
                            <div className="shipping-info-box">
                                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
                                    💡 {t('shipping_hint')}
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
                                            <div className="shipping-name">{t(option.nameKey)}</div>
                                            <div className="shipping-time">⏱️ {t(option.timeKey)} • {t('expected_label')} {getDeliveryRangeText(option.id)}</div>
                                        </div>
                                        <div className="shipping-price">{formatPrice(option.price)}</div>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Side - Summary & Payment */}
                    <div className="checkout-right">
                        <form onSubmit={handlePayment}>
                            {/* Card 1: Order Summary */}
                            <div className="checkout-card right-card">
                                <OrderSummary
                                    selectedProducts={selectedProducts}
                                    totalAmount={totalAmount}
                                    shippingFee={shippingFee}
                                    discountAmount={discountAmount}
                                    voucherDiscount={voucherDiscount}
                                    finalAmount={finalAmount}
                                    appliedDiscount={appliedDiscount}
                                    selectedVoucher={selectedVoucher}
                                    formatPrice={formatPrice}
                                    parsePrice={parsePrice}
                                    t={t}
                                />
                            </div>

                            {/* Card 2: Discount & Voucher */}
                            <div className="checkout-card right-card">
                                <div className="discount-section">
                                    <div className="discount-header">
                                        <h4 className="discount-title">
                                            🎟️ {t('discount_code_label')}
                                        </h4>
                                        {myCoupons.length > 0 && !appliedDiscount && (
                                            <button
                                                type="button"
                                                onClick={() => setShowCouponList(!showCouponList)}
                                                className="view-coupons-btn"
                                            >
                                                {showCouponList ? t('hide_btn') : `${myCoupons.filter(c => !usedCoupons.includes(c)).length} ${t('codes_count')}`}
                                            </button>
                                        )}
                                    </div>

                                    {showCouponList && myCoupons.length > 0 && (
                                        (() => {
                                            const availableCoupons = myCoupons.filter(coupon => !usedCoupons.includes(coupon));
                                            if (availableCoupons.length === 0) {
                                                return (
                                                    <div className="coupon-list" style={{ textAlign: 'center', color: 'var(--text-tertiary)' }}>
                                                        😔 {t('used_all_coupons')}
                                                    </div>
                                                );
                                            }
                                            return (
                                                <div className="coupon-list">
                                                    {availableCoupons.map((coupon, index) => (
                                                        <div key={index} onClick={() => selectCoupon(coupon)} className="coupon-item">
                                                            <div className="coupon-info">
                                                                <div className="coupon-code">{coupon}</div>
                                                                <div className="coupon-desc">
                                                                    {coupon.startsWith('NEWS10') ? t('coupon_from_newsletter') : t('discount_code_text')}
                                                                </div>
                                                            </div>
                                                            <button className="coupon-select-btn">{t('select_btn')}</button>
                                                        </div>
                                                    ))}
                                                </div>
                                            );
                                        })()
                                    )}

                                    <div className="discount-input-wrapper">
                                        <input
                                            type="text"
                                            placeholder={t('enter_discount')}
                                            value={discountCode}
                                            onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                                            disabled={appliedDiscount !== null}
                                            className="discount-input"
                                        />
                                        {appliedDiscount ? (
                                            <button type="button" onClick={removeDiscount} className="remove-btn">
                                                {t('delete')}
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => applyDiscountCode()}
                                                className="apply-btn"
                                                disabled={isApplyingDiscount}
                                            >
                                                {isApplyingDiscount ? `${t('loading')}...` : t('apply')}
                                            </button>
                                        )}
                                    </div>

                                    {discountError && <p className="discount-error">{discountError}</p>}

                                    {appliedDiscount && (
                                        <div className="discount-success">
                                            <p className="discount-success-text">
                                                <FiCheckCircle size={16} />
                                                Đã áp dụng mã <strong>{appliedDiscount.code}</strong> - Giảm {appliedDiscount.discount}%
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="right-card__divider" />

                                <VoucherSelector
                                    totalAmount={totalAmount}
                                    onVoucherSelect={setSelectedVoucher}
                                    selectedVoucher={selectedVoucher}
                                />
                            </div>

                            {/* Card 3: Shipping & Payment */}
                            <div className="checkout-card right-card">
                                <ShippingForm
                                    fullName={fullName} setFullName={setFullName}
                                    phone={phone} setPhone={setPhone}
                                    address={address} setAddress={setAddress}
                                    city={city} setCity={setCity}
                                    district={district} setDistrict={setDistrict}
                                    ward={ward} setWard={setWard}
                                    onAddressChange={handleAddressChange}
                                    hasSavedAddress={!!(user?.fullName && user?.phone && (user?.address || user?.city))}
                                    t={t}
                                />

                                <div className="right-card__divider" />

                                <PaymentMethod
                                    paymentMethod={paymentMethod}
                                    setPaymentMethod={setPaymentMethod}
                                    t={t}
                                />
                            </div>

                            {/* Security + Outfit Preview */}
                            <div className="security-notice">
                                <div className="security-icon"><FiShield /></div>
                                <p className="security-text">
                                    <strong>{t('security_title')}</strong> {t('security_desc')}
                                </p>
                            </div>

                            <OutfitPreview
                                outfitSnapshot={location.state?.outfitSnapshot || null}
                                outfitItems={location.state?.outfitItems || []}
                            />

                            {/* Order Button */}
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="checkout-btn"
                            >
                                <span className="checkout-btn-content">
                                    {isSubmitting ? (
                                        <>
                                            <span className="loading-spinner"></span>
                                            {t('processing_order')}
                                        </>
                                    ) : (
                                        <>
                                            🎉 {t('place_order_now')} • {formatPrice(finalAmount)}
                                        </>
                                    )}
                                </span>
                            </button>

                            <TrustSignals />
                        </form>
                    </div>
                </div>
            </div>

            {/* Modal Thanh toán Online */}
            {showOnlinePayment && (
                <OnlinePaymentModal
                    amount={finalAmount}
                    onSuccess={handleOnlinePaymentSuccess}
                    onClose={() => setShowOnlinePayment(false)}
                />
            )}
        </>
    );
}

export default CheckoutPage;
