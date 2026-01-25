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
                setTimeout(() => navigate('/'), 1000);
            } else {
                showToast(result.message, "error");
            }

        } else {
            // Đăng nhập
            const result = await login(email, password);

            if (result.success) {
                showToast(result.message, "success");
                setTimeout(() => navigate('/'), 1000);
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
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '20px' }}>
            <div style={{
                background: 'white',
                padding: '40px',
                width: '100%',
                maxWidth: isRegister ? '500px' : '400px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                borderRadius: '12px',
                transition: 'all 0.3s ease'
            }}>
                <h2 style={{
                    fontSize: '28px',
                    marginBottom: '30px',
                    color: '#333',
                    textAlign: 'center',
                    fontWeight: '700'
                }}>
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
                            <input
                                className="auth-input"
                                type="text"
                                placeholder="Địa chỉ"
                                value={address}
                                onChange={e => setAddress(e.target.value)}
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
                        style={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            transition: 'transform 0.2s'
                        }}
                        onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                        onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                    >
                        {isRegister ? '✨ ĐĂNG KÝ' : '🚀 ĐĂNG NHẬP'}
                    </button>
                </form>

                <div className="auth-switch" style={{ marginTop: '20px', textAlign: 'center' }}>
                    {isRegister ? 'Bạn đã có tài khoản?' : 'Bạn mới biết đến Shopee?'}
                    <span
                        style={{
                            marginLeft: '5px',
                            color: '#667eea',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            textDecoration: 'underline'
                        }}
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