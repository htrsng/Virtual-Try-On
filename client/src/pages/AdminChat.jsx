import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { FiSend, FiRefreshCw, FiMessageSquare, FiSearch, FiZap, FiPlus, FiEdit2, FiTrash2, FiCheck, FiX } from 'react-icons/fi';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function AdminChat({ showToast }) {
    const [conversations, setConversations] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [sending, setSending] = useState(false);
    const [loadingConvs, setLoadingConvs] = useState(true);
    const [loadingMsgs, setLoadingMsgs] = useState(false);
    const [search, setSearch] = useState('');
    const messagesEndRef = useRef(null);

    // ── Quick Replies ──
    const QR_KEY = 'admin_quick_replies';
    const DEFAULT_QR = [
        'Xin chào! Tôi có thể giúp gì cho bạn?',
        'Cảm ơn bạn đã liên hệ. Chúng tôi sẽ xử lý yêu cầu của bạn sớm nhất.',
        'Đơn hàng của bạn đang được xử lý, vui lòng chờ trong 1-2 ngày làm việc.',
        'Bạn có thể đổi/trả hàng trong vòng 7 ngày kể từ ngày nhận hàng.',
        'Để được hỗ trợ nhanh hơn, vui lòng cung cấp mã đơn hàng của bạn.',
    ];
    const [quickReplies, setQuickReplies] = useState(() => {
        try { return JSON.parse(localStorage.getItem(QR_KEY)) || DEFAULT_QR; } catch { return DEFAULT_QR; }
    });
    const [showQR, setShowQR] = useState(false);
    const [editingIdx, setEditingIdx] = useState(null); // index đang chỉnh sửa
    const [editingText, setEditingText] = useState('');
    const [addingNew, setAddingNew] = useState(false);
    const [newQRText, setNewQRText] = useState('');
    const qrRef = useRef(null);

    useEffect(() => {
        localStorage.setItem(QR_KEY, JSON.stringify(quickReplies));
    }, [quickReplies]);

    // Đóng panel khi click ngoài
    useEffect(() => {
        if (!showQR) return;
        const handler = (e) => {
            if (qrRef.current && !qrRef.current.contains(e.target)) {
                setShowQR(false);
                setEditingIdx(null);
                setAddingNew(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [showQR]);

    const handleSelectQR = (text) => {
        setInputText(text);
        setShowQR(false);
    };

    const handleSaveEdit = (idx) => {
        if (!editingText.trim()) return;
        setQuickReplies(prev => prev.map((r, i) => i === idx ? editingText.trim() : r));
        setEditingIdx(null);
        setEditingText('');
    };

    const handleDeleteQR = (idx) => {
        setQuickReplies(prev => prev.filter((_, i) => i !== idx));
        if (editingIdx === idx) { setEditingIdx(null); setEditingText(''); }
    };

    const handleAddQR = () => {
        if (!newQRText.trim()) return;
        setQuickReplies(prev => [...prev, newQRText.trim()]);
        setNewQRText('');
        setAddingNew(false);
    };

    // ── Load danh sách cuộc hội thoại ──
    const loadConversations = useCallback(async () => {
        try {
            const res = await axios.get(`${API_URL}/api/admin/chat/conversations`);
            setConversations(res.data);
        } catch {
            //
        } finally {
            setLoadingConvs(false);
        }
    }, []);

    useEffect(() => {
        loadConversations();
        const id = setInterval(loadConversations, 15000);
        return () => clearInterval(id);
    }, [loadConversations]);

    // ── Load tin nhắn khi chọn user ──
    const loadMessages = useCallback(async (userId) => {
        if (!userId) return;
        setLoadingMsgs(true);
        try {
            const res = await axios.get(`${API_URL}/api/admin/chat/messages/${userId}`);
            setMessages(res.data);
            // Cập nhật unread = 0 trong danh sách
            setConversations(prev =>
                prev.map(c => c.userId === userId ? { ...c, unreadCount: 0 } : c)
            );
        } catch {
            //
        } finally {
            setLoadingMsgs(false);
        }
    }, []);

    useEffect(() => {
        if (selectedUserId) {
            loadMessages(selectedUserId);
        }
    }, [selectedUserId, loadMessages]);

    // ── Auto-scroll xuống cuối ──
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // ── Poll tin nhắn mới mỗi 10s khi đang xem hội thoại ──
    useEffect(() => {
        if (!selectedUserId) return;
        const id = setInterval(() => loadMessages(selectedUserId), 10000);
        return () => clearInterval(id);
    }, [selectedUserId, loadMessages]);

    const handleSelectConversation = (conv) => {
        setSelectedUserId(conv.userId);
        setSelectedUser(conv.user);
    };

    const handleSend = async () => {
        const msg = inputText.trim();
        if (!msg || !selectedUserId || sending) return;
        setSending(true);
        try {
            const res = await axios.post(`${API_URL}/api/admin/chat/reply`, {
                userId: selectedUserId,
                message: msg,
            });
            setMessages(prev => [...prev, res.data]);
            setInputText('');
            // Cập nhật lastMessage trong danh sách
            setConversations(prev =>
                prev.map(c =>
                    c.userId === selectedUserId
                        ? { ...c, lastMessage: res.data }
                        : c
                )
            );
        } catch (err) {
            showToast?.('Lỗi gửi tin nhắn', 'error');
        } finally {
            setSending(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const formatTime = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        const now = new Date();
        const isToday = d.toDateString() === now.toDateString();
        if (isToday) return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    };

    const filteredConvs = conversations.filter(c => {
        const name = (c.user?.fullName || '').toLowerCase();
        const email = (c.user?.email || '').toLowerCase();
        const q = search.toLowerCase();
        return name.includes(q) || email.includes(q);
    });

    const totalUnread = conversations.reduce((s, c) => s + (c.unreadCount || 0), 0);

    return (
        <div className="adm-chat-page">
            {/* ══ Header ══ */}
            <div className="adm-chat-page__header">
                <div>
                    <h1 className="adm-chat-page__title">
                        💬 Phản hồi khách hàng
                        {totalUnread > 0 && (
                            <span className="adm-chat-page__badge">{totalUnread}</span>
                        )}
                    </h1>
                    <p className="adm-chat-page__subtitle">Xem và trả lời tin nhắn từ khách hàng</p>
                </div>
                <button className="adm-chat-page__refresh" onClick={loadConversations} title="Làm mới">
                    <FiRefreshCw size={16} />
                    Làm mới
                </button>
            </div>

            {/* ══ Body ══ */}
            <div className="adm-chat-body">
                {/* ── Sidebar danh sách ── */}
                <aside className="adm-chat-sidebar">
                    <div className="adm-chat-sidebar__search">
                        <FiSearch size={15} />
                        <input
                            type="text"
                            placeholder="Tìm theo tên, email..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>

                    {loadingConvs ? (
                        <div className="adm-chat-sidebar__empty">Đang tải...</div>
                    ) : filteredConvs.length === 0 ? (
                        <div className="adm-chat-sidebar__empty">
                            <FiMessageSquare size={32} />
                            <p>Chưa có tin nhắn nào</p>
                        </div>
                    ) : (
                        filteredConvs.map(conv => (
                            <div
                                key={conv.userId}
                                className={`adm-chat-conv-item ${selectedUserId === conv.userId ? 'adm-chat-conv-item--active' : ''}`}
                                onClick={() => handleSelectConversation(conv)}
                            >
                                <div className="adm-chat-conv-item__avatar">
                                    {(conv.user?.fullName || 'K').charAt(0).toUpperCase()}
                                </div>
                                <div className="adm-chat-conv-item__info">
                                    <div className="adm-chat-conv-item__name">
                                        {conv.user?.fullName || 'Khách ẩn danh'}
                                        {conv.unreadCount > 0 && (
                                            <span className="adm-chat-conv-item__unread">{conv.unreadCount}</span>
                                        )}
                                    </div>
                                    <div className="adm-chat-conv-item__preview">
                                        {conv.lastMessage?.sender === 'admin' ? '✅ Bạn: ' : ''}
                                        {conv.lastMessage?.message || '...'}
                                    </div>
                                </div>
                                <div className="adm-chat-conv-item__time">
                                    {formatTime(conv.lastMessage?.createdAt)}
                                </div>
                            </div>
                        ))
                    )}
                </aside>

                {/* ── Khung chat ── */}
                <div className="adm-chat-main">
                    {!selectedUserId ? (
                        <div className="adm-chat-main__empty">
                            <FiMessageSquare size={48} />
                            <p>Chọn một cuộc hội thoại để bắt đầu</p>
                        </div>
                    ) : (
                        <>
                            {/* Header chat */}
                            <div className="adm-chat-main__header">
                                <div className="adm-chat-main__header-avatar">
                                    {(selectedUser?.fullName || 'K').charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <div className="adm-chat-main__header-name">
                                        {selectedUser?.fullName || 'Khách ẩn danh'}
                                    </div>
                                    {selectedUser?.email && (
                                        <div className="adm-chat-main__header-email">
                                            {selectedUser.email}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="adm-chat-main__messages">
                                {loadingMsgs ? (
                                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--a-text-secondary)' }}>
                                        Đang tải tin nhắn...
                                    </div>
                                ) : messages.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--a-text-secondary)' }}>
                                        Chưa có tin nhắn nào
                                    </div>
                                ) : (
                                    messages.map((msg, i) => {
                                        const isAdmin = msg.sender === 'admin';
                                        const isBot = msg.sender === 'bot';
                                        const isRight = isAdmin;
                                        return (
                                            <div
                                                key={msg._id || i}
                                                className={`adm-chat-msg ${isRight ? 'adm-chat-msg--right' : 'adm-chat-msg--left'}`}
                                            >
                                                {!isRight && (
                                                    <div className={`adm-chat-msg__avatar ${isBot ? 'adm-chat-msg__avatar--bot' : ''}`}>
                                                        {isBot ? '🤖' : (selectedUser?.fullName || 'K').charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                                <div className="adm-chat-msg__wrap">
                                                    {!isRight && (
                                                        <div className="adm-chat-msg__sender">
                                                            {isBot ? 'Bot tự động' : (selectedUser?.fullName || 'Khách')}
                                                        </div>
                                                    )}
                                                    <div className={`adm-chat-msg__bubble ${isAdmin ? 'adm-chat-msg__bubble--admin' : isBot ? 'adm-chat-msg__bubble--bot' : ''}`}>
                                                        {msg.message}
                                                    </div>
                                                    <div className="adm-chat-msg__time">
                                                        {isAdmin && '✅ '}{new Date(msg.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Quick Replies Panel */}
                            <div className="adm-qr-wrap" ref={qrRef}>
                                <button
                                    className={`adm-qr-toggle ${showQR ? 'adm-qr-toggle--active' : ''}`}
                                    onClick={() => { setShowQR(v => !v); setEditingIdx(null); setAddingNew(false); }}
                                    title="Tin nhắn mẫu"
                                >
                                    <FiZap size={14} />
                                    Tin nhắn mẫu ({quickReplies.length})
                                </button>

                                {showQR && (
                                    <div className="adm-qr-panel">
                                        <div className="adm-qr-panel__header">
                                            <span>⚡ Tin nhắn mẫu</span>
                                            <button className="adm-qr-add-btn" onClick={() => { setAddingNew(true); setEditingIdx(null); }}>
                                                <FiPlus size={13} /> Thêm mới
                                            </button>
                                        </div>

                                        <div className="adm-qr-list">
                                            {quickReplies.length === 0 && !addingNew && (
                                                <div className="adm-qr-empty">Chưa có tin nhắn mẫu nào</div>
                                            )}
                                            {quickReplies.map((qr, idx) => (
                                                <div key={idx} className="adm-qr-item">
                                                    {editingIdx === idx ? (
                                                        <div className="adm-qr-item__edit">
                                                            <textarea
                                                                className="adm-qr-item__edit-input"
                                                                value={editingText}
                                                                onChange={e => setEditingText(e.target.value)}
                                                                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSaveEdit(idx); } if (e.key === 'Escape') { setEditingIdx(null); } }}
                                                                autoFocus
                                                                rows={2}
                                                            />
                                                            <div className="adm-qr-item__edit-actions">
                                                                <button className="adm-qr-btn adm-qr-btn--save" onClick={() => handleSaveEdit(idx)} title="Lưu">
                                                                    <FiCheck size={13} /> Lưu
                                                                </button>
                                                                <button className="adm-qr-btn adm-qr-btn--cancel" onClick={() => setEditingIdx(null)} title="Hủy">
                                                                    <FiX size={13} /> Hủy
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <div className="adm-qr-item__text" onClick={() => handleSelectQR(qr)} title="Nhấn để chọn">
                                                                {qr}
                                                            </div>
                                                            <div className="adm-qr-item__actions">
                                                                <button className="adm-qr-btn adm-qr-btn--edit" onClick={() => { setEditingIdx(idx); setEditingText(qr); setAddingNew(false); }} title="Chỉnh sửa">
                                                                    <FiEdit2 size={12} />
                                                                </button>
                                                                <button className="adm-qr-btn adm-qr-btn--delete" onClick={() => handleDeleteQR(idx)} title="Xóa">
                                                                    <FiTrash2 size={12} />
                                                                </button>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            ))}

                                            {addingNew && (
                                                <div className="adm-qr-item adm-qr-item--new">
                                                    <div className="adm-qr-item__edit">
                                                        <textarea
                                                            className="adm-qr-item__edit-input"
                                                            value={newQRText}
                                                            onChange={e => setNewQRText(e.target.value)}
                                                            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddQR(); } if (e.key === 'Escape') { setAddingNew(false); setNewQRText(''); } }}
                                                            placeholder="Nhập nội dung tin nhắn mẫu..."
                                                            autoFocus
                                                            rows={2}
                                                        />
                                                        <div className="adm-qr-item__edit-actions">
                                                            <button className="adm-qr-btn adm-qr-btn--save" onClick={handleAddQR}>
                                                                <FiCheck size={13} /> Thêm
                                                            </button>
                                                            <button className="adm-qr-btn adm-qr-btn--cancel" onClick={() => { setAddingNew(false); setNewQRText(''); }}>
                                                                <FiX size={13} /> Hủy
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Input */}
                            <div className="adm-chat-main__input">
                                <textarea
                                    value={inputText}
                                    onChange={e => setInputText(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Nhập phản hồi... (Enter để gửi, Shift+Enter xuống dòng)"
                                    rows={2}
                                    className="adm-chat-main__textarea"
                                />
                                <button
                                    className="adm-chat-main__send"
                                    onClick={handleSend}
                                    disabled={!inputText.trim() || sending}
                                    title="Gửi (Enter)"
                                >
                                    <FiSend size={18} />
                                    <span>{sending ? 'Đang gửi...' : 'Gửi'}</span>
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* ══ CSS ══ */}
            <style>{`
                .adm-chat-page {
                    display: flex;
                    flex-direction: column;
                    height: calc(100vh - 64px);
                    gap: 0;
                }
                .adm-chat-page__header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 20px 24px 14px;
                    flex-shrink: 0;
                }
                .adm-chat-page__title {
                    font-size: 22px;
                    font-weight: 800;
                    color: var(--a-text-heading, #0f1729);
                    margin: 0 0 4px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .adm-chat-page__badge {
                    background: #ef4444;
                    color: #fff;
                    font-size: 12px;
                    font-weight: 700;
                    padding: 2px 8px;
                    border-radius: 999px;
                }
                .adm-chat-page__subtitle {
                    margin: 0;
                    color: var(--a-text-secondary, #5b6478);
                    font-size: 13px;
                }
                .adm-chat-page__refresh {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 8px 16px;
                    background: var(--a-surface, #fff);
                    border: 1px solid var(--a-border, #e2e5ef);
                    border-radius: 10px;
                    color: var(--a-text-secondary, #5b6478);
                    font-size: 13px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all .15s;
                }
                .adm-chat-page__refresh:hover {
                    background: var(--a-surface-alt, #f7f8fc);
                    color: var(--a-text, #0f1729);
                }

                /* ── Body layout ── */
                .adm-chat-body {
                    display: flex;
                    flex: 1;
                    overflow: hidden;
                    margin: 0 24px 24px;
                    background: var(--a-surface, #fff);
                    border-radius: 18px;
                    border: 1px solid var(--a-border, #e2e5ef);
                    box-shadow: 0 2px 12px rgba(0,0,0,.05);
                }

                /* ── Sidebar ── */
                .adm-chat-sidebar {
                    width: 300px;
                    flex-shrink: 0;
                    border-right: 1px solid var(--a-border, #e2e5ef);
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                }
                .adm-chat-sidebar__search {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 14px 16px;
                    border-bottom: 1px solid var(--a-border, #e2e5ef);
                    color: var(--a-text-secondary);
                }
                .adm-chat-sidebar__search input {
                    flex: 1;
                    border: none;
                    outline: none;
                    font-size: 13px;
                    background: transparent;
                    color: var(--a-text, #0f1729);
                }
                .adm-chat-sidebar__empty {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    color: var(--a-text-secondary);
                    font-size: 13px;
                    padding: 40px 16px;
                }
                /* Scrollable list */
                .adm-chat-sidebar > .adm-chat-conv-item,
                .adm-chat-sidebar > div:not(.adm-chat-sidebar__search):not(.adm-chat-sidebar__empty) {
                    overflow-y: auto;
                }
                .adm-chat-sidebar { overflow-y: auto; }

                /* Conv item */
                .adm-chat-conv-item {
                    display: flex;
                    align-items: flex-start;
                    gap: 10px;
                    padding: 12px 16px;
                    cursor: pointer;
                    border-bottom: 1px solid var(--a-border-light, #eef0f6);
                    transition: background .15s;
                }
                .adm-chat-conv-item:hover { background: var(--a-surface-alt, #f7f8fc); }
                .adm-chat-conv-item--active { background: var(--a-primary-light, rgba(200,149,108,.08)); }

                .adm-chat-conv-item__avatar {
                    flex-shrink: 0;
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background: var(--a-primary-medium, rgba(200,149,108,.2));
                    color: var(--a-primary, #c8956c);
                    font-weight: 700;
                    font-size: 15px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .adm-chat-conv-item__info { flex: 1; min-width: 0; }
                .adm-chat-conv-item__name {
                    font-size: 13px;
                    font-weight: 600;
                    color: var(--a-text, #0f1729);
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    margin-bottom: 3px;
                }
                .adm-chat-conv-item__unread {
                    background: #ef4444;
                    color: #fff;
                    font-size: 10px;
                    font-weight: 700;
                    padding: 0 6px;
                    border-radius: 999px;
                    line-height: 18px;
                }
                .adm-chat-conv-item__preview {
                    font-size: 12px;
                    color: var(--a-text-secondary);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .adm-chat-conv-item__time {
                    font-size: 11px;
                    color: var(--a-text-tertiary);
                    white-space: nowrap;
                    margin-top: 2px;
                }

                /* ── Main chat area ── */
                .adm-chat-main {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    min-width: 0;
                }
                .adm-chat-main__empty {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 14px;
                    color: var(--a-text-secondary);
                    font-size: 14px;
                }
                .adm-chat-main__header {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 14px 20px;
                    border-bottom: 1px solid var(--a-border, #e2e5ef);
                    flex-shrink: 0;
                }
                .adm-chat-main__header-avatar {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background: var(--a-primary-medium, rgba(200,149,108,.2));
                    color: var(--a-primary, #c8956c);
                    font-weight: 700;
                    font-size: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .adm-chat-main__header-name {
                    font-size: 15px;
                    font-weight: 700;
                    color: var(--a-text, #0f1729);
                }
                .adm-chat-main__header-email {
                    font-size: 12px;
                    color: var(--a-text-secondary);
                }

                /* Messages */
                .adm-chat-main__messages {
                    flex: 1;
                    overflow-y: auto;
                    padding: 20px;
                    display: flex;
                    flex-direction: column;
                    gap: 14px;
                    background: var(--a-surface-alt, #f7f8fc);
                }
                .adm-chat-main__messages::-webkit-scrollbar { width: 4px; }
                .adm-chat-main__messages::-webkit-scrollbar-thumb { background: var(--a-border); border-radius: 4px; }

                .adm-chat-msg {
                    display: flex;
                    gap: 8px;
                    max-width: 75%;
                }
                .adm-chat-msg--left { align-self: flex-start; }
                .adm-chat-msg--right { align-self: flex-end; flex-direction: row-reverse; }

                .adm-chat-msg__avatar {
                    flex-shrink: 0;
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    background: var(--a-border, #e2e5ef);
                    color: var(--a-text-secondary);
                    font-size: 13px;
                    font-weight: 700;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-top: 4px;
                }
                .adm-chat-msg__avatar--bot { background: #fef9c3; font-size: 15px; }

                .adm-chat-msg__wrap { display: flex; flex-direction: column; gap: 3px; }
                .adm-chat-msg--right .adm-chat-msg__wrap { align-items: flex-end; }

                .adm-chat-msg__sender { font-size: 11px; color: var(--a-text-secondary); padding: 0 4px; }

                .adm-chat-msg__bubble {
                    padding: 10px 14px;
                    border-radius: 18px 18px 18px 4px;
                    background: var(--a-surface, #fff);
                    color: var(--a-text, #0f1729);
                    font-size: 14px;
                    line-height: 1.5;
                    box-shadow: 0 1px 4px rgba(0,0,0,.07);
                    word-break: break-word;
                }
                .adm-chat-msg__bubble--admin {
                    background: linear-gradient(135deg, #c8956c, #d4a67e);
                    color: #fff;
                    border-radius: 18px 18px 4px 18px;
                    box-shadow: 0 2px 8px rgba(200,149,108,.3);
                }
                .adm-chat-msg__bubble--bot {
                    background: #f0fdf4;
                    border: 1px solid #bbf7d0;
                    color: #166534;
                }
                .adm-chat-msg__time { font-size: 11px; color: var(--a-text-tertiary); padding: 0 4px; }

                /* Input */
                .adm-chat-main__input {
                    display: flex;
                    align-items: flex-end;
                    gap: 10px;
                    padding: 14px 20px;
                    border-top: 1px solid var(--a-border, #e2e5ef);
                    background: var(--a-surface, #fff);
                    flex-shrink: 0;
                }
                .adm-chat-main__textarea {
                    flex: 1;
                    padding: 10px 14px;
                    border: 1px solid var(--a-border, #e2e5ef);
                    border-radius: 12px;
                    font-size: 14px;
                    font-family: inherit;
                    resize: none;
                    outline: none;
                    background: var(--a-surface-alt, #f7f8fc);
                    color: var(--a-text, #0f1729);
                    transition: border-color .15s;
                    line-height: 1.5;
                }
                .adm-chat-main__textarea:focus { border-color: var(--a-primary, #c8956c); background: var(--a-surface, #fff); }
                .adm-chat-main__send {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 10px 20px;
                    background: var(--a-primary-gradient, linear-gradient(135deg, #c8956c, #d4a67e));
                    color: #fff;
                    border: none;
                    border-radius: 12px;
                    font-size: 14px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: opacity .15s;
                    white-space: nowrap;
                }
                .adm-chat-main__send:disabled { opacity: .5; cursor: default; }
                .adm-chat-main__send:not(:disabled):hover { opacity: .88; }

                /* ── Quick Replies ── */
                .adm-qr-wrap {
                    position: relative;
                    padding: 6px 20px 0;
                    background: var(--a-surface, #fff);
                    border-top: 1px solid var(--a-border-light, #eef0f6);
                    flex-shrink: 0;
                }
                .adm-qr-toggle {
                    display: inline-flex;
                    align-items: center;
                    gap: 5px;
                    padding: 5px 12px;
                    border: 1px solid var(--a-border, #e2e5ef);
                    border-radius: 20px;
                    background: var(--a-surface-alt, #f7f8fc);
                    color: var(--a-text-secondary, #5b6478);
                    font-size: 12px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all .15s;
                }
                .adm-qr-toggle:hover, .adm-qr-toggle--active {
                    background: var(--a-primary-light, rgba(200,149,108,.12));
                    color: var(--a-primary, #c8956c);
                    border-color: var(--a-primary, #c8956c);
                }

                .adm-qr-panel {
                    position: absolute;
                    bottom: calc(100% + 4px);
                    left: 20px;
                    right: 20px;
                    background: var(--a-surface, #fff);
                    border: 1px solid var(--a-border, #e2e5ef);
                    border-radius: 14px;
                    box-shadow: 0 -4px 24px rgba(0,0,0,.12);
                    z-index: 100;
                    overflow: hidden;
                    max-height: 320px;
                    display: flex;
                    flex-direction: column;
                }
                .adm-qr-panel__header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 10px 14px;
                    border-bottom: 1px solid var(--a-border-light, #eef0f6);
                    font-size: 13px;
                    font-weight: 700;
                    color: var(--a-text, #0f1729);
                    flex-shrink: 0;
                    background: var(--a-surface-alt, #f7f8fc);
                }
                .adm-qr-add-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    padding: 4px 10px;
                    background: var(--a-primary, #c8956c);
                    color: #fff;
                    border: none;
                    border-radius: 8px;
                    font-size: 12px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: opacity .15s;
                }
                .adm-qr-add-btn:hover { opacity: .85; }

                .adm-qr-list {
                    overflow-y: auto;
                    flex: 1;
                    padding: 6px 0;
                }
                .adm-qr-list::-webkit-scrollbar { width: 4px; }
                .adm-qr-list::-webkit-scrollbar-thumb { background: var(--a-border); border-radius: 4px; }

                .adm-qr-empty {
                    text-align: center;
                    padding: 20px;
                    color: var(--a-text-secondary);
                    font-size: 13px;
                }

                .adm-qr-item {
                    display: flex;
                    align-items: flex-start;
                    gap: 6px;
                    padding: 7px 14px;
                    border-bottom: 1px solid var(--a-border-light, #eef0f6);
                    transition: background .12s;
                }
                .adm-qr-item:last-child { border-bottom: none; }
                .adm-qr-item--new { background: rgba(200,149,108,.04); }

                .adm-qr-item__text {
                    flex: 1;
                    font-size: 13px;
                    color: var(--a-text, #0f1729);
                    line-height: 1.45;
                    cursor: pointer;
                    padding: 2px 4px;
                    border-radius: 6px;
                    transition: background .12s, color .12s;
                }
                .adm-qr-item__text:hover {
                    background: var(--a-primary-light, rgba(200,149,108,.1));
                    color: var(--a-primary, #c8956c);
                }

                .adm-qr-item__actions {
                    display: flex;
                    gap: 4px;
                    flex-shrink: 0;
                    opacity: 0;
                    transition: opacity .15s;
                }
                .adm-qr-item:hover .adm-qr-item__actions { opacity: 1; }

                .adm-qr-item__edit { flex: 1; display: flex; flex-direction: column; gap: 6px; }
                .adm-qr-item__edit-input {
                    width: 100%;
                    padding: 7px 10px;
                    border: 1px solid var(--a-primary, #c8956c);
                    border-radius: 8px;
                    font-size: 13px;
                    font-family: inherit;
                    resize: none;
                    outline: none;
                    background: var(--a-surface, #fff);
                    color: var(--a-text, #0f1729);
                    line-height: 1.45;
                }
                .adm-qr-item__edit-actions {
                    display: flex;
                    gap: 6px;
                    justify-content: flex-end;
                }

                .adm-qr-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 3px;
                    padding: 4px 9px;
                    border: none;
                    border-radius: 7px;
                    font-size: 12px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: opacity .15s;
                }
                .adm-qr-btn--edit   { background: var(--a-surface-alt, #f7f8fc); color: var(--a-text-secondary); border: 1px solid var(--a-border, #e2e5ef); }
                .adm-qr-btn--delete { background: #fef2f2; color: #ef4444; border: 1px solid #fecaca; }
                .adm-qr-btn--save   { background: var(--a-primary, #c8956c); color: #fff; }
                .adm-qr-btn--cancel { background: var(--a-surface-alt, #f7f8fc); color: var(--a-text-secondary); border: 1px solid var(--a-border); }
                .adm-qr-btn:hover   { opacity: .82; }
            `}</style>
        </div>
    );
}

export default AdminChat;
