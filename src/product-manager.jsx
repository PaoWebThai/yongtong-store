// Admin Product Manager — CRUD UI

import React from "react";
import { Icon, ProductPlaceholder } from "./icons.jsx";
import { PALETTES } from "./data.jsx";
import { useCategories, addCategory, deleteCategory } from "./categories-store.jsx";
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
                  <div className="pe-image-tile" key={i}>
                    <img src={src} alt="" />
                    {i === 0 && <div className="pe-image-cover">รูปหลัก</div>}
                    <div className="pe-image-actions">
                      {i !== 0 && (
                        <button type="button" onClick={() => moveImageFirst(i)} title="ตั้งเป็นรูปหลัก">
                          {Icon.starOutline}
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
                รูปแรกคือรูปหลักที่แสดงในหน้าร้าน · คลิกดาวเพื่อเปลี่ยนรูปหลัก
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
                  <textarea
                    rows="6"
                    value={p.description}
                    onChange={(e) => set("description", e.target.value)}
                    placeholder="อธิบายความพิเศษ วัสดุ ที่มาของงาน เหมาะกับโอกาสไหน..."
                  />
                </div>
              </div>
            </div>

            <div className="pe-section">
              <div className="pe-section-title">เนื้อหารายละเอียด (แทรกรูป / ตาราง)</div>
              <DetailBlocksEditor
                value={p.detailBlocks || []}
                onChange={(v) => set("detailBlocks", v)}
              />
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

  function commit(nextOptions, nextMatrix) {
    onChange({ options: nextOptions, matrix: nextMatrix });
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
          <div className="var-matrix-title">กำหนดราคาแต่ละแบบ ({combos.length} แบบ)</div>
          <div className="var-matrix-head">
            <span>ตัวเลือก</span><span>ราคา (฿)</span><span>ราคาเดิม (฿)</span>
          </div>
          {combos.map((c) => (
            <div className="var-matrix-row" key={c.key}>
              <span className="var-matrix-label">{c.label}</span>
              <input type="number" min="0" placeholder="0"
                value={matrix[c.key]?.price ?? ""}
                onChange={(e) => setPrice(c.key, "price", e.target.value)} />
              <input type="number" min="0" placeholder="—"
                value={matrix[c.key]?.oldPrice ?? ""}
                onChange={(e) => setPrice(c.key, "oldPrice", e.target.value)} />
            </div>
          ))}
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

/* ---------- Detail content blocks editor (text / image / table) ---------- */
function DetailBlocksEditor({ value, onChange }) {
  const blocks = Array.isArray(value) ? value : [];
  const [uploading, setUploading] = useStatePM(false);

  function update(i, patch) {
    onChange(blocks.map((b, idx) => (idx === i ? { ...b, ...patch } : b)));
  }
  function add(type) {
    const base = type === "text" ? { type, value: "" }
      : type === "image" ? { type, url: "", caption: "" }
      : { type: "table", rows: [["หัวข้อ 1", "หัวข้อ 2"], ["", ""]] };
    onChange([...blocks, base]);
  }
  function remove(i) { onChange(blocks.filter((_, idx) => idx !== i)); }
  function move(i, dir) {
    const j = i + dir;
    if (j < 0 || j >= blocks.length) return;
    const next = blocks.slice();
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  }
  async function uploadImage(i, file) {
    if (!file) return;
    setUploading(true);
    try {
      const url = await resizeImageFile(file, 1200);
      update(i, { url });
    } catch (e) { console.error(e); alert("อัปโหลดรูปไม่สำเร็จ"); }
    finally { setUploading(false); }
  }
  function tableSet(i, ri, ci, val) {
    update(i, { rows: blocks[i].rows.map((r, x) => (x === ri ? r.map((c, y) => (y === ci ? val : c)) : r)) });
  }
  function tableAddRow(i) {
    const cols = blocks[i].rows[0]?.length || 2;
    update(i, { rows: [...blocks[i].rows, Array(cols).fill("")] });
  }
  function tableAddCol(i) {
    update(i, { rows: blocks[i].rows.map((r) => [...r, ""]) });
  }
  function tableDelRow(i, ri) {
    if (blocks[i].rows.length <= 1) return;
    update(i, { rows: blocks[i].rows.filter((_, x) => x !== ri) });
  }
  function tableDelCol(i) {
    if ((blocks[i].rows[0]?.length || 0) <= 1) return;
    update(i, { rows: blocks[i].rows.map((r) => r.slice(0, -1)) });
  }

  return (
    <div className="db-editor">
      {blocks.length === 0 && (
        <div style={{ fontSize: 13, color: "var(--c-muted)" }}>
          ยังไม่มีเนื้อหา — เพิ่มข้อความ รูปภาพ หรือ ตาราง เพื่ออธิบายสินค้าให้ลูกค้าเห็นภาพชัดขึ้น
        </div>
      )}
      {blocks.map((b, i) => (
        <div className="db-block" key={i}>
          <div className="db-block-head">
            <span className="db-block-type">
              {b.type === "text" ? "ข้อความ" : b.type === "image" ? "รูปภาพ" : "ตาราง"}
            </span>
            <div className="db-block-tools">
              <button type="button" onClick={() => move(i, -1)} title="เลื่อนขึ้น">↑</button>
              <button type="button" onClick={() => move(i, 1)} title="เลื่อนลง">↓</button>
              <button type="button" onClick={() => remove(i)} title="ลบ">{Icon.trash}</button>
            </div>
          </div>

          {b.type === "text" && (
            <textarea rows="3" value={b.value} placeholder="พิมพ์ข้อความ..."
              onChange={(e) => update(i, { value: e.target.value })} />
          )}

          {b.type === "image" && (
            <div className="db-image">
              {b.url
                ? <img src={b.url} alt="" className="db-image-preview" />
                : (
                  <label className="db-upload">
                    <input type="file" accept="image/*" hidden
                      onChange={(e) => uploadImage(i, e.target.files?.[0])} />
                    {Icon.upload} {uploading ? "กำลังอัปโหลด..." : "อัปโหลดรูป"}
                  </label>
                )}
              <input placeholder="คำบรรยายใต้ภาพ (ถ้ามี)" value={b.caption || ""}
                onChange={(e) => update(i, { caption: e.target.value })} />
              {b.url && (
                <button type="button" className="chip" onClick={() => update(i, { url: "" })}>
                  {Icon.refresh} เปลี่ยนรูป
                </button>
              )}
            </div>
          )}

          {b.type === "table" && (
            <div className="db-table">
              <table>
                <tbody>
                  {b.rows.map((r, ri) => (
                    <tr key={ri}>
                      {r.map((c, ci) => (
                        <td key={ci}>
                          <input value={c} placeholder={ri === 0 ? "หัวตาราง" : ""}
                            onChange={(e) => tableSet(i, ri, ci, e.target.value)} />
                        </td>
                      ))}
                      <td className="db-table-rowdel">
                        <button type="button" onClick={() => tableDelRow(i, ri)} title="ลบแถว">{Icon.close}</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="db-table-actions">
                <button type="button" className="chip" onClick={() => tableAddRow(i)}>{Icon.plus} แถว</button>
                <button type="button" className="chip" onClick={() => tableAddCol(i)}>{Icon.plus} คอลัมน์</button>
                <button type="button" className="chip" onClick={() => tableDelCol(i)}>{Icon.close} คอลัมน์สุดท้าย</button>
              </div>
              <div style={{ fontSize: 12, color: "var(--c-muted)" }}>แถวแรกคือหัวตาราง</div>
            </div>
          )}
        </div>
      ))}

      <div className="db-add-row">
        <button type="button" className="chip" onClick={() => add("text")}>{Icon.plus} ข้อความ</button>
        <button type="button" className="chip" onClick={() => add("image")}>{Icon.plus} รูปภาพ</button>
        <button type="button" className="chip" onClick={() => add("table")}>{Icon.plus} ตาราง</button>
      </div>
    </div>
  );
}

export { ProductManager, ProductEditor };
