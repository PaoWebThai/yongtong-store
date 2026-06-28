// Admin module — Login + Dashboard

import React from "react";
import { Icon, ProductPlaceholder } from "./icons.jsx";
import {
  loadOrders, updateOrderStatus, markPaid, adminLogin, adminLogout,
} from "./orders.jsx";
import { loadMembers } from "./members.jsx";
import { fmtBaht } from "./checkout.jsx";
import { ProductManager } from "./product-manager.jsx";

const { useState: useStateAd, useEffect: useEffectAd } = React;

const STATUS_LABEL_AD = {
  pending: "รอยืนยัน",
  confirmed: "ยืนยันแล้ว",
  shipping: "กำลังจัดส่ง",
  delivered: "จัดส่งสำเร็จ",
  cancelled: "ยกเลิก",
};
const STATUS_FLOW = ["pending", "confirmed", "shipping", "delivered"];

function fmtDateTH(iso) {
  const d = new Date(iso);
  return d.toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" });
}
function fmtTimeAgo(iso) {
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (d < 60) return "เมื่อสักครู่";
  if (d < 3600) return `${Math.floor(d / 60)} นาทีที่แล้ว`;
  if (d < 86400) return `${Math.floor(d / 3600)} ชั่วโมงที่แล้ว`;
  return `${Math.floor(d / 86400)} วันที่แล้ว`;
}

function AdminLogin({ onClose, onSuccess }) {
  const [u, setU] = useStateAd("");
  const [p, setP] = useStateAd("");
  const [err, setErr] = useStateAd("");
  const [busy, setBusy] = useStateAd(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const ok = await adminLogin(u, p);
      if (ok) onSuccess();
      else setErr("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
    } catch (e2) {
      setErr("เข้าสู่ระบบไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal admin-login-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>{Icon.close}</button>
        <div className="admin-login-side">
          <div className="brand-logo" style={{ width: 64, height: 64 }}>
            <img src="/assets/yongtong-logo.jpeg" alt="ยงค์ทอง" />
          </div>
          <div style={{ marginTop: 14 }}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 20, color: "#FFE9C9" }}>ยงค์ทอง สังฆภัณฑ์</div>
            <div style={{ fontSize: 12, opacity: 0.8, letterSpacing: 1.5, marginTop: 4 }}>ADMIN PORTAL</div>
          </div>
          <ul className="admin-login-features">
            <li>{Icon.check} ดูคำสั่งซื้อทั้งหมด</li>
            <li>{Icon.check} อัปเดตสถานะการจัดส่ง</li>
            <li>{Icon.check} ตรวจสอบยอดขายและสรุปรายวัน</li>
            <li>{Icon.check} จัดการการชำระเงิน COD / QR</li>
          </ul>
        </div>
        <form className="admin-login-form" onSubmit={submit}>
          <h2 className="admin-h">เข้าสู่ระบบผู้ดูแล</h2>
          <p className="admin-sub">ใส่ชื่อผู้ใช้และรหัสผ่านของแอดมินร้าน</p>

          <div className="field">
            <label>ชื่อผู้ใช้</label>
            <input value={u} onChange={(e) => setU(e.target.value)} placeholder="admin" autoFocus />
          </div>
          <div className="field">
            <label>รหัสผ่าน</label>
            <input type="password" value={p} onChange={(e) => setP(e.target.value)} placeholder="••••••••" />
          </div>

          {err && <div className="login-err">{Icon.close} {err}</div>}

          <button type="submit" className="btn btn-primary" disabled={busy} style={{ width: "100%", justifyContent: "center", padding: 14, marginTop: 6 }}>
            {busy ? "กำลังเข้าสู่ระบบ..." : <>เข้าสู่ระบบ {Icon.arrow}</>}
          </button>

          <div className="admin-hint">
            <strong>Demo:</strong> ชื่อผู้ใช้ <code>admin</code> · รหัส <code>yongtong2026</code>
          </div>
        </form>
      </div>
    </div>
  );
}

function AdminDashboard({ onClose }) {
  const [tab, setTab] = useStateAd("orders");
  const [orders, setOrders] = useStateAd([]);
  const [filter, setFilter] = useStateAd("all");
  const [selected, setSelected] = useStateAd(null);
  const [search, setSearch] = useStateAd("");

  useEffectAd(() => {
    let cancelled = false;
    (async () => {
      const list = await loadOrders();
      if (!cancelled) setOrders(list);
    })();
    return () => { cancelled = true; };
  }, []);

  async function refresh() {
    const list = await loadOrders();
    setOrders(list);
  }

  async function setStatus(id, status) {
    await updateOrderStatus(id, status);
    await refresh();
    if (selected && selected.id === id) {
      setSelected({ ...selected, status });
    }
  }
  async function paid(id) {
    await markPaid(id);
    await refresh();
    if (selected && selected.id === id) {
      setSelected({ ...selected, payment: { ...selected.payment, paid: true } });
    }
  }

  return (
    <div className="admin-overlay">
      <header className="admin-topbar">
        <div className="admin-brand">
          <div className="brand-logo" style={{ width: 40, height: 40 }}>
            <img src="/assets/yongtong-logo.jpeg" alt="ยงค์ทอง" />
          </div>
          <div>
            <div className="admin-brand-name">ยงค์ทอง สังฆภัณฑ์</div>
            <div className="admin-brand-sub">Admin Dashboard</div>
          </div>
        </div>
        <div className="admin-tabs">
          <button
            className={`admin-tab ${tab === "orders" ? "active" : ""}`}
            onClick={() => setTab("orders")}
          >
            {Icon.list} คำสั่งซื้อ
          </button>
          <button
            className={`admin-tab ${tab === "products" ? "active" : ""}`}
            onClick={() => setTab("products")}
          >
            {Icon.box} จัดการสินค้า
          </button>
          <button
            className={`admin-tab ${tab === "customers" ? "active" : ""}`}
            onClick={() => setTab("customers")}
          >
            {Icon.users} สมาชิก
          </button>
        </div>
        <div className="admin-top-actions">
          <button className="btn btn-ghost" onClick={onClose}>
            {Icon.store} กลับหน้าร้าน
          </button>
          <button className="btn btn-ghost" onClick={() => { adminLogout(); onClose(); }}>
            {Icon.logout} ออกจากระบบ
          </button>
        </div>
      </header>

      {tab === "orders" && (
        <OrdersTab
          orders={orders}
          filter={filter}
          setFilter={setFilter}
          search={search}
          setSearch={setSearch}
          onSelect={setSelected}
        />
      )}
      {tab === "products" && <ProductManager />}
      {tab === "customers" && <CustomersTab orders={orders} />}

      {selected && (
        <AdminOrderDetail
          order={selected}
          onClose={() => setSelected(null)}
          onSetStatus={(s) => setStatus(selected.id, s)}
          onMarkPaid={() => paid(selected.id)}
        />
      )}
    </div>
  );
}

function OrdersTab({ orders, filter, setFilter, search, setSearch, onSelect }) {
  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    revenue: orders.filter((o) => o.status !== "cancelled").reduce((s, o) => s + o.totals.total, 0),
    today: orders.filter((o) => {
      const d = new Date(o.createdAt);
      const n = new Date();
      return d.toDateString() === n.toDateString();
    }).length,
  };

  let list = orders;
  if (filter !== "all") list = list.filter((o) => o.status === filter);
  if (search.trim()) {
    const q = search.toLowerCase();
    list = list.filter((o) =>
      o.id.toLowerCase().includes(q) ||
      o.shipping.name.toLowerCase().includes(q) ||
      o.shipping.phone.toLowerCase().includes(q)
    );
  }

  return (
    <>
      <div className="admin-stats">
        <div className="admin-stat">
          <div className="admin-stat-icon">{Icon.shopping}</div>
          <div className="admin-stat-num">{stats.total}</div>
          <div className="admin-stat-lbl">คำสั่งซื้อทั้งหมด</div>
        </div>
        <div className="admin-stat">
          <div className="admin-stat-icon" style={{ background: "#FEF3C7", color: "#A16207" }}>{Icon.clock}</div>
          <div className="admin-stat-num">{stats.pending}</div>
          <div className="admin-stat-lbl">รอดำเนินการ</div>
        </div>
        <div className="admin-stat">
          <div className="admin-stat-icon" style={{ background: "#DCFCE7", color: "#15803D" }}>{Icon.coin}</div>
          <div className="admin-stat-num">{fmtBaht(stats.revenue)}</div>
          <div className="admin-stat-lbl">ยอดขายรวม</div>
        </div>
        <div className="admin-stat">
          <div className="admin-stat-icon" style={{ background: "#FFEDD5", color: "#C2410C" }}>{Icon.bell}</div>
          <div className="admin-stat-num">{stats.today}</div>
          <div className="admin-stat-lbl">วันนี้</div>
        </div>
      </div>

      <div className="admin-toolbar">
        <div className="chip-row">
          {[
            { id: "all", label: "ทั้งหมด" },
            { id: "pending", label: STATUS_LABEL_AD.pending },
            { id: "confirmed", label: STATUS_LABEL_AD.confirmed },
            { id: "shipping", label: STATUS_LABEL_AD.shipping },
            { id: "delivered", label: STATUS_LABEL_AD.delivered },
            { id: "cancelled", label: STATUS_LABEL_AD.cancelled },
          ].map((f) => (
            <button
              key={f.id}
              className={`chip ${filter === f.id ? "active" : ""}`}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="admin-search">
          {Icon.search}
          <input
            placeholder="ค้นหาเลขคำสั่งซื้อ ชื่อ หรือเบอร์โทร"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>เลขที่</th>
              <th>ลูกค้า</th>
              <th>สินค้า</th>
              <th>ยอดรวม</th>
              <th>ชำระเงิน</th>
              <th>สถานะ</th>
              <th>เวลา</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 && (
              <tr>
                <td colSpan="8" style={{ textAlign: "center", padding: 48, color: "var(--c-muted)" }}>
                  ไม่พบคำสั่งซื้อในตัวกรองนี้
                </td>
              </tr>
            )}
            {list.map((o) => (
              <tr key={o.id} onClick={() => onSelect(o)}>
                <td><code style={{ fontSize: 12 }}>{o.id}</code></td>
                <td>
                  <div style={{ fontWeight: 600 }}>{o.shipping.name}</div>
                  <div style={{ fontSize: 12, color: "var(--c-muted)" }}>{o.shipping.phone}</div>
                </td>
                <td>
                  <div style={{ fontSize: 13 }}>{o.items.length} รายการ</div>
                  <div style={{ fontSize: 12, color: "var(--c-muted)" }}>{o.items[0]?.headline}{o.items.length > 1 ? ` +${o.items.length - 1}` : ""}</div>
                </td>
                <td><strong style={{ color: "var(--c-price)" }}>{fmtBaht(o.totals.total)}</strong></td>
                <td>
                  <div className={`pay-chip ${o.payment.method}`}>
                    {o.payment.method === "cod" ? "COD" : "QR"}
                  </div>
                  <div style={{ fontSize: 11, color: o.payment.paid ? "var(--c-success)" : "var(--c-muted)", marginTop: 4 }}>
                    {o.payment.paid ? "ชำระแล้ว" : "รอชำระ"}
                  </div>
                </td>
                <td>
                  <span className={`status-pill st-${o.status}`}>{STATUS_LABEL_AD[o.status]}</span>
                </td>
                <td style={{ fontSize: 12, color: "var(--c-muted)" }}>{fmtTimeAgo(o.createdAt)}</td>
                <td><button className="row-action">ดู</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function CustomersTab({ orders }) {
  const [members, setMembers] = useStateAd([]);
  const [search, setSearch] = useStateAd("");
  const [selected, setSelected] = useStateAd(null);

  const [refreshing, setRefreshing] = useStateAd(false);

  useEffectAd(() => {
    let cancelled = false;
    (async () => {
      const list = await loadMembers();
      if (!cancelled) setMembers(list);
    })();
    return () => { cancelled = true; };
  }, []);

  async function refresh() {
    setRefreshing(true);
    try {
      const list = await loadMembers();
      setMembers(list);
    } finally {
      setRefreshing(false);
    }
  }

  function ordersOf(m) {
    const norm = (s) => (s || "").replace(/[-\s]/g, "");
    return orders.filter((o) => norm(o.shipping?.phone) === norm(m.phone));
  }

  let list = members;
  if (search.trim()) {
    const q = search.toLowerCase();
    list = list.filter((m) =>
      m.name.toLowerCase().includes(q) ||
      m.phone.toLowerCase().includes(q) ||
      (m.email || "").toLowerCase().includes(q)
    );
  }

  const totalSpent = (m) => ordersOf(m)
    .filter((o) => o.status !== "cancelled")
    .reduce((s, o) => s + o.totals.total, 0);

  return (
    <>
      <div className="admin-stats">
        <div className="admin-stat">
          <div className="admin-stat-icon">{Icon.users}</div>
          <div className="admin-stat-num">{members.length}</div>
          <div className="admin-stat-lbl">สมาชิกทั้งหมด</div>
        </div>
        <div className="admin-stat">
          <div className="admin-stat-icon" style={{ background: "#DCFCE7", color: "#15803D" }}>{Icon.bell}</div>
          <div className="admin-stat-num">{members.filter((m) => {
            const d = new Date(m.createdAt); const n = new Date();
            return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
          }).length}</div>
          <div className="admin-stat-lbl">สมัครเดือนนี้</div>
        </div>
        <div className="admin-stat">
          <div className="admin-stat-icon" style={{ background: "#FFEDD5", color: "#C2410C" }}>{Icon.shopping}</div>
          <div className="admin-stat-num">{members.filter((m) => ordersOf(m).length > 0).length}</div>
          <div className="admin-stat-lbl">เคยสั่งซื้อ</div>
        </div>
        <div className="admin-stat">
          <div className="admin-stat-icon" style={{ background: "#DBEAFE", color: "#1E40AF" }}>{Icon.coin}</div>
          <div className="admin-stat-num">{fmtBaht(members.reduce((s, m) => s + totalSpent(m), 0))}</div>
          <div className="admin-stat-lbl">ยอดซื้อรวมสมาชิก</div>
        </div>
      </div>

      <div className="admin-toolbar">
        <div style={{ fontSize: 14, color: "var(--c-muted)", fontWeight: 500 }}>
          ฐานข้อมูลลูกค้า ({members.length} ราย)
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div className="admin-search">
            {Icon.search}
            <input placeholder="ค้นหาชื่อ เบอร์ หรืออีเมล" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <button className="btn btn-ghost" onClick={refresh} title="รีเฟรช">{Icon.refresh}</button>
        </div>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>รหัส</th>
              <th>ชื่อ-นามสกุล</th>
              <th>เบอร์โทร</th>
              <th>อีเมล</th>
              <th>คำสั่งซื้อ</th>
              <th>ยอดซื้อรวม</th>
              <th>สมัครเมื่อ</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 && (
              <tr><td colSpan="8" style={{ textAlign: "center", padding: 48, color: "var(--c-muted)" }}>
                {members.length === 0 ? "ยังไม่มีสมาชิก — ลูกค้าสมัครผ่านหน้าร้านจะแสดงที่นี่" : "ไม่พบสมาชิกที่ค้นหา"}
              </td></tr>
            )}
            {list.map((m) => (
              <tr key={m.id} onClick={() => setSelected(m)}>
                <td><code style={{ fontSize: 12 }}>{m.id}</code></td>
                <td style={{ fontWeight: 600 }}>{m.name}</td>
                <td>{m.phone}</td>
                <td style={{ color: "var(--c-muted)", fontSize: 13 }}>{m.email || "—"}</td>
                <td>{ordersOf(m).length} ครั้ง</td>
                <td><strong style={{ color: "var(--c-price)" }}>{fmtBaht(totalSpent(m))}</strong></td>
                <td style={{ fontSize: 12, color: "var(--c-muted)" }}>{new Date(m.createdAt).toLocaleDateString("th-TH", { dateStyle: "medium" })}</td>
                <td><button className="row-action">ดู</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <div className="modal admin-detail-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelected(null)}>{Icon.close}</button>
            <div className="ad-detail-head">
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div className="member-menu-avatar" style={{ width: 52, height: 52, fontSize: 22 }}>{selected.name.charAt(0)}</div>
                <div>
                  <h2 style={{ margin: "0 0 2px", fontFamily: "var(--font-display)", fontSize: 22 }}>{selected.name}</h2>
                  <div style={{ fontSize: 13, color: "var(--c-muted)" }}>สมาชิก {selected.id} · ตั้งแต่ {new Date(selected.createdAt).toLocaleDateString("th-TH", { dateStyle: "long" })}</div>
                </div>
              </div>
            </div>
            <div className="ad-detail-grid">
              <div>
                <h4 className="ad-h">ข้อมูลติดต่อ</h4>
                <div className="ad-card">
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>{Icon.phone}<strong>{selected.phone}</strong></div>
                  <div style={{ fontSize: 14, color: "var(--c-ink-2)" }}>{selected.email || "ไม่ได้ระบุอีเมล"}</div>
                </div>
              </div>
              <div>
                <h4 className="ad-h">ที่อยู่จัดส่ง</h4>
                <div className="ad-card">
                  <div style={{ fontSize: 14, lineHeight: 1.6 }}>{selected.address || "ยังไม่ได้บันทึกที่อยู่"}</div>
                </div>
              </div>
            </div>
            <h4 className="ad-h">ประวัติการสั่งซื้อ ({ordersOf(selected).length})</h4>
            <div className="ad-items">
              {ordersOf(selected).length === 0 && (
                <div style={{ color: "var(--c-muted)", fontSize: 14, padding: "8px 0" }}>ยังไม่มีคำสั่งซื้อ</div>
              )}
              {ordersOf(selected).map((o) => (
                <div className="ad-item" key={o.id}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{o.id}</div>
                    <div style={{ fontSize: 13, color: "var(--c-muted)" }}>{o.items.length} รายการ · {fmtDateTH(o.createdAt)}</div>
                  </div>
                  <span className={`status-pill st-${o.status}`}>{STATUS_LABEL_AD[o.status]}</span>
                  <div style={{ fontWeight: 700, color: "var(--c-price)", minWidth: 90, textAlign: "right" }}>{fmtBaht(o.totals.total)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function AdminOrderDetail({ order, onClose, onSetStatus, onMarkPaid }) {
  const currentIdx = STATUS_FLOW.indexOf(order.status);
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal admin-detail-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>{Icon.close}</button>
        <div className="ad-detail-head">
          <div>
            <div style={{ fontSize: 12, letterSpacing: 1.5, color: "var(--c-muted)" }}>ORDER</div>
            <h2 style={{ margin: "2px 0 4px", fontFamily: "var(--font-display)" }}>{order.id}</h2>
            <div style={{ fontSize: 13, color: "var(--c-muted)" }}>{fmtDateTH(order.createdAt)}</div>
          </div>
          <span className={`status-pill st-${order.status}`} style={{ fontSize: 14, padding: "6px 14px" }}>
            {STATUS_LABEL_AD[order.status]}
          </span>
        </div>

        {/* Progress flow */}
        {order.status !== "cancelled" && (
          <div className="ad-flow">
            {STATUS_FLOW.map((s, i) => (
              <React.Fragment key={s}>
                <div className={`flow-step ${i <= currentIdx ? "done" : ""}`}>
                  <div className="flow-bullet">{i <= currentIdx ? Icon.check : i + 1}</div>
                  <div className="flow-label">{STATUS_LABEL_AD[s]}</div>
                </div>
                {i < STATUS_FLOW.length - 1 && (
                  <div className={`flow-line ${i < currentIdx ? "done" : ""}`}></div>
                )}
              </React.Fragment>
            ))}
          </div>
        )}

        <div className="ad-detail-grid">
          <div>
            <h4 className="ad-h">ที่อยู่จัดส่ง</h4>
            <div className="ad-card">
              <div style={{ fontWeight: 600 }}>{order.shipping.name}</div>
              <div style={{ color: "var(--c-muted)", fontSize: 13 }}>{order.shipping.phone}</div>
              <div style={{ marginTop: 8, fontSize: 14, lineHeight: 1.5 }}>{order.shipping.address}</div>
            </div>
          </div>
          <div>
            <h4 className="ad-h">การชำระเงิน</h4>
            <div className="ad-card">
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <div className={`pay-chip ${order.payment.method}`} style={{ fontSize: 13 }}>
                  {order.payment.method === "cod" ? "เก็บเงินปลายทาง" : "QR Code พร้อมเพย์"}
                </div>
                {order.payment.paid
                  ? <span style={{ color: "var(--c-success)", fontWeight: 600, fontSize: 13 }}>● ชำระแล้ว</span>
                  : <span style={{ color: "var(--c-muted)", fontSize: 13 }}>● รอชำระ</span>}
              </div>
              {!order.payment.paid && (
                <button className="btn btn-outline" style={{ padding: "8px 14px", fontSize: 13 }} onClick={onMarkPaid}>
                  {Icon.check} ทำเครื่องหมายว่าชำระแล้ว
                </button>
              )}
            </div>
          </div>
        </div>

        <h4 className="ad-h">รายการสินค้า</h4>
        <div className="ad-items">
          {order.items.map((it) => (
            <div className="ad-item" key={it.id}>
              <div className="ad-item-thumb"><ProductPlaceholder product={it} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600 }}>{it.headline}</div>
                <div style={{ fontSize: 13, color: "var(--c-muted)" }}>{it.name}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 13, color: "var(--c-muted)" }}>×{it.qty}</div>
                <div style={{ fontWeight: 700, color: "var(--c-price)" }}>{fmtBaht(it.price * it.qty)}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="ad-totals">
          <div className="t-row"><span>ยอดสินค้า</span><span>{fmtBaht(order.totals.subtotal)}</span></div>
          <div className="t-row"><span>ค่าจัดส่ง</span><span>{fmtBaht(order.totals.shipping)}</span></div>
          <div className="t-row grand"><span>รวมทั้งสิ้น</span><strong>{fmtBaht(order.totals.total)}</strong></div>
        </div>

        <div className="ad-detail-actions">
          {order.status === "pending" && (
            <>
              <button className="btn btn-ghost" onClick={() => onSetStatus("cancelled")}>{Icon.close} ยกเลิกคำสั่งซื้อ</button>
              <button className="btn btn-primary" onClick={() => onSetStatus("confirmed")}>{Icon.check} ยืนยันคำสั่งซื้อ</button>
            </>
          )}
          {order.status === "confirmed" && (
            <button className="btn btn-primary" onClick={() => onSetStatus("shipping")}>{Icon.truck} เริ่มจัดส่ง</button>
          )}
          {order.status === "shipping" && (
            <button className="btn btn-primary" onClick={() => onSetStatus("delivered")}>{Icon.check} ยืนยันส่งสำเร็จ</button>
          )}
          {(order.status === "delivered" || order.status === "cancelled") && (
            <button className="btn btn-ghost" onClick={onClose}>ปิด</button>
          )}
        </div>
      </div>
    </div>
  );
}

export { AdminLogin, AdminDashboard, CustomersTab, fmtDateTH, fmtTimeAgo, STATUS_LABEL_AD };
