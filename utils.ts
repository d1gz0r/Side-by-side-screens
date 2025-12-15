
import { Monitor } from './types';
import { KEYBOARD_DIMENSIONS_100, KEYBOARD_DIMENSIONS_75, PIXELS_PER_INCH, SNAP_THRESHOLD } from './constants';

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

// Complex logic to snap keyboard to monitor edges and centers
export const getSnappedPosition = (
  rawX: number,
  rawY: number,
  keyboardSize: '100%' | '75%' | 'hidden',
  monitors: Monitor[]
) => {
  if (keyboardSize === 'hidden') return { x: rawX, y: rawY };

  const dimensions = keyboardSize === '100%' ? KEYBOARD_DIMENSIONS_100 : KEYBOARD_DIMENSIONS_75;
  const kbdWidth = dimensions.width * PIXELS_PER_INCH;
  const kbdHeight = dimensions.height * PIXELS_PER_INCH;

  // Calculate keyboard edges based on the raw drag position
  const kbdEdges = {
    left: rawX, right: rawX + kbdWidth,
    top: rawY, bottom: rawY + kbdHeight,
    centerX: rawX + kbdWidth / 2, centerY: rawY + kbdHeight / 2,
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

    // Check Y-axis alignment (Top, Bottom, Center)
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

  return { x: bestSnapX.value, y: bestSnapY.value };
};
