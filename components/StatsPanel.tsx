import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { ChartDataPoint } from '../types';

interface StatsPanelProps {
  data: ChartDataPoint[];
}

export const StatsPanel: React.FC<StatsPanelProps> = ({ data }) => {
  return (
    <div className="w-full h-64 bg-cyber-dark/50 rounded-lg border border-cyber-gray p-4 backdrop-blur-sm">
      <h3 className="text-neon-blue font-mono text-sm mb-4 flex items-center gap-2">
        <span className="w-2 h-2 bg-neon-blue rounded-full"></span>
        ALERTNESS HISTORY (100 = AWAKE)
      </h3>
      <div className="w-full h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#05ffa1" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#05ffa1" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="time" hide />
            <YAxis domain={[0, 100]} stroke="#666" tick={{fill: '#666', fontSize: 10}} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#111', borderColor: '#333', color: '#fff' }}
              itemStyle={{ color: '#05ffa1' }}
            />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke="#05ffa1" 
              fillOpacity={1} 
              fill="url(#colorValue)" 
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};