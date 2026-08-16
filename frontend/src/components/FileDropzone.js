'use client';

import { useDropzone } from 'react-dropzone';
import { UploadCloud } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export default function FileDropzone({ onDrop, accept, multiple = false, title = 'Tarik & lepas file di sini' }) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    multiple,
  });

  return (
    <div
      {...getRootProps()}
      className={twMerge(
        'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center',
        isDragActive ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-700 bg-slate-900/50 hover:border-slate-500'
      )}
    >
      <input {...getInputProps()} />
      <UploadCloud className="w-10 h-10 text-indigo-400 mb-3" />
      <p className="font-semibold text-slate-200">{title}</p>
      <p className="text-xs text-slate-400 mt-1">atau klik untuk memilih file dari komputer</p>
    </div>
  );
}
