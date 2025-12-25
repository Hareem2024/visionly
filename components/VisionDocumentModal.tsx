import React, { useState } from 'react';
import type { VisionDocument } from '../services/visionML';

interface VisionDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: VisionDocument | null;
  isLoading: boolean;
  loadingProgress: number;
  loadingStatus: string;
}

export const VisionDocumentModal: React.FC<VisionDocumentModalProps> = ({
  isOpen,
  onClose,
  document,
  isLoading,
  loadingProgress,
  loadingStatus
}) => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const exportAsMarkdown = () => {
    if (!document) return;
    
    const markdown = `# vision document

## core theme
${document.coreTheme}

## values being expressed
${document.values.map(v => `- ${v}`).join('\n')}

## focus areas
${document.focusAreas.map(f => `- ${f}`).join('\n')}

## identity statements
${document.identityStatements.map(s => `> "${s}"`).join('\n\n')}

## gentle next steps

### one habit to try
${document.nextSteps.habit}

### one thing to release
${document.nextSteps.release}

### one thing to protect
${document.nextSteps.protect}

---
*color mood: ${document.colorMood}*
*created with visionly*
`;
    
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = 'vision-document.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportAsText = () => {
    if (!document) return;
    
    const text = `VISION DOCUMENT

CORE THEME
${document.coreTheme}

VALUES BEING EXPRESSED
${document.values.map(v => `• ${v}`).join('\n')}

FOCUS AREAS
${document.focusAreas.map(f => `• ${f}`).join('\n')}

IDENTITY STATEMENTS
${document.identityStatements.map(s => `"${s}"`).join('\n')}

GENTLE NEXT STEPS

One habit to try:
${document.nextSteps.habit}

One thing to release:
${document.nextSteps.release}

One thing to protect:
${document.nextSteps.protect}

---
Color mood: ${document.colorMood}
Created with visionly
`;
    
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = 'vision-document.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyAllToClipboard = () => {
    if (!document) return;
    
    const text = `✨ VISION DOCUMENT ✨

🪞 CORE THEME
${document.coreTheme}

🧭 VALUES
${document.values.join(' • ')}

🎯 FOCUS AREAS
${document.focusAreas.join(' • ')}

✍️ AFFIRMATIONS
${document.identityStatements.map(s => `"${s}"`).join('\n')}

🧱 NEXT STEPS
→ Try: ${document.nextSteps.habit}
→ Release: ${document.nextSteps.release}
→ Protect: ${document.nextSteps.protect}

🎨 Mood: ${document.colorMood}
`;
    
    navigator.clipboard.writeText(text);
    setCopiedSection('all');
    setTimeout(() => setCopiedSection(null), 2000);
  };

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ 
        background: 'rgba(0, 0, 0, 0.4)', 
        backdropFilter: 'blur(8px)',
        zIndex: 9999
      }}
      onClick={onClose}
    >
      <div 
        className="glass-dark rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
        style={{ 
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          animation: 'fadeIn 0.3s ease'
        }}
      >
        {/* Header */}
        <div className="p-6 border-b border-black/5">
          <div className="flex items-center justify-between">
            <div>
              <h2 style={{ fontFamily: "'Playfair Display', serif" }} className="text-2xl font-medium text-gray-900">
                vision → narrative
              </h2>
              <p className="text-sm text-gray-500 mt-1">your vision, translated into words</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-black/5 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-48 h-1.5 bg-gray-100 rounded-full overflow-hidden mb-4">
                <div 
                  className="h-full bg-gray-800 rounded-full transition-all duration-300"
                  style={{ width: `${loadingProgress}%` }}
                />
              </div>
              <p className="text-sm text-gray-500" style={{ fontFamily: "'Caveat', cursive", fontSize: '18px' }}>
                {loadingStatus}
              </p>
              <p className="text-xs text-gray-400 mt-2">
                ml models running locally in your browser
              </p>
            </div>
          ) : document ? (
            <div className="space-y-8">
              {/* Core Theme */}
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">🪞</span>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">core theme</h3>
                </div>
                <p 
                  className="text-lg text-gray-800 leading-relaxed"
                  style={{ fontFamily: "'Libre Baskerville', serif" }}
                >
                  {document.coreTheme}
                </p>
              </section>

              {/* Values */}
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">🧭</span>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">values being expressed</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {document.values.map((value, i) => (
                    <span 
                      key={i}
                      className="px-3 py-1.5 bg-gray-100 rounded-full text-sm text-gray-700"
                      style={{ fontFamily: "'DM Sans', sans-serif" }}
                    >
                      {value}
                    </span>
                  ))}
                </div>
              </section>

              {/* Focus Areas */}
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">🎯</span>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">focus areas</h3>
                </div>
                <ul className="space-y-2">
                  {document.focusAreas.map((area, i) => (
                    <li 
                      key={i}
                      className="text-gray-700 flex items-start gap-2"
                      style={{ fontFamily: "'DM Sans', sans-serif" }}
                    >
                      <span className="text-gray-300 mt-0.5">→</span>
                      {area}
                    </li>
                  ))}
                </ul>
              </section>

              {/* Identity Statements */}
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">✍️</span>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">identity statements</h3>
                </div>
                <div className="space-y-3">
                  {document.identityStatements.map((statement, i) => (
                    <blockquote 
                      key={i}
                      className="pl-4 border-l-2 border-gray-200 text-gray-700 italic"
                      style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '18px' }}
                    >
                      "{statement}"
                    </blockquote>
                  ))}
                </div>
              </section>

              {/* Next Steps */}
              <section className="bg-gray-50 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg">🧱</span>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">gentle next steps</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">one habit to try</p>
                    <p className="text-gray-700" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                      {document.nextSteps.habit}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">one thing to release</p>
                    <p className="text-gray-700" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                      {document.nextSteps.release}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">one thing to protect</p>
                    <p className="text-gray-700" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                      {document.nextSteps.protect}
                    </p>
                  </div>
                </div>
              </section>

              {/* Color Mood */}
              <section className="flex items-center justify-between text-sm text-gray-400">
                <span>color mood: <span className="text-gray-600">{document.colorMood}</span></span>
                {document.dominantThemes.length > 0 && (
                  <span>themes: {document.dominantThemes.slice(0, 3).join(', ')}</span>
                )}
              </section>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-gray-500">no document generated yet</p>
              <p className="text-sm text-gray-400 mt-1">add some notes and text to your board first</p>
            </div>
          )}
        </div>

        {/* Footer with export options */}
        {document && !isLoading && (
          <div className="p-4 border-t border-black/5 bg-white/50">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={copyAllToClipboard}
                className="px-4 py-2 text-sm rounded-lg bg-gray-900 text-white hover:bg-gray-800 transition-colors flex items-center gap-2"
              >
                {copiedSection === 'all' ? '✓ copied' : '📋 copy all'}
              </button>
              <button
                onClick={exportAsMarkdown}
                className="px-4 py-2 text-sm rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                📄 export .md
              </button>
              <button
                onClick={exportAsText}
                className="px-4 py-2 text-sm rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                📝 export .txt
              </button>
              <div className="flex-1" />
              <span className="text-xs text-gray-400">
                powered by local ml · no data sent anywhere
              </span>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

