import React, { useEffect, useState } from 'react';

function Toast({ message, type, onClose }) {
    const normalizedType = type || 'info';
    const [isClosing, setIsClosing] = useState(false);

    useEffect(() => {
        setIsClosing(false);
    }, [message, normalizedType]);

    useEffect(() => {
        const hideTimer = setTimeout(() => {
            setIsClosing(true);
        }, 2300);

        const closeTimer = setTimeout(() => {
            onClose();
        }, 2550);

        return () => {
            clearTimeout(hideTimer);
            clearTimeout(closeTimer);
        };
    }, [onClose]);

    if (!message) return null;

    const iconMap = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };

    const titleMap = {
        success: 'Hoàn tất',
        error: 'Có lỗi xảy ra',
        warning: 'Lưu ý',
        info: 'Thông báo'
    };

    return (
        <div className={`toast-container toast-${normalizedType} ${isClosing ? 'toast-exit' : 'toast-enter'}`} role="status" aria-live="polite">
            <div className="toast-icon">
                {iconMap[normalizedType] || iconMap.info}
            </div>
            <div className="toast-content">
                <div className="toast-title">{titleMap[normalizedType] || titleMap.info}</div>
                <div className="toast-message">{message}</div>
            </div>
        </div>
    );
}

export default Toast;