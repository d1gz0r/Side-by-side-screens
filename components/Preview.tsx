
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Monitor } from '../types';
import MonitorDisplay from './MonitorDisplay';
import { KEYBOARD_DIMENSIONS_100, KEYBOARD_DIMENSIONS_75, PIXELS_PER_INCH, KEYBOARD_COLOR } from '../constants';
import { ZoomInIcon, ZoomOutIcon, ResetZoomIcon } from './Icons';

type Theme = 'light' | 'dark';

interface PreviewProps {
  monitors: Monitor[];
  keyboardSize: 'hidden' | '100%' | '75%';
  onUpdateMonitor: (id: string, newConfig: Partial<Monitor>) => void;
  onDelete: (id: string) => void;
  keyboardPosition: { x: number; y: number };
  onUpdateKeyboardPosition: (position: { x: number; y: number }) => void;
  theme: Theme;
}

const Keyboard: React.FC<{
  size: '100%' | '75%';
  position: { x: number; y: number };
  onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
  isDragging: boolean;
  scale: number;
  theme: Theme;
}> = ({ size, position, onMouseDown, isDragging, scale, theme }) => {
  const dimensions = size === '100%' ? KEYBOARD_DIMENSIONS_100 : KEYBOARD_DIMENSIONS_75;
  const width = dimensions.width * PIXELS_PER_INCH;
  const height = dimensions.height * PIXELS_PER_INCH;

  const themeClasses = {
    bg: theme === 'dark' ? 'bg-gray-800/80' : 'bg-slate-200/80',
    text: theme === 'dark' ? 'text-gray-400' : 'text-slate-600',
  };

  return (
    <div
      onMouseDown={onMouseDown}
      className={`absolute border-2 rounded-sm select-none transition-shadow duration-200 flex items-center justify-center ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 1000,
        backgroundColor: themeClasses.bg,
        borderColor: isDragging ? '#00ffff' : KEYBOARD_COLOR,
      }}
    >
      <div
        className={`font-mono text-xs ${themeClasses.text}`}
        style={{ transform: `scale(${1 / scale})`, transformOrigin: 'center center' }}
      >
        {size} Keyboard
      </div>
    </div>
  );
};

const Preview: React.FC<PreviewProps> = ({
  monitors,
  keyboardSize,
  onUpdateMonitor,
  onDelete,
  keyboardPosition,
  onUpdateKeyboardPosition,
  theme,
}) => {
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 20, y: 20 });
  const [dragging, setDragging] = useState<{ id: string; type: 'monitor' | 'keyboard'; offset: { x: number; y: number } } | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const previewRef = useRef<HTMLDivElement>(null);

  const handleZoom = (delta: number, clientX?: number, clientY?: number) => {
    const preview = previewRef.current;
    if (!preview) return;

    const newScale = Math.max(0.1, Math.min(5, scale * delta));
    const rect = preview.getBoundingClientRect();

    const mouseX = (clientX ?? rect.left + rect.width / 2) - rect.left;
    const mouseY = (clientY ?? rect.top + rect.height / 2) - rect.top;

    const newPanX = mouseX - (mouseX - pan.x) * (newScale / scale);
    const newPanY = mouseY - (mouseY - pan.y) * (newScale / scale);
    
    setScale(newScale);
    setPan({ x: newPanX, y: newPanY });
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    handleZoom(e.deltaY > 0 ? 0.9 : 1.1, e.clientX, e.clientY);
  };

  const resetView = () => {
    setScale(1);
    setPan({ x: 20, y: 20 });
  };

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>, id: string, type: 'monitor' | 'keyboard') => {
    e.preventDefault();
    e.stopPropagation();
    const targetPosition = type === 'monitor' ? monitors.find(m => m.id === id)?.position : keyboardPosition;
    if (!targetPosition) return;

    const previewRect = previewRef.current?.getBoundingClientRect();
    if (!previewRect) return;

    const mouseX = (e.clientX - previewRect.left - pan.x) / scale;
    const mouseY = (e.clientY - previewRect.top - pan.y) / scale;

    setDragging({
      id,
      type,
      offset: {
        x: mouseX - targetPosition.x,
        y: mouseY - targetPosition.y,
      },
    });
  }, [monitors, keyboardPosition, scale, pan]);

  const handlePreviewMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.currentTarget !== e.target) return;
    setIsPanning(true);
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  }, [pan]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isPanning) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
      return;
    }
    
    if (!dragging) return;

    const previewRect = previewRef.current?.getBoundingClientRect();
    if (!previewRect) return;

    const newX = (e.clientX - previewRect.left - pan.x) / scale - dragging.offset.x;
    const newY = (e.clientY - previewRect.top - pan.y) / scale - dragging.offset.y;

    if (dragging.type === 'monitor') {
      onUpdateMonitor(dragging.id, { position: { x: newX, y: newY } });
    } else if (dragging.type === 'keyboard') {
      onUpdateKeyboardPosition({ x: newX, y: newY });
    }
  }, [dragging, isPanning, panStart, scale, pan, onUpdateMonitor, onUpdateKeyboardPosition]);

  const handleMouseUp = useCallback(() => {
    setDragging(null);
    setIsPanning(false);
  }, []);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => handleMouseMove(e);
    const handleUp = () => handleMouseUp();

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [handleMouseMove, handleMouseUp]);
  
  const getMonitorRect = (monitor: Monitor) => {
    const width = (monitor.isPortrait ? monitor.heightInches : monitor.widthInches) * PIXELS_PER_INCH;
    const height = (monitor.isPortrait ? monitor.widthInches : monitor.heightInches) * PIXELS_PER_INCH;
    return {
      left: monitor.position.x,
      right: monitor.position.x + width,
      top: monitor.position.y,
      bottom: monitor.position.y + height,
      width,
      height
    };
  };

  const isObscured = useCallback((monitorId: string): boolean => {
    const targetMonitor = monitors.find(m => m.id === monitorId);
    if (!targetMonitor) return false;

    const targetRect = getMonitorRect(targetMonitor);

    for (const otherMonitor of monitors) {
      if (otherMonitor.id === monitorId || !otherMonitor.isVisible) continue;
      
      if ((otherMonitor.zIndex || 0) <= (targetMonitor.zIndex || 0)) continue;

      const otherRect = getMonitorRect(otherMonitor);
      
      const isOverlapping = !(targetRect.right < otherRect.left || 
                              targetRect.left > otherRect.right || 
                              targetRect.bottom < otherRect.top || 
                              targetRect.top > otherRect.bottom);
      
      if(isOverlapping) return true;
    }
    return false;
  }, [monitors]);


  const themeClasses = {
    bg: theme === 'dark' ? 'bg-gray-950/60' : 'bg-slate-50/60',
    grid: theme === 'dark' ? 'bg-[radial-gradient(#27272a_1px,transparent_1px)]' : 'bg-[radial-gradient(#cbd5e1_1px,transparent_1px)]',
    zoomButton: theme === 'dark' ? 'bg-gray-900/80 border-gray-700 text-gray-400 hover:bg-gray-800 hover:text-cyan-400' : 'bg-white/80 border-slate-300 text-slate-500 hover:bg-slate-200 hover:text-cyan-500'
  };

  return (
    <div
      ref={previewRef}
      onWheel={handleWheel}
      onMouseDown={handlePreviewMouseDown}
      className={`w-full h-full overflow-hidden relative backdrop-blur-sm ${themeClasses.bg} ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
    >
      <div 
        className={`absolute top-0 left-0 w-full h-full bg-[size:20px_20px] opacity-50 ${themeClasses.grid}`} 
        style={{ backgroundPosition: `${pan.x}px ${pan.y}px` }}
      />
      <div
        className="absolute top-0 left-0"
        style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`, transformOrigin: '0 0' }}
      >
        {monitors.filter(m => m.isVisible).map(monitor => (
          <MonitorDisplay
            key={monitor.id}
            monitor={monitor}
            scale={scale}
            isDragging={dragging?.id === monitor.id}
            isObscured={isObscured(monitor.id)}
            onMouseDown={(e, id) => handleMouseDown(e, id, 'monitor')}
            onRotate={(id) => onUpdateMonitor(id, { isPortrait: !monitor.isPortrait })}
            onDelete={onDelete}
            theme={theme}
          />
        ))}
        {keyboardSize !== 'hidden' && (
          <Keyboard
            size={keyboardSize}
            position={keyboardPosition}
            onMouseDown={(e) => handleMouseDown(e, 'keyboard', 'keyboard')}
            isDragging={dragging?.id === 'keyboard'}
            scale={scale}
            theme={theme}
          />
        )}
      </div>
      <div className="absolute bottom-4 right-4 flex items-center gap-2">
        <button onClick={() => handleZoom(1.2)} className={`p-2 rounded-md border backdrop-blur-sm transition-colors ${themeClasses.zoomButton}`} title="Zoom In"><ZoomInIcon /></button>
        <button onClick={() => handleZoom(0.8)} className={`p-2 rounded-md border backdrop-blur-sm transition-colors ${themeClasses.zoomButton}`} title="Zoom Out"><ZoomOutIcon /></button>
        <button onClick={resetView} className={`p-2 rounded-md border backdrop-blur-sm transition-colors ${themeClasses.zoomButton}`} title="Reset View"><ResetZoomIcon /></button>
      </div>
    </div>
  );
};

export default Preview;
