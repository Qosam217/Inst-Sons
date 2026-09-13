'use client';

import { FileText, ArrowUp, ArrowDown, Trash2 } from 'lucide-react';
import { formatBytes } from '../../services/pdfService';
import { clsx } from 'clsx';

export default function PdfFileList({ files, onMoveUp, onMoveDown, onRemove, disabled = false }) {
  if (!files || files.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-slate-400 px-1 pb-1">
        <span>Urutan Dokumen ({files.length} File)</span>
        <span>Gunakan panah untuk mengatur urutan penggabungan</span>
      </div>

      <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
        {files.map((file, index) => {
          const isFirst = index === 0;
          const isLast = index === files.length - 1;

          return (
            <div
              key={`${file.name}-${file.size}-${index}`}
              className={clsx(
                'flex items-center justify-between p-3 rounded-xl border transition-all duration-150',
                'bg-slate-900/80 border-slate-800 hover:border-slate-700'
              )}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1 mr-3">
                <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-rose-500/10 text-rose-400 font-bold text-xs shrink-0 border border-rose-500/20">
                  {index + 1}
                </div>
                <FileText className="w-5 h-5 text-rose-400 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-200 truncate" title={file.name}>
                    {file.name}
                  </p>
                  <p className="text-xs text-slate-400">{formatBytes(file.size)}</p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  disabled={disabled || isFirst}
                  onClick={() => onMoveUp(index)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 cursor-pointer transition"
                  title="Pindah ke atas"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={disabled || isLast}
                  onClick={() => onMoveDown(index)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 cursor-pointer transition"
                  title="Pindah ke bawah"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onRemove(index)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 disabled:opacity-30 cursor-pointer transition ml-1"
                  title="Hapus file dari daftar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
