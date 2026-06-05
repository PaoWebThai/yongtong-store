// Order tracking modal — search by order ID or show member's orders

import React from "react";
import { Icon, ProductPlaceholder } from "./icons.jsx";
import { getOrdersByPhone, getOrderById } from "./orders.jsx";
import { fmtDateTH } from "./admin.jsx";
import { fmtBaht } from "./checkout.jsx";

const { useState: useStateOT, useEffect: useEffectOT } = React;

const TRACK_STATUS = {
  pending:   { label: "รอยืนยันคำสั่งซื้อ", icon: "clock",  desc: "ร้านกำลังตรวจสอบคำสั่งซื้อของท่าน" },
  confirmed: { label: "ยืนยันคำสั่งซื้อแล้ว", icon: "check", desc: "ร้านยืนยันออเดอร์ กำลังเตรียมจัดส่ง" },
  shipping:  { label: "กำลังจัดส่ง",          icon: "truck", desc: "พัสดุออกจากร้านแล้ว กำลังเดินทางไปหาท่าน" },
  delivered: { label: "จัดส่งสำเร็จ",         icon: "package", desc: "พัสดุถึงปลายทางเรียบร้อยแล้ว" },
  cancelled: { label: "ยกเลิกคำสั่งซื้อ",      icon: "close", desc: "คำสั่งซื้อนี้ถูกยกเลิก" },
};
const TRACK_FLOW = ["pending", "confirmed", "shipping", "delivered"];

function OrderTracking({ member, onClose }) {
  const [query, setQuery] = useStateOT("");
  const [searched, setSearched] = useStateOT(false);
  const [result, setResult] = useStateOT(null);
  const [myOrders, setMyOrders] = useStateOT([]);
  const [searching, setSearching] = useStateOT(false);

  // Load member's own orders (auto-listed)
  useEffectOT(() => {
    let cancelled = false;
    if (!member) { setMyOrders([]); return; }
    (async () => {
      const list = await getOrdersByPhone(member.phone);
      if (!cancelled) setMyOrders(list);
    })();
    return () => { cancelled = true; };
  }, [member?.phone]);

  async function doSearch(e) {
    e && e.preventDefault();
    setSearched(true);
    setSearching(true);
    try {
      const o = await getOrderById(query);
      setResult(o);
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal track-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>{Icon.close}</button>

        <div className="track-head">
          <div className="track-head-icon">{Icon.truck}</div>
          <div>
            <h2 className="track-title">ติดตามคำสั่งซื้อ</h2>
            <p className="track-sub">กรอกเลขที่คำสั่งซื้อเพื่อตรวจสอบสถานะการจัดส่ง</p>
          </div>
        </div>

        <form className="track-search" onSubmit={doSearch}>
          <input
            placeholder="เช่น YT260524-1042"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit" className="btn btn-primary">{Icon.search} ค้นหา</button>
        </form>

        {/* Search result */}
        {searched && (
          result
            ? <OrderTrackCard order={result} />
            : <div className="track-empty">
                <div style={{ fontSize: 40, marginBottom: 10 }}>🔍</div>
                <div style={{ fontSize: 16, color: "var(--c-ink)", marginBottom: 4 }}>ไม่พบคำสั่งซื้อนี้</div>
                <div style={{ fontSize: 14, color: "var(--c-muted)" }}>กรุณาตรวจสอบเลขที่คำสั่งซื้ออีกครั้ง</div>
              </div>
        )}

        {/* Member's orders */}
        {member && !searched && (
          <div className="track-myorders">
            <div className="track-section-label">
              คำสั่งซื้อของ {member.name.split(" ")[0]} ({myOrders.length} รายการ)
            </div>
            {myOrders.length === 0 && (
              <div className="track-empty">
                <div style={{ fontSize: 40, marginBottom: 10 }}>📦</div>
                <div style={{ fontSize: 15, color: "var(--c-ink-2)" }}>ยังไม่มีคำสั่งซื้อ</div>
              </div>
            )}
            {myOrders.map((o) => <OrderTrackCard key={o.id} order={o} collapsed />)}
          </div>
        )}

        {!member && !searched && (
          <div className="track-hint">
            {Icon.info} เข้าสู่ระบบสมาชิกเพื่อดูคำสั่งซื้อทั้งหมดของท่านได้อัตโนมัติ โดยไม่ต้องกรอกเลขที่คำสั่งซื้อ
          </div>
        )}
      </div>
    </div>
  );
}

function OrderTrackCard({ order, collapsed = false }) {
  const [open, setOpen] = useStateOT(!collapsed);
  const cancelled = order.status === "cancelled";
  const currentIdx = TRACK_FLOW.indexOf(order.status);

  return (
    <div className="track-card">
      <div className="track-card-head" onClick={() => setOpen((v) => !v)}>
        <div>
          <div className="track-card-id">{order.id}</div>
          <div className="track-card-meta">
            {fmtDateTH(order.createdAt)} · {order.items.length} รายการ · {fmtBaht(order.totals.total)}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className={`status-pill st-${order.status}`}>{TRACK_STATUS[order.status].label}</span>
          {collapsed && <span className={`track-caret ${open ? "open" : ""}`}>{Icon.chevron}</span>}
        </div>
      </div>

      {open && (
        <div className="track-card-body">
          {/* Progress tracker */}
          {!cancelled ? (
            <div className="track-flow">
              {TRACK_FLOW.map((s, i) => {
                const done = i <= currentIdx;
                const active = i === currentIdx;
                return (
                  <React.Fragment key={s}>
                    <div className={`track-step ${done ? "done" : ""} ${active ? "active" : ""}`}>
                      <div className="track-step-dot">
                        {done ? Icon[TRACK_STATUS[s].icon] : <span>{i + 1}</span>}
                      </div>
                      <div className="track-step-info">
                        <div className="track-step-label">{TRACK_STATUS[s].label}</div>
                        {active && <div className="track-step-desc">{TRACK_STATUS[s].desc}</div>}
                      </div>
                    </div>
                    {i < TRACK_FLOW.length - 1 && <div className={`track-flow-line ${i < currentIdx ? "done" : ""}`}></div>}
                  </React.Fragment>
                );
              })}
            </div>
          ) : (
            <div className="track-cancelled">{Icon.close} {TRACK_STATUS.cancelled.desc}</div>
          )}

          {/* Items */}
          <div className="track-items">
            {order.items.map((it) => (
              <div className="track-item" key={it.id}>
                <div className="track-item-thumb"><ProductPlaceholder product={it} /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="track-item-name">{it.headline}</div>
                  <div className="track-item-sub">×{it.qty}</div>
                </div>
                <div className="track-item-price">{fmtBaht(it.price * it.qty)}</div>
              </div>
            ))}
          </div>

          {/* Payment + shipping */}
          <div className="track-foot">
            <div>
              <div className="track-foot-label">การชำระเงิน</div>
              <div className="track-foot-val">
                {order.payment.method === "cod" ? "เก็บเงินปลายทาง" : "QR พร้อมเพย์"}
                {order.payment.paid
                  ? <span style={{ color: "var(--c-success)", marginLeft: 8 }}>● ชำระแล้ว</span>
                  : <span style={{ color: "var(--c-muted)", marginLeft: 8 }}>● รอชำระ</span>}
              </div>
            </div>
            <div>
              <div className="track-foot-label">จัดส่งถึง</div>
              <div className="track-foot-val">{order.shipping.name}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export { OrderTracking };
