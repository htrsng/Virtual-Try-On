import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const API_URL = 'http://localhost:3000';

function NotificationBell() {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const { isAuthenticated } = useAuth();

    // Fetch notifications
    useEffect(() => {
        if (isAuthenticated) {
            fetchNotifications();
            // Poll mỗi 30 giây
            const interval = setInterval(fetchNotifications, 30000);
            return () => clearInterval(interval);
        }
    }, [isAuthenticated]);

    // Click outside to close
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchNotifications = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/notifications`);
            setNotifications(res.data.notifications || []);
            setUnreadCount(res.data.unreadCount || 0);
        } catch (err) {
            console.error('Lỗi fetch notifications:', err);
        }
    };

    const markAllRead = async () => {
        try {
            await axios.put(`${API_URL}/api/notifications/read`);
            setUnreadCount(0);
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch (err) {
            console.error('Lỗi đánh dấu đã đọc:', err);
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'order': return '📦';
            case 'promo': return '🎉';
            case 'cart_reminder': return '🛒';
            default: return '🔔';
        }
    };

    const formatTime = (dateStr) => {
        const now = new Date();
        const d = new Date(dateStr);
        const diff = Math.floor((now - d) / 1000);
        if (diff < 60) return 'Vừa xong';
        if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
        if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
        return `${Math.floor(diff / 86400)} ngày trước`;
    };

    if (!isAuthenticated) return null;

    return (
        <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
            {/* Bell Button */}
            <button
                onClick={() => {
                    setIsOpen(!isOpen);
                    if (!isOpen && unreadCount > 0) markAllRead();
                }}
                style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '22px',
                    cursor: 'pointer',
                    position: 'relative',
                    padding: '6px',
                }}
                title="Thông báo"
            >
                🔔
                {unreadCount > 0 && (
                    <span style={{
                        position: 'absolute',
                        top: '0',
                        right: '0',
                        background: '#ee4d2d',
                        color: 'white',
                        borderRadius: '50%',
                        width: '18px',
                        height: '18px',
                        fontSize: '11px',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        animation: 'notifPulse 2s infinite',
                    }}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    width: '360px',
                    maxHeight: '400px',
                    background: 'white',
                    borderRadius: '12px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                    zIndex: 1000,
                    overflowY: 'auto',
                    animation: 'notifSlideDown 0.2s ease',
                }}>
                    {/* Header */}
                    <div style={{
                        padding: '14px 16px',
                        borderBottom: '1px solid #f0f0f0',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        position: 'sticky',
                        top: 0,
                        background: 'white',
                        zIndex: 1,
                    }}>
                        <span style={{ fontWeight: 700, fontSize: '16px' }}>Thông báo</span>
                        {notifications.length > 0 && (
                            <button
                                onClick={markAllRead}
                                style={{
                                    background: 'none', border: 'none', color: '#ee4d2d',
                                    fontSize: '13px', cursor: 'pointer', fontWeight: 600,
                                }}
                            >Đánh dấu đã đọc</button>
                        )}
                    </div>

                    {/* Notifications List */}
                    {notifications.length === 0 ? (
                        <div style={{
                            padding: '40px 16px', textAlign: 'center', color: '#999',
                        }}>
                            <div style={{ fontSize: '40px', marginBottom: '8px' }}>🔔</div>
                            <div>Chưa có thông báo nào</div>
                        </div>
                    ) : (
                        notifications.map((notif) => (
                            <div
                                key={notif._id}
                                onClick={() => {
                                    if (notif.link) window.location.href = notif.link;
                                }}
                                style={{
                                    padding: '12px 16px',
                                    borderBottom: '1px solid #f5f5f5',
                                    display: 'flex',
                                    gap: '12px',
                                    cursor: notif.link ? 'pointer' : 'default',
                                    background: notif.isRead ? 'white' : '#fff8f6',
                                    transition: 'background 0.2s',
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = '#f9f9f9'}
                                onMouseLeave={e => e.currentTarget.style.background = notif.isRead ? 'white' : '#fff8f6'}
                            >
                                <div style={{ fontSize: '24px' }}>{getIcon(notif.type)}</div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 600, fontSize: '14px', color: '#333' }}>{notif.title}</div>
                                    <div style={{ fontSize: '13px', color: '#666', marginTop: '4px', lineHeight: '1.4' }}>{notif.message}</div>
                                    <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>{formatTime(notif.createdAt)}</div>
                                </div>
                                {!notif.isRead && (
                                    <div style={{
                                        width: '8px', height: '8px', borderRadius: '50%',
                                        background: '#ee4d2d', marginTop: '6px', flexShrink: 0,
                                    }}></div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}

            <style>{`
                @keyframes notifPulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                }
                @keyframes notifSlideDown {
                    from { opacity: 0; transform: translateY(-8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}

export default NotificationBell;
