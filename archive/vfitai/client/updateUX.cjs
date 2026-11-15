const fs = require('fs');

// 1. Update SizeComparisonRoom.css
const cssPath = 'd:/Virtual Try-On/client/src/pages/SizeComparisonRoom.css';
let css = fs.readFileSync(cssPath, 'utf8');
css = css.replace(
  '.scr-diff-box {\n  background: var(--bg2);\n  border: 1px solid var(--border);\n  border-radius: var(--radius);\n  overflow: hidden;\n}',
  '.scr-diff-box {\n  background: var(--bg2);\n  border: 1px solid var(--border);\n  border-radius: var(--radius);\n  overflow: hidden;\n  display: grid;\n  grid-template-columns: 1fr 1fr;\n}\n.scr-diff-title { grid-column: span 2; }'
);
fs.writeFileSync(cssPath, css);


// 2. Update SizeCompare3DCanvas.tsx
const canvasPath = 'd:/Virtual Try-On/client/src/features/virtual-tryon/components/SizeCompare3DCanvas.tsx';
let canvasData = fs.readFileSync(canvasPath, 'utf8');
if (!canvasData.includes('hoverZone?')) {
  canvasData = canvasData.replace('opacity?: number;\n};', 'opacity?: number;\n    hoverZone?: string | null;\n};');
  canvasData = canvasData.replace(
    'opacity = 1,\n}: SizeCompare3DCanvasProps) {',
    'opacity = 1,\n    hoverZone = null,\n}: SizeCompare3DCanvasProps) {'
  );
  canvasData = canvasData.replace(
    'heatmapEnabled={heatmapEnabled}',
    'heatmapEnabled={heatmapEnabled || !!hoverZone}'
  );
  canvasData = canvasData.replace(
    'heatmapZones={fitZones}',
    'heatmapZones={hoverZone ? fitZones?.filter((z: any) => z.key === hoverZone) : fitZones}'
  );
  fs.writeFileSync(canvasPath, canvasData);
}

// 3. Update SizeComparisonRoom.tsx
const roomPath = 'd:/Virtual Try-On/client/src/pages/SizeComparisonRoom.tsx';
let roomData = fs.readFileSync(roomPath, 'utf8');

// Add html2canvas import
if (!roomData.includes('html2canvas')) {
  roomData = roomData.replace(
    "import React, { useState, useRef, useCallback, useEffect } from 'react';",
    "import React, { useState, useRef, useCallback, useEffect } from 'react';\nimport html2canvas from 'html2canvas';"
  );
}

// Remove AiModal
roomData = roomData.replace(/\/\* ═══════════════════════════════════════════════════════════════\n   AI MODAL\n   ═══════════════════════════════════════════════════════════════ \*\/[\s\S]*?const SettingsPanel/m, 'const SettingsPanel');
roomData = roomData.replace('const [aiModal,     setAiModal]     = useState(false);', '');
roomData = roomData.replace(
  /{aiModal  && \(\n\s*<AiModal sizeA={sizeA} sizeB={sizeB}\n\s*onClose=\{\(\) => setAiModal\(false\)\}\n\s*onPick=\{s => \{ setSizeA\(s\); \}\}\/>\n\s*\)}/,
  ''
);
roomData = roomData.replace(
  /<button id="scr-ai-btn" className="scr-btn-outline" onClick=\{\(\) => setAiModal\(true\)\}>\n\s*Gợi ý size phù hợp ↗\n\s*<\/button>/,
  ''
);

// Add hoverZone and snapshot handler
if (!roomData.includes('const [hoverZone')) {
  roomData = roomData.replace(
    "const [loading,     setLoading]     = useState(false);",
    "const [loading,     setLoading]     = useState(false);\n  const [hoverZone,   setHoverZone]   = useState<string | null>(null);\n\n  const handleSnapshot = async () => {\n    const viewer = document.querySelector('.scr-viewer') as HTMLElement;\n    if (!viewer) return;\n    try {\n      const canvas = await html2canvas(viewer, { useCORS: true, allowTaint: true });\n      const link = document.createElement('a');\n      link.download = `size-compare-${sizeA}-${sizeB}.png`;\n      link.href = canvas.toDataURL();\n      link.click();\n    } catch (e) {\n      console.error('Lỗi khi chụp ảnh', e);\n    }\n  };"
  );
}

// Update fitLabel
roomData = roomData.replace(
  /function fitLabel\(k: string, fitRecommendations: Record<string, any> = \{\}\): string \{[\s\S]*?\n\}/,
  `function fitLabel(k: string, fitRecommendations: Record<string, any> = {}): string {
  const rec = fitRecommendations[k];
  if (!rec) return 'Chưa phân tích';
  if (rec.score >= 85) return 'Ôm vừa 🟢';
  if (rec.score >= 60) return 'Hơi rộng 🟡';
  return 'Cần chỉnh 🔴';
}`
);

// Add AI recommendation to Sidebar
if (!roomData.includes('Gợi ý size thông minh</span>')) {
  roomData = roomData.replace(
    /<aside className=\{`scr-sidebar\$\{sidebar \? ' open' : ''\}`\}>/,
    `<aside className={\`scr-sidebar\${sidebar ? ' open' : ''}\`}>
        {/* AI Recommendation Box */}
        <div className="scr-ai-box" style={{ background: '#F8FAFC', padding: 12, borderRadius: 10, border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <span style={{ fontSize: 15 }}>✨</span>
            <span style={{ fontWeight: 600, color: '#1E293B', fontSize: 12 }}>Gợi ý size thông minh</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[sizeA, sizeB].map(s => {
              const score = fitRecommendations?.[s]?.score || 0;
              const isBest = score >= 80;
              return (
                <div key={s} style={{ flex: 1, padding: 8, background: isBest ? '#EEF2FF' : '#FFFFFF', border: \`1px solid \${isBest ? '#818CF8' : '#E2E8F0'}\`, borderRadius: 6, cursor: 'pointer' }} onClick={() => isBest ? null : changeA(s)}>
                  <div style={{ fontWeight: 700, color: isBest ? '#4338CA' : '#1E293B', fontSize: 13 }}>Size {s}</div>
                  <div style={{ fontSize: 10, color: isBest ? '#4F46E5' : '#64748B', marginTop: 2 }}>{fitLabel(s, fitRecommendations)}</div>
                </div>
              );
            })}
          </div>
        </div>`
  );
}

// Update Bottom Bar Chips mapping to include Hover mapping and filter
if (!roomData.includes('zoneKey?: string }[]')) {
  roomData = roomData.replace(
    /const chips: \{ t: ChipType; icon: React\.ReactNode; text: string \}\[\] = \[\s*\{\s*t:\s*'lbl',\s*icon:\s*<IcRuler\/>,\s*text:\s*`\$\{sizeA\} vs \$\{sizeB\}`\s*\},\s*\.\.\.diff\.map\(r => \(\{\s*t:\s*\(r\.delta > 0 \? 'up' : r\.delta < 0 \? 'dn' : 'eq'\) as ChipType,\s*icon:\s*r\.delta > 0 \? <IcArrowUp\/> : r\.delta < 0 \? <IcArrowDown\/> : <IcMinus\/>,\s*text:\s*`\$\{r\.label\.replace\('Vòng ', ''\)\} \$\{r\.delta > 0 \? '\+' : ''\}\$\{r\.delta\}cm`,\s*\}\)\),\s*\];/,
    `const chips: { t: ChipType; icon: React.ReactNode; text: string; zoneKey?: string }[] = [
    { t: 'lbl', icon: <IcRuler/>, text: \`\${sizeA} vs \${sizeB}\` },
    ...diff.filter(r => Math.abs(r.delta) >= 3).map(r => {
      const txt = \`\${r.label.replace('Vòng ', '')} \${r.delta > 0 ? '+' : ''}\${r.delta}cm\`;
      let zk = '';
      if (r.label.toLowerCase().includes('ngực')) zk = 'chest';
      if (r.label.toLowerCase().includes('eo')) zk = 'waist';
      if (r.label.toLowerCase().includes('mông')) zk = 'hips';
      if (r.label.toLowerCase().includes('vai')) zk = 'shoulder';
      return {
        t: (r.delta > 0 ? 'up' : r.delta < 0 ? 'dn' : 'eq') as ChipType,
        icon: r.delta > 0 ? <IcArrowUp/> : r.delta < 0 ? <IcArrowDown/> : <IcMinus/>,
        text: txt,
        zoneKey: zk,
      };
    }),
  ];`
  );
}
// Render chips with hover
if (!roomData.includes('setHoverZone(')) {
  roomData = roomData.replace(
    /\{chips\.map\(\(c, i\) => \(\s*<div key=\{i\} className=\{`scr-chip \$\{c\.t\}`\}>\s*\{c\.icon\}\{c\.text\}\s*<\/div>\s*\)\)\}/,
    `{chips.map((c, i) => (
            <div key={i} className={\`scr-chip \${c.t}\`}
              onMouseEnter={() => c.zoneKey && setHoverZone(c.zoneKey)}
              onMouseLeave={() => setHoverZone(null)}>
              {c.icon}{c.text}
            </div>
          ))}`
  );
}

// Add Snapshot button to bottom bar next to Select size
if (!roomData.includes('handleSnapshot')) {
  roomData = roomData.replace(
    '<button id="scr-pick-btn" className="scr-btn-primary"',
    '<button className="scr-btn-outline" onClick={handleSnapshot}>Chia sẻ / Lưu ảnh</button>\n          <button id="scr-pick-btn" className="scr-btn-primary"'
  );
}

// Viewports standard outline
const outlineSvg = `{showOutline && angle === 'front' && (
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg viewBox="0 0 100 200" style={{ width: '80%', height: '80%', stroke: 'rgba(59, 130, 246, 0.4)', strokeWidth: 1.5, fill: 'none', strokeDasharray: '4 4' }}>
                <path d="M 30,50 Q 50,30 70,50 L 80,100 L 70,180 L 30,180 L 20,100 Z" />
              </svg>
            </div>
          )}`;

// Replace ViewProps interface to add hoverZone
if (!roomData.includes('hoverZone?: string | null;')) {
  roomData = roomData.replace(
    'comparePose?: string;\n}',
    'comparePose?: string;\n  hoverZone?: string | null;\n  angle?: string;\n}'
  );
}

// Update components definition
const componentNames = ['SplitView', 'OverlayView', 'SlideView'];
for (const name of componentNames) {
  if (!roomData.includes(`const ${name}: React.FC<ViewProps> = ({ sizeA, sizeB, showOutline, /* showPoints, */ showHeatmap, bodyData, modelConfig, selectedColor, selectedFabric, fitRecommendations, comparePose, hoverZone, angle }) => {`)) {
    roomData = roomData.replace(
      `const ${name}: React.FC<ViewProps> = ({ sizeA, sizeB, /* showOutline, showPoints, */ showHeatmap, bodyData, modelConfig, selectedColor, selectedFabric, fitRecommendations, comparePose }) => {`,
      `const ${name}: React.FC<ViewProps> = ({ sizeA, sizeB, showOutline, /* showPoints, */ showHeatmap, bodyData, modelConfig, selectedColor, selectedFabric, fitRecommendations, comparePose, hoverZone, angle }) => {`
    );
    
    // Add hoverZone prop to SizeCompare3DCanvas usages
    // Need to only replace if not already added
    // Let's just use string replace instead of global regex to avoid messing up.
    
    // Find scr-fig-wrap or scr-overlay-fig and inject SVG
    if (name === 'OverlayView') {
      roomData = roomData.replace(
        '<div className="scr-overlay-fig" style={{ position: \'relative\' }}>',
        `<div className="scr-overlay-fig" style={{ position: 'relative' }}>\n${outlineSvg}`
      );
    }
  }
}
roomData = roomData.replace(/<SizeCompare3DCanvas\s*\n\s*bodyData/g, '<SizeCompare3DCanvas \n            hoverZone={hoverZone} \n            bodyData');
// For SplitView and SlideView (they use scr-fig-wrap multiple times)
if (!roomData.includes('<path d="M 30,50 Q 50,30')) {
  roomData = roomData.replace(
    /<\/div>\n\s*<div className="scr-panel-hint">/g,
    `  ${outlineSvg}\n        </div>\n        <div className="scr-panel-hint">`
  );
}

// Free drag hint instead of Angle buttons
if (!roomData.includes('Kéo thả chuột để xoay')) {
  roomData = roomData.replace(
    /<div className="scr-subtool">[\s\S]*?<\/div>\n\s*<\/main>/,
    `<div className="scr-subtool">
          <span className="scr-subtool-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <IcRotate/> Kéo thả chuột để xoay 3D tự do
          </span>
          <div className="scr-zoom-row" style={{ marginLeft: 'auto' }}>
            <span className="scr-zoom-label">Zoom</span>
            <input type="range" min={50} max={200} value={zoom}
              onChange={e => setZoom(+e.target.value)} className="scr-zoom-slider"/>
            <span className="scr-zoom-pct">{zoom}%</span>
          </div>
        </div>
      </main>`
  );
}

// update viewProps definition
if (!roomData.includes('hoverZone, angle };')) {
  roomData = roomData.replace(
    "const viewProps = { sizeA, sizeB, showOutline, showPoints, showHeatmap, bodyData, modelConfig, selectedColor, selectedFabric, fitRecommendations, comparePose };",
    "const viewProps = { sizeA, sizeB, showOutline, showPoints, showHeatmap, bodyData, modelConfig, selectedColor, selectedFabric, fitRecommendations, comparePose, hoverZone, angle };"
  );
}


fs.writeFileSync(roomPath, roomData);
console.log('Successfully updated UX tweaks');
