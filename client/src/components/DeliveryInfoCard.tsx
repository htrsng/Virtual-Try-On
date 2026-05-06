import { useState } from 'react';

interface Address {
    fullName: string;
    phone: string;
    province: string;
    district: string;
    ward: string;
    street: string;
}

interface Props {
    address: Address | null;
    onSave: (addr: Address) => void;
}

export default function DeliveryInfoCard({ address, onSave }: Props) {
    const [expanded, setExpanded] = useState<boolean>(!address);
    const [form, setForm] = useState<Address>(
        address ?? { fullName: '', phone: '', province: '', district: '', ward: '', street: '' }
    );
    const [errors, setErrors] = useState<Partial<Address>>({});

    const hasAddress = !!address?.phone && !!address?.province;

    const shortAddress = address
        ? `${address.street}, ${address.ward}, ${address.district}, ${address.province}`
        : '';

    const validate = (): boolean => {
        const errs: Partial<Address> = {};
        if (!form.fullName.trim()) errs.fullName = 'Vui lòng nhập họ tên';
        if (!form.phone.trim()) errs.phone = 'Vui lòng nhập số điện thoại';
        if (!/^0\d{9}$/.test(form.phone.trim())) errs.phone = 'Số điện thoại không hợp lệ';
        if (!form.province) errs.province = 'Vui lòng chọn tỉnh/thành phố';
        if (!form.district) errs.district = 'Vui lòng chọn quận/huyện';
        if (!form.ward) errs.ward = 'Vui lòng chọn phường/xã';
        if (!form.street.trim()) errs.street = 'Vui lòng nhập số nhà/tên đường';
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSave = () => {
        if (!validate()) return;
        onSave(form);
        setExpanded(false);
    };

    return (
        <div className={`dic-wrap ${expanded ? 'dic-wrap--open' : ''}`}>
            <div className="dic-card" onClick={() => setExpanded(v => !v)}>
                <div className="dic-card-left">
                    <span className="dic-card-icon">📍</span>
                    {hasAddress ? (
                        <div className="dic-card-info">
                            <div className="dic-card-main">
                                <span className="dic-name">{address!.fullName}</span>
                                <span className="dic-dot">·</span>
                                <span className="dic-phone">{address!.phone}</span>
                            </div>
                            <div className="dic-address">{shortAddress}</div>
                        </div>
                    ) : (
                        <div className="dic-card-info">
                            <div className="dic-name dic-name--empty">Chưa có địa chỉ giao hàng</div>
                            <div className="dic-address dic-address--hint">Nhấn để thêm địa chỉ</div>
                        </div>
                    )}
                </div>
                <div className="dic-card-right">
                    {!hasAddress && <span className="dic-required-badge">Bắt buộc</span>}
                    <span className="dic-chevron">{expanded ? '▲' : '▼'}</span>
                </div>
            </div>

            {expanded && (
                <div className="dic-form">
                    <div className="dic-form-row">
                        <div className="dic-field">
                            <label className="dic-label">Họ và tên <span className="req">*</span></label>
                            <input
                                className={`dic-input ${errors.fullName ? 'dic-input--error' : ''}`}
                                value={form.fullName}
                                onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))}
                                placeholder="Nguyễn Văn A"
                            />
                            {errors.fullName && <span className="dic-error">{errors.fullName}</span>}
                        </div>
                        <div className="dic-field">
                            <label className="dic-label">Số điện thoại <span className="req">*</span></label>
                            <input
                                className={`dic-input ${errors.phone ? 'dic-input--error' : ''}`}
                                value={form.phone}
                                onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                                placeholder="0912 345 678"
                                type="tel"
                                maxLength={11}
                            />
                            {errors.phone && <span className="dic-error">{errors.phone}</span>}
                        </div>
                    </div>

                    <div className="dic-form-row dic-form-row--3">
                        <div className="dic-field">
                            <label className="dic-label">Tỉnh/Thành phố <span className="req">*</span></label>
                            <select
                                className={`dic-select ${errors.province ? 'dic-input--error' : ''}`}
                                value={form.province}
                                onChange={e => setForm(p => ({ ...p, province: e.target.value, district: '', ward: '' }))}
                            >
                                <option value="">-- Chọn tỉnh --</option>
                                {/* Provinces list — giữ nguyên list đang có */}
                            </select>
                            {errors.province && <span className="dic-error">{errors.province}</span>}
                        </div>
                        <div className="dic-field">
                            <label className="dic-label">Quận/Huyện <span className="req">*</span></label>
                            <select
                                className={`dic-select ${errors.district ? 'dic-input--error' : ''}`}
                                value={form.district}
                                onChange={e => setForm(p => ({ ...p, district: e.target.value, ward: '' }))}
                                disabled={!form.province}
                            >
                                <option value="">-- Chọn quận --</option>
                            </select>
                            {errors.district && <span className="dic-error">{errors.district}</span>}
                        </div>
                        <div className="dic-field">
                            <label className="dic-label">Phường/Xã <span className="req">*</span></label>
                            <select
                                className={`dic-select ${errors.ward ? 'dic-input--error' : ''}`}
                                value={form.ward}
                                onChange={e => setForm(p => ({ ...p, ward: e.target.value }))}
                                disabled={!form.district}
                            >
                                <option value="">-- Chọn phường --</option>
                            </select>
                            {errors.ward && <span className="dic-error">{errors.ward}</span>}
                        </div>
                    </div>

                    <div className="dic-field">
                        <label className="dic-label">Số nhà / Tên đường <span className="req">*</span></label>
                        <input
                            className={`dic-input ${errors.street ? 'dic-input--error' : ''}`}
                            value={form.street}
                            onChange={e => setForm(p => ({ ...p, street: e.target.value }))}
                            placeholder="VD: 123 Đường Lê Lợi, Tòa nhà ABC"
                        />
                        {errors.street && <span className="dic-error">{errors.street}</span>}
                    </div>

                    <div className="dic-form-actions">
                        {hasAddress && (
                            <button
                                type="button"
                                className="dic-btn dic-btn--cancel"
                                onClick={() => { setForm(address!); setExpanded(false); setErrors({}); }}
                            >
                                Huỷ
                            </button>
                        )}
                        <button
                            type="button"
                            className="dic-btn dic-btn--save"
                            onClick={handleSave}
                        >
                            {hasAddress ? 'Lưu thay đổi' : 'Xác nhận địa chỉ'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
