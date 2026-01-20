import { useEffect } from 'react';
import type { AnimationAction } from 'three';
import type { AvatarPose } from './types';

export const useAvatarAnimation = (
    actions: Record<string, AnimationAction | undefined>, // Type an toàn hơn
    pose: AvatarPose
) => {
    useEffect(() => {
        // Mapping tên pose sang tên animation trong file GLB
        const name = pose === 'walking' ? 'Walking' : 'Idle';

        // Fallback: Nếu không tìm thấy tên đúng, lấy animation đầu tiên tìm thấy
        const action = actions[name] || Object.values(actions)[0];

        if (!action) return;

        // Reset và FadeIn để chuyển động mượt mà
        action.reset().fadeIn(0.4).play();

        // Cleanup khi pose thay đổi
        return () => {
            action.fadeOut(0.3);
        };
    }, [pose, actions]);
};