'use client';

import { useState } from 'react';
import { Card, Button } from '../../components/Button';
import FileDropzone from '../../components/FileDropzone';
import { FileText, Layers, Scissors } from 'lucide-react';

export default function PdfPage() {
  const [activeTab, setActiveTab] = useState('merge'); // 'merge' or 'split'

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <div className="inline-flex p-3 bg-rose-500/10 rounded-full text-rose-400">
          <FileText className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold text-white">PDF Tools</h1>
        <p className="text-sm text-slate-400">Gabungkan atau pisahkan dokumen PDF dengan cepat langsung dari browser.</p>
      </div>

      <div className="flex border-b border-slate-800 justify-center space-x-4">
        <button
          onClick={() => setActiveTab('merge')}
          className={`flex items-center space-x-2 pb-3 px-4 text-sm font-semibold border-b-2 transition ${
            activeTab === 'merge'
              ? 'border-rose-500 text-rose-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Merge PDF</span>
        </button>
        <button
          onClick={() => setActiveTab('split')}
          className={`flex items-center space-x-2 pb-3 px-4 text-sm font-semibold border-b-2 transition ${
            activeTab === 'split'
              ? 'border-rose-500 text-rose-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Scissors className="w-4 h-4" />
          <span>Split PDF</span>
        </button>
      </div>

      <Card className="space-y-6">
        {activeTab === 'merge' ? (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white">Gabungkan Beberapa File PDF</h2>
            <FileDropzone
              multiple={true}
              accept={{ 'application/pdf': ['.pdf'] }}
              title="Tarik & lepas beberapa file PDF di sini"
            />
            <Button className="w-full bg-rose-600 hover:bg-rose-500">
              Proses Gabung PDF
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white">Pisahkan Halaman PDF</h2>
            <FileDropzone
              multiple={false}
              accept={{ 'application/pdf': ['.pdf'] }}
              title="Tarik & lepas file PDF yang ingin dipisahkan"
            />
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Pilih Rentang Halaman (contoh: 1-3, 5)</label>
              <input
                type="text"
                placeholder="1-3, 5"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-rose-500"
              />
            </div>
            <Button className="w-full bg-rose-600 hover:bg-rose-500">
              Proses Pisah PDF
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
