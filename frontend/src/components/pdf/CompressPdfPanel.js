'use client';

import { useState } from 'react';
import { UploadCloud, Minimize2, FileText, AlertCircle, Loader2, X, Check, Zap, Sparkles, Feather } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { Button } from '../Button';
import { formatBytes } from '../../services/pdfService';
import { clsx } from 'clsx';

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB

export default function CompressPdfPanel({ onSubmit, isLoading }) {
  const [file, setFile] = useState(null);
  const [level, setLevel] = useState('medium'); // 'low' | 'medium' | 'high'
  const [localError, setLocalError] = useState('');

  const onDrop = (acceptedFiles, fileRejections) => {
    setLocalError('');

    if (fileRejections && fileRejections.length > 0) {
      const firstRejection = fileRejections[0];
      if (firstRejection.errors[0]?.code === 'file-too-large') {
        setLocalError('Ukuran file melebihi batas maksimal 15 MB.');
      } else {
        setLocalError('Format file tidak didukung. Hanya file PDF (.pdf) yang diperbolehkan.');
      }
      return;
    }

    if (acceptedFiles && acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false,
    maxSize: MAX_FILE_SIZE_BYTES,
    disabled: isLoading,
  });

  const levels = [
    {
      id: 'low',
      title: 'Kompresi Ringan',
      badge: 'Kualitas Tinggi (300 DPI)',
      icon: Sparkles,
      desc: 'Kualitas hampir tanpa penurunan visual. Cocok untuk dokumen cetak atau portofolio desain.',
      ratio: '~15-30% Reduksi',
    },
    {
      id: 'medium',
      title: 'Standar / Seimbang',
      badge: 'Rekomendasi (150 DPI)',
      icon: Zap,
      desc: 'Kompresi optimal dengan teks dan grafik tetap tajam. Sangat cocok untuk dokumen kantor & email.',
      ratio: '~40-60% Reduksi',
      isPopular: true,
    },
    {
      id: 'high',
      title: 'Kompresi Maksimal',
      badge: 'Ukuran Terkecil (72 DPI)',
      icon: Feather,
      desc: 'Ukuran file dipadatkan semaksimal mungkin. Cocok untuk lampiran formulir online yang ketat.',
      ratio: '~70-85% Reduksi',
    },
  ];

  const canSubmit = Boolean(file) && !isLoading;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit({ file, level });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Minimize2 className="w-5 h-5 text-rose-400" />
          <span>Kompres Ukuran File PDF</span>
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Kecilkan ukuran dokumen PDF Anda dengan engine Ghostscript berkemampuan tinggi.
        </p>
      </div>

      {/* Dropzone Area or Selected File Card */}
      {!file ? (
        <div
          {...getRootProps()}
          className={clsx(
            'border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 flex flex-col items-center justify-center select-none cursor-pointer',
            isDragActive
              ? 'border-rose-500 bg-rose-500/10 scale-[0.99]'
              : 'border-slate-700/80 bg-slate-900/50 hover:border-rose-500/60 hover:bg-slate-900/80'
          )}
        >
          <input {...getInputProps()} />
          <div className="p-3 bg-rose-500/10 text-rose-400 rounded-full mb-3 border border-rose-500/20">
            <UploadCloud className="w-8 h-8" />
          </div>
          <p className="font-semibold text-slate-200">
            {isDragActive ? 'Lepaskan file PDF di sini...' : 'Tarik & lepas file PDF yang ingin dikompres'}
          </p>
          <p className="text-xs text-slate-400 mt-1">atau klik untuk memilih file dari perangkat Anda</p>
          <div className="flex items-center gap-2 mt-3 text-[11px] text-slate-500">
            <span>Format: .PDF</span>
            <span>•</span>
            <span>Maks. 15 MB</span>
            <span>•</span>
            <span>Engine: Ghostscript gs</span>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-2xl border border-rose-500/30 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0 mr-3">
            <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20 shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-200 truncate" title={file.name}>
                {file.name}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">Ukuran Asli: {formatBytes(file.size)}</p>
            </div>
          </div>
          <button
            type="button"
            disabled={isLoading}
            onClick={() => {
              setFile(null);
              setLocalError('');
            }}
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition cursor-pointer disabled:opacity-40"
            title="Ganti File"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {localError && (
        <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{localError}</span>
        </div>
      )}

      {/* Compression Level Selector */}
      <div className="space-y-3">
        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
          Pilih Tingkat Kompresi
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {levels.map((lvl) => {
            const Icon = lvl.icon;
            const isSelected = level === lvl.id;

            return (
              <div
                key={lvl.id}
                onClick={() => !isLoading && setLevel(lvl.id)}
                className={clsx(
                  'relative p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between',
                  isSelected
                    ? 'bg-rose-500/10 border-rose-500 shadow-md shadow-rose-950/30'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/90',
                  isLoading && 'opacity-60 cursor-not-allowed'
                )}
              >
                {lvl.isPopular && (
                  <span className="absolute -top-2.5 right-3 bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                    POPULER
                  </span>
                )}

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div
                      className={clsx(
                        'p-2 rounded-lg',
                        isSelected ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-400'
                      )}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-rose-400" />}
                  </div>

                  <h3 className={clsx('text-sm font-bold', isSelected ? 'text-white' : 'text-slate-200')}>
                    {lvl.title}
                  </h3>
                  <span className="text-[10px] text-rose-400 font-semibold">{lvl.badge}</span>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">{lvl.desc}</p>
                </div>

                <div className="mt-4 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Estimasi:</span>
                  <span className="font-semibold text-rose-300">{lvl.ratio}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={!canSubmit}
        className={clsx(
          'w-full py-3 text-sm font-semibold rounded-xl transition duration-150',
          'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-950/40 cursor-pointer disabled:cursor-not-allowed'
        )}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Mengompresi PDF via Ghostscript...</span>
          </span>
        ) : (
          <span>Kompres PDF Sekarang</span>
        )}
      </Button>
    </form>
  );
}
