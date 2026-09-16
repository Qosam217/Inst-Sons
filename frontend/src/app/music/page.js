'use client';

import { useState, useRef, useEffect } from 'react';
import { Music, Sparkles } from 'lucide-react';
import { Card } from '../../components/Button';
import MusicToolTabs from '../../components/music/MusicToolTabs';
import YoutubeDownloaderPanel from '../../components/music/YoutubeDownloaderPanel';
import ConvertAudioPanel from '../../components/music/ConvertAudioPanel';
import AudioProcessingStatus from '../../components/music/AudioProcessingStatus';
import AudioResultCard from '../../components/music/AudioResultCard';
import AudioErrorAlert from '../../components/music/AudioErrorAlert';
import { musicService, parseAudioError } from '../../services/musicService';

export default function MusicPage() {
  const [activeTab, setActiveTab] = useState('youtube'); // 'youtube' | 'convert'
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingState, setProcessingState] = useState(null); // { toolType, targetFormat }
  const [result, setResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const abortControllerRef = useRef(null);

  // Cleanup abort signal saat unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleTabChange = (tabId) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setActiveTab(tabId);
    setIsProcessing(false);
    setProcessingState(null);
    setResult(null);
    setErrorMessage('');
  };

  const handleReset = () => {
    setResult(null);
    setErrorMessage('');
    setIsProcessing(false);
    setProcessingState(null);
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsProcessing(false);
    setProcessingState(null);
    setErrorMessage('Proses pemrosesan audio telah dibatalkan.');
  };

  const handleYoutubeSubmit = async ({ url, bitrate }) => {
    setIsProcessing(true);
    setProcessingState({ toolType: 'youtube', targetFormat: 'MP3' });
    setErrorMessage('');
    setResult(null);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      // 1. Kirim request ekstraksi audio YouTube ke backend
      const responseData = await musicService.requestYoutubeDownload(url);
      const taskId = responseData.task_id;

      if (!taskId) {
        throw new Error('Gagal menginisialisasi task ekstraksi audio YouTube.');
      }

      // 2. Lakukan background polling hingga status 'completed'
      const completedTask = await musicService.pollTaskUntilComplete(
        musicService.getYoutubeTaskStatus,
        taskId,
        {
          signal: abortController.signal,
          intervalMs: 2000,
          maxAttempts: 150,
        }
      );

      // 3. Unduh berkas audio MP3 biner
      const blob = await musicService.downloadYoutubeAudio(taskId);

      const cleanTitle = (completedTask.title || 'youtube-audio').replace(/[/\\?%*:|"<>]/g, '_');

      setResult({
        blob,
        filename: `${cleanTitle}.mp3`,
        title: completedTask.title || 'YouTube Audio',
        duration: completedTask.duration,
        toolType: 'youtube',
        targetFormat: 'MP3',
      });
    } catch (err) {
      if (err.name !== 'AbortError') {
        const msg = await parseAudioError(err);
        setErrorMessage(msg);
      }
    } finally {
      setIsProcessing(false);
      setProcessingState(null);
      abortControllerRef.current = null;
    }
  };

  const handleConvertSubmit = async ({ file, format }) => {
    setIsProcessing(true);
    setProcessingState({ toolType: 'convert', targetFormat: format });
    setErrorMessage('');
    setResult(null);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      // 1. Upload file audio dan inisiasi task konversi
      const responseData = await musicService.convertAudio(file, format);
      const taskId = responseData.task_id;

      if (!taskId) {
        throw new Error('Gagal menginisialisasi task konversi format audio.');
      }

      // 2. Lakukan background polling hingga status 'completed'
      await musicService.pollTaskUntilComplete(
        musicService.getAudioTaskStatus,
        taskId,
        {
          signal: abortController.signal,
          intervalMs: 2000,
          maxAttempts: 150,
        }
      );

      // 3. Unduh berkas audio hasil konversi biner
      const blob = await musicService.downloadAudio(taskId);

      const baseName = file.name.replace(/\.[^/.]+$/, '');
      const downloadExt = format.toLowerCase();

      setResult({
        blob,
        filename: `converted-${baseName}.${downloadExt}`,
        title: file.name,
        toolType: 'convert',
        targetFormat: format.toUpperCase(),
      });
    } catch (err) {
      if (err.name !== 'AbortError') {
        const msg = await parseAudioError(err);
        setErrorMessage(msg);
      }
    } finally {
      setIsProcessing(false);
      setProcessingState(null);
      abortControllerRef.current = null;
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header Section */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider shadow-sm">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Audio Processing & Extraction Suite</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Music & Audio Tools
        </h1>
        <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto leading-relaxed">
          Unduh track audio dari YouTube atau konversi format audio (MP3, WAV, AAC, OGG, FLAC) secara instan dan aman dengan FFmpeg.
        </p>
      </div>

      {/* Tabs Navigation */}
      <MusicToolTabs
        activeTab={activeTab}
        onSelectTab={handleTabChange}
        disabled={isProcessing}
      />

      {/* Error Notification Alert */}
      <AudioErrorAlert
        message={errorMessage}
        onClose={() => setErrorMessage('')}
      />

      {/* Main Workspace Container */}
      <Card className="border-slate-800 bg-slate-900/80 backdrop-blur-sm p-6 sm:p-8 rounded-2xl shadow-xl transition duration-200">
        {isProcessing ? (
          <AudioProcessingStatus
            toolType={processingState?.toolType || activeTab}
            targetFormat={processingState?.targetFormat}
            onCancel={handleCancel}
          />
        ) : result ? (
          <AudioResultCard result={result} onReset={handleReset} />
        ) : (
          <>
            {activeTab === 'youtube' && (
              <YoutubeDownloaderPanel
                onSubmit={handleYoutubeSubmit}
                isLoading={isProcessing}
              />
            )}
            {activeTab === 'convert' && (
              <ConvertAudioPanel
                onSubmit={handleConvertSubmit}
                isLoading={isProcessing}
              />
            )}
          </>
        )}
      </Card>
    </div>
  );
}
