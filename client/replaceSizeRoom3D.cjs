const fs = require('fs');
const path = 'd:/Virtual Try-On/client/src/pages/SizeComparisonRoom.tsx';
let data = fs.readFileSync(path, 'utf8');

// 1. Add imports
if (!data.includes('SizeCompare3DCanvas')) {
  data = data.replace(
    "import './SizeComparisonRoom.css';",
    "import './SizeComparisonRoom.css';\nimport { type Profile } from '../features/virtual-tryon/contexts/FittingRoomContext';\nimport { type ProductWithModel } from '../data/ThreeDConfig';\nimport { type LocalFabricProfile } from '../features/virtual-tryon/VirtualTryOn';\nimport SizeCompare3DCanvas from '../features/virtual-tryon/components/SizeCompare3DCanvas';"
  );
}

// 2. Replace interface SizeComparisonRoomProps
data = data.replace(
  /interface SizeComparisonRoomProps \{[\s\S]*?\}/,
  `interface SizeComparisonRoomProps {
  product?: { name?: string; sku?: string; sizes?: string[] };
  onClose?: () => void;
  onAddToCart?: (size: string) => void;
  bodyData?: Profile | any;
  modelConfig?: ProductWithModel['model3D'] | any;
  selectedColor?: string;
  selectedFabric?: LocalFabricProfile | any;
  fitRecommendations?: Record<string, any>;
  garmentSizeSpecs?: Record<string, any>;
  comparePose?: string;
}`
);

// 3. Add props to SizeComparisonRoom component declaration
data = data.replace(
  "  onAddToCart,\n}) => {",
  "  onAddToCart,\n  bodyData,\n  modelConfig,\n  selectedColor = '',\n  selectedFabric,\n  fitRecommendations = {},\n  garmentSizeSpecs = {},\n  comparePose,\n}) => {"
);

// 4. Update sizes initialization to not rely on SIZE_KEYS if possible, or just provide a fallback.
data = data.replace(
  "const sizes = product.sizes || SIZE_KEYS;",
  "const sizes = product?.sizes || [];"
);

// 5. Replace ViewProps
data = data.replace(
  /interface ViewProps \{[\s\S]*?\}/,
  `interface ViewProps {
  sizeA: string; sizeB: string;
  showOutline: boolean; showPoints: boolean; showHeatmap: boolean;
  bodyData?: any;
  modelConfig?: any;
  selectedColor?: string;
  selectedFabric?: any;
  fitRecommendations?: Record<string, any>;
  comparePose?: string;
}`
);

// 6. Update viewProps object in SizeComparisonRoom
data = data.replace(
  "const viewProps = { sizeA, sizeB, showOutline, showPoints, showHeatmap };",
  "const viewProps = { sizeA, sizeB, showOutline, showPoints, showHeatmap, bodyData, modelConfig, selectedColor, selectedFabric, fitRecommendations, comparePose };"
);

// 7. Update getDiff to use real garment specs
data = data.replace(
  /function getDiff\(a: string, b: string\) \{[\s\S]*?return \[[\s\S]*?\];\n\}/,
  `function getDiff(a: string, b: string, garmentSizeSpecs: Record<string, any> = {}) {
  const sa = garmentSizeSpecs[a], sb = garmentSizeSpecs[b];
  if (!sa || !sb) return [];
  return [
    { label: 'Vòng ngực',     delta: (sb.chest || 0) - (sa.chest || 0) },
    { label: 'Vòng eo',       delta: (sb.waist || 0) - (sa.waist || 0) },
    { label: 'Vòng mông',     delta: (sb.hips || 0) - (sa.hips || 0) },
    { label: 'Bề rộng vai',   delta: (sb.shoulder || 0) - (sa.shoulder || 0) },
  ].filter(x => x.delta !== 0);
}`
);

// 8. Update fitLabel to use fitRecommendations
data = data.replace(
  /function fitLabel\(k: string, userChest = 96\): string \{[\s\S]*?return 'Khá rộng';\n\}/,
  `function fitLabel(k: string, fitRecommendations: Record<string, any> = {}): string {
  const rec = fitRecommendations[k];
  if (!rec) return 'Chưa phân tích';
  if (rec.score > 80) return 'Vừa khít (' + rec.score + '%)';
  if (rec.score > 60) return 'Vừa vặn (' + rec.score + '%)';
  return 'Rộng (' + rec.score + '%)';
}`
);

// 9. Update diff usage inside SizeComparisonRoom
data = data.replace(
  "const diff = getDiff(sizeA, sizeB);",
  "const diff = getDiff(sizeA, sizeB, garmentSizeSpecs);"
);

// 10. Update fitLabel usages in SplitView
data = data.replace(
  /fitLabel\(sizeA\)/g,
  "fitLabel(sizeA, fitRecommendations)"
);
data = data.replace(
  /fitLabel\(sizeB\)/g,
  "fitLabel(sizeB, fitRecommendations)"
);

// 11. Replace BodyFigure components with SizeCompare3DCanvas
// In SplitView
const splitViewRegex = /<BodyFigure sizeKey=\{size([AB])\} variant="[ab]"\s*showOutline=\{showOutline\} showPoints=\{showPoints\} showHeatmap=\{showHeatmap\}\/>/g;
data = data.replace(splitViewRegex, (match, sizeLetter) => {
  return `<SizeCompare3DCanvas 
            bodyData={bodyData} 
            modelConfig={modelConfig} 
            selectedSize={size${sizeLetter}} 
            selectedColor={selectedColor || ''} 
            selectedFabric={selectedFabric}
            heatmapEnabled={showHeatmap} 
            fitZones={fitRecommendations?.[size${sizeLetter}]?.zones} 
            pose={comparePose}
          />`;
});

// In OverlayView
// The first one:
data = data.replace(
  /<BodyFigure sizeKey=\{sizeA\} variant="a"\s*showOutline=\{showOutline\} showPoints=\{showPoints\} showHeatmap=\{showHeatmap\}\/>/g,
  `<SizeCompare3DCanvas bodyData={bodyData} modelConfig={modelConfig} selectedSize={sizeA} selectedColor={selectedColor || ''} selectedFabric={selectedFabric} heatmapEnabled={showHeatmap} fitZones={fitRecommendations?.[sizeA]?.zones} pose={comparePose} />`
);
// The second one (with opacity):
data = data.replace(
  /<BodyFigure sizeKey=\{sizeB\} variant="b"\s*showOutline=\{showOutline\} showPoints=\{false\} showHeatmap=\{false\}\s*opacity=\{opacity \/ 100\}\/>/g,
  `<SizeCompare3DCanvas bodyData={bodyData} modelConfig={modelConfig} selectedSize={sizeB} selectedColor={selectedColor || ''} selectedFabric={selectedFabric} heatmapEnabled={false} fitZones={fitRecommendations?.[sizeB]?.zones} pose={comparePose} opacity={opacity / 100} />`
);

// In SlideView
// The first one:
data = data.replace(
  /<BodyFigure sizeKey=\{sizeB\} variant="b"\s*showOutline=\{showOutline\} showPoints=\{showPoints\} showHeatmap=\{showHeatmap\}\/>/g,
  `<SizeCompare3DCanvas bodyData={bodyData} modelConfig={modelConfig} selectedSize={sizeB} selectedColor={selectedColor || ''} selectedFabric={selectedFabric} heatmapEnabled={showHeatmap} fitZones={fitRecommendations?.[sizeB]?.zones} pose={comparePose} />`
);
// The second one (clipped):
data = data.replace(
  /<BodyFigure sizeKey=\{sizeA\} variant="a"\s*showOutline=\{showOutline\} showPoints=\{showPoints\} showHeatmap=\{showHeatmap\}\/>/g,
  `<SizeCompare3DCanvas bodyData={bodyData} modelConfig={modelConfig} selectedSize={sizeA} selectedColor={selectedColor || ''} selectedFabric={selectedFabric} heatmapEnabled={showHeatmap} fitZones={fitRecommendations?.[sizeA]?.zones} pose={comparePose} />`
);

// Fix SlideView props destructuring
data = data.replace(
  /const (SlideView|OverlayView|SplitView): React\.FC<ViewProps> = \(\{ sizeA, sizeB, showOutline, showPoints, showHeatmap \}\) => \{/g,
  (match, name) => `const ${name}: React.FC<ViewProps> = ({ sizeA, sizeB, showOutline, showPoints, showHeatmap, bodyData, modelConfig, selectedColor, selectedFabric, fitRecommendations, comparePose }) => {`
);

fs.writeFileSync(path, data);
console.log('SizeComparisonRoom.tsx updated successfully');
