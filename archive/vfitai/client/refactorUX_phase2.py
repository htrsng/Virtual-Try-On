import os

tsx_path = 'src/pages/SizeComparisonRoom.tsx'
with open(tsx_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add SidebarTab state
content = content.replace(
    "const [sidebar, setSidebar] = useState(false);",
    "const [sidebar, setSidebar] = useState(false);\n  const [sidebarTab, setSidebarTab] = useState<'info'|'compare'>('info');"
)

# 2. Build the new Sidebar HTML
old_sidebar = """      <aside className={`scr-sidebar${sidebar ? ' open' : ''}`}>
        {/* Product Card */}
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
        </div>

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
              [showPoints,  setShowPoints,  'Điểm đo chi tiết'],
              [showHeatmap, setShowHeatmap, 'Lớp nhiệt (heatmap)'],
              [diffOnly, setDiffOnly, 'Chỉ hiện phần chênh lệch (Outline)'],
            ] as [boolean, React.Dispatch<React.SetStateAction<boolean>>, string][]
          ).map(([val, setter, label]) => (
            <label key={label} className="scr-check-label">
              <input type="checkbox" className="scr-checkbox"
                checked={val} onChange={e => setter(e.target.checked)}/>
              {label}
            </label>
          ))}
        </div>
      </aside>"""

new_sidebar = """      <aside className={`scr-sidebar${sidebar ? ' open' : ''}`}>
        {/* TAB HEADER */}
        <div style={{ display: 'flex', borderBottom: '1px solid #E5E7EB', padding: '16px 16px 0', gap: 16 }}>
            <div onClick={() => setSidebarTab('info')} style={{ paddingBottom: 12, cursor: 'pointer', fontWeight: 600, fontSize: 14, color: sidebarTab === 'info' ? '#111827' : '#6B7280', borderBottom: sidebarTab === 'info' ? '2px solid #111827' : '2px solid transparent' }}>Thông tin</div>
            <div onClick={() => setSidebarTab('compare')} style={{ paddingBottom: 12, cursor: 'pointer', fontWeight: 600, fontSize: 14, color: sidebarTab === 'compare' ? '#111827' : '#6B7280', borderBottom: sidebarTab === 'compare' ? '2px solid #111827' : '2px solid transparent' }}>So sánh</div>
        </div>

        {sidebarTab === 'info' && (
            <div style={{ padding: '0 0 24px' }}>
                {/* Product Card */}
                <div style={{ padding: '20px 16px 20px', borderBottom: '1px solid #F3F4F6' }}>
                    <div style={{ display: 'flex', gap: 12 }}>
                        {product?.image ? (
                            <img src={product.image} alt={product.name} style={{ width: 64, height: 84, objectFit: 'cover', borderRadius: 8, border: '1px solid #E5E7EB' }} />
                        ) : (
                            <div style={{ width: 64, height: 84, background: '#F3F4F6', borderRadius: 8, display: 'flex', alignItems:'center', justifyContent: 'center' }}>
                                <IcShirt />
                            </div>
                        )}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <div style={{ fontWeight: 700, fontSize: 14, color: '#111827', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{product?.name || 'Sản phẩm'}</div>
                            <div style={{ fontSize: 12, color: '#6B7280', marginTop: 8 }}>SKU: {product?.sku || 'N/A'}</div>
                        </div>
                    </div>
                </div>

                {/* Model */}
                <div style={{ padding: '20px 16px 0' }}>
                    <div className="scr-section-title" style={{ marginTop: 0 }}>Mô hình của bạn</div>
                    <div className="scr-model-card" style={{ marginBottom: 0 }}>
                        <div className="scr-avatar">A</div>
                        <div>
                        <div className="scr-model-name">Alex</div>
                        <div className="scr-model-stats">{bodyData?.height || 170}cm · {bodyData?.weight || 62}kg · Vai 43cm</div>
                        </div>
                    </div>
                </div>

                {/* AI Recommendation Leaderboard */}
                <div style={{ padding: '24px 16px 0' }}>
                    <div className="scr-section-title" style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: 6 }}>✨ AI Recommendation</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {sizes.map(s => ({ size: s, score: fitRecommendations?.[s]?.score || 0 })).sort((a, b) => b.score - a.score).slice(0, 3).map((item, index) => (
                            <div key={item.size} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: index === 0 ? '#EEF2FF' : '#F9FAFB', borderRadius: 8, border: `1px solid ${index === 0 ? '#C7D2FE' : '#E5E7EB'}` }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{ fontSize: 18 }}>{index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}</div>
                                    <div style={{ fontWeight: 700, color: index === 0 ? '#4338CA' : '#374151', fontSize: 14 }}>Size {item.size}</div>
                                </div>
                                <div style={{ fontWeight: 600, color: index === 0 ? '#4F46E5' : '#6B7280', fontSize: 13 }}>{Math.floor(item.score)}% Fit</div>
                            </div>
                        ))}
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
                </div>

                {/* Conclusion Block */}
                <div style={{ padding: '20px 16px 0' }}>
                    <div style={{ background: '#F8FAFC', borderRadius: 12, padding: '16px', border: '1px solid #E2E8F0' }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                            🎯 Khuyến nghị: Size {Object.keys(fitRecommendations || {}).reduce((a, b) => ((fitRecommendations?.[a]?.score || 0) > (fitRecommendations?.[b]?.score || 0) ? a : b), sizeA)}
                        </div>
                        <div style={{ fontSize: 13, color: '#334155', display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <div style={{ display: 'flex', gap: 8 }}><span style={{ color: '#10B981' }}>✓</span> Vai vừa vặn</div>
                            <div style={{ display: 'flex', gap: 8 }}><span style={{ color: '#10B981' }}>✓</span> Ngực thoải mái</div>
                            <div style={{ display: 'flex', gap: 8, marginTop: 4, color: '#B45309' }}><span style={{ color: '#F59E0B' }}>⚠</span> Size {sizeB} sẽ rộng hơn ở phần thân</div>
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
      </aside>"""

content = content.replace(old_sidebar, new_sidebar)

# 3. Add Floating Toolbar to Main Canvas & update Bottom Bar
old_main = """      {/* ══ VIEWER ══ */}
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
              {mode === 'outline' && <OutlineView {...viewProps}/>}
              {mode === 'slide'   && <SlideView   {...viewProps}/>}
            </>
          )}
        </div>

      <div className="scr-bottom" style={{ height: 'auto', padding: '16px 24px', borderTop: '1px solid #E5E7EB', background: '#fff' }}>
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
      </div>
      </main>"""

new_main = """      {/* ══ VIEWER ══ */}
      <main className="scr-viewer" style={{ position: 'relative' }}>
        {/* Floating Toolbar */}
        {!loading && (
            <div style={{ position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 50, display: 'flex', gap: 8, background: 'rgba(255,255,255,0.9)', padding: 6, borderRadius: 100, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.5)' }}>
                <button onClick={() => setShowHeatmap(!showHeatmap)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 100, fontSize: 13, fontWeight: 600, background: showHeatmap ? '#EEF2FF' : 'transparent', color: showHeatmap ? '#4338CA' : '#4B5563', border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}>
                    <span style={{ fontSize: 16 }}>🔥</span> Heatmap
                </button>
                <button onClick={() => setMode('outline')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 100, fontSize: 13, fontWeight: 600, background: mode === 'outline' ? '#FFF7ED' : 'transparent', color: mode === 'outline' ? '#C2410C' : '#4B5563', border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}>
                    <IcLayers/> Outline
                </button>
                {mode === 'outline' && (
                    <button onClick={() => setDiffOnly(!diffOnly)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 100, fontSize: 13, fontWeight: 600, background: diffOnly ? '#ECFDF5' : 'transparent', color: diffOnly ? '#047857' : '#4B5563', border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}>
                        👁️ Difference Only
                    </button>
                )}
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

      <div className="scr-bottom" style={{ height: 'auto', padding: '16px 24px', borderTop: '1px solid #E5E7EB', background: '#fff' }}>
        <div style={{ display: 'flex', width: '100%', maxWidth: 1100, margin: '0 auto', gap: 24, alignItems: 'center', justifyContent: 'space-between' }}>
            {/* Compact Confirmation CTA */}
            <div style={{ flex: 1, display: 'flex', gap: 16, alignItems: 'center' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#10B981', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 24, height: 24, background: '#D1FAE5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✓</div> 
                    Size {(() => {
                        const bestSize = Object.keys(fitRecommendations || {}).reduce((a, b) => ((fitRecommendations?.[a]?.score || 0) > (fitRecommendations?.[b]?.score || 0) ? a : b), sizeA);
                        return bestSize;
                    })()} được đề xuất
                </div>
                <div style={{ height: 16, width: 1, background: '#E5E7EB' }}></div>
                <div style={{ fontSize: 13, color: '#4B5563', fontWeight: 600 }}>
                    AI Confidence: {Math.floor(fitRecommendations?.[Object.keys(fitRecommendations || {}).reduce((a, b) => ((fitRecommendations?.[a]?.score || 0) > (fitRecommendations?.[b]?.score || 0) ? a : b), sizeA)]?.score || 92)}%
                </div>
            </div>

            {/* CTA */}
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <button className="scr-btn-outline" onClick={handleSnapshot} style={{ height: 44, borderRadius: 8, padding: '0 20px', fontWeight: 600 }}>Chia sẻ</button>
                <button id="scr-pick-btn" className="scr-btn-primary" onClick={() => onAddToCart?.(Object.keys(fitRecommendations || {}).reduce((a, b) => ((fitRecommendations?.[a]?.score || 0) > (fitRecommendations?.[b]?.score || 0) ? a : b), sizeA))} style={{ height: 44, padding: '0 32px', fontSize: 15, borderRadius: 8, boxShadow: '0 4px 12px rgba(26,86,219,.3)' }}>
                    Mua với Size {Object.keys(fitRecommendations || {}).reduce((a, b) => ((fitRecommendations?.[a]?.score || 0) > (fitRecommendations?.[b]?.score || 0) ? a : b), sizeA)}
                </button>
            </div>
        </div>
      </div>
      </main>"""

content = content.replace(old_main, new_main)

with open(tsx_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("SizeComparisonRoom.tsx refactored successfully (Phase 2).")
