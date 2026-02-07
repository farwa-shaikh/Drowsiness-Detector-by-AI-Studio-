import React from 'react';
import { AlertTriangle, CheckCircle, EyeOff } from 'lucide-react';
import { AlertState } from '../types';

interface AlertBadgeProps {
  state: AlertState;
  eyeOpenness: number;
}

export const AlertBadge: React.FC<AlertBadgeProps> = ({ state, eyeOpenness }) => {
  let colorClass = "";
  let Icon = CheckCircle;
  let text = "";

  switch (state) {
    case AlertState.SAFE:
      colorClass = "text-neon-green border-neon-green bg-neon-green/10";
      Icon = CheckCircle;
      text = "OPERATOR ALERT";
      break;
    case AlertState.WARNING:
      colorClass = "text-neon-yellow border-neon-yellow bg-neon-yellow/10";
      Icon = AlertTriangle;
      text = "SIGNS OF DROWSINESS";
      break;
    case AlertState.CRITICAL:
      colorClass = "text-neon-red border-neon-red bg-neon-red/20 animate-pulse-fast";
      Icon = EyeOff;
      text = "CRITICAL: WAKE UP";
      break;
  }

  return (
    <div className={`flex items-center gap-3 px-6 py-4 rounded-lg border-2 ${colorClass} transition-all duration-300`}>
      <Icon size={32} />
      <div className="flex flex-col">
        <span className="text-sm font-bold opacity-80 tracking-wider">STATUS</span>
        <span className="text-xl font-black tracking-widest">{text}</span>
      </div>
      <div className="ml-auto text-2xl font-mono font-bold">
        {Math.round(eyeOpenness)}%
      </div>
    </div>
  );
};