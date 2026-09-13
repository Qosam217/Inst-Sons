'use client';

import { useState, useEffect } from 'react';
import { CheckCircle2, Download, Eye, RotateCcw, Image as ImageIcon, ArrowDownRight, Sparkles } from 'lucide-react';
import { Button } from '../Button';
import { formatBytes, triggerImageDownload } from '../../services/imageService';
import ImagePreviewModal from './ImagePreviewModal';
import { clsx } from 'clsx';

export default function ImageResultCard({ result, onReset }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [blobUrl, setBlobUrl] = useState(null);

  useEffect(() => {
    if (!result?.blob) return;
    const url = URL.createObjectURL(result.blob);
    setBlobUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [result]);

  if (!result) return null;

  const { blob, filename, originalSize, compressedSize, toolType, targetFormat } = result;

  const handleDownload = () => {
    triggerImageDownload(blob, filename || 'inst-sons-image.jpg');
  };

  const hasCompressionStats = originalSize && compressedSize && originalSize > compressedSize;
  const savedBytes = hasCompressionStats ? originalSize - compressedSize : 0;
  const savedPercent = hasCompressionStats
    ? Math.round(((originalSize - compressedSize) / originalSize) * 100)
    : 0;

  return (
    <>
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-amber-500/30 shadow-xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-2xl border border-amber-500/20">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <span className="text-xs uppercase font-bold tracking-wider text-amber-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Proses Sukses (Sharp Engine)</span>
            </span>
            <h3 className="text-xl font-bold text-white">
              {toolType === 'compress' ? 'Gambar Berhasil Dikompres!' : 'Gambar Berhasil Dikonversi!'}
            </h3>
          </div>
        </div>

        {/* File Details & Visual Output Card */}
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* Output Thumbnail with preview trigger */}
            <div
              onClick={() => setModalOpen(true)}
              className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-slate-950 border border-amber-500/30 flex items-center justify-center shrink-0 cursor-pointer group shadow-md"
              title="Klik untuk pratinjau penuh"
            >
              {blobUrl ? (
                <img
                  src={blobUrl}
                  alt={filename}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                />
              ) : (
                <ImageIcon className="w-8 h-8 text-amber-400" />
              )}
              <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                <Eye className="w-5 h-5" />
              </div>
            </div>

            {/* Info details */}
            <div className="min-w-0 flex-1 text-center sm:text-left space-y-1.5">
              <p className="text-sm font-semibold text-slate-100 truncate" title={filename}>
                {filename}
              </p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs">
                {targetFormat && (
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-300 font-semibold uppercase">
                    Format: {targetFormat}
                  </span>
                )}
                <span className="text-slate-400">
                  Ukuran Output: <strong className="text-slate-100">{formatBytes(blob.size)}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Compression Savings Stat */}
          {hasCompressionStats && (
            <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-slate-400">
                <span>Ukuran Asli: <strong>{formatBytes(originalSize)}</strong></span>
                <span>→</span>
                <span className="text-amber-400 font-semibold">{formatBytes(compressedSize)}</span>
              </div>
              <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold">
                <ArrowDownRight className="w-3.5 h-3.5" />
                <span>Hemat {savedPercent}% ({formatBytes(savedBytes)})</span>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            type="button"
            onClick={handleDownload}
            className={clsx(
              'w-full py-3.5 text-sm font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer',
              'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-950/40'
            )}
          >
            <Download className="w-4 h-4 stroke-[2.5]" />
            <span>Unduh Gambar Hasil ({formatBytes(blob.size)})</span>
          </Button>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setModalOpen(true)}
              className="w-full py-2.5 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 cursor-pointer bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Lihat Pratinjau Resolusi Penuh</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={onReset}
              className="w-full py-2.5 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 cursor-pointer border-slate-700 hover:bg-slate-800 text-slate-300"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Proses Gambar Lainnya</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      <ImagePreviewModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        imageSrc={blobUrl}
        filename={filename}
        filesize={blob.size}
      />
    </>
  );
}
