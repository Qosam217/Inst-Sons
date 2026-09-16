'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { Card, Button } from '../../components/Button';
import RegisterInfoModal from '../../components/RegisterInfoModal';
import { Shield, Lock, Mail, AlertCircle, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Email dan kata sandi wajib diisi.');
      return;
    }

    try {
      setIsSubmitting(true);
      await login(email, password);
      console.log("REDIRECTING")
      router.push('/');
      console.log("SUCCESS REDIRECT")
    } catch (err) {
      const message = err.response?.data?.error || err.response?.data?.message || 'Email atau kata sandi salah.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4">
      <Card>
        <div className="text-center space-y-2 mb-6">
          <div className="inline-flex p-3 bg-indigo-600/10 rounded-full text-indigo-400 border border-indigo-500/20">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white">Masuk ke Inst Sons</h1>
          <p className="text-sm text-slate-400">
            Masukkan kredensial Anda untuk mengakses seluruh alat produktivitas
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg flex items-center space-x-2 text-rose-300 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Kata Sandi</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full mt-2 flex items-center justify-center space-x-2">
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Memproses...</span>
              </>
            ) : (
              <span>Masuk</span>
            )}
          </Button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-400 border-t border-slate-800 pt-4">
          Belum punya akun?{' '}
          <button
            type="button"
            onClick={() => setIsRegisterModalOpen(true)}
            className="text-indigo-400 hover:text-indigo-300 font-semibold underline ml-1 focus:outline-none"
          >
            Daftar di sini
          </button>
        </div>
      </Card>

      <RegisterInfoModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
      />
    </div>
  );
}
