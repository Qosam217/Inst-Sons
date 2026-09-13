'use client';

import { CheckCircle2, Download, ExternalLink, RotateCcw, FileText, ArrowDownRight } from 'lucide-react';
import { Button } from '../Button';
import { formatBytes, triggerBlobDownload } from '../../services/pdfService';
import { clsx } from 'clsx';

export default function PdfResultCard({ result, onReset }) {
  if (!result) return null;

  const { blob, filename, originalSize, compressedSize, toolType } = result;

  const handleDownload = () => {
    triggerBlobDownload(blob, filename || 'inst-sons-document.pdf');
  };

  const handlePreview = () => {
    const url = window.URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  const hasCompressionStats = originalSize && compressedSize && originalSize > compressedSize;
  const savedBytes = hasCompressionStats ? originalSize - compressedSize : 0;
  const savedPercent = hasCompressionStats
    ? Math.round(((originalSize - compressedSize) / originalSize) * 100)
    : 0;

  return (
    <div className="p-6 rounded-2xl bg-slate-900/90 border border-emerald-500/30 shadow-xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div>
          <span className="text-xs uppercase font-bold tracking-wider text-emerald-400">Status Sukses</span>
          <h3 className="text-xl font-bold text-white">Dokumen PDF Berhasil Diproses!</h3>
        </div>
      </div>

      {/* File Details Card */}
      <div className="p-4 rounded-xl bg-slate-850 bg-slate-950/60 border border-slate-800 space-y-3">
        <div className="flex items-center gap-3">
          <FileText className="w-6 h-6 text-rose-400 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-100 truncate" title={filename}>
              {filename}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Ukuran Dokumen: <span className="text-slate-200 font-medium">{formatBytes(blob.size)}</span>
            </p>
          </div>
        </div>

        {/* Compression Savings Stat */}
        {hasCompressionStats && (
          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-slate-400">
              <span>{formatBytes(originalSize)}</span>
              <span>→</span>
              <span className="text-emerald-400 font-semibold">{formatBytes(compressedSize)}</span>
            </div>
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold">
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
            'w-full py-3 text-sm font-semibold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer',
            'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-950/40'
          )}
        >
          <Download className="w-4 h-4" />
          <span>Unduh Dokumen PDF ({formatBytes(blob.size)})</span>
        </Button>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={handlePreview}
            className="w-full py-2.5 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 cursor-pointer bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Buka Pratinjau (Tab Baru)</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={onReset}
            className="w-full py-2.5 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 cursor-pointer border-slate-700 hover:bg-slate-800 text-slate-300"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Proses File Lainnya</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
