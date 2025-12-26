
import React, { useState, useRef } from 'react';
import { BoardItem, NoteColor, ShapeType } from '../types';

interface BoardViewProps {
  items: BoardItem[];
  onUpdateItem: (id: string, updates: Partial<BoardItem>) => void;
  onDeleteItem: (id: string) => void;
  onDropImage?: (base64: string, x: number, y: number) => void;
  onDropSticker?: (url: string, x: number, y: number) => void;
  onDropNote?: (text: string, color: string, font?: string, fontWeight?: string, letterSpacing?: string, isItalic?: boolean, isUnderline?: boolean, textColor?: string, x?: number, y?: number) => void;
  onDropText?: (text: string, font?: string, fontWeight?: string, isItalic?: boolean, isUnderline?: boolean, textColor?: string, x?: number, y?: number) => void;
  isPrivateMode?: boolean;
  pendingTouchItem?: { type: string; data: any } | null;
  onSetPendingTouchItem?: (item: { type: string; data: any } | null) => void;
}

const getColorClass = (color?: NoteColor): string => {
  const colors: Record<NoteColor, string> = {
    default: 'note-default',
    gray: 'note-gray',
    brown: 'note-brown',
    orange: 'note-orange',
    yellow: 'note-yellow',
    green: 'note-green',
    blue: 'note-blue',
    purple: 'note-purple',
    pink: 'note-pink',
    red: 'note-red',
  };
  return colors[color || 'default'];
};

// Shape SVG renderer
const renderShape = (
  shapeType: ShapeType, 
  width: number, 
  height: number, 
  fillColor: string, 
  strokeColor: string, 
  strokeWidth: number,
  opacity: number
) => {
  const style = {
    fill: fillColor === 'transparent' ? 'none' : fillColor,
    stroke: strokeColor === 'transparent' ? 'none' : strokeColor,
    strokeWidth: strokeWidth,
    opacity: opacity,
  };

  switch (shapeType) {
    case 'rectangle':
      return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          <rect x={strokeWidth/2} y={strokeWidth/2} width={width - strokeWidth} height={height - strokeWidth} rx="4" style={style} />
        </svg>
      );
    case 'square':
      const squareSize = Math.min(width, height);
      return (
        <svg width={squareSize} height={squareSize} viewBox={`0 0 ${squareSize} ${squareSize}`}>
          <rect x={strokeWidth/2} y={strokeWidth/2} width={squareSize - strokeWidth} height={squareSize - strokeWidth} rx="4" style={style} />
        </svg>
      );
    case 'circle':
      const circleSize = Math.min(width, height);
      return (
        <svg width={circleSize} height={circleSize} viewBox={`0 0 ${circleSize} ${circleSize}`}>
          <circle cx={circleSize/2} cy={circleSize/2} r={(circleSize - strokeWidth)/2} style={style} />
        </svg>
      );
    case 'triangle':
      return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          <polygon 
            points={`${width/2},${strokeWidth} ${width - strokeWidth},${height - strokeWidth} ${strokeWidth},${height - strokeWidth}`} 
            style={style} 
          />
        </svg>
      );
    case 'star':
      const starSize = Math.min(width, height);
      const outerRadius = (starSize - strokeWidth) / 2;
      const innerRadius = outerRadius * 0.4;
      const centerX = starSize / 2;
      const centerY = starSize / 2;
      const points = [];
      for (let i = 0; i < 10; i++) {
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const angle = (Math.PI / 5) * i - Math.PI / 2;
        points.push(`${centerX + radius * Math.cos(angle)},${centerY + radius * Math.sin(angle)}`);
      }
      return (
        <svg width={starSize} height={starSize} viewBox={`0 0 ${starSize} ${starSize}`}>
          <polygon points={points.join(' ')} style={style} />
        </svg>
      );
    case 'heart':
      const heartSize = Math.min(width, height);
      return (
        <svg width={heartSize} height={heartSize} viewBox="0 0 24 24">
          <path 
            d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
            style={style}
          />
        </svg>
      );
    case 'line':
      return (
        <svg width={width} height={Math.max(strokeWidth * 2, 10)} viewBox={`0 0 ${width} ${Math.max(strokeWidth * 2, 10)}`}>
          <line 
            x1={strokeWidth} 
            y1={Math.max(strokeWidth, 5)} 
            x2={width - strokeWidth} 
            y2={Math.max(strokeWidth, 5)} 
            style={{ ...style, fill: 'none' }} 
          />
        </svg>
      );
    default:
      return null;
  }
};

const BoardView: React.FC<BoardViewProps> = ({ items, onUpdateItem, onDeleteItem, onDropImage, onDropSticker, onDropNote, onDropText, isPrivateMode, pendingTouchItem: externalPendingTouchItem, onSetPendingTouchItem }) => {
  const [dragItem, setDragItem] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isOverTrash, setIsOverTrash] = useState(false);
  const [rotatingItem, setRotatingItem] = useState<string | null>(null);
  const [rotationCenter, setRotationCenter] = useState({ x: 0, y: 0 });
  const [initialAngle, setInitialAngle] = useState(0);
  const [startRotation, setStartRotation] = useState(0);
  const [resizingItem, setResizingItem] = useState<string | null>(null);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0 });
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [isDraggingFromSidebar, setIsDraggingFromSidebar] = useState(false);
  const [pendingTouchItem, setPendingTouchItem] = useState<{ type: string; data: any } | null>(null);
  
  // Use external pending item if provided, otherwise use internal state
  const currentPendingTouchItem = externalPendingTouchItem !== undefined ? externalPendingTouchItem : pendingTouchItem;
  const setCurrentPendingTouchItem = onSetPendingTouchItem || setPendingTouchItem;
  const [touchStartTime, setTouchStartTime] = useState(0);
  const [touchStartPos, setTouchStartPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const trashRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const handleMouseDown = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    const item = items.find(i => i.id === id);
    if (!item || !containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const relativeX = e.clientX - containerRect.left;
    const relativeY = e.clientY - containerRect.top;
    
    setDragItem(id);
    setDragOffset({
      x: relativeX - item.x,
      y: relativeY - item.y
    });
    
    const maxZ = Math.max(...items.map(i => i.z), 0);
    onUpdateItem(id, { z: maxZ + 1 });
  };

  const handleTouchStart = (id: string, e: React.TouchEvent) => {
    // Don't prevent default if we're starting a drag from sidebar
    if (pendingTouchItem) {
      e.preventDefault();
    }
    
    const item = items.find(i => i.id === id);
    if (!item || !containerRef.current || e.touches.length !== 1) return;
    
    const touch = e.touches[0];
    const containerRect = containerRef.current.getBoundingClientRect();
    const relativeX = touch.clientX - containerRect.left;
    const relativeY = touch.clientY - containerRect.top;
    
    // Store touch start info to detect if it's a tap or drag
    setTouchStartTime(Date.now());
    setTouchStartPos({ x: touch.clientX, y: touch.clientY });
    
    // If we have a pending item from sidebar, place it first
    if (currentPendingTouchItem) {
      e.preventDefault();
      if (currentPendingTouchItem.type === 'image' && onDropImage) {
        onDropImage(currentPendingTouchItem.data, relativeX - 100, relativeY - 100);
      } else if (currentPendingTouchItem.type === 'sticker' && onDropSticker) {
        onDropSticker(currentPendingTouchItem.data, relativeX - 30, relativeY - 30);
      } else if (currentPendingTouchItem.type === 'note' && onDropNote) {
        const noteData = currentPendingTouchItem.data;
        onDropNote(noteData.text || 'write here...', noteData.color || 'default', noteData.font, noteData.fontWeight, noteData.letterSpacing, noteData.isItalic, noteData.isUnderline, noteData.textColor, relativeX - 110, relativeY - 40);
      } else if (currentPendingTouchItem.type === 'text' && onDropText) {
        const textData = currentPendingTouchItem.data;
        onDropText(textData.text || 'text', textData.font, textData.fontWeight, textData.isItalic, textData.isUnderline, textData.textColor, relativeX - 100, relativeY - 15);
      }
      setCurrentPendingTouchItem(null);
      // Now start dragging the newly placed item
      setDragItem(id);
      setDragOffset({
        x: relativeX - item.x,
        y: relativeY - item.y
      });
      const maxZ = Math.max(...items.map(i => i.z), 0);
      onUpdateItem(id, { z: maxZ + 1 });
      return;
    }
    
    e.preventDefault();
    setDragItem(id);
    setDragOffset({
      x: relativeX - item.x,
      y: relativeY - item.y
    });
    
    const maxZ = Math.max(...items.map(i => i.z), 0);
    onUpdateItem(id, { z: maxZ + 1 });
  };

  const handleRotateStart = (id: string, e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const item = items.find(i => i.id === id);
    if (!item) return;
    
    // Get the actual element to calculate its center
    const element = itemRefs.current.get(id);
    if (!element) return;
    
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Handle both mouse and touch events
    const clientX = 'touches' in e ? e.touches[0]?.clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0]?.clientY : e.clientY;
    
    if (clientX === undefined || clientY === undefined) return;
    
    // Calculate initial angle from center to touch/mouse
    const deltaX = clientX - centerX;
    const deltaY = clientY - centerY;
    const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
    
    setRotatingItem(id);
    setRotationCenter({ x: centerX, y: centerY });
    setInitialAngle(angle);
    setStartRotation(item.rotation || 0);
    
    const maxZ = Math.max(...items.map(i => i.z), 0);
    onUpdateItem(id, { z: maxZ + 1 });
  };

  const handleResizeStart = (id: string, e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const item = items.find(i => i.id === id);
    if (!item) return;
    
    // Handle both mouse and touch events
    const clientX = 'touches' in e ? e.touches[0]?.clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0]?.clientY : e.clientY;
    
    if (clientX === undefined || clientY === undefined) return;
    
    setResizingItem(id);
    setResizeStart({
      x: clientX,
      y: clientY,
      width: item.width
    });
    
    const maxZ = Math.max(...items.map(i => i.z), 0);
    onUpdateItem(id, { z: maxZ + 1 });
  };

  const checkIfOverTrash = (clientX: number, clientY: number): boolean => {
    if (!trashRef.current) return false;
    const trashRect = trashRef.current.getBoundingClientRect();
    return (
      clientX >= trashRect.left &&
      clientX <= trashRect.right &&
      clientY >= trashRect.top &&
      clientY <= trashRect.bottom
    );
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const relativeX = e.clientX - containerRect.left;
    const relativeY = e.clientY - containerRect.top;
    
    // Handle resize
    if (resizingItem) {
      const deltaX = e.clientX - resizeStart.x;
      const deltaY = e.clientY - resizeStart.y;
      // Use the larger of the two deltas for proportional scaling
      const delta = Math.max(deltaX, deltaY);
      const newWidth = Math.max(40, Math.min(600, resizeStart.width + delta)); // Min 40px, max 600px
      
      onUpdateItem(resizingItem, { width: newWidth });
      return;
    }
    
    // Handle rotation
    if (rotatingItem) {
      // Calculate current angle from center to mouse
      const deltaX = e.clientX - rotationCenter.x;
      const deltaY = e.clientY - rotationCenter.y;
      const currentAngle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
      
      // Calculate rotation delta and apply to starting rotation
      const angleDelta = currentAngle - initialAngle;
      const newRotation = startRotation + angleDelta;
      
      onUpdateItem(rotatingItem, { rotation: newRotation });
      return;
    }
    
    // Handle drag
    if (!dragItem) return;

    const x = relativeX - dragOffset.x;
    const y = relativeY - dragOffset.y;

    onUpdateItem(dragItem, { x, y });
    
    // Check if hovering over trash
    setIsOverTrash(checkIfOverTrash(e.clientX, e.clientY));
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!containerRef.current || e.touches.length !== 1) {
      // If we have pending item and multiple touches, cancel it
      if (currentPendingTouchItem) {
        setCurrentPendingTouchItem(null);
      }
      return;
    }
    
    e.preventDefault();
    const touch = e.touches[0];
    
      // If we have a pending item and user moved significantly, place it
      if (currentPendingTouchItem) {
      const moveDistance = Math.sqrt(
        Math.pow(touch.clientX - touchStartPos.x, 2) + 
        Math.pow(touch.clientY - touchStartPos.y, 2)
      );
      // If moved more than 10px, place the item
      if (moveDistance > 10) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const relativeX = touch.clientX - containerRect.left;
        const relativeY = touch.clientY - containerRect.top;
        
        if (currentPendingTouchItem.type === 'image' && onDropImage) {
          onDropImage(currentPendingTouchItem.data, relativeX - 100, relativeY - 100);
        } else if (currentPendingTouchItem.type === 'sticker' && onDropSticker) {
          onDropSticker(currentPendingTouchItem.data, relativeX - 30, relativeY - 30);
        } else if (currentPendingTouchItem.type === 'note' && onDropNote) {
          const noteData = currentPendingTouchItem.data;
          onDropNote(noteData.text || 'write here...', noteData.color || 'default', noteData.font, noteData.fontWeight, noteData.letterSpacing, noteData.isItalic, noteData.isUnderline, noteData.textColor, relativeX - 110, relativeY - 40);
        } else if (currentPendingTouchItem.type === 'text' && onDropText) {
          const textData = currentPendingTouchItem.data;
          onDropText(textData.text || 'text', textData.font, textData.fontWeight, textData.isItalic, textData.isUnderline, textData.textColor, relativeX - 100, relativeY - 15);
        }
        setCurrentPendingTouchItem(null);
        return;
      }
    }
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const relativeX = touch.clientX - containerRect.left;
    const relativeY = touch.clientY - containerRect.top;
    
    // Handle resize
    if (resizingItem) {
      const deltaX = touch.clientX - resizeStart.x;
      const deltaY = touch.clientY - resizeStart.y;
      // Use the larger of the two deltas for proportional scaling
      const delta = Math.max(deltaX, deltaY);
      const newWidth = Math.max(40, Math.min(600, resizeStart.width + delta)); // Min 40px, max 600px
      
      onUpdateItem(resizingItem, { width: newWidth });
      return;
    }
    
    // Handle rotation
    if (rotatingItem) {
      // Calculate current angle from center to touch
      const deltaX = touch.clientX - rotationCenter.x;
      const deltaY = touch.clientY - rotationCenter.y;
      const currentAngle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
      
      // Calculate rotation delta and apply to starting rotation
      const angleDelta = currentAngle - initialAngle;
      const newRotation = startRotation + angleDelta;
      
      onUpdateItem(rotatingItem, { rotation: newRotation });
      return;
    }
    
    // Handle drag
    if (!dragItem) return;

    const x = relativeX - dragOffset.x;
    const y = relativeY - dragOffset.y;

    onUpdateItem(dragItem, { x, y });
    
    // Check if hovering over trash
    setIsOverTrash(checkIfOverTrash(touch.clientX, touch.clientY));
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (resizingItem) {
      setResizingItem(null);
      return;
    }
    
    if (rotatingItem) {
      setRotatingItem(null);
      setInitialAngle(0);
      setStartRotation(0);
      return;
    }
    
    if (dragItem && checkIfOverTrash(e.clientX, e.clientY)) {
      onDeleteItem(dragItem);
    }
    setDragItem(null);
    setIsOverTrash(false);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touch = e.changedTouches[0];
    
    // If we have a pending item and it was a quick tap, place it
    if (currentPendingTouchItem && touch) {
      const timeDiff = Date.now() - touchStartTime;
      const moveDistance = Math.sqrt(
        Math.pow(touch.clientX - touchStartPos.x, 2) + 
        Math.pow(touch.clientY - touchStartPos.y, 2)
      );
      
      // If it was a quick tap (< 300ms) and didn't move much (< 10px), place the item
      if (timeDiff < 300 && moveDistance < 10 && containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const relativeX = touch.clientX - containerRect.left;
        const relativeY = touch.clientY - containerRect.top;
        
        if (currentPendingTouchItem.type === 'image' && onDropImage) {
          onDropImage(currentPendingTouchItem.data, relativeX - 100, relativeY - 100);
        } else if (currentPendingTouchItem.type === 'sticker' && onDropSticker) {
          onDropSticker(currentPendingTouchItem.data, relativeX - 30, relativeY - 30);
        } else if (currentPendingTouchItem.type === 'note' && onDropNote) {
          const noteData = currentPendingTouchItem.data;
          onDropNote(noteData.text || 'write here...', noteData.color || 'default', noteData.font, noteData.fontWeight, noteData.letterSpacing, noteData.isItalic, noteData.isUnderline, noteData.textColor, relativeX - 110, relativeY - 40);
        } else if (currentPendingTouchItem.type === 'text' && onDropText) {
          const textData = currentPendingTouchItem.data;
          onDropText(textData.text || 'text', textData.font, textData.fontWeight, textData.isItalic, textData.isUnderline, textData.textColor, relativeX - 100, relativeY - 15);
        }
      }
      setCurrentPendingTouchItem(null);
    }
    
    if (resizingItem) {
      setResizingItem(null);
      return;
    }
    
    if (rotatingItem) {
      setRotatingItem(null);
      setInitialAngle(0);
      setStartRotation(0);
      return;
    }
    
    if (dragItem && touch && checkIfOverTrash(touch.clientX, touch.clientY)) {
      onDeleteItem(dragItem);
    }
    setDragItem(null);
    setIsOverTrash(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isDraggingFromSidebar) {
      e.dataTransfer.dropEffect = 'copy';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const dropX = e.clientX - containerRect.left;
    const dropY = e.clientY - containerRect.top;
    
    const dataType = e.dataTransfer.getData('application/x-item-type');
    const data = e.dataTransfer.getData('text/plain');
    
    if (dataType === 'image' && onDropImage && data) {
      onDropImage(data, dropX - 100, dropY - 100);
    } else if (dataType === 'sticker' && onDropSticker && data) {
      onDropSticker(data, dropX - 30, dropY - 30);
    } else if (dataType === 'note' && onDropNote && data) {
      try {
        const noteData = JSON.parse(data);
        onDropNote(
          noteData.text || 'write here...', 
          noteData.color || 'default', 
          noteData.font, 
          noteData.fontWeight, 
          noteData.letterSpacing, 
          noteData.isItalic, 
          noteData.isUnderline, 
          noteData.textColor, 
          dropX - 110, 
          dropY - 40
        );
      } catch (e) {
        // Fallback for old format
        onDropNote(data || 'write here...', 'default', undefined, undefined, undefined, false, false, undefined, dropX - 110, dropY - 40);
      }
    } else if (dataType === 'text' && onDropText && data) {
      try {
        const textData = JSON.parse(data);
        onDropText(
          textData.text || 'text', 
          textData.font, 
          textData.fontWeight, 
          textData.isItalic, 
          textData.isUnderline, 
          textData.textColor, 
          dropX - 100, 
          dropY - 15
        );
      } catch (e) {
        // Fallback for old format
        onDropText(data || 'text', undefined, undefined, false, false, undefined, dropX - 100, dropY - 15);
      }
    }
    
    setIsDraggingFromSidebar(false);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.types.includes('text/plain')) {
      setIsDraggingFromSidebar(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!containerRef.current?.contains(e.relatedTarget as Node)) {
      setIsDraggingFromSidebar(false);
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`w-full h-full canvas overflow-hidden relative cursor-crosshair transition-all ${isPrivateMode ? 'private-blur' : ''} ${isDraggingFromSidebar ? 'ring-2 ring-blue-400 ring-opacity-50' : ''}`}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => { setDragItem(null); setRotatingItem(null); setResizingItem(null); setIsOverTrash(false); setInitialAngle(0); setStartRotation(0); }}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={(e) => {
        setCurrentPendingTouchItem(null);
        handleTouchEnd(e);
      }}
      onTouchStart={(e) => {
        // If touching empty board area and we have a pending item, place it
        if (currentPendingTouchItem && e.touches.length === 1 && containerRef.current) {
          const touch = e.touches[0];
          const containerRect = containerRef.current.getBoundingClientRect();
          const relativeX = touch.clientX - containerRect.left;
          const relativeY = touch.clientY - containerRect.top;
          
          // Check if touch is on an existing item
          const touchTarget = e.target as HTMLElement;
          const isOnItem = touchTarget.closest('[data-item-id]');
          
          if (!isOnItem) {
            // Place the pending item
            if (currentPendingTouchItem.type === 'image' && onDropImage) {
              onDropImage(currentPendingTouchItem.data, relativeX - 100, relativeY - 100);
            } else if (currentPendingTouchItem.type === 'sticker' && onDropSticker) {
              onDropSticker(currentPendingTouchItem.data, relativeX - 30, relativeY - 30);
            } else if (currentPendingTouchItem.type === 'note' && onDropNote) {
              const noteData = currentPendingTouchItem.data;
              onDropNote(noteData.text || 'write here...', noteData.color || 'default', noteData.font, noteData.fontWeight, noteData.letterSpacing, noteData.isItalic, noteData.isUnderline, noteData.textColor, relativeX - 110, relativeY - 40);
            } else if (currentPendingTouchItem.type === 'text' && onDropText) {
              const textData = currentPendingTouchItem.data;
              onDropText(textData.text || 'text', textData.font, textData.fontWeight, textData.isItalic, textData.isUnderline, textData.textColor, relativeX - 100, relativeY - 15);
            }
            setCurrentPendingTouchItem(null);
            setTouchStartTime(Date.now());
            setTouchStartPos({ x: touch.clientX, y: touch.clientY });
          }
        }
      }}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      style={{ touchAction: 'none' }}
    >
      {/* Board Items */}
      {items.map((item) => (
        <div
          key={item.id}
          ref={(el) => {
            if (el) itemRefs.current.set(item.id, el);
            else itemRefs.current.delete(item.id);
          }}
          className={`absolute select-none cursor-grab ${dragItem === item.id ? 'cursor-grabbing' : ''} ${rotatingItem === item.id ? 'cursor-grabbing' : ''}`}
          style={{
            left: item.x,
            top: item.y,
            zIndex: item.z,
            width: item.width,
            transform: `rotate(${item.rotation || 0}deg)`,
            transformOrigin: 'center center',
            touchAction: 'none',
          }}
          onMouseDown={(e) => handleMouseDown(item.id, e)}
          onTouchStart={(e) => handleTouchStart(item.id, e)}
          onMouseEnter={() => setHoveredItem(item.id)}
          onMouseLeave={() => setHoveredItem(null)}
        >
          {/* Image Card */}
          {item.type === 'image' && (
            <div className="relative">
              {/* Rotation Handle - Outside overflow container */}
              {(hoveredItem === item.id || rotatingItem === item.id) && (
                <div
                  className="absolute -top-10 left-1/2 -translate-x-1/2 flex flex-col items-center cursor-grab z-50"
                  onMouseDown={(e) => handleRotateStart(item.id, e)}
                  onTouchStart={(e) => handleRotateStart(item.id, e)}
                  style={{ touchAction: 'none' }}
                >
                  <div className="w-7 h-7 rounded-full bg-blue-500 border-2 border-white shadow-lg flex items-center justify-center hover:bg-blue-600 hover:scale-110 transition-all">
                    <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className="w-0.5 h-5 bg-blue-500"></div>
                </div>
              )}
              {/* Delete Button - Outside overflow container */}
            <button 
                onClick={(e) => { e.stopPropagation(); onDeleteItem(item.id); }}
                className="absolute -top-3 -right-3 w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg flex items-center justify-center z-50 transition-opacity"
                style={{ opacity: hoveredItem === item.id ? 1 : 0 }}
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
              {/* Resize Handle - Bottom right corner */}
              {(hoveredItem === item.id || resizingItem === item.id) && (
                <div
                  className="absolute -bottom-3 -right-3 w-7 h-7 bg-green-500 hover:bg-green-600 rounded-full shadow-lg flex items-center justify-center z-50 cursor-se-resize transition-all hover:scale-110"
                  onMouseDown={(e) => handleResizeStart(item.id, e)}
                  onTouchStart={(e) => handleResizeStart(item.id, e)}
                  style={{ touchAction: 'none' }}
                >
                  <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M4 20h16M20 4v16M4 4l16 16" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}
              {/* Image container */}
              <div className={`card-item overflow-hidden ${dragItem === item.id ? 'dragging' : ''}`}>
                <img 
                  src={item.content} 
                  alt="Vision"
                  className="w-full h-auto block"
                  draggable={false}
                />
              </div>
              </div>
            )}

          {/* Note Card */}
          {item.type === 'note' && (
            <div className="relative">
              {/* Rotation Handle for Notes */}
              {(hoveredItem === item.id || rotatingItem === item.id) && (
                <div
                  className="absolute -top-10 left-1/2 -translate-x-1/2 flex flex-col items-center cursor-grab z-50"
                  onMouseDown={(e) => handleRotateStart(item.id, e)}
                  onTouchStart={(e) => handleRotateStart(item.id, e)}
                  style={{ touchAction: 'none' }}
                >
                  <div className="w-7 h-7 rounded-full bg-blue-500 border-2 border-white shadow-lg flex items-center justify-center hover:bg-blue-600 hover:scale-110 transition-all">
                    <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className="w-0.5 h-5 bg-blue-500"></div>
                </div>
              )}
              {/* Delete Button for Notes */}
              <button
                onClick={(e) => { e.stopPropagation(); onDeleteItem(item.id); }}
                className="absolute -top-3 -right-3 w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg flex items-center justify-center z-50 transition-opacity"
                style={{ opacity: hoveredItem === item.id ? 1 : 0 }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div 
                className={`card-item ${getColorClass(item.color)} p-4 ${dragItem === item.id ? 'dragging' : ''}`}
                style={{ minHeight: '80px' }}
              >
                <p 
                  className="text-sm leading-relaxed whitespace-pre-wrap"
                  style={{ 
                    fontFamily: item.font || "'Inter', sans-serif",
                    fontWeight: item.fontWeight === 'light' ? 300 : item.fontWeight === 'medium' ? 500 : item.fontWeight === 'bold' ? 700 : 400,
                    letterSpacing: item.letterSpacing === 'tight' ? '-0.02em' : item.letterSpacing === 'airy' ? '0.05em' : '0',
                    fontStyle: item.isItalic ? 'italic' : 'normal',
                    textDecoration: item.isUnderline ? 'underline' : 'none',
                    color: item.textColor || '#374151'
                  }}
                >
                  {item.content}
                </p>
              </div>
            </div>
          )}

          {/* Text (for headings/labels) */}
          {item.type === 'text' && (
            <div className={`relative ${dragItem === item.id ? 'opacity-90' : ''}`}>
              {/* Rotation Handle for Text */}
              {(hoveredItem === item.id || rotatingItem === item.id) && (
                <div
                  className="absolute -top-10 left-1/2 -translate-x-1/2 flex flex-col items-center cursor-grab z-50"
                  onMouseDown={(e) => handleRotateStart(item.id, e)}
                  onTouchStart={(e) => handleRotateStart(item.id, e)}
                  style={{ touchAction: 'none' }}
                >
                  <div className="w-7 h-7 rounded-full bg-blue-500 border-2 border-white shadow-lg flex items-center justify-center hover:bg-blue-600 hover:scale-110 transition-all">
                    <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className="w-0.5 h-5 bg-blue-500"></div>
                </div>
              )}
              {/* Delete Button for Text */}
              <button
                onClick={(e) => { e.stopPropagation(); onDeleteItem(item.id); }}
                className="absolute -top-3 -right-3 w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg flex items-center justify-center z-50 transition-opacity"
                style={{ opacity: hoveredItem === item.id ? 1 : 0 }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <p 
                className="text-lg"
                style={{ 
                  fontFamily: item.font || "'Playfair Display', serif",
                  fontWeight: item.fontWeight === 'light' ? 300 : item.fontWeight === 'medium' ? 500 : item.fontWeight === 'bold' ? 700 : 400,
                  fontStyle: item.isItalic ? 'italic' : 'normal',
                  textDecoration: item.isUnderline ? 'underline' : 'none',
                  color: item.textColor || '#1f2937'
                }}
              >
                {item.content}
              </p>
            </div>
          )}

          {/* Sticker */}
          {item.type === 'sticker' && (
            <div 
              className={`relative ${dragItem === item.id ? 'opacity-90 scale-105' : ''} transition-transform`}
              style={{ width: item.width }}
            >
              {/* Rotation Handle for Stickers */}
              {(hoveredItem === item.id || rotatingItem === item.id) && (
                <div
                  className="absolute -top-10 left-1/2 -translate-x-1/2 flex flex-col items-center cursor-grab z-50"
                  onMouseDown={(e) => handleRotateStart(item.id, e)}
                  onTouchStart={(e) => handleRotateStart(item.id, e)}
                  style={{ touchAction: 'none' }}
                >
                  <div className="w-7 h-7 rounded-full bg-blue-500 border-2 border-white shadow-lg flex items-center justify-center hover:bg-blue-600 hover:scale-110 transition-all">
                    <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className="w-0.5 h-5 bg-blue-500"></div>
                </div>
              )}
              {/* Delete Button for Stickers */}
              <button
                onClick={(e) => { e.stopPropagation(); onDeleteItem(item.id); }}
                className="absolute -top-3 -right-3 w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg flex items-center justify-center z-50 transition-opacity"
                style={{ opacity: hoveredItem === item.id ? 1 : 0 }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              {/* Resize Handle for Stickers */}
              {(hoveredItem === item.id || resizingItem === item.id) && (
                <div
                  className="absolute -bottom-3 -right-3 w-7 h-7 bg-green-500 hover:bg-green-600 rounded-full shadow-lg flex items-center justify-center z-50 cursor-se-resize transition-all hover:scale-110"
                  onMouseDown={(e) => handleResizeStart(item.id, e)}
                  onTouchStart={(e) => handleResizeStart(item.id, e)}
                  style={{ touchAction: 'none' }}
                >
                  <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M4 20h16M20 4v16M4 4l16 16" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
              </div>
            )}
              <img 
                src={item.content} 
                alt="Sticker"
                className="w-full h-auto drop-shadow-md"
                draggable={false}
              />
          </div>
          )}

          {/* Shape */}
          {item.type === 'shape' && item.shapeType && (
            <div 
              className={`relative ${dragItem === item.id ? 'opacity-90 scale-105' : ''} transition-transform cursor-grab`}
              style={{ width: item.width, height: item.height || item.width }}
            >
              {/* Invisible hit area for better mouse interaction */}
              <div 
                className="absolute inset-0 z-10"
                style={{ backgroundColor: 'transparent' }}
              />
              {/* Rotation Handle for Shapes */}
              {(hoveredItem === item.id || rotatingItem === item.id) && (
                <div
                  className="absolute -top-10 left-1/2 -translate-x-1/2 flex flex-col items-center cursor-grab z-50"
                  onMouseDown={(e) => handleRotateStart(item.id, e)}
                  onTouchStart={(e) => handleRotateStart(item.id, e)}
                  style={{ touchAction: 'none' }}
                >
                  <div className="w-7 h-7 rounded-full bg-blue-500 border-2 border-white shadow-lg flex items-center justify-center hover:bg-blue-600 hover:scale-110 transition-all">
                    <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className="w-0.5 h-5 bg-blue-500"></div>
                </div>
              )}
              {/* Delete Button for Shapes */}
              {(hoveredItem === item.id) && (
                <button
                  onClick={(e) => { e.stopPropagation(); onDeleteItem(item.id); }}
                  className="absolute -top-3 -right-3 w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg flex items-center justify-center z-50"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              {/* Resize Handle for Shapes */}
              {(hoveredItem === item.id || resizingItem === item.id) && (
                <div
                  className="absolute -bottom-3 -right-3 w-7 h-7 bg-green-500 hover:bg-green-600 rounded-full shadow-lg flex items-center justify-center z-50 cursor-se-resize transition-all hover:scale-110"
                  onMouseDown={(e) => handleResizeStart(item.id, e)}
                  onTouchStart={(e) => handleResizeStart(item.id, e)}
                  style={{ touchAction: 'none' }}
                >
                  <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M4 20h16M20 4v16M4 4l16 16" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}
              <div className="pointer-events-none">
                {renderShape(
                  item.shapeType,
                  item.width,
                  item.height || item.width,
                  item.fillColor || '#3b82f6',
                  item.strokeColor || '#000000',
                  item.strokeWidth || 2,
                  item.opacity || 1
                )}
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Empty State */}
      {items.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center max-w-xs">
            <div className="text-4xl mb-4">🌙</div>
            <h3 className="text-lg font-medium text-gray-700 mb-2 lowercase">start softly</h3>
            <p className="text-sm text-gray-400 italic leading-relaxed">
              choose a vibe, add what inspires you.<br/>
              this is yours.
            </p>
          </div>
        </div>
      )}

      {/* Trash Drop Zone */}
      <div
        ref={trashRef}
        className={`absolute bottom-6 right-6 w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-200 z-50 ${
          dragItem 
            ? isOverTrash
              ? 'bg-red-500 scale-125 shadow-lg shadow-red-500/30' 
              : 'bg-gray-200/80 backdrop-blur-sm scale-100 animate-pulse'
            : 'bg-gray-100/60 backdrop-blur-sm opacity-50 hover:opacity-100'
        }`}
      >
        <svg 
          className={`w-7 h-7 transition-colors duration-200 ${
            isOverTrash ? 'text-white' : dragItem ? 'text-gray-600' : 'text-gray-400'
          }`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={1.5} 
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
          />
        </svg>
      </div>

    </div>
  );
};

export default BoardView;
