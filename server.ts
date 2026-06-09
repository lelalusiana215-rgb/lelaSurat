import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Dynamic ENV variables for client-side
  app.get("/api/env", (req, res) => {
    console.log("Health check: /api/env called");
    res.json({
      supabaseUrl: process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "",
      supabaseAnonKey: process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || ""
    });
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // API route for Gemini generation
  app.post("/api/generate-letter", async (req, res) => {
    try {
      const { jenisSurat, perihal, namaTujuan } = req.body;
      
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "GEMINI_API_KEY is not configured" });
      }

      const genAI = new GoogleGenAI(process.env.GEMINI_API_KEY!);
      
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

      // Retry mechanism for 503 and 429 errors with model fallbacks
      const modelsToTry = ["gemini-1.5-flash", "gemini-1.5-pro"];
      let responseText = "";
      let lastError;

      for (const modelName of modelsToTry) {
        let retries = 2;
        while (retries > 0) {
          try {
            const model = genAI.getGenerativeModel({ 
              model: modelName,
              systemInstruction: systemPrompt
            });
            
            const result = await model.generateContent(userQuery);
            const response = await result.response;
            responseText = response.text();
            break; // Success!
          } catch (err: any) {
            lastError = err;
            const isRetryable = err.message?.includes('503') || err.status === 503;
            const isQuotaExceeded = err.message?.includes('429') || err.status === 429;

            if (isRetryable || isQuotaExceeded) {
              retries--;
              if (retries > 0) {
                // Wait briefly before retry
                await new Promise(res => setTimeout(res, 2000));
                continue;
              }
            } else {
              throw err; // Non-retryable error
            }
            break; // Move to next model
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

    } catch (error: any) {
      console.error("Gemini API Error:", error);
      res.status(500).json({ error: error.message || "Failed to generate content" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
