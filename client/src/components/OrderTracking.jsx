import React from 'react';

const ORDER_STATUSES = [
    { key: 'Đang xử lý', label: 'Đang xử lý', icon: '📋', color: '#f59e0b' },
    { key: 'Đang giao', label: 'Đang giao', icon: '🚚', color: '#3b82f6' },
    { key: 'Đã giao', label: 'Đã giao', icon: '✅', color: '#22c55e' },
];

function OrderTracking({ status, createdAt, cancelledAt }) {
    const isCancelled = status === 'Đã hủy';
    const currentIndex = ORDER_STATUSES.findIndex(s => s.key === status);
    const activeIndex = isCancelled ? -1 : currentIndex;

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleString('vi-VN', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });
    };

    return (
        <div style={{
            padding: '20px',
            background: isCancelled ? '#fef2f2' : '#f8fafc',
            borderRadius: '12px',
            marginTop: '12px',
        }}>
            <div style={{
                fontSize: '15px', fontWeight: 700, marginBottom: '16px',
                color: isCancelled ? '#ef4444' : '#333',
            }}>
                {isCancelled ? '❌ Đơn hàng đã hủy' : '📦 Trạng thái đơn hàng'}
            </div>

            {isCancelled ? (
                <div style={{ fontSize: '14px', color: '#ef4444' }}>
                    <div>Đơn hàng đã bị hủy vào {formatDate(cancelledAt)}</div>
                </div>
            ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0', position: 'relative' }}>
                    {ORDER_STATUSES.map((step, index) => {
                        const isActive = index <= activeIndex;
                        const isCurrent = index === activeIndex;
                        return (
                            <React.Fragment key={step.key}>
                                {/* Step Circle */}
                                <div style={{
                                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                                    flex: 1, position: 'relative', zIndex: 1,
                                }}>
                                    <div style={{
                                        width: '44px', height: '44px', borderRadius: '50%',
                                        background: isActive ? step.color : '#e5e7eb',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '20px',
                                        boxShadow: isCurrent ? `0 0 0 4px ${step.color}33` : 'none',
                                        transition: 'all 0.5s ease',
                                        animation: isCurrent ? 'pulse 2s infinite' : 'none',
                                    }}>
                                        {step.icon}
                                    </div>
                                    <div style={{
                                        fontSize: '12px', fontWeight: isActive ? 700 : 400,
                                        color: isActive ? step.color : '#999',
                                        marginTop: '8px', textAlign: 'center',
                                    }}>{step.label}</div>
                                    {isCurrent && createdAt && (
                                        <div style={{
                                            fontSize: '11px', color: '#999', marginTop: '2px', textAlign: 'center',
                                        }}>{formatDate(createdAt)}</div>
                                    )}
                                </div>

                                {/* Connector Line */}
                                {index < ORDER_STATUSES.length - 1 && (
                                    <div style={{
                                        flex: 1, height: '3px',
                                        background: index < activeIndex ? step.color : '#e5e7eb',
                                        transition: 'background 0.5s ease',
                                        marginTop: '-28px',
                                    }} />
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>
            )}

            <style>{`
                @keyframes pulse {
                    0%, 100% { box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2); }
                    50% { box-shadow: 0 0 0 8px rgba(59, 130, 246, 0.1); }
                }
            `}</style>
        </div>
    );
}

export default OrderTracking;
