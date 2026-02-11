import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import axios from 'axios';

const API_URL = 'http://localhost:3000';

function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);
    const { user, isAuthenticated } = useAuth();
    const { t } = useLanguage();

    // Lấy userId từ cả 2 format (login trả về .id, /auth/me trả về ._id)
    const getUserId = () => user?.id || user?._id || null;

    // Quick replies
    const quickReplies = [
        '🚚 Giao hàng', '🔄 Đổi trả', '💳 Thanh toán',
        '📐 Hướng dẫn size', '🎁 Khuyến mãi', '👕 Thử đồ 3D'
    ];

    // Load chat history khi mở
    useEffect(() => {
        if (isOpen && isAuthenticated) {
            loadChatHistory();
        }
    }, [isOpen, isAuthenticated]);

    // Auto scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Initial greeting
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            setMessages([{
                id: 'greeting',
                sender: 'bot',
                message: 'Xin chào! 👋 Tôi là trợ lý VFitAI. Bạn cần hỗ trợ gì?',
                createdAt: new Date().toISOString()
            }]);
        }
    }, [isOpen]);

    const loadChatHistory = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            const res = await axios.get(`${API_URL}/api/chat/history`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data && res.data.length > 0) {
                setMessages(prev => {
                    const greeting = prev.find(m => m.id === 'greeting');
                    return greeting ? [greeting, ...res.data] : res.data;
                });
            }
        } catch (err) {
            console.error('Lỗi load chat:', err);
        }
    };

    const sendMessage = async (text) => {
        const msg = text || inputMessage.trim();
        if (!msg) return;

        // Thêm tin nhắn user vào UI ngay
        const userMsg = {
            id: 'user_' + Date.now(),
            sender: 'user',
            message: msg,
            createdAt: new Date().toISOString()
        };
        setMessages(prev => [...prev, userMsg]);
        setInputMessage('');
        setIsTyping(true);

        try {
            const token = localStorage.getItem('token');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const res = await axios.post(`${API_URL}/api/chat/send`, {
                message: msg,
                userId: getUserId()
            }, { headers });
            // Thêm reply bot
            setTimeout(() => {
                setMessages(prev => [...prev, res.data.botReply]);
                setIsTyping(false);
            }, 800); // Delay giả lập typing
        } catch (err) {
            setIsTyping(false);
            setMessages(prev => [...prev, {
                id: 'error_' + Date.now(),
                sender: 'bot',
                message: 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại!',
                createdAt: new Date().toISOString()
            }]);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const formatTime = (dateStr) => {
        const d = new Date(dateStr);
        return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <>
            {/* Chat Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    position: 'fixed',
                    bottom: '20px',
                    right: '20px',
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #ee4d2d, #ff6b35)',
                    color: 'white',
                    border: 'none',
                    fontSize: '28px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 20px rgba(238, 77, 45, 0.4)',
                    zIndex: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s ease',
                    transform: isOpen ? 'scale(0.9)' : 'scale(1)',
                }}
                title="Chat hỗ trợ"
            >
                {isOpen ? '✕' : '💬'}
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div style={{
                    position: 'fixed',
                    bottom: '90px',
                    right: '20px',
                    width: '380px',
                    maxWidth: 'calc(100vw - 40px)',
                    height: '520px',
                    maxHeight: 'calc(100vh - 120px)',
                    background: 'white',
                    borderRadius: '16px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                    zIndex: 9998,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    animation: 'chatSlideUp 0.3s ease',
                }}>
                    {/* Header */}
                    <div style={{
                        background: 'linear-gradient(135deg, #ee4d2d, #ff6b35)',
                        color: 'white',
                        padding: '16px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                    }}>
                        <div style={{
                            width: '40px', height: '40px', borderRadius: '50%',
                            background: 'rgba(255,255,255,0.2)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '20px'
                        }}>🤖</div>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: '16px' }}>VFitAI Support</div>
                            <div style={{ fontSize: '12px', opacity: 0.9 }}>
                                <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#4caf50', marginRight: '6px' }}></span>
                                {t('chat_support')}
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer' }}
                        >✕</button>
                    </div>

                    {/* Messages */}
                    <div style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        background: '#f5f5f5',
                    }}>
                        {messages.map((msg, i) => (
                            <div key={msg._id || msg.id || i} style={{
                                display: 'flex',
                                justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                            }}>
                                <div style={{
                                    maxWidth: '80%',
                                    padding: '10px 14px',
                                    borderRadius: msg.sender === 'user'
                                        ? '16px 16px 4px 16px'
                                        : '16px 16px 16px 4px',
                                    background: msg.sender === 'user'
                                        ? 'linear-gradient(135deg, #ee4d2d, #ff6b35)'
                                        : 'white',
                                    color: msg.sender === 'user' ? 'white' : '#333',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                                    fontSize: '14px',
                                    lineHeight: '1.5',
                                }}>
                                    <div>{msg.message}</div>
                                    <div style={{
                                        fontSize: '11px',
                                        opacity: 0.6,
                                        marginTop: '4px',
                                        textAlign: msg.sender === 'user' ? 'right' : 'left'
                                    }}>
                                        {formatTime(msg.createdAt)}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {isTyping && (
                            <div style={{ display: 'flex', gap: '4px', padding: '8px 14px', background: 'white', borderRadius: '16px', width: 'fit-content', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                                <span style={{ animation: 'typingDot 1.4s infinite', animationDelay: '0s', width: '8px', height: '8px', borderRadius: '50%', background: '#999', display: 'inline-block' }}></span>
                                <span style={{ animation: 'typingDot 1.4s infinite', animationDelay: '0.2s', width: '8px', height: '8px', borderRadius: '50%', background: '#999', display: 'inline-block' }}></span>
                                <span style={{ animation: 'typingDot 1.4s infinite', animationDelay: '0.4s', width: '8px', height: '8px', borderRadius: '50%', background: '#999', display: 'inline-block' }}></span>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Quick Replies */}
                    <div style={{
                        padding: '8px 12px',
                        display: 'flex',
                        gap: '6px',
                        overflowX: 'auto',
                        borderTop: '1px solid #eee',
                        background: 'white',
                    }}>
                        {quickReplies.map((qr, i) => (
                            <button
                                key={i}
                                onClick={() => sendMessage(qr)}
                                style={{
                                    padding: '6px 12px',
                                    borderRadius: '20px',
                                    border: '1px solid #ee4d2d',
                                    background: 'white',
                                    color: '#ee4d2d',
                                    fontSize: '12px',
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap',
                                    transition: 'all 0.2s',
                                }}
                                onMouseEnter={e => { e.target.style.background = '#fff5f2'; }}
                                onMouseLeave={e => { e.target.style.background = 'white'; }}
                            >{qr}</button>
                        ))}
                    </div>

                    {/* Input */}
                    <div style={{
                        padding: '12px',
                        display: 'flex',
                        gap: '8px',
                        borderTop: '1px solid #eee',
                        background: 'white',
                    }}>
                        <input
                            type="text"
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            onKeyDown={handleKeyPress}
                            placeholder={t('type_message')}
                            style={{
                                flex: 1,
                                padding: '10px 16px',
                                borderRadius: '24px',
                                border: '1px solid #ddd',
                                fontSize: '14px',
                                outline: 'none',
                                transition: 'border-color 0.2s',
                            }}
                            onFocus={e => e.target.style.borderColor = '#ee4d2d'}
                            onBlur={e => e.target.style.borderColor = '#ddd'}
                        />
                        <button
                            onClick={() => sendMessage()}
                            disabled={!inputMessage.trim()}
                            style={{
                                width: '42px',
                                height: '42px',
                                borderRadius: '50%',
                                background: inputMessage.trim() ? 'linear-gradient(135deg, #ee4d2d, #ff6b35)' : '#ddd',
                                color: 'white',
                                border: 'none',
                                fontSize: '18px',
                                cursor: inputMessage.trim() ? 'pointer' : 'default',
                                transition: 'all 0.2s',
                            }}
                        >➤</button>
                    </div>
                </div>
            )}

            {/* CSS Animations */}
            <style>{`
                @keyframes chatSlideUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes typingDot {
                    0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
                    30% { transform: translateY(-4px); opacity: 1; }
                }
            `}</style>
        </>
    );
}

export default ChatWidget;
