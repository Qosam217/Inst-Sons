'use client';

import { useState, useMemo, useEffect } from 'react';
import { Music, UploadCloud, RefreshCw, X, AlertTriangle, Check, FileAudio } from 'lucide-react';
import { Button } from '../Button';
import FileDropzone from '../FileDropzone';
import AudioPlayerWidget from './AudioPlayerWidget';
import { formatBytes } from '../../services/musicService';
import { clsx } from 'clsx';

const TARGET_FORMATS = [
  {
    id: 'mp3',
    name: 'MP3',
    label: 'Universal Standard',
    desc: 'Kompatibilitas 100% di semua perangkat & media player.',
  },
  {
    id: 'wav',
    name: 'WAV',
    label: 'Lossless Uncompressed',
    desc: 'Kualitas studio murni tanpa kompresi data.',
  },
  {
    id: 'aac',
    name: 'AAC',
    label: 'Advanced Audio Coding',
    desc: 'Efisiensi kompresi tinggi standar Apple & streaming.',
  },
  {
    id: 'ogg',
    name: 'OGG',
    label: 'Open Source Vorbis',
    desc: 'Format open-source berkualitas tinggi untuk web & game.',
  },
  {
    id: 'flac',
    name: 'FLAC',
    label: 'Free Lossless Audio',
    desc: 'Kompresi lossless audiophile tanpa pengurangan kualitas.',
  },
];

const MAX_FILE_SIZE_BYTES = 30 * 1024 * 1024; // 30 MB

export default function ConvertAudioPanel({ onSubmit, isLoading = false }) {
  const [file, setFile] = useState(null);
  const [targetFormat, setTargetFormat] = useState('mp3');
  const [dropzoneError, setDropzoneError] = useState('');
  const [localAudioUrl, setLocalAudioUrl] = useState(null);

  // Generate object URL for instant client-side preview
  useEffect(() => {
    if (!file) {
      setLocalAudioUrl(null);
      return;
    }

    const url = URL.createObjectURL(file);
    setLocalAudioUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  const sourceExtension = useMemo(() => {
    if (!file?.name) return '';
    return file.name.split('.').pop()?.toLowerCase() || '';
  }, [file]);

  const isSameFormat = sourceExtension === targetFormat.toLowerCase();

  const handleDrop = (acceptedFiles, rejectedFiles) => {
    setDropzoneError('');

    if (rejectedFiles && rejectedFiles.length > 0) {
      const rej = rejectedFiles[0];
      if (rej.size > MAX_FILE_SIZE_BYTES) {
        setDropzoneError('Ukuran file audio melebihi batas maksimal 30 MB.');
      } else {
        setDropzoneError('Hanya format audio (MP3, WAV, OGG, AAC, FLAC, M4A) yang didukung.');
      }
      return;
    }

    if (acceptedFiles && acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
        setDropzoneError('Ukuran file audio melebihi batas maksimal 30 MB.');
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setDropzoneError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!file || isLoading) return;
    onSubmit({ file, format: targetFormat });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title & Description */}
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-emerald-400" />
          <span>Konversi Format File Audio</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-400">
          Ubah file audio Anda ke format MP3, WAV, AAC, OGG, atau FLAC dengan engine FFmpeg berkualitas tinggi.
        </p>
      </div>

      {/* Dropzone or Selected File Preview */}
      {!file ? (
        <div className="space-y-2">
          <FileDropzone
            onDrop={handleDrop}
            accept={{
              'audio/*': ['.mp3', '.wav', '.ogg', '.aac', '.flac', '.m4a'],
            }}
            multiple={false}
            title="Tarik & lepas file audio di sini (Maks. 30 MB & 8 Menit)"
          />
          {dropzoneError && (
            <p className="text-xs text-rose-400 font-medium">{dropzoneError}</p>
          )}
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-4">
          {/* Source File Info Header */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20 shrink-0">
                <FileAudio className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate" title={file.name}>
                  {file.name}
                </p>
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                  <span className="uppercase font-semibold text-emerald-400">
                    {sourceExtension || 'AUDIO'}
                  </span>
                  <span>•</span>
                  <span>{formatBytes(file.size)}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              disabled={isLoading}
              onClick={handleRemoveFile}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition cursor-pointer shrink-0"
              title="Ganti atau hapus file"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Local Audio Player Preview */}
          {localAudioUrl && (
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Pratinjau File Sumber:
              </span>
              <AudioPlayerWidget
                src={localAudioUrl}
                title={file.name}
                format={sourceExtension.toUpperCase()}
              />
            </div>
          )}
        </div>
      )}

      {/* Target Format Grid Cards */}
      <div className="space-y-2.5">
        <label className="block text-xs font-semibold text-slate-300">
          Pilih Format Output Target
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {TARGET_FORMATS.map((fmt) => {
            const isSelected = targetFormat === fmt.id;
            return (
              <button
                key={fmt.id}
                type="button"
                disabled={isLoading}
                onClick={() => setTargetFormat(fmt.id)}
                className={clsx(
                  'relative p-3.5 rounded-xl text-left border transition cursor-pointer flex flex-col justify-between',
                  isSelected
                    ? 'bg-emerald-500/10 border-emerald-500 text-white shadow-sm'
                    : 'bg-slate-950/60 border-slate-800/90 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                )}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className={clsx('text-base font-extrabold', isSelected ? 'text-emerald-400' : 'text-slate-200')}>
                      {fmt.name}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400">
                      {fmt.label}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-tight">{fmt.desc}</p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
                  <span className={isSelected ? 'text-emerald-400 font-semibold' : 'text-slate-500'}>
                    {isSelected ? 'Format Terpilih' : 'Pilih Format'}
                  </span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Same format warning if applicable */}
      {file && isSameFormat && (
        <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>Format target sama dengan format asal file ({sourceExtension.toUpperCase()}). Konversi tetap dapat dijalankan untuk perbaikan encoding stream.</span>
        </div>
      )}

      {/* CTA Button */}
      <Button
        type="submit"
        disabled={!file || isLoading}
        className={clsx(
          'w-full py-3.5 text-sm font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer',
          file && !isLoading
            ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-950/40'
            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
        )}
      >
        <RefreshCw className="w-4 h-4" />
        <span>Konversi ke {targetFormat.toUpperCase()}</span>
      </Button>
    </form>
  );
}
