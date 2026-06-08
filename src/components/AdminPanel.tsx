import React, { useEffect, useState } from 'react';
import { getSupabase } from '../lib/supabase';
import { Check, X, ShieldAlert, UserCheck, Loader2 } from 'lucide-react';

export default function AdminPanel() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProfiles = async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (!error && data) {
      setProfiles(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    const supabase = getSupabase();
    if (!supabase) return;
    
    const { error } = await supabase
      .from('user_profiles')
      .update({ status })
      .eq('id', id);
      
    if (!error) {
      // Perbarui state lokal
      setProfiles(profiles.map(p => p.id === id ? { ...p, status } : p));
    } else {
      alert('Gagal memperbarui status: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-200">
      <div className="mb-6 border-b border-slate-200 pb-4">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 text-blue-600" />
          Manajemen Akses Pengguna
        </h2>
        <p className="text-slate-500 text-sm mt-1">Konfirmasi dan kelola pengguna yang mendaftar ke aplikasi e-Surat.</p>
      </div>
      
      {profiles.length === 0 ? (
        <div className="text-center py-10 text-slate-500">Belum ada pengguna yang mendaftar.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-sm border-b border-slate-200">
                <th className="px-4 py-3 font-semibold">Email Pengguna</th>
                <th className="px-4 py-3 font-semibold">Status Akses</th>
                <th className="px-4 py-3 font-semibold">Waktu Daftar</th>
                <th className="px-4 py-3 font-semibold">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {profiles.map(p => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-700">{p.email}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${
                      p.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                      p.status === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {p.status === 'approved' ? 'Disetujui' : p.status === 'rejected' ? 'Ditolak' : 'Menunggu / Pending'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500">
                     {new Date(p.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3">
                    {p.email === 'lelalusiana215@gmail.com' ? (
                      <span className="text-xs text-slate-400 italic">Pemilik (Admin)</span>
                    ) : (
                      <div className="flex gap-2">
                        {p.status !== 'approved' && (
                          <button 
                            onClick={() => updateStatus(p.id, 'approved')}
                            className="flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200 rounded text-xs transition-colors"
                            title="Setujui Akses"
                          >
                            <Check className="w-3 h-3" /> Setujui
                          </button>
                        )}
                        {p.status !== 'rejected' && (
                          <button 
                            onClick={() => updateStatus(p.id, 'rejected')}
                            className="flex items-center gap-1 px-2 py-1 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 rounded text-xs transition-colors"
                            title="Tolak Akses"
                          >
                            <X className="w-3 h-3" /> Tolak
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
