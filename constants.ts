
export const DIAGONAL_PRESETS = [23.8, 27, 31.5, 34, 49];

export const ASPECT_RATIO_PRESETS = [
  { name: '16:9', w: 16, h: 9 },
  { name: '21:9', w: 21, h: 9 },
  { name: '32:9', w: 32, h: 9 },
  { name: '16:10', w: 16, h: 10 },
  { name: '4:3', w: 4, h: 3 },
];

export const RESOLUTION_PRESETS = [
  { name: '1080p FHD', w: 1920, h: 1080 },
  { name: '1440p QHD', w: 2560, h: 1440 },
  { name: '4K UHD', w: 3840, h: 2160 },
  { name: 'UW-QHD', w: 3440, h: 1440 },
  { name: 'S-UW-QHD', w: 5120, h: 1440 },
  { name: '5K', w: 5120, h: 2880 },
];

export const PIXELS_PER_INCH = 12;
// A standard full-size keyboard is about 17.5 inches wide and 5.5 inches deep.
export const KEYBOARD_DIMENSIONS_100 = { width: 17.5, height: 5.5 }; 
// A 75% keyboard is about 12.5 inches wide and 5.5 inches deep.
export const KEYBOARD_DIMENSIONS_75 = { width: 12.5, height: 5.5 }; 
export const SNAP_THRESHOLD = 10; // in pixels

export const MONITOR_COLORS = [
  '#00ffff', // cyan
  '#ff00ff', // magenta
  '#00ff00', // lime
  '#ff8c00', // darkorange
  '#00bfff', // deepskyblue
  '#adff2f', // greenyellow
  '#ff6347', // tomato
  '#da70d6', // orchid
  '#40e0d0', // turquoise
];

export const KEYBOARD_COLOR = '#FBC02D'; // A nice deep yellow
