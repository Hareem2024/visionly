
import React, { useState, useRef } from 'react';
import { BoardItem } from '../types';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: BoardItem[];
  boardTitle: string;
  vibeName?: string;
}

const EXPORT_FORMATS = [
  { id: 'story', name: 'Instagram Story', width: 1080, height: 1920, icon: '📱', desc: 'perfect for stories' },
  { id: 'post', name: 'Instagram Post', width: 1080, height: 1080, icon: '📷', desc: 'square for feed' },
  { id: 'pinterest', name: 'Pinterest Pin', width: 1000, height: 1500, icon: '📌', desc: 'tall & pinnable' },
  { id: 'lockscreen', name: 'Lock Screen', width: 1170, height: 2532, icon: '🔒', desc: 'daily reminder' },
  { id: 'desktop', name: 'Desktop Wallpaper', width: 2560, height: 1440, icon: '🖥️', desc: 'surround yourself' },
];

const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, items, boardTitle, vibeName }) => {
  const [selectedFormat, setSelectedFormat] = useState('story');
  const [includeWatermark, setIncludeWatermark] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  if (!isOpen) return null;

  const selectedExport = EXPORT_FORMATS.find(f => f.id === selectedFormat)!;

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      canvas.width = selectedExport.width;
      canvas.height = selectedExport.height;

      // Background gradient based on vibe
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, '#fafafa');
      gradient.addColorStop(1, '#f0f0f0');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Subtle dot pattern
      ctx.fillStyle = 'rgba(0,0,0,0.03)';
      for (let x = 0; x < canvas.width; x += 24) {
        for (let y = 0; y < canvas.height; y += 24) {
          ctx.beginPath();
          ctx.arc(x, y, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Calculate scale to fit items
      const scale = Math.min(canvas.width, canvas.height) / 800;
      const offsetX = (canvas.width - 800 * scale) / 2;
      const offsetY = (canvas.height - 800 * scale) / 2 + 50;

      // Draw items
      for (const item of items) {
        const x = offsetX + item.x * scale;
        const y = offsetY + item.y * scale;
        const width = item.width * scale;

        if (item.type === 'image' || item.type === 'sticker') {
          try {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            await new Promise((resolve, reject) => {
              img.onload = resolve;
              img.onerror = reject;
              img.src = item.content;
            });
            
            ctx.save();
            if (item.rotation) {
              ctx.translate(x + width / 2, y + (width * img.height / img.width) / 2);
              ctx.rotate((item.rotation * Math.PI) / 180);
              ctx.translate(-(x + width / 2), -(y + (width * img.height / img.width) / 2));
            }
            
            // Shadow for images
            if (item.type === 'image') {
              ctx.shadowColor = 'rgba(0,0,0,0.1)';
              ctx.shadowBlur = 20;
              ctx.shadowOffsetY = 8;
            }
            
            const height = width * img.height / img.width;
            ctx.drawImage(img, x, y, width, height);
            ctx.restore();
          } catch (e) {
            console.log('Could not load image');
          }
        } else if (item.type === 'note') {
          ctx.save();
          if (item.rotation) {
            ctx.translate(x + width / 2, y + 40);
            ctx.rotate((item.rotation * Math.PI) / 180);
            ctx.translate(-(x + width / 2), -(y + 40));
          }
          
          ctx.shadowColor = 'rgba(0,0,0,0.08)';
          ctx.shadowBlur = 10;
          ctx.shadowOffsetY = 4;
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.roundRect(x, y, width, 80, 8);
          ctx.fill();
          
          ctx.shadowColor = 'transparent';
          ctx.fillStyle = '#374151';
          ctx.font = `${14 * scale}px Inter, sans-serif`;
          ctx.fillText(item.content.slice(0, 50), x + 16, y + 40);
          ctx.restore();
        } else if (item.type === 'text') {
          ctx.save();
          if (item.rotation) {
            ctx.translate(x + width / 2, y + 15);
            ctx.rotate((item.rotation * Math.PI) / 180);
            ctx.translate(-(x + width / 2), -(y + 15));
          }
          ctx.fillStyle = '#1a1a1a';
          ctx.font = `600 ${18 * scale}px Inter, sans-serif`;
          ctx.fillText(item.content, x, y + 20);
          ctx.restore();
        }
      }

      // Title at top
      if (vibeName || boardTitle) {
        ctx.fillStyle = '#1a1a1a';
        ctx.font = `500 ${24 * scale}px Inter, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(vibeName || boardTitle, canvas.width / 2, 60);
      }

      // Watermark
      if (includeWatermark) {
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.font = `300 ${12 * scale}px Inter, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('made with visionly', canvas.width / 2, canvas.height - 30);
      }

      // Download
      const link = document.createElement('a');
      link.download = `${(vibeName || boardTitle || 'vision').toLowerCase().replace(/\s+/g, '-')}-${selectedFormat}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
    } catch (e) {
      console.error('Export failed:', e);
    }
    
    setIsExporting(false);
  };

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: 9999 }}
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-black/5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">export your vision</h2>
              <p className="text-sm text-gray-500 mt-1">share what you're becoming</p>
            </div>
            <button 
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-black/5 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Format Selection */}
        <div className="p-6 space-y-4">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">choose format</div>
          <div className="grid grid-cols-2 gap-2">
            {EXPORT_FORMATS.map(format => (
              <button
                key={format.id}
                onClick={() => setSelectedFormat(format.id)}
                className={`p-3 rounded-xl text-left transition-all ${
                  selectedFormat === format.id
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{format.icon}</span>
                  <div>
                    <div className="font-medium text-sm">{format.name}</div>
                    <div className={`text-xs ${selectedFormat === format.id ? 'text-gray-300' : 'text-gray-400'}`}>
                      {format.desc}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Watermark Toggle */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
            <div>
              <div className="text-sm font-medium text-gray-700">soft watermark</div>
              <div className="text-xs text-gray-400">helps others find this tool</div>
            </div>
            <button
              onClick={() => setIncludeWatermark(!includeWatermark)}
              className={`w-11 h-6 rounded-full transition-colors relative ${
                includeWatermark ? 'bg-gray-900' : 'bg-gray-200'
              }`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                includeWatermark ? 'left-6' : 'left-1'
              }`} />
            </button>
          </div>

          {/* Preview Info */}
          <div className="text-center py-4">
            <div className="text-xs text-gray-400">
              {selectedExport.width} × {selectedExport.height}px
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-black/5 bg-gray-50/50">
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isExporting ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                creating...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                download {selectedExport.name.toLowerCase()}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;

