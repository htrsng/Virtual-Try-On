import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    // Thiết lập axios với token
    useEffect(() => {
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            // Lấy thông tin user từ server
            fetchUserInfo();
        } else {
            setLoading(false);
        }
    }, [token]);

    const fetchUserInfo = async () => {
        try {
            const response = await axios.get('http://localhost:3000/api/auth/me');
            setUser(response.data);
        } catch (error) {
            console.error('Lỗi lấy thông tin user:', error);
            // Nếu token không hợp lệ, xóa nó
            logout();
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        try {
            const response = await axios.post('http://localhost:3000/api/auth/login', {
                email,
                password
            });

            const { token: newToken, user: userData } = response.data;

            // Lưu token vào localStorage
            localStorage.setItem('token', newToken);
            setToken(newToken);
            setUser(userData);

            return { success: true, message: response.data.message };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Đăng nhập thất bại'
            };
        }
    };

    const register = async (email, password, fullName, phone, address) => {
        try {
            const response = await axios.post('http://localhost:3000/api/auth/register', {
                email,
                password,
                fullName,
                phone,
                address
            });

            const { token: newToken, user: userData } = response.data;

            // Lưu token vào localStorage
            localStorage.setItem('token', newToken);
            setToken(newToken);
            setUser(userData);

            return { success: true, message: response.data.message };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Đăng ký thất bại'
            };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('cartItems'); // Xóa giỏ hàng khi đăng xuất
        localStorage.removeItem('currentUser'); // Xóa thông tin user
        setToken(null);
        setUser(null);
        delete axios.defaults.headers.common['Authorization'];
    };

    const updateProfile = async (profileData) => {
        try {
            const response = await axios.put('http://localhost:3000/api/auth/profile', profileData);
            setUser(response.data.user);
            return { success: true, message: response.data.message };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Cập nhật thông tin thất bại'
            };
        }
    };

    const value = {
        user,
        token,
        loading,
        login,
        register,
        logout,
        updateProfile,
        isAuthenticated: !!user
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
