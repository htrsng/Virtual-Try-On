

interface TryOnToolbarProps {
  showMeasurements: boolean;
  onOpenAvatar: () => void;
  onToggleCloset: () => void;
  onToggleMeasurements: () => void;
  onTakeScreenshot: () => void;
  onOpenSizeCompare: () => void;
  onReset: () => void;
  onChangeBackground: () => void;
  onChangeLighting: () => void;
}

export default function TryOnToolbar({
  showMeasurements,
  onOpenAvatar,
  onToggleCloset,
  onToggleMeasurements,
  onTakeScreenshot,
  onOpenSizeCompare,
  onReset,
  onChangeBackground,
  onChangeLighting,
}: TryOnToolbarProps) {
  return (
    <div className="tryon-toolbar" style={{
      width: '72px',
      background: 'rgba(255,255,255,0.92)',
      borderRight: '1px solid rgba(201,150,63,0.15)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '10px 0',
      gap: 0,
      overflowY: 'auto',
      scrollbarWidth: 'none',
      height: '100%'
    }}>
      {/* GROUP 1 — Avatar & Closet */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        alignItems: 'center',
        borderBottom: '1px solid rgba(201,150,63,0.15)',
        paddingBottom: '8px',
        marginBottom: '8px'
      }}>
        <ToolButton icon="👤" label="Avatar" onClick={onOpenAvatar} />
        <ToolButton icon="👕" label="Tủ đồ" onClick={onToggleCloset} />
      </div>

      {/* GROUP 2 — Canvas Controls */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        alignItems: 'center',
        borderBottom: '1px solid rgba(201,150,63,0.15)',
        paddingBottom: '8px',
        marginBottom: '8px'
      }}>
        <ToolButton icon="💡" label="Ánh sáng" onClick={onChangeLighting} />
        <ToolButton icon="📐" label="Đo" active={showMeasurements} onClick={onToggleMeasurements} />
        <ToolButton icon="🎨" label="Nền" onClick={onChangeBackground} />
      </div>

      {/* GROUP 3 — Actions */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        alignItems: 'center',
        borderBottom: '1px solid rgba(201,150,63,0.15)',
        paddingBottom: '8px',
        marginBottom: '8px'
      }}>
        <ToolButton icon="📸" label="Chụp" onClick={onTakeScreenshot} />
        <ToolButton icon="↕" label="So sánh" onClick={onOpenSizeCompare} />
      </div>

      {/* GROUP 4 — bottom */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        alignItems: 'center',
        marginTop: 'auto'
      }}>
        <ToolButton icon="↺" label="Reset" onClick={onReset} />
      </div>
    </div>
  );
}

function ToolButton({ icon, label, active = false, onClick }: { icon: string; label: string; active?: boolean; onClick: () => void }) {
  const baseStyle = {
    width: '48px',
    height: '48px',
    borderRadius: '10px',
    background: active ? 'rgba(201,150,63,0.12)' : 'transparent',
    border: active ? '1px solid rgba(201,150,63,0.25)' : 'none',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: '3px',
    color: active ? '#C9963F' : 'rgba(0,0,0,0.5)',
    marginBottom: '2px'
  };

  return (
    <button
      className="tool-btn-item"
      style={baseStyle}
      onClick={onClick}
      onMouseOver={(e) => {
        if (!active) {
          e.currentTarget.style.background = 'rgba(201,150,63,0.08)';
          e.currentTarget.style.color = '#C9963F';
        }
      }}
      onMouseOut={(e) => {
        if (!active) {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = 'rgba(0,0,0,0.5)';
        }
      }}
    >
      <span style={{ fontSize: '18px' }}>{icon}</span>
      <span style={{ fontSize: '7px', letterSpacing: '0.04em', fontWeight: 500 }}>{label}</span>
    </button>
  );
}
