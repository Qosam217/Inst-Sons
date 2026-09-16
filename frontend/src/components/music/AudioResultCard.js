'use client';

import { useState, useEffect } from 'react';
import { CheckCircle2, Download, RotateCcw, Sparkles, ShieldCheck, Music } from 'lucide-react';
import { Button } from '../Button';
import AudioPlayerWidget from './AudioPlayerWidget';
import { formatBytes, formatDuration, triggerAudioDownload } from '../../services/musicService';
import { clsx } from 'clsx';

export default function AudioResultCard({ result, onReset }) {
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

  const {
    blob,
    filename,
    title,
    duration,
    toolType,
    targetFormat = 'MP3',
  } = result;

  const displayTitle = title || filename || 'Audio Track';
  const displayFilename = filename || `${displayTitle}.${targetFormat.toLowerCase()}`;

  const handleDownload = () => {
    triggerAudioDownload(blob, displayFilename);
  };

  return (
    <div className="p-6 sm:p-8 rounded-2xl bg-slate-900/90 border border-emerald-500/30 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
      {/* Header */}
      <div className="flex items-center gap-3.5">
        <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20 shadow-md shadow-emerald-500/10">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div>
          <span className="text-xs uppercase font-bold tracking-wider text-emerald-400 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>
              {toolType === 'youtube'
                ? 'Ekstraksi YouTube Berhasil'
                : 'Konversi Audio Berhasil'}
            </span>
          </span>
          <h3 className="text-xl font-bold text-white tracking-tight">
            Audio Siap Diunduh & Diputar
          </h3>
        </div>
      </div>

      {/* Metadata & Integrated Player Card */}
      <div className="p-4 sm:p-5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-4">
        {/* Track info header */}
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-bold uppercase">
              {targetFormat}
            </span>
            {duration ? (
              <span className="text-xs text-slate-400">
                Durasi: <strong className="text-slate-200">{formatDuration(duration)}</strong>
              </span>
            ) : null}
            {blob?.size ? (
              <span className="text-xs text-slate-400">
                Ukuran: <strong className="text-slate-200">{formatBytes(blob.size)}</strong>
              </span>
            ) : null}
          </div>
          <p className="text-sm font-semibold text-slate-100 line-clamp-2 pt-1" title={displayTitle}>
            {displayTitle}
          </p>
        </div>

        {/* Built-in HTML5 Audio Player */}
        {blobUrl && (
          <AudioPlayerWidget
            src={blobUrl}
            title={displayTitle}
            format={targetFormat.toUpperCase()}
            initialDuration={duration}
          />
        )}
      </div>

      {/* Security notice */}
      <div className="flex items-center gap-2 px-3 py-2 bg-slate-950/40 border border-slate-800/80 rounded-xl text-xs text-slate-400">
        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
        <span>Berkas di server otomatis dibersihkan segera setelah diunduh untuk menjaga privasi Anda.</span>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <Button
          type="button"
          onClick={handleDownload}
          className={clsx(
            'w-full py-3.5 text-sm font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer',
            'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-950/40'
          )}
        >
          <Download className="w-4 h-4 stroke-[2.5]" />
          <span>Unduh File Audio {blob?.size ? `(${formatBytes(blob.size)})` : ''}</span>
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={onReset}
          className="w-full py-2.5 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 cursor-pointer border-slate-700 hover:bg-slate-800 text-slate-300"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Proses Audio Lainnya</span>
        </Button>
      </div>
    </div>
  );
}
