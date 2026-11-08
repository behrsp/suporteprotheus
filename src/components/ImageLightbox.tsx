import React, { useState } from 'react';
import { X, ZoomIn, ZoomOut, Download, Copy, Check } from 'lucide-react';

interface ImageLightboxProps {
  isOpen: boolean;
  imageUrl: string | null;
  imageTitle?: string;
  onClose: () => void;
}

export const ImageLightbox: React.FC<ImageLightboxProps> = ({
  isOpen,
  imageUrl,
  imageTitle = 'Visualização do Print',
  onClose,
}) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !imageUrl) return null;

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.25, 0.5));
  const handleResetZoom = () => setZoomLevel(1);

  const handleCopyImage = async () => {
    try {
      if (imageUrl.startsWith('data:image/')) {
        // Fetch base64 blob and write to clipboard
        const res = await fetch(imageUrl);
        const blob = await res.blob();
        await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // Fallback
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-2 sm:p-6 animate-in fade-in duration-200">
      {/* Top Bar */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between text-slate-200 z-10 pointer-events-auto">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-200 truncate max-w-xs sm:max-w-md">
            {imageTitle}
          </span>
          <span className="text-xs text-slate-400 font-mono">
            {Math.round(zoomLevel * 100)}%
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Reduzir zoom"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetZoom}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-xs font-mono text-slate-300 hover:text-white transition-colors"
            title="Ajustar tela"
          >
            100%
          </button>
          <button
            onClick={handleZoomIn}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Aumentar zoom"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          {imageUrl.startsWith('data:') && (
            <button
              onClick={handleCopyImage}
              className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Copiar imagem"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          )}

          <a
            href={imageUrl}
            download={`help_print_${Date.now()}.png`}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Baixar imagem"
          >
            <Download className="w-4 h-4" />
          </a>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 hover:text-white transition-colors ml-2"
            title="Fechar (ESC)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Image container */}
      <div
        className="w-full h-full flex items-center justify-center overflow-auto p-4 cursor-grab active:cursor-grabbing"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <img
          src={imageUrl}
          alt={imageTitle}
          style={{ transform: `scale(${zoomLevel})` }}
          className="max-w-[95vw] max-h-[85vh] object-contain rounded-lg shadow-2xl transition-transform duration-150 select-none border border-slate-700/50"
        />
      </div>
    </div>
  );
};
