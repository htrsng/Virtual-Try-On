import { useEffect } from 'react';
import Portal from './Portal';

export default function AddressModal({ open, onClose, addresses, selectedId, onSelect, onAddNew, onEditAddress }) {
    useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }

        return () => {
            document.body.style.overflow = '';
        };
    }, [open]);

    if (!open) return null;

    return (
        <Portal>
            <div className="am-backdrop" onClick={onClose} />
            <div className="am-modal am-modal--picker">
                <div className="am-header">
                    <button className="am-back" onClick={onClose}>←</button>
                    <h2 className="am-title">Chọn địa chỉ nhận hàng</h2>
                </div>

                <div className="am-list">
                    {(!addresses || addresses.length === 0) ? (
                        <div className="am-empty">
                            <p>Bạn chưa có địa chỉ nào</p>
                            <p>Thêm địa chỉ để tiếp tục đặt hàng</p>
                        </div>
                    ) : (
                        addresses.map(addr => (
                            <div
                                key={addr._id || addr.phone + addr.street}
                                className={`am-item ${selectedId === addr._id ? 'am-item--selected' : ''}`}
                                onClick={() => { onSelect(addr); onClose(); }}
                            >
                                <div className="am-item-radio">
                                    <div className={`am-radio ${selectedId === addr._id ? 'am-radio--on' : ''}`} />
                                </div>
                                <div className="am-item-body">
                                    <div className="am-item-top">
                                        <span className="am-item-name">{addr.fullName}</span>
                                        <span className="am-item-divider">|</span>
                                        <span className="am-item-phone">(+84) {String(addr.phone || '').replace(/^0/, '')}</span>
                                        <button
                                            className="am-item-edit"
                                            onClick={e => { e.stopPropagation(); onEditAddress?.(addr); }}
                                        >
                                            Sửa
                                        </button>
                                    </div>
                                    <div className="am-item-address">
                                        {addr.street}, {addr.ward}, {addr.district}, {addr.province}
                                    </div>
                                    {addr.isDefault && (<span className="am-default-badge">Mặc định</span>)}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="am-footer">
                    <button className="am-add-btn" onClick={onAddNew}>+ Thêm địa chỉ mới</button>
                </div>
            </div>
        </Portal>
    );
}
