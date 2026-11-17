import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function CameraAnimator({ targetPosition, targetLookAt }: { targetPosition: [number, number, number]; targetLookAt: [number, number, number] }) {
    const posRef = useRef(new THREE.Vector3(...targetPosition));
    const lookRef = useRef(new THREE.Vector3(...targetLookAt));
    const transitioning = useRef(true);

    useEffect(() => {
        posRef.current.set(...targetPosition);
        lookRef.current.set(...targetLookAt);
        transitioning.current = true;
    }, [targetPosition, targetLookAt]);

    useFrame(({ camera, controls }) => {
        if (!transitioning.current || !controls) return;
        const orbit = controls as unknown as { enabled: boolean; enableDamping: boolean; target: THREE.Vector3; update: () => void };
        // OrbitControls updates at priority -1. Pause it while this frame-loop transition owns the camera.
        orbit.enabled = false;
        camera.position.lerp(posRef.current, 0.08);
        camera.lookAt(lookRef.current);
        if (camera.position.distanceTo(posRef.current) <= 0.01) {
            const damping = orbit.enableDamping;
            orbit.enableDamping = false; orbit.update(); // drain pending angular/zoom deltas
            camera.position.copy(posRef.current); orbit.target.copy(lookRef.current); orbit.update();
            orbit.enableDamping = damping; orbit.enabled = true;
            transitioning.current = false;
        }
    });

    return null;
}

