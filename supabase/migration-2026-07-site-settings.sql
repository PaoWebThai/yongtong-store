-- =====================================================================
--  Migration: ตาราง site_settings — เก็บค่าตั้งค่าหน้าร้าน (เช่น สไลด์โปรโมชั่น)
--  วันที่: 2026-07
--
--  วิธีใช้:
--    1. เปิด Supabase Dashboard → SQL Editor → New query
--    2. Copy ทั้งไฟล์นี้ → Paste → Run
--    3. ปลอดภัยถ้ารันซ้ำ (ใช้ if not exists / drop policy if exists)
-- =====================================================================

-- ค่าตั้งค่าแบบ key/value (JSONB) — 1 แถวต่อ 1 การตั้งค่า
--   ตัวอย่าง: key = 'promo_slides',
--             value = { "slides": [ {"src":"...","title":"...","sub":"..."} ] }
create table if not exists public.site_settings (
  key         text        primary key,
  value       jsonb       not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);

alter table public.site_settings enable row level security;

-- อ่านได้ทุกคน (หน้าร้านต้องแสดงให้ลูกค้าเห็น) · เขียนได้เฉพาะ admin ที่ login
drop policy if exists "site_settings read public" on public.site_settings;
drop policy if exists "site_settings write admin" on public.site_settings;
drop policy if exists "site_settings update admin" on public.site_settings;

create policy "site_settings read public" on public.site_settings
  for select using (true);

create policy "site_settings write admin" on public.site_settings
  for insert with check (auth.role() = 'authenticated');

create policy "site_settings update admin" on public.site_settings
  for update using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- ตรวจสอบ:
--   select * from public.site_settings;
