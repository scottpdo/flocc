/// <reference path="../types/Point.d.ts" />

declare interface CanvasRendererOptions {
  autoPosition?: boolean;
  background?: string;
  connectionColor?: string;
  connectionOpacity?: number;
  connectionWidth?: number;
  height?: number;
  origin?: Point;
  scale?: number;
  trace?: boolean;
  width?: number;
  /** When `true`, enables interactive features: click/hover detection, agent selection, pan, and zoom. Defaults to `false`. */
  interactive?: boolean;
  /** Optional callback invoked when an agent is selected or deselected. Receives the selected `Agent` or `null`. */
  onSelect?: (agent: any) => void;
  /** Minimum allowed scale when zooming. Defaults to `0.1`. */
  zoomMin?: number;
  /** Maximum allowed scale when zooming. Defaults to `10`. */
  zoomMax?: number;
}
