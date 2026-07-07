// Orders store — Supabase backed
// (เปลี่ยนจาก localStorage มาเป็น Postgres ผ่าน Supabase client)
//
// Admin authentication ใช้ Supabase Auth (auth.users) ไม่ใช่ตารางใน schema นี้

import { supabase } from "./supabase.js";

const ADMIN_USER = "admin";
const ADMIN_PASS = "yongtong2026";          // fallback ค่า default — เปลี่ยนใน DEPLOY.md
const ADMIN_EMAIL_DOMAIN = "yongtong.local"; // admin จะมี email "admin@yongtong.local"

// ---------------- DB row <-> app object ----------------
function fromDb(row) {
  if (!row) return null;
  return {
    id: row.id,
    createdAt: row.created_at,
    status: row.status,
    items: row.items,
    shipping: row.shipping,
    payment: row.payment,
    totals: row.totals,
    memberId: row.member_id,
  };
}

// ---------------- Read ----------------

async function loadOrders() {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("[orders] loadOrders:", error);
    return [];
  }
  return (data || []).map(fromDb);
}

async function getOrderById(id) {
  const norm = (id || "").trim().toUpperCase();
  if (!norm) return null;
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .ilike("id", norm)
    .maybeSingle();
  if (error) {
    console.error("[orders] getOrderById:", error);
    return null;
  }
  return fromDb(data);
}

async function getOrdersByPhone(phone) {
  const norm = (phone || "").replace(/[-\s]/g, "");
  if (!norm) return [];
  // ค้นด้วย shipping->>phone หลังจาก strip dashes/spaces (เก็บแบบมี dash อยู่ ต้องเทียบทุก format)
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("[orders] getOrdersByPhone:", error);
    return [];
  }
  return (data || [])
    .filter((o) => ((o.shipping?.phone || "").replace(/[-\s]/g, "")) === norm)
    .map(fromDb);
}

// ---------------- Create ----------------

function makeOrderId() {
  const ymd = new Date().toISOString().slice(2, 10).replace(/-/g, "");
  const rand = Math.floor(Math.random() * 9000 + 1000);
  return `YT${ymd}-${rand}`;
}

async function createOrder({ items, products, shipping, payment, totals, memberId }) {
  const lines = Object.entries(items).map(([, entry]) => {
    const p = products.find((x) => x.id === Number(entry.id));
    if (!p) return null;
    const unitPrice = entry.variant?.price ?? p.price;
    return {
      id: p.id, name: p.name, headline: p.headline,
      palette: p.palette, tag: p.tag,
      price: unitPrice, qty: entry.qty,
      variant: entry.variant ? { key: entry.variant.key, label: entry.variant.label } : null,
    };
  }).filter(Boolean);

  const row = {
    id: makeOrderId(),
    member_id: memberId || null,
    status: "pending",
    items: lines,
    shipping,
    payment,
    totals,
  };

  const { data, error } = await supabase
    .from("orders")
    .insert(row)
    .select()
    .single();
  if (error) {
    console.error("[orders] createOrder:", error);
    throw error;
  }
  return fromDb(data);
}

// ---------------- Update ----------------

async function updateOrderStatus(id, status) {
  // ต้องอ่านมาก่อนเพื่อ patch payment.paid ถ้า delivered + cod
  const current = await getOrderById(id);
  if (!current) return [];

  const patch = { status };
  if (status === "delivered" && current.payment?.method === "cod") {
    patch.payment = { ...current.payment, paid: true };
  }

  const { error } = await supabase
    .from("orders")
    .update(patch)
    .eq("id", id);
  if (error) {
    console.error("[orders] updateOrderStatus:", error);
    throw error;
  }
  return await loadOrders();
}

async function markPaid(id) {
  const current = await getOrderById(id);
  if (!current) return [];

  const patch = {
    payment: { ...current.payment, paid: true },
  };
  if (current.status === "pending") patch.status = "confirmed";

  const { error } = await supabase
    .from("orders")
    .update(patch)
    .eq("id", id);
  if (error) {
    console.error("[orders] markPaid:", error);
    throw error;
  }
  return await loadOrders();
}

// ---------------- Admin auth (Supabase Auth) ----------------
// admin คนเดียวสร้างใน Supabase Dashboard → Authentication → Users
// username "admin" → email "admin@yongtong.local"

async function adminLogin(u, p) {
  const email = (u || "").includes("@") ? u : `${u}@${ADMIN_EMAIL_DOMAIN}`;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: p });
  if (error) {
    console.warn("[orders] adminLogin failed:", error.message);
    return false;
  }
  return !!data?.session;
}

async function adminLogout() {
  await supabase.auth.signOut();
}

// sync — เช็คเฉพาะ session ใน memory ของ client (ไม่ต้อง round-trip)
function isAdmin() {
  // supabase.auth ค้าง session ใน storage; ใช้ getSession async ก็ได้
  // แต่ App ต้องการ value แบบ sync ตอน mount → เราอ่าน sessionStorage โดยตรง
  try {
    const raw = localStorage.getItem("yongtong.supabase.session");
    if (!raw) return false;
    const sess = JSON.parse(raw);
    if (!sess?.access_token) return false;
    if (sess.expires_at && sess.expires_at * 1000 < Date.now()) return false;
    return true;
  } catch {
    return false;
  }
}

export {
  loadOrders, createOrder, updateOrderStatus, markPaid,
  getOrderById, getOrdersByPhone,
  adminLogin, adminLogout, isAdmin,
  ADMIN_USER, ADMIN_PASS,
};
