
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Monitor } from '../types';
import MonitorDisplay from './MonitorDisplay';
import { KEYBOARD_DIMENSIONS_100, KEYBOARD_DIMENSIONS_75, PIXELS_PER_INCH, KEYBOARD_COLOR, SNAP_THRESHOLD } from '../constants';
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
  onTouchStart: (e: React.TouchEvent<HTMLDivElement>) => void;
  isDragging: boolean;
  scale: number;
  theme: Theme;
}> = ({ size, position, onMouseDown, onTouchStart, isDragging, scale, theme }) => {
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
      onTouchStart={onTouchStart}
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
  const pinchDistRef = useRef<number | null>(null);

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
    // Standard mouse wheel and trackpad pinch zoom
    handleZoom(e.deltaY > 0 ? 0.9 : 1.1, e.clientX, e.clientY);
  };

  const resetView = () => {
    setScale(1);
    setPan({ x: 20, y: 20 });
  };

  const startDragging = useCallback((clientX: number, clientY: number, id: string, type: 'monitor' | 'keyboard') => {
    const targetPosition = type === 'monitor' ? monitors.find(m => m.id === id)?.position : keyboardPosition;
    if (!targetPosition) return;
  
    const previewRect = previewRef.current?.getBoundingClientRect();
    if (!previewRect) return;
  
    const mouseX = (clientX - previewRect.left - pan.x) / scale;
    const mouseY = (clientY - previewRect.top - pan.y) / scale;
  
    setDragging({
      id,
      type,
      offset: {
        x: mouseX - targetPosition.x,
        y: mouseY - targetPosition.y,
      },
    });
  }, [monitors, keyboardPosition, scale, pan]);
  
  const startPanning = useCallback((clientX: number, clientY: number) => {
    setIsPanning(true);
    setPanStart({ x: clientX - pan.x, y: clientY - pan.y });
  }, [pan]);

  const handleInteractionEnd = useCallback(() => {
    setDragging(null);
    setIsPanning(false);
    pinchDistRef.current = null;
  }, []);

  const handleInteractionMove = useCallback((e: MouseEvent | TouchEvent) => {
    if ('touches' in e && e.touches.length === 2 && pinchDistRef.current !== null) {
        const p1 = e.touches[0];
        const p2 = e.touches[1];
        const newDist = Math.hypot(p1.clientX - p2.clientX, p1.clientY - p2.clientY);
        const midX = (p1.clientX + p2.clientX) / 2;
        const midY = (p1.clientY + p2.clientY) / 2;
        handleZoom(newDist / pinchDistRef.current, midX, midY);
        pinchDistRef.current = newDist;
        return;
    }

    const point = 'touches' in e ? e.touches[0] : e;
    if (!point) return;
    const { clientX, clientY } = point;

    if (isPanning) {
      setPan({ x: clientX - panStart.x, y: clientY - panStart.y });
      return;
    }
    
    if (!dragging) return;

    const previewRect = previewRef.current?.getBoundingClientRect();
    if (!previewRect) return;

    const newX = (clientX - previewRect.left - pan.x) / scale - dragging.offset.x;
    const newY = (clientY - previewRect.top - pan.y) / scale - dragging.offset.y;

    if (dragging.type === 'monitor') {
      onUpdateMonitor(dragging.id, { position: { x: newX, y: newY } });
    } else if (dragging.type === 'keyboard') {
      if (keyboardSize === 'hidden') {
        onUpdateKeyboardPosition({ x: newX, y: newY });
        return;
      }
      
      const dimensions = keyboardSize === '100%' ? KEYBOARD_DIMENSIONS_100 : KEYBOARD_DIMENSIONS_75;
      const kbdWidth = dimensions.width * PIXELS_PER_INCH;
      const kbdHeight = dimensions.height * PIXELS_PER_INCH;
      
      const kbdEdges = {
        left: newX, right: newX + kbdWidth, top: newY, bottom: newY + kbdHeight,
        centerX: newX + kbdWidth / 2, centerY: newY + kbdHeight / 2,
      };

      let bestSnapX = { delta: SNAP_THRESHOLD, value: newX };
      let bestSnapY = { delta: SNAP_THRESHOLD, value: newY };

      for (const monitor of monitors) {
        if (!monitor.isVisible) continue;
        const monitorRect = getMonitorRect(monitor);
        const monEdges = {
          left: monitorRect.left, right: monitorRect.right, top: monitorRect.top, bottom: monitorRect.bottom,
          centerX: monitorRect.left + monitorRect.width / 2, centerY: monitorRect.top + monitorRect.height / 2,
        };

        const xChecks = [
          { kbd: kbdEdges.left, mon: monEdges.left, newPos: monEdges.left },
          { kbd: kbdEdges.left, mon: monEdges.right, newPos: monEdges.right },
          { kbd: kbdEdges.right, mon: monEdges.left, newPos: monEdges.left - kbdWidth },
          { kbd: kbdEdges.right, mon: monEdges.right, newPos: monEdges.right - kbdWidth },
          { kbd: kbdEdges.centerX, mon: monEdges.centerX, newPos: monEdges.centerX - kbdWidth / 2 },
        ];
        for (const check of xChecks) {
          const delta = Math.abs(check.kbd - check.mon);
          if (delta < bestSnapX.delta) bestSnapX = { delta, value: check.newPos };
        }

        const yChecks = [
          { kbd: kbdEdges.top, mon: monEdges.top, newPos: monEdges.top },
          { kbd: kbdEdges.top, mon: monEdges.bottom, newPos: monEdges.bottom },
          { kbd: kbdEdges.bottom, mon: monEdges.top, newPos: monEdges.top - kbdHeight },
          { kbd: kbdEdges.bottom, mon: monEdges.bottom, newPos: monEdges.bottom - kbdHeight },
          { kbd: kbdEdges.centerY, mon: monEdges.centerY, newPos: monEdges.centerY - kbdHeight / 2 },
        ];
        for (const check of yChecks) {
          const delta = Math.abs(check.kbd - check.mon);
          if (delta < bestSnapY.delta) bestSnapY = { delta, value: check.newPos };
        }
      }
      
      onUpdateKeyboardPosition({ x: bestSnapX.value, y: bestSnapY.value });
    }
  }, [dragging, isPanning, panStart, scale, pan, onUpdateMonitor, onUpdateKeyboardPosition, monitors, keyboardSize]);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => handleInteractionMove(e);
    const handleUp = () => handleInteractionEnd();
    const handleTouchMove = (e: TouchEvent) => {
        if (isPanning || dragging || pinchDistRef.current !== null) {
            e.preventDefault();
        }
        handleInteractionMove(e);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleUp);
    window.addEventListener('touchcancel', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleUp);
      window.removeEventListener('touchcancel', handleUp);
    };
  }, [handleInteractionMove, handleInteractionEnd, isPanning, dragging]);
  
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>, id: string, type: 'monitor' | 'keyboard') => {
    e.preventDefault(); e.stopPropagation();
    startDragging(e.clientX, e.clientY, id, type);
  };
  
  const handlePreviewMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.currentTarget === e.target) startPanning(e.clientX, e.clientY);
  };

  const handleItemTouchStart = (e: React.TouchEvent<HTMLDivElement>, id: string, type: 'monitor' | 'keyboard') => {
    e.stopPropagation();
    if (e.touches.length === 1) startDragging(e.touches[0].clientX, e.touches[0].clientY, id, type);
  };
  
  const handlePreviewTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
        e.preventDefault();
        setIsPanning(false); setDragging(null);
        const p1 = e.touches[0];
        const p2 = e.touches[1];
        pinchDistRef.current = Math.hypot(p1.clientX - p2.clientX, p1.clientY - p2.clientY);
    } else if (e.touches.length === 1 && e.currentTarget === e.target) {
        startPanning(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

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
      onTouchStart={handlePreviewTouchStart}
      className={`w-full h-full overflow-hidden relative backdrop-blur-sm touch-none ${themeClasses.bg} ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
    >
      <div 
        className={`absolute top-0 left-0 w-full h-full bg-[size:20px_20px] opacity-50 pointer-events-none ${themeClasses.grid}`} 
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
            onTouchStart={(e, id) => handleItemTouchStart(e, id, 'monitor')}
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
            onTouchStart={(e) => handleItemTouchStart(e, 'keyboard', 'keyboard')}
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
