
import React, { useState, useRef, useEffect } from 'react';
import { Monitor } from '../types';
import { DeleteIcon, RotateIcon, EyeOpenIcon, EyeClosedIcon } from './Icons';

interface MonitorListProps {
  monitors: Monitor[];
  onDelete: (id: string) => void;
  onUpdateMonitor: (id: string, newConfig: Partial<Monitor>) => void;
  onRename: (id: string, newName: string) => void;
}

const MonitorListItem: React.FC<{ monitor: Monitor; onDelete: (id: string) => void; onUpdateMonitor: (id: string, newConfig: Partial<Monitor>) => void; onRename: (id: string, newName: string) => void; }> = ({ monitor, onDelete, onUpdateMonitor, onRename }) => {
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

  return (
    <div className="bg-gray-700/50 rounded-lg p-3 transition-colors hover:bg-gray-700/80" style={{ borderLeft: `4px solid ${monitor.color}` }}>
      <div className="flex justify-between items-start">
        <div className="flex-grow min-w-0 pr-2">
          {isEditing ? (
            <input
              ref={inputRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={handleRename}
              onKeyDown={(e) => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') setIsEditing(false); }}
              className="bg-gray-600 text-white font-bold rounded px-1 -mx-1 w-full"
            />
          ) : (
            <h3 className="font-bold text-white cursor-pointer truncate" title={`Click to rename ${monitor.name}`} onClick={() => setIsEditing(true)}>
              {monitor.name}
            </h3>
          )}
          <p className="text-sm text-gray-400">{monitor.diagonal}" | {monitor.aspectRatio.w}:{monitor.aspectRatio.h} | {monitor.resolution.w}x{monitor.resolution.h}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={() => onUpdateMonitor(monitor.id, { isPortrait: !monitor.isPortrait })} title="Rotate" className="p-1.5 text-gray-400 hover:text-cyan-400 hover:bg-gray-600/50 rounded transition-colors"><RotateIcon /></button>
          <button onClick={() => onUpdateMonitor(monitor.id, { isVisible: !monitor.isVisible })} title={monitor.isVisible ? 'Hide' : 'Show'} className="p-1.5 text-gray-400 hover:text-cyan-400 hover:bg-gray-600/50 rounded transition-colors">
            {monitor.isVisible ? <EyeOpenIcon /> : <EyeClosedIcon />}
          </button>
          <button onClick={() => onDelete(monitor.id)} title="Delete" className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-gray-600/50 rounded transition-colors"><DeleteIcon /></button>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <div className="text-gray-400">PPI:</div>
        <div className="text-cyan-400 font-mono text-right">{monitor.ppi.toFixed(2)}</div>
        
        <div className="text-gray-400">Width:</div>
        <div className="font-mono text-right">{monitor.widthInches.toFixed(2)}" / {(monitor.widthInches * 2.54).toFixed(2)}cm</div>

        <div className="text-gray-400">Height:</div>
        <div className="font-mono text-right">{monitor.heightInches.toFixed(2)}" / {(monitor.heightInches * 2.54).toFixed(2)}cm</div>
      </div>
    </div>
  );
};


const MonitorList: React.FC<MonitorListProps> = ({ monitors, onDelete, onUpdateMonitor, onRename }) => {
  if (monitors.length === 0) {
    return <p className="text-center text-gray-500 italic mt-4">Add a monitor to start comparing.</p>;
  }

  return (
    <div className="space-y-3 max-h-[calc(100vh-300px)] lg:max-h-full overflow-y-auto pr-1">
      {monitors.map(monitor => (
        <MonitorListItem 
          key={monitor.id}
          monitor={monitor}
          onDelete={onDelete}
          onUpdateMonitor={onUpdateMonitor}
          onRename={onRename}
        />
      ))}
    </div>
  );
};

export default MonitorList;
