import React, { useState } from 'react';
import './AuthModal.css';

function AuthModal({ isOpen, onClose, onLogin }) {
    const [isRegister, setIsRegister] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (email && password) {
            onLogin(email);
            onClose();
        } else {
            alert("Vui lòng nhập thông tin!");
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <div className="modal-title">{isRegister ? 'Đăng Ký' : 'Đăng Nhập'}</div>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>
                <div className="modal-body">
                    <form onSubmit={handleSubmit}>
                        <input
                            type="text"
                            className="auth-input"
                            placeholder="Email/Số điện thoại/Tên đăng nhập"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                className="auth-input"
                                placeholder="Mật khẩu"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((s) => !s)}
                                style={{
                                    position: 'absolute',
                                    right: 10,
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                }}
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                                {showPassword ? '🙈' : '👁️'}
                            </button>
                        </div>
                        {isRegister && (
                            <input
                                type="password"
                                className="auth-input"
                                placeholder="Nhập lại mật khẩu"
                            />
                        )}
                        {/* Đã bỏ trường địa chỉ khỏi form đăng ký, chỉ nhập địa chỉ khi mua hàng */}
                        <button type="submit" className="auth-btn">
                            {isRegister ? 'ĐĂNG KÝ' : 'ĐĂNG NHẬP'}
                        </button>
                    </form>
                    <div className="switch-mode">
                        {isRegister ? 'Bạn đã có tài khoản?' : 'Bạn mới biết đến VFitAI?'}
                        <span className="switch-link" onClick={() => setIsRegister(!isRegister)}>
                            {isRegister ? 'Đăng nhập' : 'Đăng ký'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AuthModal;