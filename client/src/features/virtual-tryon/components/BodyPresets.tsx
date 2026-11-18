import { useMemo } from 'react';
import type { Profile } from '../../../contexts/FittingRoomContext';
import { detectBodyShape } from './bodyShape';

/* ─── Shape icon SVG (simple body silhouette) ─── */
function ShapeIcon({ shape }: { shape: string }) {
    const paths: Record<string, React.ReactNode> = {
        hourglass: (
            <path d="M8 2h8l-2 8 2 8H8l2-8-2-8z" fill="currentColor" opacity="0.7" />
        ),
        invTriangle: (
            <path d="M4 3h16l-4 17H8L4 3z" fill="currentColor" opacity="0.7" />
        ),
        triangle: (
            <path d="M8 3h8l4 17H4L8 3z" fill="currentColor" opacity="0.7" />
        ),
        rectangle: (
            <rect x="6" y="2" width="12" height="20" rx="2" fill="currentColor" opacity="0.7" />
        ),
        oval: (
            <ellipse cx="12" cy="12" rx="7" ry="10" fill="currentColor" opacity="0.7" />
        ),
    };
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            {paths[shape] || paths.rectangle}
        </svg>
    );
}

/* ─── Component: displays detected body shape ─── */
interface BodyShapeIndicatorProps {
    profile: Profile;
    onAutoFill: () => void;
}

export default function BodyShapeIndicator({ profile, onAutoFill }: BodyShapeIndicatorProps) {
    const shape = useMemo(() => detectBodyShape(profile), [profile]);

    return (
        <div className="bed-shape">
            <div className="bed-shape__icon">
                <ShapeIcon shape={shape.icon} />
            </div>
            <div className="bed-shape__info">
                <span className="bed-shape__label">{shape.label}</span>
                <span className="bed-shape__desc">{shape.description}</span>
            </div>
            <button
                className="bed-shape__auto"
                onClick={onAutoFill}
                title="Tự động ước lượng số đo từ chiều cao & cân nặng"
            >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
                </svg>
                Tự động
            </button>
        </div>
    );
}
