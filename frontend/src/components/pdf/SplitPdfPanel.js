'use client';

import { useState } from 'react';
import { UploadCloud, Scissors, FileText, AlertCircle, Loader2, X, Hash } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { Button } from '../Button';
import { formatBytes } from '../../services/pdfService';
import { clsx } from 'clsx';

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB

export default function SplitPdfPanel({ onSubmit, isLoading }) {
  const [file, setFile] = useState(null);
  const [startPage, setStartPage] = useState(1);
  const [endPage, setEndPage] = useState(1);
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

  const parsedStart = parseInt(startPage, 10);
  const parsedEnd = parseInt(endPage, 10);

  const isStartValid = !isNaN(parsedStart) && parsedStart >= 1;
  const isEndValid = !isNaN(parsedEnd) && parsedEnd >= 1;
  const isRangeValid = isStartValid && isEndValid && parsedStart <= parsedEnd;
  const canSubmit = Boolean(file) && isRangeValid && !isLoading;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit({ file, startPage: parsedStart, endPage: parsedEnd });
  };

  const setPreset = (start, end) => {
    setStartPage(start);
    setEndPage(end);
    setLocalError('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Scissors className="w-5 h-5 text-rose-400" />
          <span>Pisahkan Dokumen PDF</span>
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Pilih 1 file PDF dan tentukan rentang halaman yang ingin diekstrak menjadi dokumen baru.
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
            {isDragActive ? 'Lepaskan file PDF di sini...' : 'Tarik & lepas file PDF yang ingin dipisahkan'}
          </p>
          <p className="text-xs text-slate-400 mt-1">atau klik untuk memilih file dari perangkat Anda</p>
          <div className="flex items-center gap-2 mt-3 text-[11px] text-slate-500">
            <span>Format: .PDF</span>
            <span>•</span>
            <span>Maks. 15 MB</span>
            <span>•</span>
            <span>Maks. 500 Halaman</span>
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
              <p className="text-xs text-slate-400 mt-0.5">{formatBytes(file.size)}</p>
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

      {/* Range Configuration */}
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Hash className="w-3.5 h-3.5 text-rose-400" />
            <span>Tentukan Rentang Halaman</span>
          </label>
          <span className="text-[11px] text-slate-400">1-based index (misal: hal 1 sampai 3)</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1.5 font-medium">Halaman Awal (Start Page)</label>
            <input
              type="number"
              min="1"
              max="500"
              disabled={isLoading}
              value={startPage}
              onChange={(e) => setStartPage(e.target.value)}
              className={clsx(
                'w-full bg-slate-850 bg-slate-900 border rounded-xl px-4 py-2.5 text-sm text-slate-200 transition focus:outline-none',
                !isStartValid || (isEndValid && parsedStart > parsedEnd)
                  ? 'border-rose-500 focus:border-rose-400'
                  : 'border-slate-700 focus:border-rose-500'
              )}
              placeholder="1"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1.5 font-medium">Halaman Akhir (End Page)</label>
            <input
              type="number"
              min="1"
              max="500"
              disabled={isLoading}
              value={endPage}
              onChange={(e) => setEndPage(e.target.value)}
              className={clsx(
                'w-full bg-slate-850 bg-slate-900 border rounded-xl px-4 py-2.5 text-sm text-slate-200 transition focus:outline-none',
                !isEndValid || (isStartValid && parsedStart > parsedEnd)
                  ? 'border-rose-500 focus:border-rose-400'
                  : 'border-slate-700 focus:border-rose-500'
              )}
              placeholder="1"
            />
          </div>
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs text-slate-400">Pilihan Cepat:</span>
          <button
            type="button"
            disabled={isLoading}
            onClick={() => setPreset(1, 1)}
            className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
          >
            Halaman 1 saja
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={() => setPreset(1, 3)}
            className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
          >
            Halaman 1 - 3
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={() => setPreset(1, 5)}
            className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
          >
            Halaman 1 - 5
          </button>
        </div>

        {/* Validation warning */}
        {isStartValid && isEndValid && parsedStart > parsedEnd && (
          <p className="text-xs text-rose-400">
            * Halaman awal ({parsedStart}) tidak boleh lebih besar dari halaman akhir ({parsedEnd}).
          </p>
        )}
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
            <span>Mengekstrak Halaman PDF...</span>
          </span>
        ) : (
          <span>
            Pisahkan PDF {isRangeValid ? `(Halaman ${parsedStart} - ${parsedEnd})` : ''}
          </span>
        )}
      </Button>
    </form>
  );
}
