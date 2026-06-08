import React, { useState } from 'react';
import { getSupabase } from '../lib/supabase';
import { Mail, Lock, Loader2, ArrowRight } from 'lucide-react';

export default function Auth({ onLogin }: { onLogin: (user: any) => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const supabase = getSupabase();
    if (!supabase) {
      setError('Database tidak terhubung. Periksa konfigurasi Supabase Anda.');
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        
        // Cek profil
        if (data.user) {
          // Jika ini owner, otomatis buat jika belum ada, atau izinkan
          if (data.user.email === 'lelalusiana215@gmail.com') {
             // Pastikan di tabel ada
             await supabase.from('user_profiles').upsert({
               id: data.user.id,
               email: data.user.email,
               status: 'approved'
             }, { onConflict: 'id' });
          } else {
             // Cek profil
             const { data: profile } = await supabase.from('user_profiles').select('*').eq('id', data.user.id).single();
             if (!profile) {
                // Insert profil pertama kali login jika sign up nggak masuk
                await supabase.from('user_profiles').insert({
                   id: data.user.id,
                   email: data.user.email,
                   status: 'pending'
                });
             }
          }
          onLogin(data.user);
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        
        if (data.user) {
          // Buat profil dengan status pending
          await supabase.from('user_profiles').upsert({
             id: data.user.id,
             email: data.user.email,
             status: data.user.email === 'lelalusiana215@gmail.com' ? 'approved' : 'pending'
          }, { onConflict: 'id' });
          
          alert('Pendaftaran berhasil! Jika Anda bukan pemilik aplikasi, tunggu persetujuan admin sebelum bisa login.');
          setIsLogin(true); // Kembali ke login
        }
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat memproses.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
        <div className="bg-blue-800 p-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-2">e-Surat TU</h2>
          <p className="text-blue-200">
            {isLogin ? 'Login ke sistem persuratan' : 'Daftar akun baru'}
          </p>
        </div>
        
        <div className="p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="anda@email.com"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="animate-spin h-5 w-5" />
              ) : (
                <>
                  {isLogin ? 'Masuk' : 'Daftar Sekarang'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </button>
          </form>
          
          <div className="mt-6 text-center text-sm">
            <span className="text-slate-500">
              {isLogin ? 'Belum punya akun?' : 'Sudah punya akun?'}
            </span>{' '}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              {isLogin ? 'Daftar di sini' : 'Login di sini'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
