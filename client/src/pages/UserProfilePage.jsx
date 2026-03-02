import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { getCities, getDistricts, getWards } from '../data/vietnamAddress';
import '../dashboard-styles.css';

const PRIMARY_COLOR = '#c8a867';

const NAV_GROUPS = [
    {
        title: 'TÀI KHOẢN',
        items: [
            { id: 'profile', label: 'Hồ sơ', icon: '👤' },
            { id: 'address', label: 'Địa chỉ', icon: '📍' },
            { id: 'bank', label: 'Tài khoản ngân hàng', icon: '🏦' },
            { id: 'change-password', label: 'Đổi mật khẩu', icon: '🔑' },
            { id: 'security', label: 'Bảo mật (2FA)', icon: '🛡️' },
        ],
    },
    {
        title: 'ĐƠN HÀNG',
        items: [
            { id: 'orders', label: 'Đơn hàng của tôi', icon: '📦' },
            { id: 'reviews', label: 'Đánh giá', icon: '⭐' },
        ],
    },
    {
        title: 'ƯU ĐÃI',
        items: [
            { id: 'vouchers', label: 'Voucher', icon: '🎟️' },
            { id: 'wishlist', label: 'Yêu thích', icon: '❤️' },
        ],
    },
    {
        title: 'KHÁC',
        items: [
            { id: 'notifications', label: 'Thông báo', icon: '🔔' },
            { id: 'support', label: 'Hỗ trợ', icon: '📞' },
            { id: 'policies', label: 'Chính sách', icon: '📋' },
        ],
    },
];

function SectionShell({ title, description, children, actions }) {
    return (
        <div
            style={{
                background: '#fff',
                borderRadius: 14,
                border: '1px solid #ece7df',
                boxShadow: '0 2px 8px rgba(31, 26, 23, 0.05)',
                overflow: 'hidden',
            }}
        >
            <div style={{ padding: '20px 22px', borderBottom: '1px solid #f1ede7', display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                <div>
                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#1f1a17' }}>{title}</h3>
                    {description && <p style={{ margin: '6px 0 0', fontSize: 13, color: '#7f776f' }}>{description}</p>}
                </div>
                {actions}
            </div>
            <div style={{ padding: 22 }}>{children}</div>
        </div>
    );
}

function EmptySection({ icon, title, description, cta }) {
    return (
        <div style={{ textAlign: 'center', padding: '24px 10px 20px' }}>
            <div style={{ fontSize: 38, marginBottom: 10 }}>{icon}</div>
            <h4 style={{ margin: 0, fontSize: 16, color: '#1f1a17' }}>{title}</h4>
            <p style={{ margin: '8px auto 16px', maxWidth: 380, color: '#80786f', fontSize: 13, lineHeight: 1.5 }}>{description}</p>
            {cta}
        </div>
    );
}

function SecurityRow({ icon, title, subtitle, right, onClick, borderBottom = true }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="transition-all duration-200"
            style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                textAlign: 'left',
                padding: '14px 0',
                background: 'transparent',
                border: 'none',
                borderBottom: borderBottom ? '1px solid #f1ede7' : 'none',
                cursor: onClick ? 'pointer' : 'default',
            }}
        >
            <span style={{ width: 34, height: 34, borderRadius: 8, background: '#f7f4ef', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</span>
            <div style={{ flex: 1 }}>
                <p style={{ margin: 0, color: '#1f1a17', fontSize: 14, fontWeight: 600 }}>{title}</p>
                {subtitle && <p style={{ margin: '4px 0 0', color: '#7f776f', fontSize: 12 }}>{subtitle}</p>}
            </div>
            {right}
        </button>
    );
}

function UserProfilePage({ showToast }) {
    const navigate = useNavigate();
    const { user, isAuthenticated, updateProfile } = useAuth();
    const { t } = useLanguage();

    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [city, setCity] = useState('');
    const [district, setDistrict] = useState('');
    const [ward, setWard] = useState('');

    const [isEditing, setIsEditing] = useState(false);
    const [editingField, setEditingField] = useState(null);

    const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
    const [twoFA, setTwoFA] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [activeSection, setActiveSection] = useState('profile');
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

    const [cities] = useState(getCities());
    const [districts, setDistricts] = useState([]);
    const [wards, setWards] = useState([]);

    useEffect(() => {
        if (city) {
            const districtList = getDistricts(city);
            setDistricts(districtList);
            if (!districtList.includes(district)) {
                setDistrict('');
                setWard('');
            }
        } else {
            setDistricts([]);
            setWards([]);
        }
    }, [city]);

    useEffect(() => {
        if (city && district) {
            const wardList = getWards(city, district);
            setWards(wardList);
            if (!wardList.includes(ward)) {
                setWard('');
            }
        } else {
            setWards([]);
        }
    }, [city, district]);

    useEffect(() => {
        if (!isAuthenticated) {
            showToast(t('please_login_page'), 'warning');
            navigate('/login');
            return;
        }

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
            ward,
        });

        if (result.success) {
            showToast(result.message, 'success');
            setIsEditing(false);
            setEditingField(null);
        } else {
            showToast(result.message, 'error');
        }
    };

    const closePasswordModal = () => {
        setShowChangePasswordModal(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
    };

    const handleSelectSection = (id) => {
        if (id === 'change-password') {
            setShowChangePasswordModal(true);
            setActiveSection('security');
            return;
        }

        setActiveSection(id);
        setMobileSidebarOpen(false);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('currentUser');
        showToast('Đã đăng xuất thành công', 'success');
        navigate('/login');
    };

    const renderSection = () => {
        if (activeSection === 'profile') {
            return (
                <SectionShell
                    title={t('personal_info') || 'Thông tin cá nhân'}
                    description="Cập nhật thông tin tài khoản và liên hệ của bạn"
                    actions={
                        <div style={{ display: 'flex', gap: 8 }}>
                            {(isEditing || editingField) && (
                                <button
                                    type="button"
                                    onClick={() => { setIsEditing(false); setEditingField(null); }}
                                    className="transition-all duration-200"
                                    style={{ border: '1px solid #e1dbd3', background: '#fff', color: '#6f665d', borderRadius: 8, padding: '8px 12px', cursor: 'pointer' }}
                                >
                                    Hủy
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => { setIsEditing(!isEditing); setEditingField(null); }}
                                className="transition-all duration-200"
                                style={{ border: `1px solid ${PRIMARY_COLOR}`, background: isEditing ? PRIMARY_COLOR : '#fff', color: isEditing ? '#fff' : PRIMARY_COLOR, borderRadius: 8, padding: '8px 12px', cursor: 'pointer', fontWeight: 600 }}
                            >
                                {isEditing ? 'Đang chỉnh sửa' : 'Chỉnh sửa'}
                            </button>
                        </div>
                    }
                >
                    <form onSubmit={handleUpdateProfile} style={{ display: 'grid', gap: 14 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                            <div>
                                <label style={{ display: 'block', fontSize: 12, marginBottom: 6, color: '#6f665d', fontWeight: 600 }}>Họ tên</label>
                                {(isEditing || editingField === 'fullName') ? (
                                    <input className="dashboard-input" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                                ) : (
                                    <div style={{ border: '1px solid #ece7df', borderRadius: 8, padding: '11px 12px', fontSize: 14, color: '#1f1a17' }}>{fullName || '—'}</div>
                                )}
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 12, marginBottom: 6, color: '#6f665d', fontWeight: 600 }}>Số điện thoại</label>
                                {(isEditing || editingField === 'phone') ? (
                                    <input className="dashboard-input" value={phone} onChange={(e) => setPhone(e.target.value)} />
                                ) : (
                                    <div style={{ border: '1px solid #ece7df', borderRadius: 8, padding: '11px 12px', fontSize: 14, color: '#1f1a17' }}>{phone || '—'}</div>
                                )}
                            </div>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: 12, marginBottom: 6, color: '#6f665d', fontWeight: 600 }}>Email</label>
                            <div style={{ border: '1px solid #ece7df', borderRadius: 8, padding: '11px 12px', fontSize: 14, color: '#1f1a17', background: '#faf9f7' }}>{user?.email || '—'}</div>
                        </div>
                        {(isEditing || editingField) && (
                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <button type="submit" className="transition-all duration-200" style={{ border: 'none', background: PRIMARY_COLOR, color: '#fff', borderRadius: 8, padding: '10px 16px', cursor: 'pointer', fontWeight: 600 }}>
                                    Lưu thông tin
                                </button>
                            </div>
                        )}
                    </form>
                </SectionShell>
            );
        }

        if (activeSection === 'address') {
            return (
                <SectionShell title="Địa chỉ" description="Quản lý địa chỉ giao hàng mặc định">
                    <form onSubmit={handleUpdateProfile} style={{ display: 'grid', gap: 14 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                            <div className="dashboard-form-group">
                                <label>Thành phố</label>
                                <select value={city} onChange={(e) => setCity(e.target.value)} className="dashboard-select">
                                    <option value="">Chọn thành phố</option>
                                    {cities.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className="dashboard-form-group">
                                <label>Quận/Huyện</label>
                                <select value={district} onChange={(e) => setDistrict(e.target.value)} disabled={!city} className="dashboard-select">
                                    <option value="">Chọn quận/huyện</option>
                                    {districts.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>
                            <div className="dashboard-form-group">
                                <label>Phường/Xã</label>
                                <select value={ward} onChange={(e) => setWard(e.target.value)} disabled={!district} className="dashboard-select">
                                    <option value="">Chọn phường/xã</option>
                                    {wards.map(w => <option key={w} value={w}>{w}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="dashboard-form-group full-width">
                            <label>Địa chỉ chi tiết</label>
                            <input
                                type="text"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                placeholder="Số nhà, tên đường..."
                                className="dashboard-input"
                            />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button type="submit" className="transition-all duration-200" style={{ border: 'none', background: PRIMARY_COLOR, color: '#fff', borderRadius: 8, padding: '10px 16px', cursor: 'pointer', fontWeight: 600 }}>
                                Lưu địa chỉ
                            </button>
                        </div>
                    </form>
                </SectionShell>
            );
        }

        if (activeSection === 'bank') {
            return (
                <SectionShell title="Tài khoản ngân hàng" description="Liên kết tài khoản để thanh toán nhanh hơn">
                    <EmptySection
                        icon="🏦"
                        title="Chưa liên kết ngân hàng"
                        description="Thêm tài khoản ngân hàng để thanh toán đơn hàng thuận tiện hơn."
                        cta={<button type="button" className="transition-all duration-200" style={{ border: 'none', background: PRIMARY_COLOR, color: '#fff', borderRadius: 8, padding: '10px 16px', cursor: 'pointer', fontWeight: 600 }}>Thêm tài khoản</button>}
                    />
                </SectionShell>
            );
        }

        if (activeSection === 'orders') {
            return (
                <SectionShell title="Đơn hàng của tôi" description="Theo dõi trạng thái và lịch sử mua hàng">
                    <EmptySection
                        icon="📦"
                        title="Chưa có đơn hàng"
                        description="Bạn chưa có đơn hàng nào. Khi mua sắm, lịch sử đơn hàng sẽ hiển thị tại đây."
                        cta={<button type="button" className="transition-all duration-200" style={{ border: `1px solid ${PRIMARY_COLOR}`, background: '#fff', color: PRIMARY_COLOR, borderRadius: 8, padding: '10px 16px', cursor: 'pointer', fontWeight: 600 }}>Mua sắm ngay</button>}
                    />
                </SectionShell>
            );
        }

        if (activeSection === 'reviews') {
            return (
                <SectionShell title="Đánh giá" description="Quản lý các đánh giá sản phẩm đã mua">
                    <EmptySection
                        icon="⭐"
                        title="Chưa có đánh giá"
                        description="Chia sẻ trải nghiệm của bạn sau mỗi đơn hàng để giúp người mua khác."
                        cta={<button type="button" className="transition-all duration-200" style={{ border: 'none', background: PRIMARY_COLOR, color: '#fff', borderRadius: 8, padding: '10px 16px', cursor: 'pointer', fontWeight: 600 }}>Viết đánh giá</button>}
                    />
                </SectionShell>
            );
        }

        if (activeSection === 'vouchers') {
            return (
                <SectionShell title="Voucher" description="Lưu và sử dụng ưu đãi của bạn">
                    <EmptySection
                        icon="🎟️"
                        title="Chưa có voucher"
                        description="Khám phá voucher mới để tối ưu giá trị đơn hàng của bạn."
                        cta={<button type="button" className="transition-all duration-200" style={{ border: 'none', background: PRIMARY_COLOR, color: '#fff', borderRadius: 8, padding: '10px 16px', cursor: 'pointer', fontWeight: 600 }}>Khám phá voucher</button>}
                    />
                </SectionShell>
            );
        }

        if (activeSection === 'wishlist') {
            return (
                <SectionShell title="Danh sách yêu thích" description="Danh sách sản phẩm bạn quan tâm">
                    <EmptySection
                        icon="❤️"
                        title="Danh sách yêu thích đang trống"
                        description="Lưu sản phẩm yêu thích để xem lại nhanh chóng và không bỏ lỡ ưu đãi."
                        cta={<button type="button" className="transition-all duration-200" style={{ border: `1px solid ${PRIMARY_COLOR}`, background: '#fff', color: PRIMARY_COLOR, borderRadius: 8, padding: '10px 16px', cursor: 'pointer', fontWeight: 600 }}>Khám phá sản phẩm</button>}
                    />
                </SectionShell>
            );
        }

        if (activeSection === 'notifications') {
            return (
                <SectionShell title="Thông báo" description="Cấu hình các thông báo tài khoản và đơn hàng">
                    <div style={{ display: 'grid', gap: 10 }}>
                        <SecurityRow title="Thông báo đơn hàng" subtitle="Nhận trạng thái đơn qua email" icon="📦" borderBottom />
                        <SecurityRow title="Khuyến mãi" subtitle="Nhận mã giảm giá và ưu đãi mới" icon="🎁" borderBottom={false} />
                    </div>
                </SectionShell>
            );
        }

        if (activeSection === 'support') {
            return (
                <SectionShell title="Hỗ trợ" description="Kết nối nhanh với đội ngũ chăm sóc khách hàng">
                    <div style={{ display: 'grid', gap: 10 }}>
                        <button type="button" className="transition-all duration-200" style={{ textAlign: 'left', border: '1px solid #ece7df', background: '#fff', borderRadius: 10, padding: '12px 14px', cursor: 'pointer' }}>📞 Liên hệ hỗ trợ</button>
                        <button type="button" className="transition-all duration-200" style={{ textAlign: 'left', border: '1px solid #ece7df', background: '#fff', borderRadius: 10, padding: '12px 14px', cursor: 'pointer' }}>❓ Câu hỏi thường gặp</button>
                    </div>
                </SectionShell>
            );
        }

        if (activeSection === 'policies') {
            return (
                <SectionShell title="Chính sách" description="Tra cứu điều khoản và chính sách áp dụng">
                    <div style={{ display: 'grid', gap: 10 }}>
                        <button type="button" className="transition-all duration-200" style={{ textAlign: 'left', border: '1px solid #ece7df', background: '#fff', borderRadius: 10, padding: '12px 14px', cursor: 'pointer' }}>📋 Chính sách mua hàng</button>
                        <button type="button" className="transition-all duration-200" style={{ textAlign: 'left', border: '1px solid #ece7df', background: '#fff', borderRadius: 10, padding: '12px 14px', cursor: 'pointer' }}>🔐 Chính sách bảo mật</button>
                    </div>
                </SectionShell>
            );
        }

        return (
            <SectionShell title="Bảo mật" description="Quản lý mật khẩu, xác thực 2 lớp và nhật ký hoạt động">
                <div style={{ display: 'grid' }}>
                    <SecurityRow
                        icon="🔑"
                        title="Đổi mật khẩu"
                        subtitle="Cập nhật mật khẩu để bảo vệ tài khoản"
                        onClick={() => setShowChangePasswordModal(true)}
                        right={<span style={{ color: '#b1a79c' }}>›</span>}
                    />
                    <SecurityRow
                        icon="🛡️"
                        title="Xác thực 2 lớp (2FA)"
                        subtitle="Bật mã xác minh khi đăng nhập"
                        right={
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setTwoFA(prev => !prev); }}
                                className="transition-all duration-200"
                                style={{
                                    width: 46,
                                    height: 25,
                                    borderRadius: 100,
                                    border: 'none',
                                    cursor: 'pointer',
                                    background: twoFA ? PRIMARY_COLOR : '#d9d2c9',
                                    position: 'relative',
                                }}
                            >
                                <span style={{ position: 'absolute', top: 2.5, left: twoFA ? 23 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left .2s ease' }} />
                            </button>
                        }
                    />
                    <SecurityRow
                        icon="📋"
                        title="Nhật ký hoạt động"
                        subtitle="Theo dõi đăng nhập và thao tác gần đây"
                        borderBottom={false}
                        right={<span style={{ color: '#b1a79c' }}>›</span>}
                    />
                </div>
            </SectionShell>
        );
    };

    return (
        <div className="user-dashboard-page" style={{ background: '#f9f8f6', minHeight: '100vh' }}>
            <div style={{ maxWidth: 1240, margin: '0 auto', padding: '18px 16px 32px' }}>
                <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                    <h1 style={{ margin: 0, fontSize: 22, color: '#1f1a17' }}>Tài khoản của tôi</h1>
                    <button
                        type="button"
                        onClick={() => setMobileSidebarOpen(prev => !prev)}
                        className="transition-all duration-200"
                        style={{ border: '1px solid #e2ddd5', borderRadius: 8, background: '#fff', padding: '8px 12px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}
                    >
                        ☰ Danh mục
                    </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 18 }}>
                    <aside
                        style={{
                            background: '#fff',
                            border: '1px solid #ece7df',
                            borderRadius: 14,
                            boxShadow: '0 2px 8px rgba(31, 26, 23, 0.04)',
                            padding: 14,
                            height: 'fit-content',
                            position: 'sticky',
                            top: 12,
                            display: mobileSidebarOpen ? 'block' : undefined,
                        }}
                    >
                        {NAV_GROUPS.map((group) => (
                            <div key={group.title} style={{ marginBottom: 14 }}>
                                <p style={{ margin: '4px 8px 8px', fontSize: 11, fontWeight: 700, color: '#8f867d', letterSpacing: 0.8 }}>{group.title}</p>
                                <div style={{ display: 'grid', gap: 4 }}>
                                    {group.items.map((item) => {
                                        const active = activeSection === item.id || (item.id === 'change-password' && activeSection === 'security');
                                        return (
                                            <button
                                                key={item.id}
                                                type="button"
                                                onClick={() => handleSelectSection(item.id)}
                                                className="transition-all duration-200"
                                                style={{
                                                    border: 'none',
                                                    borderRadius: 10,
                                                    background: active ? '#f3efe7' : 'transparent',
                                                    color: active ? '#1f1a17' : '#5e554d',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    gap: 10,
                                                    padding: '10px 10px',
                                                    cursor: 'pointer',
                                                    fontSize: 14,
                                                    fontWeight: active ? 600 : 500,
                                                }}
                                            >
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                                                    <span>{item.icon}</span>
                                                    {item.label}
                                                </span>
                                                <span style={{ color: '#b3a99f' }}>›</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </aside>

                    <main style={{ minWidth: 0, display: 'grid', gap: 16 }}>
                        {renderSection()}
                    </main>
                </div>
            </div>

            {showChangePasswordModal && (
                <div
                    onClick={closePasswordModal}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.45)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        padding: 16,
                        zIndex: 9999,
                    }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            width: '100%',
                            maxWidth: 430,
                            background: '#fff',
                            borderRadius: 14,
                            border: '1px solid #ece7df',
                            boxShadow: '0 12px 40px rgba(0,0,0,0.16)',
                            padding: 20,
                        }}
                    >
                        <h3 style={{ margin: '0 0 6px', fontSize: 18, color: '#1f1a17' }}>Đổi mật khẩu</h3>
                        <p style={{ margin: '0 0 14px', fontSize: 13, color: '#7f776f' }}>Nhập đầy đủ thông tin để cập nhật mật khẩu</p>

                        <div style={{ display: 'grid', gap: 10 }}>
                            <input type="password" className="dashboard-input" placeholder="Mật khẩu hiện tại" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                            <input type="password" className="dashboard-input" placeholder="Mật khẩu mới" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                            <input type="password" className="dashboard-input" placeholder="Xác nhận mật khẩu mới" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                        </div>

                        {newPassword && (
                            <p style={{ margin: '10px 0 0', fontSize: 12, color: newPassword.length < 6 ? '#d9534f' : '#3c8c63' }}>
                                Độ mạnh mật khẩu: {newPassword.length < 6 ? 'Yếu' : newPassword.length < 10 ? 'Trung bình' : 'Mạnh'}
                            </p>
                        )}

                        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                            <button type="button" onClick={closePasswordModal} className="transition-all duration-200" style={{ flex: 1, border: '1px solid #e2ddd5', borderRadius: 8, background: '#fff', padding: '10px 12px', cursor: 'pointer' }}>
                                Hủy
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    if (!currentPassword || !newPassword || !confirmPassword) {
                                        showToast && showToast('Vui lòng điền đầy đủ thông tin', 'error');
                                        return;
                                    }
                                    if (newPassword !== confirmPassword) {
                                        showToast && showToast('Mật khẩu xác nhận không khớp', 'error');
                                        return;
                                    }
                                    if (newPassword.length < 6) {
                                        showToast && showToast('Mật khẩu phải có ít nhất 6 ký tự', 'error');
                                        return;
                                    }

                                    showToast && showToast('Đổi mật khẩu thành công!', 'success');
                                    closePasswordModal();
                                }}
                                className="transition-all duration-200"
                                style={{ flex: 1, border: 'none', borderRadius: 8, background: PRIMARY_COLOR, color: '#fff', padding: '10px 12px', cursor: 'pointer', fontWeight: 600 }}
                            >
                                Xác nhận
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @media (max-width: 1023px) {
                    .user-dashboard-page aside {
                        position: fixed !important;
                        top: 0;
                        left: 0;
                        bottom: 0;
                        width: 280px;
                        z-index: 9998;
                        border-radius: 0 !important;
                        overflow-y: auto;
                    }

                    .user-dashboard-page [style*="grid-template-columns: 280px 1fr"] {
                        grid-template-columns: 1fr !important;
                    }

                    .user-dashboard-page aside:not([style*="display: block"]) {
                        display: none !important;
                    }
                }
            `}</style>
        </div>
    );
}

export default UserProfilePage;