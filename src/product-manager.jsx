// Admin Product Manager — CRUD UI

import React from "react";
import { Icon, ProductPlaceholder } from "./icons.jsx";
import { CATEGORIES, PALETTES } from "./data.jsx";
import {
  loadProducts, updateProduct, addProduct, deleteProduct,
  resetProducts, blankProduct, resizeImageFile,
} from "./products-store.jsx";

const { useState: useStatePM, useEffect: useEffectPM, useMemo: useMemoPM } = React;

const BADGE_OPTIONS = [
  { id: "bestseller", label: "ขายดี" },
  { id: "verified",   label: "ของแท้" },
  { id: "new",        label: "มาใหม่" },
];

function ProductManager() {
  const [items, setItems] = useStatePM([]);
  const [editing, setEditing] = useStatePM(null);    // product object or "new"
  const [filter, setFilter] = useStatePM("all");
  const [search, setSearch] = useStatePM("");
  const [confirmDel, setConfirmDel] = useStatePM(null);
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
          {CATEGORIES.map((c) => (
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
                {CATEGORIES.find((c) => c.id === p.cat)?.label || p.cat}
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
    if (current.length + files.length > 6) {
      alert("เพิ่มรูปได้สูงสุด 6 รูปเท่านั้น");
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
    if (!p.price || p.price <= 0) errors.price = "กรุณากรอกราคาที่ถูกต้อง";
    setErrs(errors);
    if (Object.keys(errors).length) return;
    onSave({
      ...p,
      price: Number(p.price) || 0,
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
              <div className="pe-section-title">รูปภาพสินค้า (สูงสุด 6 รูป)</div>
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
                {(p.images || []).length < 6 && (
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
                  <textarea rows="2" value={p.name} onChange={(e) => set("name", e.target.value)} placeholder="เช่น ขาบาตรไม้แก่นขาม มีทั้งแบบถักลายและลักเรียง" />
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
                    {CATEGORIES.filter((c) => c.id !== "all").map((c) => (
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
                    rows="4"
                    value={p.description}
                    onChange={(e) => set("description", e.target.value)}
                    placeholder="อธิบายความพิเศษ วัสดุ ที่มาของงาน เหมาะกับโอกาสไหน..."
                  />
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
                rows="3"
                value={p.care}
                onChange={(e) => set("care", e.target.value)}
                placeholder="เช่น เช็ดทำความสะอาดด้วยผ้าแห้ง หลีกเลี่ยงความชื้น..."
                style={{
                  width: "100%", padding: "11px 14px",
                  border: "1.5px solid var(--c-line)", borderRadius: 10,
                  fontSize: 14, background: "white", color: "var(--c-ink)",
                  fontFamily: "inherit", resize: "vertical"
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

export { ProductManager, ProductEditor };
