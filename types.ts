export enum AlertState {
  SAFE = 'SAFE',
  WARNING = 'WARNING',
  CRITICAL = 'CRITICAL',
}

export interface AnalysisResult {
  status: 'Alert' | 'Drowsy' | 'Asleep';
  confidence: number;
  eyeOpenness: number;
  timestamp: number;
}

export interface DetectionStats {
  totalScans: number;
  drowsyEvents: number;
  averageConfidence: number;
}

export interface ChartDataPoint {
  time: string;
  value: number;
}