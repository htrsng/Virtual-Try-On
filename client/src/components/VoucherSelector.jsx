import React, { useEffect, useState } from 'react';
import { getCustomerVouchers, calculateDiscount, isVoucherValid } from '../data/voucherData';
import '../styles/voucher-selector.css';

function VoucherSelector({ totalAmount, onVoucherSelect, selectedVoucher }) {
    const [showVouchers, setShowVouchers] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [availableVouchers, setAvailableVouchers] = useState(() => getCustomerVouchers());

    useEffect(() => {
        const reloadVouchers = () => {
            setAvailableVouchers(getCustomerVouchers());
        };

        reloadVouchers();

        window.addEventListener('storage', reloadVouchers);
        window.addEventListener('managedVouchersUpdated', reloadVouchers);

        return () => {
            window.removeEventListener('storage', reloadVouchers);
            window.removeEventListener('managedVouchersUpdated', reloadVouchers);
        };
    }, []);

    // Lọc vouchers hợp lệ
    const validVouchers = availableVouchers.filter(v => {
        const isValid = isVoucherValid(v);
        const meetsMinimum = totalAmount >= v.minAmount;
        const matchesSearch = v.code.toUpperCase().includes(searchTerm.toUpperCase()) ||
            v.name.toLowerCase().includes(searchTerm.toLowerCase());
        return isValid && meetsMinimum && matchesSearch;
    });

    const handleSelectVoucher = (voucher) => {
        if (selectedVoucher?.id === voucher.id) {
            // Bỏ chọn nếu nhấp lại
            onVoucherSelect(null);
        } else {
            // Chọn voucher mới
            onVoucherSelect(voucher);
        }
        setShowVouchers(false);
        setSearchTerm('');
    };

    const selectedDiscount = selectedVoucher ? calculateDiscount(selectedVoucher, totalAmount) : 0;

    return (
        <div className="voucher-selector-container">
            {/* Selected Voucher Display */}
            <div className="voucher-display">
                <div className="voucher-display-header">
                    <span className="voucher-label">🎟️ Mã khuyến mãi</span>
                    <button
                        type="button"
                        className="voucher-toggle-btn"
                        onClick={() => setShowVouchers(!showVouchers)}
                    >
                        {showVouchers ? '▲' : '▼'}
                    </button>
                </div>

                {selectedVoucher ? (
                    <div className="voucher-selected">
                        <div className="voucher-selected-info">
                            <span className="voucher-selected-code">{selectedVoucher.code}</span>
                            <span className="voucher-selected-discount">
                                -{selectedDiscount.toLocaleString('vi-VN')}đ
                            </span>
                        </div>
                        <button
                            type="button"
                            className="voucher-remove-btn"
                            onClick={() => {
                                onVoucherSelect(null);
                                setShowVouchers(false);
                            }}
                        >
                            ✕
                        </button>
                    </div>
                ) : (
                    <div className="voucher-placeholder">
                        Chọn mã khuyến mãi để tiết kiệm
                    </div>
                )}
            </div>

            {/* Voucher List Modal */}
            {showVouchers && (
                <>
                    <div className="voucher-overlay" onClick={() => setShowVouchers(false)}></div>
                    <div className="voucher-modal">
                        <div className="voucher-modal-header">
                            <h3>Mã khuyến mãi có sẵn</h3>
                            <button
                                type="button"
                                className="voucher-close-btn"
                                onClick={() => setShowVouchers(false)}
                            >
                                ✕
                            </button>
                        </div>

                        {/* Search */}
                        <div className="voucher-search">
                            <input
                                type="text"
                                placeholder="Tìm mã khuyến mãi..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="voucher-search-input"
                            />
                        </div>

                        {/* Voucher List */}
                        <div className="voucher-list">
                            {validVouchers.length > 0 ? (
                                validVouchers.map(voucher => {
                                    const discount = calculateDiscount(voucher, totalAmount);
                                    const isSelected = selectedVoucher?.id === voucher.id;

                                    return (
                                        <div
                                            key={voucher.id}
                                            className={`voucher-item ${isSelected ? 'selected' : ''}`}
                                            onClick={() => handleSelectVoucher(voucher)}
                                        >
                                            <div className="voucher-item-left">
                                                <div className="voucher-badge">{voucher.badge}</div>
                                                <div className="voucher-info">
                                                    <div className="voucher-code">{voucher.code}</div>
                                                    <div className="voucher-name">{voucher.name}</div>
                                                    <div className="voucher-restriction">{voucher.restrictions}</div>
                                                </div>
                                            </div>
                                            <div className="voucher-item-right">
                                                <div className="voucher-discount">
                                                    -{discount.toLocaleString('vi-VN')}đ
                                                </div>
                                                {isSelected && <div className="voucher-checkmark">✓</div>}
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="voucher-empty">
                                    {searchTerm ? (
                                        <>
                                            <div className="empty-icon">🔍</div>
                                            <p>Không tìm thấy mã khuyến mãi nào</p>
                                        </>
                                    ) : (
                                        <>
                                            <div className="empty-icon">🎟️</div>
                                            <p>Không có mã khuyến mãi nào áp dụng cho đơn hàng này</p>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

export default VoucherSelector;
