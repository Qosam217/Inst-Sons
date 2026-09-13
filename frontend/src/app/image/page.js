'use client';

import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { Card } from '../../components/Button';
import ImageToolTabs from '../../components/image/ImageToolTabs';
import CompressImagePanel from '../../components/image/CompressImagePanel';
import ConvertImagePanel from '../../components/image/ConvertImagePanel';
import ImageResultCard from '../../components/image/ImageResultCard';
import ImageErrorAlert from '../../components/image/ImageErrorAlert';
import { imageService, parseImageError } from '../../services/imageService';

export default function ImagePage() {
  const [activeTab, setActiveTab] = useState('compress'); // 'compress' | 'convert'
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setResult(null);
    setErrorMessage('');
  };

  const handleReset = () => {
    setResult(null);
    setErrorMessage('');
  };

  const handleCompressSubmit = async ({ file, level }) => {
    setIsLoading(true);
    setErrorMessage('');
    setResult(null);

    try {
      const blob = await imageService.compressImage(file, level);
      const ext = file.name.split('.').pop() || 'jpg';
      const baseName = file.name.replace(/\.[^/.]+$/, '');

      setResult({
        blob,
        filename: `${baseName}-compressed.${ext}`,
        originalSize: file.size,
        compressedSize: blob.size,
        toolType: 'compress',
        targetFormat: ext.toUpperCase(),
      });
    } catch (err) {
      const msg = await parseImageError(err);
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConvertSubmit = async ({ file, format }) => {
    setIsLoading(true);
    setErrorMessage('');
    setResult(null);

    try {
      const blob = await imageService.convertImage(file, format);
      const baseName = file.name.replace(/\.[^/.]+$/, '');
      const outputExt = format === 'jpeg' ? 'jpg' : format;

      setResult({
        blob,
        filename: `${baseName}.${outputExt}`,
        originalSize: file.size,
        compressedSize: blob.size,
        toolType: 'convert',
        targetFormat: format.toUpperCase(),
      });
    } catch (err) {
      const msg = await parseImageError(err);
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header Section */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold uppercase tracking-wider shadow-sm">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Image Optimization Suite</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Image Tools Dashboard
        </h1>
        <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto leading-relaxed">
          Kecilkan bobot gambar atau ubah ke format WebP, AVIF, PNG, & JPG secara instan dengan engine Sharp di memori RAM.
        </p>
      </div>

      {/* Tabs Navigation */}
      <ImageToolTabs
        activeTab={activeTab}
        onSelectTab={handleTabChange}
        disabled={isLoading}
      />

      {/* Error Notification Alert */}
      <ImageErrorAlert
        message={errorMessage}
        onClose={() => setErrorMessage('')}
      />

      {/* Main Workspace Container */}
      <Card className="border-slate-800 bg-slate-900/80 backdrop-blur-sm p-6 sm:p-8 rounded-2xl shadow-xl transition duration-200">
        {result ? (
          <ImageResultCard result={result} onReset={handleReset} />
        ) : (
          <>
            {activeTab === 'compress' && (
              <CompressImagePanel
                onSubmit={handleCompressSubmit}
                isLoading={isLoading}
              />
            )}
            {activeTab === 'convert' && (
              <ConvertImagePanel
                onSubmit={handleConvertSubmit}
                isLoading={isLoading}
              />
            )}
          </>
        )}
      </Card>
    </div>
  );
}
