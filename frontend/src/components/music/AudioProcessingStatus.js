'use client';

import { useState, useEffect } from 'react';
import { Loader2, Music, Youtube, RefreshCw, XCircle, Clock } from 'lucide-react';
import { formatDuration } from '../../services/musicService';
import { clsx } from 'clsx';

export default function AudioProcessingStatus({
  toolType = 'youtube', // 'youtube' | 'convert'
  onCancel,
  targetFormat,
}) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Tahapan pesan status dinamis berdasarkan durasi berjalan
  const getStatusMessage = () => {
    if (toolType === 'youtube') {
      if (elapsedSeconds < 4) {
        return 'Menghubungi server YouTube dan mengekstrak info metadata...';
      }
      if (elapsedSeconds < 14) {
        return 'Mengunduh stream audio dan mengekstrak track via yt-dlp...';
      }
      return 'Mengonversi dan menyelaraskan bitrate MP3 kualitas tinggi...';
    } else {
      if (elapsedSeconds < 3) {
        return 'Mengunggah berkas audio ke engine backend FFmpeg...';
      }
      if (elapsedSeconds < 10) {
        return `Memproses transcoding stream ke format ${targetFormat?.toUpperCase() || 'AUDIO'}...`;
      }
      return 'Menyelesaikan berkas dan menyiapkan tautan unduhan aman...';
    }
  };

  const steps = toolType === 'youtube'
    ? [
        { label: 'Metadata & URL', active: true },
        { label: 'Ekstraksi yt-dlp', active: elapsedSeconds >= 3 },
        { label: 'Encoding MP3', active: elapsedSeconds >= 10 },
      ]
    : [
        { label: 'Upload Berkas', active: true },
        { label: `Encoding ${targetFormat?.toUpperCase() || 'Audio'}`, active: elapsedSeconds >= 3 },
        { label: 'Finalisasi', active: elapsedSeconds >= 9 },
      ];

  return (
    <div className="p-6 sm:p-8 rounded-2xl bg-slate-900/90 border border-emerald-500/30 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
      {/* Waveform & Spinner Visuals */}
      <div className="flex flex-col items-center text-center space-y-4">
        {/* Animated Waveform Bars & Glowing Circle */}
        <div className="relative flex items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center animate-pulse shadow-lg shadow-emerald-500/20">
            {toolType === 'youtube' ? (
              <Youtube className="w-9 h-9 text-rose-500" />
            ) : (
              <Music className="w-9 h-9 text-emerald-400" />
            )}
          </div>
          {/* Outer spinning ring */}
          <Loader2 className="absolute w-24 h-24 text-emerald-500/40 animate-spin stroke-[1.5]" />
        </div>

        {/* Dynamic Waveform Bars */}
        <div className="flex items-end justify-center gap-1.5 h-8 w-40 pt-2">
          {[35, 75, 100, 60, 90, 45, 80, 50, 95, 40].map((h, i) => (
            <span
              key={i}
              className="w-1.5 bg-emerald-400 rounded-full animate-bounce"
              style={{
                height: `${h}%`,
                animationDelay: `${(i % 5) * 120}ms`,
                animationDuration: '800ms',
              }}
            />
          ))}
        </div>

        {/* Status Texts */}
        <div className="space-y-1.5 max-w-md">
          <h3 className="text-lg font-bold text-white tracking-tight">
            {toolType === 'youtube'
              ? 'Sedang Mengekstrak Audio YouTube'
              : 'Sedang Mengonversi Berkas Audio'}
          </h3>
          <p className="text-xs sm:text-sm text-emerald-400 font-medium">
            {getStatusMessage()}
          </p>
        </div>

        {/* Elapsed Timer Counter */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/80 border border-slate-800 text-slate-300 font-mono text-xs">
          <Clock className="w-3.5 h-3.5 text-emerald-400" />
          <span>Waktu Proses: <strong>{formatDuration(elapsedSeconds)}</strong></span>
        </div>
      </div>

      {/* Stepper Progress Indicator */}
      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80">
        {steps.map((step, idx) => (
          <div key={idx} className="text-center space-y-1">
            <div
              className={clsx(
                'h-1 rounded-full transition-all duration-500',
                step.active ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50' : 'bg-slate-800'
              )}
            />
            <span
              className={clsx(
                'text-[11px] font-medium block truncate',
                step.active ? 'text-slate-200' : 'text-slate-500'
              )}
            >
              {step.label}
            </span>
          </div>
        ))}
      </div>

      {/* Cancel Button */}
      {onCancel && (
        <div className="pt-2 text-center">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30 transition cursor-pointer"
          >
            <XCircle className="w-4 h-4" />
            <span>Batalkan Proses</span>
          </button>
        </div>
      )}
    </div>
  );
}
