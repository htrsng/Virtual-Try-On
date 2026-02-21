import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import MapPicker from '../components/MapPicker';
import { getCities, getDistricts, getWards } from '../data/vietnamAddress';
import axios from 'axios';
import '../dashboard-styles.css';

function UserProfilePage({ showToast }) {
    const navigate = useNavigate();
    const { user, isAuthenticated, updateProfile } = useAuth();
    const { t } = useLanguage();

    // Thông tin người dùng để chỉnh sửa
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [city, setCity] = useState('');
    const [district, setDistrict] = useState('');
    const [ward, setWard] = useState('');

    const [isEditing, setIsEditing] = useState(false);

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
    }, [user, isAuthenticated, navigate, t, showToast]);

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

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('currentUser');
        showToast('Đã đăng xuất thành công', 'success');
        navigate('/login');
    };

    return (
        <div className="user-dashboard-page">
            {/* Header Compact */}
            <div className="dashboard-header">
                <div className="dashboard-header-content">
                    <div className="dashboard-user-intro">
                        <div className="dashboard-avatar">👤</div>
                        <div className="dashboard-user-info">
                            <h2>{user?.fullName || user?.email}</h2>
                            <p>{user?.email}</p>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="dashboard-logout-btn">
                        🚪 {t('logout') || 'Đăng xuất'}
                    </button>
                </div>
            </div>

            {/* Main Grid Layout */}
            <div className="dashboard-grid-container">
                {/* Left Column - Personal Info */}
                <div className="dashboard-section dashboard-personal-info">
                    <div className="dashboard-section-header">
                        <h3>📋 {t('personal_info') || 'Thông tin cá nhân'}</h3>
                        <button
                            onClick={() => setIsEditing(!isEditing)}
                            className={`dashboard-edit-btn ${isEditing ? 'cancel' : ''}`}
                        >
                            {isEditing ? '❌ Hủy' : '✏️ Sửa'}
                        </button>
                    </div>

                    <form onSubmit={handleUpdateProfile} className="dashboard-form">
                        <div className="dashboard-form-group">
                            <label>Họ tên</label>
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                disabled={!isEditing}
                                className="dashboard-input"
                            />
                        </div>

                        <div className="dashboard-form-group">
                            <label>Số điện thoại</label>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                disabled={!isEditing}
                                className="dashboard-input"
                            />
                        </div>

                        <div className="dashboard-form-group">
                            <label>Thành phố</label>
                            <select
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                                disabled={!isEditing}
                                className="dashboard-select"
                            >
                                <option value="">Chọn thành phố</option>
                                {cities.map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>

                        <div className="dashboard-form-group">
                            <label>Quận/Huyện</label>
                            <select
                                value={district}
                                onChange={(e) => setDistrict(e.target.value)}
                                disabled={!isEditing || !city}
                                className="dashboard-select"
                            >
                                <option value="">Chọn quận</option>
                                {districts.map(d => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                            </select>
                        </div>

                        <div className="dashboard-form-group">
                            <label>Phường/Xã</label>
                            <select
                                value={ward}
                                onChange={(e) => setWard(e.target.value)}
                                disabled={!isEditing || !district}
                                className="dashboard-select"
                            >
                                <option value="">Chọn phường</option>
                                {wards.map(w => (
                                    <option key={w} value={w}>{w}</option>
                                ))}
                            </select>
                        </div>

                        <div className="dashboard-form-group full-width">
                            <label>Địa chỉ chi tiết</label>
                            <input
                                type="text"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                disabled={!isEditing}
                                placeholder="Nhập địa chỉ..."
                                className="dashboard-input"
                            />
                        </div>

                        {isEditing && (
                            <button type="submit" className="dashboard-save-btn">
                                💾 Lưu thông tin
                            </button>
                        )}
                    </form>
                </div>

                {/* Right Column - Grid 2x2 */}
                <div className="dashboard-right-column">
                    {/* Banking */}
                    <div className="dashboard-section dashboard-card">
                        <div className="dashboard-card-header">
                            <h3>💳 Tài khoản ngân hàng</h3>
                        </div>
                        <div className="dashboard-card-body">
                            <p className="dashboard-empty-text">Chưa có tài khoản ngân hàng</p>
                            <button type="button" className="dashboard-card-btn">➕ Thêm tài khoản</button>
                        </div>
                    </div>

                    {/* Vouchers */}
                    <div className="dashboard-section dashboard-card">
                        <div className="dashboard-card-header">
                            <h3>🎟️ Voucher yêu thích</h3>
                        </div>
                        <div className="dashboard-card-body">
                            <p className="dashboard-empty-text">Chưa có voucher nào</p>
                            <button type="button" className="dashboard-card-btn">🎁 Khám phá voucher</button>
                        </div>
                    </div>

                    {/* Wishlist */}
                    <div className="dashboard-section dashboard-card">
                        <div className="dashboard-card-header">
                            <h3>❤️ Danh mục yêu thích</h3>
                        </div>
                        <div className="dashboard-card-body">
                            <p className="dashboard-empty-text">Danh sách rỗng</p>
                            <button type="button" className="dashboard-card-btn">👁️ Xem wishlist</button>
                        </div>
                    </div>

                    {/* Reviews */}
                    <div className="dashboard-section dashboard-card">
                        <div className="dashboard-card-header">
                            <h3>⭐ Đánh giá & Nhận xét</h3>
                        </div>
                        <div className="dashboard-card-body">
                            <p className="dashboard-empty-text">Chưa có đánh giá</p>
                            <button type="button" className="dashboard-card-btn">✍️ Viết đánh giá</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Section - Security & Support */}
            <div className="dashboard-bottom-section">
                <div className="dashboard-section dashboard-security">
                    <h3>🔒 Bảo mật & Riêng tư</h3>
                    <div className="dashboard-security-items">
                        <div className="dashboard-security-item">
                            <span>Đổi mật khẩu</span>
                            <button type="button" className="dashboard-link-btn">→</button>
                        </div>
                        <div className="dashboard-security-item">
                            <span>Xác thực 2 lớp</span>
                            <button type="button" className="dashboard-link-btn">→</button>
                        </div>
                        <div className="dashboard-security-item">
                            <span>Nhật ký hoạt động</span>
                            <button type="button" className="dashboard-link-btn">→</button>
                        </div>
                    </div>
                </div>

                <div className="dashboard-section dashboard-support">
                    <h3>⚙️ Hỗ trợ & Khác</h3>
                    <div className="dashboard-support-items">
                        <button type="button" className="dashboard-support-btn">📞 Liên hệ hỗ trợ</button>
                        <button type="button" className="dashboard-support-btn">📋 Chính sách</button>
                        <button type="button" className="dashboard-support-btn">❓ Câu hỏi thường gặp</button>
                    </div>                </div>
            </div>
        </div>
    );
}

export default UserProfilePage;