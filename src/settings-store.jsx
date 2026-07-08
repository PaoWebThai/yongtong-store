// Site settings store — Supabase backed (table: site_settings)
// ใช้เก็บค่าตั้งค่าหน้าร้าน เช่น สไลด์โปรโมชั่น
//
// รูปแบบ: site_settings(key text pk, value jsonb)
//   key = "promo_slides" → value = { slides: [ {src, title, sub} ] }

import { supabase } from "./supabase.js";

const PROMO_KEY = "promo_slides";
const PROMO_CHANGED = "yongtong:promo-changed";

// ค่าเริ่มต้น (ใช้ตอนที่ยังไม่มีข้อมูลใน DB)
const DEFAULT_PROMO_SLIDES = [
  { src: "/assets/promo-1.jpg", title: "บาตรลูกจีน เคลือบเทปลอน", sub: "เสริมขอบ งานคุณภาพ" },
  { src: "/assets/promo-2.jpg", title: "บาตรเคลือบเทปลอน", sub: "3 แบบ 3 ทรง ให้เลือก" },
];

async function loadPromoSlides() {
  const { data, error } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", PROMO_KEY)
    .maybeSingle();
  if (error) {
    console.error("[settings] loadPromoSlides:", error);
    return null; // null = ใช้ค่า default
  }
  const slides = data?.value?.slides;
  return Array.isArray(slides) ? slides : null;
}

async function savePromoSlides(slides) {
  const clean = (Array.isArray(slides) ? slides : [])
    .filter((s) => s && s.src)
    .map((s) => ({ src: s.src, title: s.title || "", sub: s.sub || "" }));
  const { error } = await supabase
    .from("site_settings")
    .upsert({ key: PROMO_KEY, value: { slides: clean }, updated_at: new Date().toISOString() });
  if (error) {
    console.error("[settings] savePromoSlides:", error);
    throw error;
  }
  window.dispatchEvent(new CustomEvent(PROMO_CHANGED));
  return clean;
}

export {
  loadPromoSlides,
  savePromoSlides,
  DEFAULT_PROMO_SLIDES,
  PROMO_CHANGED,
};
