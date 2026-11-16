import React, { useState, useRef, useEffect } from 'react';

type MeasurementData = {
  height: number;
  weight: number;
  chest: number;
  waist: number;
  hip: number;
  shoulder: number;
  [key: string]: number;
};

interface PhotoUploadFlowProps {
  onComplete: (measurements: MeasurementData) => void;
  onSwitchToManual: () => void;
}

export default function PhotoUploadFlow({ onComplete, onSwitchToManual }: PhotoUploadFlowProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [frontPhoto, setFrontPhoto] = useState<string | null>(null);
  const [sidePhoto, setSidePhoto] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisMessage, setAnalysisMessage] = useState('Đang chuẩn bị...');
  const [estimatedMeasurements, setEstimatedMeasurements] = useState<MeasurementData | null>(null);

  // ─── BƯỚC 3: AI đang phân tích (Mock) ───
  useEffect(() => {
    if (step === 3) {
      const analyzePhotos = async () => {
        setIsAnalyzing(true);
        
        // Simulate AI processing stages
        const stages = [
          { message: 'Đang phát hiện điểm mốc cơ thể...', duration: 1200 },
          { message: 'Đang tính toán tỷ lệ các chiều...', duration: 1000 },
          { message: 'Đang ước tính số đo 3D...', duration: 1400 },
          { message: 'Đang hiệu chỉnh với dữ liệu chuẩn...', duration: 800 },
          { message: 'Hoàn tất phân tích!', duration: 600 },
        ];
        
        for (const stage of stages) {
          setAnalysisMessage(stage.message);
          await new Promise(resolve => setTimeout(resolve, stage.duration));
        }
        
        // Mock estimated measurements
        setEstimatedMeasurements({
          height: 165,
          weight: 55,
          chest: 86,
          waist: 68,
          hip: 92,
          shoulder: 38,
        });
        
        setIsAnalyzing(false);
        setStep(4);
      };
      
      analyzePhotos();
    }
  }, [step]);

  return (
    <div style={{ padding: '0 4px' }}>
      
      {/* ─── BƯỚC 1: Hướng dẫn chụp ảnh ─── */}
      {step === 1 && (
        <div style={{ textAlign: 'center', padding: '8px 0 24px' }}>
          {/* Icon */}
          <div style={{
            width: '64px', height: '64px',
            background: 'var(--gold-light)',
            border: '1px solid var(--gold-border)',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            fontSize: '28px',
          }}>📸</div>

          <div style={{
            fontSize: '18px', fontWeight: '600',
            color: 'var(--text-primary)', marginBottom: '6px',
          }}>
            AI đo số đo từ ảnh của bạn
          </div>
          <div style={{
            fontSize: '12px', color: 'var(--text-secondary)',
            lineHeight: '1.6', marginBottom: '24px',
          }}>
            Cần 2 ảnh để AI phân tích chính xác nhất
          </div>

          {/* 2 instruction cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '24px' }}>
            {/* Card ảnh mặt trước */}
            <div style={{
              background: 'var(--surface-subtle)',
              border: '1px solid var(--gold-border)',
              borderRadius: '12px', padding: '16px 12px',
            }}>
              <svg width="48" height="80" viewBox="0 0 48 80" style={{ margin: '0 auto 10px', display: 'block' }}>
                <circle cx="24" cy="10" r="8" fill="none" stroke="var(--gold-primary)" strokeWidth="1.5"/>
                <line x1="24" y1="18" x2="24" y2="50" stroke="var(--gold-primary)" strokeWidth="1.5"/>
                <line x1="24" y1="26" x2="10" y2="40" stroke="var(--gold-primary)" strokeWidth="1.5"/>
                <line x1="24" y1="26" x2="38" y2="40" stroke="var(--gold-primary)" strokeWidth="1.5"/>
                <line x1="24" y1="50" x2="16" y2="72" stroke="var(--gold-primary)" strokeWidth="1.5"/>
                <line x1="24" y1="50" x2="32" y2="72" stroke="var(--gold-primary)" strokeWidth="1.5"/>
              </svg>
              <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>
                Ảnh mặt trước
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                Đứng thẳng, nhìn thẳng, 2 tay thả tự nhiên
              </div>
            </div>

            {/* Card ảnh mặt bên */}
            <div style={{
              background: 'var(--surface-subtle)',
              border: '1px solid var(--gold-border)',
              borderRadius: '12px', padding: '16px 12px',
            }}>
              <svg width="48" height="80" viewBox="0 0 48 80" style={{ margin: '0 auto 10px', display: 'block' }}>
                <circle cx="28" cy="10" r="8" fill="none" stroke="var(--gold-primary)" strokeWidth="1.5"/>
                <line x1="24" y1="18" x2="22" y2="50" stroke="var(--gold-primary)" strokeWidth="1.5"/>
                <line x1="23" y1="26" x2="12" y2="38" stroke="var(--gold-primary)" strokeWidth="1.5"/>
                <line x1="23" y1="28" x2="30" y2="42" stroke="var(--gold-primary)" strokeWidth="1.5"/>
                <line x1="22" y1="50" x2="18" y2="72" stroke="var(--gold-primary)" strokeWidth="1.5"/>
                <line x1="22" y1="50" x2="28" y2="72" stroke="var(--gold-primary)" strokeWidth="1.5"/>
              </svg>
              <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>
                Ảnh mặt bên
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                Đứng nghiêng 90°, nhìn thẳng phía trước
              </div>
            </div>
          </div>

          {/* Tips */}
          <div style={{
            background: 'var(--gold-light)',
            border: '1px solid var(--gold-border)',
            borderRadius: '10px', padding: '12px 14px',
            textAlign: 'left', marginBottom: '24px',
          }}>
            <div style={{ fontSize: '10px', color: 'var(--gold-primary)', fontWeight: '600',
              letterSpacing: '0.08em', marginBottom: '6px' }}>
              ✦ MẸO ĐỂ AI ĐO CHÍNH XÁC
            </div>
            {[
              'Mặc quần áo ôm sát hoặc đồ thể thao',
              'Chụp cách 1.5–2m, thấy toàn thân',
              'Nền tường sáng, ánh sáng đều',
              'Đứng thẳng, không cúi người',
            ].map((tip, i) => (
              <div key={i} style={{
                fontSize: '11px', color: 'var(--text-secondary)',
                display: 'flex', gap: '6px', marginBottom: '3px',
              }}>
                <span style={{ color: 'var(--gold-primary)' }}>•</span>
                {tip}
              </div>
            ))}
          </div>

          <button
            onClick={() => setStep(2)}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, var(--gold-primary), #E8B84B)',
              border: 'none', borderRadius: '12px',
              padding: '13px', fontSize: '13px', fontWeight: '600',
              color: '#0F0B07', cursor: 'pointer',
              letterSpacing: '0.03em',
              boxShadow: '0 4px 16px rgba(201,150,63,0.25)',
            }}
          >
            Bắt đầu chụp ảnh →
          </button>

          <button
            onClick={() => onSwitchToManual()}
            style={{
              background: 'transparent', border: 'none',
              color: 'var(--text-secondary)', fontSize: '11px',
              cursor: 'pointer', marginTop: '10px', padding: '4px',
              textDecoration: 'underline',
            }}
          >
            Nhập số đo thủ công
          </button>
        </div>
      )}

      {/* ─── BƯỚC 2: Upload 2 ảnh ─── */}
      {step === 2 && (
        <div style={{ padding: '8px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '20px' }}>
            {[1, 2, 3, 4].map(s => (
              <React.Fragment key={s}>
                <div style={{
                  width: s <= step ? '24px' : '20px',
                  height: s <= step ? '24px' : '20px',
                  borderRadius: '50%',
                  background: s < step ? 'var(--gold-primary)'
                    : s === step ? 'var(--gold-light)'
                    : 'var(--surface-subtle)',
                  border: s === step ? '2px solid var(--gold-primary)'
                    : s < step ? 'none'
                    : '1px solid var(--gold-border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '10px', fontWeight: '600',
                  color: s < step ? '#0F0B07' : s === step ? 'var(--gold-primary)' : 'var(--text-secondary)',
                  transition: 'all 0.2s',
                  flexShrink: 0,
                }}>
                  {s < step ? '✓' : s}
                </div>
                {s < 4 && (
                  <div style={{
                    flex: 1, height: '1px',
                    background: s < step ? 'var(--gold-primary)' : 'var(--gold-border)',
                    transition: 'background 0.3s',
                  }} />
                )}
              </React.Fragment>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
            <UploadZone label="front" photo={frontPhoto} setPhoto={setFrontPhoto} />
            <UploadZone label="side" photo={sidePhoto} setPhoto={setSidePhoto} />
          </div>

          <button
            onClick={() => setStep(3)}
            disabled={!frontPhoto || !sidePhoto}
            style={{
              width: '100%',
              background: (!frontPhoto || !sidePhoto) ? 'var(--surface-subtle)' : 'linear-gradient(135deg, var(--gold-primary), #E8B84B)',
              border: (!frontPhoto || !sidePhoto) ? '1px solid var(--gold-border)' : 'none',
              borderRadius: '12px',
              padding: '13px', fontSize: '13px', fontWeight: '600',
              color: (!frontPhoto || !sidePhoto) ? 'var(--text-secondary)' : '#0F0B07',
              cursor: (!frontPhoto || !sidePhoto) ? 'not-allowed' : 'pointer',
              letterSpacing: '0.03em',
              boxShadow: (!frontPhoto || !sidePhoto) ? 'none' : '0 4px 16px rgba(201,150,63,0.25)',
              opacity: (!frontPhoto || !sidePhoto) ? 0.45 : 1,
              transition: 'all 0.2s ease'
            }}
          >
            Tiếp tục phân tích →
          </button>
        </div>
      )}

      {/* ─── BƯỚC 3: AI đang phân tích ─── */}
      {step === 3 && (
        <div style={{ textAlign: 'center', padding: '32px 16px' }}>
          <div style={{ position: 'relative', width: '120px', height: '200px', margin: '0 auto 24px' }}>
            <svg width="120" height="200" viewBox="0 0 120 200">
              <circle cx="60" cy="24" r="20" fill="none" stroke="var(--gold-border)" strokeWidth="1.5"/>
              <line x1="60" y1="44" x2="60" y2="130" stroke="var(--gold-border)" strokeWidth="1.5"/>
              <line x1="60" y1="70" x2="28" y2="100" stroke="var(--gold-border)" strokeWidth="1.5"/>
              <line x1="60" y1="70" x2="92" y2="100" stroke="var(--gold-border)" strokeWidth="1.5"/>
              <line x1="60" y1="130" x2="42" y2="190" stroke="var(--gold-border)" strokeWidth="1.5"/>
              <line x1="60" y1="130" x2="78" y2="190" stroke="var(--gold-border)" strokeWidth="1.5"/>
              
              <line
                x1="20" y1="0" x2="100" y2="0"
                stroke="var(--gold-primary)" strokeWidth="2" opacity="0.8"
                style={{ animation: 'scanLine 2s ease-in-out infinite' }}
              />
              
              {[
                {cx:60, cy:24}, {cx:60, cy:60}, {cx:60, cy:90},
                {cx:60, cy:130}, {cx:42, cy:190}, {cx:78, cy:190}
              ].map((pt, i) => (
                <circle key={i} cx={pt.cx} cy={pt.cy} r="4"
                  fill="var(--gold-primary)" opacity="0.9"
                  style={{ animation: `dotAppear 0.3s ease ${i * 0.4}s both` }}
                />
              ))}
            </svg>
          </div>
          
          <div style={{
            fontSize: '13px', fontWeight: '500',
            color: 'var(--text-primary)', marginBottom: '8px',
            minHeight: '20px',
          }}>
            {analysisMessage}
          </div>
          
          <div style={{
            width: '200px', height: '3px',
            background: 'var(--gold-light)',
            borderRadius: '2px', margin: '0 auto 16px',
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              background: 'linear-gradient(90deg, var(--gold-primary), #E8B84B)',
              borderRadius: '2px',
              animation: 'progressFill 5s linear forwards',
            }} />
          </div>
          
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', opacity: 0.6 }}>
            Đang xử lý ảnh của bạn...
          </div>
        </div>
      )}

      {/* ─── BƯỚC 4: Kết quả + Confirm ─── */}
      {step === 4 && (
        <div style={{ padding: '4px 0' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            marginBottom: '16px',
          }}>
            <div style={{
              width: '36px', height: '36px',
              background: 'rgba(76,175,80,0.1)',
              border: '1px solid rgba(76,175,80,0.3)',
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '16px',
            }}>✓</div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
                AI đã đo xong!
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                Kiểm tra và điều chỉnh nếu cần
              </div>
            </div>
          </div>

          <div style={{
            background: 'var(--gold-light)',
            border: '1px solid var(--gold-border)',
            borderRadius: '10px', padding: '10px 14px',
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: '16px',
          }}>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              Độ chính xác ước tính
            </div>
            <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--gold-primary)' }}>
              ~85–92%
            </div>
          </div>

          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr',
            gap: '8px', marginBottom: '20px',
          }}>
            {[
              { key: 'height', label: 'Chiều cao', unit: 'cm', icon: '↕' },
              { key: 'weight', label: 'Cân nặng', unit: 'kg', icon: '⚖' },
              { key: 'chest', label: 'Vòng ngực', unit: 'cm', icon: '○' },
              { key: 'waist', label: 'Vòng eo', unit: 'cm', icon: '○' },
              { key: 'hips', label: 'Vòng hông', unit: 'cm', icon: '○' },
              { key: 'shoulder', label: 'Vai rộng', unit: 'cm', icon: '↔' },
            ].map(field => (
              <div key={field.key} style={{
                background: 'var(--surface-subtle)',
                border: '1px solid var(--gold-border)',
                borderRadius: '10px', padding: '10px 12px',
              }}>
                <div style={{
                  fontSize: '9px', color: 'var(--text-secondary)',
                  letterSpacing: '0.08em', marginBottom: '4px',
                  display: 'flex', justifyContent: 'space-between',
                }}>
                  <span>{field.label}</span>
                  <span style={{ color: 'var(--gold-primary)', opacity: 0.6 }}>AI ✦</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <input
                    type="number"
                    value={estimatedMeasurements?.[field.key] || ''}
                    onChange={e => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val)) {
                        setEstimatedMeasurements(prev => prev ? ({
                          ...prev,
                          [field.key]: val
                        }) : null);
                      }
                    }}
                    style={{
                      flex: 1, background: 'transparent',
                      border: 'none', outline: 'none',
                      fontSize: '18px', fontWeight: '700',
                      color: 'var(--text-primary)',
                      width: '100%',
                    }}
                  />
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    {field.unit}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div style={{
            fontSize: '10px', color: 'var(--text-secondary)',
            textAlign: 'center', marginBottom: '16px', opacity: 0.6,
          }}>
            Bạn có thể chỉnh số đo bằng cách nhấn vào ô
          </div>

          <button
            onClick={() => estimatedMeasurements && onComplete(estimatedMeasurements)}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, var(--gold-primary), #E8B84B)',
              border: 'none', borderRadius: '12px',
              padding: '13px', fontSize: '13px', fontWeight: '600',
              color: '#0F0B07', cursor: 'pointer',
              letterSpacing: '0.03em',
              boxShadow: '0 4px 16px rgba(201,150,63,0.25)',
              marginBottom: '8px',
            }}
          >
            Tạo avatar 3D với số đo này →
          </button>

          <button
            onClick={() => setStep(2)}
            style={{
              width: '100%', background: 'transparent',
              border: '1px solid var(--gold-border)',
              borderRadius: '12px', padding: '10px',
              fontSize: '12px', color: 'var(--text-secondary)',
              cursor: 'pointer',
            }}
          >
            ← Chụp lại ảnh
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Component Phụ Trợ ───
function UploadZone({ label, photo, setPhoto }: { label: 'front'|'side', photo: string | null, setPhoto: (url: string) => void }) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file?: File) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setPhoto(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={e => { e.preventDefault(); setIsDragging(false); handleFile(e.dataTransfer.files?.[0]); }}
      style={{
        border: photo
          ? '1.5px solid var(--gold-primary)'
          : isDragging
          ? '1.5px dashed var(--gold-primary)'
          : '1.5px dashed var(--gold-border)',
        borderRadius: '14px',
        padding: photo ? '0' : '24px 16px',
        textAlign: 'center',
        cursor: 'pointer',
        background: photo ? 'transparent' : 'var(--surface-subtle)',
        transition: 'all 0.2s',
        overflow: 'hidden',
        aspectRatio: photo ? '3/4' : 'auto',
        position: 'relative',
      }}
    >
      {photo ? (
        <>
          <img src={photo} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(15,11,7,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: 0, transition: 'opacity 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '1'}
          onMouseLeave={e => e.currentTarget.style.opacity = '0'}
          >
            <span style={{ color: '#fff', fontSize: '12px', fontWeight: '500' }}>Đổi ảnh</span>
          </div>
          <div style={{
            position: 'absolute', top: '8px', right: '8px',
            background: 'var(--gold-primary)', borderRadius: '50%',
            width: '22px', height: '22px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '11px', color: '#0F0B07', fontWeight: '700',
          }}>✓</div>
        </>
      ) : (
        <>
          <div style={{ fontSize: '28px', marginBottom: '8px' }}>
            {label === 'front' ? '🧍' : '🧍'}
          </div>
          <div style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '4px' }}>
            {label === 'front' ? 'Ảnh mặt trước' : 'Ảnh mặt bên'}
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
            Nhấn hoặc kéo thả ảnh vào đây
          </div>
        </>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="user"
        style={{ display: 'none' }}
        onChange={e => handleFile(e.target.files?.[0])}
      />
    </div>
  );
}
