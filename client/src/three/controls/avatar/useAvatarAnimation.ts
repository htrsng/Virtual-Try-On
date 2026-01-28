// src/three/controls/avatar/useAvatarAnimation.ts

import { useEffect } from 'react';
import { AnimationAction } from 'three';

export const useAvatarAnimation = (
    actions: Record<string, AnimationAction | null>,
    pose: string = 'Idle'
) => {
    useEffect(() => {
        // Tìm action tương ứng với pose (VD: 'Idle')
        // Lưu ý: Tên này phải khớp chính xác với tên NLA Track trong Blender
        const action = actions[pose];

        if (action) {
            // Reset về trạng thái đầu, Fade in trong 0.5s để chuyển động mượt
            action.reset().fadeIn(0.5).play();
        }

        // Cleanup: Khi đổi pose hoặc unmount, fade out action cũ
        return () => {
            action?.fadeOut(0.5);
        };
    }, [actions, pose]);
};