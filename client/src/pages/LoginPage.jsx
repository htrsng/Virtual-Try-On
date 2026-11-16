import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function LoginPage({ showToast }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { login, register, isAuthenticated } = useAuth();

    const [isRegister, setIsRegister] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPass, setConfirmPass] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Thông tin bổ sung cho đăng ký
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');

    useEffect(() => {
        // Nếu đã đăng nhập, chuyển về trang chủ
        if (isAuthenticated) {
            navigate('/');
        }

        if (location.state && location.state.mode === 'register') {
            setIsRegister(true);
        } else {
            setIsRegister(false);
        }
    }, [location, isAuthenticated, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email || !password) {
            showToast("Vui lòng nhập đầy đủ thông tin!", "warning");
            return;
        }

        if (isRegister) {
            if (password !== confirmPass) {
                showToast("Mật khẩu nhập lại không khớp!", "warning");
                return;
            }

            if (password.length < 6) {
                showToast("Mật khẩu phải có ít nhất 6 ký tự!", "warning");
                return;
            }

            // Đăng ký
            const result = await register(email, password, fullName, phone, address);

            if (result.success) {
                showToast(result.message, "success");

                // Reload trang để load lại sản phẩm từ đầu cho user mới
                setTimeout(() => {
                    window.location.href = '/'; // Force reload
                }, 1000);
            } else {
                showToast(result.message, "error");
            }

        } else {
            // Đăng nhập
            const result = await login(email, password);

            if (result.success) {
                showToast(result.message, "success");

                // Reload trang để load lại sản phẩm từ đầu cho user mới
                setTimeout(() => {
                    window.location.href = '/'; // Force reload
                }, 1000);
            } else {
                showToast(result.message, "error");
            }
        }
    };

    const resetForm = () => {
        setEmail('');
        setPassword('');
        setConfirmPass('');
        setFullName('');
        setPhone('');
        setAddress('');
    };

    return (
        <div className="modern-auth-container">
            <div className="auth-split-wrapper">
                
                {/* LEFT SIDEBAR */}
                <div className="auth-sidebar" key={`sidebar-${isRegister}`}>
                    <div className="auth-logo">VFitAI</div>
                    <div className="auth-subtitle">Thử đồ 3D - AI Stylist</div>
                    
                    <h2 className="auth-sidebar-title">
                        {isRegister ? 'Bắt đầu hành trình thời trang thông minh' : 'Chào mừng trở lại!'}
                    </h2>
                    
                    <p className="auth-sidebar-desc">
                        {isRegister 
                            ? 'Tạo tài khoản miễn phí và khám phá cách AI thay đổi cách bạn mua sắm.' 
                            : 'Đăng nhập để tiếp tục trải nghiệm mua sắm thông minh với AI & 3D.'}
                    </p>
                    
                    <div className="auth-features-list">
                        <div className="auth-feature-item">
                            <div className="auth-feature-icon">✦</div>
                            <div className="auth-feature-text">
                                <h4>AI Outfit Generator</h4>
                                <p>Gợi ý outfit cá nhân hóa mỗi ngày</p>
                            </div>
                        </div>
                        <div className="auth-feature-item">
                            <div className="auth-feature-icon">✦</div>
                            <div className="auth-feature-text">
                                <h4>Phòng thử đồ 3D</h4>
                                <p>Thử quần áo trước khi mua</p>
                            </div>
                        </div>
                        <div className="auth-feature-item">
                            <div className="auth-feature-icon">✦</div>
                            <div className="auth-feature-text">
                                <h4>Tủ đồ cá nhân</h4>
                                <p>Lưu lại phối đồ đã mua bất cứ lúc nào</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="auth-sidebar-footer">
                        © 2026 VFitAI - Bảo mật SSL
                    </div>
                </div>

                {/* RIGHT FORM AREA */}
                <div className="auth-form-area" key={`form-${isRegister}`}>
                    <div className="auth-form-header">
                        <h2 className="auth-form-title">
                            {isRegister ? 'Tạo tài khoản' : 'Đăng nhập'}
                        </h2>
                        <p className="auth-form-subtitle">
                            {isRegister ? 'Đã có tài khoản? ' : 'Chưa có tài khoản? '}
                            <span 
                                className="auth-link" 
                                onClick={() => {
                                    setIsRegister(!isRegister);
                                    resetForm();
                                }}
                            >
                                {isRegister ? 'Đăng nhập ngay' : 'Đăng ký miễn phí'}
                            </span>
                        </p>
                    </div>

                    <div className="social-login-group">
                        <button className="social-btn">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                            </svg>
                            Google
                        </button>
                        <button className="social-btn">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2" xmlns="http://www.w3.org/2000/svg">
                                <path d="M24 12.07C24 5.41 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.04V9.41c0-3.02 1.8-4.7 4.54-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.5c-1.5 0-1.96.93-1.96 1.89v2.26h3.32l-.53 3.5h-2.8V24C19.62 23.1 24 18.1 24 12.07z"/>
                            </svg>
                            Facebook
                        </button>
                    </div>

                    <div className="auth-divider">hoặc</div>

                    <form className="modern-auth-form" onSubmit={handleSubmit}>
                        {isRegister && (
                            <div className="form-group-row">
                                <input
                                    className="modern-auth-input"
                                    type="text"
                                    placeholder="Họ và tên"
                                    value={fullName}
                                    onChange={e => setFullName(e.target.value)}
                                />
                                <input
                                    className="modern-auth-input"
                                    type="tel"
                                    placeholder="Số điện thoại"
                                    value={phone}
                                    onChange={e => setPhone(e.target.value)}
                                />
                            </div>
                        )}

                        <input
                            className="modern-auth-input"
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                        />

                        <div className="input-with-icon">
                            <input
                                className="modern-auth-input"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Mật khẩu"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                className="input-icon-btn"
                                onClick={() => setShowPassword((s) => !s)}
                            >
                                {showPassword ? '🙈' : '👁️'}
                            </button>
                            {isRegister && (
                                <div className={`password-hint ${password.length > 0 && password.length < 8 ? 'warning' : ''}`}>
                                    {password.length > 0 && password.length < 8 ? 'Mật khẩu quá ngắn' : 'Tối thiểu 8 ký tự'}
                                </div>
                            )}
                        </div>

                        {!isRegister && (
                            <div className="forgot-password">
                                <span>Quên mật khẩu?</span>
                            </div>
                        )}

                        {isRegister && (
                            <div className="input-with-icon">
                                <input
                                    className="modern-auth-input"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    placeholder="Nhập lại mật khẩu"
                                    value={confirmPass}
                                    onChange={e => setConfirmPass(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    className="input-icon-btn"
                                    onClick={() => setShowConfirmPassword((s) => !s)}
                                >
                                    {showConfirmPassword ? '🙈' : '👁️'}
                                </button>
                            </div>
                        )}

                        <button className="modern-submit-btn" type="submit">
                            {isRegister ? 'Tạo tài khoản miễn phí' : 'Đăng nhập'}
                        </button>
                    </form>

                    <div className="auth-terms">
                        Bằng cách {isRegister ? 'đăng ký' : 'đăng nhập'}, bạn đồng ý với <br/>
                        <span>Điều khoản dịch vụ</span> và <span>Chính sách bảo mật</span> của VFitAI.
                    </div>
                </div>
            </div>
        </div>
    );
}

export default LoginPage;