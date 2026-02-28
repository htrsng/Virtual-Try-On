interface CameraView {
    id: string;
    label: string;
    icon: string;
    position: [number, number, number];
    target: [number, number, number];
}

const CAMERA_VIEWS: CameraView[] = [
    { id: 'front', label: 'Trước', icon: '⊙', position: [0, 0.7, 4.5], target: [0, 0.4, 0] },
    { id: 'side-left', label: 'Trái', icon: '◐', position: [4.5, 0.7, 0], target: [0, 0.4, 0] },
    { id: 'side-right', label: 'Phải', icon: '◑', position: [-4.5, 0.7, 0], target: [0, 0.4, 0] },
    { id: 'back', label: 'Sau', icon: '◉', position: [0, 0.7, -4.5], target: [0, 0.4, 0] },
    { id: 'three-quarter', label: '3/4', icon: '◈', position: [3.2, 1.2, 3.2], target: [0, 0.4, 0] },
];

interface CameraPresetsProps {
    activeView: string;
    isRotating: boolean;
    onSelectView: (view: CameraView) => void;
    onToggleRotate: () => void;
}

export default function CameraPresets({ activeView, isRotating, onSelectView, onToggleRotate }: CameraPresetsProps) {
    return (
        <div className="vto-camera">
            <div className="vto-camera__views">
                {CAMERA_VIEWS.map(view => (
                    <button
                        key={view.id}
                        className={`vto-camera__btn ${activeView === view.id ? 'active' : ''}`}
                        onClick={() => onSelectView(view)}
                        title={view.label}
                    >
                        <span className="vto-camera__btn-icon">{view.icon}</span>
                        <span className="vto-camera__btn-label">{view.label}</span>
                    </button>
                ))}
            </div>
            <div className="vto-camera__divider" />
            <button
                className={`vto-camera__btn vto-camera__btn--rotate ${isRotating ? 'active' : ''}`}
                onClick={onToggleRotate}
                title={isRotating ? 'Dừng xoay' : 'Tự động xoay'}
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <polyline points="23 4 23 10 17 10" />
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                </svg>
            </button>
        </div>
    );
}

export { CAMERA_VIEWS };
export type { CameraView };
