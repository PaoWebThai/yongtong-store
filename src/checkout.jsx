// Checkout modal — 3 steps: shipping → payment → success

import React from "react";
import { Icon, ProductPlaceholder } from "./icons.jsx";
import { createOrder } from "./orders.jsx";
import { updateMember } from "./members.jsx";
import { cartLines } from "./cart-utils.jsx";

const { useState: useStateCO } = React;

function fmtBaht(n) { return "฿" + n.toLocaleString("th-TH"); }

/* ---------- QR Code visual (real PromptPay image, generated fallback) ---------- */
function QRFallback() {
  // pseudo QR module pattern — used only if the real QR image is missing
  const size = 21;
  const seed = 1771;
  const cells = [];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const v = ((x * 7 + y * 13 + seed) * 2654435761) >>> 0;
      const on = (v & 0xff) < 130;
      const inFinder =
        (x < 7 && y < 7) ||
        (x > size - 8 && y < 7) ||
        (x < 7 && y > size - 8);
      if (!inFinder && on) cells.push({ x, y });
    }
  }
  const finder = (cx, cy) => (
    <>
      <rect x={cx} y={cy} width="7" height="7" fill="currentColor" />
      <rect x={cx + 1} y={cy + 1} width="5" height="5" fill="white" />
      <rect x={cx + 2} y={cy + 2} width="3" height="3" fill="currentColor" />
    </>
  );
  return (
    <>
      <svg viewBox={`0 0 ${size} ${size}`} className="qr-svg">
        <rect width={size} height={size} fill="white" />
        {cells.map((c, i) => (
          <rect key={i} x={c.x} y={c.y} width="1" height="1" fill="currentColor" />
        ))}
        {finder(0, 0)}
        {finder(size - 7, 0)}
        {finder(0, size - 7)}
      </svg>
      <div className="qr-logo-overlay">
        <div className="brand-logo" style={{ width: 36, height: 36 }}>
          <img src="/assets/yongtong-logo.jpeg" alt="ยงค์ทอง" />
        </div>
      </div>
    </>
  );
}

function QRPlaceholder({ amount, payRef }) {
  const [imgFailed, setImgFailed] = useStateCO(false);
  const showReal = !imgFailed;
  return (
    <div className="qr-display">
      <div className="qr-promptpay-head">
        <div className="qr-promptpay-logo">PromptPay</div>
        <div className="qr-promptpay-sub">Thai QR Payment</div>
      </div>
      <div className={`qr-frame ${showReal ? "qr-frame-real" : ""}`}>
        {showReal ? (
          <img
            className="qr-real-img"
            src="/assets/promptpay-qr.png"
            alt="PromptPay QR ยงค์ทอง สังฆภัณฑ์"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <QRFallback />
        )}
      </div>
      <div className="qr-amount-row">
        <div>
          <div className="qr-label">ยอดที่ต้องชำระ</div>
          <div className="qr-amount">{fmtBaht(amount)}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="qr-label">เลขอ้างอิง</div>
          <div className="qr-ref">{payRef}</div>
        </div>
      </div>
      <div className="qr-payee">
        <span>ผู้รับเงิน</span>
        <strong>ยงค์ทอง สังฆภัณฑ์</strong>
      </div>
    </div>
  );
}

/* ---------- Checkout ---------- */
function Checkout({ open, onClose, cart, products, member, onComplete }) {
  const [step, setStep] = useStateCO(1);
  const [shipping, setShipping] = useStateCO({ name: "", phone: "", address: "" });
  const [method, setMethod] = useStateCO("cod");
  const [submitting, setSubmitting] = useStateCO(false);
  const [order, setOrder] = useStateCO(null);
  const [errors, setErrors] = useStateCO({});
  const [payRef, setPayRef] = useStateCO("");

  React.useEffect(() => {
    if (open) {
      setStep(1); setOrder(null); setErrors({});
      setPayRef("YT" + Date.now().toString().slice(-8));
      if (member) {
        setShipping({
          name: member.name || "",
          phone: member.phone || "",
          address: member.address || "",
        });
      }
    }
  }, [open]);

  if (!open) return null;

  const lines = cartLines(cart, products);

  const subtotal = lines.reduce((s, l) => s + l.unitPrice * l.qty, 0);
  const shippingFee = lines.length ? 80 : 0;
  const total = subtotal + shippingFee;

  function validateShipping() {
    const e = {};
    if (!shipping.name.trim()) e.name = "กรุณากรอกชื่อผู้รับ";
    if (!shipping.phone.trim()) e.phone = "กรุณากรอกเบอร์โทรศัพท์";
    else if (!/^[0-9-+\s]{9,}$/.test(shipping.phone)) e.phone = "เบอร์โทรไม่ถูกต้อง";
    if (!shipping.address.trim()) e.address = "กรุณากรอกที่อยู่จัดส่ง";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submitOrder(paid = false) {
    setSubmitting(true);
    try {
      const o = await createOrder({
        items: cart,
        products,
        shipping,
        payment: { method, paid },
        totals: { subtotal, shipping: shippingFee, total },
        memberId: member?.id,
      });
      // Save address back to member profile if logged in
      if (member) {
        try {
          await updateMember(member.id, { address: shipping.address, name: shipping.name });
        } catch (_) { /* non-fatal */ }
      }
      setOrder(o);
      setStep(3);
      onComplete && onComplete(o);
    } catch (e) {
      console.error("submitOrder failed:", e);
      alert("เกิดข้อผิดพลาดในการบันทึกคำสั่งซื้อ กรุณาลองใหม่");
    } finally {
      setSubmitting(false);
    }
  }

  function proceedFromPayment() {
    if (method === "qr") {
      setStep("qr");
    } else {
      submitOrder(false);
    }
  }

  const STATUS_LABEL = {
    pending: "รอยืนยัน",
    confirmed: "ยืนยันแล้ว",
    shipping: "กำลังจัดส่ง",
    delivered: "จัดส่งสำเร็จ",
    cancelled: "ยกเลิก",
  };

  return (
    <div className="modal-backdrop" onClick={step === 3 ? null : onClose}>
      <div className="modal checkout-modal" onClick={(e) => e.stopPropagation()}>
        {step !== 3 && (
          <button className="modal-close" onClick={onClose}>{Icon.close}</button>
        )}

        {/* Steps indicator */}
        {step !== 3 && (
          <div className="step-rail">
            <div className={`step-dot ${step >= 1 || step === "qr" ? "done" : ""}`}>
              <div className="step-bullet">1</div>
              <div className="step-text">ที่อยู่จัดส่ง</div>
            </div>
            <div className={`step-line ${step >= 2 || step === "qr" ? "done" : ""}`}></div>
            <div className={`step-dot ${step >= 2 || step === "qr" ? "done" : ""}`}>
              <div className="step-bullet">2</div>
              <div className="step-text">ชำระเงิน</div>
            </div>
            <div className={`step-line ${step === "qr" ? "done" : ""}`}></div>
            <div className={`step-dot ${step === "qr" ? "done" : ""}`}>
              <div className="step-bullet">3</div>
              <div className="step-text">เสร็จสิ้น</div>
            </div>
          </div>
        )}

        {/* Step 1 — shipping */}
        {step === 1 && (
          <div className="checkout-body">
            <div className="checkout-main">
              <h3 className="checkout-h">ที่อยู่สำหรับจัดส่ง</h3>
              <div className="form-grid">
                <div className={`field ${errors.name ? "err" : ""}`}>
                  <label>ชื่อผู้รับ *</label>
                  <input
                    placeholder="เช่น พระสมชาย ธมฺมรกฺขิโต / คุณสมศรี"
                    value={shipping.name}
                    onChange={(e) => setShipping({ ...shipping, name: e.target.value })}
                  />
                  {errors.name && <div className="err-msg">{errors.name}</div>}
                </div>
                <div className={`field ${errors.phone ? "err" : ""}`}>
                  <label>เบอร์โทรศัพท์ *</label>
                  <input
                    placeholder="08X-XXX-XXXX"
                    value={shipping.phone}
                    onChange={(e) => setShipping({ ...shipping, phone: e.target.value })}
                  />
                  {errors.phone && <div className="err-msg">{errors.phone}</div>}
                </div>
                <div className={`field full ${errors.address ? "err" : ""}`}>
                  <label>ที่อยู่จัดส่ง *</label>
                  <textarea
                    rows="3"
                    placeholder="บ้านเลขที่ / หมู่ / ตำบล / อำเภอ / จังหวัด / รหัสไปรษณีย์"
                    value={shipping.address}
                    onChange={(e) => setShipping({ ...shipping, address: e.target.value })}
                  ></textarea>
                  {errors.address && <div className="err-msg">{errors.address}</div>}
                </div>
              </div>

              <div className="checkout-footer-row">
                <button className="btn btn-ghost" onClick={onClose}>ย้อนกลับไปดูสินค้า</button>
                <button
                  className="btn btn-primary"
                  onClick={() => { if (validateShipping()) setStep(2); }}
                >
                  ถัดไป: ชำระเงิน {Icon.arrow}
                </button>
              </div>
            </div>

            <CheckoutSummary lines={lines} subtotal={subtotal} shippingFee={shippingFee} total={total} />
          </div>
        )}

        {/* Step 2 — payment */}
        {step === 2 && (
          <div className="checkout-body">
            <div className="checkout-main">
              <h3 className="checkout-h">เลือกวิธีชำระเงิน</h3>
              <div className="pay-options">
                <label className={`pay-option ${method === "cod" ? "active" : ""}`}>
                  <input type="radio" name="m" value="cod" checked={method === "cod"} onChange={() => setMethod("cod")} />
                  <div className="pay-icon">{Icon.truck}</div>
                  <div>
                    <div className="pay-name">เก็บเงินปลายทาง (COD)</div>
                    <div className="pay-sub">ชำระเงินสดเมื่อรับสินค้า · มีค่าธรรมเนียม 0 บาท</div>
                  </div>
                  <div className="pay-check">{Icon.check}</div>
                </label>

                <label className={`pay-option ${method === "qr" ? "active" : ""}`}>
                  <input type="radio" name="m" value="qr" checked={method === "qr"} onChange={() => setMethod("qr")} />
                  <div className="pay-icon">{Icon.scan}</div>
                  <div>
                    <div className="pay-name">QR Code พร้อมเพย์</div>
                    <div className="pay-sub">สแกนจ่ายผ่านแอปธนาคาร · ยืนยันทันที</div>
                  </div>
                  <div className="pay-check">{Icon.check}</div>
                </label>
              </div>

              {method === "qr" && (
                <div className="cod-info" style={{ background: "linear-gradient(140deg, rgba(30, 64, 175, 0.07), rgba(30, 64, 175, 0.02))", borderColor: "rgba(30, 64, 175, 0.2)" }}>
                  <div className="cod-info-icon" style={{ color: "#1E40AF" }}>{Icon.scan}</div>
                  <div>
                    <strong>ชำระผ่าน QR พร้อมเพย์</strong>
                    <p>
                      กดปุ่ม "ไปหน้าสแกนชำระเงิน" เพื่อแสดง QR Code สำหรับสแกนจ่ายผ่านแอปธนาคารหรือ
                      แอปเป๋าตัง ระบบจะยืนยันการชำระเงินให้อัตโนมัติ
                    </p>
                  </div>
                </div>
              )}

              {method === "cod" && (
                <div className="cod-info">
                  <div className="cod-info-icon">{Icon.shield}</div>
                  <div>
                    <strong>เก็บเงินปลายทาง</strong>
                    <p>
                      ทางร้านจะติดต่อยืนยันคำสั่งซื้อภายใน 1-3 ชั่วโมง เมื่อจัดส่งสินค้าแล้ว
                      ท่านสามารถชำระเงินสดให้กับพนักงานขนส่งได้เลย
                    </p>
                  </div>
                </div>
              )}

              <div className="checkout-footer-row">
                <button className="btn btn-ghost" onClick={() => setStep(1)}>ย้อนกลับ</button>
                <button className="btn btn-primary" disabled={submitting} onClick={proceedFromPayment}>
                  {submitting
                    ? "กำลังบันทึก..."
                    : (method === "qr"
                      ? <>ไปหน้าสแกนชำระเงิน {Icon.arrow}</>
                      : <>ยืนยันการสั่งซื้อ {Icon.check}</>)}
                </button>
              </div>
            </div>

            <CheckoutSummary lines={lines} subtotal={subtotal} shippingFee={shippingFee} total={total} />
          </div>
        )}

        {/* Step QR — scan to pay */}
        {step === "qr" && (
          <QRPayStep
            amount={total}
            payRef={payRef}
            submitting={submitting}
            onBack={() => setStep(2)}
            onPaid={() => submitOrder(true)}
          />
        )}

        {/* Step 3 — success */}
        {step === 3 && order && (
          <div className="success-body">
            <div className="success-icon">{Icon.check}</div>
            <h2 className="success-title">สั่งซื้อสำเร็จ ขอบคุณค่ะ/ครับ 🙏</h2>
            <p className="success-sub">
              ทางร้านได้รับคำสั่งซื้อของท่านแล้ว และจะติดต่อยืนยันภายในไม่นาน
            </p>
            <div className="success-card">
              <div className="success-row"><span>เลขที่คำสั่งซื้อ</span><strong>{order.id}</strong></div>
              <div className="success-row"><span>วิธีชำระเงิน</span><strong>
                {order.payment.method === "cod" ? "เก็บเงินปลายทาง" : "QR Code พร้อมเพย์"}
              </strong></div>
              <div className="success-row"><span>สถานะการชำระ</span>
                {order.payment.paid
                  ? <span style={{ color: "var(--c-success)", fontWeight: 700 }}>● ชำระเงินแล้ว</span>
                  : <span style={{ color: "var(--c-muted)", fontWeight: 600 }}>● ชำระปลายทาง</span>}
              </div>
              <div className="success-row"><span>สถานะคำสั่งซื้อ</span>
                <span className={`status-pill st-${order.status}`}>{STATUS_LABEL[order.status]}</span>
              </div>
              <div className="success-divider"></div>
              <div className="success-row"><span>ยอดสินค้า</span><span>{fmtBaht(order.totals.subtotal)}</span></div>
              <div className="success-row"><span>ค่าจัดส่ง</span><span>{fmtBaht(order.totals.shipping)}</span></div>
              <div className="success-row grand"><span>รวมทั้งสิ้น</span><strong>{fmtBaht(order.totals.total)}</strong></div>
            </div>
            <div className="success-actions">
              <button className="btn btn-primary" onClick={onClose}>กลับไปดูสินค้า {Icon.arrow}</button>
            </div>
            <div className="success-note">
              เก็บเลขที่คำสั่งซื้อไว้เพื่อใช้ตรวจสอบสถานะ — ทางร้านยินดีรับใช้ทุกท่านครับ
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function QRPayStep({ amount, payRef, submitting, onBack, onPaid }) {
  const [secondsLeft, setSecondsLeft] = useStateCO(600); // 10 min
  const [phase, setPhase] = useStateCO("waiting"); // waiting → scanning → success

  React.useEffect(() => {
    if (phase !== "waiting") return;
    const t = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, [phase]);

  function simulatePay() {
    setPhase("scanning");
    setTimeout(() => {
      setPhase("success");
      setTimeout(() => { onPaid(); }, 1100);
    }, 1800);
  }

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  return (
    <div className="qrpay">
      <div className="qrpay-left">
        <div className="qrpay-headline">
          <h3 className="checkout-h">สแกนเพื่อชำระเงิน</h3>
          <p>เปิดแอปธนาคาร / เป๋าตัง แล้วสแกน QR ด้านขวาเพื่อชำระเงิน</p>
        </div>
        <ol className="qrpay-steps">
          <li><span>1</span> เปิดแอปธนาคารของท่าน เลือกเมนู "สแกน"</li>
          <li><span>2</span> สแกน QR Code พร้อมเพย์ทางด้านขวา</li>
          <li><span>3</span> ตรวจสอบยอดเงินและชื่อร้าน "ยงค์ทอง สังฆภัณฑ์"</li>
          <li><span>4</span> ยืนยันการชำระเงินในแอป</li>
        </ol>
        <div className="qrpay-timer">
          <div className="qrpay-timer-icon">{Icon.clock}</div>
          <div>
            <div className="qrpay-timer-lbl">QR นี้จะหมดอายุใน</div>
            <div className="qrpay-timer-val">{mm}:{ss} นาที</div>
          </div>
        </div>
        <div className="qrpay-note">
          {Icon.info} หน้านี้เป็น <strong>การจำลอง</strong>เพื่อสาธิตขั้นตอนการชำระเงิน —
          กดปุ่มด้านล่างเพื่อจำลองว่าได้สแกนจ่ายเรียบร้อยแล้ว
        </div>
      </div>

      <div className="qrpay-right">
        <div className={`qrpay-qrwrap ${phase}`}>
          <QRPlaceholder amount={amount} payRef={payRef} />
          {phase === "scanning" && (
            <div className="qrpay-overlay">
              <div className="qrpay-scanline"></div>
              <div className="qrpay-overlay-text">กำลังตรวจสอบการชำระเงิน...</div>
            </div>
          )}
          {phase === "success" && (
            <div className="qrpay-overlay success">
              <div className="qrpay-success-check">{Icon.check}</div>
              <div className="qrpay-overlay-text">ชำระเงินสำเร็จ!</div>
            </div>
          )}
        </div>

        {phase === "waiting" && (
          <div className="qrpay-actions">
            <button className="btn btn-ghost" onClick={onBack}>ย้อนกลับ</button>
            <button className="btn btn-primary qrpay-simulate" onClick={simulatePay}>
              {Icon.scan} จำลองการสแกนชำระเงิน
            </button>
          </div>
        )}
        {phase === "scanning" && (
          <div className="qrpay-status">{submitting ? "กำลังบันทึกคำสั่งซื้อ..." : "โปรดรอสักครู่..."}</div>
        )}
        {phase === "success" && (
          <div className="qrpay-status success-text">{Icon.check} ยืนยันการชำระเงินแล้ว กำลังออกใบสั่งซื้อ...</div>
        )}
      </div>
    </div>
  );
}

function CheckoutSummary({ lines, subtotal, shippingFee, total }) {
  return (
    <aside className="checkout-side">
      <h3 className="checkout-h">สรุปคำสั่งซื้อ</h3>
      <div className="summary-lines">
        {lines.map((l) => (
          <div className="summary-line" key={l.key}>
            <div className="summary-thumb"><ProductPlaceholder product={l.product} /></div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div className="summary-name">{l.product.headline}</div>
              {l.variant && <div className="summary-variant">{l.variant.label}</div>}
              <div className="summary-sub">×{l.qty}</div>
            </div>
            <div className="summary-price">{fmtBaht(l.unitPrice * l.qty)}</div>
          </div>
        ))}
      </div>
      <div className="summary-totals">
        <div className="t-row"><span>ยอดสินค้า</span><span>{fmtBaht(subtotal)}</span></div>
        <div className="t-row"><span>ค่าจัดส่ง</span><span>{fmtBaht(shippingFee)}</span></div>
        <div className="t-row grand"><span>รวมทั้งสิ้น</span><strong>{fmtBaht(total)}</strong></div>
      </div>
    </aside>
  );
}

export { Checkout, QRPlaceholder, QRPayStep, fmtBaht };
