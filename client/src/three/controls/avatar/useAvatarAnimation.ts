import { useEffect } from 'react';
import { AnimationAction } from 'three';

/**
 * Hook điều khiển chuyển động của nhân vật
 * @param actions: Danh sách các action lấy từ useAnimations
 * @param pose: Tên tư thế cần thực hiện (mặc định là 'Idle')
 */
export const useAvatarAnimation = (
    actions: Record<string, AnimationAction | null>,
    pose: string = 'Idle'
) => {
    useEffect(() => {
        // 1. Tìm tên Action thực tế trong Model (Xử lý tên không khớp hoàn toàn)
        const actionNames = Object.keys(actions);
        const targetName = actionNames.find(name =>
            name.toLowerCase().includes(pose.toLowerCase())
        );

        // 2. Lấy action tương ứng hoặc lấy cái đầu tiên làm fallback
        const action = targetName ? actions[targetName] : actions[actionNames[0]];

        if (action) {
            // Dừng các animation khác đang chạy để tránh chồng lấn
            // action.getMixer().stopAllAction(); // Kích hoạt nếu pose bị lỗi giật

            // Reset và Fade in để chuyển cảnh mượt mà giữa các Pose
            action.reset().fadeIn(0.5).play();
        }

        // Cleanup: Khi đổi tư thế hoặc tắt ứng dụng, thực hiện Fade out
        return () => {
            if (action) {
                action.fadeOut(0.5);
            }
        };
    }, [actions, pose]);
};