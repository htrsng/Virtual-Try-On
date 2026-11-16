import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FiEdit2, FiPlus, FiMapPin, FiUser, FiPhone, FiChevronDown } from 'react-icons/fi';
import AddressPicker from '../../components/AddressPicker';

/**
 * ShippingForm – collapsible receiver-info form.
 *
 * If a saved address exists → compact summary card, expand on "Edit".
 * If no saved address       → show full form by default.
 */
export default function ShippingForm({
    fullName, setFullName,
    phone, setPhone,
    address, setAddress,
    city, setCity,
    district, setDistrict,
    ward, setWard,
    onAddressChange,
    hasSavedAddress,          // boolean — does user already have profile data?
    t,
}) {
    // If user has a saved address, start collapsed; otherwise expanded
    const [expanded, setExpanded] = useState(!hasSavedAddress);
    const [useNewAddress, setUseNewAddress] = useState(false);

    const bodyRef = useRef(null);
    const [bodyHeight, setBodyHeight] = useState(0);

    // Measure inner height for smooth animation
    const measure = useCallback(() => {
        if (bodyRef.current) {
            setBodyHeight(bodyRef.current.scrollHeight);
        }
    }, []);

    useEffect(() => {
        measure();
        // Re-measure on window resize
        window.addEventListener('resize', measure);
        return () => window.removeEventListener('resize', measure);
    }, [measure, fullName, phone, address, city, district, ward, useNewAddress]);

    // Re-expand when user switches to "add another address"
    useEffect(() => {
        if (useNewAddress) setExpanded(true);
    }, [useNewAddress]);

    const hasSummary = fullName && phone && (address || city);

    const toggleExpand = () => {
        measure();
        setExpanded(v => !v);
    };

    const handleEdit = () => {
        setUseNewAddress(false);
        measure();
        setExpanded(true);
    };

    const handleAddNew = () => {
        setUseNewAddress(true);
        // Clear fields for new entry
        setFullName('');
        setPhone('');
        setAddress('');
        setCity('');
        setDistrict('');
        setWard('');
        measure();
        setExpanded(true);
    };

    // Build compact address string
    const addressParts = [address, ward, district, city].filter(Boolean);
    const compactAddress = addressParts.join(', ');

    return (
        <div className="co-shipping">
            {/* Header — always visible */}
            <button
                type="button"
                className="co-shipping__header"
                onClick={toggleExpand}
                aria-expanded={expanded}
            >
                <span className="co-shipping__header-left">
                    <FiMapPin size={16} />
                    <span className="co-shipping__header-title">
                        {t('receiver_info') || 'Thông tin nhận hàng'}
                    </span>
                </span>
                <FiChevronDown
                    size={16}
                    className={`co-shipping__chevron ${expanded ? 'co-shipping__chevron--open' : ''}`}
                />
            </button>

            {/* Compact summary card — visible when collapsed & has data */}
            {!expanded && hasSummary && (
                <div className="co-shipping__summary">
                    <div className="co-shipping__summary-rows">
                        <div className="co-shipping__summary-row">
                            <FiUser size={13} />
                            <span>{fullName}</span>
                        </div>
                        <div className="co-shipping__summary-row">
                            <FiPhone size={13} />
                            <span>{phone}</span>
                        </div>
                        {compactAddress && (
                            <div className="co-shipping__summary-row">
                                <FiMapPin size={13} />
                                <span className="co-shipping__summary-addr">{compactAddress}</span>
                            </div>
                        )}
                    </div>
                    <div className="co-shipping__summary-actions">
                        <button type="button" className="co-shipping__edit-btn" onClick={handleEdit}>
                            <FiEdit2 size={13} /> {t('edit') || 'Sửa'}
                        </button>
                        <button type="button" className="co-shipping__add-btn" onClick={handleAddNew}>
                            <FiPlus size={13} /> {t('add_address') || 'Địa chỉ khác'}
                        </button>
                    </div>
                </div>
            )}

            {/* Expandable form body */}
            <div
                className="co-shipping__body"
                style={{
                    maxHeight: expanded ? bodyHeight + 16 : 0,
                    opacity: expanded ? 1 : 0,
                }}
            >
                <div ref={bodyRef}>
                    <div className="form-group">
                        <label className="form-label">{t('full_name_star')}</label>
                        <input
                            type="text"
                            className="form-input"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder={t('enter_full_name') || 'Nhập họ và tên'}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">{t('phone_star')}</label>
                        <input
                            type="tel"
                            className="form-input"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder={t('enter_phone') || 'Nhập số điện thoại'}
                        />
                    </div>

                    <div className="form-group" style={{ marginTop: '8px' }}>
                        <AddressPicker
                            onAddressChange={onAddressChange}
                            initialCity={city}
                            initialDistrict={district}
                            initialWard={ward}
                            initialAddress={address}
                            showMap={true}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
