import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import MapPicker from '../components/MapPicker';
import { getCities, getDistricts, getWards } from '../data/vietnamAddress';
import axios from 'axios';

function UserProfilePage({ showToast }) {
    const navigate = useNavigate();
    const { user, isAuthenticated, updateProfile } = useAuth();
    const { t } = useLanguage();

    const [activeTab, setActiveTab] = useState('profile'); // apenas 'profile'

    // Thông tin người dùng để chỉnh sửa
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [city, setCity] = useState('');
    const [district, setDistrict] = useState('');
    const [ward, setWard] = useState('');

    const [isEditing, setIsEditing] = useState(false);
    const [showMapPicker, setShowMapPicker] = useState(false);

    // Danh sách dropdown
    const [cities] = useState(getCities());
    const [districts, setDistricts] = useState([]);
    const [wards, setWards] = useState([]);

    // Cập nhật districts khi chọn city
    useEffect(() => {
        if (city) {
            const districtList = getDistricts(city);
            setDistricts(districtList);
            // Reset district và ward nếu không hợp lệ
            if (!districtList.includes(district)) {
                setDistrict('');
                setWard('');
            }
        } else {
            setDistricts([]);
            setWards([]);
        }
    }, [city]);

    // Cập nhật wards khi chọn district
    useEffect(() => {
        if (city && district) {
            const wardList = getWards(city, district);
            setWards(wardList);
            // Reset ward nếu không hợp lệ
            if (!wardList.includes(ward)) {
                setWard('');
            }
        } else {
            setWards([]);
        }
    }, [city, district]);

    useEffect(() => {
        if (!isAuthenticated) {
            showToast(t('please_login_page'), "warning");
            navigate('/login');
            return;
        }

        // Load thông tin user
        if (user) {
            setFullName(user.fullName || '');
            setPhone(user.phone || '');
            setAddress(user.address || '');
            setCity(user.city || '');
            setDistrict(user.district || '');
            setWard(user.ward || '');
        }
    }, [user, isAuthenticated]);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();

        const result = await updateProfile({
            fullName,
            phone,
            address,
            city,
            district,
            ward
        });

        if (result.success) {
            showToast(result.message, 'success');
            setIsEditing(false);
        } else {
            showToast(result.message, 'error');
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Đang xử lý': return '#ffa726';
            case 'Đã giao': return '#66bb6a';
            case 'Đã hủy': return '#ef5350';
            default: return '#999';
        }
    };

    return (
        <div className="container user-profile-page">
            <div className="user-profile-shell">
                {/* Header */}
                <div className="user-profile-hero">
                    <div className="user-profile-hero-inner">
                        <div className="user-profile-avatar">👤</div>
                        <div className="user-profile-info">
                            <h2>{user?.fullName || user?.email}</h2>
                            <p>📧 {user?.email}</p>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="user-profile-tabs">
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`user-profile-tab ${activeTab === 'profile' ? 'active' : ''}`}
                    >
                        📝 {t('personal_info')}
                    </button>
                </div>

                {/* Content */}
                <div className="user-profile-content">
                    {activeTab === 'profile' && (
                        <div>
                            <div className="profile-section-header">
                                <h3 className="profile-section-title">{t('personal_info')}</h3>
                                <button
                                    onClick={() => setIsEditing(!isEditing)}
                                    className={`profile-edit-btn ${isEditing ? 'danger' : ''}`}
                                >
                                    {isEditing ? `❌ ${t('cancel')}` : `✏️ ${t('edit')}`}
                                </button>
                            </div>

                            <form onSubmit={handleUpdateProfile}>
                                <div className="profile-grid">
                                    <div className="profile-field">
                                        <label className="profile-label">
                                            {t('full_name')}
                                        </label>
                                        <input
                                            type="text"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            disabled={!isEditing}
                                            className="profile-input"
                                        />
                                    </div>

                                    <div className="profile-field">
                                        <label className="profile-label">
                                            {t('phone')}
                                        </label>
                                        <input
                                            type="tel"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            disabled={!isEditing}
                                            className="profile-input"
                                        />
                                    </div>

                                    <div className="profile-field">
                                        <label className="profile-label">
                                            {t('city')} <span style={{ color: 'red' }}>*</span>
                                        </label>
                                        <select
                                            value={city}
                                            onChange={(e) => setCity(e.target.value)}
                                            disabled={!isEditing}
                                            className="profile-select"
                                        >
                                            <option value="">{t('select_city')}</option>
                                            {cities.map(c => (
                                                <option key={c} value={c}>{c}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="profile-field">
                                        <label className="profile-label">
                                            {t('district')} <span style={{ color: 'red' }}>*</span>
                                        </label>
                                        <select
                                            value={district}
                                            onChange={(e) => setDistrict(e.target.value)}
                                            disabled={!isEditing || !city}
                                            className="profile-select"
                                        >
                                            <option value="">{t('select_district')}</option>
                                            {districts.map(d => (
                                                <option key={d} value={d}>{d}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="profile-field">
                                        <label className="profile-label">
                                            {t('ward')} <span style={{ color: 'red' }}>*</span>
                                        </label>
                                        <select
                                            value={ward}
                                            onChange={(e) => setWard(e.target.value)}
                                            disabled={!isEditing || !district}
                                            className="profile-select"
                                        >
                                            <option value="">{t('select_ward')}</option>
                                            {wards.map(w => (
                                                <option key={w} value={w}>{w}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="profile-field full">
                                        <label className="profile-label">
                                            {t('street_address')} <span style={{ color: 'red' }}>*</span>
                                        </label>
                                        <div className="profile-input-wrapper">
                                            <input
                                                type="text"
                                                value={address}
                                                onChange={(e) => setAddress(e.target.value)}
                                                disabled={!isEditing}
                                                placeholder={isEditing ? t('street_placeholder') : ""}
                                                className={`profile-input ${!isEditing && address ? 'has-action' : ''}`}
                                            />
                                            {!isEditing && address && city && district && ward && (
                                                <button
                                                    type="button"
                                                    onClick={() => setShowMapPicker(!showMapPicker)}
                                                    className="profile-map-btn"
                                                    title={t('view_on_map')}
                                                >
                                                    📍
                                                </button>
                                            )}
                                        </div>
                                        {showMapPicker && !isEditing && address && city && district && ward && (
                                            <div className="profile-map">
                                                <MapPicker address={`${address}, ${ward}, ${district}, ${city}`} />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {isEditing && (
                                    <button
                                        type="submit"
                                        className="profile-save-btn"
                                    >
                                        💾 {t('save_info')}
                                    </button>
                                )}
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default UserProfilePage;
