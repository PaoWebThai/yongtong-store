// Admin Product Manager — CRUD UI

import React from "react";
import { Icon, ProductPlaceholder } from "./icons.jsx";
import { PALETTES } from "./data.jsx";
import { useCategories, addCategory, deleteCategory } from "./categories-store.jsx";
import { loadPromoSlides, savePromoSlides, DEFAULT_PROMO_SLIDES } from "./settings-store.jsx";
import { allCombos, hasVariants, priceRange } from "./cart-utils.jsx";
import {
  loadProducts, updateProduct, addProduct, deleteProduct,
  resetProducts, blankProduct, resizeImageFile,
} from "./products-store.jsx";

const MAX_IMAGES = 12;

const { useState: useStatePM, useEffect: useEffectPM, useMemo: useMemoPM } = React;

const BADGE_OPTIONS = [
  { id: "bestseller", label: "ขายดี" },
  { id: "verified",   label: "ของแท้" },
  { id: "new",        label: "มาใหม่" },
];

function ProductManager() {
  const categories = useCategories();
  const [items, setItems] = useStatePM([]);
  const [editing, setEditing] = useStatePM(null);    // product object or "new"
  const [filter, setFilter] = useStatePM("all");
  const [search, setSearch] = useStatePM("");
  const [confirmDel, setConfirmDel] = useStatePM(null);
  const [catMgrOpen, setCatMgrOpen] = useStatePM(false);
  const [promoMgrOpen, setPromoMgrOpen] = useStatePM(false);
  const [pmToasts, setPmToasts] = useStatePM([]);

  useEffectPM(() => {
    let cancelled = false;
    (async () => {
      const list = await loadProducts();
      if (!cancelled) setItems(list);
    })();
    return () => { cancelled = true; };
  }, []);

  async function refresh() {
    const list = await loadProducts();
    setItems(list);
  }

  function toast(msg) {
    const id = Math.random().toString(36).slice(2);
    setPmToasts((t) => [...t, { id, msg }]);
    setTimeout(() => setPmToasts((t) => t.filter((x) => x.id !== id)), 2200);
  }

  async function handleSave(product) {
    try {
      if (product.id) {
        await updateProduct(product.id, product);
        toast(`บันทึกการแก้ไข "${product.headline || product.name}" แล้ว`);
      } else {
        await addProduct(product);
        toast(`เพิ่มสินค้า "${product.headline || product.name}" เรียบร้อย`);
      }
      await refresh();
      setEditing(null);
    } catch (e) {
      toast(`บันทึกไม่สำเร็จ: ${e.message || e}`);
    }
  }

  async function handleDelete(id) {
    try {
      await deleteProduct(id);
      await refresh();
      setConfirmDel(null);
      toast("ลบสินค้าเรียบร้อยแล้ว");
    } catch (e) {
      toast(`ลบไม่สำเร็จ: ${e.message || e}`);
    }
  }

  async function handleReset() {
    if (!confirm("คืนค่าเริ่มต้น? ฟีเจอร์นี้ใช้ได้เฉพาะ localStorage mode — ใน DB mode ให้ใช้ Supabase SQL Editor")) return;
    await resetProducts();
    await refresh();
    toast("รีเฟรชจาก DB เรียบร้อย");
  }

  let list = items.slice();
  if (filter !== "all") list = list.filter((p) => p.cat === filter);
  if (search.trim()) {
    const q = search.toLowerCase();
    list = list.filter((p) =>
      (p.name || "").toLowerCase().includes(q) ||
      (p.headline || "").toLowerCase().includes(q) ||
      (p.tag || "").toLowerCase().includes(q)
    );
  }

  return (
    <>
      <div className="admin-stats">
        <div className="admin-stat">
          <div className="admin-stat-icon">{Icon.store}</div>
          <div className="admin-stat-num">{items.length}</div>
          <div className="admin-stat-lbl">สินค้าทั้งหมด</div>
        </div>
        <div className="admin-stat">
          <div className="admin-stat-icon" style={{ background: "#FEF3C7", color: "#A16207" }}>{Icon.flame}</div>
          <div className="admin-stat-num">{items.filter((p) => p.badges?.includes("bestseller")).length}</div>
          <div className="admin-stat-lbl">รายการขายดี</div>
        </div>
        <div className="admin-stat">
          <div className="admin-stat-icon" style={{ background: "#FFEDD5", color: "#C2410C" }}>{Icon.coin}</div>
          <div className="admin-stat-num">{items.reduce((s, p) => s + (p.sold || 0), 0).toLocaleString("th-TH")}</div>
          <div className="admin-stat-lbl">ขายไปแล้วทั้งหมด</div>
        </div>
        <div className="admin-stat">
          <div className="admin-stat-icon" style={{ background: "#DBEAFE", color: "#1E40AF" }}>{Icon.list}</div>
          <div className="admin-stat-num">{new Set(items.map((p) => p.cat)).size}</div>
          <div className="admin-stat-lbl">หมวดที่ใช้งาน</div>
        </div>
      </div>

      <div className="admin-toolbar">
        <div className="chip-row">
          {categories.map((c) => (
            <button
              key={c.id}
              className={`chip ${filter === c.id ? "active" : ""}`}
              onClick={() => setFilter(c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div className="admin-search">
            {Icon.search}
            <input
              placeholder="ค้นหาชื่อสินค้า"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="btn btn-ghost" onClick={handleReset} title="คืนค่าเริ่มต้น">
            {Icon.refresh}
          </button>
          <button className="btn btn-outline" onClick={() => setCatMgrOpen(true)}>
            {Icon.list} จัดการหมวดหมู่
          </button>
          <button className="btn btn-outline" onClick={() => setPromoMgrOpen(true)}>
            {Icon.image} สไลด์หน้าร้าน
          </button>
          <button className="btn btn-primary" onClick={() => setEditing(blankProduct())}>
            {Icon.plus} เพิ่มสินค้าใหม่
          </button>
        </div>
      </div>

      <div className="pm-grid">
        {list.length === 0 && (
          <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: 60, color: "var(--c-muted)" }}>
            ไม่พบสินค้าในเงื่อนไขนี้
          </div>
        )}
        {list.map((p) => (
          <div className="pm-card" key={p.id}>
            <div className="pm-card-media">
              <ProductPlaceholder product={p} />
              {p.discount > 0 && <div className="badge-discount" style={{ top: 8, right: 8 }}>-{p.discount}%</div>}
            </div>
            <div className="pm-card-body">
              <div style={{ fontSize: 11, letterSpacing: 1, color: "var(--c-muted)", textTransform: "uppercase" }}>
                {categories.find((c) => c.id === p.cat)?.label || p.cat}
              </div>
              <div className="pm-card-name">{p.name}</div>
              <div className="pm-card-stats">
                <span style={{ color: "var(--c-price)", fontWeight: 700, fontSize: 18, fontFeatureSettings: '"tnum"' }}>
                  ฿{(p.price || 0).toLocaleString("th-TH")}
                </span>
                {p.oldPrice && <span style={{ textDecoration: "line-through", color: "var(--c-muted)", fontSize: 12 }}>฿{p.oldPrice.toLocaleString("th-TH")}</span>}
              </div>
              <div className="pm-card-meta">
                <span>ขายแล้ว <strong style={{ color: "var(--c-ink)" }}>{p.sold}</strong> ชิ้น</span>
              </div>
              <div className="pm-card-badges">
                {p.badges?.map((b) => (
                  <span key={b} className="pm-badge">{BADGE_OPTIONS.find((o) => o.id === b)?.label || b}</span>
                ))}
              </div>
              <div className="pm-card-actions">
                <button className="btn btn-ghost" onClick={() => setEditing(p)} style={{ flex: 1, padding: "8px 12px", fontSize: 13 }}>
                  {Icon.edit} แก้ไข
                </button>
                <button className="btn-danger" onClick={() => setConfirmDel(p)} title="ลบสินค้า">
                  {Icon.trash}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <ProductEditor
          initial={editing}
          onClose={() => setEditing(null)}
          onSave={handleSave}
        />
      )}

      {catMgrOpen && (
        <CategoryManager
          categories={categories}
          products={items}
          onClose={() => setCatMgrOpen(false)}
          onToast={toast}
        />
      )}

      {promoMgrOpen && (
        <PromoManager onClose={() => setPromoMgrOpen(false)} onToast={toast} />
      )}

      {confirmDel && (
        <div className="modal-backdrop" onClick={() => setConfirmDel(null)}>
          <div className="modal" style={{ width: "min(440px, 100%)", padding: "30px 32px" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#FEE2E2", color: "#B91C1C", display: "grid", placeItems: "center", marginBottom: 16 }}>
              {Icon.trash}
            </div>
            <h3 style={{ margin: "0 0 6px", fontFamily: "var(--font-display)", fontSize: 20 }}>ยืนยันการลบสินค้า?</h3>
            <p style={{ margin: "0 0 18px", color: "var(--c-muted)", fontSize: 14 }}>
              "{confirmDel.headline || confirmDel.name}" จะถูกลบออกจากร้านถาวร
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button className="btn btn-ghost" onClick={() => setConfirmDel(null)}>ยกเลิก</button>
              <button className="btn-danger-solid" onClick={() => handleDelete(confirmDel.id)}>
                {Icon.trash} ลบสินค้า
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="toast-stack">
        {pmToasts.map((t) => (
          <div className="toast" key={t.id}>{Icon.check} {t.msg}</div>
        ))}
      </div>
    </>
  );
}

/* ---------- Product Editor (add / edit) ---------- */
function ProductEditor({ initial, onClose, onSave }) {
  const categories = useCategories();
  const [p, setP] = useStatePM({ ...blankProduct(), ...initial });
  const [errs, setErrs] = useStatePM({});
  const [dragIdx, setDragIdx] = useStatePM(null);

  const fileInputRef = React.useRef();

  function set(k, v) { setP((cur) => ({ ...cur, [k]: v })); }

  function setNum(k, v) {
    const n = v === "" ? "" : Number(v);
    set(k, n);
  }

  function toggleBadge(b) {
    const cur = new Set(p.badges || []);
    if (cur.has(b)) cur.delete(b); else cur.add(b);
    set("badges", [...cur]);
  }

  async function handleFileUpload(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const current = p.images || [];
    if (current.length + files.length > MAX_IMAGES) {
      alert(`เพิ่มรูปได้สูงสุด ${MAX_IMAGES} รูปเท่านั้น`);
      return;
    }
    const dataUrls = [];
    for (const f of files) {
      try {
        const url = await resizeImageFile(f, 1000);
        dataUrls.push(url);
      } catch (err) { console.error(err); }
    }
    set("images", [...current, ...dataUrls]);
    e.target.value = "";
  }

  function removeImage(idx) {
    const next = (p.images || []).filter((_, i) => i !== idx);
    set("images", next);
  }

  function moveImageFirst(idx) {
    const cur = (p.images || []).slice();
    const [m] = cur.splice(idx, 1);
    cur.unshift(m);
    set("images", cur);
  }

  // จัดเรียงรูปใหม่ (ลาก-วาง หรือ ปุ่มเลื่อนซ้าย/ขวา)
  function moveImage(from, to) {
    if (from == null || to == null || from === to) return;
    const cur = (p.images || []).slice();
    if (to < 0 || to >= cur.length) return;
    const [m] = cur.splice(from, 1);
    cur.splice(to, 0, m);
    set("images", cur);
  }

  // --- Specs ---
  function addSpec() {
    set("specs", [...(p.specs || []), { key: "", value: "" }]);
  }
  function updateSpec(i, field, v) {
    const next = (p.specs || []).map((s, idx) => idx === i ? { ...s, [field]: v } : s);
    set("specs", next);
  }
  function removeSpec(i) {
    set("specs", (p.specs || []).filter((_, idx) => idx !== i));
  }

  // --- Includes ---
  function addInclude() {
    set("includes", [...(p.includes || []), ""]);
  }
  function updateInclude(i, v) {
    set("includes", (p.includes || []).map((x, idx) => idx === i ? v : x));
  }
  function removeInclude(i) {
    set("includes", (p.includes || []).filter((_, idx) => idx !== i));
  }

  // Auto-discount from price/oldPrice
  useEffectPM(() => {
    if (p.oldPrice && p.price && p.oldPrice > p.price) {
      const d = Math.round((1 - p.price / p.oldPrice) * 100);
      if (d !== p.discount) set("discount", d);
    } else if ((!p.oldPrice || p.oldPrice <= p.price) && p.discount !== 0) {
      set("discount", 0);
    }
  }, [p.price, p.oldPrice]);

  function handleSubmit(e) {
    e.preventDefault();
    const errors = {};
    if (!p.name?.trim()) errors.name = "กรุณากรอกชื่อสินค้า";
    if (!p.headline?.trim()) errors.headline = "กรุณากรอกหัวข้อ (แสดงบนการ์ด)";

    const variantOn = hasVariants(p);
    let resolvedPrice = Number(p.price) || 0;
    if (variantOn) {
      // ทุกคู่ผสมต้องมีราคา > 0
      const combos = allCombos(p.variants.options);
      const matrix = p.variants.matrix || {};
      const missing = combos.some((c) => !(Number(matrix[c.key]?.price) > 0));
      if (missing) errors.variants = "กรุณากรอกราคาให้ครบทุกตัวเลือก";
      else resolvedPrice = priceRange(p).min; // ราคาบนการ์ด = ราคาต่ำสุด
    } else if (!p.price || p.price <= 0) {
      errors.price = "กรุณากรอกราคาที่ถูกต้อง";
    }

    setErrs(errors);
    if (Object.keys(errors).length) {
      if (errors.variants) alert(errors.variants);
      return;
    }
    onSave({
      ...p,
      price: resolvedPrice,
      oldPrice: p.oldPrice ? Number(p.oldPrice) : null,
      sold: Number(p.sold) || 0,
      rating: Number(p.rating) || 5,
      reviews: Number(p.reviews) || 0,
      discount: Number(p.discount) || 0,
      badges: p.badges || [],
    });
  }

  const isNew = !p.id;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal pe-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>{Icon.close}</button>

        <div className="pe-head">
          <div>
            <div style={{ fontSize: 11, letterSpacing: 1.5, color: "var(--c-muted)" }}>
              {isNew ? "เพิ่มสินค้าใหม่" : `แก้ไขสินค้า #${p.id}`}
            </div>
            <h2 style={{ margin: "4px 0 0", fontFamily: "var(--font-display)", fontSize: 22 }}>
              {p.headline || (isNew ? "สินค้าใหม่" : "แก้ไขรายละเอียดสินค้า")}
            </h2>
          </div>
        </div>

        <form className="pe-body" onSubmit={handleSubmit}>
          <div className="pe-preview">
            <div className="pe-preview-frame">
              <ProductPlaceholder product={p} />
            </div>
            <div style={{ fontSize: 12, color: "var(--c-muted)", textAlign: "center" }}>
              ตัวอย่างการ์ดสินค้า
            </div>
            <div className="pe-section">
              <div className="pe-section-title">รูปลักษณ์การ์ด</div>
              <div className="palette-row">
                {Object.keys(PALETTES).map((k) => (
                  <button
                    type="button"
                    key={k}
                    className={`palette-swatch ${p.palette === k ? "active" : ""}`}
                    onClick={() => set("palette", k)}
                    style={{
                      background: `linear-gradient(135deg, ${PALETTES[k].glaze} 0%, ${PALETTES[k].bg} 100%)`
                    }}
                    title={k}
                  >
                    {p.palette === k && Icon.check}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pe-fields">
            <div className="pe-section">
              <div className="pe-section-title">รูปภาพสินค้า (สูงสุด {MAX_IMAGES} รูป)</div>
              <div className="pe-images">
                {(p.images || []).map((src, i) => (
                  <div
                    className={`pe-image-tile ${dragIdx === i ? "dragging" : ""}`}
                    key={i}
                    draggable
                    onDragStart={() => setDragIdx(i)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => { e.preventDefault(); moveImage(dragIdx, i); setDragIdx(null); }}
                    onDragEnd={() => setDragIdx(null)}
                  >
                    <img src={src} alt="" draggable={false} />
                    {i === 0 && <div className="pe-image-cover">รูปหลัก</div>}
                    <div className="pe-image-order">{i + 1}</div>
                    <div className="pe-image-actions">
                      {i !== 0 && (
                        <button type="button" onClick={() => moveImage(i, i - 1)} title="เลื่อนซ้าย">
                          {Icon.chevronLeft}
                        </button>
                      )}
                      {i !== 0 && (
                        <button type="button" onClick={() => moveImageFirst(i)} title="ตั้งเป็นรูปหลัก">
                          {Icon.starOutline}
                        </button>
                      )}
                      {i !== (p.images || []).length - 1 && (
                        <button type="button" onClick={() => moveImage(i, i + 1)} title="เลื่อนขวา">
                          {Icon.chevronRight}
                        </button>
                      )}
                      <button type="button" onClick={() => removeImage(i)} title="ลบ">
                        {Icon.trash}
                      </button>
                    </div>
                  </div>
                ))}
                {(p.images || []).length < MAX_IMAGES && (
                  <label className="pe-image-add">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      hidden
                      onChange={handleFileUpload}
                    />
                    {Icon.upload}
                    <span>อัปโหลดรูป</span>
                    <span style={{ fontSize: 11, color: "var(--c-muted)" }}>JPG / PNG</span>
                  </label>
                )}
              </div>
              <div style={{ fontSize: 12, color: "var(--c-muted)" }}>
                รูปแรก (หมายเลข 1) คือรูปหลัก · ลากรูปเพื่อจัดเรียงลำดับ หรือใช้ปุ่มลูกศรซ้าย/ขวา · คลิกดาวเพื่อตั้งเป็นรูปหลัก
              </div>
            </div>

            <div className="pe-section">
              <div className="pe-section-title">ข้อมูลสินค้า</div>
              <div className="form-grid">
                <div className={`field full ${errs.name ? "err" : ""}`}>
                  <label>ชื่อสินค้า (เต็ม) *</label>
                  <textarea rows="3" value={p.name} onChange={(e) => set("name", e.target.value)} placeholder="เช่น ขาบาตรไม้แก่นขาม มีทั้งแบบถักลายและลักเรียง" />
                  {errs.name && <div className="err-msg">{errs.name}</div>}
                </div>
                <div className={`field ${errs.headline ? "err" : ""}`}>
                  <label>หัวข้อ (แสดงบนการ์ด) *</label>
                  <input value={p.headline} onChange={(e) => set("headline", e.target.value)} placeholder="ขาบาตรไม้" />
                  {errs.headline && <div className="err-msg">{errs.headline}</div>}
                </div>
                <div className="field">
                  <label>ป้ายกำกับเสริม</label>
                  <input value={p.tag} onChange={(e) => set("tag", e.target.value)} placeholder="แก่นขามแท้" />
                </div>
                <div className="field">
                  <label>หมวดหมู่</label>
                  <select value={p.cat} onChange={(e) => set("cat", e.target.value)}>
                    {categories.filter((c) => c.id !== "all").map((c) => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>ที่ตั้ง / จัดส่งจาก</label>
                  <input value={p.location} onChange={(e) => set("location", e.target.value)} />
                </div>
                <div className="field full">
                  <label>คำอธิบายสินค้า (แสดงในหน้ารายละเอียด)</label>
                  <RichEditor
                    value={p.description}
                    onChange={(html) => set("description", html)}
                  />
                  <div className="rich-hint">
                    พิมพ์ข้อความได้ตามปกติ · กด “แทรกรูปภาพ” เพื่อวางรูปในเนื้อหา (คลิกที่รูปเพื่อปรับขนาด/จัดวาง) · กด “แทรกตาราง” เพื่อเพิ่มตาราง
                  </div>
                </div>
              </div>
            </div>

            <div className="pe-section">
              <div className="pe-section-title">ข้อมูลจำเพาะ (specifications)</div>
              <div className="specs-rows">
                {(p.specs || []).map((s, i) => (
                  <div className="spec-row" key={i}>
                    <input
                      placeholder="หัวข้อ (เช่น น้ำหนัก)"
                      value={s.key}
                      onChange={(e) => updateSpec(i, "key", e.target.value)}
                    />
                    <input
                      placeholder="ค่า (เช่น 1.2 กก.)"
                      value={s.value}
                      onChange={(e) => updateSpec(i, "value", e.target.value)}
                    />
                    <button type="button" className="spec-del" onClick={() => removeSpec(i)} title="ลบ">
                      {Icon.trash}
                    </button>
                  </div>
                ))}
                {(p.specs || []).length === 0 && (
                  <div style={{ fontSize: 13, color: "var(--c-muted)", padding: "8px 0" }}>
                    ยังไม่มีข้อมูลจำเพาะ — กดเพิ่มเพื่อใส่ข้อมูล เช่น น้ำหนัก ขนาด วัสดุ
                  </div>
                )}
                <button type="button" className="chip" onClick={addSpec} style={{ alignSelf: "flex-start" }}>
                  {Icon.plus} เพิ่มหัวข้อ
                </button>
              </div>
            </div>

            <div className="pe-section">
              <div className="pe-section-title">ในชุดประกอบด้วย</div>
              <div className="includes-rows">
                {(p.includes || []).map((it, i) => (
                  <div className="include-row" key={i}>
                    <span className="include-bullet">{i + 1}</span>
                    <input
                      placeholder="เช่น บาตรเบา 1 ใบ"
                      value={it}
                      onChange={(e) => updateInclude(i, e.target.value)}
                    />
                    <button type="button" className="spec-del" onClick={() => removeInclude(i)} title="ลบ">
                      {Icon.trash}
                    </button>
                  </div>
                ))}
                <button type="button" className="chip" onClick={addInclude} style={{ alignSelf: "flex-start" }}>
                  {Icon.plus} เพิ่มรายการ
                </button>
              </div>
            </div>

            <div className="pe-section">
              <div className="pe-section-title">วิธีใช้งาน / การดูแลรักษา</div>
              <textarea
                rows="4"
                value={p.care}
                onChange={(e) => set("care", e.target.value)}
                placeholder="เช่น เช็ดทำความสะอาดด้วยผ้าแห้ง หลีกเลี่ยงความชื้น..."
                style={{
                  width: "100%", padding: "13px 16px",
                  border: "1.5px solid var(--c-line)", borderRadius: 12,
                  fontSize: 16, background: "white", color: "var(--c-ink)",
                  fontFamily: "inherit", resize: "vertical", lineHeight: 1.55
                }}
              />
            </div>

            <div className="pe-section">
              <div className="pe-section-title">ราคา</div>
              <div className="form-grid">
                <div className={`field ${errs.price ? "err" : ""}`}>
                  <label>ราคาขาย (฿) *</label>
                  <input type="number" min="0" value={p.price} onChange={(e) => setNum("price", e.target.value)} />
                  {errs.price && <div className="err-msg">{errs.price}</div>}
                </div>
                <div className="field">
                  <label>ราคาเดิม (฿) — เว้นว่างถ้าไม่ลด</label>
                  <input type="number" min="0" value={p.oldPrice || ""} onChange={(e) => setNum("oldPrice", e.target.value || null)} />
                </div>
                <div className="field">
                  <label>ส่วนลด (คำนวณอัตโนมัติ)</label>
                  <input type="number" min="0" max="99" value={p.discount} readOnly style={{ background: "var(--c-surface-2)", color: "var(--c-muted)" }} />
                </div>
              </div>
            </div>

            <div className="pe-section">
              <div className="pe-section-title">ตัวเลือกสินค้า & ราคาต่อแบบ (สี / ขนาด / ประเภท)</div>
              <VariantsEditor
                value={p.variants || {}}
                onChange={(v) => set("variants", v)}
              />
            </div>

            <div className="pe-section">
              <div className="pe-section-title">สถิติและป้ายแสดงผล</div>
              <div className="form-grid">
                <div className="field">
                  <label>จำนวนที่ขายแล้ว</label>
                  <input type="number" min="0" value={p.sold} onChange={(e) => setNum("sold", e.target.value)} />
                </div>
                <div className="field full">
                  <label>ป้ายพิเศษ (เลือกได้หลายอัน)</label>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {BADGE_OPTIONS.map((b) => (
                      <button
                        type="button"
                        key={b.id}
                        className={`chip ${p.badges?.includes(b.id) ? "active" : ""}`}
                        onClick={() => toggleBadge(b.id)}
                      >
                        {p.badges?.includes(b.id) ? Icon.check : Icon.plus} {b.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="pe-actions">
              <button type="button" className="btn btn-ghost" onClick={onClose}>ยกเลิก</button>
              <button type="submit" className="btn btn-primary">
                {Icon.check} {isNew ? "เพิ่มสินค้า" : "บันทึกการแก้ไข"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ---------- Category Manager (add / remove categories) ---------- */
function CategoryManager({ categories, products, onClose, onToast }) {
  const [label, setLabel] = useStatePM("");
  const [confirmDel, setConfirmDel] = useStatePM(null);

  const editable = categories.filter((c) => c.id !== "all");
  const countProducts = (catId) => products.filter((p) => p.cat === catId).length;

  function handleAdd(e) {
    e.preventDefault();
    const name = label.trim();
    if (!name) return;
    try {
      addCategory({ label: name });
      setLabel("");
      onToast(`เพิ่มหมวด "${name}" แล้ว`);
    } catch (err) {
      onToast(err.message || "เพิ่มหมวดไม่สำเร็จ");
    }
  }

  function handleDelete(cat) {
    try {
      deleteCategory(cat.id);
      setConfirmDel(null);
      onToast(`ลบหมวด "${cat.label}" แล้ว`);
    } catch (err) {
      onToast(err.message || "ลบหมวดไม่สำเร็จ");
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal cat-mgr-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>{Icon.close}</button>
        <h2 className="cat-mgr-title">จัดการหมวดหมู่สินค้า</h2>
        <p className="cat-mgr-sub">เพิ่มหรือลบหมวดหมู่ที่แสดงบนแถบเมนูและตัวกรองของหน้าร้าน</p>

        <form className="cat-mgr-add" onSubmit={handleAdd}>
          <input
            placeholder="ชื่อหมวดใหม่ เช่น ธูปเทียน"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            autoFocus
          />
          <button type="submit" className="btn btn-primary">{Icon.plus} เพิ่มหมวด</button>
        </form>

        <div className="cat-mgr-list">
          {editable.length === 0 && (
            <div style={{ color: "var(--c-muted)", fontSize: 14, padding: "16px 0", textAlign: "center" }}>
              ยังไม่มีหมวดหมู่ — เพิ่มหมวดแรกด้านบน
            </div>
          )}
          {editable.map((c) => (
            <div className="cat-mgr-item" key={c.id}>
              <div style={{ minWidth: 0 }}>
                <div className="cat-mgr-item-label">{c.label}</div>
                <div className="cat-mgr-item-meta"><code>{c.id}</code> · {countProducts(c.id)} สินค้า</div>
              </div>
              <button className="btn-danger" onClick={() => setConfirmDel(c)} title="ลบหมวด">
                {Icon.trash}
              </button>
            </div>
          ))}
        </div>

        {confirmDel && (
          <div className="cat-mgr-confirm">
            <div style={{ fontSize: 14, marginBottom: 10 }}>
              ยืนยันลบหมวด <strong>"{confirmDel.label}"</strong>?
              {countProducts(confirmDel.id) > 0 && (
                <div style={{ color: "#B45309", fontSize: 13, marginTop: 6, lineHeight: 1.5 }}>
                  ⚠️ มีสินค้า {countProducts(confirmDel.id)} รายการในหมวดนี้ — สินค้าจะยังอยู่ แต่จะแสดงเฉพาะในหมวด "ทั้งหมด" จนกว่าจะย้ายไปหมวดอื่น
                </div>
              )}
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button className="btn btn-ghost" onClick={() => setConfirmDel(null)}>ยกเลิก</button>
              <button className="btn-danger-solid" onClick={() => handleDelete(confirmDel)}>{Icon.trash} ลบหมวด</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- Variants editor (option groups + price matrix) ---------- */
function VariantsEditor({ value, onChange }) {
  const enabled = !!(value && Array.isArray(value.options) && value.options.length > 0);
  const options = enabled ? value.options : [];
  const matrix = value?.matrix || {};
  const [drafts, setDrafts] = useStatePM({}); // groupIndex -> new choice text
  const [uploadingKey, setUploadingKey] = useStatePM(null);

  function commit(nextOptions, nextMatrix) {
    onChange({ options: nextOptions, matrix: nextMatrix });
  }
  function setImage(key, url) {
    commit(options, { ...matrix, [key]: { ...matrix[key], image: url } });
  }
  async function uploadImage(key, file) {
    if (!file) return;
    setUploadingKey(key);
    try {
      const url = await resizeImageFile(file, 1000);
      setImage(key, url);
    } catch (e) { console.error(e); alert("อัปโหลดรูปไม่สำเร็จ"); }
    finally { setUploadingKey(null); }
  }
  function enable() { onChange({ options: [{ name: "", choices: [] }], matrix: {} }); }
  function disable() { onChange({}); }
  function setGroupName(i, name) {
    commit(options.map((o, idx) => (idx === i ? { ...o, name } : o)), matrix);
  }
  function addGroup() {
    if (options.length >= 3) return;
    commit([...options, { name: "", choices: [] }], matrix);
  }
  function removeGroup(i) {
    commit(options.filter((_, idx) => idx !== i), {}); // combos เปลี่ยน → ล้างราคา
  }
  function addChoice(i) {
    const val = (drafts[i] || "").trim();
    if (!val) return;
    if (!options[i].choices.includes(val)) {
      commit(options.map((o, idx) => (idx === i ? { ...o, choices: [...o.choices, val] } : o)), matrix);
    }
    setDrafts({ ...drafts, [i]: "" });
  }
  function removeChoice(i, ci) {
    commit(options.map((o, idx) => (idx === i ? { ...o, choices: o.choices.filter((_, x) => x !== ci) } : o)), matrix);
  }
  function setPrice(key, field, val) {
    const num = val === "" ? "" : Number(val);
    commit(options, { ...matrix, [key]: { ...matrix[key], [field]: num } });
  }

  if (!enabled) {
    return (
      <div className="var-empty">
        <div style={{ fontSize: 14, color: "var(--c-muted)", marginBottom: 10 }}>
          สินค้านี้มีตัวเลือกให้ลูกค้าเลือกไหม? (เช่น สี · ขนาด · ประเภท — กำหนดราคาแต่ละแบบได้)
        </div>
        <button type="button" className="chip" onClick={enable}>{Icon.plus} เพิ่มตัวเลือกสินค้า</button>
      </div>
    );
  }

  const validOptions = options.filter((o) => o.name?.trim() && o.choices.length);
  const combos = allCombos(validOptions);

  return (
    <div className="var-editor">
      <div style={{ fontSize: 13, color: "var(--c-muted)" }}>
        เมื่อเปิดตัวเลือก ราคาบนการ์ดจะใช้ราคาต่ำสุดของตัวเลือกโดยอัตโนมัติ (ช่อง "ราคาขาย" ด้านบนจะไม่ถูกใช้)
      </div>
      {options.map((o, i) => (
        <div className="var-group" key={i}>
          <div className="var-group-head">
            <input className="var-group-name" placeholder="ชื่อกลุ่ม เช่น ขนาด / สี / ประเภท"
              value={o.name} onChange={(e) => setGroupName(i, e.target.value)} />
            <button type="button" className="spec-del" title="ลบกลุ่มนี้" onClick={() => removeGroup(i)}>{Icon.trash}</button>
          </div>
          <div className="var-choices">
            {o.choices.map((ch, ci) => (
              <span className="var-choice" key={ci}>
                {ch}
                <button type="button" onClick={() => removeChoice(i, ci)}>{Icon.close}</button>
              </span>
            ))}
          </div>
          <div className="var-add-choice">
            <input placeholder="เพิ่มตัวเลือก เช่น 7 นิ้ว แล้วกด Enter"
              value={drafts[i] || ""}
              onChange={(e) => setDrafts({ ...drafts, [i]: e.target.value })}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addChoice(i); } }} />
            <button type="button" className="chip" onClick={() => addChoice(i)}>{Icon.plus} เพิ่ม</button>
          </div>
        </div>
      ))}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {options.length < 3 && (
          <button type="button" className="chip" onClick={addGroup}>{Icon.plus} เพิ่มกลุ่มตัวเลือก</button>
        )}
        <button type="button" className="chip" onClick={disable} style={{ color: "#B91C1C" }}>{Icon.trash} ปิดตัวเลือก (ใช้ราคาเดียว)</button>
      </div>

      {combos.length > 0 && (
        <div className="var-matrix">
          <div className="var-matrix-title">กำหนดราคา + รูปแต่ละแบบ ({combos.length} แบบ)</div>
          <div className="var-matrix-head">
            <span>รูป</span><span>ตัวเลือก</span><span>ราคา (฿)</span><span>ราคาเดิม (฿)</span>
          </div>
          {combos.map((c) => {
            const img = matrix[c.key]?.image;
            return (
              <div className="var-matrix-row" key={c.key}>
                <label className={`var-matrix-img ${img ? "has" : ""}`} title="อัปโหลดรูปสำหรับแบบนี้">
                  <input type="file" accept="image/*" hidden
                    onChange={(e) => { uploadImage(c.key, e.target.files?.[0]); e.target.value = ""; }} />
                  {img
                    ? <img src={img} alt="" />
                    : <span>{uploadingKey === c.key ? "..." : Icon.image}</span>}
                  {img && (
                    <button type="button" className="var-matrix-img-del"
                      onClick={(e) => { e.preventDefault(); setImage(c.key, ""); }} title="ลบรูป">
                      {Icon.close}
                    </button>
                  )}
                </label>
                <span className="var-matrix-label">{c.label}</span>
                <input type="number" min="0" placeholder="0"
                  value={matrix[c.key]?.price ?? ""}
                  onChange={(e) => setPrice(c.key, "price", e.target.value)} />
                <input type="number" min="0" placeholder="—"
                  value={matrix[c.key]?.oldPrice ?? ""}
                  onChange={(e) => setPrice(c.key, "oldPrice", e.target.value)} />
              </div>
            );
          })}
          <div style={{ fontSize: 12, color: "var(--c-muted)", marginTop: 4 }}>
            เมื่อลูกค้าเลือกครบทุกตัวเลือก รูปหลักจะเปลี่ยนเป็นรูปของแบบนั้น (ถ้าอัปไว้)
          </div>
        </div>
      )}
      {combos.length === 0 && (
        <div style={{ fontSize: 13, color: "var(--c-muted)" }}>
          กรอกชื่อกลุ่มและเพิ่มตัวเลือกอย่างน้อย 1 อย่างในแต่ละกลุ่ม เพื่อกำหนดราคา
        </div>
      )}
    </div>
  );
}

/* ---------- Promo slides manager (สไลด์หน้าร้าน) ---------- */
function PromoManager({ onClose, onToast }) {
  const [slides, setSlides] = useStatePM(null); // null = กำลังโหลด
  const [uploading, setUploading] = useStatePM(false);
  const [saving, setSaving] = useStatePM(false);
  const [dragIdx, setDragIdx] = useStatePM(null);

  useEffectPM(() => {
    let cancelled = false;
    loadPromoSlides().then((s) => {
      if (!cancelled) setSlides(s && s.length ? s : DEFAULT_PROMO_SLIDES);
    });
    return () => { cancelled = true; };
  }, []);

  const list = slides || [];

  function update(i, patch) {
    setSlides(list.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  }
  function remove(i) { setSlides(list.filter((_, idx) => idx !== i)); }
  function move(from, to) {
    if (from == null || to == null || from === to || to < 0 || to >= list.length) return;
    const next = list.slice();
    const [m] = next.splice(from, 1);
    next.splice(to, 0, m);
    setSlides(next);
  }
  async function addImages(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const added = [];
      for (const f of files) {
        try {
          const url = await resizeImageFile(f, 1600);
          added.push({ src: url, title: "", sub: "" });
        } catch (err) { console.error(err); }
      }
      setSlides([...list, ...added]);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }
  async function handleSave() {
    setSaving(true);
    try {
      await savePromoSlides(list);
      onToast && onToast("บันทึกสไลด์หน้าร้านแล้ว");
      onClose();
    } catch (e) {
      alert("บันทึกไม่สำเร็จ: " + (e?.message || e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal promo-mgr" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>{Icon.close}</button>
        <h2 className="cat-mgr-title">จัดการสไลด์หน้าร้าน</h2>
        <p style={{ margin: "0 0 16px", color: "var(--c-muted)", fontSize: 14 }}>
          อัปโหลดรูป ลากเพื่อจัดเรียง และใส่ข้อความ (ถ้าต้องการ) · กด “บันทึก” เพื่อให้แสดงในหน้าร้าน
        </p>

        {slides === null ? (
          <div style={{ padding: 30, textAlign: "center", color: "var(--c-muted)" }}>กำลังโหลด...</div>
        ) : (
          <div className="promo-mgr-list">
            {list.map((s, i) => (
              <div
                className={`promo-mgr-item ${dragIdx === i ? "dragging" : ""}`}
                key={i}
                draggable
                onDragStart={() => setDragIdx(i)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); move(dragIdx, i); setDragIdx(null); }}
                onDragEnd={() => setDragIdx(null)}
              >
                <div className="promo-mgr-order">{i + 1}</div>
                <div className="promo-mgr-thumb">
                  <img src={s.src} alt="" draggable={false}
                    onError={(e) => { e.currentTarget.style.opacity = 0.3; }} />
                </div>
                <div className="promo-mgr-fields">
                  <input placeholder="หัวข้อ (ถ้ามี)" value={s.title || ""}
                    onChange={(e) => update(i, { title: e.target.value })} />
                  <input placeholder="คำโปรย (ถ้ามี)" value={s.sub || ""}
                    onChange={(e) => update(i, { sub: e.target.value })} />
                </div>
                <div className="promo-mgr-actions">
                  <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0} title="เลื่อนขึ้น">{Icon.chevronLeft}</button>
                  <button type="button" onClick={() => move(i, i + 1)} disabled={i === list.length - 1} title="เลื่อนลง">{Icon.chevronRight}</button>
                  <button type="button" className="promo-mgr-del" onClick={() => remove(i)} title="ลบ">{Icon.trash}</button>
                </div>
              </div>
            ))}
            {list.length === 0 && (
              <div style={{ padding: 20, textAlign: "center", color: "var(--c-muted)", fontSize: 14 }}>
                ยังไม่มีสไลด์ — กดปุ่มด้านล่างเพื่อเพิ่มรูป
              </div>
            )}
          </div>
        )}

        <div className="promo-mgr-foot">
          <label className="btn btn-outline">
            <input type="file" accept="image/*" multiple hidden onChange={addImages} />
            {Icon.upload} {uploading ? "กำลังอัปโหลด..." : "เพิ่มรูปสไลด์"}
          </label>
          <div style={{ flex: 1 }} />
          <button className="btn btn-ghost" onClick={onClose}>ยกเลิก</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving || slides === null}>
            {saving ? "กำลังบันทึก..." : <>บันทึก {Icon.check}</>}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   RichEditor — WYSIWYG สำหรับคำอธิบายสินค้า
   พิมพ์ข้อความ + แทรกรูป (ปรับขนาด/จัดวาง) + แทรกตาราง ในช่องเดียว
   เก็บค่าเป็น HTML string ใน p.description
   ============================================================ */
function richIsHtml(s) {
  return typeof s === "string" && /<(img|table|p|br|div|span|strong|em|ul|ol|li|figure|h[1-6])\b/i.test(s);
}
function richPlainToHtml(s) {
  if (!s) return "";
  return String(s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>");
}

function RichEditor({ value, onChange }) {
  const ref = React.useRef(null);
  const initial = React.useRef(richIsHtml(value) ? (value || "") : richPlainToHtml(value));
  const savedRange = React.useRef(null);
  const [selImg, setSelImg] = useStatePM(null);
  const [imgW, setImgW] = useStatePM(50);
  const [inTable, setInTable] = useStatePM(false);
  const [uploading, setUploading] = useStatePM(false);

  function emit() { if (ref.current) onChange(ref.current.innerHTML); }

  function saveSel() {
    const s = window.getSelection();
    if (s && s.rangeCount && ref.current && ref.current.contains(s.anchorNode)) {
      savedRange.current = s.getRangeAt(0).cloneRange();
    }
  }

  function currentTable() {
    const s = window.getSelection();
    let n = s && s.anchorNode;
    while (n && n !== ref.current) {
      if (n.tagName === "TABLE") return n;
      n = n.parentNode;
    }
    return null;
  }

  function syncContext() {
    saveSel();
    setInTable(!!currentTable());
  }

  function resolveRange() {
    const s = window.getSelection();
    // 1) ใช้ selection ปัจจุบันถ้าอยู่ในกล่อง editor
    if (s && s.rangeCount && ref.current.contains(s.anchorNode)) {
      return s.getRangeAt(0);
    }
    // 2) ใช้ตำแหน่งที่บันทึกไว้ล่าสุด
    if (savedRange.current && ref.current.contains(savedRange.current.startContainer)) {
      s.removeAllRanges(); s.addRange(savedRange.current);
      return savedRange.current;
    }
    // 3) fallback: ท้ายเนื้อหา
    const r = document.createRange();
    r.selectNodeContents(ref.current); r.collapse(false);
    s.removeAllRanges(); s.addRange(r);
    return r;
  }

  function insertNode(node, addTrailingP) {
    ref.current.focus();
    const s = window.getSelection();
    const r = resolveRange();
    r.deleteContents();
    r.insertNode(node);
    let after = node;
    if (addTrailingP) {
      const pEl = document.createElement("p");
      pEl.innerHTML = "<br>";
      node.after(pEl);
      after = pEl;
    }
    const nr = document.createRange();
    nr.setStartAfter(after); nr.collapse(true);
    s.removeAllRanges(); s.addRange(nr);
    savedRange.current = nr.cloneRange();
    emit();
  }

  async function insertImage(file) {
    if (!file) return;
    setUploading(true);
    try {
      const url = await resizeImageFile(file, 1200);
      const img = document.createElement("img");
      img.src = url;
      img.className = "rich-img align-center";
      img.style.width = "50%";
      insertNode(img, false);
    } catch (e) { console.error(e); alert("อัปโหลดรูปไม่สำเร็จ"); }
    finally { setUploading(false); }
  }

  function insertTable() {
    const t = document.createElement("table");
    t.className = "rich-table";
    const tb = document.createElement("tbody");
    for (let ri = 0; ri < 2; ri++) {
      const tr = document.createElement("tr");
      for (let ci = 0; ci < 2; ci++) {
        const cell = document.createElement(ri === 0 ? "th" : "td");
        cell.innerHTML = "&nbsp;";
        tr.appendChild(cell);
      }
      tb.appendChild(tr);
    }
    t.appendChild(tb);
    insertNode(t, true);
  }

  function onEditorClick(e) {
    if (e.target.tagName === "IMG") {
      if (selImg && selImg !== e.target) selImg.classList.remove("selected");
      e.target.classList.add("selected");
      setSelImg(e.target);
      setImgW(parseInt(e.target.style.width) || 50);
    } else if (selImg) {
      selImg.classList.remove("selected");
      setSelImg(null);
    }
    syncContext();
  }

  function applyWidth(w) {
    setImgW(w);
    if (selImg) { selImg.style.width = w + "%"; emit(); }
  }
  function applyAlign(a) {
    if (!selImg) return;
    selImg.classList.remove("align-left", "align-center", "align-right");
    selImg.classList.add("align-" + a);
    emit();
  }
  function deleteImg() {
    if (!selImg) return;
    selImg.remove(); setSelImg(null); emit();
  }

  function tblAddRow() {
    const t = currentTable(); if (!t) return;
    const cols = t.rows[0] ? t.rows[0].cells.length : 2;
    const body = t.tBodies[0] || t;
    const tr = body.insertRow(-1);
    for (let i = 0; i < cols; i++) { const td = tr.insertCell(-1); td.innerHTML = "&nbsp;"; }
    emit();
  }
  function tblAddCol() {
    const t = currentTable(); if (!t) return;
    Array.from(t.rows).forEach((r, ri) => {
      if (ri === 0) { const th = document.createElement("th"); th.innerHTML = "&nbsp;"; r.appendChild(th); }
      else { const td = r.insertCell(-1); td.innerHTML = "&nbsp;"; }
    });
    emit();
  }
  function tblDelete() {
    const t = currentTable(); if (!t) return;
    t.remove(); setInTable(false); emit();
  }

  // ป้องกันไม่ให้ปุ่ม toolbar แย่ง selection ของ editor
  // แต่ต้องยกเว้น <input> (เช่น slider ปรับขนาด) ไม่งั้น preventDefault จะทำให้ลากไม่ได้
  const keepSel = (e) => { if (e.target.tagName !== "INPUT") e.preventDefault(); };

  return (
    <div className="rich-wrap">
      <div className="rich-toolbar" onMouseDown={keepSel}>
        <label className="rich-btn">
          <input type="file" accept="image/*" hidden
            onChange={(e) => { insertImage(e.target.files?.[0]); e.target.value = ""; }} />
          {Icon.image} {uploading ? "กำลังอัปโหลด..." : "แทรกรูปภาพ"}
        </label>
        <button type="button" className="rich-btn" onClick={insertTable}>
          {Icon.table} แทรกตาราง
        </button>
      </div>

      {selImg && (
        <div className="rich-context" onMouseDown={keepSel}>
          <span className="rich-ctx-label">{Icon.image} รูปภาพ</span>
          <span className="rich-size">
            ขนาด
            <input type="range" min="15" max="100" value={imgW}
              onChange={(e) => applyWidth(Number(e.target.value))} />
            <b>{imgW}%</b>
          </span>
          <span className="rich-align">
            <button type="button" className={selImg.classList.contains("align-left") ? "on" : ""} onClick={() => applyAlign("left")} title="ชิดซ้าย">⬅</button>
            <button type="button" className={selImg.classList.contains("align-center") ? "on" : ""} onClick={() => applyAlign("center")} title="กึ่งกลาง">⬛</button>
            <button type="button" className={selImg.classList.contains("align-right") ? "on" : ""} onClick={() => applyAlign("right")} title="ชิดขวา">➡</button>
          </span>
          <button type="button" className="rich-del" onClick={deleteImg}>{Icon.trash} ลบรูป</button>
        </div>
      )}

      {inTable && !selImg && (
        <div className="rich-context" onMouseDown={keepSel}>
          <span className="rich-ctx-label">{Icon.table} ตาราง</span>
          <button type="button" onClick={tblAddRow}>{Icon.plus} แถว</button>
          <button type="button" onClick={tblAddCol}>{Icon.plus} คอลัมน์</button>
          <button type="button" className="rich-del" onClick={tblDelete}>{Icon.trash} ลบตาราง</button>
        </div>
      )}

      <div
        ref={ref}
        className="rich-editor"
        contentEditable
        suppressContentEditableWarning
        data-placeholder="อธิบายความพิเศษ วัสดุ ที่มาของงาน — แทรกรูปและตารางในเนื้อหาได้เลย..."
        onInput={emit}
        onKeyUp={syncContext}
        onMouseUp={syncContext}
        onBlur={saveSel}
        onClick={onEditorClick}
        dangerouslySetInnerHTML={{ __html: initial.current }}
      />
    </div>
  );
}

export { ProductManager, ProductEditor };
