
import React, { useState, useRef } from 'react';
import { NoteColor, Sticker, FontWeight, LetterSpacing, SavedBoard, ShapeType, SavedUpload } from '../types';
import { STICKER_PACKS } from '../data/stickers';
import { FONT_PAIRINGS, NOTE_FONTS, LETTER_SPACING, FONT_WEIGHTS, TEXT_COLORS } from '../data/fonts';
import { generateAffirmationSpark } from '../services/gemini';

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

interface SidebarProps {
  onAddImage: (base64: string) => void;
  onAddNote: (text: string, color: NoteColor, font?: string, fontWeight?: FontWeight, letterSpacing?: LetterSpacing, isItalic?: boolean, isUnderline?: boolean, textColor?: string) => void;
  onAddText: (text: string, font?: string, fontWeight?: FontWeight, isItalic?: boolean, isUnderline?: boolean, textColor?: string) => void;
  onAddSticker: (url: string) => void;
  onAddShape: (shapeType: ShapeType, fillColor: string, strokeColor: string, strokeWidth: number, opacity: number) => void;
  boardTitle: string;
  onTitleChange: (title: string) => void;
  onShare: () => void;
  onExport: () => void;
  onNameVision: () => void;
  onGenerateVisionDoc: () => void;
  onChangeFontPairing: (pairingId: string) => void;
  currentFontPairing: string;
  isGenerating: boolean;
  statusMessage: string;
  vibeName?: string;
  isPrivateMode: boolean;
  onTogglePrivate: () => void;
  savedBoards: SavedBoard[];
  currentBoardId: string;
  onSaveBoard: () => void;
  onLoadBoard: (boardId: string) => void;
  onDeleteBoard: (boardId: string) => void;
  onNewBoard: () => void;
  savedUploads: SavedUpload[];
  onSaveUpload: (base64: string, fileName: string) => void;
  onDeleteUpload: (uploadId: string) => void;
  onAddUploadToBoard: (uploadData: string) => void;
}

// Shape options
const SHAPES: { id: ShapeType; name: string; icon: string }[] = [
  { id: 'rectangle', name: 'rectangle', icon: '▭' },
  { id: 'square', name: 'square', icon: '◻' },
  { id: 'circle', name: 'circle', icon: '○' },
  { id: 'triangle', name: 'triangle', icon: '△' },
  { id: 'star', name: 'star', icon: '☆' },
  { id: 'heart', name: 'heart', icon: '♡' },
  { id: 'line', name: 'line', icon: '─' },
];

const SHAPE_COLORS = [
  { id: 'transparent', color: 'transparent', label: 'none' },
  { id: 'white', color: '#ffffff', label: 'white' },
  { id: 'black', color: '#000000', label: 'black' },
  { id: 'gray', color: '#9ca3af', label: 'gray' },
  { id: 'red', color: '#ef4444', label: 'red' },
  { id: 'orange', color: '#f97316', label: 'orange' },
  { id: 'yellow', color: '#eab308', label: 'yellow' },
  { id: 'green', color: '#22c55e', label: 'green' },
  { id: 'blue', color: '#3b82f6', label: 'blue' },
  { id: 'purple', color: '#a855f7', label: 'purple' },
  { id: 'pink', color: '#ec4899', label: 'pink' },
  { id: 'rose', color: '#fda4af', label: 'rose' },
];

const NOTE_COLORS: { id: NoteColor; color: string; label: string; feeling: string }[] = [
  { id: 'default', color: '#ffffff', label: 'soft focus', feeling: 'gentle clarity' },
  { id: 'gray', color: '#f7f7f7', label: 'grounded', feeling: 'stable & secure' },
  { id: 'brown', color: '#faf5f0', label: 'warm earth', feeling: 'cozy & rooted' },
  { id: 'orange', color: '#fff8f3', label: 'warm ambition', feeling: 'motivated' },
  { id: 'yellow', color: '#fffdf0', label: 'soft light', feeling: 'hopeful' },
  { id: 'green', color: '#f5faf7', label: 'fresh start', feeling: 'renewed' },
  { id: 'blue', color: '#f5f9ff', label: 'airy', feeling: 'light & free' },
  { id: 'purple', color: '#faf5ff', label: 'dream state', feeling: 'imaginative' },
  { id: 'pink', color: '#fff5f8', label: 'rose tinted', feeling: 'hopeful & soft' },
  { id: 'red', color: '#fff5f5', label: 'gentle fire', feeling: 'passionate' },
];

const Sidebar: React.FC<SidebarProps> = ({ 
  onAddImage, 
  onAddNote,
  onAddText,
  onAddSticker,
  onAddShape,
  boardTitle,
  onTitleChange,
  onShare,
  onExport,
  onNameVision,
  onGenerateVisionDoc,
  onChangeFontPairing,
  currentFontPairing,
  isGenerating,
  statusMessage,
  vibeName,
  isPrivateMode,
  onTogglePrivate,
  savedBoards,
  currentBoardId,
  onSaveBoard,
  onLoadBoard,
  onDeleteBoard,
  onNewBoard,
  savedUploads,
  onSaveUpload,
  onDeleteUpload,
  onAddUploadToBoard
}) => {
  const [noteText, setNoteText] = useState('');
  const [headingText, setHeadingText] = useState('');
  const [selectedColor, setSelectedColor] = useState<NoteColor>('default');
  const [selectedFont, setSelectedFont] = useState(NOTE_FONTS[0].id);
  const [selectedWeight, setSelectedWeight] = useState<FontWeight>('regular');
  const [selectedSpacing, setSelectedSpacing] = useState<LetterSpacing>('normal');
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [selectedTextColor, setSelectedTextColor] = useState(TEXT_COLORS[0].value);
  const [activeSection, setActiveSection] = useState<'image' | 'note' | 'text' | 'stickers' | 'fonts' | 'boards' | 'shapes' | 'uploads' | null>(null);
  const [activeStickerPack, setActiveStickerPack] = useState<string>('cute3d');
  
  // Shape state
  const [selectedShape, setSelectedShape] = useState<ShapeType>('rectangle');
  const [shapeFillColor, setShapeFillColor] = useState('#3b82f6');
  const [shapeStrokeColor, setShapeStrokeColor] = useState('#000000');
  const [shapeStrokeWidth, setShapeStrokeWidth] = useState(2);
  const [shapeOpacity, setShapeOpacity] = useState(100);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  
  const currentFont = NOTE_FONTS.find(f => f.id === selectedFont);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onAddImage(reader.result as string);
        setActiveSection(null);
      };
      reader.readAsDataURL(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAISpark = async () => {
    if (!noteText) return;
    const spark = await generateAffirmationSpark(noteText);
    setNoteText(spark);
  };

  const handleAddNote = () => {
    if (noteText.trim()) {
      const fontFamily = currentFont?.family;
      onAddNote(noteText, selectedColor, fontFamily, selectedWeight, selectedSpacing, isItalic, isUnderline, selectedTextColor);
      setNoteText('');
      setActiveSection(null);
    }
  };

  const handleAddText = () => {
    if (headingText.trim()) {
      const pairing = FONT_PAIRINGS.find(p => p.id === currentFontPairing);
      onAddText(headingText, pairing?.heading, selectedWeight, isItalic, isUnderline, selectedTextColor);
      setHeadingText('');
      setActiveSection(null);
    }
  };

  const handleStickerClick = (sticker: Sticker) => {
    onAddSticker(sticker.url);
  };

  const handleUploadToLibrary = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onSaveUpload(reader.result as string, file.name);
      };
      reader.readAsDataURL(file);
    }
    if (uploadInputRef.current) uploadInputRef.current.value = '';
  };

  const selectedColorInfo = NOTE_COLORS.find(c => c.id === selectedColor);

  return (
    <aside className={`w-72 h-full glass-sidebar flex flex-col z-20 transition-all ${isPrivateMode ? 'opacity-90' : ''}`}>
      {/* Header */}
      <div className="pt-3 px-5 pb-3 border-b border-black/5">
        <div className="flex justify-center mb-0.5">
          <img 
            src="/visionly.png" 
            alt="Visionly" 
            className="w-28 h-28 object-contain"
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={vibeName || boardTitle}
            onChange={(e) => onTitleChange(e.target.value)}
            className="flex-1 text-lg font-semibold bg-transparent border-none focus:outline-none text-gray-800 placeholder:text-gray-400 lowercase"
            placeholder="untitled vision"
          />
        </div>
        <p className="text-xs text-gray-400 mt-1 italic pl-1">you're allowed to want this</p>
      </div>

      {/* Tools */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4">
        {/* Start softly */}
        <div className="section-label">start softly</div>

        {/* Font Pairing Button */}
        <button 
          onClick={() => setActiveSection(activeSection === 'fonts' ? null : 'fonts')}
          className={`btn-notion ${activeSection === 'fonts' ? 'bg-black/5' : ''}`}
        >
          <span>typography</span>
        </button>
        
        {activeSection === 'fonts' && (
          <div className="mt-2 p-3 glass-dark rounded-lg space-y-3">
            <div className="text-xs text-gray-500 mb-2">fonts matter a lot</div>
            <div className="grid gap-2 max-h-64 overflow-y-auto">
              {FONT_PAIRINGS.map(pairing => (
                <button
                  key={pairing.id}
                  onClick={() => {
                    onChangeFontPairing(pairing.id);
                    setActiveSection(null);
                  }}
                  className={`p-3 rounded-xl text-left transition-all border ${
                    currentFontPairing === pairing.id 
                      ? 'bg-gray-800 text-white border-gray-800' 
                      : 'bg-white/60 hover:bg-white border-transparent hover:border-gray-200'
                  }`}
                >
                  <div className="font-medium text-sm" style={{ fontFamily: pairing.heading }}>
                    {pairing.name}
                  </div>
                  <div className={`text-xs italic mt-1 ${currentFontPairing === pairing.id ? 'text-gray-300' : 'text-gray-500'}`} style={{ fontFamily: pairing.body }}>
                    {pairing.description}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="divider" />
        
        <div className="section-label">add to board</div>
        
        {/* Image Button */}
        <button 
          onClick={() => setActiveSection(activeSection === 'image' ? null : 'image')}
          className={`btn-notion ${activeSection === 'image' ? 'bg-black/5' : ''}`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>image</span>
        </button>
        
        {activeSection === 'image' && (
          <div className="mt-2 p-3 glass-dark rounded-lg">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-8 border-2 border-dashed border-gray-200 rounded-lg text-sm text-gray-500 hover:border-gray-300 hover:text-gray-600 transition-all flex flex-col items-center gap-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span>click to upload</span>
              <span className="text-xs text-gray-400">this is yours</span>
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*" 
          onChange={handleFileUpload} 
        />
          </div>
        )}

        {/* Note Button */}
        <button 
          onClick={() => setActiveSection(activeSection === 'note' ? null : 'note')}
          className={`btn-notion ${activeSection === 'note' ? 'bg-black/5' : ''}`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>note</span>
        </button>
        
        {activeSection === 'note' && (
          <div className="mt-2 p-3 glass-dark rounded-lg space-y-3 overflow-hidden">
            {/* Color */}
            <div className="overflow-hidden">
              <div className="text-xs text-gray-500 mb-2">feeling</div>
              <div className="flex flex-wrap gap-1.5">
                {NOTE_COLORS.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedColor(c.id)}
                    className={`color-dot ${selectedColor === c.id ? 'selected' : ''} tooltip flex-shrink-0`}
                    style={{ backgroundColor: c.color, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.1)' }}
                    title={`${c.label} — ${c.feeling}`}
                    data-tip={c.label}
                  />
                ))}
              </div>
              {selectedColorInfo && (
                <div className="text-xs text-gray-400 mt-2 italic break-words">{selectedColorInfo.feeling}</div>
              )}
            </div>

            {/* Font Selection */}
            <div className="overflow-hidden">
              <div className="text-xs text-gray-500 mb-2">font</div>
              <div className="flex flex-wrap gap-1">
                {NOTE_FONTS.map(f => (
                  <button
                    key={f.id}
                    onClick={() => setSelectedFont(f.id)}
                    className={`px-2 py-1 rounded text-xs transition-all whitespace-nowrap ${
                      selectedFont === f.id 
                        ? 'bg-gray-800 text-white' 
                        : 'bg-white/60 text-gray-600 hover:bg-white'
                    }`}
                    style={{ fontFamily: f.family }}
                  >
                    {f.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Weight */}
            <div className="overflow-hidden">
              <div className="text-xs text-gray-500 mb-1">weight</div>
              <div className="flex flex-wrap gap-1">
                {FONT_WEIGHTS.map(w => (
                  <button
                    key={w.id}
                    onClick={() => setSelectedWeight(w.id as FontWeight)}
                    className={`px-2 py-1 rounded text-xs transition-all whitespace-nowrap ${
                      selectedWeight === w.id 
                        ? 'bg-gray-800 text-white' 
                        : 'bg-white/60 text-gray-600 hover:bg-white'
                    }`}
                  >
                    {w.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Spacing */}
            <div className="overflow-hidden">
              <div className="text-xs text-gray-500 mb-1">spacing</div>
              <div className="flex flex-wrap gap-1">
                {LETTER_SPACING.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSpacing(s.id as LetterSpacing)}
                    className={`px-2 py-1 rounded text-xs transition-all whitespace-nowrap ${
                      selectedSpacing === s.id 
                        ? 'bg-gray-800 text-white' 
                        : 'bg-white/60 text-gray-600 hover:bg-white'
                    }`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Style Options: Italic, Underline */}
            <div className="overflow-hidden">
              <div className="text-xs text-gray-500 mb-1">style</div>
              <div className="flex flex-wrap gap-1">
                <button
                  onClick={() => setIsItalic(!isItalic)}
                  className={`px-3 py-1.5 rounded text-xs transition-all whitespace-nowrap ${
                    isItalic 
                      ? 'bg-gray-800 text-white' 
                      : 'bg-white/60 text-gray-600 hover:bg-white'
                  }`}
                  style={{ fontStyle: 'italic' }}
                >
                  italic
                </button>
                <button
                  onClick={() => setIsUnderline(!isUnderline)}
                  className={`px-3 py-1.5 rounded text-xs transition-all whitespace-nowrap ${
                    isUnderline 
                      ? 'bg-gray-800 text-white' 
                      : 'bg-white/60 text-gray-600 hover:bg-white'
                  }`}
                  style={{ textDecoration: 'underline' }}
                >
                  underline
                </button>
              </div>
            </div>

            {/* Text Color */}
            <div className="overflow-hidden">
              <div className="text-xs text-gray-500 mb-1">text color</div>
              <div className="flex flex-wrap gap-1.5">
                {TEXT_COLORS.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedTextColor(c.value)}
                    className={`w-5 h-5 rounded-full transition-all flex-shrink-0 ${
                      selectedTextColor === c.value 
                        ? 'ring-2 ring-offset-1 ring-gray-400 scale-110' 
                        : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: c.value }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>
            
            {/* Preview */}
          <textarea 
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
              placeholder="write what you're feeling..."
              className="input-notion resize-none h-24 w-full break-words"
              style={{ 
                fontFamily: currentFont?.family,
                fontWeight: FONT_WEIGHTS.find(w => w.id === selectedWeight)?.value,
                letterSpacing: LETTER_SPACING.find(s => s.id === selectedSpacing)?.value,
                fontStyle: isItalic ? 'italic' : 'normal',
                textDecoration: isUnderline ? 'underline' : 'none',
                color: selectedTextColor,
                wordBreak: 'break-word'
              }}
            />
            
            <div className="flex gap-2">
            <button 
                onClick={handleAddNote}
                disabled={!noteText.trim()}
                className="flex-1 py-2 btn-notion-primary rounded-lg text-sm disabled:opacity-40 disabled:cursor-not-allowed truncate"
              >
                add note
            </button>
            <button 
              onClick={handleAISpark}
                disabled={!noteText.trim() || isGenerating}
                className="icon-btn glass-dark rounded-lg disabled:opacity-40 flex-shrink-0"
                title="let ai enhance this"
              >
                ✨
              </button>
            </div>
            
            {/* Draggable Note Template */}
            <div className="pt-2 border-t border-gray-200 mt-3">
              <div className="text-xs text-gray-500 mb-2">or drag a blank note</div>
              <div
                draggable
                onDragStart={(e) => {
                  const noteData = {
                    text: 'write here...',
                    color: selectedColor
                  };
                  e.dataTransfer.setData('application/x-item-type', 'note');
                  e.dataTransfer.setData('text/plain', JSON.stringify(noteData));
                  e.dataTransfer.effectAllowed = 'copy';
                }}
                className="p-3 rounded-lg bg-white/60 border-2 border-dashed border-gray-300 cursor-grab active:cursor-grabbing hover:border-blue-400 hover:bg-white transition-all text-center"
              >
                <div className={`card-item ${getColorClass(selectedColor)} p-3 min-h-[60px] flex items-center justify-center`}>
                  <span className="text-xs text-gray-400 italic">drag me to board</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Text/Heading Button */}
        <button 
          onClick={() => setActiveSection(activeSection === 'text' ? null : 'text')}
          className={`btn-notion ${activeSection === 'text' ? 'bg-black/5' : ''}`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h8m-8 6h16" />
          </svg>
          <span>text</span>
        </button>
        
        {activeSection === 'text' && (
          <div className="mt-2 p-3 glass-dark rounded-lg space-y-3">
            <input 
              type="text"
              value={headingText}
              onChange={(e) => setHeadingText(e.target.value)}
              placeholder="add a word, a wish..."
              className="input-notion"
              style={{ 
                fontWeight: FONT_WEIGHTS.find(w => w.id === selectedWeight)?.value,
                fontStyle: isItalic ? 'italic' : 'normal',
                textDecoration: isUnderline ? 'underline' : 'none',
                color: selectedTextColor
              }}
            />
            
            {/* Style Options */}
            <div className="flex gap-2">
              <div className="flex gap-1">
                {FONT_WEIGHTS.map(w => (
                  <button
                    key={w.id}
                    onClick={() => setSelectedWeight(w.id as FontWeight)}
                    className={`px-2 py-1 rounded text-xs transition-all ${
                      selectedWeight === w.id 
                        ? 'bg-gray-800 text-white' 
                        : 'bg-white/60 text-gray-600 hover:bg-white'
                    }`}
                  >
                    {w.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-1">
              <button
                onClick={() => setIsItalic(!isItalic)}
                className={`flex-1 px-2 py-1.5 rounded text-xs transition-all ${
                  isItalic 
                    ? 'bg-gray-800 text-white' 
                    : 'bg-white/60 text-gray-600 hover:bg-white'
                }`}
                style={{ fontStyle: 'italic' }}
              >
                italic
              </button>
              <button
                onClick={() => setIsUnderline(!isUnderline)}
                className={`flex-1 px-2 py-1.5 rounded text-xs transition-all ${
                  isUnderline 
                    ? 'bg-gray-800 text-white' 
                    : 'bg-white/60 text-gray-600 hover:bg-white'
                }`}
                style={{ textDecoration: 'underline' }}
              >
                underline
              </button>
            </div>

            {/* Text Color */}
            <div>
              <div className="text-xs text-gray-500 mb-1">color</div>
              <div className="flex flex-wrap gap-1">
                {TEXT_COLORS.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedTextColor(c.value)}
                    className={`w-5 h-5 rounded-full transition-all ${
                      selectedTextColor === c.value 
                        ? 'ring-2 ring-offset-1 ring-gray-400 scale-110' 
                        : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: c.value }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>
            
            <button 
              onClick={handleAddText}
              disabled={!headingText.trim()}
              className="w-full py-2 btn-notion-primary rounded-lg text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              add text
            </button>
            
            {/* Draggable Text Template */}
            <div className="pt-2 border-t border-gray-200 mt-3">
              <div className="text-xs text-gray-500 mb-2">or drag a blank text</div>
              <div
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('application/x-item-type', 'text');
                  e.dataTransfer.setData('text/plain', 'text');
                  e.dataTransfer.effectAllowed = 'copy';
                }}
                className="p-3 rounded-lg bg-white/60 border-2 border-dashed border-gray-300 cursor-grab active:cursor-grabbing hover:border-blue-400 hover:bg-white transition-all text-center"
              >
                <p className="text-sm text-gray-400 italic">drag me to board</p>
              </div>
            </div>
          </div>
        )}

        {/* Stickers Button */}
        <button 
          onClick={() => setActiveSection(activeSection === 'stickers' ? null : 'stickers')}
          className={`btn-notion ${activeSection === 'stickers' ? 'bg-black/5' : ''}`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>stickers</span>
        </button>
        
        {activeSection === 'stickers' && (
          <div className="mt-2 p-3 glass-dark rounded-lg space-y-3">
            {/* Sticker Pack Tabs */}
            <div className="flex flex-wrap gap-1">
              {Object.entries(STICKER_PACKS).map(([key, pack]) => (
            <button 
                  key={key}
                  onClick={() => setActiveStickerPack(key)}
                  className={`px-2 py-1.5 rounded-md text-xs transition-all flex items-center gap-1 ${
                    activeStickerPack === key 
                      ? 'bg-gray-800 text-white' 
                      : 'bg-white/50 text-gray-600 hover:bg-white'
                  }`}
            >
                  <span>{pack.icon}</span>
                  <span className="hidden sm:inline">{pack.name}</span>
            </button>
          ))}
        </div>
            
            {/* Sticker Grid */}
            <div className="grid grid-cols-4 gap-1.5 max-h-48 overflow-y-auto p-1">
              {STICKER_PACKS[activeStickerPack]?.stickers.map((sticker) => (
                <button
                  key={sticker.id}
                  onClick={() => handleStickerClick(sticker)}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('application/x-item-type', 'sticker');
                    e.dataTransfer.setData('text/plain', sticker.url);
                    e.dataTransfer.effectAllowed = 'copy';
                  }}
                  className="aspect-square p-1.5 rounded-lg bg-white/60 hover:bg-white hover:scale-105 transition-all flex items-center justify-center group relative cursor-grab active:cursor-grabbing"
                  title={`${sticker.name} — drag to board or click to add`}
                >
                  <img 
                    src={sticker.url} 
                    alt={sticker.name}
                    className="w-full h-full object-contain pointer-events-none"
                    loading="lazy"
                    draggable={false}
                  />
                </button>
              ))}
      </div>

            {/* Sticker pack info */}
            <div className="text-xs text-gray-400 text-center italic">
              tap to add ✨
            </div>
          </div>
        )}

        {/* Shapes Button */}
        <button 
          onClick={() => setActiveSection(activeSection === 'shapes' ? null : 'shapes')}
          className={`btn-notion ${activeSection === 'shapes' ? 'bg-black/5' : ''}`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
          </svg>
          <span>shapes</span>
        </button>
        
        {activeSection === 'shapes' && (
          <div className="mt-2 p-3 glass-dark rounded-lg space-y-3 overflow-hidden">
            {/* Shape Selection */}
            <div>
              <div className="text-xs text-gray-500 mb-2">shape</div>
              <div className="grid grid-cols-4 gap-1.5">
                {SHAPES.map(shape => (
                  <button
                    key={shape.id}
                    onClick={() => setSelectedShape(shape.id)}
                    className={`p-2 rounded-lg text-center transition-all ${
                      selectedShape === shape.id 
                        ? 'bg-gray-800 text-white' 
                        : 'bg-white/60 text-gray-600 hover:bg-white'
                    }`}
                    title={shape.name}
                  >
                    <span className="text-lg">{shape.icon}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Fill Color */}
            <div className="overflow-hidden">
              <div className="text-xs text-gray-500 mb-2">fill</div>
              <div className="flex flex-wrap gap-1.5">
                {SHAPE_COLORS.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setShapeFillColor(c.color)}
                    className={`w-6 h-6 rounded-full transition-all flex-shrink-0 ${
                      shapeFillColor === c.color 
                        ? 'ring-2 ring-offset-1 ring-gray-400 scale-110' 
                        : 'hover:scale-110'
                    }`}
                    style={{ 
                      backgroundColor: c.color === 'transparent' ? 'white' : c.color,
                      border: c.color === 'transparent' ? '2px dashed #ccc' : c.color === '#ffffff' ? '1px solid #e5e7eb' : 'none'
                    }}
                    title={c.label}
                  />
                ))}
              </div>
            </div>

            {/* Stroke Color */}
            <div className="overflow-hidden">
              <div className="text-xs text-gray-500 mb-2">stroke</div>
              <div className="flex flex-wrap gap-1.5">
                {SHAPE_COLORS.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setShapeStrokeColor(c.color)}
                    className={`w-6 h-6 rounded-full transition-all flex-shrink-0 ${
                      shapeStrokeColor === c.color 
                        ? 'ring-2 ring-offset-1 ring-gray-400 scale-110' 
                        : 'hover:scale-110'
                    }`}
                    style={{ 
                      backgroundColor: c.color === 'transparent' ? 'white' : c.color,
                      border: c.color === 'transparent' ? '2px dashed #ccc' : c.color === '#ffffff' ? '1px solid #e5e7eb' : 'none'
                    }}
                    title={c.label}
                  />
                ))}
              </div>
            </div>

            {/* Stroke Width */}
            <div>
              <div className="text-xs text-gray-500 mb-2">stroke width</div>
              <div className="flex gap-1">
                {[0, 1, 2, 3, 4].map(w => (
                  <button
                    key={w}
                    onClick={() => setShapeStrokeWidth(w)}
                    className={`flex-1 px-2 py-1 rounded text-xs transition-all ${
                      shapeStrokeWidth === w 
                        ? 'bg-gray-800 text-white' 
                        : 'bg-white/60 text-gray-600 hover:bg-white'
                    }`}
                  >
                    {w}px
                  </button>
                ))}
              </div>
            </div>

            {/* Opacity */}
            <div>
              <div className="text-xs text-gray-500 mb-2">opacity: {shapeOpacity}%</div>
              <input
                type="range"
                min="10"
                max="100"
                value={shapeOpacity}
                onChange={(e) => setShapeOpacity(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-800"
              />
            </div>

            {/* Add Shape Button */}
            <button
              onClick={() => onAddShape(selectedShape, shapeFillColor, shapeStrokeColor, shapeStrokeWidth, shapeOpacity / 100)}
              className="w-full py-2 btn-notion-primary rounded-lg text-sm"
            >
              add shape
            </button>
          </div>
        )}

        <div className="divider" />
        
        {/* Quick affirmations */}
        <div className="section-label">quick feels</div>
        <div className="grid grid-cols-5 gap-1 px-1">
          {['💫', '🌙', '✨', '🦋', '🌸', '🕯️', '🌿', '💭', '🤍', '🔮'].map((emoji, i) => (
            <button 
              key={i}
              onClick={() => {
                setNoteText(prev => prev + emoji);
                setActiveSection('note');
              }}
              className="p-2 rounded-md hover:bg-black/5 transition-colors text-lg"
            >
              {emoji}
            </button>
          ))}
        </div>

        <div className="divider" />

        {/* My Uploads Section */}
        <div className="section-label">my uploads</div>
        
        <button 
          onClick={() => setActiveSection(activeSection === 'uploads' ? null : 'uploads')}
          className={`btn-notion ${activeSection === 'uploads' ? 'bg-black/5' : ''}`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>my images ({savedUploads.length})</span>
        </button>

        {activeSection === 'uploads' && (
          <div className="mt-2 p-3 glass-dark rounded-lg space-y-3">
            {/* Upload Button */}
            <button 
              onClick={() => uploadInputRef.current?.click()}
              className="w-full py-4 border-2 border-dashed border-gray-200 rounded-lg text-sm text-gray-500 hover:border-gray-300 hover:text-gray-600 transition-all flex flex-col items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
              </svg>
              <span>add to library</span>
            </button>
            <input 
              type="file" 
              ref={uploadInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleUploadToLibrary} 
            />

            {/* Uploads Gallery */}
            {savedUploads.length > 0 ? (
              <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                {savedUploads
                  .sort((a, b) => b.uploadedAt - a.uploadedAt)
                  .map(upload => (
                    <div 
                      key={upload.id}
                      className="relative group aspect-square rounded-lg overflow-hidden bg-gray-100 cursor-grab active:cursor-grabbing hover:ring-2 hover:ring-blue-400 transition-all"
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('application/x-item-type', 'image');
                        e.dataTransfer.setData('text/plain', upload.data);
                        e.dataTransfer.effectAllowed = 'copy';
                      }}
                      onClick={() => onAddUploadToBoard(upload.data)}
                      title={`${upload.name} — drag to board or click to add`}
                    >
                      <img 
                        src={upload.data} 
                        alt={upload.name}
                        className="w-full h-full object-cover pointer-events-none"
                        draggable={false}
                      />
                      {/* Delete button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('delete this image?')) {
                            onDeleteUpload(upload.id);
                          }
                        }}
                        className="absolute top-1 right-1 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))
                }
              </div>
            ) : (
              <div className="text-xs text-gray-400 text-center py-2 italic">
                no saved images yet
              </div>
            )}
            
            <div className="text-xs text-gray-400 text-center italic">
              drag image to board or click to add
            </div>
          </div>
        )}

        <div className="divider" />

        {/* My Boards Section */}
        <div className="section-label">my boards</div>
        
        {/* New Board + Save Button */}
        <div className="flex gap-2 mb-2">
          <button 
            onClick={onNewBoard}
            className="flex-1 btn-notion justify-center text-gray-600 hover:bg-black/5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
            </svg>
            <span>new</span>
          </button>
          <button 
            onClick={onSaveBoard}
            className="flex-1 btn-notion justify-center bg-green-50 text-green-700 hover:bg-green-100"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
            </svg>
            <span>save</span>
          </button>
        </div>

        {/* Saved Boards Button */}
        <button 
          onClick={() => setActiveSection(activeSection === 'boards' ? null : 'boards')}
          className={`btn-notion ${activeSection === 'boards' ? 'bg-black/5' : ''}`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <span>saved boards ({savedBoards.length})</span>
        </button>

        {activeSection === 'boards' && (
          <div className="mt-2 p-3 glass-dark rounded-lg space-y-2 max-h-48 overflow-y-auto">
            {savedBoards.length === 0 ? (
              <div className="text-xs text-gray-400 text-center py-4 italic">
                no saved boards yet
              </div>
            ) : (
              savedBoards
                .sort((a, b) => b.updatedAt - a.updatedAt)
                .map(board => (
                  <div 
                    key={board.id}
                    className={`group flex items-center gap-2 p-2 rounded-lg transition-all cursor-pointer ${
                      board.id === currentBoardId 
                        ? 'bg-gray-800 text-white' 
                        : 'bg-white/60 hover:bg-white text-gray-700'
                    }`}
                    onClick={() => onLoadBoard(board.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{board.title || 'untitled'}</div>
                      <div className={`text-xs ${board.id === currentBoardId ? 'text-gray-300' : 'text-gray-400'}`}>
                        {board.items.length} items • {new Date(board.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('delete this board?')) {
                          onDeleteBoard(board.id);
                        }
                      }}
                      className={`p-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity ${
                        board.id === currentBoardId 
                          ? 'hover:bg-white/20 text-white' 
                          : 'hover:bg-red-50 text-red-500'
                      }`}
                      title="delete board"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-black/5 space-y-2">
        {statusMessage && (
          <div className="px-3 py-2 bg-green-50 border border-green-100 rounded-lg text-xs text-green-700 text-center italic">
            {statusMessage}
          </div>
        )}
        
        {/* AI Name My Vision */}
        <button 
          onClick={onNameVision}
          disabled={isGenerating}
          className="btn-notion justify-center bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 rounded-lg hover:from-purple-100 hover:to-pink-100 disabled:opacity-50"
        >
          <span className="text-purple-700">name my vision</span>
        </button>

        {/* Vision → Narrative (ML Feature) */}
        <button 
          onClick={onGenerateVisionDoc}
          className="btn-notion justify-center bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-100 rounded-lg hover:from-blue-100 hover:to-cyan-100"
        >
          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="text-blue-700">vision → narrative</span>
        </button>

        {/* Private Mode Toggle */}
        <button 
          onClick={onTogglePrivate}
          className={`btn-notion justify-center rounded-lg ${isPrivateMode ? 'bg-gray-100 border border-gray-200' : 'border border-black/10'}`}
        >
          <span className="text-gray-600">{isPrivateMode ? 'sacred mode on' : 'sacred mode'}</span>
        </button>
        
        {/* Export Button */}
        <button 
          onClick={onExport}
          className="btn-notion justify-center border border-black/10 rounded-lg bg-gray-900 text-white hover:bg-gray-800"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <span>export vision</span>
        </button>
        
        {/* Share Button - hidden in private mode */}
        {!isPrivateMode && (
          <button 
            onClick={onShare}
            className="btn-notion justify-center border border-black/10 rounded-lg"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            <span>share</span>
          </button>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
