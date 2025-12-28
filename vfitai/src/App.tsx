import React from 'react';
import { Scene } from './three/Scene'; // Import từ folder three của bạn

function App() {
    return (
        <div className="App" style={{ width: '100vw', height: '100vh' }}>
            {/* Hiển thị Scene full màn hình để test */}
            <Scene />
        </div>
    );
}

export default App;