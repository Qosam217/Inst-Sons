'use client';

import { AlertCircle, X } from 'lucide-react';

export default function ImageErrorAlert({ message, onClose }) {
  if (!message) return null;

  return (
    <div className="flex items-start justify-between gap-3 p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
        <div className="text-sm leading-relaxed">
          <p className="font-semibold text-rose-200">Gagal Memproses Gambar</p>
          <p className="text-rose-300/90 mt-0.5">{message}</p>
        </div>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="text-rose-400/70 hover:text-rose-200 p-1 rounded-md hover:bg-rose-500/20 transition shrink-0 cursor-pointer"
          aria-label="Tutup notifikasi error"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
