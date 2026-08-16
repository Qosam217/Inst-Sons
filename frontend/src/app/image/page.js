'use client';

import { useState } from 'react';
import { Card, Button } from '../../components/Button';
import FileDropzone from '../../components/FileDropzone';
import { Image as ImageIcon, Minimize2, RefreshCw } from 'lucide-react';

export default function ImagePage() {
  const [activeTab, setActiveTab] = useState('compress'); // 'compress' or 'convert'

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <div className="inline-flex p-3 bg-amber-500/10 rounded-full text-amber-400">
          <ImageIcon className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold text-white">Image Tools</h1>
        <p className="text-sm text-slate-400">Kompres ukuran file gambar atau konversi ke WebP, PNG, JPEG dengan Sharp engine.</p>
      </div>

      <div className="flex border-b border-slate-800 justify-center space-x-4">
        <button
          onClick={() => setActiveTab('compress')}
          className={`flex items-center space-x-2 pb-3 px-4 text-sm font-semibold border-b-2 transition ${
            activeTab === 'compress'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Minimize2 className="w-4 h-4" />
          <span>Kompres Gambar</span>
        </button>
        <button
          onClick={() => setActiveTab('convert')}
          className={`flex items-center space-x-2 pb-3 px-4 text-sm font-semibold border-b-2 transition ${
            activeTab === 'convert'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <RefreshCw className="w-4 h-4" />
          <span>Konversi Format</span>
        </button>
      </div>

      <Card className="space-y-6">
        {activeTab === 'compress' ? (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white">Kompresi Ukuran Gambar</h2>
            <FileDropzone
              multiple={false}
              accept={{ 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] }}
              title="Tarik & lepas gambar yang ingin dikompres"
            />
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Kualitas Output (1 - 100)</label>
              <input
                type="number"
                defaultValue={80}
                min={10}
                max={100}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>
            <Button className="w-full bg-amber-600 hover:bg-amber-500 text-white">
              Kompres Gambar Sekarang
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white">Konversi Format Gambar</h2>
            <FileDropzone
              multiple={false}
              accept={{ 'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.tiff', '.avif'] }}
              title="Tarik & lepas file gambar di sini"
            />
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Format Output Target</label>
              <select className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500">
                <option value="webp">WebP (Ukuran Paling Efisien)</option>
                <option value="png">PNG (Transparan/Lossless)</option>
                <option value="jpeg">JPEG (Standard Foto)</option>
                <option value="avif">AVIF (Next-Gen)</option>
              </select>
            </div>
            <Button className="w-full bg-amber-600 hover:bg-amber-500 text-white">
              Mulai Konversi Gambar
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
