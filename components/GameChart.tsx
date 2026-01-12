
import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { GameDataPoint } from '../types';

interface GameChartProps {
  data: GameDataPoint[];
  p1Name: string;
  p2Name: string;
}

const GameChart: React.FC<GameChartProps> = ({ data, p1Name, p2Name }) => {
  return (
    <div className="w-full h-[400px] bg-black/60 p-6 rounded-3xl border border-yellow-600/20 shadow-[0_0_40px_rgba(0,0,0,0.8)] relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500/30 to-transparent"></div>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
          <defs>
            <linearGradient id="colorP1" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorP2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
          <XAxis 
            dataKey="turn" 
            stroke="#525252" 
            tick={{ fill: '#737373', fontSize: 10 }}
            axisLine={{ stroke: '#404040' }}
          />
          <YAxis 
            stroke="#525252" 
            tick={{ fill: '#737373', fontSize: 10 }}
            axisLine={{ stroke: '#404040' }}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #404040', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}
            itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
          />
          <Legend verticalAlign="top" height={36} iconType="circle" />
          <Area 
            type="monotone" 
            dataKey="player1Value" 
            name={p1Name} 
            stroke="#3b82f6" 
            strokeWidth={4} 
            fillOpacity={1} 
            fill="url(#colorP1)"
            dot={false}
            isAnimationActive={false}
          />
          <Area 
            type="monotone" 
            dataKey="player2Value" 
            name={p2Name} 
            stroke="#ef4444" 
            strokeWidth={4} 
            fillOpacity={1} 
            fill="url(#colorP2)"
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default GameChart;
