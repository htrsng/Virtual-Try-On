import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './modern-styles.css'
import App from './App.tsx'

// 1. Import Provider - "Bộ não" của phòng thử đồ Studio
import { FittingRoomProvider } from './contexts/FittingRoomContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* 2. Bao bọc App để mọi trang đều có thể truy cập Hồ sơ, Heatmap và So sánh Size */}
    <FittingRoomProvider>
      <App />
    </FittingRoomProvider>
  </StrictMode>,
)