
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
    ? 'bg-gray-700 border-gray-600 focus:border-cyan-500 focus:ring-cyan-500' 
    : 'bg-gray-100 border-gray-300 focus:border-cyan-500 focus:ring-cyan-500';
  
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-1 transition-colors ${themeClasses}`}
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
    label: theme === 'dark' ? 'text-gray-400' : 'text-gray-600',
    colon: theme === 'dark' ? 'text-gray-500' : 'text-gray-400',
    presetButton: theme === 'dark' ? 'bg-gray-700 hover:bg-cyan-500/20 hover:text-cyan-300' : 'bg-gray-200 hover:bg-cyan-500/20 hover:text-cyan-500',
    addButton: theme === 'dark' ? 'bg-cyan-600 hover:bg-cyan-500 text-white' : 'bg-cyan-500 hover:bg-cyan-600 text-white',
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className={`block text-sm font-medium mb-2 ${themeClasses.label}`}>Diagonal (inches)</label>
        <CustomInput value={diagonal} onChange={(e) => setDiagonal(e.target.value)} placeholder="e.g. 27" theme={theme} />
        <div className="flex flex-wrap gap-2 mt-2">
          {DIAGONAL_PRESETS.map(d => (
            <button type="button" key={d} onClick={() => setDiagonal(d.toString())} className={`px-2 py-1 text-xs rounded transition-colors ${themeClasses.presetButton}`}>{d}"</button>
          ))}
        </div>
      </div>

      <div>
        <label className={`block text-sm font-medium mb-2 ${themeClasses.label}`}>Aspect Ratio</label>
        <div className="flex items-center gap-2">
          <CustomInput value={aspectW} onChange={(e) => setAspectW(e.target.value)} placeholder="W" theme={theme}/>
          <span className={themeClasses.colon}>:</span>
          <CustomInput value={aspectH} onChange={(e) => setAspectH(e.target.value)} placeholder="H" theme={theme}/>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {ASPECT_RATIO_PRESETS.map(ar => (
            <button type="button" key={ar.name} onClick={() => setAspectRatio(ar.w, ar.h)} className={`px-2 py-1 text-xs rounded transition-colors ${themeClasses.presetButton}`}>{ar.name}</button>
          ))}
        </div>
      </div>

      <div>
        <label className={`block text-sm font-medium mb-2 ${themeClasses.label}`}>Resolution</label>
        <div className="flex items-center gap-2">
          <CustomInput value={resW} onChange={(e) => setResW(e.target.value)} placeholder="Width" theme={theme}/>
          <span className={themeClasses.colon}>x</span>
          <CustomInput value={resH} onChange={(e) => setResH(e.target.value)} placeholder="Height" theme={theme}/>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {RESOLUTION_PRESETS.map(r => (
            <button type="button" key={r.name} onClick={() => setResolution(r.w, r.h)} className={`px-2 py-1 text-xs rounded transition-colors ${themeClasses.presetButton}`}>{r.name}</button>
          ))}
        </div>
      </div>

      <button type="submit" className={`w-full font-bold py-2 px-4 rounded transition-all transform hover:scale-105 ${themeClasses.addButton}`}>
        Add Monitor
      </button>
    </form>
  );
};

export default MonitorForm;
