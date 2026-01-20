import React, { useEffect } from 'react';

function Toast({ message, type, onClose }) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 2000); // Tự tắt sau 2 giây
        return () => clearTimeout(timer);
    }, [onClose]);

    if (!message) return null;

    return (
        <div className="toast-container">
            <div className="toast-icon">
                {type === 'success' ? '✅' : '⚠️'}
            </div>
            <div>{message}</div>
        </div>
    );
}

export default Toast;