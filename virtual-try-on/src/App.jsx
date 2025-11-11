import React from 'react';

function App() {
  const handleStart = () => {
    alert("Bắt đầu nào!");
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '50px', fontFamily: 'Arial' }}>
      <header>
        <h1>Chào mừng đến với Dự án Thử Đồ Ảo</h1>
        <p>Dự án 50 ngày (11/11 - 31/12/2025)</p>

        {/* Đây là nút bấm theo kế hoạch Ngày 1 */}
        <button
          onClick={handleStart}
          style={{ padding: '15px 30px', fontSize: '20px', cursor: 'pointer' }}
        >
          Start Try-On
        </button>
      </header>
    </div>
  );
}

export default App;