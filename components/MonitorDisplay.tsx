
import React, { useState, useRef, useLayoutEffect } from 'react';
import { Monitor } from '../types';
import { PIXELS_PER_INCH } from '../constants';
import { RotateIcon, DeleteIcon } from './Icons';

type Theme = 'light' | 'dark';

interface MonitorDisplayProps {
  monitor: Monitor;
  scale: number;
  isDragging: boolean;
  isObscured: boolean;
  onMouseDown: (e: React.MouseEvent<HTMLDivElement>, id: string) => void;
  onTouchStart: (e: React.TouchEvent<HTMLDivElement>, id: string) => void;
  onRotate: (id: string) => void;
  onDelete: (id: string) => void;
  theme: Theme;
}

const MonitorDisplay: React.FC<MonitorDisplayProps> = ({ monitor, scale, isDragging, isObscured, onMouseDown, onTouchStart, onRotate, onDelete, theme }) => {
  const [isOverflowing, setIsOverflowing] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);
  
  const width = (monitor.isPortrait ? monitor.heightInches : monitor.widthInches) * PIXELS_PER_INCH;
  const height = (monitor.isPortrait ? monitor.widthInches : monitor.heightInches) * PIXELS_PER_INCH;

  useLayoutEffect(() => {
    const checkOverflow = () => {
      if (textRef.current) {
        const textWidth = textRef.current.scrollWidth;
        const textHeight = textRef.current.scrollHeight;
        const padding = 16; 

        const monitorVisibleWidth = width * scale;
        const monitorVisibleHeight = height * scale;

        const newIsOverflowing = textWidth > monitorVisibleWidth - padding || textHeight > monitorVisibleHeight - padding;
        setIsOverflowing(newIsOverflowing);
      }
    };

    // Run check immediately for initial layout
    checkOverflow();

    // Also run the check after web fonts are ready. This handles race conditions
    // where the initial layout is calculated with a fallback font, which may
    // have different dimensions from the final loaded font.
    document.fonts.ready.then(checkOverflow);
    
  }, [width, height, scale, monitor.name, monitor.diagonal, monitor.resolution]);

  const textContent = (
    <div ref={textRef} className="font-mono">
      <b className="whitespace-nowrap font-sans font-bold">{monitor.name}</b><br />
      <span className="whitespace-nowrap">{monitor.diagonal}"</span><br />
      <span className="whitespace-nowrap">{monitor.resolution.w}x{monitor.resolution.h}</span>
    </div>
  );

  const shouldTextBeOutside = isOverflowing || isObscured;

  const themeClasses = {
    bg: theme === 'dark' ? 'bg-black/50' : 'bg-slate-400/30',
    text: theme === 'dark' ? 'text-white/80' : 'text-slate-900/80',
    outsideLabelBg: theme === 'dark' ? 'rgba(10, 10, 10, 0.9)' : 'rgba(248, 250, 252, 0.9)',
    outsideLabelBorder: theme === 'dark' ? 'border border-gray-800' : 'border border-slate-200',
    actionButtonBg: theme === 'dark' ? 'bg-gray-900' : 'bg-white',
    actionButtonBorder: theme === 'dark' ? 'border-gray-700' : 'border-slate-300',
    rotateButtonText: theme === 'dark' ? 'text-gray-400 hover:bg-gray-800 hover:text-cyan-400' : 'text-slate-500 hover:bg-slate-200 hover:text-cyan-500',
    deleteButtonText: theme === 'dark' ? 'text-gray-400 hover:bg-gray-800 hover:text-red-500' : 'text-slate-500 hover:bg-slate-200 hover:text-red-500',
  };

  return (
    <div
      onMouseDown={(e) => onMouseDown(e, monitor.id)}
      onTouchStart={(e) => onTouchStart(e, monitor.id)}
      className={`absolute border-2 rounded-sm select-none transition-shadow duration-200 group ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} ${themeClasses.bg}`}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        left: `${monitor.position.x}px`,
        top: `${monitor.position.y}px`,
        zIndex: monitor.zIndex,
        borderColor: isDragging ? '#00ffff' : monitor.color,
      }}
    >
      <div 
        className={`pointer-events-none absolute ${themeClasses.text}`}
        style={{
          fontSize: '10px',
          lineHeight: '1.2',
          ...(shouldTextBeOutside
            ? {
                transform: `scale(${1 / scale})`,
                transformOrigin: 'bottom right',
                right: '100%',
                bottom: '100%',
                padding: '4px 6px',
                backgroundColor: themeClasses.outsideLabelBg,
                borderRadius: '4px',
                marginBottom: '4px',
                marginRight: '4px',
                border: theme === 'dark' ? '1px solid #27272a' : '1px solid #e5e7eb',
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
          className={`absolute top-0 right-0 p-1 rounded-full transition-all opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 border ${themeClasses.actionButtonBorder} ${themeClasses.actionButtonBg} ${themeClasses.rotateButtonText}`}
          style={{ transform: 'translate(50%, -50%)'}}
          title="Rotate"
      >
          <RotateIcon />
      </button>
      <button
          onClick={(e) => { e.stopPropagation(); onDelete(monitor.id); }}
          className={`absolute top-0 left-0 p-1 rounded-full transition-all opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 border ${themeClasses.actionButtonBorder} ${themeClasses.actionButtonBg} ${themeClasses.deleteButtonText}`}
          style={{ transform: 'translate(-50%, -50%)'}}
          title="Delete"
      >
          <DeleteIcon />
      </button>
    </div>
  );
};

export default MonitorDisplay;
