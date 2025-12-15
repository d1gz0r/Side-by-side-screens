
import React, { useState, useCallback } from 'react';
import { Monitor } from './types';
import { MONITOR_COLORS } from './constants';
import MonitorForm from './components/MonitorForm';
import MonitorList from './components/MonitorList';
import Preview from './components/Preview';
import { KeyboardIcon } from './components/Icons';

const App: React.FC = () => {
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [nextId, setNextId] = useState(1);
  const [keyboardSize, setKeyboardSize] = useState<'hidden' | '100%' | '75%'>('hidden');
  const [nextZIndex, setNextZIndex] = useState(1);
  const [keyboardPosition, setKeyboardPosition] = useState({ x: 20, y: 350 });

  const addMonitor = useCallback((newMonitorData: Omit<Monitor, 'id' | 'name' | 'ppi' | 'widthInches' | 'heightInches' | 'isVisible' | 'isPortrait' | 'position' | 'zIndex' | 'color'>) => {
    const { diagonal, aspectRatio, resolution } = newMonitorData;

    const diagonalPixels = Math.sqrt(resolution.w ** 2 + resolution.h ** 2);
    const ppi = diagonalPixels / diagonal;

    const ratio = Math.sqrt(aspectRatio.w ** 2 + aspectRatio.h ** 2);
    const widthInches = (diagonal * aspectRatio.w) / ratio;
    const heightInches = (diagonal * aspectRatio.h) / ratio;
    
    const usedColors = monitors.map(m => m.color);
    const availableColors = MONITOR_COLORS.filter(c => !usedColors.includes(c));
    const color = availableColors.length > 0 ? availableColors[0] : MONITOR_COLORS[monitors.length % MONITOR_COLORS.length];

    const newMonitor: Monitor = {
      ...newMonitorData,
      id: `monitor-${nextId}`,
      name: `Monitor ${nextId}`,
      ppi,
      widthInches,
      heightInches,
      isVisible: true,
      isPortrait: false,
      position: { x: 20, y: 20 + (monitors.length * 30) % 200 },
      zIndex: nextZIndex,
      color,
    };
    
    setMonitors(prev => [...prev, newMonitor]);
    setNextId(prev => prev + 1);
    setNextZIndex(prev => prev + 1);
  }, [nextId, nextZIndex, monitors]);

  const deleteMonitor = useCallback((id: string) => {
    setMonitors(prev => prev.filter(m => m.id !== id));
  }, []);

  const renameMonitor = useCallback((id: string, newName: string) => {
    setMonitors(prev => prev.map(m => m.id === id ? { ...m, name: newName } : m));
  }, []);
  
  const updateMonitorConfig = useCallback((id: string, newConfig: Partial<Monitor>) => {
    setMonitors(prev => prev.map(m => m.id === id ? { ...m, ...newConfig } : m));
    if (newConfig.zIndex) {
      setNextZIndex(prev => prev + 1);
    }
  }, []);
  
  const updateKeyboardPosition = useCallback((position: { x: number, y: number }) => {
    setKeyboardPosition(position);
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans p-4 lg:p-6 flex flex-col lg:flex-row gap-4 lg:gap-6">
      <aside className="lg:w-96 xl:w-[420px] flex-shrink-0 flex flex-col gap-4">
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-4">
          <h1 className="text-2xl font-bold text-cyan-400 mb-4">Monitor Comparator</h1>
          <MonitorForm onAddMonitor={addMonitor} />
        </div>
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-4 flex-grow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-cyan-400">Comparison List</h2>
            <div className="flex items-center gap-1 p-0.5 bg-gray-900/50 rounded-md border border-gray-700">
              <span className="text-sm text-gray-400 px-2 flex items-center gap-1.5" title="Keyboard for scale"><KeyboardIcon/></span>
              <button
                  onClick={() => setKeyboardSize('hidden')}
                  className={`px-2 py-0.5 rounded text-xs transition-colors ${keyboardSize === 'hidden' ? 'bg-cyan-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`}
              >
                  Off
              </button>
              <button
                  onClick={() => setKeyboardSize('75%')}
                  className={`px-2 py-0.5 rounded text-xs transition-colors ${keyboardSize === '75%' ? 'bg-cyan-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`}
              >
                  75%
              </button>
              <button
                  onClick={() => setKeyboardSize('100%')}
                  className={`px-2 py-0.5 rounded text-xs transition-colors ${keyboardSize === '100%' ? 'bg-cyan-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`}
              >
                  100%
              </button>
            </div>
          </div>
          <MonitorList 
            monitors={monitors}
            onDelete={deleteMonitor}
            onUpdateMonitor={updateMonitorConfig}
            onRename={renameMonitor}
          />
        </div>
      </aside>
      <main className="flex-grow bg-gray-800/20 rounded-lg overflow-hidden relative border border-gray-700 min-h-[50vh] lg:min-h-0">
        <Preview 
          monitors={monitors} 
          keyboardSize={keyboardSize}
          onUpdateMonitor={updateMonitorConfig}
          nextZIndex={nextZIndex}
          keyboardPosition={keyboardPosition}
          onUpdateKeyboardPosition={updateKeyboardPosition}
        />
      </main>
    </div>
  );
};

export default App;
