import React from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Sparkles, 
  ShieldCheck, 
  Download, 
  Zap, 
  Database, 
  Users, 
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  Laptop
} from 'lucide-react';

interface LandingPageProps {
  onStart: () => void;
  onLogin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStart, onLogin }) => {
  const features = [
    {
      icon: <FileText className="w-6 h-6 text-blue-500" />,
      title: "7+ Template Surat Dinas",
      description: "Tersedia template Undangan, Surat Tugas, SK, Edaran, hingga Surat Peminjaman."
    },
    {
      icon: <Sparkles className="w-6 h-6 text-purple-500" />,
      title: "AI Writing Assistant",
      description: "Biarkan AI (Gemini) membantu menyusun isi surat hanya dengan memasukkan perihal."
    },
    {
      icon: <Zap className="w-6 h-6 text-amber-500" />,
      title: "Penomoran Otomatis",
      description: "Sistem penomoran surat yang tersinkronisasi sesuai dengan format instansi Anda."
    },
    {
      icon: <Download className="w-6 h-6 text-emerald-500" />,
      title: "Ekspor Word (Format Asli)",
      description: "Hasil ekspor .doc yang rapi dengan KOP surat standar kedinasan dan TTD digital."
    },
    {
      icon: <Database className="w-6 h-6 text-indigo-500" />,
      title: "Sinkronisasi Cloud",
      description: "Data tersimpan aman di Cloud (Supabase) dan dapat diakses dari perangkat mana saja."
    },
    {
      icon: <Users className="w-6 h-6 text-rose-500" />,
      title: "Import Data Guru",
      description: "Import daftar lampiran guru dari Excel atau CSV dalam hitungan detik."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-100 font-sans">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-1.5 rounded-lg">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight">e-Surat <span className="text-blue-600">TU</span></span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={onLogin}
            className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
          >
            Masuk
          </button>
          <a 
            href="https://lynk.id/bugurulela" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-full transition-all shadow-md shadow-blue-200"
          >
            Beli Lisensi <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold mb-6 tracking-wide uppercase">
              <Sparkles className="w-3 h-3" /> Digital Product for Education
            </div>
            <h1 className="text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight text-slate-900 mb-6">
              Transformasi <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Persuratan Sekolah</span> Dalam Sekejap
            </h1>
            <p className="text-lg text-slate-600 mb-8 leading-relaxed">
              Ucapkan selamat tinggal pada kerumitan format Word manual. e-Surat TU membantu tenaga administrasi sekolah membuat berbagai surat kedinasan profesional dengan template otomatis dan teknologi AI.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={onStart}
                className="flex items-center justify-center gap-2 px-8 py-4 bg-slate-900 hover:bg-black text-white font-bold rounded-xl transition-all shadow-lg shadow-slate-200 group"
              >
                Coba Demo Sekarang <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <a 
                href="https://lynk.id/bugurulela" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-8 py-4 bg-white border-2 border-slate-200 hover:border-blue-600 hover:text-blue-600 text-slate-700 font-bold rounded-xl transition-all"
              >
                Order via Lynk.id
              </a>
            </div>
            
            <div className="mt-10 flex items-center gap-6">
              <div className="flex -space-x-3">
                {[1,2,3,4].map(i => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center overflow-hidden">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 10}`} alt="User" />
                  </div>
                ))}
              </div>
              <div className="text-sm">
                <div className="flex text-amber-400 mb-0.5">
                  <Sparkles className="w-3.5 h-3.5 fill-current" />
                  <Sparkles className="w-3.5 h-3.5 fill-current" />
                  <Sparkles className="w-3.5 h-3.5 fill-current" />
                  <Sparkles className="w-3.5 h-3.5 fill-current" />
                  <Sparkles className="w-3.5 h-3.5 fill-current" />
                </div>
                <p className="text-slate-500 font-medium">Dipercaya oleh 100+ Sekolah</p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-2 shadow-2xl relative z-10 overflow-hidden group">
              <img 
                src="https://images.unsplash.com/photo-1586281380349-632531db7ed4?q=80&w=2070&auto=format&fit=crop" 
                alt="App Interface" 
                className="rounded-xl w-full h-auto opacity-90 group-hover:opacity-100 transition-opacity"
              />
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={onStart}
                  className="bg-white text-slate-900 px-6 py-3 rounded-full font-bold shadow-xl flex items-center gap-2"
                >
                  <Laptop className="w-5 h-5" /> Lihat Interface Asli
                </button>
              </div>
            </div>
            {/* Decors */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-400/20 rounded-full blur-3xl -z-10"></div>
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-400/20 rounded-full blur-3xl -z-10"></div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-white border-y border-slate-200 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-4">Fitur Utama Unggulan</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Segudang fitur yang telah disesuaikan dengan kebutuhan tata usaha sekolah di Indonesia.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <motion.div 
                key={idx}
                whileHover={{ y: -5 }}
                className="p-8 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-white hover:shadow-xl hover:shadow-slate-200 transition-all"
              >
                <div className="mb-4">{feature.icon}</div>
                <h3 className="font-bold text-lg mb-2 text-slate-900">{feature.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto bg-blue-600 rounded-3xl p-10 lg:p-16 text-white text-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-10 opacity-10">
            <FileText className="w-64 h-64 rotate-12" />
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold mb-6 relative z-10">Tingkatkan Efisiensi Kerja TU Mulai Hari Ini</h2>
          <p className="text-blue-100 mb-10 text-lg relative z-10">
            Dapatkan akses penuh ke seluruh fitur premium e-Surat TU dan jadikan sekolah Anda lebih modern & terorganisir.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 relative z-10">
            <a 
              href="https://lynk.id/bugurulela" 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-10 py-4 bg-white text-blue-600 font-extrabold rounded-xl hover:bg-blue-50 transition-colors shadow-lg"
            >
              Checkout di Lynk.id
            </a>
            <button 
              onClick={onLogin}
              className="px-10 py-4 bg-blue-700 text-white font-extrabold rounded-xl hover:bg-blue-800 transition-colors"
            >
              Sudah Punya Lisensi? Masuk
            </button>
          </div>
          <div className="mt-8 flex items-center justify-center gap-4 text-sm text-blue-200 font-medium">
            <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Lifetime Access</span>
            <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Cloud Database</span>
            <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Support 24/7</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-blue-600 p-1.5 rounded-lg">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl tracking-tight">e-Surat <span className="text-blue-600">TU</span></span>
            </div>
            <p className="text-slate-500 text-sm max-w-xs">
              Membantu digitalisasi administrasi sekolah Indonesia dengan solusi yang tepat guna dan modern.
            </p>
          </div>
          <div className="flex gap-10">
            <div className="space-y-4">
              <h4 className="font-bold text-slate-900">Produk</h4>
              <ul className="text-sm text-slate-500 space-y-2">
                <li className="hover:text-blue-600 cursor-pointer">Fitur</li>
                <li className="hover:text-blue-600 cursor-pointer">Update log</li>
                <li className="hover:text-blue-600 cursor-pointer underline" onClick={onStart}>Demo</li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-bold text-slate-900">Bantuan</h4>
              <ul className="text-sm text-slate-500 space-y-2">
                <li><a href="https://lynk.id/bugurulela" className="hover:text-blue-600">Hubungi Kami</a></li>
                <li className="hover:text-blue-600 cursor-pointer">FAQ</li>
                <li className="hover:text-blue-600 cursor-pointer">Kebijakan Privasi</li>
              </ul>
            </div>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-12 pt-8 border-t border-slate-100 flex justify-between items-center text-xs text-slate-400">
          <p>&copy; {new Date().getFullYear()} e-Surat TU. Crafted for Buguru Lela.</p>
          <div className="flex gap-4">
            <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" /> 100% Secure Transaction</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
