import React from 'react';
import { ExternalLink, Database, Key, Settings as SettingsIcon, AlertCircle } from 'lucide-react';

export default function SupabaseSetupGuide() {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
      <div className="flex items-center gap-2 mb-4 text-blue-800 font-bold">
        <AlertCircle className="w-5 h-5 text-blue-600" />
        Langkah Penting Menghubungkan Database:
      </div>
      
      <div className="space-y-4 text-sm text-blue-900/80">
        <div className="flex gap-3">
          <div className="bg-blue-600 text-white w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-xs">1</div>
          <div>
            <p className="font-semibold text-blue-900 mb-1">Siapkan Akun Supabase</p>
            <p>Buka <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline font-medium">Supabase.com</a> dan buat project baru.</p>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="bg-blue-600 text-white w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-xs">2</div>
          <div>
            <p className="font-semibold text-blue-900 mb-1">Salin API Credentials</p>
            <p>Cari <strong>Project Settings</strong> {'>'} <strong>API</strong>. Salin <strong>Project URL</strong> dan <strong>anon public key</strong>.</p>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="bg-blue-600 text-white w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-xs">3</div>
          <div>
            <p className="font-semibold text-blue-900 mb-1">Masukkan ke AI Studio Settings</p>
            <p>Klik menu <span className="inline-flex items-center px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded text-[10px] text-slate-700 font-bold"><SettingsIcon className="w-3 h-3 mr-1" /> Settings</span> di pojok kiri bawah AI Studio ini, lalu masukkan:</p>
            <ul className="mt-2 space-y-1.5">
              <li>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-500">VARIABLE NAME</span>
                  <code className="bg-blue-100 px-1 py-0.5 rounded text-xs w-fit">VITE_SUPABASE_URL</code>
                  <span className="text-[10px] text-blue-600 italic">Contoh: https://xyz.supabase.co</span>
                </div>
              </li>
              <li>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-500">VARIABLE NAME</span>
                  <code className="bg-blue-100 px-1 py-0.5 rounded text-xs w-fit">VITE_SUPABASE_ANON_KEY</code>
                  <span className="text-[10px] text-blue-600 italic">Salin string panjang (anon/public key)</span>
                </div>
              </li>
            </ul>
            <p className="mt-3 text-[11px] bg-amber-100 p-2 rounded border border-amber-200 text-amber-900">
              <strong>PENTING:</strong> Jika muncul error <em>"Invalid path..."</em>, pastikan URL diawali dengan <code>https://</code> dan tidak ada karakter tambahan di belakangnya.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="bg-blue-600 text-white w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-xs">4</div>
          <div>
            <p className="font-semibold text-blue-900 mb-1">Jalankan SQL Schema & Matikan Konfirmasi Email</p>
            <p>1. Salin isi file <code className="bg-blue-100 px-1 py-0.5 rounded">SUPABASE_SCHEMA.sql</code> di editor ini ke <strong>SQL Editor</strong> di dashboard Supabase Anda, lalu tekan <strong>RUN</strong>.</p>
            <p className="mt-1 font-semibold text-red-600">PENTING: Di menu Authentication &gt; Providers &gt; Email, matikan "Confirm Email" agar pendaftaran langsung aktif tanpa verifikasi email.</p>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="bg-blue-600 text-white w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-xs">5</div>
          <div>
            <p className="font-semibold text-blue-900 mb-1">Daftarkan Akun Anda</p>
            <p>Klik "Daftar di sini" pada form login, masukkan email <code className="bg-blue-100 px-1 py-0.5 rounded">lelalusiana215@gmail.com</code> dan <strong>buat password baru Anda</strong>. Akun ini otomatis akan jadi Admin.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
