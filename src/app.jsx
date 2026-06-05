// Main App for ยงค์ทอง สังฆภัณฑ์

import React from "react";
import { Icon } from "./icons.jsx";
import {
  TopBar, Header, Hero, AboutStore, ProductCard,
  CartDrawer, ProductModal, Footer,
} from "./components.jsx";
import { CATEGORIES } from "./data.jsx";
import { loadProducts } from "./products-store.jsx";
import { getCurrentMember, refreshCurrentMember, logoutMember } from "./members.jsx";
import { loadOrders, isAdmin } from "./orders.jsx";
import { Checkout } from "./checkout.jsx";
import { MemberAuthModal, MemberMenu } from "./member-ui.jsx";
import { OrderTracking } from "./order-tracking.jsx";
import { AdminLogin, AdminDashboard } from "./admin.jsx";

const { useState, useMemo, useEffect } = React;

const SORTS = [
  { id: "popular", label: "ยอดนิยม" },
  { id: "new",     label: "มาใหม่ล่าสุด" },
  { id: "sold",    label: "ขายดีที่สุด" },
  { id: "lo",      label: "ราคา: ต่ำ → สูง" },
  { id: "hi",      label: "ราคา: สูง → ต่ำ" },
  { id: "rating",  label: "คะแนนรีวิวสูงสุด" },
];

function App() {
  const [activeCat, setActiveCat] = useState("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("popular");
  const [showSort, setShowSort] = useState(false);
  const [following, setFollowing] = useState(false);

  const [cart, setCart] = useState({});         // {productId: qty}
  const [wish, setWish] = useState(new Set());
  const [cartOpen, setCartOpen] = useState(false);
  const [openProduct, setOpenProduct] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [visibleCount, setVisibleCount] = useState(8);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [adminMode, setAdminMode] = useState(false);
  const [adminLoginOpen, setAdminLoginOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [member, setMember] = useState(() => getCurrentMember());
  const [authOpen, setAuthOpen] = useState(false);
  const [memberMenuOpen, setMemberMenuOpen] = useState(false);
  const [trackOpen, setTrackOpen] = useState(false);
  const [memberOrders, setMemberOrders] = useState([]);

  useEffect(() => {
    if (isAdmin()) setAdminMode(true);

    let cancelled = false;
    async function fetchProducts() {
      try {
        const list = await loadProducts();
        if (!cancelled) setProducts(list);
      } finally {
        if (!cancelled) setProductsLoading(false);
      }
    }
    fetchProducts();

    // refresh member cache from DB (in case it changed elsewhere)
    refreshCurrentMember().then((m) => {
      if (!cancelled && m) setMember(m);
    });

    const handler = () => fetchProducts();
    window.addEventListener("yongtong:products-changed", handler);
    return () => {
      cancelled = true;
      window.removeEventListener("yongtong:products-changed", handler);
    };
  }, []);

  // load this member's orders when the menu opens
  useEffect(() => {
    if (!memberMenuOpen || !member) return;
    let cancelled = false;
    loadOrders().then((all) => {
      if (cancelled) return;
      const norm = (s) => (s || "").replace(/[-\s]/g, "");
      setMemberOrders(all.filter((o) => norm(o.shipping?.phone) === norm(member.phone)));
    });
    return () => { cancelled = true; };
  }, [memberMenuOpen, member?.phone]);

  const cartCount = Object.values(cart).reduce((s, n) => s + n, 0);

  function pushToast(msg) {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, msg }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2200);
  }

  function addToCart(product, qty = 1) {
    setCart((c) => ({ ...c, [product.id]: (c[product.id] || 0) + qty }));
    pushToast(`เพิ่ม "${product.headline}" ลงตะกร้าแล้ว (${qty} ชิ้น)`);
  }

  function toggleWish(id) {
    setWish((w) => {
      const next = new Set(w);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const filtered = useMemo(() => {
    let list = products.slice();
    if (activeCat !== "all") list = list.filter((p) => p.cat === activeCat);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.headline.toLowerCase().includes(q) ||
          p.tag.toLowerCase().includes(q)
      );
    }
    const sorters = {
      popular: (a, b) => b.sold * b.rating - a.sold * a.rating,
      new:     (a, b) => (b.badges.includes("new") ? 1 : 0) - (a.badges.includes("new") ? 1 : 0),
      sold:    (a, b) => b.sold - a.sold,
      lo:      (a, b) => a.price - b.price,
      hi:      (a, b) => b.price - a.price,
      rating:  (a, b) => b.rating - a.rating,
    };
    list.sort(sorters[sortBy] || sorters.popular);
    return list;
  }, [activeCat, search, sortBy, products]);

  useEffect(() => { setVisibleCount(8); }, [activeCat, search, sortBy]);

  // Close sort menu on outside click
  useEffect(() => {
    if (!showSort) return;
    const close = () => setShowSort(false);
    setTimeout(() => window.addEventListener("click", close, { once: true }), 0);
  }, [showSort]);

  return (
    <>
      <TopBar onTrackClick={() => setTrackOpen(true)} />
      <Header
        cartCount={cartCount}
        wishCount={wish.size}
        search={search}
        setSearch={setSearch}
        activeCat={activeCat}
        setActiveCat={setActiveCat}
        onCartOpen={() => setCartOpen(true)}
        onWishOpen={() => pushToast(`คุณมีสินค้าในรายการที่ชอบ ${wish.size} รายการ`)}
        member={member}
        onMemberClick={() => { if (member) setMemberMenuOpen((v) => !v); else setAuthOpen(true); }}
      />
      {memberMenuOpen && member && (
        <MemberMenu
          member={member}
          orders={memberOrders}
          onClose={() => setMemberMenuOpen(false)}
          onTrack={() => { setMemberMenuOpen(false); setTrackOpen(true); }}
          onLogout={() => { logoutMember(); setMember(null); setMemberMenuOpen(false); pushToast("ออกจากระบบแล้ว"); }}
        />
      )}
      <Hero following={following} setFollowing={setFollowing} />
      <AboutStore />

      <main className="section" data-screen-label="01 Product Gallery">
        <div className="section-head">
          <div>
            <h2 className="section-title">สินค้าทั้งหมด</h2>
            <p className="section-sub">
              พบ <strong>{filtered.length}</strong> รายการ
              {search && <> · ค้นหา "<strong>{search}</strong>"</>}
            </p>
          </div>
        </div>

        <div className="filterbar">
          <span className="filterbar-label">กรองตามหมวด</span>
          <div className="chip-row">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                className={`chip ${activeCat === c.id ? "active" : ""}`}
                onClick={() => setActiveCat(c.id)}
              >
                {c.label}
              </button>
            ))}
          </div>
          <div className="filterbar-spacer"></div>
          <div
            className="sort-select"
            onClick={(e) => { e.stopPropagation(); setShowSort(!showSort); }}
            style={{ position: "relative" }}
          >
            {Icon.filter}
            <span>เรียง: {SORTS.find((s) => s.id === sortBy)?.label}</span>
            {Icon.chevron}
            {showSort && (
              <div className="sort-menu" onClick={(e) => e.stopPropagation()}>
                {SORTS.map((s) => (
                  <div
                    key={s.id}
                    className={`sort-menu-item ${sortBy === s.id ? "active" : ""}`}
                    onClick={() => { setSortBy(s.id); setShowSort(false); }}
                  >
                    {s.label}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 24px", color: "var(--c-muted)" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
            <div style={{ fontSize: 16, color: "var(--c-ink)", marginBottom: 6 }}>ไม่พบสินค้าที่ตรงกับเงื่อนไข</div>
            <div style={{ fontSize: 13 }}>ลองเปลี่ยนหมวดหมู่หรือคำค้นหา</div>
          </div>
        ) : (
          <>
            <div className="product-grid">
              {filtered.slice(0, visibleCount).map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onOpen={setOpenProduct}
                  onAdd={addToCart}
                  onWish={toggleWish}
                  isWished={wish.has(p.id)}
                />
              ))}
            </div>
            {visibleCount < filtered.length && (
              <div className="loadmore-wrap">
                <button className="loadmore" onClick={() => setVisibleCount((v) => v + 8)}>
                  {Icon.refresh} โหลดเพิ่มเติม ({filtered.length - visibleCount} รายการ)
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <Footer onAdminClick={() => setAdminLoginOpen(true)} />

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cart}
        products={products}
        setCart={setCart}
        onCheckout={() => { setCartOpen(false); setCheckoutOpen(true); }}
      />
      <ProductModal
        product={openProduct}
        onClose={() => setOpenProduct(null)}
        onAdd={addToCart}
      />
      <Checkout
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        cart={cart}
        products={products}
        member={member}
        onComplete={() => { setCart({}); }}
      />
      {authOpen && (
        <MemberAuthModal
          onClose={() => setAuthOpen(false)}
          onAuth={(m) => { setMember(m); setAuthOpen(false); pushToast(`ยินดีต้อนรับ ${m.name.split(" ")[0]} 🙏`); }}
        />
      )}
      {trackOpen && (
        <OrderTracking
          member={member}
          onClose={() => setTrackOpen(false)}
        />
      )}
      {adminLoginOpen && (
        <AdminLogin
          onClose={() => setAdminLoginOpen(false)}
          onSuccess={() => { setAdminLoginOpen(false); setAdminMode(true); }}
        />
      )}
      {adminMode && (
        <AdminDashboard onClose={() => setAdminMode(false)} />
      )}

      <div className="toast-stack">
        {toasts.map((t) => (
          <div className="toast" key={t.id}>{Icon.check} {t.msg}</div>
        ))}
      </div>
    </>
  );
}

export { App };
