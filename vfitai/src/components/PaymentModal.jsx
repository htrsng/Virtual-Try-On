import React, { useState } from 'react';

function PaymentModal({ isOpen, onClose, onConfirm }) {
    const [info, setInfo] = useState({ name: '', phone: '', address: '' });

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (info.name && info.phone && info.address) {
            onConfirm();
        } else {
            alert("Vui lòng điền đủ thông tin nhận hàng!");
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <div className="modal-title">Thanh Toán</div>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>
                <div className="modal-body">
                    <form onSubmit={handleSubmit}>
                        <input
                            type="text"
                            className="pay-input"
                            placeholder="Họ và tên người nhận"
                            value={info.name}
                            onChange={e => setInfo({ ...info, name: e.target.value })}
                        />
                        <input
                            type="text"
                            className="pay-input"
                            placeholder="Số điện thoại"
                            value={info.phone}
                            onChange={e => setInfo({ ...info, phone: e.target.value })}
                        />
                        <textarea
                            className="pay-input"
                            rows="3"
                            placeholder="Địa chỉ giao hàng"
                            value={info.address}
                            onChange={e => setInfo({ ...info, address: e.target.value })}
                        ></textarea>
                        <div style={{ marginBottom: '10px', fontSize: '13px', color: '#555' }}>
                            Phương thức: Thanh toán khi nhận hàng (COD)
                        </div>
                        <button type="submit" className="pay-btn">ĐẶT HÀNG</button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default PaymentModal;