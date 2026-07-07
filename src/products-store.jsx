// Product store — Supabase backed
// (เปลี่ยนจาก localStorage มาเป็น Postgres ผ่าน Supabase client)

import { supabase } from "./supabase.js";

// ---------------- DB row <-> app object ----------------
// DB ใช้ snake_case, app code ใช้ camelCase

function fromDb(row) {
  if (!row) return null;
  return {
    id: row.id,
    cat: row.cat,
    palette: row.palette,
    name: row.name,
    headline: row.headline ?? "",
    tag: row.tag ?? "",
    price: row.price,
    oldPrice: row.old_price,
    discount: row.discount ?? 0,
    sold: row.sold ?? 0,
    rating: Number(row.rating ?? 5),
    reviews: row.reviews ?? 0,
    badges: row.badges ?? [],
    location: row.location ?? "อ.วานรนิวาส, สกลนคร",
    description: row.description ?? "",
    specs: row.specs ?? [],
    includes: row.includes ?? [],
    care: row.care ?? "",
    images: row.images ?? [],
    variants: row.variants && typeof row.variants === "object" ? row.variants : {},
    detailBlocks: Array.isArray(row.detail_blocks) ? row.detail_blocks : [],
  };
}

function toDb(p) {
  return {
    cat: p.cat,
    palette: p.palette,
    name: p.name,
    headline: p.headline ?? "",
    tag: p.tag ?? "",
    price: Number(p.price) || 0,
    old_price: p.oldPrice ?? null,
    discount: Number(p.discount) || 0,
    sold: Number(p.sold) || 0,
    rating: Number(p.rating) || 5,
    reviews: Number(p.reviews) || 0,
    badges: p.badges ?? [],
    location: p.location ?? "อ.วานรนิวาส, สกลนคร",
    description: p.description ?? "",
    specs: p.specs ?? [],
    includes: p.includes ?? [],
    care: p.care ?? "",
    images: p.images ?? [],
    variants: p.variants && typeof p.variants === "object" ? p.variants : {},
    detail_blocks: Array.isArray(p.detailBlocks) ? p.detailBlocks : [],
  };
}

// ---------------- CRUD ----------------

async function loadProducts() {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("[products] loadProducts:", error);
    return [];
  }
  return (data || []).map(fromDb);
}

async function addProduct(p) {
  const { data, error } = await supabase
    .from("products")
    .insert(toDb(p))
    .select()
    .single();
  if (error) {
    console.error("[products] addProduct:", error);
    throw error;
  }
  notifyChanged();
  return fromDb(data);
}

async function updateProduct(id, patch) {
  // patch may contain only some fields — strip undefined
  const dbPatch = toDb({ ...patch });
  Object.keys(dbPatch).forEach((k) => dbPatch[k] === undefined && delete dbPatch[k]);
  // remove keys not in patch (i.e., ones not user-changed)
  const userKeys = Object.keys(patch);
  const KEY_MAP = { oldPrice: "old_price", detailBlocks: "detail_blocks" };
  const mappedKeys = userKeys.map((k) => KEY_MAP[k] || k);
  Object.keys(dbPatch).forEach((k) => { if (!mappedKeys.includes(k)) delete dbPatch[k]; });

  const { data, error } = await supabase
    .from("products")
    .update(dbPatch)
    .eq("id", id)
    .select()
    .single();
  if (error) {
    console.error("[products] updateProduct:", error);
    throw error;
  }
  notifyChanged();
  return fromDb(data);
}

async function deleteProduct(id) {
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) {
    console.error("[products] deleteProduct:", error);
    throw error;
  }
  notifyChanged();
  return await loadProducts();
}

async function resetProducts() {
  // ในเวอร์ชัน DB เราจะไม่ลบทั้งตาราง — ใช้กับ admin reset ปัจจุบันเท่านั้น
  // ทางเลือก: ให้ admin import seed ใหม่ผ่าน UI แทน
  console.warn("[products] resetProducts: DB-backed mode does not auto-reset.");
  return await loadProducts();
}

function notifyChanged() {
  window.dispatchEvent(new CustomEvent("yongtong:products-changed"));
}

// ---------------- Blank/template ----------------

function blankProduct() {
  return {
    name: "",
    headline: "",
    tag: "",
    cat: "bowl",
    palette: "amber",
    price: 0,
    oldPrice: null,
    discount: 0,
    sold: 0,
    rating: 5.0,
    reviews: 0,
    badges: [],
    location: "อ.วานรนิวาส, สกลนคร",
    images: [],
    description: "",
    specs: [],
    includes: [],
    care: "",
    variants: {},
    detailBlocks: [],
  };
}

// ---------------- Image upload ----------------
// อัพโหลดรูปไป Supabase Storage bucket "product-images"
// ส่งคืน public URL ที่ใช้ใส่ใน images[]

const BUCKET = "product-images";

async function uploadProductImage(file, maxW = 1000) {
  // 1. resize ใน browser ก่อนอัพ (ลด bandwidth)
  const blob = await resizeImageBlob(file, maxW);
  const ext = "jpg";
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const path = `${filename}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, { contentType: "image/jpeg", upsert: false });
  if (error) {
    console.error("[products] upload:", error);
    throw error;
  }
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

function resizeImageBlob(file, maxW = 1000) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const ratio = Math.min(1, maxW / img.width);
        const w = Math.round(img.width * ratio);
        const h = Math.round(img.height * ratio);
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("toBlob failed")),
          "image/jpeg", 0.82);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

// ---- Backward-compat: บาง component เดิมเรียก resizeImageFile แล้วได้ dataURL
// ใน mode ใหม่เราเรียก uploadProductImage แทน คืน URL ของ Storage
async function resizeImageFile(file, maxW = 1000) {
  return await uploadProductImage(file, maxW);
}

export {
  loadProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  resetProducts,
  blankProduct,
  uploadProductImage,
  resizeImageFile,
};
