// Category store — editable product categories
// เก็บในเบราว์เซอร์ (localStorage) seed จากค่าเริ่มต้นใน data.jsx
// ใช้ผ่าน hook useCategories() เพื่อให้ทุก component sync กันอัตโนมัติ

import React from "react";
import { CATEGORIES as DEFAULT_CATEGORIES } from "./data.jsx";

const LS_KEY = "yongtong:categories";
const ALL = { id: "all", label: "ทั้งหมด", icon: "all" };
const CHANGE_EVT = "yongtong:categories-changed";

// "all" ต้องอยู่หัวเสมอ และไม่ซ้ำ
function normalize(list) {
  const rest = (list || []).filter((c) => c && c.id && c.id !== "all");
  return [ALL, ...rest];
}

function readLocal() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) return parsed;
    }
  } catch (e) { /* ignore */ }
  return null;
}

function writeLocal(list) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(list.filter((c) => c.id !== "all")));
  } catch (e) { /* ignore */ }
}

let _cache = normalize(readLocal() || DEFAULT_CATEGORIES);

function getCategories() { return _cache; }

function loadCategories() {
  _cache = normalize(readLocal() || DEFAULT_CATEGORIES);
  return _cache;
}

function notifyChanged() {
  window.dispatchEvent(new CustomEvent(CHANGE_EVT));
}

function addCategory({ id, label, icon = "bag" }) {
  label = (label || "").trim();
  id = (id || "").trim().toLowerCase();
  if (!label) throw new Error("กรุณากรอกชื่อหมวดหมู่");
  if (!id) id = "cat-" + Math.random().toString(36).slice(2, 7);
  if (!/^[a-z0-9_-]+$/.test(id)) throw new Error("รหัสหมวดใช้ได้เฉพาะตัวอักษร a-z, ตัวเลข, - และ _");
  if (_cache.some((c) => c.id === id)) throw new Error("มีรหัสหมวดนี้อยู่แล้ว");
  const next = normalize([..._cache.filter((c) => c.id !== "all"), { id, label, icon }]);
  writeLocal(next);
  _cache = next;
  notifyChanged();
  return next;
}

function deleteCategory(id) {
  const next = normalize(_cache.filter((c) => c.id !== id && c.id !== "all"));
  writeLocal(next);
  _cache = next;
  notifyChanged();
  return next;
}

function resetCategories() {
  try { localStorage.removeItem(LS_KEY); } catch (e) { /* ignore */ }
  _cache = normalize(DEFAULT_CATEGORIES);
  notifyChanged();
  return _cache;
}

// React hook — คืน list ปัจจุบัน และ re-render อัตโนมัติเมื่อมีการเปลี่ยนแปลง
function useCategories() {
  const [cats, setCats] = React.useState(_cache);
  React.useEffect(() => {
    const onChange = () => setCats(getCategories());
    const onStorage = (e) => { if (e.key === LS_KEY) { loadCategories(); setCats(getCategories()); } };
    window.addEventListener(CHANGE_EVT, onChange);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(CHANGE_EVT, onChange);
      window.removeEventListener("storage", onStorage);
    };
  }, []);
  return cats;
}

export {
  getCategories,
  loadCategories,
  addCategory,
  deleteCategory,
  resetCategories,
  useCategories,
  DEFAULT_CATEGORIES,
};
