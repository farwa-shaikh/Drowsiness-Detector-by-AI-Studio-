import { AlertState } from './types';

export const APP_NAME = "Sentinel Vision";
export const VERSION = "v1.1.0-beta";

// Thresholds for alert states based on eye openness score (0-100)
export const THRESHOLDS = {
  [AlertState.SAFE]: 70,     // Above 70 is safe
  [AlertState.WARNING]: 40,  // 40-70 is warning
  [AlertState.CRITICAL]: 0,  // Below 40 is critical
};

export const SCAN_INTERVAL_MS = 2000; // API rate limit protection
