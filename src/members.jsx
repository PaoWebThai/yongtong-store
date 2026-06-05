// Member store — Supabase backed
// (เปลี่ยนจาก localStorage มาเป็น Postgres + PBKDF2 password hashing)

import { supabase, hashPassword, verifyPassword } from "./supabase.js";

const MEMBER_SESSION_KEY = "yongtong.memberSession.v1";

// ---------------- DB row <-> app object ----------------
function fromDb(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email ?? "",
    address: row.address ?? "",
    createdAt: row.created_at,
    // ไม่ส่ง password_hash/salt ออกจาก layer นี้
  };
}

// ---------------- Lookup ----------------
function normalizePhone(p) {
  return (p || "").replace(/[-\s]/g, "");
}

async function findMemberByPhone(phone) {
  const norm = normalizePhone(phone);
  if (!norm) return null;
  // ดึงทุก member แล้ว filter — โอเคสำหรับร้านเล็ก
  // (ถ้าโตขึ้นย้ายไปใช้ RPC function หรือเก็บ phone แบบ normalized)
  const { data, error } = await supabase.from("members").select("*");
  if (error) {
    console.error("[members] findMemberByPhone:", error);
    return null;
  }
  return (data || []).find((m) => normalizePhone(m.phone) === norm) || null;
}

// ---------------- Register ----------------
// คืน { ok, error?, member? }
async function registerMember({ name, phone, email, password, address }) {
  if (!name || !name.trim()) return { ok: false, error: "กรุณากรอกชื่อ-นามสกุล" };
  if (!phone || !/^[0-9-+\s]{9,}$/.test(phone)) return { ok: false, error: "เบอร์โทรไม่ถูกต้อง" };
  if (!password || password.length < 4) return { ok: false, error: "รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร" };

  const existing = await findMemberByPhone(phone);
  if (existing) return { ok: false, error: "เบอร์โทรนี้เป็นสมาชิกอยู่แล้ว กรุณาเข้าสู่ระบบ" };

  const { hash, salt } = await hashPassword(password);
  const id = "M" + Date.now().toString(36).toUpperCase();
  const row = {
    id,
    name: name.trim(),
    phone: phone.trim(),
    email: (email || "").trim(),
    address: (address || "").trim(),
    password_hash: hash,
    password_salt: salt,
  };
  const { data, error } = await supabase.from("members").insert(row).select().single();
  if (error) {
    console.error("[members] register:", error);
    return { ok: false, error: "สมัครสมาชิกไม่สำเร็จ กรุณาลองใหม่" };
  }
  const member = fromDb(data);
  setMemberSession(member.id);
  return { ok: true, member };
}

// ---------------- Login ----------------
async function loginMember(phone, password) {
  const m = await findMemberByPhone(phone);
  if (!m) return { ok: false, error: "ไม่พบสมาชิกที่ใช้เบอร์โทรนี้" };
  const ok = await verifyPassword(password, m.password_salt, m.password_hash);
  if (!ok) return { ok: false, error: "รหัสผ่านไม่ถูกต้อง" };
  setMemberSession(m.id);
  return { ok: true, member: fromDb(m) };
}

// ---------------- Session ----------------
function setMemberSession(id) {
  localStorage.setItem(MEMBER_SESSION_KEY, id);
}
function logoutMember() {
  localStorage.removeItem(MEMBER_SESSION_KEY);
}

// sync — คืน member จาก cache ทันที (ใช้ตอน App mount)
// คืนแค่ id+name+phone ที่ cache ไว้ก่อน, refresh จริงเรียก refreshCurrentMember
function getCurrentMember() {
  const id = localStorage.getItem(MEMBER_SESSION_KEY);
  if (!id) return null;
  // คืน skeleton — ตัวจริงโหลด async ผ่าน refreshCurrentMember
  try {
    const cached = JSON.parse(localStorage.getItem(MEMBER_SESSION_KEY + ".cache") || "null");
    if (cached?.id === id) return cached;
  } catch {}
  return { id, name: "...", phone: "", email: "", address: "" };
}

async function refreshCurrentMember() {
  const id = localStorage.getItem(MEMBER_SESSION_KEY);
  if (!id) return null;
  const { data, error } = await supabase
    .from("members").select("*").eq("id", id).maybeSingle();
  if (error || !data) return null;
  const m = fromDb(data);
  localStorage.setItem(MEMBER_SESSION_KEY + ".cache", JSON.stringify(m));
  return m;
}

async function updateMember(id, patch) {
  const dbPatch = {};
  if (patch.name !== undefined) dbPatch.name = patch.name;
  if (patch.phone !== undefined) dbPatch.phone = patch.phone;
  if (patch.email !== undefined) dbPatch.email = patch.email;
  if (patch.address !== undefined) dbPatch.address = patch.address;
  const { data, error } = await supabase
    .from("members").update(dbPatch).eq("id", id).select().single();
  if (error) {
    console.error("[members] updateMember:", error);
    return null;
  }
  const m = fromDb(data);
  localStorage.setItem(MEMBER_SESSION_KEY + ".cache", JSON.stringify(m));
  return m;
}

// admin มุมมอง — list members ทั้งหมด
async function loadMembers() {
  const { data, error } = await supabase
    .from("members")
    .select("id, name, phone, email, address, created_at")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("[members] loadMembers:", error);
    return [];
  }
  return (data || []).map(fromDb);
}

export {
  MEMBER_SESSION_KEY,
  loadMembers, registerMember, loginMember,
  getCurrentMember, refreshCurrentMember,
  logoutMember, updateMember, findMemberByPhone,
};
