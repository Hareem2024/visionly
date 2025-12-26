
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import BoardView from './components/BoardView';
import ExportModal from './components/ExportModal';
import { VisionDocumentModal } from './components/VisionDocumentModal';
import { VisionBoard, BoardItem, AppState, NoteColor, FontWeight, LetterSpacing, SavedBoard, ShapeType, SavedUpload } from './types';
import { FONT_PAIRINGS, NOTE_FONTS } from './data/fonts';
import { generateVibeName } from './services/gemini';
import { generateVisionDocument, VisionDocument } from './services/visionML';

const STORAGE_KEY = 'vision-boards-saved';
const UPLOADS_STORAGE_KEY = 'vision-boards-uploads';

const createNewBoard = (): VisionBoard => ({
  id: Math.random().toString(36).substr(2, 9),
  title: 'untitled vision',
  items: [],
  fontPairing: 'soft-girl',
});

const INITIAL_BOARD: VisionBoard = createNewBoard();

const App: React.FC = () => {
  // Load initial data from localStorage before setting state
  const loadInitialData = (): AppState => {
    let savedBoards: SavedBoard[] = [];
    let savedUploads: SavedUpload[] = [];
    
    try {
      const boardsData = localStorage.getItem(STORAGE_KEY);
      if (boardsData) {
        savedBoards = JSON.parse(boardsData) as SavedBoard[];
      }
    } catch (e) {
      console.error('Failed to load saved boards:', e);
    }
    
    try {
      const uploadsData = localStorage.getItem(UPLOADS_STORAGE_KEY);
      if (uploadsData) {
        savedUploads = JSON.parse(uploadsData) as SavedUpload[];
      }
    } catch (e) {
      console.error('Failed to load saved uploads:', e);
    }
    
    return {
      currentBoard: INITIAL_BOARD,
      isGenerating: false,
      statusMessage: '',
      savedBoards,
      savedUploads
    };
  };

  const [state, setState] = useState<AppState>(loadInitialData());
  const [showExportModal, setShowExportModal] = useState(false);
  const [showVisionDocModal, setShowVisionDocModal] = useState(false);
  const [visionDocument, setVisionDocument] = useState<VisionDocument | null>(null);
  const [visionDocLoading, setVisionDocLoading] = useState(false);
  const [visionDocProgress, setVisionDocProgress] = useState(0);
  const [visionDocStatus, setVisionDocStatus] = useState('');
  const [pendingTouchItem, setPendingTouchItem] = useState<{ type: string; data: any } | null>(null);
  const [vibeName, setVibeName] = useState<string>('');
  const [vibeAffirmation, setVibeAffirmation] = useState<string>('');
  const [isPrivateMode, setIsPrivateMode] = useState(false);
  const [currentFontPairing, setCurrentFontPairing] = useState('soft-girl');
  const [hasLoadedInitialData, setHasLoadedInitialData] = useState(false);

  // Mark that initial data has been loaded
  useEffect(() => {
    setHasLoadedInitialData(true);
  }, []);

  // Save boards to localStorage whenever savedBoards changes (but not on initial load)
  useEffect(() => {
    if (!hasLoadedInitialData) return; // Don't save during initial load
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.savedBoards));
    } catch (e) {
      console.error('Failed to save boards:', e);
    }
  }, [state.savedBoards, hasLoadedInitialData]);

  // Save uploads to localStorage whenever savedUploads changes (but not on initial load)
  useEffect(() => {
    if (!hasLoadedInitialData) return; // Don't save during initial load
    
    try {
      localStorage.setItem(UPLOADS_STORAGE_KEY, JSON.stringify(state.savedUploads));
    } catch (e) {
      console.error('Failed to save uploads:', e);
      // If localStorage is full, try to clear old data or compress
      if (e instanceof DOMException && e.code === 22) {
        console.warn('localStorage quota exceeded. Consider removing old uploads.');
      }
    }
  }, [state.savedUploads, hasLoadedInitialData]);

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.substring(1);
      if (hash) {
        try {
          const decoded = JSON.parse(atob(hash));
          setState(prev => ({ ...prev, currentBoard: decoded }));
        } catch (e) {
          console.error("Invalid share link");
        }
      }
    };
    window.addEventListener('hashchange', handleHash);
    handleHash();
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const addImageToBoard = (base64: string, x?: number, y?: number) => {
    // If x and y are provided, use them (from drag-and-drop)
    // Otherwise, place at center as fallback
    let finalX = x;
    let finalY = y;
    
    if (finalX === undefined || finalY === undefined) {
      const sidebarWidth = 288;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const boardWidth = viewportWidth - sidebarWidth;
      finalX = boardWidth / 2 - 100;
      finalY = viewportHeight / 2 - 100;
    }
    
    // Get the highest z-index from existing items and add 1
    const maxZ = state.currentBoard.items.length > 0 
      ? Math.max(...state.currentBoard.items.map(i => i.z || 0))
      : 0;
    
    const newItem: BoardItem = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'image',
      content: base64,
      x: finalX,
      y: finalY,
      z: maxZ + 1,
      width: 200,
    };
    setState(prev => ({
      ...prev,
      currentBoard: {
        ...prev.currentBoard,
        items: [...prev.currentBoard.items, newItem]
      },
      statusMessage: 'added ✨'
    }));
    setTimeout(() => setState(prev => ({ ...prev, statusMessage: '' })), 2000);
  };

  const saveUpload = (base64: string, fileName: string) => {
    const newUpload: SavedUpload = {
      id: Math.random().toString(36).substr(2, 9),
      data: base64,
      name: fileName || 'image',
      uploadedAt: Date.now(),
    };
    setState(prev => ({
      ...prev,
      savedUploads: [...prev.savedUploads, newUpload],
      statusMessage: 'saved to uploads ✨'
    }));
    setTimeout(() => setState(prev => ({ ...prev, statusMessage: '' })), 2000);
  };

  const deleteUpload = (uploadId: string) => {
    setState(prev => ({
      ...prev,
      savedUploads: prev.savedUploads.filter(u => u.id !== uploadId),
      statusMessage: 'removed from uploads'
    }));
    setTimeout(() => setState(prev => ({ ...prev, statusMessage: '' })), 2000);
  };

  const addUploadToBoard = (uploadData: string, x?: number, y?: number) => {
    addImageToBoard(uploadData, x, y);
  };

  const addNoteToBoard = (text: string, color: NoteColor, font?: string, fontWeight?: FontWeight, letterSpacing?: LetterSpacing, isItalic?: boolean, isUnderline?: boolean, textColor?: string, x?: number, y?: number) => {
    let finalX = x;
    let finalY = y;
    
    if (finalX === undefined || finalY === undefined) {
      finalX = 120 + Math.random() * 180;
      finalY = 100 + Math.random() * 120;
    }
    
    // Get the highest z-index from existing items and add 1
    const maxZ = state.currentBoard.items.length > 0 
      ? Math.max(...state.currentBoard.items.map(i => i.z || 0))
      : 0;
    
    const newItem: BoardItem = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'note',
      content: text,
      x: finalX,
      y: finalY,
      z: maxZ + 1,
      width: 220,
      color: color,
      font: font,
      fontWeight: fontWeight,
      letterSpacing: letterSpacing,
      isItalic: isItalic,
      isUnderline: isUnderline,
      textColor: textColor,
    };
    setState(prev => ({
      ...prev,
      currentBoard: {
        ...prev.currentBoard,
        items: [...prev.currentBoard.items, newItem]
      },
      statusMessage: 'noted'
    }));
    setTimeout(() => setState(prev => ({ ...prev, statusMessage: '' })), 2000);
  };

  const addTextToBoard = (text: string, font?: string, fontWeight?: FontWeight, isItalic?: boolean, isUnderline?: boolean, textColor?: string, x?: number, y?: number) => {
    let finalX = x;
    let finalY = y;
    
    if (finalX === undefined || finalY === undefined) {
      finalX = 100 + Math.random() * 200;
      finalY = 60 + Math.random() * 100;
    }
    
    // Get the highest z-index from existing items and add 1
    const maxZ = state.currentBoard.items.length > 0 
      ? Math.max(...state.currentBoard.items.map(i => i.z || 0))
      : 0;
    
    const newItem: BoardItem = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'text',
      content: text,
      x: finalX,
      y: finalY,
      z: maxZ + 1,
      width: 200,
      font: font,
      fontWeight: fontWeight,
      isItalic: isItalic,
      isUnderline: isUnderline,
      textColor: textColor,
    };
    setState(prev => ({
      ...prev,
      currentBoard: {
        ...prev.currentBoard,
        items: [...prev.currentBoard.items, newItem]
      },
      statusMessage: 'manifesting'
    }));
    setTimeout(() => setState(prev => ({ ...prev, statusMessage: '' })), 2000);
  };

  const handleChangeFontPairing = (pairingId: string) => {
    setCurrentFontPairing(pairingId);
    const pairing = FONT_PAIRINGS.find(p => p.id === pairingId);
    setState(prev => ({
      ...prev,
      currentBoard: {
        ...prev.currentBoard,
        fontPairing: pairingId
      },
      statusMessage: pairing ? `${pairing.name} — ${pairing.vibe}` : ''
    }));
    setTimeout(() => setState(prev => ({ ...prev, statusMessage: '' })), 2000);
  };

  const addStickerToBoard = (url: string, x?: number, y?: number) => {
    let finalX = x;
    let finalY = y;
    
    if (finalX === undefined || finalY === undefined) {
      finalX = 150 + Math.random() * 250;
      finalY = 100 + Math.random() * 200;
    }
    
    // Get the highest z-index from existing items and add 1
    const maxZ = state.currentBoard.items.length > 0 
      ? Math.max(...state.currentBoard.items.map(i => i.z || 0))
      : 0;
    
    const newItem: BoardItem = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'sticker',
      content: url,
      x: finalX,
      y: finalY,
      z: maxZ + 1,
      width: 60 + Math.random() * 40,
    };
    setState(prev => ({
      ...prev,
      currentBoard: {
        ...prev.currentBoard,
        items: [...prev.currentBoard.items, newItem]
      },
      statusMessage: '🎀'
    }));
    setTimeout(() => setState(prev => ({ ...prev, statusMessage: '' })), 2000);
  };

  const addShapeToBoard = (shapeType: ShapeType, fillColor: string, strokeColor: string, strokeWidth: number, opacity: number) => {
    const isSquare = shapeType === 'square';
    const isCircle = shapeType === 'circle';
    const baseSize = 80 + Math.random() * 40;
    
    // Get the highest z-index from existing items and add 1
    const maxZ = state.currentBoard.items.length > 0 
      ? Math.max(...state.currentBoard.items.map(i => i.z || 0))
      : 0;
    
    const newItem: BoardItem = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'shape',
      content: shapeType,
      x: 150 + Math.random() * 200,
      y: 100 + Math.random() * 150,
      z: maxZ + 1,
      width: isSquare || isCircle ? baseSize : baseSize * 1.5,
      height: isSquare || isCircle ? baseSize : baseSize,
      shapeType,
      fillColor,
      strokeColor,
      strokeWidth,
      opacity,
    };
    setState(prev => ({
      ...prev,
      currentBoard: {
        ...prev.currentBoard,
        items: [...prev.currentBoard.items, newItem]
      },
      statusMessage: 'shape added ✨'
    }));
    setTimeout(() => setState(prev => ({ ...prev, statusMessage: '' })), 2000);
  };

  const updateItemPosition = (id: string, updates: Partial<BoardItem>) => {
    setState(prev => ({
      ...prev,
      currentBoard: {
        ...prev.currentBoard,
        items: prev.currentBoard.items.map(item => 
          item.id === id ? { ...item, ...updates } : item
        )
      }
    }));
  };

  const deleteItem = (id: string) => {
    setState(prev => ({
      ...prev,
      currentBoard: {
        ...prev.currentBoard,
        items: prev.currentBoard.items.filter(item => item.id !== id)
      }
    }));
  };

  const updateTitle = (title: string) => {
    setState(prev => ({
      ...prev,
      currentBoard: { ...prev.currentBoard, title }
    }));
    setVibeName(''); // Clear vibe name when title is manually changed
  };

  const shareBoard = () => {
    if (isPrivateMode) return;
    const encoded = btoa(JSON.stringify(state.currentBoard));
    window.location.hash = encoded;
    navigator.clipboard.writeText(window.location.href);
    setState(prev => ({ ...prev, statusMessage: 'link copied 💫' }));
    setTimeout(() => setState(prev => ({ ...prev, statusMessage: '' })), 3000);
  };

  const saveCurrentBoard = () => {
    const now = Date.now();
    const existingIndex = state.savedBoards.findIndex(b => b.id === state.currentBoard.id);
    
    const savedBoard: SavedBoard = {
      ...state.currentBoard,
      createdAt: existingIndex >= 0 ? state.savedBoards[existingIndex].createdAt : now,
      updatedAt: now,
    };

    setState(prev => {
      const newSavedBoards = existingIndex >= 0
        ? prev.savedBoards.map((b, i) => i === existingIndex ? savedBoard : b)
        : [...prev.savedBoards, savedBoard];
      
      return {
        ...prev,
        savedBoards: newSavedBoards,
        statusMessage: 'saved ✨'
      };
    });
    setTimeout(() => setState(prev => ({ ...prev, statusMessage: '' })), 2000);
  };

  const loadBoard = (boardId: string) => {
    const board = state.savedBoards.find(b => b.id === boardId);
    if (board) {
      const { createdAt, updatedAt, thumbnail, ...visionBoard } = board;
      setState(prev => ({
        ...prev,
        currentBoard: visionBoard,
        statusMessage: 'loaded'
      }));
      setCurrentFontPairing(board.fontPairing || 'soft-girl');
      setVibeName('');
      setVibeAffirmation('');
      setTimeout(() => setState(prev => ({ ...prev, statusMessage: '' })), 2000);
    }
  };

  const deleteSavedBoard = (boardId: string) => {
    setState(prev => ({
      ...prev,
      savedBoards: prev.savedBoards.filter(b => b.id !== boardId),
      statusMessage: 'deleted'
    }));
    setTimeout(() => setState(prev => ({ ...prev, statusMessage: '' })), 2000);
  };

  const handleNewBoard = () => {
    const newBoard = createNewBoard();
    setState(prev => ({
      ...prev,
      currentBoard: newBoard,
      statusMessage: 'fresh start 🌱'
    }));
    setCurrentFontPairing('soft-girl');
    setVibeName('');
    setVibeAffirmation('');
    setTimeout(() => setState(prev => ({ ...prev, statusMessage: '' })), 2000);
  };

  const handleNameVision = async () => {
    if (state.currentBoard.items.length === 0) {
      setState(prev => ({ ...prev, statusMessage: 'add something first 🌙' }));
      setTimeout(() => setState(prev => ({ ...prev, statusMessage: '' })), 2000);
      return;
    }

    setState(prev => ({ ...prev, isGenerating: true, statusMessage: 'channeling the vibe...' }));
    
    // Gather content from board
    const content = state.currentBoard.items
      .filter(item => item.type === 'note' || item.type === 'text')
      .map(item => item.content)
      .join(', ');
    
    const result = await generateVibeName(content || 'peaceful life, growth, self care');
    
    setVibeName(result.title);
    setVibeAffirmation(result.affirmation);
    setState(prev => ({
      ...prev,
      currentBoard: {
        ...prev.currentBoard,
        title: result.title
      },
      isGenerating: false,
      statusMessage: result.affirmation
    }));
    setTimeout(() => setState(prev => ({ ...prev, statusMessage: '' })), 4000);
  };

  const handleGenerateVisionDoc = async () => {
    if (state.currentBoard.items.length === 0) {
      setState(prev => ({ ...prev, statusMessage: 'add notes & text first 🌙' }));
      setTimeout(() => setState(prev => ({ ...prev, statusMessage: '' })), 2000);
      return;
    }

    // Check if there are any notes or text
    const hasContent = state.currentBoard.items.some(
      item => item.type === 'note' || item.type === 'text'
    );
    
    if (!hasContent) {
      setState(prev => ({ ...prev, statusMessage: 'add some notes to analyze' }));
      setTimeout(() => setState(prev => ({ ...prev, statusMessage: '' })), 2000);
      return;
    }

    setShowVisionDocModal(true);
    setVisionDocLoading(true);
    setVisionDocument(null);
    setVisionDocProgress(0);
    setVisionDocStatus('preparing...');

    try {
      const doc = await generateVisionDocument(
        state.currentBoard.items,
        (progress, status) => {
          setVisionDocProgress(progress);
          setVisionDocStatus(status);
        }
      );
      setVisionDocument(doc);
    } catch (error) {
      console.error('Error generating vision document:', error);
      setState(prev => ({ ...prev, statusMessage: 'could not generate document' }));
    } finally {
      setVisionDocLoading(false);
    }
  };

  return (
    <div className={`relative w-full h-screen overflow-hidden flex ${isPrivateMode ? 'private-mode' : ''}`}>
      <Sidebar 
        onAddImage={addImageToBoard}
        onAddNote={addNoteToBoard}
        onAddText={addTextToBoard}
        onAddSticker={addStickerToBoard}
        onAddShape={addShapeToBoard}
        boardTitle={state.currentBoard.title}
        onTitleChange={updateTitle}
        onShare={shareBoard}
        onExport={() => setShowExportModal(true)}
        onNameVision={handleNameVision}
        onGenerateVisionDoc={handleGenerateVisionDoc}
        onChangeFontPairing={handleChangeFontPairing}
        currentFontPairing={currentFontPairing}
        isGenerating={state.isGenerating}
        statusMessage={state.statusMessage}
        vibeName={vibeName}
        isPrivateMode={isPrivateMode}
        onTogglePrivate={() => setIsPrivateMode(!isPrivateMode)}
        savedBoards={state.savedBoards}
        currentBoardId={state.currentBoard.id}
        onSaveBoard={saveCurrentBoard}
        onLoadBoard={loadBoard}
        onDeleteBoard={deleteSavedBoard}
        onNewBoard={handleNewBoard}
        savedUploads={state.savedUploads}
        onSaveUpload={saveUpload}
        onDeleteUpload={deleteUpload}
        onAddUploadToBoard={addUploadToBoard}
        onSetPendingTouchItem={setPendingTouchItem}
        pendingTouchItem={pendingTouchItem}
      />

      <main className="flex-1 relative">
        <BoardView 
          items={state.currentBoard.items} 
          onUpdateItem={updateItemPosition}
          onDeleteItem={deleteItem}
          onDropImage={addImageToBoard}
          onDropSticker={addStickerToBoard}
          onDropNote={(text, color, font, fontWeight, letterSpacing, isItalic, isUnderline, textColor, x, y) => {
            const currentFont = font || NOTE_FONTS.find(f => f.id === 'inter')?.family;
            addNoteToBoard(text, color as NoteColor, currentFont, fontWeight as any, letterSpacing as any, isItalic, isUnderline, textColor, x, y);
          }}
          onDropText={(text, font, fontWeight, isItalic, isUnderline, textColor, x, y) => {
            const pairing = FONT_PAIRINGS.find(p => p.id === currentFontPairing);
            addTextToBoard(text, font || pairing?.heading, fontWeight as any, isItalic, isUnderline, textColor, x, y);
          }}
          isPrivateMode={isPrivateMode}
          pendingTouchItem={pendingTouchItem}
          onSetPendingTouchItem={setPendingTouchItem}
        />
        
        {/* Vibe affirmation toast */}
        {vibeAffirmation && !state.statusMessage && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 bg-white/90 backdrop-blur-lg rounded-full shadow-lg text-sm text-gray-600 italic">
            "{vibeAffirmation}"
          </div>
        )}
      </main>

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        items={state.currentBoard.items}
        boardTitle={state.currentBoard.title}
        vibeName={vibeName}
      />

      {/* Vision Document Modal */}
      <VisionDocumentModal
        isOpen={showVisionDocModal}
        onClose={() => setShowVisionDocModal(false)}
        document={visionDocument}
        isLoading={visionDocLoading}
        loadingProgress={visionDocProgress}
        loadingStatus={visionDocStatus}
      />
    </div>
  );
};

export default App;
