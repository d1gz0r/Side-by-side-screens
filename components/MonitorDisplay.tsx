
import React, { useState, useRef, useLayoutEffect } from 'react';
import { Monitor } from '../types';
import { PIXELS_PER_INCH } from '../constants';
import { RotateIcon } from './Icons';

interface MonitorDisplayProps {
  monitor: Monitor;
  scale: number;
  isDragging: boolean;
  onMouseDown: (e: React.MouseEvent<HTMLDivElement>, id: string) => void;
  onRotate: (id: string) => void;
}

const MonitorDisplay: React.FC<MonitorDisplayProps> = ({ monitor, scale, isDragging, onMouseDown, onRotate }) => {
  const [isOverflowing, setIsOverflowing] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);
  
  const width = (monitor.isPortrait ? monitor.heightInches : monitor.widthInches) * PIXELS_PER_INCH;
  const height = (monitor.isPortrait ? monitor.widthInches : monitor.heightInches) * PIXELS_PER_INCH;

  useLayoutEffect(() => {
    if (textRef.current) {
      const textWidth = textRef.current.scrollWidth;
      const textHeight = textRef.current.scrollHeight;
      const padding = 16; // A bit of padding

      const monitorVisibleWidth = width * scale;
      const monitorVisibleHeight = height * scale;

      if (textWidth > monitorVisibleWidth - padding || textHeight > monitorVisibleHeight - padding) {
        setIsOverflowing(true);
      } else {
        setIsOverflowing(false);
      }
    }
  }, [width, height, scale, monitor.name, monitor.diagonal, monitor.resolution]);

  const textContent = (
    <div ref={textRef}>
      <b className="whitespace-nowrap">{monitor.name}</b><br />
      <span className="whitespace-nowrap">{monitor.diagonal}"</span><br />
      <span className="whitespace-nowrap">{monitor.resolution.w}x{monitor.resolution.h}</span>
    </div>
  );

  return (
    <div
      onMouseDown={(e) => onMouseDown(e, monitor.id)}
      className={`absolute bg-black/50 border-2 rounded-sm select-none transition-shadow duration-200 group ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        left: `${monitor.position.x}px`,
        top: `${monitor.position.y}px`,
        zIndex: monitor.zIndex,
        borderColor: isDragging ? '#00ffff' : monitor.color,
        boxShadow: isDragging ? `0 0 20px ${monitor.color}60` : 'none',
      }}
    >
      <div 
        className="pointer-events-none absolute text-white/80"
        style={{
          fontSize: '10px',
          lineHeight: '1.2',
          ...(isOverflowing
            ? {
                transform: `scale(${1 / scale})`,
                transformOrigin: 'bottom right',
                right: '100%',
                bottom: '100%',
                padding: '4px 6px',
                backgroundColor: 'rgba(31, 41, 55, 0.9)', // bg-gray-700/90
                borderRadius: '4px',
                marginBottom: '4px',
                marginRight: '4px',
              }
            : {
                top: '50%',
                left: '50%',
                textAlign: 'center',
                transform: `translate(-50%, -50%) scale(${1 / scale})`,
                transformOrigin: 'center center',
                padding: '2px',
              }
          )
        }}
      >
        {textContent}
      </div>
      <button
          onClick={(e) => { e.stopPropagation(); onRotate(monitor.id); }}
          className="absolute -top-2 -right-2 bg-gray-800 p-1.5 rounded-full text-gray-400 hover:text-cyan-400 hover:bg-gray-700 transition-all opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100"
          title="Rotate"
      >
          <RotateIcon />
      </button>
    </div>
  );
};

export default MonitorDisplay;
