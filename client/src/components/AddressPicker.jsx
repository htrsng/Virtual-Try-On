import React, { useState, useEffect } from 'react';
import { vietnamAddressData } from '../data/vietnamAddress';
import { FiMapPin, FiChevronDown } from 'react-icons/fi';
import MapPicker from './MapPicker';

const AddressPicker = ({
    onAddressChange,
    initialCity = '',
    initialDistrict = '',
    initialWard = '',
    initialAddress = '',
    showMap = false
}) => {
    const provinces = Object.keys(vietnamAddressData);

    const [selectedCity, setSelectedCity] = useState(initialCity);
    const [selectedDistrict, setSelectedDistrict] = useState(initialDistrict);
    const [selectedWard, setSelectedWard] = useState(initialWard);
    const [detailAddress, setDetailAddress] = useState(initialAddress);

    const districts = selectedCity ? Object.keys(vietnamAddressData[selectedCity] || {}) : [];
    const wards = selectedCity && selectedDistrict
        ? vietnamAddressData[selectedCity]?.[selectedDistrict] || []
        : [];

    // Gọi callback khi any field thay đổi
    useEffect(() => {
        const fullAddress = [detailAddress, selectedWard, selectedDistrict, selectedCity]
            .filter(v => v)
            .join(', ');

        onAddressChange({
            city: selectedCity,
            district: selectedDistrict,
            ward: selectedWard,
            address: detailAddress,
            fullAddress
        });
    }, [selectedCity, selectedDistrict, selectedWard, detailAddress]);

    // Reset district & ward khi city thay đổi
    const handleCityChange = (e) => {
        setSelectedCity(e.target.value);
        setSelectedDistrict('');
        setSelectedWard('');
    };

    // Reset ward khi district thay đổi
    const handleDistrictChange = (e) => {
        setSelectedDistrict(e.target.value);
        setSelectedWard('');
    };

    const mapAddress = `${detailAddress}, ${selectedWard}, ${selectedDistrict}, ${selectedCity}`.trim();

    return (
        <div className="address-picker-container">
            {/* Header */}
            <div className="address-picker-header">
                <label className="address-picker-title">
                    <FiMapPin size={18} style={{ marginRight: '8px' }} />
                    <strong>📍 Chọn địa chỉ giao hàng</strong>
                </label>
                <p style={{ fontSize: '12px', color: '#999', margin: '4px 0 0' }}>
                    Chọn tỉnh/thành phố, quận/huyện, phường/xã dưới đây
                </p>
            </div>

            {/* Dropdowns */}
            <div className="address-picker-dropdowns">
                {/* City Dropdown */}
                <div className="address-select-group">
                    <label className="address-select-label">Tỉnh/Thành phố *</label>
                    <div className="address-select-wrapper">
                        <select
                            value={selectedCity}
                            onChange={handleCityChange}
                            className="address-select"
                        >
                            <option value="">-- Chọn tỉnh/thành phố --</option>
                            {provinces.map(province => (
                                <option key={province} value={province}>{province}</option>
                            ))}
                        </select>
                        <FiChevronDown className="address-select-icon" />
                    </div>
                </div>

                {/* District Dropdown */}
                <div className="address-select-group">
                    <label className="address-select-label">Quận/Huyện *</label>
                    <div className="address-select-wrapper">
                        <select
                            value={selectedDistrict}
                            onChange={handleDistrictChange}
                            disabled={!selectedCity}
                            className="address-select"
                        >
                            <option value="">-- Chọn quận/huyện --</option>
                            {districts.map(district => (
                                <option key={district} value={district}>{district}</option>
                            ))}
                        </select>
                        <FiChevronDown className="address-select-icon" />
                    </div>
                </div>

                {/* Ward Dropdown */}
                <div className="address-select-group">
                    <label className="address-select-label">Phường/Xã *</label>
                    <div className="address-select-wrapper">
                        <select
                            value={selectedWard}
                            onChange={(e) => setSelectedWard(e.target.value)}
                            disabled={!selectedDistrict}
                            className="address-select"
                        >
                            <option value="">-- Chọn phường/xã --</option>
                            {wards.map(ward => (
                                <option key={ward} value={ward}>{ward}</option>
                            ))}
                        </select>
                        <FiChevronDown className="address-select-icon" />
                    </div>
                </div>
            </div>

            {/* Detail Address */}
            <div style={{ marginTop: '16px' }}>
                <label className="address-select-label">Số nhà/Tên đường *</label>
                <input
                    type="text"
                    value={detailAddress}
                    onChange={(e) => setDetailAddress(e.target.value)}
                    placeholder="VD: 123 Đường ABC, Tòa nhà XYZ"
                    className="address-detail-input"
                    style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontFamily: 'inherit',
                        boxSizing: 'border-box',
                        transition: 'border-color 0.3s'
                    }}
                />
            </div>

            {/* Map Preview */}
            {showMap && selectedCity && selectedDistrict && selectedWard && (
                <div style={{ marginTop: '16px' }}>
                    <label className="address-select-label">👀 Bản đồ xác nhận địa chỉ</label>
                    <MapPicker address={mapAddress} />
                </div>
            )}

            {/* Summary */}
            {selectedCity && selectedDistrict && selectedWard && (
                <div style={{
                    marginTop: '12px',
                    padding: '12px',
                    background: '#f0f8ff',
                    borderLeft: '3px solid #2196F3',
                    borderRadius: '4px',
                    fontSize: '13px',
                    color: '#555'
                }}>
                    <strong>✓ Địa chỉ đã chọn:</strong>
                    <div style={{ marginTop: '6px', lineHeight: '1.6' }}>
                        {detailAddress && <div>{detailAddress}</div>}
                        <div>{selectedWard}, {selectedDistrict}, {selectedCity}</div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AddressPicker;
