import React, { useState } from 'react';

function AuthModal({ isOpen, onClose, onLogin }) {
    const [isRegister, setIsRegister] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

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
                        <input
                            type="password"
                            className="auth-input"
                            placeholder="Mật khẩu"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        {isRegister && (
                            <input
                                type="password"
                                className="auth-input"
                                placeholder="Nhập lại mật khẩu"
                            />
                        )}
                        <button type="submit" className="auth-btn">
                            {isRegister ? 'ĐĂNG KÝ' : 'ĐĂNG NHẬP'}
                        </button>
                    </form>
                    <div className="switch-mode">
                        {isRegister ? 'Bạn đã có tài khoản?' : 'Bạn mới biết đến Shopee?'}
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