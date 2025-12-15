
import React, { useState } from 'react';
import { Monitor } from '../types';
import { DIAGONAL_PRESETS, ASPECT_RATIO_PRESETS, RESOLUTION_PRESETS } from '../constants';

type Theme = 'light' | 'dark';

interface MonitorFormProps {
  onAddMonitor: (monitor: Omit<Monitor, 'id' | 'name' | 'ppi' | 'widthInches' | 'heightInches' | 'isVisible' | 'isPortrait' | 'position' | 'zIndex' | 'color'>) => void;
  theme: Theme;
}

const CustomInput: React.FC<{ value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; placeholder: string; theme: Theme; type?: string }> = ({ value, onChange, placeholder, theme, type = 'number' }) => {
  const themeClasses = theme === 'dark' 
    ? 'bg-gray-900/50 border-gray-700 placeholder-gray-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30' 
    : 'bg-slate-50 border-slate-300 placeholder-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30';
  
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={`w-full border rounded-md px-3 py-1.5 focus:outline-none transition-all text-sm ${themeClasses}`}
    />
  );
};

const MonitorForm: React.FC<MonitorFormProps> = ({ onAddMonitor, theme }) => {
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

  const themeClasses = {
    label: theme === 'dark' ? 'text-gray-400' : 'text-slate-600',
    colon: theme === 'dark' ? 'text-gray-600' : 'text-slate-400',
    presetButton: theme === 'dark' ? 'bg-white/5 border border-white/10 text-gray-400 hover:border-cyan-500/50 hover:text-cyan-400' : 'bg-slate-100 border border-slate-200 text-slate-600 hover:border-cyan-500 hover:text-cyan-500',
    addButton: theme === 'dark' 
      ? 'bg-cyan-400 text-gray-900 shadow-lg shadow-cyan-400/10 hover:bg-cyan-300 hover:shadow-cyan-300/20' 
      : 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20 hover:bg-cyan-600 hover:shadow-cyan-600/30',
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className={`block text-xs font-medium mb-1.5 ${themeClasses.label}`}>Diagonal (inches)</label>
        <CustomInput value={diagonal} onChange={(e) => setDiagonal(e.target.value)} placeholder="e.g. 27" theme={theme} />
        <div className="flex flex-wrap gap-2 mt-2">
          {DIAGONAL_PRESETS.map(d => (
            <button type="button" key={d} onClick={() => setDiagonal(d.toString())} className={`px-2 py-1 text-xs rounded-sm transition-all ${themeClasses.presetButton}`}>{d}"</button>
          ))}
        </div>
      </div>

      <div>
        <label className={`block text-xs font-medium mb-1.5 ${themeClasses.label}`}>Aspect Ratio</label>
        <div className="flex items-center gap-2">
          <CustomInput value={aspectW} onChange={(e) => setAspectW(e.target.value)} placeholder="W" theme={theme}/>
          <span className={`font-mono ${themeClasses.colon}`}>:</span>
          <CustomInput value={aspectH} onChange={(e) => setAspectH(e.target.value)} placeholder="H" theme={theme}/>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {ASPECT_RATIO_PRESETS.map(ar => (
            <button type="button" key={ar.name} onClick={() => setAspectRatio(ar.w, ar.h)} className={`px-2 py-1 text-xs rounded-sm font-mono transition-all ${themeClasses.presetButton}`}>{ar.name}</button>
          ))}
        </div>
      </div>

      <div>
        <label className={`block text-xs font-medium mb-1.5 ${themeClasses.label}`}>Resolution</label>
        <div className="flex items-center gap-2">
          <CustomInput value={resW} onChange={(e) => setResW(e.target.value)} placeholder="Width" theme={theme}/>
          <span className={`font-mono ${themeClasses.colon}`}>x</span>
          <CustomInput value={resH} onChange={(e) => setResH(e.target.value)} placeholder="Height" theme={theme}/>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {RESOLUTION_PRESETS.map(r => (
            <button type="button" key={r.name} onClick={() => setResolution(r.w, r.h)} className={`px-2 py-1 text-xs rounded-sm transition-all ${themeClasses.presetButton}`}>{r.name}</button>
          ))}
        </div>
      </div>

      <button type="submit" className={`w-full font-bold py-2.5 px-4 rounded-md transition-all transform hover:scale-[1.02] ${themeClasses.addButton}`}>
        Add Monitor
      </button>
    </form>
  );
};

export default MonitorForm;
