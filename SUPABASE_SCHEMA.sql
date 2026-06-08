-- Run this SQL in your Supabase SQL Editor to create the required tables

-- Table for User Permissions
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  status text DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Everyone can insert their own profile during signup
CREATE POLICY "Users can insert their own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);
-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
-- Admin (lelalusiana215@gmail.com) can do anything
CREATE POLICY "Admin full access profiles" ON user_profiles USING (auth.jwt() ->> 'email' = 'lelalusiana215@gmail.com');

-- Table for School Data / KOP Surat
CREATE TABLE IF NOT EXISTS school_data (
  id integer PRIMARY KEY DEFAULT 1,
  nama_instansi text,
  alamat text,
  kontak text,
  logo text,
  logo_kanan text,
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE school_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view school_data" ON school_data FOR SELECT USING (true);
CREATE POLICY "Admin manage school_data" ON school_data USING (auth.jwt() ->> 'email' = 'lelalusiana215@gmail.com');

-- Table for History Surat
CREATE TABLE IF NOT EXISTS surat_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  jenis_surat text,
  nomor_surat text,
  perihal text,
  nama_tujuan text,
  tanggal_buat timestamp with time zone DEFAULT now(),
  form_data jsonb
);

ALTER TABLE surat_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own history" ON surat_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert history" ON surat_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admin view all history" ON surat_history FOR SELECT USING (auth.jwt() ->> 'email' = 'lelalusiana215@gmail.com');
