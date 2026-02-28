import React from 'react';

/**
 * PaymentMethod – radio cards + contextual description badges
 */
const BADGES = {
    COD: {
        icon: '💵',
        text: 'Thanh toán khi nhận hàng. Có thể kiểm tra trước khi trả tiền.',
    },
    Banking: {
        icon: '🏦',
        text: 'Chuyển khoản ngân hàng. Đơn hàng sẽ được xác nhận sau khi nhận tiền.',
    },
    Online: {
        icon: '💳',
        text: 'Đơn hàng sẽ được xử lý ngay sau khi thanh toán thành công.',
    },
};

export default function PaymentMethod({ paymentMethod, setPaymentMethod, t }) {
    const activeBadge = BADGES[paymentMethod];

    return (
        <div className="co-payment">
            <label className="form-label">{t('payment_method')}</label>
            <div className="co-payment__options">
                {Object.entries(BADGES).map(([key, { icon }]) => (
                    <label
                        key={key}
                        className={`co-payment__option ${paymentMethod === key ? 'co-payment__option--active' : ''}`}
                    >
                        <input
                            type="radio"
                            name="payment"
                            value={key}
                            checked={paymentMethod === key}
                            onChange={e => setPaymentMethod(e.target.value)}
                        />
                        <span className="co-payment__label">
                            {icon}{' '}
                            {key === 'COD'
                                ? t('cod_full')
                                : key === 'Banking'
                                    ? t('banking_full')
                                    : t('online_full')}
                        </span>
                    </label>
                ))}
            </div>

            {/* Contextual badge */}
            {activeBadge && (
                <div className="co-payment__badge">
                    <span className="co-payment__badge-icon">{activeBadge.icon}</span>
                    <span className="co-payment__badge-text">{activeBadge.text}</span>
                </div>
            )}
        </div>
    );
}
