import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { 
  FileText, 
  Settings, 
  History, 
  Printer, 
  Download, 
  Save, 
  Upload,
  Trash2,
  Building,
  MapPin,
  Sparkles,
  Loader2,
  UserPlus,
  FileUp,
  FileSpreadsheet,
  X,
  Database,
  Users,
  LogOut,
  ShieldCheck,
  ShieldAlert,
  Clock,
  LogIn
} from 'lucide-react';
import { 
  initFirebase, 
  getSchoolData, 
  upsertSchoolData, 
  addSuratHistory, 
  getSuratHistoryList, 
  deleteSuratHistory,
  auth,
  loginWithGoogle,
  logout,
  getUserProfile,
  requestAccess,
  getAllUserProfiles,
  updateUserStatus,
  ADMIN_EMAIL,
  type UserProfile
} from './lib/firebase';
import { onAuthStateChanged, type User } from 'firebase/auth';

const safeGetStorage = (key: string) => {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    return null;
  }
};

const safeSetStorage = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    // Ignore
  }
};

export default function App() {
  const [activeTab, setActiveTab] = useState('buat'); // buat, riwayat, pengaturan, users
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [dbStatus, setDbStatus] = useState<'local' | 'firebase' | 'syncing' | 'error'>('local');
  const [dbError, setDbError] = useState<string | null>(null);
  
  // State untuk Pengaturan KOP Sekolah
  const [schoolData, setSchoolData] = useState(() => {
    const saved = safeGetStorage('tu_school_data');
    return saved ? JSON.parse(saved) : {
      namaInstansi: 'PEMERINTAH PROVINSI JAWA BARAT\nDINAS PENDIDIKAN\nSMK NEGERI 1 CONTOH',
      alamat: 'Jl. Pendidikan No. 123, Kota Contoh, Provinsi Jawa Barat 40123',
      kontak: 'Telp: (022) 1234567 | Email: info@smkn1contoh.sch.id | Web: www.smkn1contoh.sch.id',
      logo: '', // base64 (Logo Kiri)
      logoKanan: '' // base64 (Logo Kanan)
    };
  });

  // State untuk Form Input Surat
  const [formData, setFormData] = useState({
    jenisSurat: 'Surat Undangan',
    nomorSurat: '',
    lampiran: '-',
    perihal: '',
    tempatSurat: 'Kota Contoh',
    namaTujuan: '',
    alamatTujuan: '',
    salamPembuka: 'Dengan hormat,',
    isiSurat: 'Sehubungan dengan akan dilaksanakannya rapat koordinasi evaluasi program sekolah, kami mengundang Bapak/Ibu untuk hadir pada:\n\nHari, Tanggal :\nWaktu :\nTempat :\nAgenda :',
    penutup: 'Demikian surat undangan ini kami sampaikan. Atas perhatian dan kehadiran Bapak/Ibu, kami ucapkan terima kasih.',
    tanggalSurat: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
    namaKepsek: 'Dr. H. Ahmad Sudirman, M.Pd.',
    nipKepsek: '19700101 199512 1 001',
    ttdDigital: '', // base64
    hasLampiran: false,
    daftarGuru: [
      { id: Date.now(), nama: '', nip: '', jabatan: '' }
    ]
  });

  // State untuk Riwayat Surat
  const [history, setHistory] = useState<any[]>(() => {
    const saved = safeGetStorage('tu_history_surat');
    return saved ? JSON.parse(saved) : [];
  });

  // Auth & Profile Logic
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        setAuthLoading(true);
        let p = await getUserProfile(u.uid);
        if (!p) {
          p = await requestAccess(u) as UserProfile;
        }
        setProfile(p);
      } else {
        setProfile(null);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Sync profiles if admin
  useEffect(() => {
    if (profile?.role === 'admin' && activeTab === 'users') {
      const loadProfiles = async () => {
        const list = await getAllUserProfiles();
        setUserProfiles(list);
      };
      loadProfiles();
    }
  }, [profile, activeTab]);

  // Load from Firebase on mount if configured and approved
  useEffect(() => {
    if (profile?.status !== 'approved') return;

    const initializeApp = async () => {
      const result = await initFirebase();
      
      try {
        setDbStatus('syncing');
        
        const [fSchoolData, fHistory] = await Promise.all([
          getSchoolData(),
          getSuratHistoryList()
        ]);
        
        if (fSchoolData) {
          setSchoolData({
            namaInstansi: fSchoolData.namaInstansi || '',
            alamat: fSchoolData.alamat || '',
            kontak: fSchoolData.kontak || '',
            logo: fSchoolData.logo || '',
            logoKanan: fSchoolData.logoKanan || '',
          });
        }
        
        if (fHistory) {
          setHistory(fHistory.map((h: any) => ({
            id: h.id,
            tanggalBuat: h.tanggalBuat,
            jenisSurat: h.jenisSurat,
            nomorSurat: h.nomorSurat,
            perihal: h.perihal,
            namaTujuan: h.namaTujuan,
            ...h.formData
          })));
        }
        
        setDbStatus('firebase');
        setDbError(null);
      } catch (err: any) {
        console.error("Firebase initial sync failed", err);
        let parsedError = err.message;
        try {
          const json = JSON.parse(err.message);
          parsedError = json.error;
        } catch { /* ignore */ }

        if (parsedError?.includes('luring') || parsedError?.includes('offline') || parsedError?.includes('unavailable')) {
          setDbStatus('local');
          console.warn("Firebase offline, falling back to local storage");
        } else {
          setDbStatus('error');
          setDbError(parsedError || 'Gagal terhubung ke database. Tekan icon database untuk mencoba lagi.');
        }
      }
    };
    
    initializeApp();
  }, []);

  const handleRetryDatabase = () => {
    setActiveTab('buat'); // Ensure we are on a visible tab
    setDbStatus('syncing');
    setDbError(null);
    // Trigger the same initialization logic
    const initializeApp = async () => {
      const result = await initFirebase();
      try {
        const [fSchoolData, fHistory] = await Promise.all([
          getSchoolData(),
          getSuratHistoryList()
        ]);
        
        if (fSchoolData) {
          setSchoolData({
            namaInstansi: fSchoolData.namaInstansi || '',
            alamat: fSchoolData.alamat || '',
            kontak: fSchoolData.kontak || '',
            logo: fSchoolData.logo || '',
            logoKanan: fSchoolData.logoKanan || '',
          });
        }
        
        if (fHistory && fHistory.length > 0) {
          setHistory(fHistory.map((h: any) => ({
            id: h.id,
            tanggalBuat: h.tanggalBuat,
            jenisSurat: h.jenisSurat,
            nomorSurat: h.nomorSurat,
            perihal: h.perihal,
            namaTujuan: h.namaTujuan,
            ...h.formData
          })));
        }
        setDbStatus('firebase');
      } catch (err: any) {
        let parsedError = err.message;
        try { const json = JSON.parse(err.message); parsedError = json.error; } catch { }
        setDbStatus('error');
        setDbError(parsedError || 'Koneksi gagal.');
      }
    };
    initializeApp();
  };

  // Efek untuk menyimpan pengaturan
  useEffect(() => {
    safeSetStorage('tu_school_data', JSON.stringify(schoolData));
    
    if (dbStatus === 'firebase') {
      const timeoutId = setTimeout(async () => {
        try {
          // Safeguard: Check approximate size before sending
          const payload = {
            namaInstansi: schoolData.namaInstansi,
            alamat: schoolData.alamat,
            kontak: schoolData.kontak,
            logo: schoolData.logo,
            logoKanan: schoolData.logoKanan
          };
          
          const sizeEstimate = JSON.stringify(payload).length;
          
          // If size is borderline, try to auto-compress the biggest logo
          if (sizeEstimate > 850000) {
            console.warn("Payload size close to limit, attempting auto-compression");
            const compressLogo = async (b64: string): Promise<string> => {
              if (!b64 || b64.length < 100000) return b64;
              return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => {
                  const canvas = document.createElement('canvas');
                  const dim = 180; // Aggressive target
                  let { width, height } = img;
                  if (width > dim || height > dim) {
                    if (width > height) { height = Math.round((height * dim) / width); width = dim; }
                    else { width = Math.round((width * dim) / height); height = dim; }
                  }
                  canvas.width = width; canvas.height = height;
                  canvas.getContext('2d')?.drawImage(img, 0, 0, width, height);
                  resolve(canvas.toDataURL('image/jpeg', 0.3));
                };
                img.onerror = () => resolve(b64);
                img.src = b64;
              });
            };

            const newLogo = await compressLogo(schoolData.logo);
            const newLogoKanan = await compressLogo(schoolData.logoKanan);
            
            if (newLogo !== schoolData.logo || newLogoKanan !== schoolData.logoKanan) {
              setSchoolData(prev => ({ ...prev, logo: newLogo, logoKanan: newLogoKanan }));
              return; // Next effect run will handle the smaller payload
            }
          }

          if (sizeEstimate > 980000) {
            setDbStatus('error');
            setDbError('Ukuran Data Pengaturan (Logo) terlalu besar (Maks 1MB). Silakan gunakan logo dengan resolusi lebih rendah.');
            return;
          }

          await upsertSchoolData(payload);
          if (dbStatus === 'error' && dbError?.includes('size')) {
            setDbError(null);
            setDbStatus('firebase');
          }
        } catch (e: any) {
          console.error("Failed saving school data to firebase", e);
          if (e.message?.includes('exceeds the maximum allowed size')) {
             setDbStatus('error');
             setDbError('Ukuran Logo terlalu besar untuk disimpan di Cloud. Silakan ganti dengan logo yang lebih kecil.');
          }
        }
      }, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [schoolData, dbStatus]);

  useEffect(() => {
    safeSetStorage('tu_history_surat', JSON.stringify(history));
  }, [history]);

  // Penomoran Otomatis saat pertama load atau ganti jenis surat
  useEffect(() => {
    if (activeTab === 'buat' && !formData.nomorSurat) {
      generateAutoNumber();
    }
  }, [activeTab, formData.jenisSurat]);

  const generateAutoNumber = () => {
    let nextNum = 1;
    const year = new Date().getFullYear();
    const kodeJenis = getKodeSurat(formData.jenisSurat);
    
    if (history.length > 0) {
      const lastSurat = history[0]; 
      const match = lastSurat.nomorSurat.match(/^(\d+)/);
      if (match) {
        nextNum = parseInt(match[1], 10) + 1;
      }
    }
    
    const paddedNum = String(nextNum).padStart(3, '0');
    setFormData(prev => ({
      ...prev,
      nomorSurat: `${paddedNum}/${kodeJenis}/SMKN1/${year}`
    }));
  };

  const getKodeSurat = (jenis: string) => {
    const kodes: Record<string, string> = {
      'Surat Undangan': 'UND',
      'Surat Tugas': 'ST',
      'Surat Keputusan': 'SK',
      'Surat Pemberitahuan': 'PENG',
      'Surat Permohonan': 'MOHON',
      'Surat Peminjaman': 'PINJAM',
      'Surat Edaran': 'SE'
    };
    return kodes[jenis] || 'UMUM';
  };

  const templates: Record<string, any> = {
    'Surat Undangan': {
      salam: 'Dengan hormat,',
      isi: 'Sehubungan dengan akan dilaksanakannya rapat koordinasi evaluasi program sekolah, kami mengundang Bapak/Ibu untuk hadir pada:\n\nHari, Tanggal :\nWaktu :\nTempat :\nAgenda :',
      penutup: 'Demikian surat undangan ini kami sampaikan. Atas perhatian dan kehadiran Bapak/Ibu, kami ucapkan terima kasih.'
    },
    'Surat Tugas': {
      salam: 'Yang bertanda tangan di bawah ini Kepala Sekolah, memberikan tugas kepada:',
      isi: 'Nama :\nNIP :\nJabatan :\n\nUntuk melaksanakan kegiatan pembinaan dan pengawasan pada:\nHari, Tanggal :\nTempat :',
      penutup: 'Demikian Surat Tugas ini diberikan untuk dapat dilaksanakan dengan sebaik-baiknya dan penuh tanggung jawab.'
    },
    'Surat Keputusan': {
      salam: '',
      isi: 'Menimbang :\na. bahwa dalam rangka meningkatkan kualitas pendidikan di lingkungan sekolah...\nb. bahwa berdasarkan pertimbangan sebagaimana dimaksud pada huruf a...\n\nMengingat :\n1. Undang-Undang Nomor 20 Tahun 2003 tentang Sistem Pendidikan Nasional;\n2. Peraturan Pemerintah Nomor 19 Tahun 2005 tentang Standar Nasional Pendidikan;\n\nMEMUTUSKAN\n\nMenetapkan :\nPERTAMA : Menunjuk nama-nama terlampir sebagai panitia kegiatan...\nKEDUA : Panitia bertugas merencanakan, melaksanakan, dan melaporkan kegiatan...\nKETIGA : Segala biaya yang timbul akibat keputusan ini dibebankan pada anggaran sekolah.',
      penutup: 'Keputusan ini mulai berlaku pada tanggal ditetapkan dengan ketentuan apabila terdapat kekeliruan akan diperbaiki sebagaimana mestinya.'
    },
    'Surat Pemberitahuan': {
      salam: 'Dengan hormat,',
      isi: 'Bersama surat ini kami beritahukan kepada seluruh orang tua/wali murid bahwa kegiatan Penilaian Akhir Semester (PAS) akan dilaksanakan pada tanggal [Tanggal Mulai] sampai dengan [Tanggal Selesai].\n\nSehubungan dengan hal tersebut, kami mohon Bapak/Ibu dapat mengawasi proses belajar putra-putrinya di rumah.',
      penutup: 'Demikian surat pemberitahuan ini kami sampaikan, atas perhatian dan kerja samanya kami ucapkan terima kasih.'
    },
    'Surat Permohonan': {
      salam: 'Dengan hormat,',
      isi: 'Sehubungan dengan akan diadakannya kegiatan [Nama Kegiatan] yang diselenggarakan oleh OSIS SMK Negeri 1 Contoh pada:\n\nHari, Tanggal :\nWaktu :\nTempat :\n\nOleh karena itu, kami bermaksud memohon bantuan dana/izin tempat kepada Bapak/Ibu demi kelancaran kegiatan tersebut.',
      penutup: 'Demikian surat permohonan ini kami sampaikan. Atas perhatian dan perkenan Bapak/Ibu, kami ucapkan terima kasih.'
    },
    'Surat Peminjaman': {
      salam: 'Dengan hormat,',
      isi: 'Sehubungan dengan kegiatan [Nama Kegiatan] yang akan dilaksanakan pada:\n\nHari, Tanggal :\nWaktu :\n\nKami bermaksud meminjam fasilitas berupa [Sebutkan Fasilitas/Ruangan] untuk mendukung kelancaran kegiatan tersebut.',
      penutup: 'Demikian surat permohonan peminjaman ini kami sampaikan. Atas izin dan kerja sama Bapak/Ibu, kami ucapkan terima kasih.'
    },
    'Surat Edaran': {
      salam: 'Dengan hormat,',
      isi: 'Memperhatikan instruksi dari Dinas Pendidikan Provinsi mengenai pelaksanaan hari libur nasional dan cuti bersama, dengan ini kami sampaikan hal-hal sebagai berikut:\n\n1. Kegiatan belajar mengajar (KBM) ditiadakan pada tanggal...\n2. Seluruh siswa wajib kembali masuk ke sekolah pada tanggal...\n3. Selama hari libur, siswa dihimbau untuk tetap belajar di rumah.',
      penutup: 'Demikian Surat Edaran ini disampaikan untuk menjadi perhatian dan dilaksanakan sebagaimana mestinya.'
    }
  };

  const handleJenisSuratChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const jenis = e.target.value;
    const tpl = templates[jenis] || templates['Surat Undangan'];

    setFormData(prev => ({ 
      ...prev, 
      jenisSurat: jenis,
      salamPembuka: tpl.salam,
      isiSurat: tpl.isi,
      penutup: tpl.penutup,
      lampiran: ['Surat Tugas', 'Surat Keputusan', 'Surat Edaran'].includes(jenis) ? '' : prev.lampiran
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const addGuru = () => {
    setFormData(prev => ({
      ...prev,
      daftarGuru: [...prev.daftarGuru, { id: Date.now(), nama: '', nip: '', jabatan: '' }]
    }));
  };

  const updateGuru = (id: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      daftarGuru: prev.daftarGuru.map(g => g.id === id ? { ...g, [field]: value } : g)
    }));
  };

  const removeGuru = (id: number) => {
    setFormData(prev => ({
      ...prev,
      daftarGuru: prev.daftarGuru.filter(g => g.id !== id)
    }));
  };

  const handleGuruFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const fileName = file.name.toLowerCase();
      const reader = new FileReader();

      if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        reader.onload = (event) => {
          const data = new Uint8Array(event.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

          const importedGuru: any[] = jsonData
            .slice(1) // Skip header
            .map(row => {
              if (row && row.length >= 2) {
                return {
                  id: Date.now() + Math.random(),
                  nama: String(row[0] || '').trim(),
                  nip: String(row[1] || '').trim(),
                  jabatan: String(row[2] || '').trim()
                };
              }
              return null;
            })
            .filter(g => g !== null);

          if (importedGuru.length > 0) {
            setFormData(prev => {
              const currentNonEmpty = prev.daftarGuru.filter(g => g.nama !== '' || g.nip !== '');
              return {
                ...prev,
                daftarGuru: [...currentNonEmpty, ...importedGuru]
              };
            });
            alert(`Berhasil mengimpor ${importedGuru.length} data guru dari Excel.`);
          } else {
            alert("Tidak ada data guru yang valid ditemukan di file Excel.");
          }
        };
        reader.readAsArrayBuffer(file);
      } else {
        // Handle as CSV/Text
        reader.onload = (event) => {
          const content = event.target?.result as string;
          const lines = content.split('\n');
          const importedGuru: any[] = lines
            .map(line => {
              const parts = line.split(/[,;]/);
              if (parts.length >= 2) {
                return {
                  id: Date.now() + Math.random(),
                  nama: parts[0]?.trim() || '',
                  nip: parts[1]?.trim() || '',
                  jabatan: parts[2]?.trim() || ''
                };
              }
              return null;
            })
            .filter(g => g !== null);
          
          if (importedGuru.length > 0) {
            setFormData(prev => {
              const currentNonEmpty = prev.daftarGuru.filter(g => g.nama !== '' || g.nip !== '');
              return {
                ...prev,
                daftarGuru: [...currentNonEmpty, ...importedGuru]
              };
            });
            alert(`Berhasil mengimpor ${importedGuru.length} data guru dari CSV.`);
          } else {
            alert("Format file tidak dikenali. Gunakan format CSV (Nama, NIP, Jabatan).");
          }
        };
        reader.readAsText(file);
      }
    }
  };

  const downloadExcelTemplate = () => {
    const data = [
      ['Nama Lengkap', 'NIP / Identitas', 'Jabatan / Peran'],
      ['Dr. H. Budi Santoso, M.Pd.', '19700101 199512 1 001', 'Ketua Panitia'],
      ['Siti Aminah, S.Pd.', '19850210 201001 2 005', 'Sekretaris'],
      ['Andi Wijaya, S.T.', '-', 'Anggota / Guru Produktif']
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template Data Guru');

    // Generate buffer
    XLSX.writeFile(workbook, 'Template_Data_Guru.xlsx');
  };

  const handleSchoolDataChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSchoolData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: string, isSchoolData = false) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("File asal terlalu besar. Harap gunakan gambar di bawah 2MB sebelum dikompresi otomatis.");
        return;
      }
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIM = isSchoolData ? 200 : 350; // Smaller for logos
        let { width, height } = img;

        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        // Try JPEG first for better compression if it's potentially large
        let dataUrl = canvas.toDataURL('image/jpeg', 0.5);
        
        if (dataUrl.length > 250000) { 
          // Even smaller and more compressed if still large
          dataUrl = canvas.toDataURL('image/jpeg', 0.3);
          if (dataUrl.length > 400000) {
            alert("Gambar logo masih terlalu besar setelah dikompresi. Silakan gunakan gambar dengan resolusi lebih rendah.");
            return;
          }
        }
        
        if (isSchoolData) {
          setSchoolData(prev => ({ ...prev, [field]: dataUrl }));
        } else {
          setFormData(prev => ({ ...prev, [field]: dataUrl }));
        }
      };
      img.src = URL.createObjectURL(file);
    }
  };

  const generateIsiSuratAI = async () => {
    if (!formData.perihal) {
      alert("Silakan isi 'Perihal' (atau 'Tentang') terlebih dahulu agar AI tahu topik surat yang harus ditulis.");
      return;
    }

    setIsGenerating(true);
    
    try {
      const response = await fetch('/api/generate-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jenisSurat: formData.jenisSurat,
          perihal: formData.perihal,
          namaTujuan: formData.namaTujuan || 'Pihak Terkait'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          alert("Gagal: Kuota harian Gemini API telah habis. Silakan coba lagi besok.");
        } else {
          throw new Error(data.error || "Gagal menyusun surat otomatis.");
        }
        return;
      }

      if (data.text) {
        setFormData(prev => ({ ...prev, isiSurat: data.text }));
      } else {
        throw new Error("Respons teks dari AI kosong.");
      }
    } catch (error: any) {
      console.error("Gagal menggenerate isi surat:", error);
      alert(error.message || "Terjadi kesalahan saat memanggil AI.");
    } finally {
      setIsGenerating(false);
    }
  };

  const simpanKeRiwayat = async () => {
    const isStandardLocal = ['Surat Undangan', 'Surat Pemberitahuan', 'Surat Permohonan', 'Surat Peminjaman'].includes(formData.jenisSurat);
    if (isStandardLocal && (!formData.perihal || !formData.namaTujuan)) {
      alert("Mohon isi minimal Perihal dan Nama Tujuan Instansi.");
      return;
    }
    const newRecord = {
      id: Date.now(), // we'll use numeric id for local fallback, but firebase generates uuid
      tanggalBuat: new Date().toISOString(),
      ...formData
    };

    if (dbStatus === 'firebase') {
      try {
        const payloadRecord = { ...newRecord };
        if (payloadRecord.ttdDigital && payloadRecord.ttdDigital.length > 500000) {
           payloadRecord.ttdDigital = ''; // Exclude large signature
        }

        const fbId = await addSuratHistory({
          jenisSurat: formData.jenisSurat,
          nomorSurat: formData.nomorSurat,
          perihal: formData.perihal,
          namaTujuan: formData.namaTujuan,
          tanggalBuat: newRecord.tanggalBuat,
          formData: payloadRecord
        });
        
        if (fbId) {
            newRecord.id = fbId;
        }
      } catch (err) {
        console.error("Failed to save to firebase", err);
        // keep going, will save to local
      }
    }

    setHistory([newRecord, ...history]);
    alert("Surat berhasil disimpan ke riwayat!");
  };

  const loadDariRiwayat = (record: any) => {
    setFormData({
      ...record,
      tempatSurat: record.tempatSurat || 'Kota Contoh',
      tanggalSurat: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    });
    setActiveTab('buat');
  };

  const hapusRiwayat = async (id: any) => {
    if(window.confirm("Yakin ingin menghapus surat ini dari riwayat?")) {
      if (dbStatus === 'firebase') {
        try {
          await deleteSuratHistory(id);
        } catch (err) {
          console.error("Failed to delete from firebase", err);
        }
      }
      setHistory(history.filter(h => h.id !== id));
    }
  };

  const resetForm = () => {
    if(window.confirm("Yakin ingin mengosongkan form?")) {
      setFormData(prev => ({
        ...prev,
        nomorSurat: '',
        lampiran: '-',
        perihal: '',
        tempatSurat: 'Kota Contoh',
        namaTujuan: '',
        alamatTujuan: '',
        salamPembuka: '',
        isiSurat: '',
        penutup: '',
        ttdDigital: '',
        hasLampiran: false,
        daftarGuru: [{ id: Date.now(), nama: '', nip: '', jabatan: '' }]
      }));
      generateAutoNumber();
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const exportToWord = () => {
    const printArea = document.getElementById('printable-area');
    if (!printArea) return;

    // Build the header HTML with proper MSO styles
    const header = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' 
            xmlns:w='urn:schemas-microsoft-com:office:word' 
            xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>Surat Kedinasan</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          @page {
            size: 21cm 29.7cm;
            margin: 2cm 1.5cm 2cm 3cm; /* Atas, Kanan, Bawah, Kiri */
          }
          body { 
            font-family: 'Times New Roman', serif; 
            font-size: 11pt; 
            line-height: 1.3;
            margin: 0;
            padding: 0;
            color: black;
          }
          table { width: 100%; border-collapse: collapse; }
          td { vertical-align: top; }
          .font-bold { font-weight: bold; }
          .uppercase { text-transform: uppercase; }
          .text-center { text-align: center; }
          .text-justify { text-align: justify; }
          .text-right { text-align: right; }
          .underline { text-decoration: underline; }
          .italic { font-style: italic; }
          .leading-tight { line-height: 1.0; }
          .leading-snug { line-height: 1.2; }
          .leading-relaxed { line-height: 1.5; }
          
          /* Margins & Spacings */
          .mb-1 { margin-bottom: 3pt; }
          .mb-2 { margin-bottom: 6pt; }
          .mb-4 { margin-bottom: 12pt; }
          .mb-6 { margin-bottom: 18pt; }
          .mb-8 { margin-bottom: 24pt; }
          .mb-12 { margin-bottom: 36pt; }
          .mt-2 { margin-top: 6pt; }
          .mt-4 { margin-top: 12pt; }
          .mt-12 { margin-top: 36pt; }
          .pt-1 { padding-top: 2pt; }
          .pt-2 { padding-top: 6pt; }
          .pt-4 { padding-top: 12pt; }
          .pb-3 { padding-bottom: 9pt; }
          
          /* Font Sizes */
          .text-\\[16pt\\] { font-size: 16pt; }
          .text-\\[14pt\\] { font-size: 14pt; }
          .text-\\[13pt\\] { font-size: 13pt; }
          .text-\\[12pt\\] { font-size: 12pt; }
          .text-\\[11pt\\] { font-size: 11pt; }
          .text-\\[10pt\\] { font-size: 10pt; }
          .text-\\[9\\.5pt\\] { font-size: 9.5pt; }
          .text-\\[9pt\\] { font-size: 9pt; }
          .text-\\[8pt\\] { font-size: 8pt; }
          
          /* Borders */
          .border { border: 1pt solid black; }
          .border-b { border-bottom: 1pt solid black; }
          .border-t { border-top: 1pt solid black; }
          .border-black { border-color: black; }
          
          /* Images & Icons */
          img { display: block; }
          .object-contain { object-fit: contain; }
          
          /* Layout Helper for Word */
          .kop-table { 
            border-bottom: 3pt double black; 
            margin-bottom: 18pt; 
            width: 100%;
          }
          .kop-logo { width: 28mm; text-align: center; padding-bottom: 9pt; }
          .kop-content { text-align: center; padding: 0 10pt 9pt 10pt; }
          
          .no-print { display: none !important; }
          .whitespace-pre-wrap { white-space: pre-wrap; }
        </style>
      </head>
      <body>
    `;

    // 1. Extract pieces of data instead of just innerHTML to rebuild a Word-friendly structure
    // This is much more reliable than trying to map flex classes to Word styles
    
    const isStandardLocal = ['Surat Undangan', 'Surat Pemberitahuan', 'Surat Permohonan', 'Surat Peminjaman'].includes(formData.jenisSurat);
    const isTugasLocal = formData.jenisSurat === 'Surat Tugas';
    const isSKLocal = formData.jenisSurat === 'Surat Keputusan';

    let contentHTML = `
      <div class="printable-content">
        <!-- KOP SURAT (USING TABLE FOR WORD) -->
        <table class="kop-table" style="mso-border-bottom-alt: double black 3.0pt;">
          <tr>
            <td class="kop-logo" style="width: 28mm;">
              ${schoolData.logo ? `<img src="${schoolData.logo}" width="100" height="100" style="width: 25mm; height: 25mm;">` : ''}
            </td>
            <td class="kop-content">
              ${schoolData.namaInstansi.split('\n').map((line: string, i: number, arr: string[]) => (
                `<div class="${i === arr.length - 1 ? 'font-bold text-[16pt]' : 'font-bold text-[13pt] text-center'} uppercase leading-tight mb-1">${line}</div>`
              )).join('')}
              <div class="text-[10pt] mt-2 leading-snug text-center" style="font-family: serif;">${schoolData.alamat.replace(/\n/g, '<br/>')}</div>
              <div class="text-[9.5pt] leading-snug italic text-center" style="font-family: serif;">${schoolData.kontak.replace(/\n/g, '<br/>')}</div>
            </td>
            <td class="kop-logo" style="width: 28mm;">
              ${schoolData.logoKanan ? `<img src="${schoolData.logoKanan}" width="100" height="100" style="width: 25mm; height: 25mm;">` : ''}
            </td>
          </tr>
        </table>

        <!-- BODY SURAT -->
        <div>
          ${isStandardLocal ? `
            <table style="margin-bottom: 24pt;">
              <tr>
                <td style="width: 60%;">
                  <table>
                    <tr><td style="width: 80pt;">Nomor</td><td style="width: 10pt;">:</td><td>${formData.nomorSurat || '-'}</td></tr>
                    <tr><td>Lampiran</td><td>:</td><td>${formData.lampiran || '-'}</td></tr>
                    <tr><td>Perihal</td><td>:</td><td class="font-bold">${formData.perihal || '-'}</td></tr>
                  </table>
                </td>
                <td class="text-right" style="width: 40%; vertical-align: top;">
                  ${formData.tempatSurat}, ${formData.tanggalSurat}
                </td>
              </tr>
            </table>
            <div class="mb-8">
              <div>Yth. <strong>${formData.namaTujuan || '[Nama Tujuan]'}</strong></div>
              <div>di</div>
              <div class="whitespace-pre-wrap">${(formData.alamatTujuan || '[Alamat]').replace(/\n/g, '<br/>')}</div>
            </div>
          ` : ''}

          ${isTugasLocal ? `
            <div class="mb-8 text-center pt-2">
              <div class="font-bold text-[14pt] underline uppercase tracking-wide">SURAT TUGAS</div>
              <div class="text-[11pt]">Nomor: ${formData.nomorSurat || '-'}</div>
              <div class="text-right mt-2 text-[11pt]">${formData.tempatSurat}, ${formData.tanggalSurat}</div>
            </div>
          ` : ''}

          ${isSKLocal ? `
            <div class="mb-8 text-center pt-2">
              <div class="font-bold text-[14pt] uppercase">KEPUTUSAN KEPALA ${schoolData.namaInstansi.split('\n').pop()}</div>
              <div class="text-[11pt]">Nomor: ${formData.nomorSurat || '-'}</div>
              <div class="mt-4 font-bold uppercase underline">TENTANG</div>
              <div class="font-bold uppercase">${formData.perihal || '-'}</div>
            </div>
          ` : ''}

          <div class="mb-6 text-justify">
            ${formData.salamPembuka && !isSKLocal ? `<p style="margin-top: 0; margin-bottom: 12pt;">${formData.salamPembuka}</p>` : ''}
            ${formData.isiSurat.split('\n').map(p => p.trim() ? `<p style="margin-top: 0; margin-bottom: 8pt; line-height: 1.5;">${p}</p>` : `<p style="margin: 0; line-height: 1.5;">&nbsp;</p>`).join('')}
          </div>

          ${formData.penutup ? `<div class="mb-12 text-justify">` + formData.penutup.split('\n').map(p => p.trim() ? `<p style="margin-top: 0; margin-bottom: 8pt; line-height: 1.5;">${p}</p>` : `<p style="margin: 0; line-height: 1.5;">&nbsp;</p>`).join('') + `</div>` : ''}

          <!-- TANDA TANGAN -->
          <table style="margin-top: 36pt;">
            <tr>
              <td style="width: 60%;"></td>
              <td style="width: 40%;">
                ${!isStandardLocal ? `
                  <table style="font-size: 10pt; margin-bottom: 6pt;">
                    <tr><td style="width: 80pt;">Ditetapkan di</td><td style="width: 10pt;">:</td><td>${formData.tempatSurat}</td></tr>
                    <tr><td>Pada tanggal</td><td>:</td><td>${formData.tanggalSurat}</td></tr>
                  </table>
                ` : ''}
                <div class="mb-1">Kepala Sekolah,</div>
                <div style="height: 80pt; position: relative;">
                  ${formData.ttdDigital ? `<img src="${formData.ttdDigital}" width="120" height="80" style="max-height: 80pt;">` : ''}
                </div>
                <div class="font-bold underline uppercase">${formData.namaKepsek}</div>
                <div>NIP. ${formData.nipKepsek}</div>
              </td>
            </tr>
          </table>
        </div>

        ${formData.hasLampiran ? `
          <div style="page-break-before: always; border-top: 1pt solid #ccc; padding-top: 24pt; margin-top: 36pt;">
            <table class="text-[10pt] mb-6">
              <tr><td style="width: 80pt;">Lampiran</td><td style="width: 10pt;">:</td><td>${formData.jenisSurat}</td></tr>
              <tr><td>Nomor</td><td>:</td><td>${formData.nomorSurat}</td></tr>
              <tr><td>Tanggal</td><td>:</td><td>${formData.tanggalSurat}</td></tr>
              <tr><td>Tentang</td><td>:</td><td class="font-bold">${formData.perihal}</td></tr>
            </table>
            
            <div class="text-center font-bold text-[12pt] underline uppercase mb-6 pt-4">
              DAFTAR NAMA GURU / PEGAWAI
            </div>
            
            <table class="border border-collapse text-[10pt]">
              <thead>
                <tr style="background-color: #f1f5f9;">
                  <th class="border text-center" style="width: 30pt; padding: 5pt;">No</th>
                  <th class="border" style="text-align: left; padding: 5pt;">Nama Lengkap</th>
                  <th class="border" style="text-align: left; padding: 5pt;">NIP / No. Identitas</th>
                  <th class="border" style="text-align: left; padding: 5pt;">Jabatan / Peran</th>
                </tr>
              </thead>
              <tbody>
                ${formData.daftarGuru.map((guru, index) => `
                  <tr>
                    <td class="border text-center" style="padding: 5pt;">${index + 1}</td>
                    <td class="border" style="padding: 5pt;">${guru.nama || '-'}</td>
                    <td class="border" style="padding: 5pt;">${guru.nip || '-'}</td>
                    <td class="border" style="padding: 5pt;">${guru.jabatan || '-'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <table style="margin-top: 36pt;">
              <tr>
                <td style="width: 60%;"></td>
                <td style="width: 40%;">
                  <div class="mb-1">Kepala Sekolah,</div>
                  <div style="height: 60pt;">
                    ${formData.ttdDigital ? `<img src="${formData.ttdDigital}" width="100" height="60" style="max-height: 60pt;">` : ''}
                  </div>
                  <div class="font-bold underline uppercase">${formData.namaKepsek}</div>
                  <div>NIP. ${formData.nipKepsek}</div>
                </td>
              </tr>
            </table>
          </div>
        ` : ''}
      </div>
    `;
    
    const footer = "</body></html>";
    const sourceHTML = header + contentHTML + footer;
    
    const blob = new Blob(['\ufeff', sourceHTML], {
      type: 'application/msword'
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Surat_${formData.jenisSurat}_${formData.perihal.replace(/\s+/g, '_')}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const isStandard = ['Surat Undangan', 'Surat Pemberitahuan', 'Surat Permohonan', 'Surat Peminjaman'].includes(formData.jenisSurat);
  const isTugas = formData.jenisSurat === 'Surat Tugas';
  const isSK = formData.jenisSurat === 'Surat Keputusan';
  const isEdaran = formData.jenisSurat === 'Surat Edaran';

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center group">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-500 font-medium animate-pulse">Menghubungkan layanan...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="bg-blue-600 p-8 text-center">
            <div className="bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/30">
              <Building className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">e-Surat TU</h1>
            <p className="text-blue-100 text-sm mt-1">Sistem Administrasi Surat Kedinasan</p>
          </div>
          <div className="p-8 text-center">
            <p className="text-slate-600 mb-8">Silakan masuk dengan akun Google sekolah Anda untuk melanjutkan.</p>
            <button 
              onClick={() => loginWithGoogle()}
              className="w-full flex items-center justify-center gap-3 bg-white border-2 border-slate-200 py-3.5 rounded-xl font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-[0.98]"
            >
              <LogIn className="w-5 h-5 text-blue-600" />
              Masuk dengan Google
            </button>
            <div className="mt-8 flex items-center gap-2 justify-center text-slate-400 text-[10px] uppercase font-bold tracking-widest">
              <ShieldCheck className="w-3 h-3" /> Aman & Terenkripsi
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (profile?.status === 'pending') {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-10 text-center">
          <div className="bg-amber-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock className="w-10 h-10 text-amber-600 animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Menunggu Persetujuan</h2>
          <p className="text-slate-600 text-sm mb-8">
            Akun Anda <strong>{user.email}</strong> telah terdaftar. <br/>
            Silakan hubungi Admin untuk mengaktifkan akses Anda ke aplikasi ini.
          </p>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-left mb-8">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-1">Status Anda:</div>
            <div className="flex items-center gap-2 font-bold text-amber-600">
              <span className="w-2 h-2 bg-amber-500 rounded-full animate-ping"></span>
              PENDING APPROVAL
            </div>
          </div>
          <button 
            onClick={logout}
            className="text-slate-400 hover:text-slate-600 text-sm font-medium transition-colors"
          >
            Keluar akun
          </button>
        </div>
      </div>
    );
  }

  if (profile?.status === 'rejected') {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-10 text-center">
          <div className="bg-red-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldAlert className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Akses Ditolak</h2>
          <p className="text-slate-600 text-sm mb-8">
            Maaf, akses Anda ke aplikasi ini telah dibatasi atau ditolak oleh administrator.
          </p>
          <button 
            onClick={logout}
            className="w-full bg-slate-800 text-white py-3 rounded-xl font-bold hover:bg-slate-900 transition-all"
          >
            Kembali ke Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      <style dangerouslySetInnerHTML={{__html: `
        @page {
          size: A4;
          margin: 0;
        }
        @media print {
          body {
            background: none !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          #printable-area { 
            position: absolute !important; 
            left: 0 !important; 
            top: 0 !important; 
            width: 210mm !important; 
            min-height: 297mm !important;
            padding: 20mm 15mm 20mm 30mm !important;
            margin: 0 !important;
            box-shadow: none !important;
            background: white !important;
            box-sizing: border-box !important;
          }
          .no-print { display: none !important; }
        }
        .printable-content {
          font-family: 'Times New Roman', Times, serif;
          line-height: 1.4;
          color: black;
          font-size: 11pt;
        }
        .preview-page {
          width: 210mm;
          min-height: 297mm;
          padding: 20mm 15mm 20mm 30mm;
          box-sizing: border-box;
          background: white;
        }
      `}} />

      <header className="bg-blue-800 text-white shadow-md p-4 flex justify-between items-center no-print">
        <div className="flex items-center gap-3">
          <Building className="w-8 h-8 text-blue-200" />
          <div>
            <h1 className="text-xl font-bold">e-Surat TU</h1>
            <p className="text-xs text-blue-200">Generator Surat Kedinasan Sekolah</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm font-medium">
          {user && (
            <div className="flex items-center gap-3 mr-4 border-r border-white/20 pr-4">
              <img src={user.photoURL || ''} className="w-8 h-8 rounded-full border-2 border-white/20" />
              <div className="hidden sm:block">
                <p className="text-xs font-bold leading-none">{user.displayName}</p>
                <p className="text-[10px] text-blue-200 leading-none mt-1">{user.email}</p>
              </div>
              <button onClick={logout} className="p-1.5 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-colors" title="Keluar">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
          <button 
            onClick={handleRetryDatabase}
            className="flex items-center gap-1.5 px-3 py-1 bg-black/20 rounded-full border border-white/10 hover:bg-black/30 transition-colors" 
            title={dbError || (dbStatus === 'firebase' ? 'Terhubung ke Firebase' : 'Mode Offline')}
          >
            <Database className={`w-3.5 h-3.5 ${dbStatus === 'firebase' ? 'text-emerald-400' : dbStatus === 'syncing' ? 'text-amber-400 animate-pulse' : dbStatus === 'error' ? 'text-red-400' : 'text-slate-400'}`} />
            <span className="text-xs text-white/90 uppercase tracking-wider">
              {dbStatus === 'firebase' ? 'Firebase' : dbStatus === 'syncing' ? 'Syncing...' : dbStatus === 'error' ? 'Retry' : 'Local'}
            </span>
          </button>
          <span>Tahun Ajaran {new Date().getFullYear()}</span>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 bg-white border-r border-slate-200 flex flex-col no-print">
          <nav className="flex-1 p-4 space-y-2">
            <SidebarButton active={activeTab === 'buat'} onClick={() => setActiveTab('buat')} icon={<FileText className="w-5 h-5" />} label="Buat Surat" />
            <SidebarButton active={activeTab === 'riwayat'} onClick={() => setActiveTab('riwayat')} icon={<History className="w-5 h-5" />} label="Riwayat Surat" />
            <SidebarButton active={activeTab === 'pengaturan'} onClick={() => setActiveTab('pengaturan')} icon={<Settings className="w-5 h-5" />} label="Pengaturan KOP" />
            {profile?.role === 'admin' && (
              <SidebarButton 
                active={activeTab === 'users'} 
                onClick={() => setActiveTab('users')} 
                icon={<Users className="w-5 h-5" />} 
                label="Manajemen Akses" 
              />
            )}
          </nav>
          {profile?.role === 'admin' && (
            <div className="p-4 bg-blue-50 border-t border-blue-100 italic text-[10px] text-blue-600">
              <ShieldCheck className="w-3 h-3 inline mr-1" />
              Mode Admin Aktif
            </div>
          )}
        </aside>

        <main className="flex-1 overflow-y-auto relative bg-slate-100 no-print">
          {dbStatus === 'error' && (
            <div className="bg-red-50 border-b border-red-200 p-3 flex items-center justify-between no-print">
              <div className="flex items-center gap-2 text-red-700 text-sm">
                <Database className="w-4 h-4" />
                <span className="font-medium">Kesalahan Database:</span>
                <span>{dbError}</span>
              </div>
              <button 
                onClick={handleRetryDatabase}
                className="text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 font-semibold"
              >
                Coba Lagi
              </button>
            </div>
          )}
          {activeTab === 'buat' && (
            <div className="p-6 flex flex-col lg:flex-row gap-6 h-full items-start">
              {/* Form Panel */}
              <div className="w-full lg:w-1/2 bg-white rounded-xl shadow-sm border border-slate-200 p-6 overflow-y-auto lg:max-h-[calc(100vh-120px)]">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-bold text-slate-800 border-b-2 border-blue-500 pb-1">Form Data Surat</h2>
                  <button onClick={resetForm} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1">
                    <Trash2 className="w-4 h-4"/> Kosongkan Form
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputWrapper label="Jenis Surat">
                      <select name="jenisSurat" value={formData.jenisSurat} onChange={handleJenisSuratChange} className="form-input">
                        {Object.keys(templates).map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </InputWrapper>
                    <div className="grid grid-cols-2 gap-2">
                      <InputWrapper label="Kota">
                        <input type="text" name="tempatSurat" value={formData.tempatSurat} onChange={handleInputChange} className="form-input" placeholder="Bandung"/>
                      </InputWrapper>
                      <InputWrapper label="Tanggal">
                        <input type="text" name="tanggalSurat" value={formData.tanggalSurat} onChange={handleInputChange} className="form-input" placeholder="15 Agustus 2026"/>
                      </InputWrapper>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputWrapper label="Nomor Surat">
                      <input type="text" name="nomorSurat" value={formData.nomorSurat} onChange={handleInputChange} className="form-input"/>
                    </InputWrapper>
                    {isStandard && (
                      <InputWrapper label="Lampiran">
                        <input type="text" name="lampiran" value={formData.lampiran} onChange={handleInputChange} className="form-input"/>
                      </InputWrapper>
                    )}
                  </div>

                  {!isEdaran && (
                    <InputWrapper label={isSK ? 'Tentang (Perihal)' : 'Perihal'}>
                      <input type="text" name="perihal" value={formData.perihal} onChange={handleInputChange} className="form-input" placeholder={isSK ? "PENGANGKATAN PANITIA..." : "Rapat Koordinasi..."}/>
                    </InputWrapper>
                  )}

                  {!isTugas && !isSK && (
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 shadow-inner">
                      <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2"><MapPin className="w-4 h-4"/> Tujuan Surat</h3>
                      <div className="space-y-3">
                        <InputWrapper label="Yth. (Nama Orang / Instansi)">
                          <input type="text" name="namaTujuan" value={formData.namaTujuan} onChange={handleInputChange} className="form-input" placeholder="Kepala Dinas Pendidikan Kota..."/>
                        </InputWrapper>
                        <InputWrapper label="Di (Alamat / Lokasi)">
                          <textarea name="alamatTujuan" value={formData.alamatTujuan} onChange={handleInputChange} rows={2} className="form-input" placeholder="Tempat / Jl. Sudirman No. 1..."></textarea>
                        </InputWrapper>
                      </div>
                    </div>
                  )}

                  {!isSK && (
                    <InputWrapper label="Salam Pembuka">
                      <input type="text" name="salamPembuka" value={formData.salamPembuka} onChange={handleInputChange} className="form-input"/>
                    </InputWrapper>
                  )}

                  <div>
                    <div className="flex justify-between items-end mb-1">
                      <label className="text-sm font-semibold text-slate-600">Isi Pokok Surat</label>
                      <button 
                        onClick={generateIsiSuratAI} 
                        disabled={isGenerating || !formData.perihal}
                        className={`text-xs flex items-center gap-1 px-3 py-1.5 rounded font-semibold transition-colors ${isGenerating || !formData.perihal ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-purple-100 text-purple-700 hover:bg-purple-200 shadow-sm border border-purple-200'}`}
                      >
                        {isGenerating ? <Loader2 className="w-3 h-3 animate-spin"/> : <Sparkles className="w-3 h-3"/>}
                        {isGenerating ? 'Menyusun...' : 'Generate AI'}
                      </button>
                    </div>
                    <textarea name="isiSurat" value={formData.isiSurat} onChange={handleInputChange} rows={10} className="form-input leading-relaxed" placeholder="Sehubungan dengan akan dilaksanakannya..."></textarea>
                  </div>

                  <InputWrapper label="Salam Penutup">
                    <textarea name="penutup" value={formData.penutup} onChange={handleInputChange} rows={2} className="form-input"></textarea>
                  </InputWrapper>

                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2"><History className="w-4 h-4"/> Halaman Lampiran</h3>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <span className="text-xs font-semibold text-slate-600">Aktifkan</span>
                        <input 
                          type="checkbox" 
                          checked={formData.hasLampiran} 
                          onChange={(e) => setFormData(p => ({...p, hasLampiran: e.target.checked}))}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                      </label>
                    </div>

                    {formData.hasLampiran && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          {formData.daftarGuru.map((guru, index) => (
                            <div key={guru.id} className="p-3 bg-white border border-slate-200 rounded-lg shadow-sm relative group">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                <InputWrapper label={`Nama Guru ${index + 1}`}>
                                  <input 
                                    value={guru.nama} 
                                    onChange={(e) => updateGuru(guru.id, 'nama', e.target.value)} 
                                    className="form-input" 
                                    placeholder="Nama Lengkap"
                                  />
                                </InputWrapper>
                                <InputWrapper label="NIP">
                                  <input 
                                    value={guru.nip} 
                                    onChange={(e) => updateGuru(guru.id, 'nip', e.target.value)} 
                                    className="form-input" 
                                    placeholder="NIP / No. Pegawai"
                                  />
                                </InputWrapper>
                              </div>
                              <InputWrapper label="Jabatan / Peran">
                                <input 
                                  value={guru.jabatan} 
                                  onChange={(e) => updateGuru(guru.id, 'jabatan', e.target.value)} 
                                  className="form-input" 
                                  placeholder="Contoh: Guru Kelas, Panitia, dsb."
                                />
                              </InputWrapper>
                              {formData.daftarGuru.length > 1 && (
                                <button 
                                  onClick={() => removeGuru(guru.id)} 
                                  className="absolute -right-2 -top-2 bg-red-100 text-red-600 p-1 rounded-full border border-red-200 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X className="w-3 h-3"/>
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={addGuru}
                            className="flex-1 py-2 bg-blue-50 text-blue-600 border border-dashed border-blue-300 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
                          >
                            <UserPlus className="w-4 h-4"/> Tambah Manual
                          </button>
                          <label className="flex-1 py-2 bg-purple-50 text-purple-600 border border-dashed border-purple-300 rounded-lg text-xs font-bold hover:bg-purple-100 transition-colors flex items-center justify-center gap-2 cursor-pointer">
                            <FileSpreadsheet className="w-4 h-4"/> Impor Excel / CSV
                            <input type="file" accept=".csv,.txt,.xlsx,.xls" onChange={handleGuruFileImport} className="hidden" />
                          </label>
                        </div>
                        <button 
                          onClick={downloadExcelTemplate}
                          className="w-full py-2 bg-slate-50 text-slate-500 border border-slate-200 rounded-lg text-[10px] font-bold hover:bg-slate-100 transition-colors flex items-center justify-center gap-2"
                        >
                          <Download className="w-3 h-3"/> Unduh Template Excel
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2"><Settings className="w-4 h-4"/> Penanda Tangan</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                      <InputWrapper label="Nama Kepala Sekolah">
                        <input type="text" name="namaKepsek" value={formData.namaKepsek} onChange={handleInputChange} className="form-input"/>
                      </InputWrapper>
                      <InputWrapper label="NIP">
                        <input type="text" name="nipKepsek" value={formData.nipKepsek} onChange={handleInputChange} className="form-input"/>
                      </InputWrapper>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Tanda Tangan (Opsional)</label>
                      <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'ttdDigital')} className="file-input"/>
                    </div>
                  </div>
                </div>
              </div>

              {/* Preview Panel */}
              <div className="w-full lg:w-1/2 flex flex-col h-full sticky top-0">
                <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                  <h2 className="text-lg font-bold text-slate-800">Preview</h2>
                  <div className="flex gap-2">
                    <ActionButton onClick={simpanKeRiwayat} variant="emerald" icon={<Save className="w-4 h-4"/>} label="Simpan" />
                    <ActionButton onClick={handlePrint} variant="slate" icon={<Printer className="w-4 h-4"/>} label="Print" />
                    <ActionButton onClick={exportToWord} variant="blue" icon={<Download className="w-4 h-4"/>} label="Unduh" />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto bg-slate-400/20 p-4 md:p-8 rounded-xl shadow-inner flex justify-center">
                  <div id="printable-area" className="preview-page shadow-lg printable-content">
                    {/* KOP SURAT */}
                    <div className="flex items-start border-b-[3pt] border-black pb-3 mb-6" style={{ borderBottomStyle: 'double' }}>
                      <div className="w-[28mm] h-[28mm] flex-shrink-0 flex items-center justify-center">
                        {schoolData.logo ? (
                          <img src={schoolData.logo} alt="L" className="max-w-full max-h-full object-contain" />
                        ) : (
                          <div className="w-full h-full border border-dashed border-slate-300 rounded flex items-center justify-center text-[8pt] text-slate-400 no-print">Logo Kiri</div>
                        )}
                      </div>
                      <div className="flex-1 text-center px-4 pt-1">
                        {schoolData.namaInstansi.split('\n').map((line: string, i: number, arr: string[]) => (
                          <div key={i} className={`${i === arr.length - 1 ? 'font-bold text-[16pt]' : 'font-bold text-[13pt]'} uppercase leading-tight mb-1`}>{line}</div>
                        ))}
                        <div className="text-[10pt] mt-2 leading-snug font-serif">{schoolData.alamat}</div>
                        <div className="text-[9.5pt] leading-snug italic font-serif">{schoolData.kontak}</div>
                      </div>
                      <div className="w-[28mm] h-[28mm] flex-shrink-0 flex items-center justify-center">
                        {schoolData.logoKanan ? (
                          <img src={schoolData.logoKanan} alt="R" className="max-w-full max-h-full object-contain" />
                        ) : (
                          <div className="w-full h-full border border-dashed border-slate-300 rounded flex items-center justify-center text-[8pt] text-slate-400 no-print">Logo Kanan</div>
                        )}
                      </div>
                    </div>

                    {/* BODY SURAT */}
                    <div>
                      {isStandard && (
                        <>
                          <div className="flex justify-between mb-8">
                            <table className="w-auto border-collapse text-[11pt]">
                              <tbody>
                                <tr><td className="w-20 align-top">Nomor</td><td className="w-4 align-top">:</td><td>{formData.nomorSurat || '-'}</td></tr>
                                <tr><td className="align-top">Lampiran</td><td className="align-top">:</td><td>{formData.lampiran || '-'}</td></tr>
                                <tr><td className="align-top">Perihal</td><td className="align-top">:</td><td className="font-bold">{formData.perihal || '-'}</td></tr>
                              </tbody>
                            </table>
                            <div className="text-right text-[11pt]">{formData.tempatSurat}, {formData.tanggalSurat}</div>
                          </div>
                          <div className="mb-8 text-[11pt]">
                            <div>Yth. <strong>{formData.namaTujuan || '[Nama Tujuan]'}</strong></div>
                            <div>di</div>
                            <div className="whitespace-pre-wrap">{formData.alamatTujuan || '[Alamat]'}</div>
                          </div>
                        </>
                      )}

                      {isTugas && (
                        <div className="mb-8 text-center pt-2">
                          <div className="font-bold text-[14pt] underline uppercase tracking-wide">SURAT TUGAS</div>
                          <div className="text-[11pt]">Nomor: {formData.nomorSurat || '-'}</div>
                          <div className="text-right mt-2 text-[11pt]">{formData.tempatSurat}, {formData.tanggalSurat}</div>
                        </div>
                      )}

                      {isSK && (
                        <div className="mb-8 text-center pt-2">
                          <div className="font-bold text-[14pt] uppercase">KEPUTUSAN KEPALA {schoolData.namaInstansi.split('\n').pop()}</div>
                          <div className="text-[11pt]">Nomor: {formData.nomorSurat || '-'}</div>
                          <div className="mt-4 font-bold uppercase underline">TENTANG</div>
                          <div className="font-bold uppercase">{formData.perihal || '-'}</div>
                        </div>
                      )}

                      <div className="mb-6 text-justify text-[11pt]">
                        {formData.salamPembuka && !isSK && <div className="mb-4">{formData.salamPembuka}</div>}
                        <div className="whitespace-pre-wrap leading-relaxed">{formData.isiSurat}</div>
                      </div>

                      {formData.penutup && <div className="mb-12 text-justify text-[11pt] leading-relaxed">{formData.penutup}</div>}

                      {/* TANDA TANGAN */}
                      <div className="flex justify-end mt-12">
                        <div className="w-[300px] text-left text-[11pt]">
                          {!isStandard && (
                            <table className="mb-2 text-[10pt]">
                              <tbody>
                                <tr><td>Ditetapkan di</td><td className="px-2">:</td><td>{formData.tempatSurat}</td></tr>
                                <tr><td>Pada tanggal</td><td className="px-2">:</td><td>{formData.tanggalSurat}</td></tr>
                              </tbody>
                            </table>
                          )}
                          <div className="mb-1">Kepala Sekolah,</div>
                          <div className="h-24 relative my-2">
                            {formData.ttdDigital && <img src={formData.ttdDigital} className="h-full absolute left-0" style={{ mixBlendMode: 'multiply' }} />}
                          </div>
                          <div className="font-bold underline uppercase">{formData.namaKepsek}</div>
                          <div>NIP. {formData.nipKepsek}</div>
                        </div>
                      </div>
                    </div>

                    {/* HALAMAN LAMPIRAN (Hanya Tampil Jika Aktif) */}
                    {formData.hasLampiran && (
                      <div className="mt-20 border-t border-slate-200 pt-10" style={{ pageBreakBefore: 'always' }}>
                        <div className="mb-8">
                          <table className="text-[10pt] w-full mb-6">
                            <tbody>
                              <tr><td className="w-24">Lampiran</td><td className="w-4">:</td><td>{formData.jenisSurat}</td></tr>
                              <tr><td>Nomor</td><td>:</td><td>{formData.nomorSurat}</td></tr>
                              <tr><td>Tanggal</td><td>:</td><td>{formData.tanggalSurat}</td></tr>
                              <tr><td>Tentang</td><td>:</td><td className="font-bold">{formData.perihal}</td></tr>
                            </tbody>
                          </table>
                          
                          <div className="text-center font-bold text-[12pt] underline uppercase mb-6 pt-4">
                            DAFTAR NAMA GURU / PEGAWAI
                          </div>
                          
                          <table className="w-full border-collapse border border-black text-[10pt]">
                            <thead>
                              <tr className="bg-slate-100 italic font-bold">
                                <th className="border border-black p-2 text-center w-12 text-[10pt]">No</th>
                                <th className="border border-black p-2 text-left text-[10pt]">Nama Lengkap</th>
                                <th className="border border-black p-2 text-left text-[10pt]">NIP / No. Identitas</th>
                                <th className="border border-black p-2 text-left text-[10pt]">Jabatan / Peran</th>
                              </tr>
                            </thead>
                            <tbody>
                              {formData.daftarGuru.map((guru, index) => (
                                <tr key={guru.id}>
                                  <td className="border border-black p-2 text-center text-[10pt]">{index + 1}</td>
                                  <td className="border border-black p-2 text-[10pt]">{guru.nama || '-'}</td>
                                  <td className="border border-black p-2 text-[10pt]">{guru.nip || '-'}</td>
                                  <td className="border border-black p-2 text-[10pt]">{guru.jabatan || '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Tanda Tangan Lampiran */}
                        <div className="flex justify-end mt-12">
                          <div className="w-[300px] text-[11pt]">
                            <div className="mb-1">Kepala Sekolah,</div>
                            <div className="h-20 relative my-2">
                              {formData.ttdDigital && <img src={formData.ttdDigital} className="h-full absolute left-0" style={{ mixBlendMode: 'multiply' }} />}
                            </div>
                            <div className="font-bold underline uppercase">{formData.namaKepsek}</div>
                            <div>NIP. {formData.nipKepsek}</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'riwayat' && (
            <div className="p-8 max-w-6xl mx-auto">
              <div className="bg-white rounded-xl shadow p-6">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-slate-800"><History className="text-blue-600"/> Riwayat Surat</h2>
                {history.length === 0 ? (
                  <p className="text-center py-20 text-slate-400">Kosong</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 border-b">
                        <tr>
                          <th className="p-3">Tanggal</th>
                          <th className="p-3">Nomor</th>
                          <th className="p-3">Jenis</th>
                          <th className="p-3">Perihal & Tujuan</th>
                          <th className="p-3 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {history.map(h => (
                          <tr key={h.id} className="hover:bg-slate-50">
                            <td className="p-3">{new Date(h.tanggalBuat).toLocaleDateString()}</td>
                            <td className="p-3 font-mono text-xs">{h.nomorSurat}</td>
                            <td className="p-3"><span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs">{h.jenisSurat}</span></td>
                            <td className="p-3">
                              <div className="font-bold">{h.perihal}</div>
                              <div className="text-xs text-slate-400">{h.namaTujuan}</div>
                            </td>
                            <td className="p-3 text-right space-x-2">
                              <button onClick={() => loadDariRiwayat(h)} className="text-xs font-bold text-blue-600 hover:underline">Gunakan</button>
                              <button onClick={() => hapusRiwayat(h.id)} className="text-xs font-bold text-red-500 hover:underline">Hapus</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'users' && profile?.role === 'admin' && (
            <div className="p-6">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">Manajemen Akses Pengguna</h2>
                    <p className="text-sm text-slate-500">Kelola siapa yang dapat mengakses aplikasi ini.</p>
                  </div>
                  <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Admin: {ADMIN_EMAIL}
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-4 font-bold">Pengguna</th>
                        <th className="px-6 py-4 font-bold">Status</th>
                        <th className="px-6 py-4 font-bold">Waktu Request</th>
                        <th className="px-6 py-4 font-bold">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {userProfiles.map((p) => (
                        <tr key={p.uid} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <img src={p.photoURL} className="w-8 h-8 rounded-full" />
                              <div>
                                <div className="text-sm font-semibold text-slate-800">{p.displayName}</div>
                                <div className="text-xs text-slate-500">{p.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                              p.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                              p.status === 'rejected' ? 'bg-red-100 text-red-700' :
                              'bg-amber-100 text-amber-700'
                            }`}>
                              {p.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-500">
                            {p.requestedAt?.toDate ? p.requestedAt.toDate().toLocaleString('id-ID') : 'Baru saja'}
                          </td>
                          <td className="px-6 py-4">
                            {p.uid !== user?.uid && (
                              <div className="flex gap-2">
                                {p.status !== 'approved' && (
                                  <button 
                                    onClick={() => {
                                      updateUserStatus(p.uid, 'approved');
                                      setUserProfiles(prev => prev.map(up => up.uid === p.uid ? { ...up, status: 'approved' } : up));
                                    }}
                                    className="px-3 py-1 bg-emerald-600 text-white rounded text-xs font-bold hover:bg-emerald-700 transition-colors"
                                  >
                                    Setujui
                                  </button>
                                )}
                                {p.status !== 'rejected' && (
                                  <button 
                                    onClick={() => {
                                      updateUserStatus(p.uid, 'rejected');
                                      setUserProfiles(prev => prev.map(up => up.uid === p.uid ? { ...up, status: 'rejected' } : up));
                                    }}
                                    className="px-3 py-1 bg-slate-200 text-slate-700 rounded text-xs font-bold hover:bg-slate-300 transition-colors"
                                  >
                                    Blokir
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
              </div>
            </div>
          )}
          {activeTab === 'pengaturan' && (
            <div className="p-8 max-w-2xl mx-auto">
              <div className="bg-white rounded-xl shadow p-6 space-y-6">
                <h2 className="text-xl font-bold flex items-center gap-2"><Settings className="text-blue-600"/> Pengaturan KOP</h2>
                <InputWrapper label="Nama Instansi (Enter untuk baris baru)">
                  <textarea name="namaInstansi" value={schoolData.namaInstansi} onChange={handleSchoolDataChange} rows={3} className="form-input"></textarea>
                </InputWrapper>
                <InputWrapper label="Alamat">
                  <input name="alamat" value={schoolData.alamat} onChange={handleSchoolDataChange} className="form-input" />
                </InputWrapper>
                <InputWrapper label="Kontak">
                  <input name="kontak" value={schoolData.kontak} onChange={handleSchoolDataChange} className="form-input" />
                </InputWrapper>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-lg text-center relative group">
                    <label className="text-xs font-bold block mb-2">Logo Kiri</label>
                    {schoolData.logo && (
                      <div className="relative inline-block mb-2 group">
                        <img src={schoolData.logo} className="h-16 mx-auto object-contain" />
                        <button 
                          onClick={() => setSchoolData(prev => ({ ...prev, logo: '' }))}
                          className="absolute -top-2 -right-2 p-1 bg-red-100 text-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-200"
                          title="Hapus Logo"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                    <input type="file" onChange={e => handleImageUpload(e, 'logo', true)} className="text-xs w-full" />
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg text-center relative group">
                    <label className="text-xs font-bold block mb-2">Logo Kanan</label>
                    {schoolData.logoKanan && (
                      <div className="relative inline-block mb-2 group">
                        <img src={schoolData.logoKanan} className="h-16 mx-auto object-contain" />
                        <button 
                          onClick={() => setSchoolData(prev => ({ ...prev, logoKanan: '' }))}
                          className="absolute -top-2 -right-2 p-1 bg-red-100 text-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-200"
                          title="Hapus Logo"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                    <input type="file" onChange={e => handleImageUpload(e, 'logoKanan', true)} className="text-xs w-full" />
                  </div>
                </div>
                <button onClick={() => { alert('Tersimpan!'); setActiveTab('buat'); }} className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold shadow-lg hover:bg-blue-700 transition-colors">Simpan Perubahan</button>
              </div>
            </div>
          )}
        </main>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        .form-input { 
          width: 100%; 
          padding: 0.6rem 0.75rem; 
          border: 1px solid #e2e8f0; 
          border-radius: 0.5rem; 
          outline: none; 
          transition: all 0.2s; 
          font-size: 0.875rem; 
        }
        .form-input:focus { border-color: #3b82f6; ring: 2px rgba(59, 130, 246, 0.2); }
        .file-input { font-size: 0.75rem; color: #64748b; }
        .file-input::-webkit-file-upload-button { 
          padding: 0.5rem 1rem; 
          border-radius: 9999px; 
          border: 0; 
          font-weight: 600; 
          background: #eff6ff; 
          color: #1d4ed8; 
          cursor: pointer; 
          margin-right: 1rem;
        }
      `}} />
    </div>
  );
}

function SidebarButton({ active, onClick, icon, label }: any) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors font-medium ${active ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-100'}`}>
      {icon} {label}
    </button>
  );
}

function InputWrapper({ label, children }: any) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide ml-1">{label}</label>
      {children}
    </div>
  );
}

function ActionButton({ onClick, variant, icon, label }: any) {
  const colors: any = {
    emerald: 'bg-emerald-600 hover:bg-emerald-700',
    slate: 'bg-slate-700 hover:bg-slate-800',
    blue: 'bg-blue-600 hover:bg-blue-700'
  };
  return (
    <button onClick={onClick} className={`${colors[variant]} text-white px-3 py-1.5 rounded shadow text-xs font-bold flex items-center gap-2 transition-transform active:scale-95`}>
      {icon} {label}
    </button>
  );
}
