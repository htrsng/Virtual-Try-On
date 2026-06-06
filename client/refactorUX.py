import os

tsx_path = 'src/pages/SizeComparisonRoom.tsx'
with open(tsx_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Update ViewMode
content = content.replace("type ViewMode = 'split' | 'overlay' | 'slide';", "type ViewMode = 'split' | 'slide' | 'outline';")

# Update view modes in the bar
content = content.replace(
    """<button className={`scr-view-btn${mode === 'overlay' ? ' active' : ''}`} onClick={() => setMode('overlay')}><IcLayers/> Overlay</button>""",
    """<button className={`scr-view-btn${mode === 'outline' ? ' active' : ''}`} onClick={() => setMode('outline')}><IcLayers/> Outline</button>"""
)

# Update ViewProps
content = content.replace(
    "hoverZone?: string | null;\n  angle?: string;\n}",
    "hoverZone?: string | null;\n  angle?: string;\n  diffOnly?: boolean;\n}"
)

# Replace OverlayView with OutlineView
old_overlay = """const OverlayView: React.FC<ViewProps> = ({ sizeA, sizeB, /* showOutline, showPoints, */ showHeatmap, bodyData, modelConfig, selectedColor, selectedFabric, fitRecommendations, comparePose, hoverZone }) => {
  const [opacity, setOpacity] = useState(55);
  return (
    <div className="scr-overlay">
      <div className="scr-overlay-labels">
        <div className="scr-size-tag a">Size {sizeA}</div>
        <span style={{ color: '#9CA3AF', fontWeight: 700 }}>+</span>
        <div className="scr-size-tag b">Size {sizeB}</div>
        <span style={{ fontSize: 11, color: '#9CA3AF' }}>đè lên</span>
      </div>

      <div className="scr-overlay-fig" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>

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
            opacity={opacity / 100}
        />
      </div>

      <div className="scr-overlay-ctrl">
        <span style={{ fontSize: 12, color: '#6B7280', whiteSpace: 'nowrap' }}>Opacity Size B</span>
        <input type="range" min="20" max="80" value={opacity} onChange={e => setOpacity(parseInt(e.target.value))} style={{ width: 100 }} />
        <span style={{ fontSize: 12, fontWeight: 600, width: 36 }}>{opacity}%</span>
      </div>
    </div>
  );
};"""

new_outline = """const OutlineView: React.FC<ViewProps> = ({ sizeA, sizeB, showHeatmap, bodyData, modelConfig, selectedColor, selectedFabric, fitRecommendations, comparePose, hoverZone, diffOnly }) => {
  return (
    <div className="scr-overlay">
      <div className="scr-overlay-labels" style={{ top: 20 }}>
        <div style={{display:'flex', alignItems:'center', gap: 16, background: '#fff', padding: '8px 16px', borderRadius: 100, boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}>
            <div style={{display:'flex', alignItems:'center', gap: 8}}>
                <div style={{width: 14, height: 14, background: '#3B82F6', borderRadius: 3}}></div>
                <span style={{fontSize: 13, fontWeight: 700, color: '#1F2937'}}>Size {sizeA}</span>
            </div>
            <div style={{display:'flex', alignItems:'center', gap: 8}}>
                <div style={{width: 14, height: 14, background: '#F97316', borderRadius: 3}}></div>
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
        />
      </div>
    </div>
  );
};"""

content = content.replace(old_overlay, new_outline)

# Update Render Mode switch
content = content.replace("mode === 'overlay' ? <OverlayView", "mode === 'outline' ? <OutlineView")

# Add diffOnly state
content = content.replace("const [showHeatmap, setShowHeatmap] = useState(false);", "const [showHeatmap, setShowHeatmap] = useState(false);\n  const [diffOnly, setDiffOnly] = useState(false);")

# Update viewProps
content = content.replace("comparePose, hoverZone, angle };", "comparePose, hoverZone, angle, diffOnly };")


# Replace AI box with Product Image & Remove AI box
ai_box_code = """        {/* AI Recommendation Box */}
        <div className="scr-ai-box" style={{ background: '#F8FAFC', padding: 12, borderRadius: 10, border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <span style={{ fontSize: 15 }}>✨</span>
            <span style={{ fontWeight: 600, color: '#1E293B', fontSize: 12 }}>Gợi ý size thông minh</span>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {Array.from(new Set([
              Object.keys(fitRecommendations || {}).reduce((a, b) => ((fitRecommendations?.[a]?.score || 0) > (fitRecommendations?.[b]?.score || 0) ? a : b), sizeA),
              sizeA, 
              sizeB
            ])).slice(0, 3).map(s => {
              const score = fitRecommendations?.[s]?.score || 0;
              const isBest = score >= 80;
              return (
                <div key={s} style={{ flex: 1, padding: 8, background: isBest ? '#EEF2FF' : '#FFFFFF', border: `1px solid ${isBest ? '#818CF8' : '#E2E8F0'}`, borderRadius: 6, cursor: 'pointer' }} onClick={() => isBest ? null : changeA(s)}>
                  <div style={{ fontWeight: 700, color: isBest ? '#4338CA' : '#1E293B', fontSize: 13 }}>Size {s}</div>
                  <div style={{ fontSize: 10, color: isBest ? '#4F46E5' : '#64748B', marginTop: 2 }}>{fitLabel(s, fitRecommendations)}</div>
                </div>
              );
            })}
          </div>
        </div>"""

product_card = """        {/* Product Card */}
        <div style={{ padding: '20px 16px 0', borderBottom: '1px solid #F3F4F6', paddingBottom: 16 }}>
            <div style={{ display: 'flex', gap: 12 }}>
                {product?.image ? (
                    <img src={product.image} alt={product.name} style={{ width: 64, height: 84, objectFit: 'cover', borderRadius: 8, border: '1px solid #E5E7EB' }} />
                ) : (
                    <div style={{ width: 64, height: 84, background: '#F3F4F6', borderRadius: 8, display: 'flex', alignItems:'center', justifyContent: 'center' }}>
                        <IcShirt />
                    </div>
                )}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#111827', lineHeight: 1.3 }}>{product?.name || 'Sản phẩm'}</div>
                    <div style={{ fontSize: 12, color: '#6B7280', marginTop: 6 }}>SKU: {product?.sku || 'N/A'}</div>
                </div>
            </div>
        </div>"""

content = content.replace(ai_box_code, product_card)


# Replace Diff Table with Visual Bars
old_diff = """          {/* Diff table */}
          <div className="scr-diff-box" style={{ marginTop: 10 }}>
            <div className="scr-diff-title">Số đo chênh lệch</div>
            {diff.map(r => (
              <div key={r.label} className="scr-diff-row"
                onMouseEnter={() => setHoverZone(diffZoneMap[r.label] || null)}
                onMouseLeave={() => setHoverZone(null)}>
                <span className="scr-diff-key">{r.label}</span>
                <span className={`scr-diff-val ${r.delta > 0 ? 'up' : r.delta < 0 ? 'dn' : 'eq'}`}>
                  {r.delta > 0 ? <IcArrowUp/> : r.delta < 0 ? <IcArrowDown/> : <IcMinus/>}
                  {r.delta > 0 ? '+' : ''}{r.delta}cm
                </span>
              </div>
            ))}
          </div>"""

new_diff = """          {/* Diff Visual Bars */}
          <div className="scr-diff-box" style={{ marginTop: 16, border: 'none', background: 'transparent', padding: 0 }}>
            <div className="scr-diff-title" style={{ padding: '0 16px', fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5 }}>Chênh lệch chi tiết</div>
            <div style={{ padding: '12px 16px' }}>
                {diff.length === 0 && <div style={{ fontSize: 12, color: '#6B7280' }}>Không có chênh lệch đáng kể.</div>}
                {diff.map(r => {
                const maxDelta = 10;
                const pct = Math.min(Math.abs(r.delta) / maxDelta * 100, 100);
                const isWider = r.delta > 0;
                return (
                <div key={r.label} style={{ marginBottom: 16 }}
                    onMouseEnter={() => setHoverZone(diffZoneMap[r.label] || null)}
                    onMouseLeave={() => setHoverZone(null)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                        <span style={{ fontWeight: 600, color: '#374151' }}>{r.label}</span>
                        <span style={{ color: isWider ? '#D97706' : '#059669', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 2 }}>
                            {isWider ? '↑' : '↓'} {Math.abs(r.delta)}cm
                        </span>
                    </div>
                    <div style={{ width: '100%', height: 6, background: '#E5E7EB', borderRadius: 10, overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: isWider ? '#F59E0B' : '#10B981', borderRadius: 10, transition: 'width 0.3s' }}></div>
                    </div>
                    <div style={{ fontSize: 11, color: '#6B7280', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                        {isWider ? <span style={{color: '#D97706'}}>🟡 Rộng hơn một chút</span> : <span style={{color: '#059669'}}>🟢 Vừa vặn hơn</span>}
                    </div>
                </div>
                )})}
            </div>
          </div>"""

content = content.replace(old_diff, new_diff)


# Checkboxes Update
content = content.replace(
    "[showHeatmap, setShowHeatmap, 'Lớp nhiệt (heatmap)'],",
    "[showHeatmap, setShowHeatmap, 'Lớp nhiệt (heatmap)'],\n              [diffOnly, setDiffOnly, 'Chỉ hiện phần chênh lệch (Outline)'],"
)


# Replace Bottom Bar with AI Decision Board & CTA
old_bottom = """      <div className="scr-bottom">
        <div className="scr-bottom-inner">
          <div className="scr-cta">
            
          <button className="scr-btn-outline" onClick={handleSnapshot}>Chia sẻ / Lưu ảnh</button>
          <button id="scr-pick-btn" className="scr-btn-primary"
            onClick={() => onAddToCart?.(sizeA)}>
            Chọn size này
          </button>
          </div>
        </div>
      </div>"""

new_bottom = """      <div className="scr-bottom" style={{ height: 'auto', padding: '16px 24px', borderTop: '1px solid #E5E7EB', background: '#fff' }}>
        <div style={{ display: 'flex', width: '100%', maxWidth: 1100, margin: '0 auto', gap: 24, alignItems: 'center', justifyContent: 'space-between' }}>
            {/* AI Decision Board */}
            <div style={{ flex: 1, background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: '12px 20px', display: 'flex', gap: 16, alignItems: 'center' }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#EEF2FF', display: 'flex', alignItems:'center', justifyContent:'center', color: '#4338CA', fontSize: 20, flexShrink: 0 }}>✨</div>
                <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#1E293B' }}>
                        🎯 Kết luận: Size {(() => {
                            const bestSize = Object.keys(fitRecommendations || {}).reduce((a, b) => ((fitRecommendations?.[a]?.score || 0) > (fitRecommendations?.[b]?.score || 0) ? a : b), sizeA);
                            return bestSize;
                        })()} là lựa chọn hoàn hảo nhất.
                    </div>
                    <div style={{ fontSize: 13, color: '#475569', marginTop: 4 }}>
                        🔥 <strong>{Math.floor(fitRecommendations?.[Object.keys(fitRecommendations || {}).reduce((a, b) => ((fitRecommendations?.[a]?.score || 0) > (fitRecommendations?.[b]?.score || 0) ? a : b), sizeA)]?.score || 92)}%</strong> người có số đo tương tự đã mua Size này. 
                        Size {sizeB} có thể gây cảm giác {getDiff(sizeA, sizeB, garmentSizeSpecs).some(d => d.delta > 0) ? 'rộng' : 'chật'} ở phần {getDiff(sizeA, sizeB, garmentSizeSpecs).sort((a,b)=>Math.abs(b.delta)-Math.abs(a.delta))[0]?.label.toLowerCase() || 'thân áo'}.
                    </div>
                </div>
            </div>

            {/* CTA */}
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <button className="scr-btn-outline" onClick={handleSnapshot} style={{ height: 48, borderRadius: 8, padding: '0 20px', fontWeight: 600 }}>Chia sẻ</button>
                <button id="scr-pick-btn" className="scr-btn-primary" onClick={() => onAddToCart?.(Object.keys(fitRecommendations || {}).reduce((a, b) => ((fitRecommendations?.[a]?.score || 0) > (fitRecommendations?.[b]?.score || 0) ? a : b), sizeA))} style={{ height: 48, padding: '0 32px', fontSize: 16, borderRadius: 8, boxShadow: '0 4px 12px rgba(26,86,219,.3)' }}>
                    🛒 Mua với Size {Object.keys(fitRecommendations || {}).reduce((a, b) => ((fitRecommendations?.[a]?.score || 0) > (fitRecommendations?.[b]?.score || 0) ? a : b), sizeA)}
                </button>
            </div>
        </div>
      </div>"""

content = content.replace(old_bottom, new_bottom)

with open(tsx_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("SizeComparisonRoom.tsx refactored successfully.")
