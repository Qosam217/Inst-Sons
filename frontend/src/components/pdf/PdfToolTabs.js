'use client';

import { Layers, Scissors, Minimize2 } from 'lucide-react';
import { clsx } from 'clsx';

export default function PdfToolTabs({ activeTab, onSelectTab, disabled = false }) {
  const tabs = [
    {
      id: 'merge',
      label: 'Merge PDF',
      badge: '2-5 File',
      icon: Layers,
      description: 'Gabungkan banyak dokumen',
    },
    {
      id: 'split',
      label: 'Split PDF',
      badge: 'Rentang Halaman',
      icon: Scissors,
      description: 'Pisahkan halaman spesifik',
    },
    {
      id: 'compress',
      label: 'Compress PDF',
      badge: 'Ghostscript Optimizer',
      icon: Minimize2,
      description: 'Perkecil ukuran dokumen',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-1.5 bg-slate-900/90 border border-slate-800 rounded-2xl">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            disabled={disabled}
            onClick={() => onSelectTab(tab.id)}
            className={clsx(
              'group relative flex items-center p-3.5 rounded-xl text-left transition-all duration-200 select-none cursor-pointer',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              isActive
                ? 'bg-rose-500/15 border border-rose-500/40 shadow-sm text-white'
                : 'hover:bg-slate-800/60 border border-transparent text-slate-400 hover:text-slate-200'
            )}
          >
            <div
              className={clsx(
                'p-2.5 rounded-lg mr-3 transition-colors shrink-0',
                isActive
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-400 group-hover:text-rose-400'
              )}
            >
              <Icon className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <span className={clsx('text-sm font-semibold truncate', isActive ? 'text-white' : 'text-slate-200')}>
                  {tab.label}
                </span>
                <span
                  className={clsx(
                    'text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full border shrink-0',
                    isActive
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                      : 'bg-slate-800 text-slate-400 border-slate-700/80'
                  )}
                >
                  {tab.badge}
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate mt-0.5">{tab.description}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
