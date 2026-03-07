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
        <div className="auth-container auth-page">
            <div className={`auth-card ${isRegister ? 'auth-card-wide' : ''}`}>
                <h2 className="auth-title">
                    {isRegister ? '🎉 Đăng Ký Tài Khoản' : '👋 Đăng Nhập'}
                </h2>

                <form onSubmit={handleSubmit}>
                    <input
                        className="auth-input"
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                    />

                    {isRegister && (
                        <>
                            <input
                                className="auth-input"
                                type="text"
                                placeholder="Họ và tên"
                                value={fullName}
                                onChange={e => setFullName(e.target.value)}
                            />
                            <input
                                className="auth-input"
                                type="tel"
                                placeholder="Số điện thoại"
                                value={phone}
                                onChange={e => setPhone(e.target.value)}
                            />
                        </>
                    )}

                    <input
                        className="auth-input"
                        type="password"
                        placeholder="Mật khẩu"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                    />

                    {isRegister && (
                        <input
                            className="auth-input"
                            type="password"
                            placeholder="Nhập lại mật khẩu"
                            value={confirmPass}
                            onChange={e => setConfirmPass(e.target.value)}
                            required
                        />
                    )}

                    <button
                        className="auth-btn"
                        type="submit"
                    >
                        {isRegister ? '✨ ĐĂNG KÝ' : '🚀 ĐĂNG NHẬP'}
                    </button>
                </form>

                <div className="auth-switch">
                    {isRegister ? 'Bạn đã có tài khoản?' : 'Bạn mới biết đến VFit?'}
                    <span
                        className="auth-switch-link"
                        onClick={() => {
                            setIsRegister(!isRegister);
                            resetForm();
                        }}>
                        {isRegister ? 'Đăng nhập ngay' : 'Đăng ký ngay'}
                    </span>
                </div>
            </div>
        </div>
    );
}

export default LoginPage;