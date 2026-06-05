# คู่มือ Deploy — ยงค์ทอง สังฆภัณฑ์

ปลายทาง: **Supabase (DB + Auth + Storage) + Cloudflare Pages (Hosting)** — ฟรีทั้งหมด

---

## 🔑 ค่า Credentials ของโปรเจกต์นี้

| รายการ | ค่า |
|---|---|
| **GitHub repo** | https://github.com/PaoWebThai/yongtong-store |
| **Supabase URL** | https://auvdqknbmekfmwikuivr.supabase.co |
| **Supabase anon key** | อยู่ใน `.env` (ปลอดภัยที่จะใส่ frontend) |
| **Supabase Dashboard** | https://supabase.com/dashboard/project/auvdqknbmekfmwikuivr |
| **Admin username** | `admin` (email จะถูกตั้งเป็น `admin@yongtong.local`) |
| **Admin password (เริ่มต้น)** | `KEhJJXimNl3TNji` ← **เปลี่ยนได้ใน Supabase Dashboard ทีหลัง** |

---

## ขั้นตอนแบบเต็ม (ทำครั้งเดียว)

### Step 1 — รัน Schema ใน Supabase

1. ไปที่ https://supabase.com/dashboard/project/auvdqknbmekfmwikuivr/sql/new
2. เปิดไฟล์ `supabase/schema.sql` ในโปรเจกต์ → copy ทั้งหมด
3. Paste ใน SQL Editor → กด **Run** (มุมขวาล่าง หรือ ⌘+Enter)
4. ควรขึ้น `Success. No rows returned`
5. ไป **Database → Tables** ตรวจว่าเห็น `products`, `members`, `orders`
6. ไป **Storage** ตรวจว่ามี bucket `product-images`
7. ไป SQL Editor รัน `select count(*) from products;` ควรได้ **12**

### Step 2 — สร้าง Admin ใน Supabase Auth

1. ไปที่ **Authentication → Users** ใน Supabase Dashboard
2. กด **Add user → Create new user**
3. กรอก:
   - **Email**: `admin@yongtong.local`
   - **Password**: `KEhJJXimNl3TNji` ← **(จดไว้ในที่ปลอดภัย หรือเปลี่ยนใหม่)**
   - ✅ ติ๊ก **"Auto Confirm User"** (เพื่อไม่ต้อง verify email)
4. กด **Create user**
5. ทดสอบ: เปิดแอป localhost → กดปุ่ม "Admin" ด้านล่าง (footer) → ใส่ `admin` + รหัสผ่าน → ต้องเข้าได้

> 💡 **เปลี่ยนรหัสผ่าน admin ทีหลัง:** เข้า **Authentication → Users → กดที่ user → 3-dot menu → Send password reset** หรือ **Reset password**

### Step 3 — Push code ไป GitHub

ใน Terminal:

```bash
cd /Users/supers/Documents/YongTongWebApp
git init
git add .
git commit -m "Initial commit — YongTong store (Supabase + Vite)"
git branch -M main
git remote add origin https://github.com/PaoWebThai/yongtong-store.git
git push -u origin main
```

> ⚠️ **อย่ากังวลเรื่อง `.env`** — `.gitignore` กรอกไว้แล้วไม่ให้ commit (เพราะ `.env` มี anon key ที่ใส่ Cloudflare ทีหลังอยู่แล้ว)

### Step 4 — ตั้งค่า Cloudflare Pages

1. ไปที่ https://dash.cloudflare.com → **Workers & Pages** → **Create application** → **Pages** tab → **Connect to Git**
2. Authorize GitHub → เลือก repo `yongtong-store`
3. กรอก Build settings:
   - **Framework preset:** `Vite`
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Root directory:** (เว้นว่าง)
4. **Environment variables** → เพิ่ม 2 ค่า (เลือก "Production"):
   - `VITE_SUPABASE_URL` = `https://auvdqknbmekfmwikuivr.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = (copy จาก `.env` หรือจาก Supabase Dashboard → Settings → API → anon public)
5. กด **Save and Deploy**
6. รอ ~2 นาที — Cloudflare จะ build + deploy ให้
7. ได้ URL `https://yongtong-store.pages.dev` (หรือชื่อ project ที่ตั้ง)

### Step 5 — ตั้งค่า CORS ใน Supabase (สำคัญ)

หลังได้ Cloudflare URL แล้ว ไปเพิ่ม domain นั้นใน Supabase allowed URLs:

1. **Settings → API → URL Configuration** (หรือ **Authentication → URL Configuration**)
2. เพิ่ม URL ใน **Site URL** หรือ **Redirect URLs**:
   - `https://yongtong-store.pages.dev`
   - (ถ้ามี custom domain ก็เพิ่มทีหลังได้)

---

## 🧪 ทดสอบหลัง deploy

เปิด `https://yongtong-store.pages.dev` แล้วเช็ก:

- [ ] หน้าหลักโชว์สินค้า 12 รายการ
- [ ] กดหมวด "บาตร" filter ได้
- [ ] กดสินค้าเปิด modal ดูรายละเอียดได้
- [ ] กด "เพิ่มลงตะกร้า" → toast ขึ้น + badge cart เพิ่ม
- [ ] เปิด cart drawer → กด "ชำระเงิน" → ทดลอง checkout ครบ flow
- [ ] สมัครสมาชิกใหม่ ทดสอบ login ออก / login กลับ
- [ ] กด "Admin" ที่ footer → login ด้วย `admin` + รหัสผ่าน → เข้า Dashboard
- [ ] Admin: เพิ่ม/แก้ไข/ลบสินค้า — อัพโหลดรูปทดสอบได้
- [ ] เปิดเว็บใน **อีกเครื่อง/อีกเบราว์เซอร์** → ต้องเห็นข้อมูลเหมือนกัน (ยืนยันว่าใช้ DB ไม่ใช่ localStorage)

---

## 🛠 การ update code หลัง deploy

แก้ code ในเครื่อง → `git push` → Cloudflare auto-deploy ภายใน 1-2 นาที ฟรี

```bash
git add .
git commit -m "ข้อความ commit"
git push
```

ดู deploy progress ที่ https://dash.cloudflare.com → Workers & Pages → yongtong-store

---

## ⚠️ ข้อจำกัดของ Free Tier

| บริการ | จำกัด | ความเสี่ยง |
|---|---|---|
| **Supabase Free** | 500MB DB, 1GB Storage, 50k MAU, **หยุดถ้าไม่ใช้ 1 สัปดาห์** (auto-pause) | ปลุกกลับมาได้ใน Dashboard เฉยๆ ข้อมูลไม่หาย |
| **Cloudflare Pages** | 500 builds/เดือน, bandwidth ไม่จำกัด | แทบไม่มีข้อจำกัดในการใช้งานปกติ |
| **GitHub Free** | private repo ไม่จำกัด | ไม่มีปัญหา |

ถ้าวันใดร้านโตขึ้น → upgrade Supabase Pro ($25/เดือน) ได้โดยไม่ต้องเปลี่ยน code

---

## 🔐 หมายเหตุด้าน Security

- **Row Level Security (RLS)** เปิดทุกตาราง — ใครก็ตามที่ใช้ `anon key` (เป็น public ปลอดภัย) จะ:
  - ✅ อ่านสินค้าได้ (read public)
  - ✅ สมัครสมาชิก/สร้างคำสั่งซื้อได้
  - ❌ **ไม่สามารถ** เพิ่ม/แก้/ลบสินค้า หรือเปลี่ยนสถานะออเดอร์ได้ — ต้อง login ผ่าน Supabase Auth (admin) ก่อน
- รหัสผ่านสมาชิก **hash ด้วย PBKDF2-SHA256 (100k iterations)** + salt 16 byte ไม่เก็บ plaintext
- รหัสผ่าน admin จัดการโดย Supabase Auth — bcrypt automatically
- ⚠️ **`service_role` key** (ใน Supabase Dashboard) **ห้ามใส่ในเว็บ** — ใช้เฉพาะใน server-side scripts ถ้าจะมีในอนาคต
