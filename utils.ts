
import { Monitor } from './types';
import { PIXELS_PER_INCH, SNAP_THRESHOLD } from './constants';

// Centralized math for calculating physical dimensions from resolution/diagonal
export const calculateMonitorSpecs = (diagonal: number, aspectRatio: { w: number; h: number }, resolution: { w: number; h: number }) => {
  const diagonalPixels = Math.sqrt(resolution.w ** 2 + resolution.h ** 2);
  const ppi = diagonalPixels / diagonal;
  const ratio = Math.sqrt(aspectRatio.w ** 2 + aspectRatio.h ** 2);
  const widthInches = (diagonal * aspectRatio.w) / ratio;
  const heightInches = (diagonal * aspectRatio.h) / ratio;

  return { ppi, widthInches, heightInches };
};

// Helper to calculate the bounding box of a monitor
export const getMonitorRect = (monitor: Monitor) => {
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

// Complex logic to snap an object (defined by dimensions and position) to monitor edges and centers
export const getSnappedPosition = (
  rawX: number,
  rawY: number,
  objWidth: number,
  objHeight: number,
  monitors: Monitor[]
) => {
  // Calculate edges of the object being moved
  const objEdges = {
    left: rawX, right: rawX + objWidth,
    top: rawY, bottom: rawY + objHeight,
    centerX: rawX + objWidth / 2, centerY: rawY + objHeight / 2,
  };

  let bestSnapX = { delta: SNAP_THRESHOLD, value: rawX };
  let bestSnapY = { delta: SNAP_THRESHOLD, value: rawY };

  for (const monitor of monitors) {
    if (!monitor.isVisible) continue;
    const monitorRect = getMonitorRect(monitor);
    
    const monEdges = {
      left: monitorRect.left, right: monitorRect.right,
      top: monitorRect.top, bottom: monitorRect.bottom,
      centerX: monitorRect.left + monitorRect.width / 2,
      centerY: monitorRect.top + monitorRect.height / 2,
    };

    // Check X-axis alignment (Left, Right, Center)
    const xChecks = [
      { obj: objEdges.left, mon: monEdges.left, newPos: monEdges.left },
      { obj: objEdges.left, mon: monEdges.right, newPos: monEdges.right },
      { obj: objEdges.right, mon: monEdges.left, newPos: monEdges.left - objWidth },
      { obj: objEdges.right, mon: monEdges.right, newPos: monEdges.right - objWidth },
      { obj: objEdges.centerX, mon: monEdges.centerX, newPos: monEdges.centerX - objWidth / 2 },
    ];

    for (const check of xChecks) {
      const delta = Math.abs(check.obj - check.mon);
      if (delta < bestSnapX.delta) bestSnapX = { delta, value: check.newPos };
    }

    // Check Y-axis alignment (Top, Bottom, Center)
    const yChecks = [
      { obj: objEdges.top, mon: monEdges.top, newPos: monEdges.top },
      { obj: objEdges.top, mon: monEdges.bottom, newPos: monEdges.bottom },
      { obj: objEdges.bottom, mon: monEdges.top, newPos: monEdges.top - objHeight },
      { obj: objEdges.bottom, mon: monEdges.bottom, newPos: monEdges.bottom - objHeight },
      { obj: objEdges.centerY, mon: monEdges.centerY, newPos: monEdges.centerY - objHeight / 2 },
    ];

    for (const check of yChecks) {
      const delta = Math.abs(check.obj - check.mon);
      if (delta < bestSnapY.delta) bestSnapY = { delta, value: check.newPos };
    }
  }

  return { x: bestSnapX.value, y: bestSnapY.value };
};
