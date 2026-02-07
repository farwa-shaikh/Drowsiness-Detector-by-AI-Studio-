import React, { useState, useEffect, useRef } from 'react';
import { WebcamView } from './components/WebcamView';
import { StatsPanel } from './components/StatsPanel';
import { AlertBadge } from './components/AlertBadge';
import { AlertState, AnalysisResult, ChartDataPoint } from './types';
import { APP_NAME, VERSION, THRESHOLDS } from './constants';
import { Shield, Volume2, VolumeX } from 'lucide-react';

const App: React.FC = () => {
  const [alertState, setAlertState] = useState<AlertState>(AlertState.SAFE);
  const [lastAnalysis, setLastAnalysis] = useState<AnalysisResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  // Audio context for generating beeps without external files
  const audioContextRef = useRef<AudioContext | null>(null);

  const playAlertSound = () => {
    if (!soundEnabled) return;
    
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    const ctx = audioContextRef.current;
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    // Annoying alarm sound
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  };

  const handleAnalysisComplete = (result: AnalysisResult) => {
    setLastAnalysis(result);
    
    // Update chart history
    const newDataPoint: ChartDataPoint = {
      time: new Date(result.timestamp).toLocaleTimeString([], { hour12: false, minute: '2-digit', second: '2-digit' }),
      value: result.eyeOpenness
    };

    setChartData(prev => {
      const updated = [...prev, newDataPoint];
      if (updated.length > 20) updated.shift(); // Keep last 20 points
      return updated;
    });

    // Determine State
    let newState = AlertState.SAFE;
    if (result.eyeOpenness < THRESHOLDS[AlertState.WARNING] && result.eyeOpenness > THRESHOLDS[AlertState.CRITICAL]) {
      newState = AlertState.WARNING;
    } else if (result.eyeOpenness <= THRESHOLDS[AlertState.WARNING]) { // Below warning threshold effectively includes critical
      // Use the explicit check for critical range or status string
      if (result.status === 'Asleep' || result.eyeOpenness < 30) {
         newState = AlertState.CRITICAL;
      } else {
         newState = AlertState.WARNING;
      }
    }

    setAlertState(newState);

    if (newState === AlertState.CRITICAL) {
      playAlertSound();
    }
  };

  return (
    <div className="min-h-screen bg-cyber-black text-white p-4 font-sans selection:bg-neon-blue selection:text-black">
      {/* Header */}
      <header className="flex justify-between items-center mb-8 border-b border-gray-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-neon-blue to-blue-900 rounded flex items-center justify-center shadow-[0_0_10px_rgba(0,243,255,0.3)]">
            <Shield className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">{APP_NAME}</h1>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-mono">{VERSION}</span>
              <span className="text-xs text-neon-blue bg-neon-blue/10 px-1 rounded border border-neon-blue/30">GEMINI VISION POWERED</span>
            </div>
          </div>
        </div>
        <button 
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={`p-2 rounded hover:bg-gray-800 transition-colors ${soundEnabled ? 'text-neon-blue' : 'text-gray-500'}`}
        >
          {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
        </button>
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Camera */}
        <div className="lg:col-span-2 space-y-6">
          <WebcamView 
            onAnalysisComplete={handleAnalysisComplete}
            isProcessing={isProcessing}
            setIsProcessing={setIsProcessing}
            alertState={alertState}
          />
          
          <AlertBadge 
            state={alertState} 
            eyeOpenness={lastAnalysis?.eyeOpenness ?? 100} 
          />
        </div>

        {/* Right Column: Stats */}
        <div className="space-y-6">
          <StatsPanel data={chartData} />

          {/* Diagnostic Log */}
          <div className="bg-cyber-dark border border-cyber-gray rounded-lg p-4 h-64 overflow-hidden flex flex-col">
            <h3 className="text-gray-400 text-xs font-mono mb-2 uppercase tracking-widest border-b border-gray-800 pb-2">System Log</h3>
            <div className="flex-1 overflow-y-auto font-mono text-xs space-y-1 text-gray-500">
               {chartData.length === 0 && <p className="text-gray-700 italic">Waiting for input stream...</p>}
               {[...chartData].reverse().map((pt, i) => (
                 <div key={i} className="flex justify-between border-b border-gray-900/50 py-1">
                   <span>[{pt.time}] ANALYSIS_COMPLETED</span>
                   <span className={pt.value < 40 ? 'text-neon-red' : 'text-neon-green'}>
                     VAL:{pt.value.toFixed(1)}
                   </span>
                 </div>
               ))}
            </div>
          </div>

          {/* Confidence Indicator */}
          <div className="bg-cyber-dark border border-cyber-gray rounded-lg p-4">
            <h3 className="text-gray-400 text-xs font-mono mb-2 uppercase tracking-widest">Model Confidence</h3>
            <div className="relative pt-1">
              <div className="flex mb-2 items-center justify-between">
                <div>
                  <span className="text-xs font-semibold inline-block text-neon-blue">
                    ACCURACY
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold inline-block text-white">
                    {lastAnalysis ? Math.round(lastAnalysis.confidence) : 0}%
                  </span>
                </div>
              </div>
              <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-800">
                <div style={{ width: `${lastAnalysis ? lastAnalysis.confidence : 0}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-neon-blue transition-all duration-500"></div>
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
};

export default App;