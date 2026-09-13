'use client';

import { useEffect } from 'react';
import { X, Download, ZoomIn, Image as ImageIcon } from 'lucide-react';
import { Button } from '../Button';
import { formatBytes, triggerImageDownload } from '../../services/imageService';

export default function ImagePreviewModal({ isOpen, onClose, imageSrc, filename, filesize }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !imageSrc) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative max-w-4xl w-full max-h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5 min-w-0">
            <ImageIcon className="w-5 h-5 text-amber-400 shrink-0" />
            <div className="min-w-0">
              <h4 className="text-sm font-semibold text-white truncate max-w-md" title={filename}>
                {filename || 'Pratinjau Gambar'}
              </h4>
              {filesize && (
                <p className="text-xs text-slate-400">
                  Ukuran: <span className="text-slate-200">{formatBytes(filesize)}</span>
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            aria-label="Tutup pratinjau"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Image Display Area with checkerboard background for transparency support */}
        <div className="relative flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-950/50 min-h-[300px]">
          <div className="max-w-full max-h-[65vh] flex items-center justify-center rounded-lg overflow-hidden shadow-lg border border-slate-800 bg-slate-900">
            <img
              src={imageSrc}
              alt={filename || 'Pratinjau Hasil'}
              className="max-w-full max-h-[65vh] object-contain select-none"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-3 border-t border-slate-800 bg-slate-900/90">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="text-xs py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 cursor-pointer"
          >
            Tutup
          </Button>
          <Button
            type="button"
            onClick={() => {
              const link = document.createElement('a');
              link.href = imageSrc;
              link.setAttribute('download', filename || 'inst-sons-image');
              document.body.appendChild(link);
              link.click();
              link.parentNode.removeChild(link);
            }}
            className="text-xs py-2 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-lg shadow-amber-950/30 flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Unduh Gambar</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
