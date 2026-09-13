'use client';

import { useState } from 'react';
import { UploadCloud, Layers, AlertCircle, Loader2 } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { Button } from '../Button';
import PdfFileList from './PdfFileList';
import { formatBytes } from '../../services/pdfService';
import { clsx } from 'clsx';

const MAX_FILES = 5;
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_TOTAL_SIZE_BYTES = 30 * 1024 * 1024; // 30 MB

export default function MergePdfPanel({ onSubmit, isLoading }) {
  const [files, setFiles] = useState([]);
  const [localError, setLocalError] = useState('');

  const onDrop = (acceptedFiles, fileRejections) => {
    setLocalError('');

    if (fileRejections && fileRejections.length > 0) {
      const firstRejection = fileRejections[0];
      if (firstRejection.errors[0]?.code === 'file-too-large') {
        setLocalError(`File "${firstRejection.file.name}" melebihi batas maksimal 10 MB.`);
      } else {
        setLocalError('Format file tidak didukung. Hanya file PDF (.pdf) yang diperbolehkan.');
      }
      return;
    }

    if (!acceptedFiles || acceptedFiles.length === 0) return;

    // Cek jika penambahan file melebihi batas maksimum 5 file
    if (files.length + acceptedFiles.length > MAX_FILES) {
      setLocalError(`Maksimal hanya dapat menggabungkan ${MAX_FILES} file PDF.`);
      return;
    }

    const updated = [...files, ...acceptedFiles];
    const totalBytes = updated.reduce((acc, f) => acc + f.size, 0);

    if (totalBytes > MAX_TOTAL_SIZE_BYTES) {
      setLocalError(`Total ukuran file (${formatBytes(totalBytes)}) melebihi batas maksimal 30 MB.`);
      return;
    }

    setFiles(updated);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: true,
    maxSize: MAX_FILE_SIZE_BYTES,
    disabled: isLoading || files.length >= MAX_FILES,
  });

  const handleMoveUp = (index) => {
    if (index === 0) return;
    const updated = [...files];
    const temp = updated[index - 1];
    updated[index - 1] = updated[index];
    updated[index] = temp;
    setFiles(updated);
  };

  const handleMoveDown = (index) => {
    if (index === files.length - 1) return;
    const updated = [...files];
    const temp = updated[index + 1];
    updated[index + 1] = updated[index];
    updated[index] = temp;
    setFiles(updated);
  };

  const handleRemove = (index) => {
    const updated = files.filter((_, i) => i !== index);
    setFiles(updated);
    setLocalError('');
  };

  const totalSize = files.reduce((acc, f) => acc + f.size, 0);
  const isValidCount = files.length >= 2 && files.length <= MAX_FILES;
  const isValidSize = totalSize <= MAX_TOTAL_SIZE_BYTES;
  const canSubmit = isValidCount && isValidSize && !isLoading;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit(files);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Layers className="w-5 h-5 text-rose-400" />
          <span>Gabungkan Dokumen PDF</span>
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Pilih 2 hingga 5 file PDF untuk digabungkan menjadi satu file secara berurutan.
        </p>
      </div>

      {/* Dropzone Area */}
      <div
        {...getRootProps()}
        className={clsx(
          'border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 flex flex-col items-center justify-center select-none',
          files.length >= MAX_FILES
            ? 'opacity-60 border-slate-800 bg-slate-900/30 cursor-not-allowed'
            : isDragActive
            ? 'border-rose-500 bg-rose-500/10 cursor-pointer scale-[0.99]'
            : 'border-slate-700/80 bg-slate-900/50 hover:border-rose-500/60 hover:bg-slate-900/80 cursor-pointer'
        )}
      >
        <input {...getInputProps()} />
        <div className="p-3 bg-rose-500/10 text-rose-400 rounded-full mb-3 border border-rose-500/20">
          <UploadCloud className="w-8 h-8" />
        </div>
        <p className="font-semibold text-slate-200">
          {files.length >= MAX_FILES
            ? 'Batas maksimal 5 file telah tercapai'
            : isDragActive
            ? 'Lepaskan file PDF di sini...'
            : 'Tarik & lepas file PDF di sini'}
        </p>
        <p className="text-xs text-slate-400 mt-1">
          {files.length < MAX_FILES && 'atau klik untuk memilih file dari perangkat Anda'}
        </p>
        <div className="flex items-center gap-2 mt-3 text-[11px] text-slate-500">
          <span>Format: .PDF</span>
          <span>•</span>
          <span>Maks. 10 MB per file</span>
          <span>•</span>
          <span>Maks. 5 file (Total 30 MB)</span>
        </div>
      </div>

      {localError && (
        <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{localError}</span>
        </div>
      )}

      {/* File List Component */}
      {files.length > 0 && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between text-xs font-medium px-1">
            <span className={clsx(files.length < 2 ? 'text-amber-400' : 'text-emerald-400')}>
              {files.length} dari {MAX_FILES} file terpilih {files.length < 2 && '(Minimal 2 file)'}
            </span>
            <span className={clsx(totalSize > MAX_TOTAL_SIZE_BYTES ? 'text-rose-400' : 'text-slate-400')}>
              Total: {formatBytes(totalSize)} / 30 MB
            </span>
          </div>

          <PdfFileList
            files={files}
            onMoveUp={handleMoveUp}
            onMoveDown={handleMoveDown}
            onRemove={handleRemove}
            disabled={isLoading}
          />
        </div>
      )}

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
            <span>Menggabungkan Dokumen PDF...</span>
          </span>
        ) : (
          <span>Gabungkan {files.length > 0 ? `${files.length} File PDF` : 'PDF'}</span>
        )}
      </Button>
    </form>
  );
}
