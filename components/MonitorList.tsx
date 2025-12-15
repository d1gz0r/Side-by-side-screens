
import React, { useState, useRef, useEffect } from 'react';
import { Monitor } from '../types';
import { DeleteIcon, RotateIcon, EyeOpenIcon, EyeClosedIcon } from './Icons';

type Theme = 'light' | 'dark';

interface MonitorListProps {
  monitors: Monitor[];
  onDelete: (id: string) => void;
  onUpdateMonitor: (id: string, newConfig: Partial<Monitor>) => void;
  onRename: (id: string, newName: string) => void;
  theme: Theme;
}

const MonitorListItem: React.FC<{ monitor: Monitor; onDelete: (id: string) => void; onUpdateMonitor: (id: string, newConfig: Partial<Monitor>) => void; onRename: (id: string, newName: string) => void; theme: Theme; }> = ({ monitor, onDelete, onUpdateMonitor, onRename, theme }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(monitor.name);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleRename = () => {
    setIsEditing(false);
    if (name.trim() && name.trim() !== monitor.name) {
      onRename(monitor.id, name.trim());
    } else {
      setName(monitor.name);
    }
  };

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const themeClasses = {
    bg: theme === 'dark' ? 'bg-gray-700/50 hover:bg-gray-700/80' : 'bg-white hover:bg-gray-50',
    title: theme === 'dark' ? 'text-white' : 'text-gray-900',
    subtitle: theme === 'dark' ? 'text-gray-400' : 'text-gray-500',
    textLabel: theme === 'dark' ? 'text-gray-400' : 'text-gray-500',
    accentText: theme === 'dark' ? 'text-cyan-400' : 'text-cyan-600',
    iconButton: theme === 'dark' ? 'text-gray-400 hover:text-cyan-400 hover:bg-gray-600/50' : 'text-gray-500 hover:text-cyan-600 hover:bg-gray-200/50',
    deleteButton: theme === 'dark' ? 'text-gray-400 hover:text-red-500 hover:bg-gray-600/50' : 'text-gray-500 hover:text-red-500 hover:bg-gray-200/50',
    inputBg: theme === 'dark' ? 'bg-gray-600 text-white' : 'bg-gray-200 text-black',
  };

  return (
    <div className={`rounded-lg p-3 transition-colors ${themeClasses.bg}`} style={{ borderLeft: `4px solid ${monitor.color}` }}>
      <div className="flex justify-between items-start">
        <div className="flex-grow min-w-0 pr-2">
          {isEditing ? (
            <input
              ref={inputRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={handleRename}
              onKeyDown={(e) => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') setIsEditing(false); }}
              className={`font-bold rounded px-1 -mx-1 w-full ${themeClasses.inputBg}`}
            />
          ) : (
            <h3 className={`font-bold cursor-pointer truncate ${themeClasses.title}`} title={`Click to rename ${monitor.name}`} onClick={() => setIsEditing(true)}>
              {monitor.name}
            </h3>
          )}
          <p className={`text-sm ${themeClasses.subtitle}`}>{monitor.diagonal}" | {monitor.aspectRatio.w}:{monitor.aspectRatio.h} | {monitor.resolution.w}x{monitor.resolution.h}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={() => onUpdateMonitor(monitor.id, { isPortrait: !monitor.isPortrait })} title="Rotate" className={`p-1.5 rounded transition-colors ${themeClasses.iconButton}`}><RotateIcon /></button>
          <button onClick={() => onUpdateMonitor(monitor.id, { isVisible: !monitor.isVisible })} title={monitor.isVisible ? 'Hide' : 'Show'} className={`p-1.5 rounded transition-colors ${themeClasses.iconButton}`}>
            {monitor.isVisible ? <EyeOpenIcon /> : <EyeClosedIcon />}
          </button>
          <button onClick={() => onDelete(monitor.id)} title="Delete" className={`p-1.5 rounded transition-colors ${themeClasses.deleteButton}`}><DeleteIcon /></button>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <div className={themeClasses.textLabel}>PPI:</div>
        <div className={`font-mono text-right ${themeClasses.accentText}`}>{monitor.ppi.toFixed(2)}</div>
        
        <div className={themeClasses.textLabel}>Width:</div>
        <div className="font-mono text-right">{monitor.widthInches.toFixed(2)}" / {(monitor.widthInches * 2.54).toFixed(2)}cm</div>

        <div className={themeClasses.textLabel}>Height:</div>
        <div className="font-mono text-right">{monitor.heightInches.toFixed(2)}" / {(monitor.heightInches * 2.54).toFixed(2)}cm</div>
      </div>
    </div>
  );
};


const MonitorList: React.FC<MonitorListProps> = ({ monitors, onDelete, onUpdateMonitor, onRename, theme }) => {
  if (monitors.length === 0) {
    const textColor = theme === 'dark' ? 'text-gray-500' : 'text-gray-400';
    return <p className={`text-center italic mt-4 ${textColor}`}>Add a monitor to start comparing.</p>;
  }

  return (
    <div className="space-y-3 overflow-y-auto pr-1 flex-grow">
      {monitors.map(monitor => (
        <MonitorListItem 
          key={monitor.id}
          monitor={monitor}
          onDelete={onDelete}
          onUpdateMonitor={onUpdateMonitor}
          onRename={onRename}
          theme={theme}
        />
      ))}
    </div>
  );
};

export default MonitorList;
