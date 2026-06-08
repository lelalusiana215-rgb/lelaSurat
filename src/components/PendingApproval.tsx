import React from 'react';
import { LogOut, Clock, Mail } from 'lucide-react';

export default function PendingApproval({ user, onLogout }: { user: any, onLogout: () => void }) {
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200 text-center p-8">
        <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <Clock className="w-8 h-8" />
        </div>
        
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Menunggu Persetujuan</h2>
        
        <p className="text-slate-600 mb-6">
          Akun Anda (<span className="font-medium text-slate-800">{user?.email}</span>) telah terdaftar. 
          Namun, demi keamanan aplikasi, Anda perlu menunggu konfirmasi dari pemilik sebelum dapat menggunakan fitur.
        </p>
        
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-8 flex flex-col items-center">
            <Mail className="w-5 h-5 text-slate-400 mb-2" />
            <p className="text-sm text-slate-500">Pemilik aplikasi akan segera meninjau permintaan Anda.</p>
        </div>
        
        <button
          onClick={onLogout}
          className="flex items-center justify-center gap-2 mx-auto text-slate-500 hover:text-slate-800 font-medium transition-colors"
        >
          <LogOut className="w-4 h-4" /> Keluar & Kembali ke Login
        </button>
      </div>
    </div>
  );
}
