-- Run this SQL in your Supabase SQL Editor to create the required tables

-- Table for School Data / KOP Surat
CREATE TABLE school_data (
  id integer PRIMARY KEY DEFAULT 1,
  nama_instansi text,
  alamat text,
  kontak text,
  logo text,
  logo_kanan text,
  updated_at timestamp with time zone DEFAULT now()
);

-- Table for History Surat
CREATE TABLE surat_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  jenis_surat text,
  nomor_surat text,
  perihal text,
  nama_tujuan text,
  tanggal_buat timestamp with time zone,
  form_data jsonb
);

-- Enable Row Level Security (Optional, but recommended)
-- For a simple single-user or internal app without authentication, 
-- you can set these policies to allow all operations anon.

ALTER TABLE school_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anonymous read school_data" ON school_data FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert school_data" ON school_data FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update school_data" ON school_data FOR UPDATE USING (true);

ALTER TABLE surat_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anonymous read surat_history" ON surat_history FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert surat_history" ON surat_history FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update surat_history" ON surat_history FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete surat_history" ON surat_history FOR DELETE USING (true);
