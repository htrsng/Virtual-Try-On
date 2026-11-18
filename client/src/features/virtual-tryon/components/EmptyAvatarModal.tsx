import { useRef } from 'react';
import { useDialogFocus } from '../../../hooks/useDialogFocus';

interface EmptyAvatarModalProps {
    isOpen: boolean;
    onCreateAvatar: () => void;
    onSkip: () => void;
}

export default function EmptyAvatarModal({ isOpen, onCreateAvatar, onSkip }: EmptyAvatarModalProps) {
    const dialog = useRef<HTMLDivElement>(null);
    useDialogFocus(isOpen, dialog, onSkip);
    if (!isOpen) {
        return null;
    }

    return (
        <div className="vto-empty-avatar-modal__backdrop" role="presentation">
            <div ref={dialog} className="vto-empty-avatar-modal" role="dialog" aria-modal="true" aria-labelledby="vto-empty-avatar-title" tabIndex={-1}>
                <h3 id="vto-empty-avatar-title">Bạn chưa tạo avatar nào</h3>
                <p>
                    Tạo avatar để thử đồ với số đo thật của bạn. Nếu bỏ qua, hệ thống sẽ sử dụng body mặc định tạm thời.
                </p>
                <div className="vto-empty-avatar-modal__actions">
                    <button type="button" className="vto-btn vto-btn--primary" onClick={onCreateAvatar}>
                        Tạo Avatar
                    </button>
                    <button type="button" className="vto-btn vto-btn--ghost" onClick={onSkip}>
                        Bỏ qua
                    </button>
                </div>
            </div>
        </div>
    );
}
