
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Monitor } from './types';
import { MONITOR_COLORS } from './constants';
import MonitorForm from './components/MonitorForm';
import MonitorList from './components/MonitorList';
import Preview from './components/Preview';
import { KeyboardIcon, MenuIcon, CloseIcon, ChevronLeftIcon, ChevronRightIcon, SunIcon, MoonIcon, ChevronDownIcon } from './components/Icons';

type Theme = 'light' | 'dark';

const ThemeSwitcher: React.FC<{ theme: Theme; setTheme: (theme: Theme) => void }> = ({ theme, setTheme }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const buttonClasses = theme === 'dark'
    ? 'bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300'
    : 'bg-white border-gray-300 hover:bg-gray-50 text-gray-700';
  
  const menuClasses = theme === 'dark'
    ? 'bg-gray-800 border-gray-700'
    : 'bg-white border-gray-300';

  const menuItemClasses = theme === 'dark'
    ? 'hover:bg-gray-700'
    : 'hover:bg-gray-100';

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 border rounded-md text-sm transition-colors ${buttonClasses}`}
      >
        {theme === 'dark' ? <MoonIcon /> : <SunIcon />}
        <span className="capitalize">{theme}</span>
        <ChevronDownIcon />
      </button>
      {isOpen && (
        <div className={`absolute top-full right-0 mt-1 w-32 border rounded-md shadow-lg z-50 ${menuClasses}`}>
          <button 
            onClick={() => { setTheme('light'); setIsOpen(false); }}
            className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 ${menuItemClasses} ${theme === 'light' ? 'text-cyan-500' : ''}`}
          >
            <SunIcon /> Light
          </button>
          <button 
            onClick={() => { setTheme('dark'); setIsOpen(false); }}
            className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 ${menuItemClasses} ${theme === 'dark' ? 'text-cyan-400' : ''}`}
          >
            <MoonIcon /> Dark
          </button>
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => {
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [nextId, setNextId] = useState(1);
  const [keyboardSize, setKeyboardSize] = useState<'hidden' | '100%' | '75%'>('hidden');
  const [keyboardPosition, setKeyboardPosition] = useState({ x: 20, y: 350 });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarVisibleDesktop, setIsSidebarVisibleDesktop] = useState(true);
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme) {
      return savedTheme;
    }
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    if (monitors.length === 0) return;

    const monitorsWithArea = monitors.map(m => ({
        ...m,
        area: m.widthInches * m.heightInches,
        idNum: parseInt(m.id.split('-')[1])
    }));
    
    monitorsWithArea.sort((a, b) => {
        if (a.area !== b.area) return b.area - a.area;
        return a.idNum - b.idNum;
    });

    const zIndexMap = new Map<string, number>();
    monitorsWithArea.forEach((m, index) => zIndexMap.set(m.id, index + 1));

    if (monitors.some(m => m.zIndex !== zIndexMap.get(m.id))) {
        setMonitors(prev => prev.map(m => ({ ...m, zIndex: zIndexMap.get(m.id) || 1 })));
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
      ppi, widthInches, heightInches,
      isVisible: true, isPortrait: false,
      position: { x: 20, y: 20 + (monitors.length * 30) % 200 },
      zIndex: 0, color,
    };
    
    setMonitors(prev => [...prev, newMonitor]);
    setNextId(prev => prev + 1);
  }, [nextId, monitors]);

  const deleteMonitor = useCallback((id: string) => setMonitors(prev => prev.filter(m => m.id !== id)), []);
  const renameMonitor = useCallback((id: string, newName: string) => setMonitors(prev => prev.map(m => m.id === id ? { ...m, name: newName } : m)), []);
  const updateMonitorConfig = useCallback((id: string, newConfig: Partial<Monitor>) => setMonitors(prev => prev.map(m => m.id === id ? { ...m, ...newConfig } : m)), []);
  const updateKeyboardPosition = useCallback((position: { x: number, y: number }) => setKeyboardPosition(position), []);

  const themeClasses = {
    bg: theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100',
    text: theme === 'dark' ? 'text-gray-200' : 'text-gray-800',
    headerText: theme === 'dark' ? 'text-white' : 'text-black',
    subHeaderText: theme === 'dark' ? 'text-gray-400' : 'text-gray-600',
    sidebarBg: theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100',
    cardBg: theme === 'dark' ? 'bg-gray-800/50' : 'bg-white/80',
    border: theme === 'dark' ? 'border-gray-700' : 'border-gray-300',
    accentText: theme === 'dark' ? 'text-cyan-400' : 'text-cyan-600',
    icon: theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-black',
    kbdButtonBg: theme === 'dark' ? 'bg-gray-900/50' : 'bg-gray-200/50',
    kbdButton: theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-300 hover:bg-gray-400 text-gray-700',
    kbdButtonActive: theme === 'dark' ? 'bg-cyan-600 text-white' : 'bg-cyan-500 text-white',
    sidebarToggleBg: theme === 'dark' ? 'bg-gray-700 border-gray-900' : 'bg-white border-gray-100',
  };

  return (
    <div className={`h-screen font-sans p-4 lg:p-6 flex flex-col ${themeClasses.bg} ${themeClasses.text}`}>
      <header className="flex justify-between items-baseline gap-3 flex-shrink-0 mb-4">
        <div className="flex items-baseline gap-3">
          <h1 className={`text-xl font-bold whitespace-nowrap ${themeClasses.headerText}`}>Side-by-side screens</h1>
          <p className={`text-sm truncate ${themeClasses.subHeaderText}`}>A simple monitor comparison tool</p>
        </div>
        <ThemeSwitcher theme={theme} setTheme={setTheme} />
      </header>
      <div className={`flex-grow flex flex-col lg:flex-row transition-[gap] duration-300 min-h-0 ${isSidebarVisibleDesktop ? 'lg:gap-6' : 'lg:gap-0'}`}>
        {isSidebarOpen && (
          <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={() => setIsSidebarOpen(false)}></div>
        )}
        <aside className={`fixed top-0 left-0 w-full max-w-sm h-full p-4 flex-shrink-0 flex-col gap-4 z-40 transition-all duration-300 ease-in-out lg:relative lg:flex lg:max-w-none lg:p-0 bg-transparent lg:translate-x-0 overflow-hidden ${isSidebarOpen ? `translate-x-0 ${themeClasses.sidebarBg}` : '-translate-x-full'} ${isSidebarVisibleDesktop ? 'lg:w-96 xl:w-[420px]' : 'lg:w-0 lg:p-0'}`}>
          <div className={`backdrop-blur-sm border rounded-lg p-4 ${themeClasses.cardBg} ${themeClasses.border}`}>
            <div className="flex justify-between items-center mb-4">
              <h1 className={`text-2xl font-bold ${themeClasses.accentText}`}>Monitor specs</h1>
              <button onClick={() => setIsSidebarOpen(false)} className={`lg:hidden ${themeClasses.icon}`}>
                <CloseIcon />
              </button>
            </div>
            <MonitorForm onAddMonitor={addMonitor} theme={theme} />
          </div>
          <div className={`backdrop-blur-sm border rounded-lg p-4 flex-grow flex flex-col min-h-0 ${themeClasses.cardBg} ${themeClasses.border}`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className={`text-xl font-bold ${themeClasses.accentText}`}>Monitor list</h2>
              <div className={`flex items-center gap-1 p-0.5 rounded-md border ${themeClasses.kbdButtonBg} ${themeClasses.border}`}>
                <span className={`text-sm px-2 flex items-center gap-1.5 ${themeClasses.subHeaderText}`} title="Keyboard for scale"><KeyboardIcon/></span>
                <button onClick={() => setKeyboardSize('hidden')} className={`px-2 py-0.5 rounded text-xs transition-colors ${keyboardSize === 'hidden' ? themeClasses.kbdButtonActive : themeClasses.kbdButton}`}>Off</button>
                <button onClick={() => setKeyboardSize('75%')} className={`px-2 py-0.5 rounded text-xs transition-colors ${keyboardSize === '75%' ? themeClasses.kbdButtonActive : themeClasses.kbdButton}`}>75%</button>
                <button onClick={() => setKeyboardSize('100%')} className={`px-2 py-0.5 rounded text-xs transition-colors ${keyboardSize === '100%' ? themeClasses.kbdButtonActive : themeClasses.kbdButton}`}>100%</button>
              </div>
            </div>
            <MonitorList monitors={monitors} onDelete={deleteMonitor} onUpdateMonitor={updateMonitorConfig} onRename={renameMonitor} theme={theme} />
          </div>
        </aside>
        <main className={`flex-grow bg-gray-800/20 rounded-lg relative border lg:min-w-0 ${themeClasses.border}`}>
          <button onClick={() => setIsSidebarOpen(true)} className={`lg:hidden absolute top-4 left-4 z-20 p-2 backdrop-blur-sm rounded-md border ${themeClasses.cardBg} ${themeClasses.border} ${themeClasses.subHeaderText} hover:text-cyan-400`}>
            <MenuIcon />
          </button>
          <button onClick={() => setIsSidebarVisibleDesktop(v => !v)} title={isSidebarVisibleDesktop ? 'Collapse Sidebar' : 'Expand Sidebar'} className={`hidden lg:flex items-center justify-center absolute top-1/2 -translate-y-1/2 left-0 -translate-x-1/2 z-20 w-8 h-8 rounded-full text-white hover:bg-cyan-600 transition-all border-2 ${themeClasses.sidebarToggleBg}`}>
            {isSidebarVisibleDesktop ? <ChevronLeftIcon /> : <ChevronRightIcon />}
          </button>
          <Preview monitors={monitors} keyboardSize={keyboardSize} onUpdateMonitor={updateMonitorConfig} keyboardPosition={keyboardPosition} onUpdateKeyboardPosition={updateKeyboardPosition} theme={theme} />
        </main>
      </div>
    </div>
  );
};

export default App;