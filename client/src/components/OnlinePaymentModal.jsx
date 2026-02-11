import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:3000';

function OnlinePaymentModal({ isOpen, onClose, orderId, amount, onPaymentSuccess }) {
    const [selectedMethod, setSelectedMethod] = useState('');
    const [paymentStatus, setPaymentStatus] = useState('idle'); // idle, processing, success, failed
    const [qrCode, setQrCode] = useState('');
    const [countdown, setCountdown] = useState(0);

    const paymentMethods = [
        { id: 'momo', name: 'MoMo', icon: '💜', color: '#a50064', desc: 'Ví điện tử MoMo' },
        { id: 'zalopay', name: 'ZaloPay', icon: '💙', color: '#0068ff', desc: 'Ví ZaloPay' },
        { id: 'vnpay', name: 'VNPAY', icon: '🔵', color: '#003399', desc: 'VNPAY QR' },
        { id: 'bank', name: 'Ngân hàng', icon: '🏦', color: '#2c3e50', desc: 'Chuyển khoản ngân hàng' },
        { id: 'visa', name: 'Visa/MC', icon: '💳', color: '#1a1f71', desc: 'Thẻ quốc tế Visa, MasterCard' },
    ];

    useEffect(() => {
        if (paymentStatus === 'processing' && countdown > 0) {
            const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
            return () => clearTimeout(timer);
        }
        if (paymentStatus === 'processing' && countdown === 0) {
            // Mô phỏng xác nhận thanh toán thành công
            setPaymentStatus('success');
            if (onPaymentSuccess) {
                setTimeout(() => onPaymentSuccess(selectedMethod), 1500);
            }
        }
    }, [paymentStatus, countdown]);

    const handlePay = async () => {
        if (!selectedMethod) return;
        setPaymentStatus('processing');
        setCountdown(5);

        try {
            const res = await axios.post(`${API_URL}/api/payment/create`, {
                orderId,
                amount,
                method: selectedMethod,
            });
            if (res.data.qrCode) {
                setQrCode(res.data.qrCode);
            }
        } catch (err) {
            console.error('Lỗi tạo thanh toán:', err);
            // Vẫn mô phỏng thành công
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', zIndex: 10000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'fadeIn 0.2s ease',
        }}>
            <div style={{
                background: 'white', borderRadius: '16px', width: '480px',
                maxWidth: '90vw', maxHeight: '85vh', overflow: 'auto',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                animation: 'slideUp 0.3s ease',
            }}>
                {/* Header */}
                <div style={{
                    padding: '20px 24px',
                    borderBottom: '1px solid #f0f0f0',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>
                        💳 Thanh toán trực tuyến
                    </h3>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none', border: 'none', fontSize: '24px',
                            cursor: 'pointer', color: '#999',
                        }}
                    >✕</button>
                </div>

                <div style={{ padding: '24px' }}>
                    {paymentStatus === 'idle' && (
                        <>
                            {/* Amount */}
                            <div style={{
                                textAlign: 'center', padding: '16px',
                                background: '#fef9f5', borderRadius: '12px', marginBottom: '20px',
                            }}>
                                <div style={{ fontSize: '13px', color: '#666' }}>Số tiền thanh toán</div>
                                <div style={{ fontSize: '28px', fontWeight: 700, color: '#ee4d2d' }}>
                                    {formatPrice(amount)}
                                </div>
                            </div>

                            {/* Payment Methods */}
                            <div style={{ marginBottom: '20px' }}>
                                <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: '#333' }}>
                                    Chọn phương thức thanh toán:
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {paymentMethods.map(method => (
                                        <div
                                            key={method.id}
                                            onClick={() => setSelectedMethod(method.id)}
                                            style={{
                                                padding: '14px 16px',
                                                border: selectedMethod === method.id ? `2px solid ${method.color}` : '2px solid #eee',
                                                borderRadius: '10px',
                                                cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', gap: '12px',
                                                transition: 'all 0.2s',
                                                background: selectedMethod === method.id ? `${method.color}08` : 'white',
                                            }}
                                        >
                                            <span style={{ fontSize: '28px' }}>{method.icon}</span>
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: '15px', color: '#333' }}>
                                                    {method.name}
                                                </div>
                                                <div style={{ fontSize: '12px', color: '#999' }}>
                                                    {method.desc}
                                                </div>
                                            </div>
                                            {selectedMethod === method.id && (
                                                <span style={{
                                                    marginLeft: 'auto', color: method.color,
                                                    fontSize: '20px', fontWeight: 700,
                                                }}>✓</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Pay Button */}
                            <button
                                onClick={handlePay}
                                disabled={!selectedMethod}
                                style={{
                                    width: '100%', padding: '14px',
                                    background: selectedMethod ? 'linear-gradient(135deg, #ee4d2d, #ff6b35)' : '#ddd',
                                    color: 'white', border: 'none', borderRadius: '10px',
                                    fontSize: '16px', fontWeight: 700, cursor: selectedMethod ? 'pointer' : 'default',
                                    transition: 'all 0.2s',
                                }}
                            >
                                {selectedMethod ? `Thanh toán ${formatPrice(amount)}` : 'Chọn phương thức thanh toán'}
                            </button>
                        </>
                    )}

                    {paymentStatus === 'processing' && (
                        <div style={{ textAlign: 'center', padding: '30px 0' }}>
                            <div style={{
                                width: '80px', height: '80px', borderRadius: '50%',
                                border: '4px solid #f0f0f0', borderTopColor: '#ee4d2d',
                                animation: 'spin 1s linear infinite',
                                margin: '0 auto 20px',
                            }} />
                            <div style={{ fontSize: '18px', fontWeight: 700, color: '#333', marginBottom: '8px' }}>
                                Đang xử lý thanh toán...
                            </div>
                            <div style={{ fontSize: '14px', color: '#666' }}>
                                Vui lòng không đóng cửa sổ này
                            </div>
                            <div style={{
                                fontSize: '32px', fontWeight: 700, color: '#ee4d2d',
                                marginTop: '16px',
                            }}>
                                {countdown}s
                            </div>
                            {qrCode && (
                                <div style={{ marginTop: '16px' }}>
                                    <img src={qrCode} alt="QR Code" style={{ width: '160px', height: '160px', borderRadius: '8px' }} />
                                    <div style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>Quét QR để thanh toán</div>
                                </div>
                            )}
                        </div>
                    )}

                    {paymentStatus === 'success' && (
                        <div style={{ textAlign: 'center', padding: '30px 0' }}>
                            <div style={{
                                width: '80px', height: '80px', borderRadius: '50%',
                                background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto 20px', fontSize: '40px', color: 'white',
                                animation: 'scaleIn 0.5s ease',
                            }}>✓</div>
                            <div style={{ fontSize: '20px', fontWeight: 700, color: '#22c55e', marginBottom: '8px' }}>
                                Thanh toán thành công!
                            </div>
                            <div style={{ fontSize: '14px', color: '#666' }}>
                                Đơn hàng đang được xử lý
                            </div>
                        </div>
                    )}

                    {paymentStatus === 'failed' && (
                        <div style={{ textAlign: 'center', padding: '30px 0' }}>
                            <div style={{
                                width: '80px', height: '80px', borderRadius: '50%',
                                background: '#ef4444', display: 'flex', alignItems: 'center',
                                justifyContent: 'center', margin: '0 auto 20px',
                                fontSize: '40px', color: 'white',
                            }}>✕</div>
                            <div style={{ fontSize: '20px', fontWeight: 700, color: '#ef4444', marginBottom: '8px' }}>
                                Thanh toán thất bại
                            </div>
                            <div style={{ fontSize: '14px', color: '#666', marginBottom: '16px' }}>
                                Vui lòng thử lại hoặc chọn phương thức khác
                            </div>
                            <button
                                onClick={() => { setPaymentStatus('idle'); setSelectedMethod(''); }}
                                style={{
                                    padding: '10px 24px', background: '#ee4d2d', color: 'white',
                                    border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer',
                                }}
                            >Thử lại</button>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes scaleIn { from { transform: scale(0); } to { transform: scale(1); } }
            `}</style>
        </div>
    );
}

export default OnlinePaymentModal;
