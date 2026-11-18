declare global { interface Window { __VFIT_3D__?: { frames: number; sampledAt: number; frozen: boolean; camera: {position: number[]; quaternion: number[]; distance: number}; assets: object[]; bones: number[]; loading: boolean; loadingErrors: string[]; renderer: { calls: number; triangles: number; geometries: number; textures: number; contextLost: boolean; width: number; height: number; vendor: string } } } }
import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useProgress } from '@react-three/drei';
import * as THREE from 'three';
import { qa3dEnabled, staticQaRender } from './qaRender';

/** Observes the mounted scene and real renderer. No setters, asset bypasses or fake readiness. */
export default function ViewerDiagnostics({ target }: { target: [number, number, number] }) {
    const { gl, scene, camera } = useThree();
    const progress = useProgress();
    const last = useRef(0);
    const frames = useRef(0);
    useEffect(() => {
        const updateContext = () => {
            const value = window.__VFIT_3D__;
            if (value) value.renderer.contextLost = gl.getContext().isContextLost();
        };
        gl.domElement.addEventListener('webglcontextlost', updateContext);
        gl.domElement.addEventListener('webglcontextrestored', updateContext);
        return () => {
            gl.domElement.removeEventListener('webglcontextlost', updateContext);
            gl.domElement.removeEventListener('webglcontextrestored', updateContext);
            delete window.__VFIT_3D__;
        };
    }, [gl]);
    useFrame(() => {
        if (!qa3dEnabled) return;
        frames.current++;
        const now = performance.now();
        if (now - last.current < 100) return;
        last.current = now;
        scene.updateMatrixWorld(true);
        const assets: object[] = [];
        const bones: number[] = [];
        scene.traverse(object => {
            if (object.userData.vfitAsset) {
                let meshes = 0; let vertices = 0;
                object.traverse(child => {
                    if ((child as THREE.Mesh).isMesh) { meshes++; vertices += (child as THREE.Mesh).geometry.attributes.position?.count || 0; }
                });
                const bounds = new THREE.Box3().setFromObject(object);
                assets.push({ role: object.userData.vfitRole, url: object.userData.vfitAsset, meshes, vertices,
                    bounds: [...bounds.min.toArray(), ...bounds.max.toArray()].map(n => +n.toFixed(4)) });
            }
            if ((object as THREE.Bone).isBone && bones.length < 160) bones.push(...object.matrixWorld.elements.map(n => +n.toFixed(5)));
        });
        const context = gl.getContext();
        const extension = context.getExtension('WEBGL_debug_renderer_info');
        window.__VFIT_3D__ = {
            frames: frames.current, sampledAt: now, frozen: staticQaRender(),
            camera: { position: camera.position.toArray(), quaternion: camera.quaternion.toArray(),
                distance: camera.position.distanceTo(new THREE.Vector3(...target)) },
            assets, bones, loading: progress.active, loadingErrors: progress.errors.map(String),
            renderer: { calls: gl.info.render.calls, triangles: gl.info.render.triangles,
                geometries: gl.info.memory.geometries, textures: gl.info.memory.textures,
                contextLost: context.isContextLost(), width: gl.domElement.width, height: gl.domElement.height,
                vendor: extension ? context.getParameter(extension.UNMASKED_RENDERER_WEBGL) : context.getParameter(context.RENDERER) },
        };
    });
    return null;
}
