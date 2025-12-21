import { useState } from 'react'
import './App.css'
import BodyForm from './components/BodyForm'

function App() {
  const [bodyData, setBodyData] = useState({
    height: 170,
    weight: 60,
  });

  return (
    <div className="App">
      <h1>VFitAI - Dự án Thử đồ 3D</h1>
      <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginTop: '20px' }}>

        {/* Bên trái: Form điều khiển */}
        <div style={{ width: '300px' }}>
          <BodyForm data={bodyData} onChange={setBodyData} />
        </div>

        {/* Bên phải: Nơi chứa mô hình 3D (Tạm thời để trống) */}
        <div style={{
          width: '500px',
          height: '400px',
          border: '2px dashed #ccc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <p>Khu vực hiển thị 3D (Ngày 2 sẽ làm)</p>
        </div>

      </div>
    </div>
  )
}

export default App