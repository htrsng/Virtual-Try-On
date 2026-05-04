import { useState, useEffect } from 'react';
import axios from 'axios';
import './AIManagerPage.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function AIManagerPage() {
    const [logs, setLogs] = useState([]);
    const [stats, setStats] = useState({ totalRequests: 0, last7Days: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const token = localStorage.getItem('token');
                const headers = token ? { Authorization: `Bearer ${token}` } : {};
                const { data } = await axios.get(`${API}/api/admin/ai-stats`, { headers });
                setStats({
                    totalRequests: Number(data?.totalRequests) || 0,
                    last7Days: Array.isArray(data?.last7Days) ? data.last7Days : [],
                });
                setLogs(Array.isArray(data?.recentPrompts) ? data.recentPrompts : []);
            } catch (_) {
                setStats({ totalRequests: 0, last7Days: [] });
                setLogs([]);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    return (
        <div className="ai-manager">
            <div className="ai-manager-header">
                <h1 className="ai-manager-title">AI Manager</h1>
                <p className="ai-manager-sub">Theo doi hoat dong AI Outfit Generator</p>
            </div>

            <div className="ai-kpi-row">
                <div className="ai-kpi">
                    <span className="ai-kpi-num">{stats.totalRequests ?? 0}</span>
                    <span className="ai-kpi-lbl">Tong luot dung AI</span>
                </div>
                <div className="ai-kpi">
                    <span className="ai-kpi-num">
                        {stats.last7Days?.reduce((s, d) => s + (Number(d.count) || 0), 0) ?? 0}
                    </span>
                    <span className="ai-kpi-lbl">7 ngay qua</span>
                </div>
                <div className="ai-kpi">
                    <span className="ai-kpi-num">{logs.length}</span>
                    <span className="ai-kpi-lbl">Cau hoi gan nhat</span>
                </div>
            </div>

            <div className="ai-logs-section">
                <h2 className="ai-logs-title">Lich su cau hoi nguoi dung</h2>
                {loading ? (
                    <div className="ai-loading">Dang tai...</div>
                ) : logs.length === 0 ? (
                    <div className="ai-empty">Chua co du lieu. AI chua duoc su dung.</div>
                ) : (
                    <table className="ai-logs-table">
                        <thead>
                            <tr>
                                <th>Thoi gian</th>
                                <th>Cau hoi cua user</th>
                                <th>Outfit goi y</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map((log, i) => (
                                <tr key={`${log.createdAt || 'row'}-${i}`}>
                                    <td className="log-time">
                                        {log.createdAt ? new Date(log.createdAt).toLocaleString('vi-VN') : '-'}
                                    </td>
                                    <td className="log-prompt">"{log.userPrompt || ''}"</td>
                                    <td className="log-count">{Number(log.outfitCount) || 0} items</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <div className="ai-config-section">
                <h2 className="ai-logs-title">Cau hinh System Prompt</h2>
                <p className="ai-config-note">
                    System prompt hien tai dang duoc hardcode trong backend.
                    Sau khi AI Outfit Generator hoan chinh, co the cho phep chinh sua tu day.
                </p>
                <div className="ai-prompt-preview">
                    <code>
                        Ban la AI stylist cho VFitAI - nen tang thoi trang Viet Nam.
                        Nhiem vu: phan tich tu do cua user va goi y outfit phu hop voi yeu cau...
                    </code>
                </div>
            </div>
        </div>
    );
}
