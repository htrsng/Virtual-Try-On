const fs = require('fs');
const path = require('path');

// 1. Modify GarmentModel.tsx
const garmentPath = path.join(__dirname, 'src/features/virtual-tryon/GarmentModel.tsx');
let garmentCode = fs.readFileSync(garmentPath, 'utf8');

// Add props
garmentCode = garmentCode.replace('heatmapZones: GarmentHeatmapZone[];', 'heatmapZones: GarmentHeatmapZone[];\n    wireframeColor?: string;\n    ghostOpacity?: number;');
garmentCode = garmentCode.replace('heatmapZones,', 'heatmapZones,\n    wireframeColor,\n    ghostOpacity,');

// Override materials if wireframe
const overrideLogic = 
        prepareGarmentMaterialsWithTuning(cloned, {
            roughness: garment.softness.roughness,
            metalness: garment.softness.metalness,
            envMapIntensity: garment.softness.envMapIntensity,
            fabricProfile: effectiveFabric,
        });

        if (wireframeColor) {
            cloned.traverse((child) => {
                if (child.isMesh) {
                    const material = new THREE.MeshStandardMaterial({
                        color: wireframeColor,
                        wireframe: true,
                        transparent: true,
                        opacity: ghostOpacity || 0.6,
                        emissive: wireframeColor,
                        emissiveIntensity: 0.2
                    });
                    child.material = material;
                }
            });
        }
;
garmentCode = garmentCode.replace(/prepareGarmentMaterialsWithTuning\([\s\S]*?fabricProfile: effectiveFabric,\s*\}\);/, overrideLogic);

fs.writeFileSync(garmentPath, garmentCode);
console.log('Updated GarmentModel.tsx');

// 2. Modify SizeCompare3DCanvas.tsx
const canvasPath = path.join(__dirname, 'src/features/virtual-tryon/components/SizeCompare3DCanvas.tsx');
let canvasCode = fs.readFileSync(canvasPath, 'utf8');

// Add props
canvasCode = canvasCode.replace('selectedFabric?: GarmentFabricProfile;', 'selectedFabric?: GarmentFabricProfile;\n    ghostSizes?: string[];\n    diffOnly?: boolean;\n    garmentSizeSpecs?: Record<string, any>;');
canvasCode = canvasCode.replace('selectedFabric,', 'selectedFabric,\n    ghostSizes,\n    diffOnly,\n    garmentSizeSpecs,');

// Change camera position to Auto-Zoom
canvasCode = canvasCode.replace('position: [0, 0.78, 3.9], fov: 28', 'position: [0, 0.95, 2.6], fov: 35');

// Render ghosts
const ghostRender = 
                        {ghostSizes ? (
                            <>
                                {ghostSizes[0] && (
                                    <GarmentModel
                                        garmentConfig={modelConfig}
                                        selectedSize={ghostSizes[0]}
                                        selectedColor={selectedColor}
                                        selectedFabric={selectedFabric}
                                        avatarScene={avatarScene}
                                        heatmapEnabled={false}
                                        heatmapZones={[]}
                                        wireframeColor="#3B82F6"
                                        ghostOpacity={diffOnly ? 0.1 : 0.6}
                                    />
                                )}
                                {ghostSizes[1] && (
                                    <GarmentModel
                                        garmentConfig={modelConfig}
                                        selectedSize={ghostSizes[1]}
                                        selectedColor={selectedColor}
                                        selectedFabric={selectedFabric}
                                        avatarScene={avatarScene}
                                        heatmapEnabled={false}
                                        heatmapZones={[]}
                                        wireframeColor="#F97316"
                                        ghostOpacity={0.8}
                                    />
                                )}
                            </>
                        ) : (
                            <GarmentModel
                                garmentConfig={modelConfig}
                                selectedSize={selectedSize}
                                selectedColor={selectedColor}
                                selectedFabric={selectedFabric}
                                avatarScene={avatarScene}
                                heatmapEnabled={heatmapEnabled}
                                heatmapZones={heatmapZones}
                            />
                        )}
;

canvasCode = canvasCode.replace(/<GarmentModel[\s\S]*?heatmapZones={heatmapZones}\s*\/>/, ghostRender);

fs.writeFileSync(canvasPath, canvasCode);
console.log('Updated SizeCompare3DCanvas.tsx');
