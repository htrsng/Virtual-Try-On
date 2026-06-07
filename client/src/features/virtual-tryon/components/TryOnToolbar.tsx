

interface TryOnToolbarProps {
  showMeasurements: boolean;
  onOpenAvatar: () => void;
  onToggleCloset: () => void;
  onToggleMeasurements: () => void;
  onTakeScreenshot: () => void;
  onOpenSizeCompare: () => void;
  onReset: () => void;
  onChangeBackground: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
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
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
}: TryOnToolbarProps) {
  return (
    <div className="tryon-toolbar" style={{
      width: '64px',
      background: '#FFFFFF',
      border: 'none',
      borderRadius: '16px',
      margin: '12px 0 12px 8px',
      height: 'calc(100% - 24px)',
      boxShadow: '0 4px 20px rgba(180, 140, 80, 0.12)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '16px 0',
      gap: 0,
      overflowY: 'auto',
      scrollbarWidth: 'none'
    }}>
      {/* GROUP 1 — Avatar tools */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        alignItems: 'center',
        borderBottom: '0.5px solid #E8DCC8',
        paddingBottom: '12px',
        marginBottom: '12px'
      }}>
        <ToolButton icon="👤" label="Avatar" onClick={onOpenAvatar} />
        <ToolButton icon="👕" label="Tủ đồ" onClick={onToggleCloset} />
      </div>

      {/* GROUP 2 — Scene tools */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        alignItems: 'center'
      }}>
        <ToolButton icon="📐" label="Đo" active={showMeasurements} onClick={onToggleMeasurements} />
        <ToolButton icon="🎨" label="Nền" onClick={onChangeBackground} />
        <ToolButton icon="📸" label="Chụp" onClick={onTakeScreenshot} />
        <ToolButton icon="↕" label="So sánh" onClick={onOpenSizeCompare} />
      </div>

      {/* GROUP 3 — Actions (Bottom) */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        alignItems: 'center',
        marginTop: 'auto',
        borderTop: '0.5px solid #E8DCC8',
        paddingTop: '12px'
      }}>
        <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
          <button 
            onClick={onUndo} 
            disabled={!canUndo}
            title="Undo"
            style={{
              width: '28px', height: '28px', borderRadius: '6px', 
              border: 'none', background: 'transparent', cursor: canUndo ? 'pointer' : 'not-allowed',
              opacity: canUndo ? 1 : 0.3, display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            <span style={{ fontSize: '14px' }}>↶</span>
          </button>
          <button 
            onClick={onRedo} 
            disabled={!canRedo}
            title="Redo"
            style={{
              width: '28px', height: '28px', borderRadius: '6px', 
              border: 'none', background: 'transparent', cursor: canRedo ? 'pointer' : 'not-allowed',
              opacity: canRedo ? 1 : 0.3, display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            <span style={{ fontSize: '14px' }}>↷</span>
          </button>
        </div>
        <ToolButton icon="↺" label="Reset" onClick={onReset} />
      </div>
    </div>
  );
}

function ToolButton({ icon, label, active = false, onClick }: { icon: string; label: string; active?: boolean; onClick: () => void }) {
  // We remove inline hover/active styles so CSS can handle the #8B5CF6 highlight and tooltips
  return (
    <button
      className={`tool-btn-item ${active ? 'active' : ''}`}
      onClick={onClick}
      data-tooltip={label}
    >
      <span className="tool-btn-icon">{icon}</span>
      <span className="tool-btn-label">{label}</span>
    </button>
  );
}
