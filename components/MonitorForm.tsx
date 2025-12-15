
import React, { useState } from 'react';
import { Monitor } from '../types';
import { DIAGONAL_PRESETS, ASPECT_RATIO_PRESETS, RESOLUTION_PRESETS } from '../constants';

interface MonitorFormProps {
  onAddMonitor: (monitor: Omit<Monitor, 'id' | 'name' | 'ppi' | 'widthInches' | 'heightInches' | 'isVisible' | 'isPortrait' | 'position' | 'zIndex' | 'color'>) => void;
}

const CustomInput: React.FC<{ value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; placeholder: string; type?: string }> = ({ value, onChange, placeholder, type = 'number' }) => (
  <input
    type={type}
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
  />
);

const MonitorForm: React.FC<MonitorFormProps> = ({ onAddMonitor }) => {
  const [diagonal, setDiagonal] = useState('27');
  const [aspectW, setAspectW] = useState('16');
  const [aspectH, setAspectH] = useState('9');
  const [resW, setResW] = useState('2560');
  const [resH, setResH] = useState('1440');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newMonitor = {
      diagonal: parseFloat(diagonal),
      aspectRatio: { w: parseInt(aspectW), h: parseInt(aspectH) },
      resolution: { w: parseInt(resW), h: parseInt(resH) },
    };
    if (newMonitor.diagonal > 0 && newMonitor.aspectRatio.w > 0 && newMonitor.aspectRatio.h > 0 && newMonitor.resolution.w > 0 && newMonitor.resolution.h > 0) {
      onAddMonitor(newMonitor);
    }
  };

  const setAspectRatio = (w: number, h: number) => {
    setAspectW(w.toString());
    setAspectH(h.toString());
  };

  const setResolution = (w: number, h: number) => {
    setResW(w.toString());
    setResH(h.toString());
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">Diagonal (inches)</label>
        <CustomInput value={diagonal} onChange={(e) => setDiagonal(e.target.value)} placeholder="e.g. 27" />
        <div className="flex flex-wrap gap-2 mt-2">
          {DIAGONAL_PRESETS.map(d => (
            <button type="button" key={d} onClick={() => setDiagonal(d.toString())} className="px-2 py-1 text-xs bg-gray-700 hover:bg-cyan-500/20 hover:text-cyan-300 rounded transition-colors">{d}"</button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">Aspect Ratio</label>
        <div className="flex items-center gap-2">
          <CustomInput value={aspectW} onChange={(e) => setAspectW(e.target.value)} placeholder="W" />
          <span className="text-gray-500">:</span>
          <CustomInput value={aspectH} onChange={(e) => setAspectH(e.target.value)} placeholder="H" />
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {ASPECT_RATIO_PRESETS.map(ar => (
            <button type="button" key={ar.name} onClick={() => setAspectRatio(ar.w, ar.h)} className="px-2 py-1 text-xs bg-gray-700 hover:bg-cyan-500/20 hover:text-cyan-300 rounded transition-colors">{ar.name}</button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">Resolution</label>
        <div className="flex items-center gap-2">
          <CustomInput value={resW} onChange={(e) => setResW(e.target.value)} placeholder="Width" />
          <span className="text-gray-500">x</span>
          <CustomInput value={resH} onChange={(e) => setResH(e.target.value)} placeholder="Height" />
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {RESOLUTION_PRESETS.map(r => (
            <button type="button" key={r.name} onClick={() => setResolution(r.w, r.h)} className="px-2 py-1 text-xs bg-gray-700 hover:bg-cyan-500/20 hover:text-cyan-300 rounded transition-colors">{r.name}</button>
          ))}
        </div>
      </div>

      <button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded transition-all transform hover:scale-105">
        Add Monitor
      </button>
    </form>
  );
};

export default MonitorForm;
