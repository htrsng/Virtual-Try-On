import React, { useState, Suspense, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Grid, MeshReflectorMaterial, useProgress, Html } from '@react-three/drei';
import * as THREE from 'three';
import { Avatar } from '../../../three/controls/avatar/Avatar';
import GarmentModel from '../GarmentModel';
import { type Profile } from '../../../contexts/FittingRoomContext';
import { type ProductWithModel } from '../../../data/ThreeDConfig';
import { type LocalFabricProfile } from '../VirtualTryOn';

function Loader() {
    const { progress } = useProgress();
    return (
        <Html center>
            <div style={{ color: '#000', fontSize: '12px', fontWeight: 500 }}>
                {Math.round(progress)}%
            </div>
        </Html>
    );
}

export type SizeCompare3DCanvasProps = {
    bodyData: Profile;
    modelConfig?: ProductWithModel['model3D'];
    selectedSize: string;
    selectedColor: string;
    selectedFabric?: LocalFabricProfile;
    heatmapEnabled: boolean;
    fitZones?: any[]; // RecommendationZone[]
    pose?: string;
    opacity?: number;
    hoverZone?: string | null;
    ghostSizes?: string[]; // If present, renders 2 wireframes instead of 1 mesh
    diffOnly?: boolean; // In outline mode, only show differences?
    cameraPreset?: string; // 'Front', 'Side', 'Back', '45°'
};

function CameraPresetController({ preset }: { preset: string }) {
    useFrame(({ camera }) => {
        if (!preset || preset === 'Free') return;
        const radius = 5.2;
        const height = 0.8;
        const targetPos = new THREE.Vector3(0, height, radius);
        if (preset === 'Side') targetPos.set(radius, height, 0);
        else if (preset === 'Back') targetPos.set(0, height, -radius);
        else if (preset === '45°') targetPos.set(radius * 0.707, height, radius * 0.707);

        camera.position.lerp(targetPos, 0.05);
    });
    return null;
}

export default function SizeCompare3DCanvas({
    bodyData,
    modelConfig,
    selectedSize,
    selectedColor,
    selectedFabric,
    heatmapEnabled,
    fitZones,
    pose,
    opacity = 1,
    hoverZone = null,
    ghostSizes,
    diffOnly = false,
    cameraPreset = 'Front',
}: SizeCompare3DCanvasProps) {
    const [avatarScene, setAvatarScene] = useState<THREE.Group | null>(null);

    return (
        <div style={{ width: '100%', height: '100%', opacity, transition: 'opacity 0.3s' }}>
            <Canvas camera={{ position: [0, 0.8, 5.2], fov: 32 }} dpr={[1, 1.5]} shadows>
                <ambientLight intensity={0.42} />
                <directionalLight
                    position={[3, 6, 4]}
                    intensity={1.35}
                    castShadow
                    shadow-mapSize-width={1024}
                    shadow-mapSize-height={1024}
                    shadow-camera-near={0.5}
                    shadow-camera-far={20}
                    shadow-camera-left={-3}
                    shadow-camera-right={3}
                    shadow-camera-top={4}
                    shadow-camera-bottom={-2}
                    shadow-bias={-0.0005}
                />
                <directionalLight position={[-2, 3, -2]} intensity={0.3} />

                <Suspense fallback={<Loader />}>
                    <Environment preset="city" />
                    <group position={[0, -1.08, 0]}>


                        <Avatar body={bodyData} pose={pose || 'Idle'} skinColor="#F2C9AC" onSceneReady={setAvatarScene} />
                        
                        {modelConfig && selectedSize && selectedColor && (
                            ghostSizes ? (
                                <>
                                    {ghostSizes[0] && (
                                        <GarmentModel
                                            config={modelConfig}
                                            selectedSize={ghostSizes[0]}
                                            selectedColor={selectedColor}
                                            fabricOverride={selectedFabric}
                                            avatarScene={avatarScene}
                                            heatmapEnabled={false}
                                            heatmapZones={[]}
                                            wireframeColor="#3B82F6"
                                            ghostOpacity={diffOnly ? 0.05 : 0.65}
                                        />
                                    )}
                                    {ghostSizes[1] && (
                                        <GarmentModel
                                            config={modelConfig}
                                            selectedSize={ghostSizes[1]}
                                            selectedColor={selectedColor}
                                            fabricOverride={selectedFabric}
                                            avatarScene={avatarScene}
                                            heatmapEnabled={false}
                                            heatmapZones={[]}
                                            wireframeColor={diffOnly ? "#22D3EE" : "#F97316"}
                                            ghostOpacity={diffOnly ? 0.95 : 0.8}
                                            emissiveIntensity={diffOnly ? 2.0 : 0}
                                        />
                                    )}
                                </>
                            ) : (
                                <GarmentModel
                                    config={modelConfig}
                                    selectedSize={selectedSize}
                                    selectedColor={selectedColor}
                                    fabricOverride={selectedFabric}
                                    avatarScene={avatarScene}
                                    heatmapEnabled={heatmapEnabled || !!hoverZone}
                                    heatmapZones={hoverZone ? fitZones?.filter((z: any) => z.key === hoverZone) : fitZones}
                                />
                            )
                        )}
                        <ContactShadows position={[0, 0.01, 0]} opacity={0.6} scale={5} blur={2.5} resolution={1024} frames={1} />
                    </group>
                </Suspense>

                <CameraPresetController preset={cameraPreset} />
                <OrbitControls
                    target={[0, 0.3, 0]}
                    enablePan={false}
                    enableDamping
                    dampingFactor={0.08}
                    minDistance={1.5}
                    maxDistance={6.0}
                />
            </Canvas>
        </div>
    );
}
