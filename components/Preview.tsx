
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Monitor } from '../types';
import { PIXELS_PER_INCH, KEYBOARD_DIMENSIONS_100, KEYBOARD_DIMENSIONS_75, SNAP_THRESHOLD, KEYBOARD_COLOR } from '../constants';
import { ZoomInIcon, ZoomOutIcon, ResetZoomIcon } from './Icons';
import MonitorDisplay from './MonitorDisplay';

interface PreviewProps {
  monitors: Monitor[];
  keyboardSize: 'hidden' | '100%' | '75%';
  onUpdateMonitor: (id: string, newConfig: Partial<Monitor>) => void;
  nextZIndex: number;
  keyboardPosition: { x: number; y: number };
  onUpdateKeyboardPosition: (position: { x: number; y: number }) => void;
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

const Preview: React.FC<PreviewProps> = ({ monitors, keyboardSize, onUpdateMonitor, nextZIndex, keyboardPosition, onUpdateKeyboardPosition }) => {
  const [dragging, setDragging] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const [scale, setScale] = useState(1);
  const previewRef = useRef<HTMLDivElement>(null);

  const obscuredMonitors = useMemo(() => {
    const newObscured = new Set<string>();
    const visibleMonitors = monitors.filter(m => m.isVisible);

    for (let i = 0; i < visibleMonitors.length; i++) {
      for (let j = 0; j < visibleMonitors.length; j++) {
        if (i === j) continue;

        const monitorA = visibleMonitors[i]; // The one that might be obscured (bottom)
        const monitorB = visibleMonitors[j]; // The one on top

        // Only check if B is on top of A
        if (monitorB.zIndex <= monitorA.zIndex) continue;

        const widthA = (monitorA.isPortrait ? monitorA.heightInches : monitorA.widthInches) * PIXELS_PER_INCH;
        const heightA = (monitorA.isPortrait ? monitorA.widthInches : monitorA.heightInches) * PIXELS_PER_INCH;
        const areaA = widthA * heightA;

        const widthB = (monitorB.isPortrait ? monitorB.heightInches : monitorB.widthInches) * PIXELS_PER_INCH;
        const heightB = (monitorB.isPortrait ? monitorB.widthInches : monitorB.heightInches) * PIXELS_PER_INCH;
        const areaB = widthB * heightB;

        // Only obscure if the top monitor is smaller than the bottom one
        if (areaB >= areaA) continue;

        const overlaps =
            monitorB.position.x < monitorA.position.x + widthA &&
            monitorB.position.x + widthB > monitorA.position.x &&
            monitorB.position.y < monitorA.position.y + heightA &&
            monitorB.position.y + heightB > monitorA.position.y;

        if (overlaps) {
            newObscured.add(monitorA.id);
        }
      }
    }
    return newObscured;
  }, [monitors]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>, id: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (id !== 'keyboard') {
      const monitor = monitors.find(m => m.id === id);
      if (!monitor) return;
      onUpdateMonitor(id, { zIndex: nextZIndex });
    }
    
    const target = e.currentTarget as HTMLDivElement;
    const rect = target.getBoundingClientRect();
    
    setDragging({
        id,
        offsetX: (e.clientX - rect.left) / scale,
        offsetY: (e.clientY - rect.top) / scale,
    });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragging || !previewRef.current) return;

    const previewRect = previewRef.current.getBoundingClientRect();
    const scrollLeft = previewRef.current.scrollLeft;
    const scrollTop = previewRef.current.scrollTop;

    const mouseX = e.clientX - previewRect.left + scrollLeft;
    const mouseY = e.clientY - previewRect.top + scrollTop;

    let newX = mouseX / scale - dragging.offsetX;
    let newY = mouseY / scale - dragging.offsetY;

    if (dragging.id === 'keyboard') {
      onUpdateKeyboardPosition({ x: newX, y: newY });
      return;
    }

    const draggedMonitor = monitors.find(m => m.id === dragging.id);
    if (!draggedMonitor) return;

    const draggedWidth = (draggedMonitor.isPortrait ? draggedMonitor.heightInches : draggedMonitor.widthInches) * PIXELS_PER_INCH;
    const draggedHeight = (draggedMonitor.isPortrait ? draggedMonitor.widthInches : draggedMonitor.heightInches) * PIXELS_PER_INCH;
    
    let closestSnap = {
        x: { dist: Infinity, pos: newX },
        y: { dist: Infinity, pos: newY }
    };

    monitors.forEach(monitor => {
      if (monitor.id === dragging.id || !monitor.isVisible) return;
      
      const staticWidth = (monitor.isPortrait ? monitor.heightInches : monitor.widthInches) * PIXELS_PER_INCH;
      const staticHeight = (monitor.isPortrait ? monitor.widthInches : monitor.heightInches) * PIXELS_PER_INCH;
      
      const staticEdges = { 
        left: monitor.position.x, right: monitor.position.x + staticWidth, top: monitor.position.y, bottom: monitor.position.y + staticHeight,
        centerX: monitor.position.x + staticWidth / 2, centerY: monitor.position.y + staticHeight / 2
      };

      const xSnaps = [ staticEdges.left, staticEdges.right, staticEdges.left - draggedWidth, staticEdges.right - draggedWidth, staticEdges.centerX - draggedWidth / 2 ];
      const ySnaps = [ staticEdges.top, staticEdges.bottom, staticEdges.top - draggedHeight, staticEdges.bottom - draggedHeight, staticEdges.centerY - draggedHeight / 2 ];
      
      xSnaps.forEach(snapPos => {
          const dist = Math.abs(newX - snapPos);
          if (dist < closestSnap.x.dist) {
              closestSnap.x.dist = dist;
              closestSnap.x.pos = snapPos;
          }
      });

      ySnaps.forEach(snapPos => {
          const dist = Math.abs(newY - snapPos);
          if (dist < closestSnap.y.dist) {
              closestSnap.y.dist = dist;
              closestSnap.y.pos = snapPos;
          }
      });
    });

    if (closestSnap.x.dist < SNAP_THRESHOLD) {
        newX = closestSnap.x.pos;
    }
    if (closestSnap.y.dist < SNAP_THRESHOLD) {
        newY = closestSnap.y.pos;
    }

    onUpdateMonitor(dragging.id, { position: { x: newX, y: newY } });
  }, [dragging, monitors, onUpdateMonitor, onUpdateKeyboardPosition, scale]);

  const handleMouseUp = useCallback(() => {
    setDragging(null);
  }, []);

  const handleRotate = useCallback((id: string) => {
    const monitor = monitors.find(m => m.id === id);
    if(monitor) {
      onUpdateMonitor(id, { isPortrait: !monitor.isPortrait });
    }
  }, [monitors, onUpdateMonitor]);


  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomIntensity = 0.1;
    const newScale = e.deltaY > 0 ? scale * (1 - zoomIntensity) : scale * (1 + zoomIntensity);
    const clampedScale = Math.max(0.2, Math.min(newScale, 3));
    setScale(clampedScale);
  };
  
  const zoom = (factor: number) => {
    const newScale = scale * factor;
    const clampedScale = Math.max(0.2, Math.min(newScale, 3));
    setScale(clampedScale);
  };
  
  const resetZoom = () => { setScale(1); };

  return (
    <div className="w-full h-full relative bg-gray-900">
      <div className="absolute top-4 right-4 z-20 bg-gray-800/70 backdrop-blur-sm rounded-lg flex items-center border border-gray-700">
        <button onClick={() => zoom(1.25)} title="Zoom In" className="p-2 text-gray-400 transition-colors hover:text-cyan-400"><ZoomInIcon /></button>
        <button onClick={resetZoom} title="Reset Zoom" className="p-2 text-gray-400 transition-colors hover:text-cyan-400 border-x border-gray-700"><ResetZoomIcon /></button>
        <button onClick={() => zoom(0.8)} title="Zoom Out" className="p-2 text-gray-400 transition-colors hover:text-cyan-400"><ZoomOutIcon /></button>
        <div className="text-xs font-mono text-cyan-400 pr-3 pl-2 select-none" style={{ minWidth: '50px' }}>
          {Math.round(scale * 100)}%
        </div>
      </div>

      <div 
        ref={previewRef} 
        onWheel={handleWheel} 
        className="w-full h-full bg-grid overflow-auto" 
        style={{ backgroundSize: '40px 40px', backgroundImage: 'linear-gradient(to right, rgba(0, 194, 255, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 194, 255, 0.05) 1px, transparent 1px)' }}
      >
        <div 
          className="relative" 
          style={{ 
            width: '5000px',
            height: '5000px',
            transform: `scale(${scale})`, 
            transformOrigin: 'top left' 
          }}
        >
          {monitors.filter(m => m.isVisible).sort((a,b) => a.zIndex - b.zIndex).map(monitor => {
            const isDragging = dragging?.id === monitor.id;
            return (
              <MonitorDisplay
                key={monitor.id}
                monitor={monitor}
                scale={scale}
                isDragging={isDragging}
                isObscured={obscuredMonitors.has(monitor.id)}
                onMouseDown={handleMouseDown}
                onRotate={handleRotate}
              />
            );
          })}
          {keyboardSize !== 'hidden' && (() => {
            const dimensions = keyboardSize === '100%' ? KEYBOARD_DIMENSIONS_100 : KEYBOARD_DIMENSIONS_75;
            const is100 = keyboardSize === '100%';

            return (
              <div
                onMouseDown={(e) => handleMouseDown(e, 'keyboard')}
                className={`absolute select-none transition-shadow duration-200 rounded-md ${dragging?.id === 'keyboard' ? 'cursor-grabbing z-50' : 'cursor-grab'}`}
                style={{
                    width: `${dimensions.width * PIXELS_PER_INCH}px`,
                    height: `${dimensions.height * PIXELS_PER_INCH}px`,
                    left: `${keyboardPosition.x}px`,
                    top: `${keyboardPosition.y}px`,
                    backgroundColor: KEYBOARD_COLOR,
                    boxShadow: dragging?.id === 'keyboard' ? `0 0 20px ${KEYBOARD_COLOR}90` : `0 0 10px ${KEYBOARD_COLOR}40`,
                    padding: '6px'
                }}
              >
                <div className="w-full h-full bg-gray-800/50 rounded-sm flex gap-[2%] p-[1%] pointer-events-none">
                  <div className={`h-full flex flex-col gap-[3%] ${is100 ? 'flex-grow' : 'w-full'}`}>
                    {(is100 ? keyboardLayout100.main : keyboardLayout75).map((row, rowIndex) => (
                      <div key={rowIndex} className="flex-grow flex gap-[2%]">
                        {row.map((flexGrow, keyIndex) => (
                          <div
                            key={keyIndex}
                            className="bg-gray-600/70 rounded-[3px]"
                            style={{ flexGrow }}
                          ></div>
                        ))}
                      </div>
                    ))}
                  </div>
                  {is100 && (
                    <div className="h-full w-[25%] flex flex-col gap-[3%]">
                      {keyboardLayout100.numpad.map((row, rowIndex) => (
                        <div key={rowIndex} className="flex-grow flex gap-[4%]">
                          {row.map((flexGrow, keyIndex) => (
                            <div
                              key={keyIndex}
                              className="bg-gray-600/70 rounded-[3px]"
                              style={{ flexGrow }}
                            ></div>
                          ))}
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
