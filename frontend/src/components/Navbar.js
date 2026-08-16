import Link from 'next/link';
import { Wrench, Shield, FileText, Music, Image as ImageIcon } from 'lucide-react';

export default function Navbar() {
  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2 text-indigo-400 font-bold text-xl hover:text-indigo-300 transition">
          <Wrench className="w-6 h-6" />
          <span>Inst Sons</span>
        </Link>
        <nav className="flex items-center space-x-6 text-sm font-medium text-slate-300">
          <Link href="/pdf" className="flex items-center space-x-1 hover:text-white transition">
            <FileText className="w-4 h-4 text-rose-400" />
            <span>PDF Tools</span>
          </Link>
          <Link href="/music" className="flex items-center space-x-1 hover:text-white transition">
            <Music className="w-4 h-4 text-emerald-400" />
            <span>Music Tools</span>
          </Link>
          <Link href="/image" className="flex items-center space-x-1 hover:text-white transition">
            <ImageIcon className="w-4 h-4 text-amber-400" />
            <span>Image Tools</span>
          </Link>
          <Link href="/auth" className="flex items-center space-x-1 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg transition font-semibold">
            <Shield className="w-4 h-4" />
            <span>Masuk</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
