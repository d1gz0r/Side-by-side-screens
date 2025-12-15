
import React, { useState, useCallback, useEffect } from 'react';
import { Monitor } from './types';
import { MONITOR_COLORS } from './constants';
import MonitorForm from './components/MonitorForm';
import MonitorList from './components/MonitorList';
import Preview from './components/Preview';
import { KeyboardIcon, MenuIcon, CloseIcon, ChevronLeftIcon, ChevronRightIcon } from './components/Icons';

const App: React.FC = () => {
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [nextId, setNextId] = useState(1);
  const [keyboardSize, setKeyboardSize] = useState<'hidden' | '100%' | '75%'>('hidden');
  const [keyboardPosition, setKeyboardPosition] = useState({ x: 20, y: 350 });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarVisibleDesktop, setIsSidebarVisibleDesktop] = useState(true);

  useEffect(() => {
    // Automatically manage z-index based on monitor size.
    // Smaller monitors should have a higher z-index to appear on top.
    if (monitors.length === 0) return;

    const monitorsWithArea = monitors.map(m => ({
        ...m,
        area: m.widthInches * m.heightInches,
        idNum: parseInt(m.id.split('-')[1])
    }));
    
    monitorsWithArea.sort((a, b) => {
        if (a.area !== b.area) {
            return b.area - a.area;
        }
        return a.idNum - b.idNum;
    });

    const zIndexMap = new Map<string, number>();
    monitorsWithArea.forEach((m, index) => {
        zIndexMap.set(m.id, index + 1);
    });

    let needsUpdate = false;
    for (const monitor of monitors) {
        if (monitor.zIndex !== zIndexMap.get(monitor.id)) {
            needsUpdate = true;
            break;
        }
    }

    if (needsUpdate) {
        setMonitors(prevMonitors => 
            prevMonitors.map(m => ({
                ...m,
                zIndex: zIndexMap.get(m.id) || 1
            }))
        );
    }
  }, [monitors]);

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
      zIndex: 0,
      color,
    };
    
    setMonitors(prev => [...prev, newMonitor]);
    setNextId(prev => prev + 1);
  }, [nextId, monitors]);

  const deleteMonitor = useCallback((id: string) => {
    setMonitors(prev => prev.filter(m => m.id !== id));
  }, []);

  const renameMonitor = useCallback((id: string, newName: string) => {
    setMonitors(prev => prev.map(m => m.id === id ? { ...m, name: newName } : m));
  }, []);
  
  const updateMonitorConfig = useCallback((id: string, newConfig: Partial<Monitor>) => {
    setMonitors(prev => prev.map(m => m.id === id ? { ...m, ...newConfig } : m));
  }, []);
  
  const updateKeyboardPosition = useCallback((position: { x: number, y: number }) => {
    setKeyboardPosition(position);
  }, []);

  return (
    <div className={`h-screen bg-gray-900 text-gray-200 font-sans p-4 lg:p-6 flex flex-col lg:flex-row transition-[gap] duration-300 ${isSidebarVisibleDesktop ? 'lg:gap-6' : 'lg:gap-0'}`}>
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}
      <aside className={`fixed top-0 left-0 w-full max-w-sm h-full bg-gray-900 p-4 flex-shrink-0 flex-col gap-4 z-40 transition-all duration-300 ease-in-out lg:relative lg:flex lg:max-w-none lg:p-0 lg:bg-transparent lg:translate-x-0 overflow-hidden ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} ${isSidebarVisibleDesktop ? 'lg:w-96 xl:w-[420px]' : 'lg:w-0 lg:p-0'}`}>
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-cyan-400">Monitor Comparator</h1>
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-white">
              <CloseIcon />
            </button>
          </div>
          <MonitorForm onAddMonitor={addMonitor} />
        </div>
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-4 flex-grow flex flex-col min-h-0">
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
      <main className="flex-grow bg-gray-800/20 rounded-lg relative border border-gray-700 lg:min-w-0">
        <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden absolute top-4 left-4 z-20 p-2 bg-gray-800/70 backdrop-blur-sm rounded-md border border-gray-700 text-gray-300 hover:text-cyan-400">
          <MenuIcon />
        </button>
        <button
          onClick={() => setIsSidebarVisibleDesktop(v => !v)}
          title={isSidebarVisibleDesktop ? 'Collapse Sidebar' : 'Expand Sidebar'}
          className="hidden lg:flex items-center justify-center absolute top-1/2 -translate-y-1/2 left-0 -translate-x-1/2 z-20 w-8 h-8 bg-gray-700 rounded-full text-white hover:bg-cyan-600 transition-all border-2 border-gray-900"
        >
          {isSidebarVisibleDesktop ? <ChevronLeftIcon /> : <ChevronRightIcon />}
        </button>
        <Preview 
          monitors={monitors} 
          keyboardSize={keyboardSize}
          onUpdateMonitor={updateMonitorConfig}
          keyboardPosition={keyboardPosition}
          onUpdateKeyboardPosition={updateKeyboardPosition}
        />
      </main>
    </div>
  );
};

export default App;
