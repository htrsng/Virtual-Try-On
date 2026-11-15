export default function AddressCard({ address, onChangeClick }) {
    return (
        <div className="addr-card" onClick={onChangeClick}>
            <div className="addr-card-left">
                <span className="addr-pin">📍</span>
                <div className="addr-card-body">
                    {address ? (
                        <>
                            <div className="addr-card-top">
                                <span className="addr-name">{address.fullName}</span>
                                <span className="addr-divider">|</span>
                                <span className="addr-phone">(+84) {String(address.phone || '').replace(/^0/, '')}</span>
                            </div>
                            <div className="addr-card-detail">
                                {address.street}, {address.ward}, {address.district}, {address.province}
                            </div>
                            {address.isDefault && (
                                <span className="addr-default-badge">Mặc định</span>
                            )}
                        </>
                    ) : (
                        <>
                            <div className="addr-card-top addr-card-top--empty">Thêm địa chỉ giao hàng</div>
                            <div className="addr-card-detail addr-card-detail--hint">Nhấn để chọn hoặc thêm địa chỉ mới</div>
                        </>
                    )}
                </div>
            </div>
            <span className="addr-chevron">›</span>
        </div>
    );
}
