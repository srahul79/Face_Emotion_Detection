import React from 'react';
import './App.css';
import FaceEmotionDetection from './components/FaceEmotionDetection';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Face Emotion Detection App</h1>
      </header>
      <main>
        <FaceEmotionDetection />
      </main>
      <footer className="App-footer">
        <p>Face Emotion Detection  Project</p>
        <p>Roll Number: 205123079</p>
      </footer>
    </div>
  );
}

export default App;