
export interface Monitor {
  id: string;
  name: string;
  diagonal: number;
  aspectRatio: { w: number; h: number };
  resolution: { w: number; h: number };
  ppi: number;
  widthInches: number;
  heightInches: number;
  isVisible: boolean;
  isPortrait: boolean;
  position: { x: number; y: number };
  zIndex: number;
  color: string;
}
