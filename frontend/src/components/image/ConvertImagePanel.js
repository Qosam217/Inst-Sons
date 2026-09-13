'use client';

import { useState, useEffect } from 'react';
import { UploadCloud, RefreshCw, AlertCircle, Loader2, X, Sparkles, Image as ImageIcon, Check, Info } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { Button } from '../Button';
import { formatBytes } from '../../services/imageService';
import { clsx } from 'clsx';

const MAX_CONVERT_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export default function ConvertImagePanel({ onSubmit, isLoading }) {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [dimensions, setDimensions] = useState(null);
  const [format, setFormat] = useState('webp'); // 'webp' | 'png' | 'jpeg' | 'avif' | 'gif'
  const [localError, setLocalError] = useState('');

  // Handle client-side preview & dimensions detection
  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      setDimensions(null);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

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
        setLocalError('Ukuran file gambar melebihi batas maksimal 10 MB.');
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
    maxSize: MAX_CONVERT_SIZE_BYTES,
    disabled: isLoading,
  });

  const formatOptions = [
    {
      id: 'webp',
      label: 'WebP',
      badge: 'Rekomendasi Web',
      desc: 'Ukuran file 30% lebih ringkas dari JPEG dengan kualitas visual sebanding. Standar modern web.',
      isPopular: true,
    },
    {
      id: 'png',
      label: 'PNG',
      badge: 'Transparan / Lossless',
      desc: 'Format tanpa kehilangan detail (lossless), mempertahankan latar belakang transparan (alpha).',
    },
    {
      id: 'jpeg',
      label: 'JPG / JPEG',
      badge: 'Standar Universal',
      desc: 'Format paling kompatibel di hampir semua perangkat, software grafis, dan sistem operasi.',
    },
    {
      id: 'avif',
      label: 'AVIF',
      badge: 'Next-Gen Efisiensi',
      desc: 'Format generasi terbaru berbasis AV1 codec dengan rasio kompresi tertinggi di industri.',
    },
    {
      id: 'gif',
      label: 'GIF',
      badge: 'Grafis Palet',
      desc: 'Format gambar palet warna (maks 256 warna), ideal untuk diagram sederhana atau ikon retro.',
    },
  ];

  const handleRemoveFile = () => {
    setFile(null);
    setLocalError('');
  };

  const getSourceExt = () => {
    if (!file) return '';
    const ext = file.name.split('.').pop()?.toLowerCase();
    return ext === 'jpg' ? 'jpeg' : ext;
  };

  const isSameFormat = file && getSourceExt() === (format === 'jpg' ? 'jpeg' : format);

  const canSubmit = Boolean(file) && !isLoading;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit({ file, format });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-amber-400" />
          <span>Konversi Format Gambar</span>
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Ubah ekstensi format file gambar Anda secara instan tanpa menurunkan ketajaman piksel.
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
            Tarik & lepas gambar yang ingin dikonversi
          </p>
          <p className="text-xs text-slate-400 mt-1.5 max-w-sm leading-relaxed">
            Format input: <span className="text-slate-300 font-medium">JPG, PNG, WebP, AVIF, GIF</span> • Maksimal <span className="text-amber-400 font-semibold">10 MB</span>.
          </p>
          <div className="mt-4 px-3.5 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-xs text-slate-300 font-medium">
            Pilih 1 File Gambar
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Gambar Sumber (Input)
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
                  alt="Pratinjau Gambar Sumber"
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
                  Format Asal: {file.type ? file.type.replace('image/', '') : getSourceExt()}
                </span>
                <span className="text-slate-400">
                  Ukuran: <strong className="text-slate-200">{formatBytes(file.size)}</strong>
                </span>
                {dimensions && (
                  <span className="text-slate-400">
                    • Dimensi: <strong className="text-slate-200">{dimensions.width} × {dimensions.height} px</strong>
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

      {/* Target Format Selector Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
            Pilih Format Target Output
          </label>
          {isSameFormat && (
            <div className="flex items-center gap-1.5 text-xs text-amber-400/90 font-medium">
              <Info className="w-3.5 h-3.5" />
              <span>Format target sama dengan format asal</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {formatOptions.map((item) => {
            const isSelected = format === item.id;

            return (
              <button
                key={item.id}
                type="button"
                disabled={isLoading}
                onClick={() => setFormat(item.id)}
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
                    Populer
                  </span>
                )}

                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className={clsx('text-base font-extrabold tracking-wide uppercase', isSelected ? 'text-amber-400' : 'text-white')}>
                        {item.label}
                      </span>
                    </div>
                    {isSelected && (
                      <span className="p-1 rounded-full bg-amber-500 text-slate-950">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}
                  </div>

                  <p className="text-[10px] font-semibold text-amber-300/80 mb-2">{item.badge}</p>
                  <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
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
            <span>Mengonversi ke {format.toUpperCase()} via Sharp...</span>
          </>
        ) : (
          <>
            <RefreshCw className="w-4 h-4" />
            <span>
              Mulai Konversi ke {format.toUpperCase()}
            </span>
          </>
        )}
      </Button>
    </form>
  );
}
