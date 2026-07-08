// Sub-components for ยงค์ทอง — Header, Hero, ProductCard, CartDrawer, ProductModal

import React from "react";
import { Icon, ProductPlaceholder } from "./icons.jsx";
import { STORE } from "./data.jsx";
import { useCategories } from "./categories-store.jsx";
import { loadPromoSlides, DEFAULT_PROMO_SLIDES, PROMO_CHANGED } from "./settings-store.jsx";
import {
  hasVariants, allCombos, comboKey, variantPrice, priceRange,
  cartLines, setLineQty, removeLine,
} from "./cart-utils.jsx";

function fmt(n) {
  return n.toLocaleString("th-TH");
}

/* ---------- TopBar ---------- */
function TopBar({ onTrackClick }) {
  return (
    <div className="topbar">
      <div className="topbar-inner" style={{ justifyContent: "flex-end" }}>
        <div className="topbar-links">
          <a onClick={onTrackClick} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            {Icon.truck} ติดตามสินค้า
          </a>
        </div>
      </div>
    </div>
  );
}

/* ---------- Header ---------- */
function Header({ cartCount, wishCount, search, setSearch, activeCat, setActiveCat, onCartOpen, onWishOpen, member, onMemberClick }) {
  const categories = useCategories();
  return (
    <header className="header">
      <div className="header-inner">
        <a className="header-logo" href="#top" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
          <img src="/assets/yongtong-logo.jpeg" alt="ยงค์ทอง สังฆภัณฑ์" />
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
          {categories.map((c) => (
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

/* ---------- Hero banner (top masthead) ---------- */
function HeroBanner() {
  return (
    <section className="hero-banner-section">
      <div className="hero-banner">
        <div className="hero-banner-deco" aria-hidden="true">
          <span className="hb-orb hb-orb-1"></span>
          <span className="hb-orb hb-orb-2"></span>
          <span className="hb-ring"></span>
        </div>
        <div className="hero-banner-emblem">
          <img src="/assets/yongtong-logo.jpeg" alt={STORE.name} />
        </div>
        <div className="hero-banner-text">
          <div className="hero-banner-eyebrow">ยินดีต้อนรับสู่ร้าน</div>
          <h1 className="hero-banner-title">{STORE.name}</h1>
          <p className="hero-banner-tagline">{STORE.tagline}</p>
          <a href="#products" className="hero-banner-cta">เลือกชมสินค้าทั้งหมด {Icon.arrow}</a>
        </div>
      </div>
    </section>
  );
}

/* ---------- Promo carousel (auto-scrolling images) ---------- */
function PromoCarousel() {
  const [idx, setIdx] = React.useState(0);
  const [failed, setFailed] = React.useState({});
  const [slides, setSlides] = React.useState(DEFAULT_PROMO_SLIDES);
  const count = slides.length;

  React.useEffect(() => {
    let cancelled = false;
    function refresh() {
      loadPromoSlides().then((s) => {
        if (!cancelled && s && s.length) { setSlides(s); setIdx(0); setFailed({}); }
      });
    }
    refresh();
    window.addEventListener(PROMO_CHANGED, refresh);
    return () => { cancelled = true; window.removeEventListener(PROMO_CHANGED, refresh); };
  }, []);

  React.useEffect(() => {
    if (count <= 1) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % count), 4000);
    return () => clearInterval(t);
  }, [count]);

  const PROMO_SLIDES = slides;

  return (
    <section className="promo-carousel-section">
      <div className="promo-carousel">
        <div className="promo-track" style={{ transform: `translateX(-${idx * 100}%)` }}>
          {PROMO_SLIDES.map((s, i) => (
            <div className="promo-slide" key={i}>
              {failed[i] ? (
                <div className="promo-fallback">
                  <div className="promo-fallback-emblem">
                    <img src="/assets/yongtong-logo.jpeg" alt={STORE.name} />
                  </div>
                  <div className="promo-fallback-title">{s.title}</div>
                  <div className="promo-fallback-sub">{s.sub}</div>
                </div>
              ) : (
                <img
                  className="promo-img"
                  src={s.src}
                  alt={s.title || STORE.name}
                  onError={() => setFailed((f) => ({ ...f, [i]: true }))}
                />
              )}
            </div>
          ))}
        </div>

        {count > 1 && (
          <>
            <button className="promo-arrow prev" onClick={() => setIdx((i) => (i - 1 + count) % count)} aria-label="ก่อนหน้า">‹</button>
            <button className="promo-arrow next" onClick={() => setIdx((i) => (i + 1) % count)} aria-label="ถัดไป">›</button>
            <div className="promo-dots">
              {PROMO_SLIDES.map((_, i) => (
                <button
                  key={i}
                  className={`promo-dot ${i === idx ? "active" : ""}`}
                  onClick={() => setIdx(i)}
                  aria-label={`สไลด์ ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}
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
/* ---------- Filter Sidebar (Shopee style) ---------- */
function FilterSidebar({ activeCat, setActiveCat, priceMin, priceMax, setPriceMin, setPriceMax, onReset }) {
  const categories = useCategories();
  return (
    <div className="filter-side">
      <div className="filter-side-head">
        {Icon.filter} ค้นหาแบบละเอียด
      </div>

      <div className="filter-block">
        <div className="filter-block-title">ค้นหาตามหมวดหมู่</div>
        <ul className="filter-cat-list">
          {categories.map((c) => (
            <li
              key={c.id}
              className={`filter-cat-item ${activeCat === c.id ? "active" : ""}`}
              onClick={() => setActiveCat(c.id)}
            >
              {activeCat === c.id && <span className="filter-cat-tick">{Icon.check}</span>}
              {c.label}
            </li>
          ))}
        </ul>
      </div>

      <div className="filter-block">
        <div className="filter-block-title">ช่วงราคา</div>
        <div className="filter-price">
          <input
            type="number"
            className="filter-price-input"
            placeholder="฿ ต่ำสุด"
            value={priceMin}
            onChange={(e) => setPriceMin(e.target.value)}
          />
          <span className="filter-price-dash">—</span>
          <input
            type="number"
            className="filter-price-input"
            placeholder="฿ สูงสุด"
            value={priceMax}
            onChange={(e) => setPriceMax(e.target.value)}
          />
        </div>
      </div>

      <button className="filter-reset" onClick={onReset}>ล้างทั้งหมด</button>
    </div>
  );
}

/* ---------- Sort bar (Shopee style) ---------- */
function SortBar({ sortBy, setSortBy, total }) {
  const tabs = [
    { id: "popular", label: "ยอดนิยม" },
    { id: "new", label: "ล่าสุด" },
    { id: "sold", label: "ขายดี" },
  ];
  const priceActive = sortBy === "lo" || sortBy === "hi";
  return (
    <div className="sortbar">
      <span className="sortbar-label">เรียงโดย</span>
      {tabs.map((t) => (
        <button
          key={t.id}
          className={`sortbar-tab ${sortBy === t.id ? "active" : ""}`}
          onClick={() => setSortBy(t.id)}
        >
          {t.label}
        </button>
      ))}
      <button
        className={`sortbar-tab sortbar-price ${priceActive ? "active" : ""}`}
        onClick={() => setSortBy(sortBy === "lo" ? "hi" : "lo")}
      >
        ราคา
        <span className="sortbar-price-arrows">
          <i className={sortBy === "lo" ? "on" : ""}>▲</i>
          <i className={sortBy === "hi" ? "on" : ""}>▼</i>
        </span>
      </button>
      <span className="sortbar-count">
        พบ <strong>{total}</strong> รายการ
      </span>
    </div>
  );
}

function ProductCard({ product, onOpen, onAdd, onWish, isWished }) {
  const variant = hasVariants(product);
  const range = variant ? priceRange(product) : null;
  const showRange = variant && range && range.min !== range.max;
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
          onClick={(e) => { e.stopPropagation(); variant ? onOpen(product) : onAdd(product); }}
          title={variant ? "เลือกตัวเลือกสินค้า" : "เพิ่มลงตะกร้า"}
        >
          {variant ? Icon.arrow : Icon.cart}
        </button>
      </div>
      <div className="product-info">
        <div className="product-name">{product.name}</div>
        <div className="product-price-row">
          {showRange ? (
            <span className="product-price">
              <span className="currency">฿</span>{fmt(range.min)}<span className="price-range-sep"> - </span>
              <span className="currency">฿</span>{fmt(range.max)}
            </span>
          ) : (
            <>
              <span className="product-price">
                <span className="currency">฿</span>{fmt(variant ? range.min : product.price)}
              </span>
              {product.oldPrice && !variant && (
                <span className="product-oldprice">฿{fmt(product.oldPrice)}</span>
              )}
            </>
          )}
        </div>
        <div className="product-meta">
          <span className="product-location">{Icon.pin} {product.location}</span>
          <span className="product-sold">ขายแล้ว {product.sold} ชิ้น</span>
        </div>
      </div>
    </article>
  );
}

/* ---------- Cart Drawer ---------- */
function CartDrawer({ open, onClose, items, products, setCart, onCheckout }) {
  if (!open) return null;
  const lines = cartLines(items, products);
  const subtotal = lines.reduce((s, l) => s + l.unitPrice * l.qty, 0);
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
            <div className="cart-item" key={l.key}>
              <div className="cart-item-thumb">
                <ProductPlaceholder product={l.product} />
              </div>
              <div className="cart-item-body">
                <div className="cart-item-name">{l.product.name}</div>
                {l.variant && <div className="cart-item-variant">{l.variant.label}</div>}
                <div className="cart-item-price">฿{fmt(l.unitPrice)}</div>
                <div className="cart-item-controls">
                  <div className="qty">
                    <button className="qty-btn" onClick={() => setCart(setLineQty(items, l.key, l.qty - 1))}>{Icon.minus}</button>
                    <span className="qty-val">{l.qty}</span>
                    <button className="qty-btn" onClick={() => setCart(setLineQty(items, l.key, l.qty + 1))}>{Icon.plus}</button>
                  </div>
                  <button className="cart-item-remove" onClick={() => setCart(removeLine(items, l.key))}>ลบ</button>
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

/* ---------- Detail content block (text / image / table) ---------- */
function DetailBlock({ block, name }) {
  if (!block || !block.type) return null;
  if (block.type === "text") {
    if (!block.value || !block.value.trim()) return null;
    return <p className="pd-section-body">{block.value}</p>;
  }
  if (block.type === "image") {
    if (!block.url) return null;
    return (
      <figure className="pd-detail-image">
        <img src={block.url} alt={block.caption || name} />
        {block.caption && <figcaption>{block.caption}</figcaption>}
      </figure>
    );
  }
  if (block.type === "table") {
    const rows = Array.isArray(block.rows) ? block.rows : [];
    if (!rows.length) return null;
    const [head, ...body] = rows;
    return (
      <div className="pd-detail-table-wrap">
        <table className="pd-detail-table">
          {head && (
            <thead>
              <tr>{head.map((c, i) => <th key={i}>{c}</th>)}</tr>
            </thead>
          )}
          <tbody>
            {body.map((r, ri) => (
              <tr key={ri}>{r.map((c, ci) => <td key={ci}>{c}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  return null;
}

/* ---------- Product Modal ---------- */
function ProductModal({ product, onClose, onAdd }) {
  const categories = useCategories();
  const [qty, setQty] = React.useState(1);
  const [activeImg, setActiveImg] = React.useState(0);
  const [selected, setSelected] = React.useState({}); // { [groupName]: choice }
  const [heroOverride, setHeroOverride] = React.useState(null); // รูปของคู่ผสม variant
  React.useEffect(() => { setQty(1); setActiveImg(0); setSelected({}); setHeroOverride(null); }, [product?.id]);
  // เมื่อเลือกครบทุกตัวเลือก → ถ้าคู่ผสมนั้นมีรูป ให้เปลี่ยนรูปหลักตาม (ต้องอยู่ก่อน early-return เพื่อกฎ Hooks)
  React.useEffect(() => {
    if (!product || !hasVariants(product)) { setHeroOverride(null); return; }
    const opts = product.variants.options;
    const key = opts.every((o) => selected[o.name]) ? comboKey(opts.map((o) => selected[o.name])) : null;
    const img = key ? (product.variants?.matrix?.[key]?.image || null) : null;
    setHeroOverride(img);
  }, [product?.id, selected]);
  if (!product) return null;
  const hasImages = product.images && product.images.length > 0;
  const galleryImages = hasImages ? product.images : [null]; // null means placeholder

  // --- Variants ---
  const variant = hasVariants(product);
  const options = variant ? product.variants.options : [];
  const allChosen = variant && options.every((o) => selected[o.name]);
  const chosenKey = variant && allChosen ? comboKey(options.map((o) => selected[o.name])) : null;
  const chosenPrice = chosenKey ? variantPrice(product, chosenKey) : null;
  const range = variant ? priceRange(product) : null;

  // ราคาที่แสดง: ถ้าเลือกครบใช้ราคาคู่ผสม, ไม่งั้นใช้ราคาเดิม/ช่วงราคา
  const displayPrice = chosenPrice ? chosenPrice.price : (variant ? range.min : product.price);
  const displayOld = chosenPrice ? chosenPrice.oldPrice : (variant ? null : product.oldPrice);

  function buildVariant() {
    if (!variant || !allChosen) return null;
    return {
      key: chosenKey,
      label: options.map((o) => selected[o.name]).join(" · "),
      price: chosenPrice ? chosenPrice.price : range.min,
      oldPrice: chosenPrice ? chosenPrice.oldPrice : null,
    };
  }

  const canAdd = !variant || allChosen;

  function renderGalleryItem(img, fullsize = false) {
    if (img) return <img src={img} alt={product.name} className="pad-img" />;
    return <ProductPlaceholder product={product} />;
  }

  const hasDetails =
    (product.description && product.description.trim()) ||
    (product.detailBlocks && product.detailBlocks.length > 0) ||
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
              {renderGalleryItem(heroOverride || galleryImages[activeImg])}
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
                    className={`pd-thumb ${activeImg === i && !heroOverride ? "active" : ""}`}
                    onClick={() => { setActiveImg(i); setHeroOverride(null); }}
                  >
                    {renderGalleryItem(img)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: Info */}
          <div className="pd-info">
            <div className="modal-cat">{categories.find((c) => c.id === product.cat)?.label}</div>
            <h2 className="modal-name">{product.name}</h2>
            <div className="modal-rating-row">
              <span>ขายแล้ว <strong>{product.sold}</strong> ชิ้น</span>
              <span className="sep">|</span>
              <span>จัดส่งจาก <strong>{product.location}</strong></span>
            </div>
            <div className="modal-price-row">
              {variant && !allChosen && range.min !== range.max ? (
                <span className="modal-price">฿{fmt(range.min)} - ฿{fmt(range.max)}</span>
              ) : (
                <span className="modal-price">฿{fmt(displayPrice)}</span>
              )}
              {displayOld && <span className="modal-oldprice">฿{fmt(displayOld)}</span>}
              {!variant && product.discount > 0 && <span className="modal-discount">ประหยัด {product.discount}%</span>}
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

            {variant && (
              <div className="pd-variants">
                {options.map((o) => (
                  <div className="pd-variant-group" key={o.name}>
                    <div className="pd-variant-label">{o.name}</div>
                    <div className="pd-variant-choices">
                      {o.choices.map((ch) => (
                        <button
                          key={ch}
                          className={`pd-variant-chip ${selected[o.name] === ch ? "active" : ""}`}
                          onClick={() => setSelected((s) => ({ ...s, [o.name]: ch }))}
                        >
                          {ch}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                {!allChosen && (
                  <div className="pd-variant-hint">{Icon.info} กรุณาเลือกตัวเลือกให้ครบก่อนสั่งซื้อ</div>
                )}
              </div>
            )}

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
              <button className="btn btn-outline" disabled={!canAdd} onClick={() => { if (canAdd) onAdd(product, qty, buildVariant()); }}>
                {Icon.cart} เพิ่มลงตะกร้า
              </button>
              <button className="btn btn-primary" disabled={!canAdd} onClick={() => { if (canAdd) { onAdd(product, qty, buildVariant()); onClose(); } }}>
                ซื้อทันที {Icon.arrow}
              </button>
            </div>
          </div>
        </div>

        {/* DETAIL SECTIONS */}
        {hasDetails && (
          <div className="pd-details">
            {((product.description && product.description.trim()) ||
              (product.detailBlocks && product.detailBlocks.length > 0)) && (
              <section className="pd-section">
                <h3 className="pd-section-title">{Icon.info} รายละเอียดสินค้า</h3>
                {product.description && product.description.trim() && (
                  /<[a-z][\s\S]*>/i.test(product.description)
                    ? <div className="pd-section-body pd-rich" dangerouslySetInnerHTML={{ __html: product.description }} />
                    : <p className="pd-section-body">{product.description}</p>
                )}
                {product.detailBlocks && product.detailBlocks.map((b, i) => (
                  <DetailBlock key={i} block={b} name={product.name} />
                ))}
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
              <div style={{ color: "var(--c-ink)", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18 }}>
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

export { TopBar, Header, HeroBanner, PromoCarousel, AboutStore, FilterSidebar, SortBar, ProductCard, CartDrawer, ProductModal, Footer, fmt };
