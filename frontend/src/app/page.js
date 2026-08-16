import Link from 'next/link';
import { FileText, Music, Image as ImageIcon, Sparkles, ArrowRight } from 'lucide-react';
import { Card } from '../components/Button';

export default function Home() {
  const tools = [
    {
      title: 'PDF Tools',
      description: 'Gabungkan banyak file PDF menjadi satu, atau pisahkan halaman tertentu dengan mudah dan cepat.',
      icon: <FileText className="w-8 h-8 text-rose-400" />,
      href: '/pdf',
      badge: 'Merge & Split',
      color: 'border-rose-500/30 hover:border-rose-500',
    },
    {
      title: 'Music & YouTube Tools',
      description: 'Ekstrak audio dari video YouTube secara instan serta konversi format audio favorit Anda.',
      icon: <Music className="w-8 h-8 text-emerald-400" />,
      href: '/music',
      badge: 'yt-dlp & ffmpeg',
      color: 'border-emerald-500/30 hover:border-emerald-500',
    },
    {
      title: 'Image Tools',
      description: 'Kompres ukuran file gambar tanpa mengorbankan kualitas dan konversi ke format modern seperti WebP.',
      icon: <ImageIcon className="w-8 h-8 text-amber-400" />,
      href: '/image',
      badge: 'Sharp Processing',
      color: 'border-amber-500/30 hover:border-amber-500',
    },
  ];

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="text-center space-y-4 max-w-3xl mx-auto pt-6 pb-4">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Instrumenta Personalia</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
          Satu Platform, Semua Alat Produktivitas Digital Anda
        </h1>
        <p className="text-slate-400 text-base sm:text-lg">
          Dirancang dengan arsitektur <em>Modular Monolith</em> berkecepatan tinggi untuk menangani dokumen PDF, pemrosesan media, dan konversi gambar secara instan.
        </p>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {tools.map((tool) => (
          <Link key={tool.title} href={tool.href} className="group">
            <Card className={`h-full flex flex-col justify-between transition duration-200 ${tool.color} group-hover:shadow-lg group-hover:scale-[1.01]`}>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="p-3 bg-slate-800 rounded-xl inline-block">
                    {tool.icon}
                  </div>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-medium">
                    {tool.badge}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-slate-100 group-hover:text-white transition">
                  {tool.title}
                </h2>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {tool.description}
                </p>
              </div>
              <div className="pt-6 flex items-center text-sm font-semibold text-indigo-400 group-hover:text-indigo-300">
                <span>Buka Tool</span>
                <ArrowRight className="w-4 h-4 ml-1.5 transition transform group-hover:translate-x-1" />
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
