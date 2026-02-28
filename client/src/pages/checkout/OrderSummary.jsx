import React, { useState } from 'react';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';

/**
 * OrderSummary – detailed breakdown + mini product summary dropdown
 */
export default function OrderSummary({
    selectedProducts,
    totalAmount,
    shippingFee,
    discountAmount,
    voucherDiscount,
    finalAmount,
    appliedDiscount,
    selectedVoucher,
    formatPrice,
    parsePrice,
    t,
}) {
    const [expanded, setExpanded] = useState(false);
    const itemCount = selectedProducts.length;

    return (
        <div className="co-summary">
            <h3 className="co-summary__title">
                <span className="co-summary__icon">💰</span>
                {t('payment_title') || 'Chi tiết thanh toán'}
            </h3>

            {/* ---- Mini product dropdown ---- */}
            <button
                type="button"
                className="co-mini-products__toggle"
                onClick={() => setExpanded(v => !v)}
                aria-expanded={expanded}
            >
                <span>Xem sản phẩm đã chọn ({itemCount})</span>
                {expanded ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
            </button>

            {expanded && (
                <div className="co-mini-products__list">
                    {selectedProducts.map(item => (
                        <div key={item.cartId} className="co-mini-product">
                            <img
                                className="co-mini-product__img"
                                src={item.img || item.image || ''}
                                alt={item.name}
                            />
                            <div className="co-mini-product__info">
                                <span className="co-mini-product__name">{item.name}</span>
                                <span className="co-mini-product__meta">
                                    Size {item.size} &bull; x{item.quantity}
                                </span>
                            </div>
                            <span className="co-mini-product__price">
                                {formatPrice(parsePrice(item.price) * item.quantity)}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {/* ---- Breakdown rows ---- */}
            <div className="co-summary__rows">
                <div className="co-summary__row">
                    <span>Tạm tính ({itemCount} sản phẩm)</span>
                    <span className="co-summary__val">{formatPrice(totalAmount)}</span>
                </div>

                <div className="co-summary__row">
                    <span>Phí vận chuyển</span>
                    <span className="co-summary__val">{formatPrice(shippingFee)}</span>
                </div>

                {appliedDiscount && (
                    <div className="co-summary__row co-summary__row--discount">
                        <span>Mã giảm giá ({appliedDiscount.discount}%)</span>
                        <span className="co-summary__val">-{formatPrice(discountAmount)}</span>
                    </div>
                )}

                {selectedVoucher && voucherDiscount > 0 && (
                    <div className="co-summary__row co-summary__row--discount">
                        <span>{selectedVoucher.badge} {selectedVoucher.code}</span>
                        <span className="co-summary__val">-{formatPrice(voucherDiscount)}</span>
                    </div>
                )}
            </div>

            {/* ---- Divider ---- */}
            <div className="co-summary__divider" />

            {/* ---- Total ---- */}
            <div className="co-summary__total">
                <div className="co-summary__total-label">
                    Tổng thanh toán
                    <span className="co-summary__total-count">({itemCount} sản phẩm)</span>
                </div>
                <span className="co-summary__total-price">{formatPrice(finalAmount)}</span>
            </div>
        </div>
    );
}
