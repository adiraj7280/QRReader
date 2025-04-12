import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import jsQR from 'jsqr';
import { isValidUrl } from '../utils/helpers';

// Constants for localStorage keys
const STORAGE_KEYS = {
  SCAN_MODE: 'qrScanner_scanMode',
  CAMERA_ID: 'qrScanner_cameraId',
  LAST_RESULT: 'qrScanner_lastResult'
};

function QRScanner() {
  // Initialize state with values from localStorage or defaults
  const [result, setResult] = useState('No result');
  const [scanMode, setScanMode] = useState(() => {
    const savedMode = localStorage.getItem(STORAGE_KEYS.SCAN_MODE);
    return savedMode || 'camera';
  });
  const [scanning, setScanning] = useState(false);
  const [cameras, setCameras] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  
  const scannerRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const dropzoneRef = useRef(null);
  
  // Reset result on component mount
  useEffect(() => {
    setResult('No result');
    setScanSuccess(false);
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SCAN_MODE, scanMode);
  }, [scanMode]);

  useEffect(() => {
    if (result !== 'No result') {
      localStorage.setItem(STORAGE_KEYS.LAST_RESULT, result);
    }
  }, [result]);

  // Initialize camera list on component mount
  useEffect(() => {
    let mounted = true;
    
    // Get available cameras when component mounts
    Html5Qrcode.getCameras().then(devices => {
      if (mounted && devices && devices.length) {
        setCameras(devices);
      }
    }).catch(err => {
      console.error('Error getting cameras', err);
    });
    
    // Cleanup when component unmounts
    return () => {
      mounted = false;
      stopCameraScanner();
    };
  }, []);

  const getRearCameraId = (cameras) => {
    // Try to find the rear camera first (usually labeled as "back" or "environment")
    const rearCamera = cameras.find(cam => 
      cam.label.toLowerCase().includes('back') || 
      cam.label.toLowerCase().includes('rear') ||
      cam.label.toLowerCase().includes('environment')
    );

    if (rearCamera) {
      return rearCamera.deviceId;
    }

    // If no rear camera found, use the first available camera
    return cameras[0]?.deviceId || '';
  };

  const startCameraScanner = async () => {
    // Reset success state when starting a new scan
    setScanSuccess(false);
    
    // If scanner is already running, stop it first
    if (scanning) {
      await stopCameraScanner();
    }
  
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode('qr-reader');
      }

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      };

      // Get the rear camera ID
      const availableCameras = await Html5Qrcode.getCameras();
      const rearCameraId = getRearCameraId(availableCameras);

      await scannerRef.current.start(
        rearCameraId ? { deviceId: rearCameraId } : { facingMode: 'environment' },
        config,
        (decodedText) => {
          setResult(decodedText);
          setScanSuccess(true);
          playSuccessSound();
          stopCameraScanner();
        },
        (errorMessage) => {
          // Don't log frequent "No QR code found" messages
          if (errorMessage.includes('No QR code found')) return;
          console.log(errorMessage);
        }
      );
      
      setScanning(true);
    } catch (err) {
      console.error('Error starting camera scanner:', err);
      alert(`Could not start camera: ${err.message}`);
      setScanning(false);
    }
  };

  const stopCameraScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch (err) {
        console.warn('Error stopping camera scanner:', err);
      }
      setScanning(false);
    }
  };

  const processImage = (file) => {
    if (!file) return;
  
    // Reset state before starting new scan
    setResult('No result');
    setScanSuccess(false);
  
    if (scanning) {
      stopCameraScanner();
    }
  
    const canvas = canvasRef.current;
    if (!canvas) {
      console.error('Canvas element not found');
      return;
    }
  
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        
        const context = canvas.getContext('2d');
        context.drawImage(img, 0, 0);
        
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        
        if (code) {
          setResult(code.data);
          setScanSuccess(true);
          playSuccessSound();
        } else {
          alert('No QR code found in this image or the image is unreadable.');
          setScanSuccess(false);
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    processImage(file);
  };
  
  const handleScanModeChange = async (mode) => {
    // Stop camera if it's running
    if (scanning) {
      await stopCameraScanner();
    }
    
    setScanMode(mode);
    setResult('No result');
    setScanSuccess(false);
  };

  // Play a success sound when QR code is detected
  const playSuccessSound = () => {
    try {
      // Use a more reliable sound implementation
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (err) {
      console.warn('Could not play sound:', err);
    }
  };

  // Drag and drop handlers
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        processImage(file);
      } else {
        alert('Please drop an image file.');
      }
    }
  };

  return (
    <div className="qr-scanner">
      <div className="scan-mode-buttons">
        <button 
          onClick={() => handleScanModeChange('camera')}
          className={`mode-button ${scanMode === 'camera' ? 'active' : ''}`}
        >
          Use Camera
        </button>
        <button 
          onClick={() => handleScanModeChange('file')}
          className={`mode-button ${scanMode === 'file' ? 'active' : ''}`}
        >
          Upload Image
        </button>
      </div>
      
      {scanMode === 'camera' && (
        <div className="scanner-section">
          <div className="scanner-container">
            <div id="qr-reader" style={{ width: '100%', maxWidth: '400px', margin: '0 auto' }}></div>
            <div className="scanner-controls">
              {!scanning ? (
                <button 
                  onClick={startCameraScanner}
                  className="scan-button"
                >
                  Start Scanning
                </button>
              ) : (
                <button 
                  onClick={stopCameraScanner}
                  className="stop-button"
                >
                  Stop Scanning
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      
      {scanMode === 'file' && (
        <div className="scanner-section">
          <div className="scanner-container">
            <canvas 
              ref={canvasRef}
              style={{ display: 'none' }}
            />
            
            <div
              ref={dropzoneRef}
              className={`dropzone ${isDragging ? 'dragging' : ''}`}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <p>Drag & drop QR code image here<br/>or paste an image from clipboard</p>
              
              <input 
                type="file" 
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
              <button 
                onClick={() => fileInputRef.current.click()} 
                className="file-button"
              >
                Select Image File
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="result-container">
        <h3>Scan Result:</h3>
        <div className="result-box">
          {result === 'No result' ? (
            <p>{result}</p>
          ) : isValidUrl(result) ? (
            <>
              <p>URL detected: <a href={result} target="_blank" rel="noopener noreferrer">{result}</a></p>
              <div className="result-actions">
                <button 
                  onClick={() => window.open(result, '_blank')} 
                  className="url-button"
                >
                  Open URL
                </button>
                <button 
                  onClick={() => navigator.clipboard.writeText(result)} 
                  className="copy-button"
                >
                  Copy
                </button>
              </div>
            </>
          ) : (
            <>
              <p>{result}</p>
              <div className="result-actions">
                <button 
                  onClick={() => navigator.clipboard.writeText(result)} 
                  className="copy-button"
                >
                  Copy
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default QRScanner;