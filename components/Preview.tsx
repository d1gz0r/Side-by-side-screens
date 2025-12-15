
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Monitor } from '../types';
import { PIXELS_PER_INCH, KEYBOARD_DIMENSIONS_100, KEYBOARD_DIMENSIONS_75, SNAP_THRESHOLD, KEYBOARD_COLOR } from '../constants';
import { ZoomInIcon, ZoomOutIcon, ResetZoomIcon } from './Icons';
import MonitorDisplay from './MonitorDisplay';

type Theme = 'light' | 'dark';

interface PreviewProps {
  monitors: Monitor[];
  keyboardSize: 'hidden' | '100%' | '75%';
  onUpdateMonitor: (id: string, newConfig: Partial<Monitor>) => void;
  keyboardPosition: { x: number; y: number };
  onUpdateKeyboardPosition: (position: { x: number; y: number }) => void;
  theme: Theme;
}

const keyboardLayout100 = {
  main: [
    [1, 1, 1, 1, 0.5, 1, 1, 1, 1, 0.5, 1, 1, 1, 1, 0.5, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
    [1.5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.5],
    [1.8, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2.2],
    [2.3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2.7],
    [1.5, 1.2, 1.5, 6, 1.5, 1.2, 1.5, 1.5],
  ],
  numpad: [
    [1, 1, 1, 1],
    [1, 1, 1, 1],
    [1, 1, 1, 1],
    [1, 1, 1, 1],
    [2.1, 1, 1],
  ]
};

const keyboardLayout75 = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0.5, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1.5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.5],
    [1.8, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2.2],
    [2.3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.7],
    [1.5, 1.2, 1.5, 6, 1.5, 1, 1, 1],
];

const Preview: React.FC<PreviewProps> = ({ monitors, keyboardSize, onUpdateMonitor, keyboardPosition, onUpdateKeyboardPosition, theme }) => {
  const [dragging, setDragging] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const [scale, setScale] = useState(1);
  const previewRef = useRef<HTMLDivElement>(null);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!previewRef.current) return;
    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        setViewportSize({ width: entry.contentRect.width, height: entry.contentRect.height, });
      }
    });
    resizeObserver.observe(previewRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  const canvasSize = useMemo(() => {
    let contentMaxX = 0, contentMaxY = 0;
    monitors.filter(m => m.isVisible).forEach(monitor => {
      const width = (monitor.isPortrait ? monitor.heightInches : monitor.widthInches) * PIXELS_PER_INCH;
      const height = (monitor.isPortrait ? monitor.widthInches : monitor.heightInches) * PIXELS_PER_INCH;
      contentMaxX = Math.max(contentMaxX, monitor.position.x + width);
      contentMaxY = Math.max(contentMaxY, monitor.position.y + height);
    });
    if (keyboardSize !== 'hidden') {
      const dims = keyboardSize === '100%' ? KEYBOARD_DIMENSIONS_100 : KEYBOARD_DIMENSIONS_75;
      contentMaxX = Math.max(contentMaxX, keyboardPosition.x + dims.width * PIXELS_PER_INCH);
      contentMaxY = Math.max(contentMaxY, keyboardPosition.y + dims.height * PIXELS_PER_INCH);
    }
    const padding = 200;
    return {
      width: Math.max(viewportSize.width / scale, contentMaxX + padding),
      height: Math.max(viewportSize.height / scale, contentMaxY + padding),
    };
  }, [monitors, keyboardSize, keyboardPosition, viewportSize, scale]);

  const obscuredMonitors = useMemo(() => {
    const newObscured = new Set<string>();
    const visibleMonitors = monitors.filter(m => m.isVisible);
    for (let i = 0; i < visibleMonitors.length; i++) {
      for (let j = 0; j < visibleMonitors.length; j++) {
        if (i === j) continue;
        const monitorA = visibleMonitors[i], monitorB = visibleMonitors[j];
        if (monitorB.zIndex <= monitorA.zIndex) continue;
        const widthA = (monitorA.isPortrait ? monitorA.heightInches : monitorA.widthInches) * PIXELS_PER_INCH, heightA = (monitorA.isPortrait ? monitorA.widthInches : monitorA.heightInches) * PIXELS_PER_INCH, areaA = widthA * heightA;
        const widthB = (monitorB.isPortrait ? monitorB.heightInches : monitorB.widthInches) * PIXELS_PER_INCH, heightB = (monitorB.isPortrait ? monitorB.widthInches : monitorB.heightInches) * PIXELS_PER_INCH, areaB = widthB * heightB;
        if (areaB >= areaA) continue;
        if (monitorB.position.x < monitorA.position.x + widthA && monitorB.position.x + widthB > monitorA.position.x && monitorB.position.y < monitorA.position.y + heightA && monitorB.position.y + heightB > monitorA.position.y) {
          newObscured.add(monitorA.id);
        }
      }
    }
    return newObscured;
  }, [monitors]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>, id: string) => {
    e.preventDefault(); e.stopPropagation();
    const target = e.currentTarget as HTMLDivElement, rect = target.getBoundingClientRect();
    setDragging({ id, offsetX: (e.clientX - rect.left) / scale, offsetY: (e.clientY - rect.top) / scale });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragging || !previewRef.current) return;
    const previewRect = previewRef.current.getBoundingClientRect();
    const mouseX = e.clientX - previewRect.left + previewRef.current.scrollLeft;
    const mouseY = e.clientY - previewRect.top + previewRef.current.scrollTop;
    let newX = mouseX / scale - dragging.offsetX, newY = mouseY / scale - dragging.offsetY;
    if (dragging.id === 'keyboard') {
      onUpdateKeyboardPosition({ x: newX, y: newY });
      return;
    }
    const draggedMonitor = monitors.find(m => m.id === dragging.id);
    if (!draggedMonitor) return;
    const draggedWidth = (draggedMonitor.isPortrait ? draggedMonitor.heightInches : draggedMonitor.widthInches) * PIXELS_PER_INCH, draggedHeight = (draggedMonitor.isPortrait ? draggedMonitor.widthInches : draggedMonitor.heightInches) * PIXELS_PER_INCH;
    let closestSnap = { x: { dist: Infinity, pos: newX }, y: { dist: Infinity, pos: newY } };
    monitors.forEach(monitor => {
      if (monitor.id === dragging.id || !monitor.isVisible) return;
      const staticWidth = (monitor.isPortrait ? monitor.heightInches : monitor.widthInches) * PIXELS_PER_INCH, staticHeight = (monitor.isPortrait ? monitor.widthInches : monitor.heightInches) * PIXELS_PER_INCH;
      const staticEdges = { left: monitor.position.x, right: monitor.position.x + staticWidth, top: monitor.position.y, bottom: monitor.position.y + staticHeight, centerX: monitor.position.x + staticWidth / 2, centerY: monitor.position.y + staticHeight / 2 };
      [staticEdges.left, staticEdges.right, staticEdges.left - draggedWidth, staticEdges.right - draggedWidth, staticEdges.centerX - draggedWidth / 2].forEach(snapPos => {
        const dist = Math.abs(newX - snapPos);
        if (dist < closestSnap.x.dist) { closestSnap.x = { dist, pos: snapPos }; }
      });
      [staticEdges.top, staticEdges.bottom, staticEdges.top - draggedHeight, staticEdges.bottom - draggedHeight, staticEdges.centerY - draggedHeight / 2].forEach(snapPos => {
        const dist = Math.abs(newY - snapPos);
        if (dist < closestSnap.y.dist) { closestSnap.y = { dist, pos: snapPos }; }
      });
    });
    if (closestSnap.x.dist < SNAP_THRESHOLD) newX = closestSnap.x.pos;
    if (closestSnap.y.dist < SNAP_THRESHOLD) newY = closestSnap.y.pos;
    onUpdateMonitor(dragging.id, { position: { x: newX, y: newY } });
  }, [dragging, monitors, onUpdateMonitor, onUpdateKeyboardPosition, scale]);

  const handleMouseUp = useCallback(() => setDragging(null), []);
  const handleRotate = useCallback((id: string) => {
    const monitor = monitors.find(m => m.id === id);
    if(monitor) onUpdateMonitor(id, { isPortrait: !monitor.isPortrait });
  }, [monitors, onUpdateMonitor]);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove); window.addEventListener('mouseup', handleMouseUp);
    return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp); };
  }, [handleMouseMove, handleMouseUp]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const newScale = e.deltaY > 0 ? scale * 0.9 : scale * 1.1;
    setScale(Math.max(0.2, Math.min(newScale, 3)));
  };
  const zoom = (factor: number) => setScale(s => Math.max(0.2, Math.min(s * factor, 3)));
  const resetZoom = () => setScale(1);

  const themeClasses = {
    bg: theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50',
    controlsBg: theme === 'dark' ? 'bg-gray-800/70 border-gray-700' : 'bg-white/70 border-gray-300',
    controlsText: theme === 'dark' ? 'text-gray-400' : 'text-gray-500',
    controlsHover: theme === 'dark' ? 'hover:text-cyan-400' : 'hover:text-cyan-600',
    controlsBorder: theme === 'dark' ? 'border-gray-700' : 'border-gray-300',
    accentText: theme === 'dark' ? 'text-cyan-400' : 'text-cyan-600',
    gridImage: theme === 'dark' 
      ? 'linear-gradient(to right, rgba(0, 194, 255, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 194, 255, 0.05) 1px, transparent 1px)'
      : 'linear-gradient(to right, rgba(203, 213, 225, 0.5) 1px, transparent 1px), linear-gradient(to bottom, rgba(203, 213, 225, 0.5) 1px, transparent 1px)'
  };

  return (
    <div className={`w-full h-full relative ${themeClasses.bg}`}>
      <div className={`absolute top-4 right-4 z-20 backdrop-blur-sm rounded-lg flex items-center border ${themeClasses.controlsBg}`}>
        <button onClick={() => zoom(1.25)} title="Zoom In" className={`p-2 transition-colors ${themeClasses.controlsText} ${themeClasses.controlsHover}`}><ZoomInIcon /></button>
        <button onClick={resetZoom} title="Reset Zoom" className={`p-2 transition-colors border-x ${themeClasses.controlsBorder} ${themeClasses.controlsText} ${themeClasses.controlsHover}`}><ResetZoomIcon /></button>
        <button onClick={() => zoom(0.8)} title="Zoom Out" className={`p-2 transition-colors ${themeClasses.controlsText} ${themeClasses.controlsHover}`}><ZoomOutIcon /></button>
        <div className={`text-xs font-mono pr-3 pl-2 select-none ${themeClasses.accentText}`} style={{ minWidth: '50px' }}>{Math.round(scale * 100)}%</div>
      </div>
      <div ref={previewRef} onWheel={handleWheel} className="w-full h-full bg-grid overflow-auto" style={{ backgroundSize: '40px 40px', backgroundImage: themeClasses.gridImage }}>
        <div className="relative" style={{ width: `${canvasSize.width}px`, height: `${canvasSize.height}px`, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
          {monitors.filter(m => m.isVisible).sort((a,b) => a.zIndex - b.zIndex).map(monitor => (
            <MonitorDisplay key={monitor.id} monitor={monitor} scale={scale} isDragging={dragging?.id === monitor.id} isObscured={obscuredMonitors.has(monitor.id)} onMouseDown={handleMouseDown} onRotate={handleRotate} theme={theme} />
          ))}
          {keyboardSize !== 'hidden' && (() => {
            const dimensions = keyboardSize === '100%' ? KEYBOARD_DIMENSIONS_100 : KEYBOARD_DIMENSIONS_75;
            const is100 = keyboardSize === '100%';
            return (
              <div onMouseDown={(e) => handleMouseDown(e, 'keyboard')} className={`absolute select-none transition-shadow duration-200 rounded-md ${dragging?.id === 'keyboard' ? 'cursor-grabbing z-50' : 'cursor-grab'}`} style={{ width: `${dimensions.width * PIXELS_PER_INCH}px`, height: `${dimensions.height * PIXELS_PER_INCH}px`, left: `${keyboardPosition.x}px`, top: `${keyboardPosition.y}px`, backgroundColor: KEYBOARD_COLOR, boxShadow: dragging?.id === 'keyboard' ? `0 0 20px ${KEYBOARD_COLOR}90` : `0 0 10px ${KEYBOARD_COLOR}40`, padding: '6px' }}>
                <div className="w-full h-full bg-gray-800/50 rounded-sm flex gap-[2%] p-[1%] pointer-events-none">
                  <div className={`h-full flex flex-col gap-[3%] ${is100 ? 'flex-grow' : 'w-full'}`}>
                    {(is100 ? keyboardLayout100.main : keyboardLayout75).map((row, rowIndex) => (
                      <div key={rowIndex} className="flex-grow flex gap-[2%]">
                        {row.map((flexGrow, keyIndex) => (<div key={keyIndex} className="bg-gray-600/70 rounded-[3px]" style={{ flexGrow }}></div>))}
                      </div>
                    ))}
                  </div>
                  {is100 && (
                    <div className="h-full w-[25%] flex flex-col gap-[3%]">
                      {keyboardLayout100.numpad.map((row, rowIndex) => (
                        <div key={rowIndex} className="flex-grow flex gap-[4%]">
                          {row.map((flexGrow, keyIndex) => (<div key={keyIndex} className="bg-gray-600/70 rounded-[3px]" style={{ flexGrow }}></div>))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
};

export default Preview;
