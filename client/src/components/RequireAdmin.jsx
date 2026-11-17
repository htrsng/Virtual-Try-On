import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function RequireAdmin({ children }) {
    const { user, loading } = useAuth();
    if (loading) return <div role="status">Đang xác thực quyền truy cập…</div>;
    if (!user) return <Navigate to="/login" replace />;
    if (user.role !== 'admin') return <Navigate to="/" replace />;
    return children;
}
