import React, { useEffect, useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Camera, CameraOff, Activity } from 'lucide-react';
import { analyzeFrame } from '../services/geminiService';
import { AnalysisResult, AlertState } from '../types';
import { SCAN_INTERVAL_MS, THRESHOLDS } from '../constants';

interface WebcamViewProps {
  onAnalysisComplete: (result: AnalysisResult) => void;
  isProcessing: boolean;
  setIsProcessing: (val: boolean) => void;
  alertState: AlertState;
}

export const WebcamView: React.FC<WebcamViewProps> = ({ 
  onAnalysisComplete, 
  isProcessing, 
  setIsProcessing,
  alertState 
}) => {
  const webcamRef = useRef<Webcam>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [deviceId, setDeviceId] = useState<string>("");
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const intervalRef = useRef<number | null>(null);

  const handleDevices = useCallback((mediaDevices: MediaDeviceInfo[]) => {
    setDevices(mediaDevices.filter(({ kind }) => kind === "videoinput"));
  }, [setDevices]);

  // Only enumerate devices after permission is granted (handled via onUserMedia)
  // or on mount if permissions were already granted previously
  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then(handleDevices);
  }, [handleDevices]);

  const handleUserMedia = useCallback(() => {
    // Refresh device list once camera is active and permissions are granted
    navigator.mediaDevices.enumerateDevices().then(handleDevices);
  }, [handleDevices]);

  const captureAndAnalyze = async () => {
    if (!webcamRef.current) return;
    
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;

    setIsProcessing(true);
    try {
      const result = await analyzeFrame(imageSrc);
      onAnalysisComplete(result);
    } catch (err) {
      console.error("Analysis failed", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleCamera = () => {
    if (cameraActive) {
      setCameraActive(false);
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    } else {
      setCameraActive(true);
    }
  };

  useEffect(() => {
    if (cameraActive) {
      intervalRef.current = window.setInterval(captureAndAnalyze, SCAN_INTERVAL_MS);
    } else {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraActive]); 

  let borderColor = "border-cyber-gray";
  if (cameraActive) {
    if (alertState === AlertState.CRITICAL) borderColor = "border-neon-red shadow-[0_0_20px_rgba(255,0,60,0.5)]";
    else if (alertState === AlertState.WARNING) borderColor = "border-neon-yellow";
    else borderColor = "border-neon-blue";
  }

  // Use facingMode: user by default if no specific device is selected
  // This is more robust than passing an empty string for deviceId
  const videoConstraints = deviceId ? { deviceId } : { facingMode: "user" };

  return (
    <div className="relative group">
      {/* HUD Corners */}
      <div className={`absolute top-0 left-0 w-8 h-8 border-l-2 border-t-2 ${cameraActive ? 'border-neon-blue' : 'border-gray-600'} z-20`}></div>
      <div className={`absolute top-0 right-0 w-8 h-8 border-r-2 border-t-2 ${cameraActive ? 'border-neon-blue' : 'border-gray-600'} z-20`}></div>
      <div className={`absolute bottom-0 left-0 w-8 h-8 border-l-2 border-b-2 ${cameraActive ? 'border-neon-blue' : 'border-gray-600'} z-20`}></div>
      <div className={`absolute bottom-0 right-0 w-8 h-8 border-r-2 border-b-2 ${cameraActive ? 'border-neon-blue' : 'border-gray-600'} z-20`}></div>

      {/* Main Video Container */}
      <div className={`relative overflow-hidden rounded-lg bg-black border-2 transition-all duration-300 ${borderColor} aspect-video flex items-center justify-center`}>
        {!cameraActive && (
          <div className="text-center text-gray-500">
             <CameraOff size={48} className="mx-auto mb-2 opacity-50" />
             <p className="font-mono text-sm">SYSTEM OFFLINE</p>
          </div>
        )}

        {cameraActive && (
          <>
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              videoConstraints={videoConstraints}
              onUserMedia={handleUserMedia}
              onUserMediaError={(e) => console.error("Webcam access error:", e)}
              className="w-full h-full object-cover"
            />
            {/* Scanning Line Animation */}
            <div className="absolute top-0 left-0 w-full h-1 bg-neon-blue/50 shadow-[0_0_15px_#00f3ff] animate-scan pointer-events-none opacity-50"></div>
            
            {/* Grid Overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,243,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,243,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>

            {/* Status Indicators */}
            <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/60 backdrop-blur px-3 py-1 rounded border border-gray-700 z-10">
               <div className={`w-2 h-2 rounded-full ${isProcessing ? 'bg-neon-yellow animate-pulse' : 'bg-gray-500'}`}></div>
               <span className="text-xs font-mono text-neon-blue">{isProcessing ? 'ANALYZING...' : 'STANDBY'}</span>
            </div>

            <div className="absolute top-4 right-4 text-xs font-mono text-neon-blue bg-black/60 px-2 py-1 rounded border border-gray-700 z-10">
               FPS: 30
            </div>
          </>
        )}
      </div>

      {/* Controls */}
      <div className="mt-4 flex justify-between items-center">
        <button 
          onClick={toggleCamera}
          className={`px-6 py-2 rounded font-mono font-bold tracking-wider transition-all
            ${cameraActive 
              ? 'bg-red-500/10 text-red-500 border border-red-500 hover:bg-red-500/20' 
              : 'bg-neon-blue/10 text-neon-blue border border-neon-blue hover:bg-neon-blue/20'
            }`}
        >
          {cameraActive ? 'TERMINATE FEED' : 'INITIATE SYSTEM'}
        </button>

        {devices.length > 0 && (
          <select 
            className="bg-black border border-gray-700 text-gray-400 text-xs p-2 rounded outline-none focus:border-neon-blue"
            onChange={(e) => setDeviceId(e.target.value)}
            value={deviceId}
          >
            {devices.map((device, key) => (
              <option key={key} value={device.deviceId}>
                {device.label || `Camera ${key + 1}`}
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
};