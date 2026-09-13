'use client';

import { useState, useEffect } from 'react';
import { UploadCloud, Minimize2, AlertCircle, Loader2, X, Sparkles, Zap, Feather, Image as ImageIcon } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { Button } from '../Button';
import { formatBytes } from '../../services/imageService';
import { clsx } from 'clsx';

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB

export default function CompressImagePanel({ onSubmit, isLoading }) {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [dimensions, setDimensions] = useState(null);
  const [level, setLevel] = useState('medium'); // 'low' | 'medium' | 'high'
  const [localError, setLocalError] = useState('');

  // Handle preview object URL & dimensions detection
  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      setDimensions(null);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    // Read natural dimensions
    const img = new Image();
    img.onload = () => {
      setDimensions({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.src = objectUrl;

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  const onDrop = (acceptedFiles, fileRejections) => {
    setLocalError('');

    if (fileRejections && fileRejections.length > 0) {
      const firstRejection = fileRejections[0];
      if (firstRejection.errors[0]?.code === 'file-too-large') {
        setLocalError('Ukuran file gambar melebihi batas maksimal 15 MB.');
      } else {
        setLocalError('Format file tidak didukung. Harap unggah file JPG, PNG, WebP, AVIF, atau GIF.');
      }
      return;
    }

    if (acceptedFiles && acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
      'image/avif': ['.avif'],
      'image/gif': ['.gif'],
    },
    multiple: false,
    maxSize: MAX_FILE_SIZE_BYTES,
    disabled: isLoading,
  });

  const levels = [
    {
      id: 'low',
      title: 'Kompresi Ringan',
      badge: 'Resolusi Asli (Q: 80)',
      icon: Sparkles,
      desc: 'Mempertahankan resolusi asli tanpa resize. Kualitas visual sangat prima untuk portofolio & cetak.',
      ratio: '~20-40% Reduksi',
    },
    {
      id: 'medium',
      title: 'Standar / Seimbang',
      badge: 'Rekomendasi (Max 1920px)',
      icon: Zap,
      desc: 'Kompresi optimal dengan resize Full HD. Sangat pas untuk website, media sosial, & arsip harian.',
      ratio: '~50-70% Reduksi',
      isPopular: true,
    },
    {
      id: 'high',
      title: 'Kompresi Maksimal',
      badge: 'Super Hemat (Max 1080px)',
      icon: Feather,
      desc: 'Kecilkan resolusi hingga 1080p dengan kompresi kuat. Cocok untuk lampiran formulir email & thumbnail.',
      ratio: '~75-90% Reduksi',
    },
  ];

  const handleRemoveFile = () => {
    setFile(null);
    setLocalError('');
  };

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
          <Minimize2 className="w-5 h-5 text-amber-400" />
          <span>Kompres Ukuran File Gambar</span>
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Kecilkan bobot file foto dan gambar Anda dengan engine Sharp berkecepatan tinggi di RAM.
        </p>
      </div>

      {/* Dropzone Area or Selected File Preview Card */}
      {!file ? (
        <div
          {...getRootProps()}
          className={clsx(
            'border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 flex flex-col items-center justify-center select-none cursor-pointer',
            isDragActive
              ? 'border-amber-500 bg-amber-500/10 scale-[0.99]'
              : 'border-slate-700/80 bg-slate-900/50 hover:border-amber-500/60 hover:bg-slate-900/80'
          )}
        >
          <input {...getInputProps()} />
          <div className="p-4 bg-amber-500/10 text-amber-400 rounded-2xl mb-3 border border-amber-500/20">
            <UploadCloud className="w-8 h-8" />
          </div>
          <p className="font-semibold text-slate-200 text-base">
            Tarik & lepas file gambar Anda ke sini
          </p>
          <p className="text-xs text-slate-400 mt-1.5 max-w-sm leading-relaxed">
            Mendukung format <span className="text-slate-300 font-medium">JPG, PNG, WebP, AVIF, GIF</span> hingga ukuran maksimal <span className="text-amber-400 font-semibold">15 MB</span>.
          </p>
          <div className="mt-4 px-3.5 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-xs text-slate-300 font-medium">
            Pilih 1 File Gambar
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Gambar Terpilih
            </span>
            <button
              type="button"
              disabled={isLoading}
              onClick={handleRemoveFile}
              className="text-xs text-slate-400 hover:text-rose-400 p-1 rounded-md hover:bg-rose-500/10 transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              <X className="w-4 h-4" />
              <span>Ganti Gambar</span>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 p-3 bg-slate-900 rounded-xl border border-slate-800">
            {/* Thumbnail Preview */}
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Pratinjau Gambar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <ImageIcon className="w-8 h-8 text-slate-600" />
              )}
            </div>

            {/* File Info */}
            <div className="min-w-0 flex-1 space-y-1.5 text-center sm:text-left">
              <p className="text-sm font-semibold text-slate-100 truncate" title={file.name}>
                {file.name}
              </p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs">
                <span className="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-300 font-semibold uppercase">
                  {file.type ? file.type.replace('image/', '') : 'IMAGE'}
                </span>
                <span className="text-slate-400">
                  Ukuran: <strong className="text-slate-200">{formatBytes(file.size)}</strong>
                </span>
                {dimensions && (
                  <span className="text-slate-400">
                    • Resolusi: <strong className="text-slate-200">{dimensions.width} × {dimensions.height} px</strong>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Local Error Feedback */}
      {localError && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{localError}</span>
        </div>
      )}

      {/* Compression Level Selector */}
      <div className="space-y-3">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
          Pilih Tingkat Kompresi
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {levels.map((item) => {
            const Icon = item.icon;
            const isSelected = level === item.id;

            return (
              <button
                key={item.id}
                type="button"
                disabled={isLoading}
                onClick={() => setLevel(item.id)}
                className={clsx(
                  'relative p-4 rounded-xl text-left transition-all duration-200 flex flex-col justify-between select-none cursor-pointer',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  isSelected
                    ? 'bg-amber-500/10 border-2 border-amber-500 shadow-md shadow-amber-950/20 ring-1 ring-amber-500/50'
                    : 'bg-slate-900/60 border border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                )}
              >
                {item.isPopular && (
                  <span className="absolute -top-2.5 right-3 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold text-[10px] px-2 py-0.5 rounded-full shadow-sm uppercase tracking-wide">
                    Rekomendasi
                  </span>
                )}

                <div>
                  <div className="flex items-center gap-2.5 mb-2">
                    <div
                      className={clsx(
                        'p-2 rounded-lg',
                        isSelected ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'
                      )}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className={clsx('text-sm font-bold', isSelected ? 'text-white' : 'text-slate-200')}>
                        {item.title}
                      </h4>
                      <p className="text-[10px] font-semibold text-amber-400">{item.badge}</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed mt-2">{item.desc}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Estimasi:</span>
                  <span className={clsx('text-xs font-semibold', isSelected ? 'text-amber-300' : 'text-slate-300')}>
                    {item.ratio}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* CTA Submit Button */}
      <Button
        type="submit"
        disabled={!canSubmit}
        className={clsx(
          'w-full py-3.5 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-lg cursor-pointer',
          canSubmit
            ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-950/50 hover:shadow-amber-500/20'
            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
        )}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
            <span>Mengompres Gambar via Sharp...</span>
          </>
        ) : (
          <>
            <Minimize2 className="w-4 h-4" />
            <span>
              Kompres Gambar ({level.toUpperCase()})
            </span>
          </>
        )}
      </Button>
    </form>
  );
}
