import express from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
  app.use(express.json());

  // Dynamic ENV variables for client-side
  app.get("/api/env", (req, res) => {
    res.json({
      supabaseUrl: process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
      supabaseAnonKey: process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
    });
  });

const ai = new GoogleGenAI(process.env.GEMINI_API_KEY!);

app.post('/api/generate-letter', async (req, res) => {
  try {
    const { jenisSurat, perihal, namaTujuan } = req.body;
    
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "GEMINI_API_KEY is not configured" });
    }

    const systemPrompt = `Anda adalah asisten Tata Usaha sekolah yang profesional. Tugas Anda adalah membantu menyusun ISI POKOK surat kedinasan.

Instruksi sangat penting berdasarkan Jenis Surat:
1. Jika Jenis Surat adalah "Surat Keputusan", Anda WAJIB menyusunnya dengan struktur formal lengkap:
   - Menimbang : (poin-poin pertimbangan a, b, c...)
   - Mengingat : (landasan hukum 1, 2, 3...)
   - MEMUTUSKAN
   - Menetapkan : (poin-poin keputusan PERTAMA, KEDUA, KETIGA, dst...)
2. Jika Jenis Surat adalah surat umum (Undangan, Tugas, dsb), tuliskan isi paragraf utamanya saja.
3. JANGAN sertakan elemen yang sudah ada di template: TANGGAL surat, KOP surat, SALAM PEMBUKA (seperti "Dengan hormat,"), SALAM PENUTUP, ataupun TEMPAT TANDA TANGAN.
4. Jika surat membutuhkan detail waktu/tempat acara, berikan format kosong bersusun ke bawah seperti:
   Hari, Tanggal : ...
   Waktu : ...
   Tempat : ...
5. Gunakan bahasa Indonesia baku dan tata bahasa resmi administrasi pemerintahan/sekolah yang elegan dan profesional.
6. Jangan gunakan format markdown (seperti \`\`\`).`;

    const userQuery = `Jenis Surat: ${jenisSurat}\nPerihal / Tentang: ${perihal}\nTujuan Surat: ${namaTujuan || 'Pihak Terkait'}`;

    const modelsToTry = ["gemini-1.5-flash", "gemini-1.5-pro"];
    let responseText = "";
    let lastError;

    for (const modelName of modelsToTry) {
      let retries = 2;
      while (retries > 0) {
        try {
          const model = ai.getGenerativeModel({ 
            model: modelName,
            systemInstruction: systemPrompt
          });
          
          const result = await model.generateContent(userQuery);
          const response = await result.response;
          responseText = response.text();
          break;
        } catch (err) {
          lastError = err;
          const isRetryable = err.message?.includes('503') || err.status === 503;
          const isQuotaExceeded = err.message?.includes('429') || err.status === 429;

          if (isRetryable || isQuotaExceeded) {
            retries--;
            if (retries > 0) {
              await new Promise(resolve => setTimeout(resolve, 2000));
              continue;
            }
          } else {
            throw err;
          }
          break;
        }
      }
      if (responseText) break;
    }

    if (!responseText) {
      if (lastError?.status === 429 || lastError?.message?.includes('429')) {
        return res.status(429).json({ 
          error: "Kuota harian Gemini API telah habis atau terlalu banyak permintaan. Silakan coba lagi besok atau beberapa saat lagi." 
        });
      }
      throw lastError || new Error("Gagal menyusun surat otomatis setelah beberapa kali percobaan.");
    }

    res.json({ text: responseText.replace(/```[a-z]*\n?/gi, '').trim() });

  } catch (error) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ error: error.message || "Failed to generate content" });
  }
});

export default app;
