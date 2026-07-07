-- =====================================================================
--  Migration: เพิ่มตัวเลือกสินค้า (variants) + เนื้อหาละเอียด (detail_blocks)
--  วันที่: 2026-07
--
--  วิธีใช้:
--    1. เปิด Supabase Dashboard → SQL Editor → New query
--    2. Copy ทั้งไฟล์นี้ → Paste → Run
--    3. ปลอดภัยถ้ารันซ้ำ (ใช้ if not exists)
-- =====================================================================

-- ตัวเลือกสินค้าแบบ matrix (สี × ขนาด × ประเภท ฯลฯ ราคาต่อคู่ผสม)
--   รูปแบบ: {
--     "options": [ {"name":"ขนาด","choices":["7 นิ้ว","9 นิ้ว"]}, {"name":"สี","choices":["ดำ","ทอง"]} ],
--     "matrix": { "7 นิ้ว|ดำ": {"price":890,"oldPrice":null}, ... }
--   }
alter table public.products
  add column if not exists variants jsonb not null default '{}'::jsonb;

-- เนื้อหารายละเอียดแบบบล็อก (ข้อความ / รูปภาพ / ตาราง)
--   รูปแบบ: [ {"type":"text","value":"..."},
--            {"type":"image","url":"...","caption":"..."},
--            {"type":"table","rows":[["หัว1","หัว2"],["a","b"]]} ]
alter table public.products
  add column if not exists detail_blocks jsonb not null default '[]'::jsonb;

-- ตรวจสอบ:
--   select column_name from information_schema.columns
--   where table_name = 'products' and column_name in ('variants','detail_blocks');
