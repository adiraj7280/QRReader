import React from 'react';
import QRScanner from './components/QRScanner';
import './App.css';

function App() {
  return (
    <div className="App">
      <nav className="app-navbar">
        <div className="nav-content">
          <div className="nav-brand">
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 3H9V9H3V3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M15 3H21V9H15V3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M3 15H9V21H3V15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M15 15H21V21H15V15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M12 3V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="2 4"/>
            </svg>
            <span>QR Scanner Pro</span>
          </div>
        </div>
      </nav>

      <main className="app-main">
        <div className="dashboard">
          <div className="dashboard-header">
            <h1>QR Code Scanner</h1>
            <p className="app-subtitle">Scan QR codes instantly with your camera or from image files</p>
          </div>
          
          <div className="dashboard-content">
            <QRScanner />
          </div>
        </div>
      </main>

      <footer className="app-footer">
        <div className="footer-content">
          <p>&copy; {new Date().getFullYear()} QR Scanner Pro</p>
          <p className="footer-note">Built with React & Vite</p>
        </div>
      </footer>
    </div>
  );
}

export default App;