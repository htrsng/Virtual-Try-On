import React, { useState, useRef, useCallback, useEffect } from 'react';
import html2canvas from 'html2canvas';
import './SizeComparisonRoom.css';
import { type Profile } from '../contexts/FittingRoomContext';
// @ts-ignore
import { type ProductWithModel } from '../data/ThreeDConfig';
import { type LocalFabricProfile } from '../features/virtual-tryon/VirtualTryOn';
import SizeCompare3DCanvas from '../features/virtual-tryon/components/SizeCompare3DCanvas';

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
const IcArrowsH = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 16l-4-4 4-4M17 8l4 4-4 4"/><line x1="3" y1="12" x2="21" y2="12"/>
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


function getDiff(a: string, b: string, garmentSizeSpecs: Record<string, any> = {}) {
  const sa = garmentSizeSpecs[a], sb = garmentSizeSpecs[b];
  if (!sa || !sb) return [];
  return [
    { label: 'Vòng ngực',     delta: (sb.chest || 0) - (sa.chest || 0) },
    { label: 'Vòng eo',       delta: (sb.waist || 0) - (sa.waist || 0) },
    { label: 'Vòng mông',     delta: (sb.hips || 0) - (sa.hips || 0) },
    { label: 'Bề rộng vai',   delta: (sb.shoulder || 0) - (sa.shoulder || 0) },
  ].filter(x => x.delta !== 0);
}



/* ═══════════════════════════════════════════════════════════════
   BODY FIGURE SVG — matches screenshot style (coat silhouette)
   ═══════════════════════════════════════════════════════════════ */
/* ═══════════════════════════════════════════════════════════════
   SPLIT VIEW
   ═══════════════════════════════════════════════════════════════ */
interface ViewProps {
  sizeA: string; sizeB: string;
  showOutline: boolean; showPoints: boolean; showHeatmap: boolean;
  bodyData?: any;
  modelConfig?: any;
  selectedColor?: string;
  selectedFabric?: any;
  fitRecommendations?: Record<string, any>;
  comparePose?: string;
  hoverZone?: string | null;
  angle?: string;
  diffOnly?: boolean;
  cameraPreset?: string;
}

const SplitView: React.FC<ViewProps> = ({ sizeA, sizeB, showHeatmap, bodyData, modelConfig, selectedColor, selectedFabric, fitRecommendations, comparePose, hoverZone, cameraPreset }) => {
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
        <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 10, background: 'rgba(255,255,255,0.95)', padding: '12px 16px', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <div style={{ width: 10, height: 10, background: '#7C6FCD', borderRadius: 2 }}></div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#1F2937' }}>SIZE {sizeA}</div>
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: fitRecommendations?.[sizeA]?.score >= 80 ? '#059669' : '#D97706', marginBottom: 2 }}>
                {fitRecommendations?.[sizeA]?.score >= 80 ? '✨ Recommended' : '⚠️ Cần lưu ý'}
            </div>
            <div style={{ fontSize: 11, color: '#6B7280' }}>
                Fit Score: <span style={{ fontWeight: 700, color: '#374151' }}>{Math.floor(fitRecommendations?.[sizeA]?.score || 0)}%</span>
            </div>
        </div>
        <div className="scr-fig-wrap">
          <SizeCompare3DCanvas 
            hoverZone={hoverZone} 
            bodyData={bodyData} 
            modelConfig={modelConfig} 
            selectedSize={sizeA} 
            selectedColor={selectedColor || ''} 
            selectedFabric={selectedFabric}
            heatmapEnabled={showHeatmap} 
            fitZones={fitRecommendations?.[sizeA]?.zones} 
            pose={comparePose}
            cameraPreset={cameraPreset}
          />
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
        <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 10, background: 'rgba(255,255,255,0.95)', padding: '12px 16px', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.5)', textAlign: 'right' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end', marginBottom: 4 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#1F2937' }}>SIZE {sizeB}</div>
                <div style={{ width: 10, height: 10, background: '#F0C040', borderRadius: 2 }}></div>
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: fitRecommendations?.[sizeB]?.score >= 80 ? '#059669' : '#D97706', marginBottom: 2 }}>
                {fitRecommendations?.[sizeB]?.score >= 80 ? '✨ Recommended' : '⚠️ Cần lưu ý'}
            </div>
            <div style={{ fontSize: 11, color: '#6B7280' }}>
                Fit Score: <span style={{ fontWeight: 700, color: '#374151' }}>{Math.floor(fitRecommendations?.[sizeB]?.score || 0)}%</span>
            </div>
        </div>
        <div className="scr-fig-wrap">
          <SizeCompare3DCanvas 
            hoverZone={hoverZone} 
            bodyData={bodyData} 
            modelConfig={modelConfig} 
            selectedSize={sizeB} 
            selectedColor={selectedColor || ''} 
            selectedFabric={selectedFabric}
            heatmapEnabled={showHeatmap} 
            fitZones={fitRecommendations?.[sizeB]?.zones} 
            pose={comparePose}
            cameraPreset={cameraPreset}
          />
        </div>
        <div className="scr-panel-hint">Kéo để xoay · Cuộn để phóng to</div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   OUTLINE VIEW
   ═══════════════════════════════════════════════════════════════ */
const OutlineView: React.FC<ViewProps> = ({ sizeA, sizeB, showHeatmap, bodyData, modelConfig, selectedColor, selectedFabric, fitRecommendations, comparePose, hoverZone, diffOnly, cameraPreset }) => {
  return (
    <div className="scr-overlay">
      <div className="scr-overlay-labels" style={{ top: 20 }}>
        <div style={{display:'flex', alignItems:'center', gap: 16, background: '#fff', padding: '8px 16px', borderRadius: 100, boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}>
            <div style={{display:'flex', alignItems:'center', gap: 8}}>
                <div style={{width: 14, height: 14, background: '#7C6FCD', borderRadius: 3}}></div>
                <span style={{fontSize: 13, fontWeight: 700, color: '#1F2937'}}>Size {sizeA}</span>
            </div>
            <div style={{display:'flex', alignItems:'center', gap: 8}}>
                <div style={{width: 14, height: 14, background: '#F0C040', borderRadius: 3}}></div>
                <span style={{fontSize: 13, fontWeight: 700, color: '#1F2937'}}>Size {sizeB}</span>
            </div>
            {diffOnly && (
                <div style={{fontSize: 12, color: '#059669', fontWeight: 600, marginLeft: 8, paddingLeft: 12, borderLeft: '1px solid #E5E7EB'}}>
                    Chỉ hiện chênh lệch
                </div>
            )}
        </div>
      </div>

      <div className="scr-overlay-fig" style={{ position: 'absolute', inset: 0 }}>
        <SizeCompare3DCanvas 
            hoverZone={hoverZone} 
            bodyData={bodyData} 
            modelConfig={modelConfig} 
            selectedSize={sizeA} 
            selectedColor={selectedColor || ''} 
            selectedFabric={selectedFabric}
            heatmapEnabled={showHeatmap}
            fitZones={fitRecommendations ? Object.values(fitRecommendations) : []}
            pose={comparePose}
            ghostSizes={[sizeA, sizeB]}
            diffOnly={diffOnly}
            cameraPreset={cameraPreset}
        />
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   SLIDE VIEW
   ═══════════════════════════════════════════════════════════════ */
const SlideView: React.FC<ViewProps> = ({ sizeA, sizeB, showHeatmap, bodyData, modelConfig, selectedColor, selectedFabric, fitRecommendations, comparePose, hoverZone, cameraPreset }) => {
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
          <SizeCompare3DCanvas 
            hoverZone={hoverZone} 
            bodyData={bodyData} 
            modelConfig={modelConfig} 
            selectedSize={sizeB} 
            selectedColor={selectedColor || ''} 
            selectedFabric={selectedFabric}
            heatmapEnabled={showHeatmap} 
            fitZones={fitRecommendations?.[sizeB]?.zones} 
            pose={comparePose}
            cameraPreset={cameraPreset}
          />
        </div>
      </div>

      {/* A — clipped foreground */}
      <div className="scr-slide-fg" style={{ width: `${pct}%` }}>
        <div className="scr-slide-fig" style={{ height: '88%', maxHeight: 420, display: 'flex', alignItems: 'flex-end' }}>
          <SizeCompare3DCanvas 
            hoverZone={hoverZone} 
            bodyData={bodyData} 
            modelConfig={modelConfig} 
            selectedSize={sizeA} 
            selectedColor={selectedColor || ''} 
            selectedFabric={selectedFabric}
            heatmapEnabled={showHeatmap} 
            fitZones={fitRecommendations?.[sizeA]?.zones} 
            pose={comparePose}
            cameraPreset={cameraPreset}
          />
        </div>
      </div>

      {/* Divider */}
      <div className="scr-slide-bar" style={{ left: `${pct}%` }}>
        <div className="scr-slide-knob"><IcArrowsH/></div>
      </div>

      <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 10, background: 'rgba(255,255,255,0.95)', padding: '12px 16px', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.5)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <div style={{ width: 10, height: 10, background: '#7C6FCD', borderRadius: 2 }}></div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#1F2937' }}>SIZE {sizeA}</div>
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, color: fitRecommendations?.[sizeA]?.score >= 80 ? '#059669' : '#D97706', marginBottom: 2 }}>
              {fitRecommendations?.[sizeA]?.score >= 80 ? '✨ Recommended' : '⚠️ Cần lưu ý'}
          </div>
          <div style={{ fontSize: 11, color: '#6B7280' }}>
              Fit Score: <span style={{ fontWeight: 700, color: '#374151' }}>{Math.floor(fitRecommendations?.[sizeA]?.score || 0)}%</span>
          </div>
      </div>
      <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 10, background: 'rgba(255,255,255,0.95)', padding: '12px 16px', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.5)', textAlign: 'right' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end', marginBottom: 4 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#1F2937' }}>SIZE {sizeB}</div>
              <div style={{ width: 10, height: 10, background: '#F0C040', borderRadius: 2 }}></div>
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, color: fitRecommendations?.[sizeB]?.score >= 80 ? '#059669' : '#D97706', marginBottom: 2 }}>
              {fitRecommendations?.[sizeB]?.score >= 80 ? '✨ Recommended' : '⚠️ Cần lưu ý'}
          </div>
          <div style={{ fontSize: 11, color: '#6B7280' }}>
              Fit Score: <span style={{ fontWeight: 700, color: '#374151' }}>{Math.floor(fitRecommendations?.[sizeB]?.score || 0)}%</span>
          </div>
      </div>
    </div>
  );
};

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
type ViewMode = 'split' | 'slide' | 'outline';
type Angle    = 'front' | 'back' | 'left' | 'right' | 'top';

interface SizeComparisonRoomProps {
  product?: { name?: string; sku?: string; sizes?: string[]; image?: string };
  onClose?: () => void;
  onAddToCart?: (size: string) => void;
  bodyData?: Profile | any;
  modelConfig?: ProductWithModel['model3D'] | any;
  selectedColor?: string;
  selectedFabric?: LocalFabricProfile | any;
  fitRecommendations?: Record<string, any>;
  garmentSizeSpecs?: Record<string, any>;
  comparePose?: string;
}

const SizeComparisonRoom: React.FC<SizeComparisonRoomProps> = ({
  product = { name: 'Áo khoác Unisex Bomber', sku: 'SKU-0291', sizes: ['S', 'M', 'L'] },
  onClose,
  onAddToCart,
  bodyData,
  modelConfig,
  selectedColor = '',
  selectedFabric,
  fitRecommendations = {},
  garmentSizeSpecs = {},
  comparePose,
}) => {
  const [mode,        setMode]        = useState<ViewMode>('split');
  const [sizeA,       setSizeA]       = useState('M');
  const [sizeB,       setSizeB]       = useState('L');
  const [angle] = useState<Angle>('front');
  const [zoom,        setZoom]        = useState(100);
  const [autoRotate,  setAutoRotate]  = useState(false);
  const [cameraPreset, setCameraPreset] = useState('Front');
  const [showOutline] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [diffOnly, setDiffOnly] = useState(false);
  const [settings,    setSettings]    = useState(false);
  
  const [sidebar,     setSidebar]     = useState(false);
  const [sidebarTab,  setSidebarTab]  = useState<'info'|'compare'>('info');
  const [loading,     setLoading]     = useState(false);
  const hoverZone = null;

  const handleSnapshot = async () => {
    const viewer = document.querySelector('.scr-viewer') as HTMLElement;
    if (!viewer) return;
    try {
      const canvas = await html2canvas(viewer, { useCORS: true, allowTaint: true });
      const link = document.createElement('a');
      link.download = `size-compare-${sizeA}-${sizeB}.png`;
      link.href = canvas.toDataURL();
      link.click();
    } catch (e) {
      console.error('Lỗi khi chụp ảnh', e);
    }
  };

  const sizes = product?.sizes || [];

  const changeA = (s: string) => { setLoading(true); setSizeA(s); setTimeout(() => setLoading(false), 450); };
  const changeB = (s: string) => { setLoading(true); setSizeB(s); setTimeout(() => setLoading(false), 450); };

  const diff = getDiff(sizeA, sizeB, garmentSizeSpecs);


  const viewProps = { sizeA, sizeB, showOutline, showPoints: true, showHeatmap, bodyData, modelConfig, selectedColor, selectedFabric, fitRecommendations, comparePose, hoverZone, angle, diffOnly, cameraPreset };

  return (
    <div className="scr">

      {/* ══ TOP BAR ══ */}
      <header className="scr-top">
        {/* Mobile sidebar toggle */}
        <button className="scr-tool-btn scr-menu-btn" onClick={() => setSidebar(v => !v)}>
          <IcMenu/>
        </button>

        {/* Product info */}
        <div className="scr-product" style={{ maxWidth: 300, overflow: 'hidden' }}>
          <div className="scr-product-icon" style={{ flexShrink: 0 }}><IcShirt/></div>
          <div className="scr-product-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.name}</div>
          {product.sku && <div className="scr-product-sku" style={{ flexShrink: 0, marginLeft: 8 }}>{product.sku}</div>}
        </div>

        <div className="scr-sep"/>

        {/* View mode toggle */}
        <div className="scr-toggle">
          <button id="scr-btn-split"
            className={`scr-toggle-btn${mode === 'split' ? ' on' : ''}`}
            onClick={() => setMode('split')}>
            <IcCols/><span>Split view</span>
          </button>
          <button id="scr-btn-outline"
            className={`scr-toggle-btn${mode === 'outline' ? ' on' : ''}`}
            onClick={() => setMode('outline')}>
            <IcLayers/><span>Outline Mode</span>
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
            onClick={handleSnapshot}>
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
        {/* TAB HEADER */}
        <div style={{ display: 'flex', borderBottom: '1px solid #E5E7EB', padding: '16px 16px 0', gap: 16 }}>
            <div onClick={() => setSidebarTab('info')} style={{ paddingBottom: 12, cursor: 'pointer', fontWeight: 600, fontSize: 14, color: sidebarTab === 'info' ? '#111827' : '#6B7280', borderBottom: sidebarTab === 'info' ? '2px solid #111827' : '2px solid transparent' }}>Thông tin</div>
            <div onClick={() => setSidebarTab('compare')} style={{ paddingBottom: 12, cursor: 'pointer', fontWeight: 600, fontSize: 14, color: sidebarTab === 'compare' ? '#111827' : '#6B7280', borderBottom: sidebarTab === 'compare' ? '2px solid #111827' : '2px solid transparent' }}>So sánh</div>
        </div>

        {sidebarTab === 'info' && (
            <div style={{ padding: '0 0 24px' }}>
                {/* Product Card */}
                <div style={{ padding: '16px 16px 0' }}>
                    <div style={{ display: 'flex', gap: 12 }}>
                        {product?.image ? (
                            <img src={product.image} alt={product.name} style={{ width: 48, height: 64, objectFit: 'cover', borderRadius: 6, border: '1px solid #E5E7EB' }} />
                        ) : (
                            <div style={{ width: 48, height: 64, background: '#F3F4F6', borderRadius: 6, display: 'flex', alignItems:'center', justifyContent: 'center' }}>
                                <IcShirt />
                            </div>
                        )}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <div style={{ fontWeight: 700, fontSize: 13, color: '#111827', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{product?.name || 'Sản phẩm'}</div>
                            <div style={{ fontSize: 11, color: '#6B7280', marginTop: 4 }}>SKU: {product?.sku || 'N/A'}</div>
                        </div>
                    </div>
                </div>

                {/* Model */}
                <div style={{ padding: '16px 16px 0' }}>
                    <div className="scr-model-card" style={{ marginBottom: 0, padding: '10px 12px' }}>
                        <div className="scr-avatar" style={{ width: 32, height: 32, fontSize: 14 }}>{bodyData?.name ? bodyData.name.charAt(0).toUpperCase() : '👤'}</div>
                        <div>
                        <div className="scr-model-name" style={{ fontSize: 13 }}>{bodyData?.name || 'Mô hình của bạn'}</div>
                        <div className="scr-model-stats" style={{ fontSize: 11 }}>{bodyData?.height || 170}cm · {bodyData?.weight || 62}kg · Vai {bodyData?.shoulder || 43}cm</div>
                        </div>
                    </div>
                </div>

                {/* AI Recommendation Leaderboard */}
                <div style={{ padding: '16px 16px 0' }}>
                    <div className="scr-section-title" style={{ marginTop: 0, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>✨ AI RECOMMENDATION</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {sizes.map((s: string) => ({ size: s, score: fitRecommendations?.[s]?.score || 0 })).sort((a: any, b: any) => b.score - a.score).slice(0, 3).map((item: any, index: number) => (
                            <div key={item.size} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: index === 0 ? '#F3F0FF' : '#F9FAFB', borderRadius: 8, border: `1px solid ${index === 0 ? '#D4CCF5' : '#E5E7EB'}` }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{ fontSize: 16 }}>{index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}</div>
                                    <div style={{ fontWeight: 700, color: index === 0 ? '#7C6FCD' : '#374151', fontSize: 13 }}>Size {item.size}</div>
                                </div>
                                <div style={{ fontWeight: 600, color: index === 0 ? '#1D9E75' : '#6B7280', fontSize: 12 }}>{Math.floor(item.score)}% Fit</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* AI Reason Block */}
                <div style={{ padding: '12px 16px 0' }}>
                    <div style={{ background: '#F8FAFC', borderRadius: 8, padding: '12px 16px', border: '1px solid #E2E8F0' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>🎯 Vì sao chọn Size {sizes.map((s: string) => ({ size: s, score: fitRecommendations?.[s]?.score || 0 })).sort((a: any, b: any) => b.score - a.score)[0]?.size || 'M'}?</div>
                        <div style={{ fontSize: 12, color: '#334155', display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <div style={{ display: 'flex', gap: 8 }}><span style={{ color: '#10B981' }}>✓</span> Vai vừa vặn</div>
                            <div style={{ display: 'flex', gap: 8 }}><span style={{ color: '#10B981' }}>✓</span> Ngực thoải mái</div>
                            {sizes.map((s: string) => ({ size: s, score: fitRecommendations?.[s]?.score || 0 })).sort((a: any, b: any) => b.score - a.score).slice(1, 3).map((s: any) => (
                                <div key={s.size} style={{ display: 'flex', gap: 8, color: '#B45309' }}><span style={{ color: '#F59E0B' }}>⚠</span> Size {s.size} sẽ rộng hơn ở phần thân</div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        )}

        {sidebarTab === 'compare' && (
            <div style={{ padding: '0 0 24px' }}>
                {/* Size config */}
                <div style={{ padding: '20px 16px 0' }}>
                    <div className="scr-size-section">
                        <div className="scr-size-label">
                        <div className="scr-dot a"/>Size A
                        </div>
                        <select id="scr-select-a" className="scr-select a" value={sizeA}
                        onChange={e => changeA(e.target.value)}>
                        {sizes.map((s: string) => (
                            <option key={s} value={s} disabled={s === sizeB}>
                            {s} — Ngực {garmentSizeSpecs?.[s]?.chest || '?'}cm · Eo {garmentSizeSpecs?.[s]?.waist || '?'}cm
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
                        {sizes.map((s: string) => (
                            <option key={s} value={s} disabled={s === sizeA}>
                            {s} — Ngực {garmentSizeSpecs?.[s]?.chest || '?'}cm · Eo {garmentSizeSpecs?.[s]?.waist || '?'}cm
                            </option>
                        ))}
                        </select>
                    </div>
                </div>

                {/* Diff Summary Card */}
                <div style={{ padding: '20px 16px 0' }}>
                    <div style={{ background: '#F8FAFC', borderRadius: 8, padding: '12px 16px', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: '#0F172A' }}>{sizeA} vs {sizeB}</div>
                        <div style={{ fontSize: 13, color: '#475569', textAlign: 'right', fontWeight: 500 }}>
                            {diff.length === 0 ? 'Tương đương' : diff.slice(0, 3).map(r => `${r.label.replace('Vòng ', '')} ${r.delta > 0 ? '+' : ''}${r.delta}cm`).join(', ')}
                        </div>
                    </div>
                </div>

                {/* Diff Badges */}
                <div style={{ padding: '24px 16px 0' }}>
                    <div className="scr-section-title" style={{ marginTop: 0 }}>Chênh lệch chi tiết ({sizeB} vs {sizeA})</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {diff.length === 0 && <div style={{ fontSize: 13, color: '#6B7280' }}>Không có chênh lệch đáng kể.</div>}
                        {diff.map(r => (
                        <div key={r.label} style={{ background: r.delta > 0 ? '#FEF3C7' : '#D1FAE5', color: r.delta > 0 ? '#B45309' : '#047857', padding: '6px 12px', borderRadius: 100, fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                            {r.delta > 0 ? '▲' : '▼'} {r.label} {r.delta > 0 ? '+' : ''}{r.delta}cm
                        </div>
                        ))}
                    </div>
                </div>
            </div>
        )}
      </aside>

      {/* ══ VIEWER ══ */}
      <main className="scr-viewer" style={{ position: 'relative' }}>
        {/* Floating Toolbar (iOS Segmented Control Style) */}
        {!loading && (
            <div style={{ position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 50, display: 'flex', background: 'rgba(243,244,246,0.85)', padding: 4, borderRadius: 12, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', backdropFilter: 'blur(12px)', border: '1px solid rgba(229,231,235,0.8)' }}>
                <button onClick={() => setShowHeatmap(!showHeatmap)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, background: showHeatmap ? '#FFFFFF' : 'transparent', color: showHeatmap ? '#EF4444' : '#6B7280', border: 'none', cursor: 'pointer', transition: 'all 0.2s', boxShadow: showHeatmap ? '0 2px 8px rgba(0,0,0,0.05)' : 'none' }}>
                    🔥 Heatmap
                </button>
                <button onClick={() => { setMode(mode === 'outline' ? 'split' : 'outline'); setDiffOnly(false); }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, background: mode === 'outline' && !diffOnly ? '#FFFFFF' : 'transparent', color: mode === 'outline' && !diffOnly ? '#111827' : '#6B7280', border: 'none', cursor: 'pointer', transition: 'all 0.2s', boxShadow: mode === 'outline' && !diffOnly ? '0 2px 8px rgba(0,0,0,0.05)' : 'none' }}>
                    ◯ Outline
                </button>
                <button onClick={() => { setMode('outline'); setDiffOnly(true); }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, background: diffOnly ? '#FFFFFF' : 'transparent', color: diffOnly ? '#1D9E75' : '#6B7280', border: 'none', cursor: 'pointer', transition: 'all 0.2s', boxShadow: diffOnly ? '0 2px 8px rgba(0,0,0,0.05)' : 'none' }}>
                    ✨ Difference Only
                </button>
            </div>
        )}

        {/* Camera Presets */}
        {!loading && (
            <div style={{ position: 'absolute', bottom: 70, left: 24, zIndex: 50, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {['Front', 'Side', '45°', 'Back', 'Free'].map(preset => (
                    <button key={preset} onClick={() => setCameraPreset(preset)} style={{ width: 44, height: 44, borderRadius: '50%', background: cameraPreset === preset ? '#111827' : 'rgba(255,255,255,0.9)', color: cameraPreset === preset ? '#FFF' : '#374151', border: '1px solid rgba(229,231,235,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', backdropFilter: 'blur(8px)', transition: 'all 0.2s' }}>
                        {preset}
                    </button>
                ))}
            </div>
        )}

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
              {mode === 'outline' && <OutlineView {...viewProps}/>}
              {mode === 'slide'   && <SlideView   {...viewProps}/>}
            </>
          )}
        </div>

        {/* Sub-toolbar: angle + zoom */}
        <div className="scr-subtool">
          <span className="scr-subtool-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <IcRotate/> {cameraPreset === 'Free' ? 'Kéo thả chuột để xoay' : `Góc nhìn: ${cameraPreset}`}
          </span>
          <div className="scr-zoom-row" style={{ marginLeft: 'auto' }}>
            <span className="scr-zoom-label">Zoom</span>
            <input type="range" min={50} max={200} value={zoom}
              onChange={e => setZoom(+e.target.value)} className="scr-zoom-slider"/>
            <span className="scr-zoom-pct">{zoom}%</span>
          </div>
        </div>
      </main>

      {/* ══ BOTTOM BAR ══ */}
      <footer className="scr-bottom" style={{ height: 'auto', padding: '16px 24px', borderTop: '1px solid #E5E7EB', background: '#fff' }}>
        <div style={{ display: 'flex', width: '100%', maxWidth: 1100, margin: '0 auto', gap: 24, alignItems: 'center', justifyContent: 'space-between' }}>
            {/* Compact Confirmation CTA */}
            <div style={{ flex: 1, display: 'flex', gap: 16, alignItems: 'center' }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
                    🎯 Kích thước phù hợp nhất: <span style={{ color: '#1D9E75' }}>Size {(() => {
                        const bestSize = Object.keys(fitRecommendations || {}).reduce((a, b) => ((fitRecommendations?.[a]?.score || 0) > (fitRecommendations?.[b]?.score || 0) ? a : b), sizeA);
                        return bestSize;
                    })()}</span>
                </div>
                <div style={{ height: 16, width: 1, background: '#E5E7EB' }}></div>
                <div style={{ fontSize: 13, color: '#10B981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 16, height: 16, background: '#D1FAE5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>✓</div> 
                    {Math.floor(fitRecommendations?.[Object.keys(fitRecommendations || {}).reduce((a, b) => ((fitRecommendations?.[a]?.score || 0) > (fitRecommendations?.[b]?.score || 0) ? a : b), sizeA)]?.score || 92)}% độ phù hợp
                </div>
            </div>

            {/* CTA */}
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <div style={{ fontSize: 12, color: '#6B7280', textAlign: 'right', lineHeight: 1.4 }}>
                    <span style={{ fontWeight: 600, color: '#374151' }}>84%</span> người có số đo tương tự<br/>đã chọn Size này
                </div>
                <button id="scr-pick-btn" className="scr-btn-primary" onClick={() => onAddToCart?.(Object.keys(fitRecommendations || {}).reduce((a, b) => ((fitRecommendations?.[a]?.score || 0) > (fitRecommendations?.[b]?.score || 0) ? a : b), sizeA))} style={{ height: 48, padding: '0 32px', fontSize: 15, borderRadius: 8, background: '#C9963F', color: '#FFFFFF', border: 'none', boxShadow: '0 4px 12px rgba(201,150,63,0.3)', cursor: 'pointer', fontWeight: 600 }}>
                    Mua với Size {Object.keys(fitRecommendations || {}).reduce((a, b) => ((fitRecommendations?.[a]?.score || 0) > (fitRecommendations?.[b]?.score || 0) ? a : b), sizeA)}
                </button>
            </div>
        </div>
      </footer>

      {/* ══ OVERLAYS ══ */}
      {settings && <SettingsPanel onClose={() => setSettings(false)}/>}
      
    </div>
  );
};

export default SizeComparisonRoom;
