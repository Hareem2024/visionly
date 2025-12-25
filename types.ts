
export type ItemType = 'image' | 'note' | 'text' | 'sticker' | 'shape';

export type NoteColor = 'default' | 'gray' | 'brown' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple' | 'pink' | 'red';

export type LetterSpacing = 'tight' | 'normal' | 'airy';
export type FontWeight = 'light' | 'regular' | 'medium' | 'bold';
export type TextColor = string;

export type ShapeType = 'rectangle' | 'circle' | 'square' | 'triangle' | 'star' | 'heart' | 'line';

export interface Sticker {
  id: string;
  name: string;
  url: string;
  category: string;
}

export interface BoardItem {
  id: string;
  type: ItemType;
  content: string;
  x: number;
  y: number;
  z: number;
  width: number;
  height?: number;
  color?: NoteColor;
  rotation?: number;
  font?: string;
  fontWeight?: FontWeight;
  letterSpacing?: LetterSpacing;
  isItalic?: boolean;
  isUnderline?: boolean;
  textColor?: string;
  // Shape properties
  shapeType?: ShapeType;
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  opacity?: number;
}

export interface VisionBoard {
  id: string;
  title: string;
  items: BoardItem[];
  fontPairing?: string;
}

export interface SavedBoard {
  id: string;
  title: string;
  items: BoardItem[];
  fontPairing?: string;
  createdAt: number;
  updatedAt: number;
  thumbnail?: string; // Optional preview
}

export interface SavedUpload {
  id: string;
  data: string; // base64 image data
  name: string;
  uploadedAt: number;
}

export interface AppState {
  currentBoard: VisionBoard;
  isGenerating: boolean;
  statusMessage: string;
  savedBoards: SavedBoard[];
  savedUploads: SavedUpload[];
}
