'use client';

import { useState } from 'react';
import { FileText, Sparkles } from 'lucide-react';
import { Card } from '../../components/Button';
import PdfToolTabs from '../../components/pdf/PdfToolTabs';
import MergePdfPanel from '../../components/pdf/MergePdfPanel';
import SplitPdfPanel from '../../components/pdf/SplitPdfPanel';
import CompressPdfPanel from '../../components/pdf/CompressPdfPanel';
import PdfResultCard from '../../components/pdf/PdfResultCard';
import PdfErrorAlert from '../../components/pdf/PdfErrorAlert';
import { pdfService, parsePdfError } from '../../services/pdfService';

export default function PdfPage() {
  const [activeTab, setActiveTab] = useState('merge'); // 'merge' | 'split' | 'compress'
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

  const handleMergeSubmit = async (files) => {
    setIsLoading(true);
    setErrorMessage('');
    setResult(null);

    try {
      const blob = await pdfService.mergePdf(files);
      setResult({
        blob,
        filename: 'merged-documents.pdf',
        toolType: 'merge',
      });
    } catch (err) {
      const msg = await parsePdfError(err);
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSplitSubmit = async ({ file, startPage, endPage }) => {
    setIsLoading(true);
    setErrorMessage('');
    setResult(null);

    try {
      const blob = await pdfService.splitPdf(file, startPage, endPage);
      const baseName = file.name.replace(/\.[^/.]+$/, '');
      setResult({
        blob,
        filename: `${baseName}-hal-${startPage}-${endPage}.pdf`,
        toolType: 'split',
      });
    } catch (err) {
      const msg = await parsePdfError(err);
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompressSubmit = async ({ file, level }) => {
    setIsLoading(true);
    setErrorMessage('');
    setResult(null);

    try {
      const blob = await pdfService.compressPdf(file, level);
      const baseName = file.name.replace(/\.[^/.]+$/, '');
      setResult({
        blob,
        filename: `${baseName}-compressed.pdf`,
        originalSize: file.size,
        compressedSize: blob.size,
        toolType: 'compress',
      });
    } catch (err) {
      const msg = await parsePdfError(err);
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header Section */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          <span>PDF Productivity Suite</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          PDF Tools Dashboard
        </h1>
        <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto leading-relaxed">
          Gabungkan banyak file, pisahkan rentang halaman dokumen, atau optimasi ukuran PDF Anda secara cepat dan aman di RAM.
        </p>
      </div>

      {/* Tabs Navigation */}
      <PdfToolTabs
        activeTab={activeTab}
        onSelectTab={handleTabChange}
        disabled={isLoading}
      />

      {/* Error Alert */}
      <PdfErrorAlert
        message={errorMessage}
        onClose={() => setErrorMessage('')}
      />

      {/* Main Workspace Card */}
      <Card className="border-slate-800 bg-slate-900/80 backdrop-blur-sm p-6 sm:p-8 rounded-2xl shadow-xl transition duration-200">
        {result ? (
          <PdfResultCard result={result} onReset={handleReset} />
        ) : (
          <>
            {activeTab === 'merge' && (
              <MergePdfPanel
                onSubmit={handleMergeSubmit}
                isLoading={isLoading}
              />
            )}
            {activeTab === 'split' && (
              <SplitPdfPanel
                onSubmit={handleSplitSubmit}
                isLoading={isLoading}
              />
            )}
            {activeTab === 'compress' && (
              <CompressPdfPanel
                onSubmit={handleCompressSubmit}
                isLoading={isLoading}
              />
            )}
          </>
        )}
      </Card>
    </div>
  );
}
