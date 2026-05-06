import { useState, useEffect } from 'react';
import Portal from './Portal';
import { vietnamAddressData } from '../data/vietnamAddress';
import MapPicker from './MapPicker';

export default function AddressFormModal({ open, onClose, onSave, editAddress = null }) {
    const [form, setForm] = useState(editAddress ?? { fullName: '', phone: '', province: '', district: '', ward: '', street: '', isDefault: false, type: 'home' });
    const [errors, setErrors] = useState({});
    const [provinceList, setProvinceList] = useState([]);
    const [districtList, setDistrictList] = useState([]);
    const [wardList, setWardList] = useState([]);
    const [mapConfirmed, setMapConfirmed] = useState(false);

    const mapAddress = [form.street, form.ward, form.district, form.province].filter(Boolean).join(', ');
    const canShowMap = Boolean(form.province && form.district && form.ward && String(form.street || '').trim());

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

    useEffect(() => {
        setProvinceList(Object.keys(vietnamAddressData).sort());
    }, []);

    useEffect(() => {
        if (!open) return;

        const nextForm = editAddress ?? { fullName: '', phone: '', province: '', district: '', ward: '', street: '', isDefault: false, type: 'home' };
        setForm(nextForm);
        setErrors({});
        setMapConfirmed(false);

        const nextProvinceList = Object.keys(vietnamAddressData).sort();
        setProvinceList(nextProvinceList);

        if (nextForm.province && vietnamAddressData[nextForm.province]) {
            const nextDistricts = Object.keys(vietnamAddressData[nextForm.province]).sort();
            setDistrictList(nextDistricts);
            if (nextForm.district && vietnamAddressData[nextForm.province]?.[nextForm.district]) {
                setWardList(vietnamAddressData[nextForm.province][nextForm.district].sort());
            } else {
                setWardList([]);
            }
        } else {
            setDistrictList([]);
            setWardList([]);
        }
    }, [editAddress, open]);

    const handleProvinceChange = (value) => {
        setForm(p => ({ ...p, province: value, district: '', ward: '' }));
        setDistrictList(value && vietnamAddressData[value] ? Object.keys(vietnamAddressData[value]).sort() : []);
        setWardList([]);
        setMapConfirmed(false);
    };

    const handleDistrictChange = (value) => {
        setForm(p => ({ ...p, district: value, ward: '' }));
        setWardList(form.province && value && vietnamAddressData[form.province]?.[value] ? vietnamAddressData[form.province][value].sort() : []);
        setMapConfirmed(false);
    };

    const handleWardChange = (value) => {
        setForm(p => ({ ...p, ward: value }));
        setMapConfirmed(false);
    };

    const handleStreetChange = (value) => {
        setForm(p => ({ ...p, street: value }));
        setMapConfirmed(false);
    };

    const validate = () => {
        const errs = {};
        if (!form.fullName || !form.fullName.trim()) errs.fullName = 'Vui lòng nhập họ tên';
        if (!/^0\d{9}$/.test(String(form.phone || '').trim())) errs.phone = 'SĐT không hợp lệ (VD: 0912345678)';
        if (!form.province) errs.province = 'Chọn tỉnh/thành phố';
        if (!form.district) errs.district = 'Chọn quận/huyện';
        if (!form.ward) errs.ward = 'Chọn phường/xã';
        if (!form.street || !form.street.trim()) errs.street = 'Nhập số nhà/tên đường';
        if (canShowMap && !mapConfirmed) errs.mapConfirmed = 'Vui lòng xác nhận vị trí trên bản đồ';
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    if (!open) return null;

    return (
        <Portal>
            <div className="am-backdrop" onClick={onClose} />
            <div className="am-modal am-modal--form">
                <div className="am-header">
                    <button className="am-back" onClick={onClose}>←</button>
                    <h2 className="am-title">{editAddress ? 'Sửa địa chỉ' : 'Địa chỉ mới'}</h2>
                </div>

                <div className="af-body">
                    {/* Thông tin liên hệ */}
                    <div className="af-section">
                        <h3 className="af-section-title">Thông tin liên hệ</h3>
                        <div className="af-field">
                            <input
                                className={`af-input ${errors.fullName ? 'af-input--err' : ''}`}
                                value={form.fullName}
                                placeholder="Họ và tên"
                                onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))}
                            />
                            {errors.fullName && <span className="af-err">{errors.fullName}</span>}
                        </div>

                        <div className="af-field">
                            <input
                                className={`af-input ${errors.phone ? 'af-input--err' : ''}`}
                                value={form.phone}
                                placeholder="Số điện thoại (VD: 0912345678)"
                                type="tel"
                                onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                            />
                            {errors.phone && <span className="af-err">{errors.phone}</span>}
                        </div>
                    </div>

                    {/* Địa chỉ */}
                    <div className="af-section">
                        <h3 className="af-section-title">Địa chỉ</h3>

                        <div className="af-row">
                            <div className="af-field af-field-col">
                                <select
                                    className={`af-input ${errors.province ? 'af-input--err' : ''}`}
                                    value={form.province}
                                    onChange={e => handleProvinceChange(e.target.value)}
                                >
                                    <option value="">Tỉnh/Thành phố</option>
                                    {provinceList.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                                {errors.province && <span className="af-err">{errors.province}</span>}
                            </div>

                            <div className="af-field af-field-col">
                                <select
                                    className={`af-input ${errors.district ? 'af-input--err' : ''}`}
                                    value={form.district}
                                    disabled={!form.province}
                                    onChange={e => handleDistrictChange(e.target.value)}
                                >
                                    <option value="">Quận/Huyện</option>
                                    {districtList.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                                {errors.district && <span className="af-err">{errors.district}</span>}
                            </div>
                        </div>

                        <div className="af-row">
                            <div className="af-field af-field-col">
                                <select
                                    className={`af-input ${errors.ward ? 'af-input--err' : ''}`}
                                    value={form.ward}
                                    disabled={!form.district}
                                    onChange={e => handleWardChange(e.target.value)}
                                >
                                    <option value="">Phường/Xã</option>
                                    {wardList.map(w => <option key={w} value={w}>{w}</option>)}
                                </select>
                                {errors.ward && <span className="af-err">{errors.ward}</span>}
                            </div>
                        </div>

                        <div className="af-field">
                            <input
                                className={`af-input ${errors.street ? 'af-input--err' : ''}`}
                                value={form.street}
                                placeholder="Số nhà, tên đường"
                                onChange={e => handleStreetChange(e.target.value)}
                            />
                            {errors.street && <span className="af-err">{errors.street}</span>}
                        </div>
                    </div>

                    {canShowMap && (
                        <div className="af-section af-map-section">
                            <h3 className="af-section-title">Xác nhận vị trí giao hàng</h3>
                            <div className="af-map-note">
                                Kiểm tra vị trí trên bản đồ trước khi lưu địa chỉ nhận hàng.
                            </div>
                            <MapPicker address={mapAddress} />
                            <label className="af-map-confirm">
                                <input
                                    type="checkbox"
                                    checked={mapConfirmed}
                                    onChange={(e) => setMapConfirmed(e.target.checked)}
                                />
                                Tôi xác nhận vị trí này đúng với địa chỉ nhận hàng
                            </label>
                            {errors.mapConfirmed && <span className="af-err">{errors.mapConfirmed}</span>}
                        </div>
                    )}

                    {/* Loại địa chỉ & Mặc định */}
                    <div className="af-section">
                        <div className="af-toggle-row">
                            <span className="af-section-title">Loại địa chỉ</span>
                            <div className="af-type-buttons">
                                <button
                                    type="button"
                                    className={`af-type-btn ${form.type === 'home' ? 'af-type-btn--on' : ''}`}
                                    onClick={() => setForm(p => ({ ...p, type: 'home' }))}
                                >
                                    🏠 Nhà Riêng
                                </button>
                                <button
                                    type="button"
                                    className={`af-type-btn ${form.type === 'office' ? 'af-type-btn--on' : ''}`}
                                    onClick={() => setForm(p => ({ ...p, type: 'office' }))}
                                >
                                    🏢 Văn Phòng
                                </button>
                            </div>
                        </div>

                        <div className="af-toggle-row">
                            <span>Đặt làm địa chỉ mặc định</span>
                            <div className={`af-toggle ${form.isDefault ? 'af-toggle--on' : ''}`} onClick={() => setForm(p => ({ ...p, isDefault: !p.isDefault }))}>
                                <div className="af-toggle-thumb" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="am-footer">
                    <button className="af-save-btn" onClick={() => { if (validate()) { onSave(form); } }}>
                        ✓ HOÀN THÀNH
                    </button>
                </div>
            </div>
        </Portal>
    );
}
