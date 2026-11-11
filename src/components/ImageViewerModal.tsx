import React from 'react';
import { X, ZoomIn, ZoomOut, Download } from 'lucide-react';

interface ImageViewerModalProps {
  isOpen: boolean;
  imageUrl: string | null;
  caption?: string;
  onClose: () => void;
}

export const ImageViewerModal: React.FC<ImageViewerModalProps> = ({
  isOpen,
  imageUrl,
  caption,
  onClose
}) => {
  const [scale, setScale] = React.useState(1);

  if (!isOpen || !imageUrl) return null;

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.5));
  const handleResetZoom = () => setScale(1);

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = `evidencia-foto-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      {/* Top Bar */}
      <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
        <button
          onClick={handleZoomIn}
          className="p-2 text-white bg-slate-800/80 hover:bg-slate-700 rounded-lg transition-colors"
          title="Acercar"
          aria-label="Acercar"
        >
          <ZoomIn className="w-5 h-5" />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-2 text-white bg-slate-800/80 hover:bg-slate-700 rounded-lg transition-colors"
          title="Alejar"
          aria-label="Alejar"
        >
          <ZoomOut className="w-5 h-5" />
        </button>
        <button
          onClick={handleDownload}
          className="p-2 text-white bg-slate-800/80 hover:bg-slate-700 rounded-lg transition-colors"
          title="Descargar Foto"
          aria-label="Descargar Foto"
        >
          <Download className="w-5 h-5" />
        </button>
        <button
          onClick={onClose}
          className="p-2 text-white bg-red-600/80 hover:bg-red-600 rounded-lg transition-colors"
          title="Cerrar"
          aria-label="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Image container */}
      <div className="max-w-5xl max-h-[85vh] flex flex-col items-center justify-center overflow-auto p-4">
        <img
          src={imageUrl}
          alt={caption || 'Evidencia fotográfica ampliada'}
          style={{ transform: `scale(${scale})` }}
          className="max-h-[75vh] w-auto object-contain rounded-lg shadow-2xl transition-transform duration-200"
          onClick={handleResetZoom}
        />
        {caption && (
          <p className="mt-4 text-center text-sm text-slate-200 bg-slate-900/90 px-4 py-2 rounded-lg max-w-xl">
            {caption}
          </p>
        )}
      </div>
    </div>
  );
};
