import { Suspense } from 'react'
import { Grid, ContactShadows, Environment, Html } from '@react-three/drei'
import * as THREE from 'three'
import { Avatar } from '../../three/controls/avatar/Avatar'
import GarmentModel from '../../features/virtual-tryon/GarmentModel'
import type { Profile } from '../../contexts/FittingRoomContext'

function LoaderFallback() {
    return (
        <Html center>
            <div style={{ color: '#334155', fontSize: 14 }}>Đang tải mô hình...</div>
        </Html>
    )
}

export default function TryOnScene({
    body,
    onSceneReady,
    layeredGarments,
    showEnvironment = true,
    showContactShadows = true,
}: {
    body: Profile | null | undefined
    onSceneReady?: (g: THREE.Group | null) => void
    layeredGarments?: Record<string, any>
    showEnvironment?: boolean
    showContactShadows?: boolean
}) {
    return (
        <>
            {showEnvironment && <Environment preset="city" />}

            <group position={[0, -1.08, 0]}>
                <Grid position={[0, 0, 0]} args={[10, 10]} cellColor="#f3efe9" sectionColor="#ede9e2" fadeDistance={40} />

                <Suspense fallback={<LoaderFallback />}>
                    <Avatar body={body} pose={'Idle'} skinColor="#F2C9AC" onSceneReady={onSceneReady} />

                    {layeredGarments && Object.entries(layeredGarments).map(([slot, garment]) => {
                        if (!garment?.model3D || !(garment.model3D as any).url) return null

                        const config = {
                            enable: true,
                            sizes: {
                                M: {
                                    url: String((garment.model3D as any).url),
                                    autoNormalize: true,
                                    followAvatarBones: false,
                                },
                            },
                        }

                        return (
                            <Suspense key={`${slot}-${garment.itemId}`} fallback={null}>
                                <GarmentModel
                                    config={config}
                                    selectedSize="M"
                                    selectedColor={garment.purchasedColor || '#f5f1e8'}
                                    avatarScene={undefined}
                                    heatmapEnabled={false}
                                />
                            </Suspense>
                        )
                    })}
                </Suspense>

                {showContactShadows && <ContactShadows position={[0, 0.01, 0]} opacity={0.08} blur={1} resolution={512} frames={1} />}
            </group>
        </>
    )
}
