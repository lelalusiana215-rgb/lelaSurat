import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Unified Gemini Client Initialization
const getGeminiClient = (apiKey: string) => {
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Dynamic ENV variables for client-side
  app.get("/api/env", (req, res) => {
    res.json({
      supabaseUrl: process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "",
      supabaseAnonKey: process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || ""
    });
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // API route for checking custom API Key connection
  app.post("/api/check-api-key", async (req, res) => {
    try {
      const { apiKey } = req.body;
      const effectiveApiKey = (apiKey ? String(apiKey).trim() : "") || process.env.GEMINI_API_KEY;

      if (!effectiveApiKey) {
        return res.status(400).json({ error: "API Key tidak boleh kosong." });
      }

      console.log(`Checking API Key validity via @google/genai...`);
      const ai = getGeminiClient(effectiveApiKey);
      
      // Try a wider range of models for maximum compatibility across different account types
      const testModelNames = ["gemini-1.5-flash", "gemini-flash-latest", "gemini-1.5-pro", "gemini-pro", "gemini-3.5-flash"];
      let lastErr: any;
      let successModel = "";

      // Explicit check for Vertex AI key format or other common mismatches
      if (effectiveApiKey.startsWith("AQ.")) {
        return res.status(400).json({ 
          error: "API Key yang Anda masukkan (diawali 'AQ.') adalah format API Key Vertex AI (Google Cloud Platform). " + 
                 "Aplikasi ini memerlukan API Key dari Google AI Studio. " + 
                 "Silakan buat API Key baru di: https://aistudio.google.com/app/apikey"
        });
      }

      if (!effectiveApiKey.startsWith("AIza")) {
        console.warn("API Key does not start with AIza - this might be an invalid format for AI Studio.");
      }

      for (const modelName of testModelNames) {
        try {
          console.log(`Pengecekan API Key menggunakan model: ${modelName}`);
          const response = await ai.models.generateContent({
            model: modelName,
            contents: "OK",
            config: { maxOutputTokens: 5 }
          });
          
          if (response.text) {
            successModel = modelName;
            break;
          }
        } catch (err: any) {
          lastErr = err;
          console.warn(`Pengecekan model ${modelName} gagal: ${err.message}`);
          
          // If the error is 401 (Unauthorized) or 400 (Invalid Key), no need to try other models
          if (err.status === 400 || err.status === 401 || err.message?.includes("API_KEY_INVALID")) {
            break;
          }
        }
      }

      if (successModel) {
        return res.json({ 
          success: true, 
          message: `Koneksi berhasil! API Key Anda aktif (diverifikasi via ${successModel}).` 
        });
      }

      throw lastErr || new Error("Gagal memverifikasi API Key.");
    } catch (error: any) {
      console.error("Check API Key connection failed DETAIL:", error);
      
      let errMsg = "Gagal menghubungi Gemini API.";
      
      if (error.status === 404 || error.message?.includes("404") || error.message?.includes("not found")) {
        errMsg = "Model tidak ditemukan (404). Ini biasanya terjadi jika API Key salah atau jika Anda menggunakan API Key Vertex AI (Google Cloud) alih-alih Google AI Studio key. Pastikan Anda menyalin API Key dari aistudio.google.com.";
      } else if (error.status === 400 || error.message?.includes("API_KEY_INVALID") || error.message?.includes("invalid")) {
        errMsg = "API Key tidak valid. Harap periksa apakah Key sudah benar (tanpa spasi/tanda kutip).";
      } else if (error.status === 429 || error.message?.includes("429")) {
        errMsg = "Kuota API Key Anda habis atau limit per menit tercapai.";
      } else if (error.message) {
        errMsg = `Error: ${error.message}`;
      }
      
      return res.status(400).json({ error: errMsg });
    }
  });

  // API route for Gemini generation
  app.post("/api/generate-letter", async (req, res) => {
    try {
      const { jenisSurat, perihal, namaTujuan, apiKey: clientApiKey } = req.body;
      
      const effectiveApiKey = (clientApiKey ? String(clientApiKey).trim() : "") || process.env.GEMINI_API_KEY;

      if (!effectiveApiKey) {
        return res.status(400).json({ error: "GEMINI_API_KEY is not configured" });
      }

      const ai = getGeminiClient(effectiveApiKey);
      
      const systemPrompt = `Anda adalah asisten Tata Usaha sekolah yang profesional. Tugas Anda adalah membantu menyusun ISI POKOK surat kedinasan.

Instruksi sangat penting berdasarkan Jenis Surat:
1. Jika Jenis Surat adalah "Surat Keputusan" atau "SK Pembagian Tugas (SKPBM)", Anda WAJIB menyusunnya dengan struktur formal lengkap:
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
5. Gunakan bahasa Indonesia baku dan tata bahasa resmi administrasi pemerintahan/sekolah yang elegan and profesional.
6. Jangan gunakan format markdown (seperti \`\`\`).`;

      const userQuery = `Jenis Surat: ${jenisSurat}\nPerihal / Tentang: ${perihal}\nTujuan Surat: ${namaTujuan || 'Pihak Terkait'}`;

      // Use a broad list of models for compatibility
      const modelsToTry = ["gemini-1.5-flash", "gemini-flash-latest", "gemini-1.5-pro", "gemini-pro", "gemini-3.5-flash", "gemini-3.1-pro-preview"];
      let responseText = "";
      let lastError;

      for (const modelName of modelsToTry) {
        let retries = 2;
        while (retries > 0) {
          try {
            console.log(`Attempting generation with ${modelName}...`);
            const response = await ai.models.generateContent({
              model: modelName,
              contents: userQuery,
              config: {
                systemInstruction: systemPrompt
              }
            });
            
            responseText = response.text || "";
            
            if (responseText) break; 
            throw new Error("Empty response from AI");
          } catch (err: any) {
            console.warn(`Error with ${modelName}:`, err.message);
            lastError = err;
            const isRetryable = err.status === 503 || err.status === 429 || err.message?.includes('503') || err.message?.includes('429');

            if (isRetryable) {
              retries--;
              if (retries > 0) {
                await new Promise(res => setTimeout(res, 2000));
                continue;
              }
            }
            break; 
          }
        }
        if (responseText) break;
      }

      if (!responseText) {
        let errMsg = "Gagal menyusun surat otomatis.";
        if (lastError?.status === 404 || lastError?.message?.includes("404")) {
          errMsg = "Model AI tidak ditemukan. Pastikan API Key Anda benar dan dari Google AI Studio.";
        } else if (lastError?.status === 429) {
          errMsg = "Kuota harian API telah habis atau limit tercapai.";
        }
        return res.status(400).json({ error: errMsg });
      }

      res.json({ text: responseText.replace(/```[a-z]*\n?/gi, '').trim() });

    } catch (error: any) {
      console.error("Gemini API Route Error:", error);
      res.status(500).json({ error: error.message || "Internal Server Error" });
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
