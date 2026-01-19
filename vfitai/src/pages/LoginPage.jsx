import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function LoginPage({ users, setUsers, onLogin, showToast }) {
    const navigate = useNavigate();
    const location = useLocation();
    const [isRegister, setIsRegister] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPass, setConfirmPass] = useState('');

    useEffect(() => {
        if (location.state && location.state.mode === 'register') {
            setIsRegister(true);
        } else {
            setIsRegister(false);
        }
    }, [location]);

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

            // Gọi API Đăng ký để lưu vào Database
            try {
                const res = await fetch('http://localhost:3000/api/users', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password, role: 'user' })
                });

                if (res.status === 400) {
                    showToast("Tài khoản đã tồn tại!", "warning");
                    return;
                }

                const newUser = await res.json();
                const formattedUser = { ...newUser, id: newUser._id };

                setUsers([...users, formattedUser]);
                onLogin(formattedUser);
                showToast("Đăng ký thành công!", "success");
                setTimeout(() => navigate('/'), 1000);

            } catch (err) {
                showToast("Lỗi kết nối Server!", "error");
            }

        } else {
            // Đăng nhập: Kiểm tra trong danh sách users đã tải về
            const foundUser = users.find(u => u.email === email && u.password === password);

            if (foundUser) {
                onLogin(foundUser);
                showToast("Đăng nhập thành công!", "success");
                if (foundUser.role === 'admin') {
                    setTimeout(() => navigate('/admin'), 1000);
                } else {
                    setTimeout(() => navigate('/'), 1000);
                }
            } else {
                showToast("Sai tên đăng nhập hoặc mật khẩu!", "warning");
            }
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh', background: '#f5f5f5' }}>
            <div style={{ background: 'white', padding: '30px', width: '350px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderRadius: '3px' }}>
                <h2 style={{ fontSize: '20px', marginBottom: '25px', color: '#222' }}>
                    {isRegister ? 'Đăng Ký Tài Khoản' : 'Đăng Nhập'}
                </h2>

                <form onSubmit={handleSubmit}>
                    <input
                        className="auth-input" type="text" placeholder="Tên đăng nhập / Email"
                        value={email} onChange={e => setEmail(e.target.value)}
                    />
                    <input
                        className="auth-input" type="password" placeholder="Mật khẩu"
                        value={password} onChange={e => setPassword(e.target.value)}
                    />

                    {isRegister && (
                        <input
                            className="auth-input" type="password" placeholder="Nhập lại mật khẩu"
                            value={confirmPass} onChange={e => setConfirmPass(e.target.value)}
                        />
                    )}

                    <button className="auth-btn" type="submit">
                        {isRegister ? 'ĐĂNG KÝ' : 'ĐĂNG NHẬP'}
                    </button>
                </form>

                <div className="auth-switch">
                    {isRegister ? 'Bạn đã có tài khoản?' : 'Bạn mới biết đến Shopee?'}
                    <span
                        style={{ marginLeft: '5px', color: '#ee4d2d', cursor: 'pointer', fontWeight: 'bold' }}
                        onClick={() => {
                            setIsRegister(!isRegister);
                            setEmail(''); setPassword(''); setConfirmPass('');
                        }}>
                        {isRegister ? 'Đăng nhập ngay' : 'Đăng ký ngay'}
                    </span>
                </div>
            </div>
        </div>
    );
}

export default LoginPage;