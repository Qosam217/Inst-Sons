'use client';

import { useState } from 'react';
import { Youtube, Clipboard, X, Info, Download, Sparkles, Check } from 'lucide-react';
import { Button } from '../Button';
import { clsx } from 'clsx';

// Regex untuk memvalidasi link YouTube (standar, short link, shorts, music)
const YOUTUBE_URL_REGEX = /^(https?:\/\/)?(www\.|music\.)?(youtube\.com\/(watch\?v=|shorts\/)|youtu\.be\/)[a-zA-Z0-9_-]{11}(&.*)?$/;

export default function YoutubeDownloaderPanel({ onSubmit, isLoading = false }) {
  const [url, setUrl] = useState('');
  const [bitrate, setBitrate] = useState('320k'); // '320k' | '192k' | '128k'
  const [inputError, setInputError] = useState('');

  const isValidUrl = url.trim() && YOUTUBE_URL_REGEX.test(url.trim());

  const handleUrlChange = (e) => {
    const val = e.target.value;
    setUrl(val);
    if (val.trim() && !YOUTUBE_URL_REGEX.test(val.trim())) {
      setInputError('Format URL YouTube tidak valid. Gunakan format youtube.com atau youtu.be');
    } else {
      setInputError('');
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text);
        if (!YOUTUBE_URL_REGEX.test(text.trim())) {
          setInputError('Format URL YouTube tidak valid. Gunakan format youtube.com atau youtu.be');
        } else {
          setInputError('');
        }
      }
    } catch (err) {
      console.log('Clipboard permission denied or unavailable:', err);
    }
  };

  const handleClear = () => {
    setUrl('');
    setInputError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isValidUrl || isLoading) return;
    onSubmit({ url: url.trim(), bitrate });
  };

  const qualityOptions = [
    {
      id: '320k',
      label: '320 kbps',
      sublabel: 'High Quality',
      desc: 'Kualitas terbaik untuk headphone & sound system',
      recommended: true,
    },
    {
      id: '192k',
      label: '192 kbps',
      sublabel: 'Standard',
      desc: 'Keseimbangan ukuran file & kejernihan audio',
      recommended: false,
    },
    {
      id: '128k',
      label: '128 kbps',
      sublabel: 'Compact',
      desc: 'Ukuran file paling ringan dan hemat kuota',
      recommended: false,
    },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title & Info Banner */}
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Youtube className="w-5 h-5 text-rose-500" />
          <span>Download Audio dari YouTube</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-400">
          Masukkan tautan video atau Shorts YouTube untuk mengekstrak track audio MP3 langsung ke perangkat Anda.
        </p>
      </div>

      {/* URL Input Box */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-slate-300">
          Tautan / URL Video YouTube
        </label>
        <div className="relative flex items-center">
          <div className="absolute left-3.5 text-rose-500 pointer-events-none">
            <Youtube className="w-5 h-5" />
          </div>

          <input
            type="url"
            value={url}
            onChange={handleUrlChange}
            placeholder="https://www.youtube.com/watch?v=... atau https://youtu.be/..."
            disabled={isLoading}
            className={clsx(
              'w-full bg-slate-950/80 border rounded-xl pl-11 pr-24 py-3 text-sm text-slate-100 placeholder-slate-500 transition focus:outline-none',
              inputError
                ? 'border-rose-500/60 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/30'
                : 'border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30'
            )}
          />

          <div className="absolute right-2 flex items-center gap-1">
            {url && (
              <button
                type="button"
                onClick={handleClear}
                disabled={isLoading}
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition cursor-pointer"
                title="Hapus tautan"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={handlePaste}
              disabled={isLoading}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition cursor-pointer"
              title="Tempel dari Clipboard"
            >
              <Clipboard className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Tempel</span>
            </button>
          </div>
        </div>

        {inputError && (
          <p className="text-xs text-rose-400 font-medium">{inputError}</p>
        )}
      </div>

      {/* Constraints Notice Card */}
      <div className="flex items-start gap-3 p-3.5 bg-emerald-500/5 border border-emerald-500/20 rounded-xl text-xs text-slate-300">
        <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-semibold text-emerald-300">Ketentuan & Batasan Ekstraksi:</p>
          <p className="text-slate-400 leading-relaxed">
            Mendukung link video YouTube standar & Shorts. Batas durasi video maksimal <strong>15 Menit</strong> (900 detik). Format unduhan otomatis berupa <strong>MP3 Audio Stream</strong>.
          </p>
        </div>
      </div>

      {/* Quality Pills / Bitrate Selection */}
      <div className="space-y-2.5">
        <label className="block text-xs font-semibold text-slate-300">
          Pilih Kualitas / Bitrate Audio
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {qualityOptions.map((opt) => {
            const isSelected = bitrate === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                disabled={isLoading}
                onClick={() => setBitrate(opt.id)}
                className={clsx(
                  'relative p-3.5 rounded-xl text-left border transition cursor-pointer flex flex-col justify-between',
                  isSelected
                    ? 'bg-emerald-500/10 border-emerald-500/50 text-white shadow-sm'
                    : 'bg-slate-950/60 border-slate-800/90 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                )}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className={clsx('text-sm font-bold', isSelected ? 'text-emerald-400' : 'text-slate-200')}>
                      {opt.label}
                    </span>
                    {opt.recommended && (
                      <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] font-semibold text-slate-300 mb-1">{opt.sublabel}</p>
                  <p className="text-[10px] text-slate-400 leading-tight">{opt.desc}</p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
                  <span className={isSelected ? 'text-emerald-400 font-semibold' : 'text-slate-500'}>
                    {isSelected ? 'Terpilih' : 'Pilih'}
                  </span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* CTA Button */}
      <Button
        type="submit"
        disabled={!isValidUrl || isLoading}
        className={clsx(
          'w-full py-3.5 text-sm font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer',
          isValidUrl && !isLoading
            ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-950/40'
            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
        )}
      >
        <Download className="w-4 h-4 stroke-[2.5]" />
        <span>Ekstrak & Unduh MP3</span>
      </Button>
    </form>
  );
}
