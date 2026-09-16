'use client';

import { Mail, X, ShieldAlert } from 'lucide-react';
import { Button } from './Button';

export default function RegisterInfoModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-4">
          <div className="inline-flex p-3 bg-indigo-600/10 rounded-full text-indigo-400 border border-indigo-500/20">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <h3 className="text-xl font-bold text-white">Pendaftaran Akun Terbatas</h3>

          <p className="text-sm text-slate-300 leading-relaxed">
            Sistem Inst Sons diperuntukkan untuk penggunaan internal. Untuk mendapatkan akun kredensial baru, silakan ajukan permohonan ke Administrator melalui email berikut:
          </p>

          <div className="bg-slate-800 border border-slate-700/80 rounded-lg p-3 flex items-center justify-center space-x-2 text-indigo-300 font-mono text-sm select-all">
            <Mail className="w-4 h-4" />
            <span>qosamimaduddin7@gmail.com</span>
          </div>

          <Button onClick={onClose} className="w-full mt-2">
            Mengerti & Tutup
          </Button>
        </div>
      </div>
    </div>
  );
}
