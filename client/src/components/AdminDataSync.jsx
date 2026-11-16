import React, { useState, useEffect } from 'react';
import { FiRefreshCw, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import axios from 'axios';
import '../styles/admin-sync.css';

function AdminDataSync() {
    const [syncStatus, setSyncStatus] = useState(null);
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);

    const API_BASE = '/api/admin';

    // Kiểm tra status khi mounting
    useEffect(() => {
        checkSync();
    }, []);

    const checkSync = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_BASE}/sync-status`);
            setSyncStatus(res.data.data);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const getAllData = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_BASE}/get-all-data`);
            setData(res.data.data);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-sync-container">
            <div className="sync-header">
                <h2>🔄 Quản lý đồng bộ dữ liệu</h2>
                <p>Kiểm tra và xem dữ liệu từ web trong admin</p>
            </div>

            {/* Status Card */}
            {syncStatus && (
                <div className={`sync-status-card ${syncStatus.isSynced ? 'synced' : 'not-synced'}`}>
                    <div className="status-icon">
                        {syncStatus.isSynced ?
                            <FiCheckCircle size={32} /> :
                            <FiAlertCircle size={32} />
                        }
                    </div>
                    <div className="status-content">
                        <h3>{syncStatus.isSynced ? '✅ Dữ liệu đã đồng bộ' : '❌ Dữ liệu chưa đồng bộ'}</h3>
                        <p>Orders: <strong>{syncStatus.totalOrders}</strong> | Users: <strong>{syncStatus.totalUsers}</strong> | Products: <strong>{syncStatus.totalProducts}</strong></p>
                        <small>Kiểm tra lúc: {new Date(syncStatus.lastChecked).toLocaleString('vi-VN')}</small>
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            <div className="sync-actions">
                <button
                    className="btn btn-primary"
                    onClick={checkSync}
                    disabled={loading}
                >
                    <FiRefreshCw size={20} /> Kiểm tra Sync
                </button>

                <button
                    className="btn btn-info"
                    onClick={getAllData}
                    disabled={loading}
                >
                    <FiRefreshCw size={20} /> Lấy tất cả dữ liệu
                </button>




            </div>

            {/* Data Display */}
            {data && (
                <div className="sync-data">
                    <h3>📊 Dữ liệu từ Web</h3>
                    <div className="data-summary">
                        <div className="data-item">
                            <span>Tổng đơn</span>
                            <strong>{data.orders}</strong>
                        </div>
                        <div className="data-item">
                            <span>Tổng user</span>
                            <strong>{data.users}</strong>
                        </div>
                        <div className="data-item">
                            <span>Tổng sản phẩm</span>
                            <strong>{data.products.length}</strong>
                        </div>
                    </div>

                    {data.products.length > 0 && (
                        <div className="top-products">
                            <h4>🏆 Top sản phẩm</h4>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Sản phẩm</th>
                                        <th>Đã bán</th>
                                        <th>Doanh thu</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.products
                                        .sort((a, b) => b.totalRevenue - a.totalRevenue)
                                        .slice(0, 10)
                                        .map((p, i) => (
                                            <tr key={i}>
                                                <td>{p.name}</td>
                                                <td>{p.quantity}</td>
                                                <td>{new Intl.NumberFormat('vi-VN', {
                                                    style: 'currency',
                                                    currency: 'VND'
                                                }).format(p.totalRevenue)}</td>
                                            </tr>
                                        ))
                                    }
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Confirm Dialogs */}
            {loading && <div className="loading">⏳ Đang xử lý...</div>}
        </div>
    );
}

export default AdminDataSync;
