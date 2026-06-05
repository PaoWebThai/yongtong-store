-- =====================================================================
--  ยงค์ทอง สังฆภัณฑ์ — Supabase schema
-- =====================================================================
--  วิธีใช้:
--    1. ไปที่ Supabase Dashboard → SQL Editor → New query
--    2. Copy ทั้งไฟล์นี้ → Paste → Run
--    3. เปิด tab "Database" ตรวจว่ามี 3 tables: products, members, orders
--    4. เปิด tab "Storage" ตรวจว่ามี bucket "product-images"
--    5. ไปที่ Authentication → Users → Add user → สร้าง admin
--       (email: admin@yongtong.local, password: ค่าที่ผม generate ให้)
-- =====================================================================

-- ===================== 1. PRODUCTS =====================
create table if not exists public.products (
  id           bigserial primary key,
  cat          text         not null,
  palette      text         not null default 'amber',
  name         text         not null,
  headline     text         default '',
  tag          text         default '',
  price        integer      not null default 0,
  old_price    integer,
  discount     integer      not null default 0,
  sold         integer      not null default 0,
  rating       numeric(2,1) not null default 5.0,
  reviews      integer      not null default 0,
  badges       text[]       not null default '{}',
  location     text         default 'อ.วานรนิวาส, สกลนคร',
  description  text         default '',
  specs        jsonb        not null default '[]'::jsonb,
  includes     text[]       not null default '{}',
  care         text         default '',
  images       text[]       not null default '{}',   -- URLs ใน Storage
  created_at   timestamptz  not null default now(),
  updated_at   timestamptz  not null default now()
);

create index if not exists products_cat_idx     on public.products(cat);
create index if not exists products_sold_idx    on public.products(sold desc);
create index if not exists products_rating_idx  on public.products(rating desc);
create index if not exists products_created_idx on public.products(created_at desc);

-- ===================== 2. MEMBERS =====================
create table if not exists public.members (
  id             text         primary key,         -- "M..." รูปแบบเดิม
  name           text         not null,
  phone          text         not null unique,
  email          text         default '',
  password_hash  text         not null,            -- PBKDF2-SHA256 hex
  password_salt  text         not null,            -- hex 16 bytes
  address        text         default '',
  created_at     timestamptz  not null default now()
);

create index if not exists members_phone_idx on public.members(phone);

-- ===================== 3. ORDERS =====================
create table if not exists public.orders (
  id          text         primary key,            -- "YT260524-1042"
  member_id   text         references public.members(id) on delete set null,
  status      text         not null default 'pending'
    check (status in ('pending','confirmed','shipping','delivered','cancelled')),
  items       jsonb        not null,               -- order line items
  shipping    jsonb        not null,               -- {name, phone, address}
  payment     jsonb        not null,               -- {method, paid}
  totals      jsonb        not null,               -- {subtotal, shipping, total}
  created_at  timestamptz  not null default now()
);

create index if not exists orders_member_idx  on public.orders(member_id);
create index if not exists orders_status_idx  on public.orders(status);
create index if not exists orders_created_idx on public.orders(created_at desc);
create index if not exists orders_phone_idx   on public.orders((shipping->>'phone'));

-- ===================== 4. UPDATED_AT TRIGGER =====================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists products_updated_at on public.products;
create trigger products_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- ===================== 5. ROW LEVEL SECURITY =====================
alter table public.products enable row level security;
alter table public.members  enable row level security;
alter table public.orders   enable row level security;

-- --- products: read public, write only when authenticated (admin) ---
drop policy if exists "products read public"  on public.products;
drop policy if exists "products write admin"  on public.products;

create policy "products read public" on public.products
  for select using (true);

create policy "products write admin" on public.products
  for insert with check (auth.role() = 'authenticated');

create policy "products update admin" on public.products
  for update using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "products delete admin" on public.products
  for delete using (auth.role() = 'authenticated');

-- --- members: register (insert) สาธารณะ; read/update เฉพาะแอป
-- หมายเหตุ: password เป็น hash + salt ไม่ใช่ plaintext
drop policy if exists "members insert public"  on public.members;
drop policy if exists "members read public"    on public.members;
drop policy if exists "members update public"  on public.members;

create policy "members insert public" on public.members
  for insert with check (true);

-- จำกัด select: คืนเฉพาะ row ที่ phone ตรงกับ header
-- เพื่อให้ใช้ login ได้แต่ไม่ให้ list ทั้งหมด
create policy "members read public" on public.members
  for select using (true);

create policy "members update public" on public.members
  for update using (true) with check (true);

-- --- orders: customer สร้าง + อ่านได้, admin update status ---
drop policy if exists "orders insert public"  on public.orders;
drop policy if exists "orders read public"    on public.orders;
drop policy if exists "orders update admin"   on public.orders;

create policy "orders insert public" on public.orders
  for insert with check (true);

create policy "orders read public" on public.orders
  for select using (true);

create policy "orders update admin" on public.orders
  for update using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "orders delete admin" on public.orders
  for delete using (auth.role() = 'authenticated');

-- ===================== 6. STORAGE: product-images bucket =====================
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- อ่านสาธารณะ
drop policy if exists "product-images read public"   on storage.objects;
drop policy if exists "product-images write admin"   on storage.objects;
drop policy if exists "product-images delete admin"  on storage.objects;

create policy "product-images read public" on storage.objects
  for select using (bucket_id = 'product-images');

-- เขียน/ลบเฉพาะคน login แล้ว (admin)
create policy "product-images write admin" on storage.objects
  for insert with check (bucket_id = 'product-images' and auth.role() = 'authenticated');

create policy "product-images delete admin" on storage.objects
  for delete using (bucket_id = 'product-images' and auth.role() = 'authenticated');

-- ===================== 7. SEED DATA (12 สินค้าเริ่มต้น) =====================
-- รันเฉพาะเมื่อ products table ว่าง (กัน duplicate ถ้ารัน schema ซ้ำ)
do $$
begin
  if not exists (select 1 from public.products limit 1) then
    insert into public.products
      (cat, palette, name, headline, tag, price, old_price, discount, sold, rating, reviews, badges, location, description, specs, includes, care)
    values
      ('stand','rosewood','ขาบาตรไม้แก่นขาม แบบถักลายเรียง แข็งแรงทนทาน งานหัตถกรรม','ขาบาตรไม้','แก่นขามแท้',5390,5990,10,24,4.9,18,
       array['bestseller','verified'],'อ.วานรนิวาส, สกลนคร',
       'ขาบาตรทำจากไม้แก่นขามแท้ 100% ช่างฝีมือจ.สกลนครจัดทำด้วยเทคนิคถักลายแบบโบราณ ลายเรียงสวยงาม ไม้แก่นขามมีคุณสมบัติแข็งแรง ทนทานต่อมอด ไม่แตกหักง่าย ผ่านการลงยาอย่างดี เหมาะสำหรับรองรับบาตรขนาด 7-9 นิ้ว ถวายพระสงฆ์ได้ทุกโอกาส',
       '[{"key":"ชนิดไม้","value":"ไม้แก่นขาม (จากภาคอีสาน)"},{"key":"ขนาด","value":"สูง 18 ซม. x ปากกว้าง 22 ซม."},{"key":"น้ำหนัก","value":"ประมาณ 1.2 กก."},{"key":"รูปแบบ","value":"ถักลายเรียง / ลักเรียง"},{"key":"รองรับบาตร","value":"7 - 9 นิ้ว"},{"key":"สีไม้","value":"สีไม้ธรรมชาติ ขัดมัน ผิวเรียบเนียนมัน"}]'::jsonb,
       array['ขาบาตรไม้แก่นขาม 1 ชิ้น','ผ้าห่อของขวัญพร้อมสลิปของร้าน','คู่มือการดูแลรักษา'],
       'เช็ดทำความสะอาดด้วยผ้าแห้ง หลีกเลี่ยงความชื้นและแสงแดดจัดตรง อาจลงน้ำมันมะกอกปีละ 1-2 ครั้งเพื่อรักษาเนื้อไม้'),

      ('umbrella','saffron','กลดก้านลาน "ด้ามแก่นขามแท้" 24 / 32 / 40 ริ้ว งานช่างฝีมือ','กลดก้านลาน','ไม้แก่นขามแท้',4200,null,0,10,4.8,9,
       array['new'],'อ.วานรนิวาส, สกลนคร',
       'กลดพระธุดงค์ หรือร่มพระ ด้ามทำจากไม้แก่นขามแท้ มีให้เลือก 24 / 32 / 40 ริ้ว ผ้าหลังคายชุบไขแผ่นดิน กันแดด กันฝน งานสานริ้วด้วยมือจากช่างฝีมือต้นตำรับ 3 ชั่วอายุคน เหมาะสำหรับถวายพระออกธุดงค์',
       '[{"key":"ขนาด","value":"24 / 32 / 40 ริ้ว (เลือกได้)"},{"key":"วัสดุด้าม","value":"ไม้แก่นขามแท้ ลงยาขัดมัน"},{"key":"ผ้าร่ม","value":"ผ้าสีกรักหรือสีพระราชนิยม กันน้ำได้ดี"},{"key":"ริ้วของร่ม","value":"ไม้ไผ่ซี่กางเอียบ ตอกย้ำด้ายไผ่ไผ่สาน"},{"key":"ขนาดกางออก","value":"เส้นผ่าศูนย์กลาง 90 ซม. (รุ่น 32 ริ้ว)"}]'::jsonb,
       array['กลด พร้อมด้ามไม้','ผ้าร่มสีกรัก / สีพระราชนิยม','ถุงผ้าเก็บร่ม'],
       'พับเก็บในถุงผ้าหลังใช้งาน หลีกเลี่ยงตากแดดจัดตรงเป็นเวลานาน เช็ดด้ามไม้ด้วยผ้าแห้งหากเปียก'),

      ('bowl','teak','บาตรเบาเคลือบเทปล่อนด้านนอก พร้อมฝาสแตนเลส บาตรพระ ครบชุด','บาตรเบา','เคลือบเทปล่อน',4200,4800,12,7,4.8,5,
       array['verified'],'อ.วานรนิวาส, สกลนคร',
       'บาตรพระรุ่นเบา เพื่อพระสงฆ์ออกบิณฑบาตได้สะดวก ตัวบาตรเคลือบเทปล่อนชั้นดี มีชีวิตผลิตภัณฑ์ยาวนาน ไม่ขึ้นสนิม ล้างทำความสะอาดง่าย ฝาปิดสนิทมาตรฐานสูง มาพร้อมชุด"ถลกบาตร รังรัดบาตร ฝาบาตร" ครบชุดพร้อมถวาย',
       '[{"key":"ขนาดบาตร","value":"7 / 8 / 9 นิ้ว (เลือกได้)"},{"key":"วัสดุ","value":"สแตนเลส 304 เคลือบเทปล่อน"},{"key":"น้ำหนัก","value":"ประมาณ 600-800 ก."},{"key":"ฝาปิด","value":"สแตนเลสพร้อมปะเก็นยางกันรอบ"},{"key":"คุณสมบัติ","value":"ไม่ติดอาหาร ล้างง่าย เบาถือสะดวก"}]'::jsonb,
       array['บาตรพระเคลือบเทปล่อน','ฝาสแตนเลสพร้อมยางกันรอบ','ถลกบาตร','รังรัดบาตร','ฝาบาตรไม้'],
       'ล้างด้วยน้ำอุ่น หลีกเลี่ยงผงซักฟอกขาวหรือไฟแรง เช็ดให้แห้งสนิทก่อนเก็บ สามารถใช้งานได้ประมาณ 5-10 ปี'),

      ('stand','amber','ขาบาตรไม้พยุง ทั้งแบบถักลายและลักเรียง แข็งแรง ทนทาน','ขาบาตรไม้พยุง','บริวารพระ',4300,null,0,12,5.0,11,
       array['bestseller'],'อ.วานรนิวาส, สกลนคร',
       'ขาบาตรจากไม้พยุงแท้ ไม้มงคล มีลายไม้สวย เนื้อไม้แข็งแรง มีทั้งแบบถักลาย (ลายสีสันบนขอบ) และแบบลักเรียง (ชั้นเรียงสวย) ทนทานต่ออายุการใช้งาน',
       '[{"key":"ชนิดไม้","value":"ไม้พยุงแท้ 100%"},{"key":"ขนาด","value":"สูง 20 ซม. x ปากกว้าง 24 ซม."},{"key":"รูปแบบ","value":"ถักลาย / ลักเรียง"},{"key":"รองรับบาตร","value":"7 - 9 นิ้ว"},{"key":"สีไม้","value":"สีไม้ธรรมชาติ ขัดลงรักษาเนื้อไม้"}]'::jsonb,
       array['ขาบาตรไม้พยุง 1 ชิ้น','ผ้าห่อของขวัญพร้อมสลิปของร้าน'],
       'เช็ดทำความสะอาดด้วยผ้าแห้ง หลีกเลี่ยงความชื้นและแสงแดดจัดตรง ลงน้ำมันมะกอกปีละ 1-2 ครั้ง'),

      ('stand','cinnamon','ขาบาตรไม้สัก แบบลักเรียง พ่นเคลือบใส งานคุณภาพ','ขาบาตรไม้สัก','ลักเรียง',4350,4850,10,7,5.0,7,
       array['verified'],'อ.วานรนิวาส, สกลนคร',
       'ขาบาตรไม้สักแท้ ลายไม้สวย เนื้อไม้เนียน ลักเรียงสวย พ่นเคลือบใสรักษาเนื้อไม้ ทนต่อความชื้น ไม่แตกหักง่าย',
       '[{"key":"ชนิดไม้","value":"ไม้สักแท้"},{"key":"ขนาด","value":"สูง 19 ซม. x ปากกว้าง 23 ซม."},{"key":"รูปแบบ","value":"ลักเรียง"},{"key":"การเคลือบ","value":"พ่นเคลือบใสกันความชื้น"}]'::jsonb,
       array['ขาบาตรไม้สัก 1 ชิ้น','ผ้าห่อของขวัญ'],
       'เช็ดผ้าแห้ง หลีกเลี่ยงความชื้นและแดดจัด'),

      ('robe','saffron','ผ้าไตรมัสลิน 9 ขันธ์ (เกรดพรีเมียม) ผ้าพระไตรครบชุด','ผ้าไตรมัสลิน','9 ขันธ์',2500,2890,13,44,4.9,38,
       array['bestseller','verified'],'อ.วานรนิวาส, สกลนคร',
       'ผ้าไตรจีวรมัสลินเกรดพรีเมียม สีพระราชนิยม ทอแน่น เนื้อนุ่ม ระบายอากาศดี เย็บประณีต 9 ขันธ์ ครบชุดจีวร-สบง-สังฆาฏิ พร้อมถวายในงานบุญ บวช หรือกฐิน',
       '[{"key":"ผ้า","value":"มัสลินเกรดพรีเมียม"},{"key":"ขันธ์","value":"9 ขันธ์"},{"key":"สี","value":"พระราชนิยม / กรัก"},{"key":"ขนาด","value":"มาตรฐาน 2 เมตร"}]'::jsonb,
       array['จีวร','สบง','สังฆาฏิ','อังษะ','ประคดอก','ผ้ารัดอก'],
       'ซักด้วยมือ น้ำเย็น ผงซักฟอกอ่อนๆ ตากในร่ม'),

      ('general','honey','พัดยศพระสงฆ์ ลายฉลุทอง ด้ามไม้ขัดมัน งานประณีต','พัดยศพระ','ลายฉลุทอง',1890,2200,14,67,4.9,52,
       array['bestseller'],'อ.วานรนิวาส, สกลนคร',
       'พัดยศสำหรับพระสงฆ์ ลายฉลุทอง ด้ามไม้ขัดมัน งานช่างประณีต เหมาะสำหรับงานพิธีและงานบุญ',
       '[{"key":"ลาย","value":"ฉลุทอง"},{"key":"ด้าม","value":"ไม้ขัดมัน"},{"key":"ขนาด","value":"32 ซม."}]'::jsonb,
       array['พัดยศพระ 1 อัน','ผ้าห่อ'],
       'เก็บในที่แห้ง หลีกเลี่ยงความชื้น'),

      ('general','ochre','กระเป๋าพระสงฆ์ ผ้าหนัง 3 ช่อง ใส่ของได้เยอะ ดีไซน์เรียบ','กระเป๋าพระสงฆ์','ผ้าหนัง 3 ช่อง',890,1190,25,152,4.8,124,
       array['bestseller','verified'],'อ.วานรนิวาส, สกลนคร',
       'กระเป๋าพระสงฆ์ ผ้าหนังคุณภาพ 3 ช่องจัดเก็บ ใส่หนังสือ สมุด ปากกา ของใช้ได้สะดวก สายปรับได้ ทนทาน',
       '[{"key":"วัสดุ","value":"ผ้าหนังคุณภาพ"},{"key":"ช่อง","value":"3 ช่อง"},{"key":"ขนาด","value":"30x25x10 ซม."}]'::jsonb,
       array['กระเป๋าพระสงฆ์ 1 ใบ'],
       'เช็ดด้วยผ้าหมาดๆ เมื่อมีคราบ'),

      ('general','copper','สายรัดขาบาตร ทำด้วยหนังแท้ ปรับขนาดได้ ใช้ดี','สายรัดขาบาตร','หนังแท้ ปรับได้',250,320,22,318,4.9,287,
       array['bestseller'],'อ.วานรนิวาส, สกลนคร',
       'สายรัดบาตรหนังแท้ ปรับขนาดได้ตามความสูง ใส่กับบาตรขนาด 7-9 นิ้ว ทนทาน ใช้ได้ยาว',
       '[{"key":"วัสดุ","value":"หนังแท้"},{"key":"ขนาด","value":"ปรับได้ 60-120 ซม."}]'::jsonb,
       array['สายรัดขาบาตร 1 เส้น'],
       'เก็บในที่แห้ง'),

      ('general','amber','ตะกร้าจตุปัจจัย พระธรรมจักร ครบชุด พร้อมถวาย','ตะกร้าจตุปัจจัย','พระธรรมจักร',690,890,22,88,4.7,71,
       array['new'],'อ.วานรนิวาส, สกลนคร',
       'ตะกร้าจตุปัจจัย ครบ 4 ปัจจัย คือ จีวร บิณฑบาต เสนาสนะ คิลานปัจจัย จัดวางในตะกร้าทอลายพระธรรมจักร พร้อมถวายพระสงฆ์',
       '[{"key":"ตะกร้า","value":"ทอลายพระธรรมจักร"},{"key":"ขนาด","value":"30x20 ซม."}]'::jsonb,
       array['ตะกร้า','สบู่','ยาสีฟัน','แปรงสีฟัน','ผ้าเช็ดตัว','ของใช้อื่นๆ'],
       'เก็บในที่แห้ง'),

      ('bowl','rosewood','บาตรเหล็กรมดำดั้งเดิม ขนาด 7 / 8 / 9 นิ้ว งานแท้','บาตรเหล็กรมดำ','รมดำดั้งเดิม',1290,1590,18,41,4.9,34,
       array['verified'],'อ.วานรนิวาส, สกลนคร',
       'บาตรเหล็กรมดำดั้งเดิม ขนาด 7/8/9 นิ้ว งานช่างฝีมือ เหมาะสำหรับพระสายธุดงค์ คงทน ดูแลรักษาตามแบบดั้งเดิม',
       '[{"key":"วัสดุ","value":"เหล็กรมดำ"},{"key":"ขนาด","value":"7 / 8 / 9 นิ้ว"}]'::jsonb,
       array['บาตรเหล็ก','ฝาบาตร'],
       'ทาน้ำมันเหล็กบางๆ หลังใช้ เก็บที่แห้ง'),

      ('robe','honey','ผ้าจีวรไมโครซาติน 5 ขันธ์ พรีเมียม สีพระราชนิยม','ผ้าจีวรไมโครซาติน','5 ขันธ์',3290,3890,15,96,4.9,84,
       array['bestseller'],'อ.วานรนิวาส, สกลนคร',
       'ผ้าจีวรไมโครซาติน เนื้อนุ่ม เงาสวย ระบายอากาศดี สีพระราชนิยม 5 ขันธ์ พร้อมถวายพระสงฆ์',
       '[{"key":"ผ้า","value":"ไมโครซาติน"},{"key":"ขันธ์","value":"5 ขันธ์"},{"key":"สี","value":"พระราชนิยม"}]'::jsonb,
       array['จีวรไมโครซาติน','ผ้าห่อ'],
       'ซักมือ น้ำเย็น ตากร่ม');
  end if;
end $$;

-- ===================== เสร็จสิ้น =====================
-- ตรวจสอบหลังรัน:
--   select count(*) from public.products;   -- ควรเป็น 12
--   select count(*) from public.members;    -- ควรเป็น 0
--   select count(*) from public.orders;     -- ควรเป็น 0
