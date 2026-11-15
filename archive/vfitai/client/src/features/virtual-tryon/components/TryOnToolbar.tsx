

interface TryOnToolbarProps {
  showMeasurements?: boolean;
  isClosetOpen?: boolean;
  onOpenAvatar: () => void;
  onToggleCloset: () => void;
  onToggleMeasurements?: () => void;
  onTakeScreenshot?: () => void;
  onOpenSizeCompare?: () => void;
  onReset?: () => void;
  onChangeBackground?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

export default function TryOnToolbar({
  isClosetOpen = false,
  onOpenAvatar,
  onToggleCloset,
}: TryOnToolbarProps) {
  return (
    <div className="tryon-toolbar" style={{
      position: 'absolute',
      left: '24px',
      top: '50%',
      transform: 'translateY(-50%)',
      background: 'rgba(255, 255, 255, 0.85)',
      backdropFilter: 'blur(16px)',
      border: '1px solid rgba(201, 150, 63, 0.2)',
      borderRadius: '40px',
      boxShadow: '0 8px 32px rgba(201, 150, 63, 0.08)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '16px 8px',
      gap: '20px',
      zIndex: 100,
    }}>
      <ToolButton icon={
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
      } label="Avatar" active={!isClosetOpen} onClick={onOpenAvatar} />
      
      <div style={{ width: '24px', height: '1px', background: 'rgba(201, 150, 63, 0.15)' }} />

      <ToolButton icon={
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 14 3.4-6.81C6.72 6.42 7.42 6 8.2 6h7.6c.78 0 1.48.42 1.8 1.19L21 14"/><path d="M3 14h18v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6Z"/><path d="M12 2v4"/><path d="M9 3h6"/></svg>
      } label="Tủ đồ" active={isClosetOpen} onClick={onToggleCloset} />
    </div>
  );
}

function ToolButton({ icon, label, active = false, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        position: 'relative',
        width: '48px',
        height: '48px',
        background: 'transparent',
        border: 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        color: active ? '#C9963F' : '#9CA3AF',
      }}
      onMouseOver={(e) => {
        if (!active) e.currentTarget.style.color = 'rgba(201, 150, 63, 0.7)';
      }}
      onMouseOut={(e) => {
        if (!active) e.currentTarget.style.color = '#9CA3AF';
      }}
    >
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyItems: 'center' }}>
        {icon}
        {/* Dot Indicator */}
        <div style={{
          position: 'absolute',
          top: '-2px',
          right: '-4px',
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: '#C9963F',
          boxShadow: '0 0 0 2px rgba(255,255,255,0.9)',
          opacity: active ? 1 : 0,
          transform: active ? 'scale(1)' : 'scale(0.5)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }} />
      </div>
      <span style={{ fontSize: '10px', fontWeight: active ? 600 : 500 }}>{label}</span>
    </button>
  );
}
