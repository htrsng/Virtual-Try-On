import React from 'react';
import { FiAlertTriangle, FiX } from 'react-icons/fi';
import './ConfirmModal.css';

/**
 * ConfirmModal — generic confirm-before-action dialog
 *
 * @param {boolean} open
 * @param {string}  title
 * @param {string}  message
 * @param {string}  confirmLabel — "Xóa" / "Xác nhận"
 * @param {'danger'|'warning'|'primary'} variant
 * @param {() => void} onConfirm
 * @param {() => void} onCancel
 * @param {boolean} loading
 */
export default function ConfirmModal({
    open, title, message, confirmLabel = 'Xác nhận', variant = 'danger',
    onConfirm, onCancel, loading = false
}) {
    if (!open) return null;

    return (
        <div className="cmodal-overlay" onClick={onCancel}>
            <div className="cmodal" onClick={e => e.stopPropagation()}>
                <button className="cmodal__close" onClick={onCancel}><FiX size={18} /></button>

                <div className={`cmodal__icon cmodal__icon--${variant}`}>
                    <FiAlertTriangle size={24} />
                </div>

                <h3 className="cmodal__title">{title}</h3>
                {message && <p className="cmodal__message">{message}</p>}

                <div className="cmodal__actions">
                    <button className="cmodal__btn cmodal__btn--secondary" onClick={onCancel} disabled={loading}>
                        Hủy
                    </button>
                    <button
                        className={`cmodal__btn cmodal__btn--${variant}`}
                        onClick={onConfirm}
                        disabled={loading}
                    >
                        {loading ? 'Đang xử lý...' : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
