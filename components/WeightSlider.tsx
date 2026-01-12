
import React from 'react';

interface WeightSliderProps {
  label: string;
  value: number;
  onChange: (val: number) => void;
  color: string;
  disabled?: boolean;
}

const WeightSlider: React.FC<WeightSliderProps> = ({ label, value, onChange, color, disabled }) => {
  return (
    <div className="flex flex-col gap-2 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-slate-400">{label}</span>
        <span className="text-lg font-bold font-mono" style={{ color }}>{value.toFixed(2)}</span>
      </div>
      <input
        type="range"
        min="1"
        max="2"
        step="0.01"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        disabled={disabled}
        className={`w-full h-2 rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
        style={{
            accentColor: color,
            background: `linear-gradient(to right, ${color} ${((value - 1) * 100)}%, #334155 ${((value - 1) * 100)}%)`
        }}
      />
      <div className="flex justify-between text-[10px] text-slate-500 font-mono">
        <span>1.00</span>
        <span>2.00</span>
      </div>
    </div>
  );
};

export default WeightSlider;
