import React from 'react';

/**
 * TrustSignals – three reassurance badges below the order button
 */
const SIGNALS = [
    {
        icon: '🔒',
        label: 'Thanh toán bảo mật SSL',
    },
    {
        icon: '🚚',
        label: 'Hỗ trợ đổi trả 7 ngày',
    },
    {
        icon: '📞',
        label: 'Hotline hỗ trợ 24/7',
    },
];

export default function TrustSignals() {
    return (
        <div className="co-trust">
            {SIGNALS.map((s, i) => (
                <div className="co-trust__item" key={i}>
                    <span className="co-trust__icon">{s.icon}</span>
                    <span className="co-trust__label">{s.label}</span>
                </div>
            ))}
        </div>
    );
}
