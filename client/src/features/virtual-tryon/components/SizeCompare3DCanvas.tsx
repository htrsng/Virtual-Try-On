import React, { useState, Suspense, useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, useProgress, Html } from '@react-three/drei';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js';
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
    outlineIntensity?: number;
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

function CustomOutline({ target1, target2, color1, color2, edgeStrength1, edgeStrength2 }: { target1: THREE.Object3D | null, target2: THREE.Object3D | null, color1: string, color2: string, edgeStrength1: number, edgeStrength2: number }) {
    const { gl, scene, camera, size } = useThree();
    const composer = useRef<EffectComposer | null>(null);
    const pass1 = useRef<OutlinePass | null>(null);
    const pass2 = useRef<OutlinePass | null>(null);

    useEffect(() => {
        const comp = new EffectComposer(gl);
        const renderPass = new RenderPass(scene, camera);
        comp.addPass(renderPass);

        const outline1 = new OutlinePass(new THREE.Vector2(size.width, size.height), scene, camera);
        outline1.edgeThickness = 1.0;
        outline1.visibleEdgeColor.set(color1);
        outline1.hiddenEdgeColor.set(color1);
        comp.addPass(outline1);
        pass1.current = outline1;

        const outline2 = new OutlinePass(new THREE.Vector2(size.width, size.height), scene, camera);
        outline2.edgeThickness = 1.0;
        outline2.visibleEdgeColor.set(color2);
        outline2.hiddenEdgeColor.set(color2);
        comp.addPass(outline2);
        pass2.current = outline2;

        composer.current = comp;

        return () => {
            comp.dispose();
            outline1.dispose();
            outline2.dispose();
        };
    }, [gl, scene, camera, size, color1, color2]);

    useEffect(() => {
        if (pass1.current) {
            pass1.current.selectedObjects = target1 ? [target1] : [];
            pass1.current.edgeStrength = edgeStrength1;
        }
        if (pass2.current) {
            pass2.current.selectedObjects = target2 ? [target2] : [];
            pass2.current.edgeStrength = edgeStrength2;
        }
    }, [target1, target2, edgeStrength1, edgeStrength2]);

    useFrame(() => {
        if (composer.current) {
            composer.current.render();
        }
    }, 1);

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
    outlineIntensity,
}: SizeCompare3DCanvasProps) {
    const [avatarScene, setAvatarScene] = useState<THREE.Group | null>(null);
    const ghost1Ref = useRef<THREE.Group>(null);
    const ghost2Ref = useRef<THREE.Group>(null);

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


                        <Avatar 
                            body={bodyData} 
                            pose={pose || 'Idle'} 
                            skinColor="#F2C9AC" 
                            color={ghostSizes ? '#FDFBF7' : undefined}
                            opacity={ghostSizes ? 0.2 : 1}
                            onSceneReady={setAvatarScene} 
                        />
                        
                        {modelConfig && selectedSize && selectedColor && (
                            ghostSizes ? (
                                <>
                                    {ghostSizes[0] && (
                                        <group ref={ghost1Ref}>
                                            <GarmentModel
                                                config={modelConfig}
                                                selectedSize={ghostSizes[0]}
                                                selectedColor={selectedColor}
                                                fabricOverride={selectedFabric}
                                                avatarScene={avatarScene}
                                                heatmapEnabled={false}
                                                heatmapZones={[]}
                                                ghostOpacity={diffOnly ? 0.0 : (outlineIntensity !== undefined ? outlineIntensity * 0.4 + 0.1 : 0.3)}
                                                emissiveIntensity={0}
                                                avatarProfile={bodyData}
                                            />
                                        </group>
                                    )}
                                    {ghostSizes[1] && (
                                        <group ref={ghost2Ref}>
                                            <GarmentModel
                                                config={modelConfig}
                                                selectedSize={ghostSizes[1]}
                                                selectedColor={selectedColor}
                                                fabricOverride={selectedFabric}
                                                avatarScene={avatarScene}
                                                heatmapEnabled={false}
                                                heatmapZones={[]}
                                                ghostOpacity={diffOnly ? 0.0 : (outlineIntensity !== undefined ? outlineIntensity * 0.4 + 0.1 : 0.3)}
                                                emissiveIntensity={0}
                                                avatarProfile={bodyData}
                                            />
                                        </group>
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
                                    avatarProfile={bodyData}
                                />
                            )
                        )}
                        <ContactShadows position={[0, 0.01, 0]} opacity={0.6} scale={5} blur={2.5} resolution={1024} frames={1} />
                    </group>

                    {ghostSizes && (
                        <CustomOutline 
                            target1={ghost1Ref.current} 
                            target2={ghost2Ref.current} 
                            color1="#D5C9B3" 
                            color2="#C8A867" 
                            edgeStrength1={diffOnly ? 0 : 2}
                            edgeStrength2={diffOnly ? 4 : 3}
                        />
                    )}
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
