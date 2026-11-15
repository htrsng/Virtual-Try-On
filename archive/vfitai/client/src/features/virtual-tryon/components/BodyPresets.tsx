import { useMemo } from 'react';
import type { Profile } from '../../../contexts/FittingRoomContext';
import { estimateBodyFromHW as estimateBodyFromHWWithLimits } from '../../../utils/bodyProfileConstraints';

export interface BodyShape {
    id: string;
    label: string;
    description: string;
    icon: string;
}

const SHAPES: Record<string, BodyShape> = {
    hourglass: { id: 'hourglass', label: 'Đồng hồ cát', description: 'Vai/ngực ≈ hông, eo thon', icon: 'hourglass' },
    invertedTriangle: { id: 'invertedTriangle', label: 'Tam giác ngược', description: 'Vai & ngực rộng, hông hẹp', icon: 'invTriangle' },
    triangle: { id: 'triangle', label: 'Tam giác (Lê)', description: 'Hông rộng, vai & ngực hẹp', icon: 'triangle' },
    rectangle: { id: 'rectangle', label: 'Chữ nhật', description: 'Vai, ngực, eo, hông tương đương', icon: 'rectangle' },
    oval: { id: 'oval', label: 'Oval', description: 'Eo & bụng rộng nhất', icon: 'oval' },
};

/**
 * Detect body shape from shoulder, chest, waist, hips.
 *
 * Logic dựa trên tỷ lệ chuẩn:
 *  - "Phần trên" = max(vai*2, ngực)  → đại diện khung trên cơ thể
 *  - So sánh phần trên vs hông, và eo vs cả hai
 *
 * Vai (shoulder) là nửa vai nên *2 để so sánh với ngực/hông (chu vi).
 */
export function detectBodyShape(profile: Profile): BodyShape {
    const { shoulder, chest, waist, hips } = profile;

    // Vai đo nửa → nhân 2 để quy về chu vi tương đương
    const upperBody = Math.max(shoulder * 2, chest);

    const upperToHip = upperBody / hips;   // phần trên so với hông
    const waistToHip = waist / hips;       // eo so với hông
    const waistToUpper = waist / upperBody; // eo so với phần trên
    const diff = Math.abs(upperBody - hips);

    // ─── Đồng hồ cát ───
    // Phần trên ≈ hông (chênh < 8%), eo thon rõ (< 75% hông)
    if (diff / hips < 0.08 && waistToHip < 0.75) {
        return SHAPES.hourglass;
    }

    // ─── Tam giác ngược (V-shape) ───
    // Vai/ngực rộng hơn hông rõ rệt (>10%), eo không quá rộng
    if (upperToHip > 1.10 && waistToUpper < 0.85) {
        return SHAPES.invertedTriangle;
    }

    // ─── Tam giác / Quả lê ───
    // Hông rộng hơn phần trên rõ (>8%), eo vừa phải
    if (upperToHip < 0.92) {
        return SHAPES.triangle;
    }

    // ─── Oval ───
    // Eo gần bằng hoặc lớn hơn cả phần trên và hông
    if (waistToUpper > 0.90 && waistToHip > 0.85) {
        return SHAPES.oval;
    }

    // ─── Chữ nhật (H-shape) ───
    // Vai, ngực, eo, hông đều tương đương, không có đường cong rõ
    return SHAPES.rectangle;
}

/** Estimate full body measurements from height + weight using anthropometric formulas */
export function estimateBodyFromHW(height: number, weight: number): Partial<Profile> {
    return estimateBodyFromHWWithLimits(height, weight);
}

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
