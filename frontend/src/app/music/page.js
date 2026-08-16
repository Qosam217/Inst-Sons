'use client';

import { useState } from 'react';
import { Card, Button } from '../../components/Button';
import FileDropzone from '../../components/FileDropzone';
import { Music, Youtube, RefreshCw, Download } from 'lucide-react';

export default function MusicPage() {
  const [activeTab, setActiveTab] = useState('youtube'); // 'youtube' or 'convert'

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <div className="inline-flex p-3 bg-emerald-500/10 rounded-full text-emerald-400">
          <Music className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold text-white">Music & YouTube Tools</h1>
        <p className="text-sm text-slate-400">Unduh audio dari YouTube atau konversi format file musik Anda dengan FFmpeg.</p>
      </div>

      <div className="flex border-b border-slate-800 justify-center space-x-4">
        <button
          onClick={() => setActiveTab('youtube')}
          className={`flex items-center space-x-2 pb-3 px-4 text-sm font-semibold border-b-2 transition ${
            activeTab === 'youtube'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Youtube className="w-4 h-4" />
          <span>YouTube Audio Downloader</span>
        </button>
        <button
          onClick={() => setActiveTab('convert')}
          className={`flex items-center space-x-2 pb-3 px-4 text-sm font-semibold border-b-2 transition ${
            activeTab === 'convert'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <RefreshCw className="w-4 h-4" />
          <span>Konversi Format Audio</span>
        </button>
      </div>

      <Card className="space-y-6">
        {activeTab === 'youtube' ? (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white">Download Audio dari Link YouTube</h2>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">URL Video YouTube</label>
              <input
                type="url"
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Kualitas Audio</label>
              <select className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500">
                <option value="320k">320 kbps (High Quality)</option>
                <option value="192k">192 kbps (Standard)</option>
                <option value="128k">128 kbps (Compact)</option>
              </select>
            </div>
            <Button className="w-full bg-emerald-600 hover:bg-emerald-500 flex items-center justify-center space-x-2">
              <Download className="w-4 h-4" />
              <span>Ekstrak & Download MP3</span>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white">Konversi Format Audio</h2>
            <FileDropzone
              multiple={false}
              accept={{ 'audio/*': ['.mp3', '.wav', '.flac', '.m4a', '.ogg', '.aac'] }}
              title="Tarik & lepas file audio di sini"
            />
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Format Output Target</label>
              <select className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500">
                <option value="mp3">MP3</option>
                <option value="wav">WAV</option>
                <option value="flac">FLAC</option>
                <option value="aac">AAC</option>
                <option value="m4a">M4A</option>
              </select>
            </div>
            <Button className="w-full bg-emerald-600 hover:bg-emerald-500">
              Mulai Konversi Audio
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
