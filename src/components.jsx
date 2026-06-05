// Sub-components for ยงค์ทอง — Header, Hero, ProductCard, CartDrawer, ProductModal

import React from "react";
import { Icon, ProductPlaceholder } from "./icons.jsx";
import { STORE, CATEGORIES } from "./data.jsx";

function fmt(n) {
  return n.toLocaleString("th-TH");
}

/* ---------- TopBar ---------- */
function TopBar({ onTrackClick }) {
  return (
    <div className="topbar">
      <div className="topbar-inner" style={{ justifyContent: "flex-end" }}>
        <div className="topbar-links">
          <a style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {Icon.globe} ภาษาไทย
          </a>
          <span className="topbar-divider">|</span>
          <a>ช่วยเหลือ</a>
          <span className="topbar-divider">|</span>
          <a onClick={onTrackClick} style={{ cursor: "pointer" }}>ติดตามคำสั่งซื้อ</a>
        </div>
      </div>
    </div>
  );
}

/* ---------- Header ---------- */
function Header({ cartCount, wishCount, search, setSearch, activeCat, setActiveCat, onCartOpen, onWishOpen, member, onMemberClick }) {
  return (
    <header className="header">
      <div className="header-inner">
        <a className="brand-mark">
          <div className="brand-logo">
            <img src="/assets/yongtong-logo.jpeg" alt="ยงค์ทอง สังฆภัณฑ์" />
          </div>
          <div className="brand-text">
            <div className="brand-name">ยงค์ทอง</div>
            <div className="brand-sub">สังฆภัณฑ์ · อ.วานรนิวาส จ.สกลนคร</div>
          </div>
        </a>

        <div className="search-shell">
          <input
            className="search-input"
            placeholder="ค้นหาบาตรพระ, ขาบาตร, ผ้าไตรจีวร, กลด..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="search-btn">
            {Icon.search}<span className="lbl">ค้นหา</span>
          </button>
        </div>

        <div className="header-actions">
          <button className="icon-btn" onClick={onCartOpen} title="ตะกร้า">
            {Icon.cart}
            {cartCount > 0 && <span className="icon-badge">{cartCount}</span>}
          </button>
          <button className="member-chip" onClick={onMemberClick}>
            <div className="member-chip-avatar">
              {member ? member.name.charAt(0) : Icon.user}
            </div>
            <span className="member-chip-text">
              {member ? member.name.split(" ")[0] : "เข้าสู่ระบบ"}
            </span>
          </button>
        </div>
      </div>

      <nav className="catnav">
        <div className="catnav-inner">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              className={`catnav-item ${activeCat === c.id ? "active" : ""}`}
              onClick={() => setActiveCat(c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>
      </nav>
    </header>
  );
}

/* ---------- Hero / store info ---------- */
function Hero({ following, setFollowing }) {
  return (
    <section className="hero">
      <div className="hero-inner">
        <div className="hero-card">
          <div className="hero-emblem">
            <img src="/assets/yongtong-logo.jpeg" alt="ยงค์ทอง สังฆภัณฑ์" />
          </div>
          <div className="hero-meta">
            <div className="hero-status">{STORE.online ? "ออนไลน์อยู่" : "ออฟไลน์"} · ตอบเร็ว</div>
            <h1 className="hero-name">{STORE.name}</h1>
            <p className="hero-tag">{STORE.tagline}</p>
            <div className="hero-actions">
              <button className="btn btn-ghost">
                {Icon.chat} แชทกับร้าน
              </button>
            </div>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">{Icon.store}</div>
            <div className="stat-value">{STORE.productCount}<span className="unit">รายการ</span></div>
            <div className="stat-label">สินค้าทั้งหมด</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">{Icon.users}</div>
            <div className="stat-value">{fmt(STORE.followers)}</div>
            <div className="stat-label">ลูกค้าประจำ</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">{Icon.chat}</div>
            <div className="stat-value">{STORE.responseRate}<span className="unit">%</span></div>
            <div className="stat-label">ตอบเร็วภายในไม่กี่ชั่วโมง</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">{Icon.clock}</div>
            <div className="stat-value">{STORE.years}<span className="unit">ปี</span></div>
            <div className="stat-label">ประสบการณ์งานสังฆภัณฑ์</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">{Icon.truck}</div>
            <div className="stat-value">ทั่ว<span className="unit">ประเทศ</span></div>
            <div className="stat-label">บริการจัดส่งทุกจังหวัด</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">{Icon.shield}</div>
            <div className="stat-value">100<span className="unit">%</span></div>
            <div className="stat-label">งานหัตถกรรมแท้ จากช่างฝีมือ</div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- About store ---------- */
function AboutStore() {
  return (
    <section className="about" id="about" data-screen-label="About">
      <div className="about-inner">
        <div className="about-head">
          <span className="about-eyebrow">เรื่องราวของเรา</span>
          <h2 className="about-title">สืบสานศรัทธา กว่า 30 ปี</h2>
        </div>
        <div className="about-grid">
          <div className="about-body">
            <p>{STORE.about}</p>
          </div>
          <div className="about-pillars">
            <div className="about-pillar">
              <div className="about-pillar-icon">{Icon.store}</div>
              <div>
                <strong>ผู้ผลิตครบวงจร</strong>
                <p>บริขารพระ ของใช้พระสงฆ์ และเครื่องประกอบศาสนพิธี</p>
              </div>
            </div>
            <div className="about-pillar">
              <div className="about-pillar-icon">{Icon.shield}</div>
              <div>
                <strong>ซื่อสัตย์ คุ้มค่า</strong>
                <p>คัดสรรคุณภาพ ประณีต เพื่อให้นำไปใช้ในวัตรปฏิบัติได้จริง</p>
              </div>
            </div>
            <div className="about-pillar">
              <div className="about-pillar-icon">{Icon.clock}</div>
              <div>
                <strong>เติบโตเคียงข้างศรัทธา</strong>
                <p>จากร้าน 2 คูหา สู่ความไว้วางใจมากว่า 30 ปี</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
function ProductCard({ product, onOpen, onAdd, onWish, isWished }) {
  return (
    <article className="product-card" onClick={() => onOpen(product)}>
      <div className="product-media">
        <div className="product-cover">
          <ProductPlaceholder product={product} />
        </div>
        <div className="product-badges">
          {product.badges.includes("bestseller") && (
            <span className="badge badge-bestseller">{Icon.flame} ขายดี</span>
          )}
          {product.badges.includes("verified") && (
            <span className="badge badge-verified">{Icon.check} แท้</span>
          )}
          {product.badges.includes("new") && (
            <span className="badge badge-new">มาใหม่</span>
          )}
        </div>
        {product.discount > 0 && (
          <div className="badge-discount">-{product.discount}%</div>
        )}
        <button
          className="product-quickadd"
          onClick={(e) => { e.stopPropagation(); onAdd(product); }}
          title="เพิ่มลงตะกร้า"
        >
          {Icon.cart}
        </button>
      </div>
      <div className="product-info">
        <div className="product-name">{product.name}</div>
        <div className="product-price-row">
          <span className="product-price">
            <span className="currency">฿</span>{fmt(product.price)}
          </span>
          {product.oldPrice && (
            <span className="product-oldprice">฿{fmt(product.oldPrice)}</span>
          )}
        </div>
        <div className="product-meta">
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            ขายแล้ว <strong style={{ color: "var(--c-ink)", fontFeatureSettings: '"tnum"' }}>{product.sold}</strong> ชิ้น
          </span>
          <span className="product-location">{Icon.pin} {product.location}</span>
        </div>
      </div>
    </article>
  );
}

/* ---------- Cart Drawer ---------- */
function CartDrawer({ open, onClose, items, products, setCart, onCheckout }) {
  if (!open) return null;
  const lines = Object.entries(items).map(([id, qty]) => {
    const p = products.find((x) => x.id === Number(id));
    return p ? { ...p, qty } : null;
  }).filter(Boolean);
  const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const shipping = lines.length ? 80 : 0;
  const total = subtotal + shipping;

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose}></div>
      <aside className="drawer">
        <header className="drawer-head">
          <h3 className="drawer-title">
            {Icon.cart}
            <span>ตะกร้าของฉัน</span>
            {lines.length > 0 && <span className="drawer-count">({lines.length} รายการ)</span>}
          </h3>
          <button className="drawer-close" onClick={onClose}>{Icon.close}</button>
        </header>
        <div className="drawer-body">
          {lines.length === 0 && (
            <div className="drawer-empty">
              <div className="drawer-empty-icon">{Icon.cart}</div>
              <div style={{ fontSize: 15, color: "var(--c-ink)", marginBottom: 4 }}>ตะกร้ายังว่างอยู่</div>
              <div style={{ fontSize: 13 }}>เลือกสินค้าจากร้านของเราได้เลย</div>
            </div>
          )}
          {lines.map((l) => (
            <div className="cart-item" key={l.id}>
              <div className="cart-item-thumb">
                <ProductPlaceholder product={l} />
              </div>
              <div className="cart-item-body">
                <div className="cart-item-name">{l.name}</div>
                <div className="cart-item-price">฿{fmt(l.price)}</div>
                <div className="cart-item-controls">
                  <div className="qty">
                    <button className="qty-btn" onClick={() => {
                      const next = { ...items };
                      if (next[l.id] <= 1) delete next[l.id];
                      else next[l.id] -= 1;
                      setCart(next);
                    }}>{Icon.minus}</button>
                    <span className="qty-val">{l.qty}</span>
                    <button className="qty-btn" onClick={() => setCart({ ...items, [l.id]: l.qty + 1 })}>{Icon.plus}</button>
                  </div>
                  <button className="cart-item-remove" onClick={() => {
                    const next = { ...items }; delete next[l.id]; setCart(next);
                  }}>ลบ</button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {lines.length > 0 && (
          <div className="drawer-foot">
            <div className="drawer-totals"><span>ยอดสินค้า</span><span>฿{fmt(subtotal)}</span></div>
            <div className="drawer-totals"><span>ค่าจัดส่ง</span><span>฿{fmt(shipping)}</span></div>
            <div className="drawer-grand"><span>รวมทั้งสิ้น</span><span className="total">฿{fmt(total)}</span></div>
            <button className="checkout-btn" onClick={onCheckout}>
              ดำเนินการสั่งซื้อ {Icon.arrow}
            </button>
          </div>
        )}
      </aside>
    </>
  );
}

/* ---------- Product Modal ---------- */
function ProductModal({ product, onClose, onAdd }) {
  const [qty, setQty] = React.useState(1);
  const [activeImg, setActiveImg] = React.useState(0);
  React.useEffect(() => { setQty(1); setActiveImg(0); }, [product?.id]);
  if (!product) return null;
  const hasImages = product.images && product.images.length > 0;
  const galleryImages = hasImages ? product.images : [null]; // null means placeholder

  function renderGalleryItem(img, fullsize = false) {
    if (img) return <img src={img} alt={product.name} className="pad-img" />;
    return <ProductPlaceholder product={product} />;
  }

  const hasDetails =
    (product.description && product.description.trim()) ||
    (product.specs && product.specs.length > 0) ||
    (product.includes && product.includes.length > 0) ||
    (product.care && product.care.trim());

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal pd-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>{Icon.close}</button>

        <div className="pd-grid">
          {/* LEFT: Gallery */}
          <div className="pd-gallery">
            <div className="pd-main">
              {renderGalleryItem(galleryImages[activeImg])}
              {product.discount > 0 && (
                <div className="badge-discount" style={{ top: 16, right: 16, fontSize: 14, padding: "6px 12px" }}>
                  -{product.discount}%
                </div>
              )}
              <div className="pd-badges">
                {product.badges?.includes("bestseller") && <span className="badge badge-bestseller">{Icon.flame} ขายดี</span>}
                {product.badges?.includes("verified") && <span className="badge badge-verified">{Icon.check} ของแท้</span>}
                {product.badges?.includes("new") && <span className="badge badge-new">มาใหม่</span>}
              </div>
            </div>
            {galleryImages.length > 1 && (
              <div className="pd-thumbs">
                {galleryImages.map((img, i) => (
                  <button
                    key={i}
                    className={`pd-thumb ${activeImg === i ? "active" : ""}`}
                    onClick={() => setActiveImg(i)}
                  >
                    {renderGalleryItem(img)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: Info */}
          <div className="pd-info">
            <div className="modal-cat">{CATEGORIES.find((c) => c.id === product.cat)?.label}</div>
            <h2 className="modal-name">{product.name}</h2>
            <div className="modal-rating-row">
              <span>ขายแล้ว <strong>{product.sold}</strong> ชิ้น</span>
              <span className="sep">|</span>
              <span>จัดส่งจาก <strong>{product.location}</strong></span>
            </div>
            <div className="modal-price-row">
              <span className="modal-price">฿{fmt(product.price)}</span>
              {product.oldPrice && <span className="modal-oldprice">฿{fmt(product.oldPrice)}</span>}
              {product.discount > 0 && <span className="modal-discount">ประหยัด {product.discount}%</span>}
            </div>

            <div className="pd-perks">
              <div className="pd-perk">
                <div className="pd-perk-icon">{Icon.truck}</div>
                <div>
                  <strong>จัดส่งทั่วประเทศ</strong>
                  <div className="pd-perk-sub">ส่งจาก {product.location} · 2-4 วันทำการ</div>
                </div>
              </div>
              <div className="pd-perk">
                <div className="pd-perk-icon">{Icon.shield}</div>
                <div>
                  <strong>รับประกันของแท้</strong>
                  <div className="pd-perk-sub">งานช่างฝีมือคุณภาพ 100%</div>
                </div>
              </div>
              <div className="pd-perk">
                <div className="pd-perk-icon">{Icon.coin}</div>
                <div>
                  <strong>เก็บปลายทาง / สแกนจ่าย</strong>
                  <div className="pd-perk-sub">เลือกได้ทั้งสองวิธี</div>
                </div>
              </div>
            </div>

            <div className="modal-qty-row">
              <span>จำนวน</span>
              <div className="qty">
                <button className="qty-btn" onClick={() => setQty((q) => Math.max(1, q - 1))}>{Icon.minus}</button>
                <span className="qty-val">{qty}</span>
                <button className="qty-btn" onClick={() => setQty((q) => q + 1)}>{Icon.plus}</button>
              </div>
              <span style={{ color: "var(--c-muted)", fontSize: 14 }}>มีในสต็อก</span>
            </div>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => { onAdd(product, qty); }}>
                {Icon.cart} เพิ่มลงตะกร้า
              </button>
              <button className="btn btn-primary" onClick={() => { onAdd(product, qty); onClose(); }}>
                ซื้อทันที {Icon.arrow}
              </button>
            </div>
          </div>
        </div>

        {/* DETAIL SECTIONS */}
        {hasDetails && (
          <div className="pd-details">
            {product.description && product.description.trim() && (
              <section className="pd-section">
                <h3 className="pd-section-title">{Icon.info} รายละเอียดสินค้า</h3>
                <p className="pd-section-body">{product.description}</p>
              </section>
            )}

            {product.specs && product.specs.length > 0 && (
              <section className="pd-section">
                <h3 className="pd-section-title">{Icon.list} ข้อมูลจำเพาะ</h3>
                <div className="pd-specs">
                  {product.specs.map((s, i) => (
                    <div className="pd-spec-row" key={i}>
                      <span className="pd-spec-key">{s.key}</span>
                      <span className="pd-spec-val">{s.value}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {product.includes && product.includes.length > 0 && (
              <section className="pd-section">
                <h3 className="pd-section-title">{Icon.package} ในชุดประกอบด้วย</h3>
                <ul className="pd-includes">
                  {product.includes.map((it, i) => (
                    <li key={i}><span className="pd-inc-bullet">{Icon.check}</span>{it}</li>
                  ))}
                </ul>
              </section>
            )}

            {product.care && product.care.trim() && (
              <section className="pd-section">
                <h3 className="pd-section-title">{Icon.shield} วิธีใช้งานและการดูแลรักษา</h3>
                <p className="pd-section-body">{product.care}</p>
              </section>
            )}
          </div>
        )}

        {!hasDetails && (
          <div className="pd-empty">
            <div style={{ fontSize: 20, marginBottom: 8 }}>📜</div>
            <div style={{ fontSize: 15, color: "var(--c-ink-2)" }}>
              สินค้านี้ยังไม่มีรายละเอียดเพิ่มเติม สนใจสอบถามได้ที่ Facebook ของร้านครับ
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- Footer ---------- */
function Footer({ onAdminClick }) {
  const c = STORE.contact;
  return (
    <footer className="footer" id="contact" data-screen-label="Contact">
      <div className="footer-inner">
        <div className="footer-grid">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div className="brand-logo" style={{ width: 44, height: 44 }}>
                <img src="/assets/yongtong-logo.jpeg" alt="ยงค์ทอง" />
              </div>
              <div style={{ color: "#FFE9C9", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18 }}>
                ยงค์ทอง สังฆภัณฑ์
              </div>
            </div>
            <div style={{ fontSize: 14, lineHeight: 1.7, maxWidth: 340 }}>
              ผู้ผลิตและจัดจำหน่ายบริขารพระ ของใช้สำหรับพระสงฆ์ และเครื่องประกอบศาสนพิธีครบวงจร สืบสานศรัทธามากว่า 30 ปี
            </div>
            <div className="footer-socials">
              <a href={c.facebookUrl} target="_blank" rel="noopener noreferrer" className="footer-social fb" title="Facebook">{Icon.facebook}</a>
              <a href={c.lineUrl} target="_blank" rel="noopener noreferrer" className="footer-social line" title="Line">{Icon.line}</a>
              <a href={c.shopeeUrl} target="_blank" rel="noopener noreferrer" className="footer-social shopee" title="Shopee">{Icon.bag}</a>
              <a href={c.tiktokUrl} target="_blank" rel="noopener noreferrer" className="footer-social tiktok" title="TikTok">{Icon.music}</a>
            </div>
          </div>

          <div>
            <h4>ติดต่อสั่งซื้อ</h4>
            <ul className="footer-contact">
              <li>
                <span className="fc-icon">{Icon.phone}</span>
                <span>
                  <a href={`tel:${c.phones[0].replace(/-/g, "")}`}>{c.phones[0]}</a><br />
                  <a href={`tel:${c.phones[1].replace(/-/g, "")}`}>{c.phones[1]}</a>
                </span>
              </li>
              <li>
                <span className="fc-icon">{Icon.chat}</span>
                <span><a href={c.lineUrl} target="_blank" rel="noopener noreferrer">Line: {c.lineId}</a></span>
              </li>
            </ul>
          </div>

          <div>
            <h4>ช่องทางร้านค้า</h4>
            <ul className="footer-links-list">
              <li><a href={c.shopeeUrl} target="_blank" rel="noopener noreferrer">{Icon.bag} Shopee Official</a></li>
              <li><a href={c.tiktokUrl} target="_blank" rel="noopener noreferrer">{Icon.music} TikTok @yongtong99</a></li>
              <li><a href={c.facebookUrl} target="_blank" rel="noopener noreferrer">{Icon.facebook} Facebook เพจร้าน</a></li>
            </ul>
          </div>

          <div>
            <h4>ที่ตั้งร้าน</h4>
            <div className="footer-address">{c.address}</div>
            <a href={c.mapUrl} target="_blank" rel="noopener noreferrer" className="footer-map-btn">
              {Icon.pin} เปิดแผนที่ Google Maps
            </a>
          </div>
        </div>
        <div className="footer-copy">
          <span>© 2026 ยงค์ทอง สังฆภัณฑ์ · ผู้ผลิตและจัดจำหน่ายเครื่องสังฆภัณฑ์ครบวงจร</span>
          <span style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span>อ.วานรนิวาส จ.สกลนคร</span>
            <button className="admin-link" onClick={onAdminClick}>{Icon.user} ผู้ดูแลระบบ</button>
          </span>
        </div>
      </div>
    </footer>
  );
}

export { TopBar, Header, Hero, AboutStore, ProductCard, CartDrawer, ProductModal, Footer, fmt };
