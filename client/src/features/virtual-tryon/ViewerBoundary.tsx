import { Component, type ReactNode } from 'react';

export default class ViewerBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
    state = { failed: false };
    static getDerivedStateFromError() { return { failed: true }; }
    render() {
        if (this.state.failed) return <div role="alert" data-testid="viewer-error" style={{ padding: 32 }}>
            <p>Không thể tải mô hình 3D. Kiểm tra kết nối và thử lại.</p>
            <button type="button" onClick={() => window.location.reload()}>Tải lại mô hình</button>
        </div>;
        return this.props.children;
    }
}
