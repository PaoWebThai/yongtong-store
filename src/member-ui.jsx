// Member auth modal (login / register) + account panel

import React from "react";
import { Icon } from "./icons.jsx";
import { registerMember, loginMember } from "./members.jsx";
import { STATUS_LABEL_AD } from "./admin.jsx";

const { useState: useStateMem } = React;

function MemberAuthModal({ initialMode = "login", onClose, onAuth }) {
  const [mode, setMode] = useStateMem(initialMode);  // "login" | "register"
  const [form, setForm] = useStateMem({ name: "", phone: "", email: "", password: "", address: "" });
  const [err, setErr] = useStateMem("");
  const [busy, setBusy] = useStateMem(false);

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const res = mode === "register"
        ? await registerMember(form)
        : await loginMember(form.phone, form.password);
      if (res.ok) {
        onAuth(res.member);
      } else {
        setErr(res.error);
      }
    } catch (e2) {
      setErr("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal member-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>{Icon.close}</button>

        <div className="member-side">
          <div className="brand-logo" style={{ width: 64, height: 64 }}>
            <img src="/assets/yongtong-logo.jpeg" alt="ยงค์ทอง" />
          </div>
          <div style={{ marginTop: 14 }}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 22, color: "#FFE9C9" }}>
              ยงค์ทอง สังฆภัณฑ์
            </div>
            <div style={{ fontSize: 13, opacity: 0.85, marginTop: 6, lineHeight: 1.6 }}>
              สมัครสมาชิกเพื่อความสะดวกในการสั่งซื้อ บันทึกที่อยู่จัดส่ง และติดตามคำสั่งซื้อของท่าน
            </div>
          </div>
          <ul className="member-features">
            <li>{Icon.check} บันทึกที่อยู่ ไม่ต้องกรอกซ้ำ</li>
            <li>{Icon.check} ดูประวัติการสั่งซื้อ</li>
            <li>{Icon.check} รับข่าวสารงานบุญและโปรโมชั่น</li>
          </ul>
        </div>

        <form className="member-form" onSubmit={submit}>
          <div className="member-tabs">
            <button type="button" className={mode === "login" ? "active" : ""} onClick={() => { setMode("login"); setErr(""); }}>
              เข้าสู่ระบบ
            </button>
            <button type="button" className={mode === "register" ? "active" : ""} onClick={() => { setMode("register"); setErr(""); }}>
              สมัครสมาชิก
            </button>
          </div>

          {mode === "register" && (
            <div className="field">
              <label>ชื่อ - นามสกุล *</label>
              <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="เช่น คุณสมศรี ใจบุญ" autoFocus />
            </div>
          )}

          <div className="field">
            <label>เบอร์โทรศัพท์ *</label>
            <input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="08X-XXX-XXXX" autoFocus={mode === "login"} />
          </div>

          {mode === "register" && (
            <div className="field">
              <label>อีเมล (ถ้ามี)</label>
              <input value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="example@email.com" />
            </div>
          )}

          <div className="field">
            <label>รหัสผ่าน *</label>
            <input type="password" value={form.password} onChange={(e) => set("password", e.target.value)} placeholder="อย่างน้อย 4 ตัวอักษร" />
          </div>

          {mode === "register" && (
            <div className="field">
              <label>ที่อยู่จัดส่ง (ถ้ามี)</label>
              <textarea rows="2" value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="บ้านเลขที่ / ตำบล / อำเภอ / จังหวัด / รหัสไปรษณีย์" />
            </div>
          )}

          {err && <div className="login-err">{Icon.close} {err}</div>}

          <button type="submit" className="btn btn-primary" disabled={busy} style={{ width: "100%", justifyContent: "center", padding: 14, marginTop: 4 }}>
            {busy ? "กำลังดำเนินการ..." : (mode === "register" ? <>สมัครสมาชิก {Icon.arrow}</> : <>เข้าสู่ระบบ {Icon.arrow}</>)}
          </button>

          <div className="member-switch">
            {mode === "login" ? (
              <span>ยังไม่มีบัญชี? <button type="button" onClick={() => { setMode("register"); setErr(""); }}>สมัครสมาชิกใหม่</button></span>
            ) : (
              <span>เป็นสมาชิกอยู่แล้ว? <button type="button" onClick={() => { setMode("login"); setErr(""); }}>เข้าสู่ระบบ</button></span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

// Small dropdown panel for logged-in member
function MemberMenu({ member, orders, onClose, onLogout, onTrack }) {
  const myOrders = orders.filter((o) => {
    const norm = (s) => (s || "").replace(/[-\s]/g, "");
    return norm(o.shipping?.phone) === norm(member.phone);
  });
  return (
    <>
      <div className="menu-backdrop" onClick={onClose}></div>
      <div className="member-menu">
        <div className="member-menu-head">
          <div className="member-menu-avatar">{member.name.charAt(0)}</div>
          <div style={{ minWidth: 0 }}>
            <div className="member-menu-name">{member.name}</div>
            <div className="member-menu-phone">{member.phone}</div>
          </div>
        </div>
        <div className="member-menu-stat">
          <div>
            <div className="member-menu-stat-num">{myOrders.length}</div>
            <div className="member-menu-stat-lbl">คำสั่งซื้อ</div>
          </div>
          <div>
            <div className="member-menu-stat-num">สมาชิก</div>
            <div className="member-menu-stat-lbl">ตั้งแต่ {new Date(member.createdAt).toLocaleDateString("th-TH", { year: "numeric", month: "short" })}</div>
          </div>
        </div>
        {myOrders.length > 0 && (
          <div className="member-menu-orders">
            <div className="member-menu-section-title">คำสั่งซื้อล่าสุด</div>
            {myOrders.slice(0, 3).map((o) => (
              <div className="member-menu-order" key={o.id}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{o.id}</div>
                  <div style={{ fontSize: 11, color: "var(--c-muted)" }}>{o.items.length} รายการ</div>
                </div>
                <span className={`status-pill st-${o.status}`} style={{ fontSize: 11 }}>{STATUS_LABEL_AD[o.status]}</span>
              </div>
            ))}
          </div>
        )}
        <button className="member-menu-track" onClick={onTrack}>
          {Icon.truck} ติดตามคำสั่งซื้อของฉัน
        </button>
        <button className="member-menu-logout" onClick={onLogout}>
          {Icon.logout} ออกจากระบบ
        </button>
      </div>
    </>
  );
}

export { MemberAuthModal, MemberMenu };
