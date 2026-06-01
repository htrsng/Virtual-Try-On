import React, { useState, useRef, useCallback, useEffect } from 'react';
import './SizeComparisonRoom.css';

/* ═══════════════════════════════════════════════════════════════
   INLINE SVG ICONS
   ═══════════════════════════════════════════════════════════════ */
const IcShirt = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.57a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.57a2 2 0 0 0-1.34-2.23z"/>
  </svg>
);
const IcCols = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="8" height="18" rx="1"/><rect x="13" y="3" width="8" height="18" rx="1"/>
  </svg>
);
const IcLayers = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2 2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
  </svg>
);
const IcSlide = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 16l-4-4 4-4M17 8l4 4-4 4"/><line x1="3" y1="12" x2="21" y2="12"/>
  </svg>
);
const IcRotate = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a10 10 0 1 0 10 10"/><path d="M22 2v6h-6"/>
  </svg>
);
const IcCog = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);
const IcDl = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);
const IcMore = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
    <circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>
  </svg>
);
const IcUpload = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
  </svg>
);
const IcArrowsH = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 16l-4-4 4-4M17 8l4 4-4 4"/><line x1="3" y1="12" x2="21" y2="12"/>
  </svg>
);
const IcArrowUp = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="18 15 12 9 6 15"/>
  </svg>
);
const IcArrowDown = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);
const IcMinus = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const IcRuler = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.3 8.7 8.7 21.3a2 2 0 0 1-2.8 0L2.7 18a2 2 0 0 1 0-2.8L15.3 2.7a2 2 0 0 1 2.8 0l3.2 3.2a2 2 0 0 1 0 2.8z"/>
    <path d="m7.5 10.5 2 2M10.5 7.5l2 2M13.5 4.5l2 2M4.5 13.5l2 2"/>
  </svg>
);
const IcMenu = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
    <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);
const IcX = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

/* ═══════════════════════════════════════════════════════════════
   SIZE DATA
   ═══════════════════════════════════════════════════════════════ */
const SIZES: Record<string, { chest: number; waist: number; sleeve: number; shoulder: number; hip: number }> = {
  'XS':  { chest: 80,  waist: 64,  sleeve: 56, shoulder: 36, hip: 86  },
  'S':   { chest: 88,  waist: 72,  sleeve: 57, shoulder: 38, hip: 92  },
  'M':   { chest: 96,  waist: 80,  sleeve: 58, shoulder: 40, hip: 98  },
  'L':   { chest: 104, waist: 88,  sleeve: 59, shoulder: 42, hip: 104 },
  'XL':  { chest: 112, waist: 96,  sleeve: 60, shoulder: 44, hip: 110 },
  'XXL': { chest: 120, waist: 104, sleeve: 61, shoulder: 46, hip: 116 },
};
const SIZE_KEYS = Object.keys(SIZES);

function getDiff(a: string, b: string) {
  const sa = SIZES[a], sb = SIZES[b];
  if (!sa || !sb) return [];
  return [
    { label: 'Vòng ngực',     delta: sb.chest    - sa.chest    },
    { label: 'Vòng eo',       delta: sb.waist    - sa.waist    },
    { label: 'Chiều dài tay', delta: sb.sleeve   - sa.sleeve   },
    { label: 'Bề rộng vai',   delta: sb.shoulder - sa.shoulder },
  ];
}

function fitLabel(k: string, userChest = 96): string {
  const s = SIZES[k]; if (!s) return '';
  const d = s.chest - userChest;
  if (d < -4) return 'Quá chật';
  if (d < 0)  return 'Vừa khít';
  if (d < 6)  return 'Vừa vặn';
  if (d < 16) return `Rộng hơn ${d}cm`;
  return 'Khá rộng';
}

/* ═══════════════════════════════════════════════════════════════
   BODY FIGURE SVG — matches screenshot style (coat silhouette)
   ═══════════════════════════════════════════════════════════════ */
interface FigProps {
  sizeKey: string;
  variant: 'a' | 'b';
  showOutline: boolean;
  showPoints: boolean;
  showHeatmap: boolean;
  opacity?: number;
}

const BodyFigure: React.FC<FigProps> = ({ sizeKey, variant, showOutline, showPoints, showHeatmap, opacity = 1 }) => {
  const sz = SIZES[sizeKey] || SIZES['M'];

  // Geometry — normalised to 200-wide viewbox, scaled per chest measurement
  const cw  = 78 + (sz.chest - 80) * 0.52;   // coat chest width
  const ww  = 60 + (sz.waist - 64) * 0.48;   // coat waist width
  const sw  = cw + 18;                         // shoulder span (coat has wide shoulders)
  const hw  = ww + 18;                         // hip width
  const sl  = 55 + (sz.sleeve - 56) * 1.2;   // sleeve length

  const col     = variant === 'a' ? '#1A56DB' : '#D97706';
  const bodyFill = '#C5BDB4';  // warm gray matching screenshot
  const bodyDark = '#B5ADA4';
  const coatFill = '#C8C0B7';  // coat slightly lighter
  const coatDark = '#B8B0A7';
  const skinFill = '#D4C8BE';

  const gradId  = `grad-body-${variant}`;
  const heatId  = `heat-${variant}-${sizeKey}`;

  // Chest line y-position (at mid-chest of coat)
  const chestY   = 148;
  const shoulderY = 80;

  return (
    <svg viewBox="0 0 200 400" xmlns="http://www.w3.org/2000/svg"
      style={{ height: '100%', width: 'auto', opacity, transition: 'opacity .3s' }}>
      <defs>
        <linearGradient id={gradId} x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0%"   stopColor={coatFill}/>
          <stop offset="100%" stopColor={coatDark}/>
        </linearGradient>
        <radialGradient id={heatId} cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#4CAF50" stopOpacity=".7"/>
          <stop offset="55%"  stopColor="#FFEB3B" stopOpacity=".55"/>
          <stop offset="100%" stopColor="#F44336" stopOpacity=".3"/>
        </radialGradient>
      </defs>

      {/* ── Head ── */}
      <ellipse cx="100" cy="34" rx="22" ry="26" fill={skinFill} stroke={bodyDark} strokeWidth=".8"/>

      {/* ── Neck ── */}
      <rect x="93" y="58" width="14" height="16" rx="3" fill={skinFill} stroke={bodyDark} strokeWidth=".6"/>

      {/* ── Coat collar area ── */}
      <path d={`M 90 72 L ${100-16} 88 L ${100+16} 88 L 110 72 Z`}
        fill={coatFill} stroke={coatDark} strokeWidth=".8"/>

      {/* ── Left arm (coat sleeve) ── */}
      <path d={`
        M ${100 - sw/2 - 2} ${shoulderY}
        C ${100 - sw/2 - 12} ${shoulderY + 14}
          ${100 - sw/2 - 14} ${shoulderY + sl*0.5}
          ${100 - sw/2 - 10} ${shoulderY + sl}
        L ${100 - sw/2 + 4}  ${shoulderY + sl}
        C ${100 - sw/2 + 2}  ${shoulderY + sl*0.5}
          ${100 - sw/2 + 2}  ${shoulderY + 14}
          ${100 - sw/2 + 8}  ${shoulderY}
        Z
      `} fill={`url(#${gradId})`} stroke={coatDark} strokeWidth=".8"/>

      {/* ── Right arm (coat sleeve) ── */}
      <path d={`
        M ${100 + sw/2 + 2} ${shoulderY}
        C ${100 + sw/2 + 12} ${shoulderY + 14}
          ${100 + sw/2 + 14} ${shoulderY + sl*0.5}
          ${100 + sw/2 + 10} ${shoulderY + sl}
        L ${100 + sw/2 - 4}  ${shoulderY + sl}
        C ${100 + sw/2 - 2}  ${shoulderY + sl*0.5}
          ${100 + sw/2 - 2}  ${shoulderY + 14}
          ${100 + sw/2 - 8}  ${shoulderY}
        Z
      `} fill={`url(#${gradId})`} stroke={coatDark} strokeWidth=".8"/>

      {/* ── Coat body (torso) ── */}
      <path d={`
        M ${100 - sw/2 + 6} ${shoulderY}
        C ${100 - cw/2 - 2} ${shoulderY + 18}
          ${100 - ww/2 - 4} 185
          ${100 - ww/2}     210
        L ${100 - hw/2 + 4} 260
        L ${100 + hw/2 - 4} 260
        L ${100 + ww/2}     210
        C ${100 + ww/2 + 4} 185
          ${100 + cw/2 + 2} ${shoulderY + 18}
          ${100 + sw/2 - 6} ${shoulderY}
        Z
      `} fill={`url(#${gradId})`} stroke={coatDark} strokeWidth=".8"/>

      {/* ── Coat centre line (zipper) ── */}
      <line x1="100" y1={shoulderY + 8} x2="100" y2="255"
        stroke={coatDark} strokeWidth=".7" strokeDasharray="3 3" opacity=".5"/>

      {/* ── Coat bottom pocket/hem line ── */}
      <line x1={100 - ww/2 + 2} y1="245" x2={100 + ww/2 - 2} y2="245"
        stroke={coatDark} strokeWidth=".6" opacity=".4"/>

      {/* ── Legs ── */}
      <rect x={100 - hw/2 + 6} y="260" width={hw/2 - 10} height="128" rx="8"
        fill={bodyFill} stroke={bodyDark} strokeWidth=".7"/>
      <rect x={100 + 4}         y="260" width={hw/2 - 10} height="128" rx="8"
        fill={bodyFill} stroke={bodyDark} strokeWidth=".7"/>

      {/* ── Feet ── */}
      <ellipse cx={100 - hw/2 + 6 + (hw/2 - 10)/2} cy="390" rx={hw/4 - 2} ry="5"
        fill={bodyDark} opacity=".7"/>
      <ellipse cx={100 + 4 + (hw/2 - 10)/2}         cy="390" rx={hw/4 - 2} ry="5"
        fill={bodyDark} opacity=".7"/>

      {/* ── HEATMAP ── */}
      {showHeatmap && (
        <>
          <ellipse cx="100" cy={chestY} rx={cw/2 - 4} ry="20" fill={`url(#${heatId})`} opacity=".6"/>
          <ellipse cx="100" cy="195"    rx={ww/2 - 4} ry="12"
            fill={sz.waist > 88 ? '#F44336' : sz.waist > 80 ? '#FFEB3B' : '#4CAF50'}
            opacity=".45"/>
        </>
      )}

      {/* ── MEASUREMENT LINE (chest) ── */}
      {showOutline && (
        <>
          {/* Chest measurement line */}
          <line
            x1={100 - cw/2 + 4} y1={chestY}
            x2={100 + cw/2 - 4} y2={chestY}
            stroke={col} strokeWidth="1.8" strokeDasharray="5 3"
          />
          <circle cx={100 - cw/2 + 4} cy={chestY} r="3.5" fill={col}/>
          <circle cx={100 + cw/2 - 4} cy={chestY} r="3.5" fill={col}/>

          {/* Waist measurement line */}
          <line
            x1={100 - ww/2 + 2} y1="195"
            x2={100 + ww/2 - 2} y2="195"
            stroke={col} strokeWidth="1.5" strokeDasharray="5 3" opacity=".7"
          />
          <circle cx={100 - ww/2 + 2} cy="195" r="3" fill={col} opacity=".75"/>
          <circle cx={100 + ww/2 - 2} cy="195" r="3" fill={col} opacity=".75"/>
        </>
      )}

      {/* ── MEASUREMENT LABELS ── */}
      {showPoints && (
        <>
          {/* Chest label pill */}
          <rect x={100 - 22} y={chestY - 10} width="44" height="18" rx="9"
            fill={col}/>
          <text x="100" y={chestY + 4} textAnchor="middle"
            fill="#fff" fontSize="10" fontWeight="700" fontFamily="Inter, sans-serif">
            {sz.chest}cm
          </text>

          {/* Waist label (smaller, secondary) */}
          <rect x={100 - 16} y="178" width="32" height="14" rx="7"
            fill={col} opacity=".8"/>
          <text x="100" y="189" textAnchor="middle"
            fill="#fff" fontSize="8.5" fontWeight="600" fontFamily="Inter, sans-serif">
            {sz.waist}cm
          </text>

          {/* Shoulder span annotation */}
          <line x1={100 - sw/2 + 6} y1="74" x2={100 + sw/2 - 6} y2="74"
            stroke={col} strokeWidth="1" strokeDasharray="3 2" opacity=".55"/>
          <rect x={100 - 18} y="65" width="36" height="12" rx="6"
            fill={col} opacity=".85"/>
          <text x="100" y="75" textAnchor="middle"
            fill="#fff" fontSize="8" fontWeight="600" fontFamily="Inter, sans-serif">
            Vai {sz.shoulder}cm
          </text>
        </>
      )}
    </svg>
  );
};

/* ═══════════════════════════════════════════════════════════════
   SPLIT VIEW
   ═══════════════════════════════════════════════════════════════ */
interface ViewProps {
  sizeA: string; sizeB: string;
  showOutline: boolean; showPoints: boolean; showHeatmap: boolean;
}

const SplitView: React.FC<ViewProps> = ({ sizeA, sizeB, showOutline, showPoints, showHeatmap }) => {
  const [split, setSplit] = useState(50);
  const ref    = useRef<HTMLDivElement>(null);
  const drag   = useRef(false);

  const onMove = useCallback((e: MouseEvent) => {
    if (!drag.current || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    setSplit(Math.max(30, Math.min(70, ((e.clientX - r.left) / r.width) * 100)));
  }, []);
  const onUp = useCallback(() => {
    drag.current = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [onMove, onUp]);

  return (
    <div ref={ref} className="scr-split" style={{ position: 'relative', height: '100%' }}>
      {/* Panel A */}
      <div className="scr-panel"
        style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${split}%`, overflow: 'hidden' }}>
        <div className="scr-panel-badge">
          <div className="scr-size-tag a">Size {sizeA}</div>
          <span className="scr-panel-fit">{fitLabel(sizeA)}</span>
        </div>
        <div className="scr-fig-wrap">
          <BodyFigure sizeKey={sizeA} variant="a"
            showOutline={showOutline} showPoints={showPoints} showHeatmap={showHeatmap}/>
        </div>
        <div className="scr-panel-hint">Kéo để xoay · Cuộn để phóng to</div>
      </div>

      {/* Divider + Handle */}
      <div className="scr-divider" style={{ left: `${split}%` }}>
        <div className="scr-divider-line"/>
        <div className="scr-divider-handle"
          onMouseDown={() => {
            drag.current = true;
            document.body.style.cursor = 'ew-resize';
            document.body.style.userSelect = 'none';
          }}>
          <IcArrowsH/>
        </div>
      </div>

      {/* Panel B */}
      <div className="scr-panel"
        style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: `${100 - split}%`, overflow: 'hidden' }}>
        <div className="scr-panel-badge">
          <div className="scr-size-tag b">Size {sizeB}</div>
          <span className="scr-panel-fit">{fitLabel(sizeB)}</span>
        </div>
        <div className="scr-fig-wrap">
          <BodyFigure sizeKey={sizeB} variant="b"
            showOutline={showOutline} showPoints={showPoints} showHeatmap={showHeatmap}/>
        </div>
        <div className="scr-panel-hint">Kéo để xoay · Cuộn để phóng to</div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   OVERLAY VIEW
   ═══════════════════════════════════════════════════════════════ */
const OverlayView: React.FC<ViewProps> = ({ sizeA, sizeB, showOutline, showPoints, showHeatmap }) => {
  const [opacity, setOpacity] = useState(55);
  return (
    <div className="scr-overlay">
      <div className="scr-overlay-labels">
        <div className="scr-size-tag a">Size {sizeA}</div>
        <span style={{ color: '#9CA3AF', fontWeight: 700 }}>+</span>
        <div className="scr-size-tag b">Size {sizeB}</div>
        <span style={{ fontSize: 11, color: '#9CA3AF' }}>đè lên</span>
      </div>

      <div className="scr-overlay-fig" style={{ position: 'relative' }}>
        <BodyFigure sizeKey={sizeA} variant="a"
          showOutline={showOutline} showPoints={showPoints} showHeatmap={showHeatmap}/>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <BodyFigure sizeKey={sizeB} variant="b"
            showOutline={showOutline} showPoints={false} showHeatmap={false}
            opacity={opacity / 100}/>
        </div>
      </div>

      <div className="scr-overlay-ctrl">
        <span className="scr-ctrl-label">Opacity Size B</span>
        <input type="range" min={20} max={80} value={opacity}
          onChange={e => setOpacity(+e.target.value)} className="scr-ctrl-slider"/>
        <span className="scr-ctrl-pct">{opacity}%</span>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   SLIDE VIEW
   ═══════════════════════════════════════════════════════════════ */
const SlideView: React.FC<ViewProps> = ({ sizeA, sizeB, showOutline, showPoints, showHeatmap }) => {
  const [pct, setPct] = useState(50);
  const ref  = useRef<HTMLDivElement>(null);
  const drag = useRef(false);

  const upd = useCallback((cx: number) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    setPct(Math.max(5, Math.min(95, ((cx - r.left) / r.width) * 100)));
  }, []);

  useEffect(() => {
    const mv = (e: MouseEvent) => { if (drag.current) upd(e.clientX); };
    const up = () => { drag.current = false; document.body.style.cursor = ''; };
    window.addEventListener('mousemove', mv);
    window.addEventListener('mouseup', up);
    return () => {
      window.removeEventListener('mousemove', mv);
      window.removeEventListener('mouseup', up);
    };
  }, [upd]);

  return (
    <div ref={ref} className="scr-slide"
      onMouseDown={e => { drag.current = true; document.body.style.cursor = 'ew-resize'; upd(e.clientX); }}>

      {/* B — background */}
      <div className="scr-slide-bg">
        <div className="scr-slide-fig" style={{ height: '88%', maxHeight: 420, display: 'flex', alignItems: 'flex-end' }}>
          <BodyFigure sizeKey={sizeB} variant="b"
            showOutline={showOutline} showPoints={showPoints} showHeatmap={showHeatmap}/>
        </div>
      </div>

      {/* A — clipped foreground */}
      <div className="scr-slide-fg" style={{ width: `${pct}%` }}>
        <div className="scr-slide-fig" style={{ height: '88%', maxHeight: 420, display: 'flex', alignItems: 'flex-end' }}>
          <BodyFigure sizeKey={sizeA} variant="a"
            showOutline={showOutline} showPoints={showPoints} showHeatmap={showHeatmap}/>
        </div>
      </div>

      {/* Divider */}
      <div className="scr-slide-bar" style={{ left: `${pct}%` }}>
        <div className="scr-slide-knob"><IcArrowsH/></div>
      </div>

      <div className="scr-slide-lbl-a">Size {sizeA}</div>
      <div className="scr-slide-lbl-b">Size {sizeB}</div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   AI MODAL
   ═══════════════════════════════════════════════════════════════ */
const AiModal: React.FC<{ sizeA: string; sizeB: string; onClose: () => void; onPick: (s: string) => void }> =
  ({ sizeA, sizeB, onClose, onPick }) => {
  const [phase, setPhase] = useState<'loading' | 'result'>('loading');
  const userChest = 96;
  const rec  = SIZES[sizeA].chest <= userChest + 4 ? sizeA : sizeB;
  const diff = SIZES[rec].chest - userChest;
  const reason = `Dựa trên số đo của bạn (Ngực ${userChest}cm · Eo 80cm), size ${rec} phù hợp nhất${diff > 0 ? ` — dư ${diff}cm để thoải mái` : ''}.`;

  useEffect(() => {
    const t = setTimeout(() => setPhase('result'), 1800);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="scr-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="scr-modal">
        <div className="scr-modal-header">
          <div className="scr-modal-title">✨ Gợi ý size phù hợp</div>
          <button className="scr-icon-btn" onClick={onClose}><IcX/></button>
        </div>
        <div className="scr-modal-sub">
          Phân tích {sizeA} và {sizeB} theo số đo cơ thể của bạn
        </div>

        {phase === 'loading' ? (
          <div className="scr-modal-loading">
            <div className="scr-spinner"/>
            <div style={{ fontSize: 12, color: '#6B7280' }}>Đang phân tích số đo…</div>
          </div>
        ) : (
          <>
            <div className="scr-modal-result">
              <div className="scr-modal-rec-label">Khuyến nghị của AI</div>
              <div className="scr-modal-rec-size">Size {rec}</div>
              <div className="scr-modal-rec-reason">{reason}</div>
            </div>
            <div className="scr-modal-actions">
              <button className="scr-btn-outline" style={{ padding: '8px 16px' }} onClick={onClose}>
                Đóng
              </button>
              <button className="scr-btn-primary" style={{ padding: '8px 18px' }}
                onClick={() => { onPick(rec); onClose(); }}>
                Chọn Size {rec}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   SETTINGS PANEL
   ═══════════════════════════════════════════════════════════════ */
const SettingsPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <div className="scr-settings-panel">
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div className="scr-settings-title">Cài đặt nâng cao</div>
      <button className="scr-icon-btn" onClick={onClose}><IcX/></button>
    </div>
    <div className="scr-settings-lbl">Chất lượng render</div>
    <select className="scr-settings-select">
      <option>Cao (mặc định)</option>
      <option>Trung bình</option>
      <option>Thấp (tốc độ cao)</option>
    </select>
    <div className="scr-settings-lbl">Bảng màu Heatmap</div>
    <div className="scr-heatmap-bar"/>
    <div className="scr-heatmap-labels">
      <span>Vừa vặn</span><span>Hơi rộng</span><span>Quá rộng</span>
    </div>
    <div style={{ marginTop: 12 }} className="scr-settings-lbl">Đơn vị đo</div>
    <select className="scr-settings-select">
      <option>Centimeter (cm)</option>
      <option>Inch (in)</option>
    </select>
  </div>
);

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */
type ViewMode = 'split' | 'overlay' | 'slide';
type Angle    = 'front' | 'back' | 'left' | 'right' | 'top';

interface SizeComparisonRoomProps {
  product?: { name?: string; sku?: string; sizes?: string[] };
  onClose?: () => void;
  onAddToCart?: (size: string) => void;
}

const SizeComparisonRoom: React.FC<SizeComparisonRoomProps> = ({
  product = { name: 'Áo khoác Unisex Bomber', sku: 'SKU-0291', sizes: SIZE_KEYS },
  onClose,
  onAddToCart,
}) => {
  const [mode,        setMode]        = useState<ViewMode>('split');
  const [sizeA,       setSizeA]       = useState('M');
  const [sizeB,       setSizeB]       = useState('L');
  const [angle,       setAngle]       = useState<Angle>('front');
  const [zoom,        setZoom]        = useState(100);
  const [autoRotate,  setAutoRotate]  = useState(false);
  const [showOutline, setShowOutline] = useState(true);
  const [showPoints,  setShowPoints]  = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [settings,    setSettings]    = useState(false);
  const [aiModal,     setAiModal]     = useState(false);
  const [sidebar,     setSidebar]     = useState(false);
  const [loading,     setLoading]     = useState(false);

  const sizes = product.sizes || SIZE_KEYS;

  const changeA = (s: string) => { setLoading(true); setSizeA(s); setTimeout(() => setLoading(false), 450); };
  const changeB = (s: string) => { setLoading(true); setSizeB(s); setTimeout(() => setLoading(false), 450); };

  const diff = getDiff(sizeA, sizeB);

  // Bottom chips
  type ChipType = 'lbl' | 'up' | 'dn' | 'eq';
  const chips: { t: ChipType; icon: React.ReactNode; text: string }[] = [
    { t: 'lbl', icon: <IcRuler/>, text: `${sizeA} vs ${sizeB}` },
    ...diff.map(r => ({
      t:    (r.delta > 0 ? 'up' : r.delta < 0 ? 'dn' : 'eq') as ChipType,
      icon: r.delta > 0 ? <IcArrowUp/> : r.delta < 0 ? <IcArrowDown/> : <IcMinus/>,
      text: `${r.label.replace('Vòng ', '')} ${r.delta > 0 ? '+' : ''}${r.delta}cm`,
    })),
  ];

  const angles: { k: Angle; l: string }[] = [
    { k: 'front', l: 'Trước' }, { k: 'back', l: 'Sau' },
    { k: 'left',  l: 'Bên trái' }, { k: 'right', l: 'Bên phải' },
    { k: 'top',   l: 'Trên xuống' },
  ];

  const viewProps = { sizeA, sizeB, showOutline, showPoints, showHeatmap };

  return (
    <div className="scr">

      {/* ══ TOP BAR ══ */}
      <header className="scr-top">
        {/* Mobile sidebar toggle */}
        <button className="scr-tool-btn scr-menu-btn" onClick={() => setSidebar(v => !v)}>
          <IcMenu/>
        </button>

        {/* Product info */}
        <div className="scr-product">
          <div className="scr-product-icon"><IcShirt/></div>
          <div className="scr-product-name">{product.name}</div>
          {product.sku && <div className="scr-product-sku">{product.sku}</div>}
        </div>

        <div className="scr-sep"/>

        {/* View mode toggle */}
        <div className="scr-toggle">
          <button id="scr-btn-split"
            className={`scr-toggle-btn${mode === 'split' ? ' on' : ''}`}
            onClick={() => setMode('split')}>
            <IcCols/><span>Split view</span>
          </button>
          <button id="scr-btn-overlay"
            className={`scr-toggle-btn${mode === 'overlay' ? ' on' : ''}`}
            onClick={() => setMode('overlay')}>
            <IcLayers/><span>Overlay</span>
          </button>
          <button id="scr-btn-slide"
            className={`scr-toggle-btn${mode === 'slide' ? ' on' : ''}`}
            onClick={() => setMode('slide')}>
            <IcSlide/><span>Slide</span>
          </button>
        </div>

        {/* Tools */}
        <div className="scr-tools" style={{ marginLeft: 'auto' }}>
          <button id="scr-btn-rotate"
            className={`scr-tool-btn${autoRotate ? ' on' : ''}`}
            title="Tự động xoay"
            onClick={() => setAutoRotate(v => !v)}>
            <IcRotate/>
          </button>
          <button id="scr-btn-settings"
            className={`scr-tool-btn${settings ? ' on' : ''}`}
            title="Cài đặt"
            onClick={() => setSettings(v => !v)}>
            <IcCog/>
          </button>
          <button id="scr-btn-download"
            className="scr-tool-btn"
            title="Tải xuống"
            onClick={() => alert('Đang xuất ảnh...')}>
            <IcDl/>
          </button>
          <button className="scr-tool-btn" title="Thêm"><IcMore/></button>
          {onClose && (
            <button className="scr-tool-btn" title="Đóng" onClick={onClose}><IcX/></button>
          )}
        </div>
      </header>

      {/* ══ SIDEBAR ══ */}
      {sidebar && (
        <div onClick={() => setSidebar(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 39, background: 'rgba(0,0,0,.25)' }}/>
      )}

      <aside className={`scr-sidebar${sidebar ? ' open' : ''}`}>

        {/* Model */}
        <div>
          <div className="scr-section-title">Mô hình của bạn</div>
          <div className="scr-model-card">
            <div className="scr-avatar">A</div>
            <div>
              <div className="scr-model-name">Alex</div>
              <div className="scr-model-stats">170cm · 62kg · Vai 43cm</div>
            </div>
          </div>
          <button className="scr-upload-btn">
            <IcUpload/> Tải mô hình khác
          </button>
        </div>

        {/* Size config */}
        <div>
          <div className="scr-section-title">So sánh size</div>

          <div className="scr-size-section">
            <div className="scr-size-label">
              <div className="scr-dot a"/>Size A
            </div>
            <select id="scr-select-a" className="scr-select a" value={sizeA}
              onChange={e => changeA(e.target.value)}>
              {sizes.map(s => (
                <option key={s} value={s} disabled={s === sizeB}>
                  {s} — Ngực {SIZES[s]?.chest}cm · Eo {SIZES[s]?.waist}cm
                </option>
              ))}
            </select>
          </div>

          <div className="scr-size-section" style={{ marginTop: 8 }}>
            <div className="scr-size-label">
              <div className="scr-dot b"/>Size B
            </div>
            <select id="scr-select-b" className="scr-select b" value={sizeB}
              onChange={e => changeB(e.target.value)}>
              {sizes.map(s => (
                <option key={s} value={s} disabled={s === sizeA}>
                  {s} — Ngực {SIZES[s]?.chest}cm · Eo {SIZES[s]?.waist}cm
                </option>
              ))}
            </select>
          </div>

          {/* Diff table */}
          <div className="scr-diff-box" style={{ marginTop: 10 }}>
            <div className="scr-diff-title">Số đo chênh lệch</div>
            {diff.map(r => (
              <div key={r.label} className="scr-diff-row">
                <span className="scr-diff-key">{r.label}</span>
                <span className={`scr-diff-val ${r.delta > 0 ? 'up' : r.delta < 0 ? 'dn' : 'eq'}`}>
                  {r.delta > 0 ? <IcArrowUp/> : r.delta < 0 ? <IcArrowDown/> : <IcMinus/>}
                  {r.delta > 0 ? '+' : ''}{r.delta}cm
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Display options */}
        <div>
          <div className="scr-section-title">Hiển thị</div>
          {(
            [
              [showOutline, setShowOutline, 'Đường viền size'],
              [showPoints,  setShowPoints,  'Điểm đo chi tiết'],
              [showHeatmap, setShowHeatmap, 'Lớp nhiệt (heatmap)'],
            ] as [boolean, React.Dispatch<React.SetStateAction<boolean>>, string][]
          ).map(([val, setter, label]) => (
            <label key={label} className="scr-check-label">
              <input type="checkbox" className="scr-checkbox"
                checked={val} onChange={e => setter(e.target.checked)}/>
              {label}
            </label>
          ))}
        </div>
      </aside>

      {/* ══ VIEWER ══ */}
      <main className="scr-viewer">
        <div className="scr-canvas">
          {loading ? (
            <div className="scr-loading">
              <div className="scr-skel">
                <div className="scr-skel-body"/>
                <div className="scr-skel-lbl">Đang tải Size {sizeA}…</div>
              </div>
              <div className="scr-skel">
                <div className="scr-skel-body"/>
                <div className="scr-skel-lbl">Đang tải Size {sizeB}…</div>
              </div>
            </div>
          ) : (
            <>
              {mode === 'split'   && <SplitView   {...viewProps}/>}
              {mode === 'overlay' && <OverlayView {...viewProps}/>}
              {mode === 'slide'   && <SlideView   {...viewProps}/>}
            </>
          )}
        </div>

        {/* Sub-toolbar: angle + zoom */}
        <div className="scr-subtool">
          <span className="scr-subtool-label">Góc nhìn:</span>
          {angles.map(a => (
            <button key={a.k} id={`scr-angle-${a.k}`}
              className={`scr-angle-btn${angle === a.k ? ' on' : ''}`}
              onClick={() => setAngle(a.k)}>
              {a.l}
            </button>
          ))}
          <div className="scr-zoom-row">
            <span className="scr-zoom-label">Zoom</span>
            <input type="range" min={50} max={200} value={zoom}
              onChange={e => setZoom(+e.target.value)} className="scr-zoom-slider"/>
            <span className="scr-zoom-pct">{zoom}%</span>
          </div>
        </div>
      </main>

      {/* ══ BOTTOM BAR ══ */}
      <footer className="scr-bottom">
        <div className="scr-chips">
          {chips.map((c, i) => (
            <div key={i} className={`scr-chip ${c.t}`}>
              {c.icon}{c.text}
            </div>
          ))}
        </div>
        <div className="scr-cta">
          <button id="scr-ai-btn" className="scr-btn-outline" onClick={() => setAiModal(true)}>
            Gợi ý size phù hợp ↗
          </button>
          <button id="scr-pick-btn" className="scr-btn-primary"
            onClick={() => onAddToCart?.(sizeA)}>
            Chọn size này
          </button>
        </div>
      </footer>

      {/* ══ OVERLAYS ══ */}
      {settings && <SettingsPanel onClose={() => setSettings(false)}/>}
      {aiModal  && (
        <AiModal sizeA={sizeA} sizeB={sizeB}
          onClose={() => setAiModal(false)}
          onPick={s => { setSizeA(s); }}/>
      )}
    </div>
  );
};

export default SizeComparisonRoom;
