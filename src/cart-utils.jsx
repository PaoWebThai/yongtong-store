// Variant + cart helpers
// ---------------------------------------------------------------
// รูปแบบตัวเลือกสินค้า (matrix):
//   product.variants = {
//     options: [ { name: "ขนาด", choices: ["7 นิ้ว","9 นิ้ว"] }, { name: "สี", choices: ["ดำ","ทอง"] } ],
//     matrix:  { "7 นิ้ว|ดำ": { price: 890, oldPrice: null }, ... }
//   }
//
// รูปแบบตะกร้า (cart):
//   { [cartKey]: { id, qty, variant } }
//   - cartKey = `${id}` หรือ `${id}::${variantKey}`
//   - variant = null หรือ { key, label, price, oldPrice }

// ---------------- variants ----------------

function hasVariants(product) {
  const v = product?.variants;
  return !!(
    v &&
    Array.isArray(v.options) &&
    v.options.length > 0 &&
    v.options.every((o) => o && o.name && Array.isArray(o.choices) && o.choices.length > 0)
  );
}

// cartesian product ของ choices → [{ key, label, values }]
function allCombos(options) {
  if (!options || !options.length) return [];
  let combos = [[]];
  for (const o of options) {
    const next = [];
    for (const c of combos) {
      for (const ch of o.choices) next.push([...c, ch]);
    }
    combos = next;
  }
  return combos.map((arr) => ({
    key: arr.join("|"),
    label: arr.join(" · "),
    values: arr,
  }));
}

function comboKey(values) {
  return values.join("|");
}

function variantPrice(product, key) {
  const m = product?.variants?.matrix || {};
  return m[key] || null; // { price, oldPrice } | null
}

// ช่วงราคาต่ำสุด–สูงสุดจาก matrix (สำหรับแสดงบนการ์ด/หัวสินค้า)
function priceRange(product) {
  const m = product?.variants?.matrix || {};
  const vals = Object.values(m)
    .map((x) => Number(x?.price) || 0)
    .filter((n) => n > 0);
  if (!vals.length) return { min: Number(product?.price) || 0, max: Number(product?.price) || 0 };
  return { min: Math.min(...vals), max: Math.max(...vals) };
}

// ---------------- cart ----------------

function cartKeyOf(id, variant) {
  return variant && variant.key ? `${id}::${variant.key}` : `${id}`;
}

function cartCount(cart) {
  return Object.values(cart).reduce((s, e) => s + (Number(e?.qty) || 0), 0);
}

function addToCart(cart, product, qty, variant) {
  const key = cartKeyOf(product.id, variant);
  const prev = cart[key];
  return {
    ...cart,
    [key]: {
      id: product.id,
      qty: (Number(prev?.qty) || 0) + qty,
      variant: variant || null,
    },
  };
}

function setLineQty(cart, key, qty) {
  const next = { ...cart };
  if (qty <= 0) delete next[key];
  else next[key] = { ...next[key], qty };
  return next;
}

function removeLine(cart, key) {
  const next = { ...cart };
  delete next[key];
  return next;
}

// แปลง cart → array ของ line พร้อมข้อมูลสินค้า/ราคา
function cartLines(cart, products) {
  return Object.entries(cart)
    .map(([key, entry]) => {
      const p = products.find((x) => x.id === Number(entry.id));
      if (!p) return null;
      const unitPrice = entry.variant?.price ?? p.price;
      return {
        key,
        id: p.id,
        qty: entry.qty,
        product: p,
        variant: entry.variant || null,
        unitPrice,
      };
    })
    .filter(Boolean);
}

export {
  hasVariants,
  allCombos,
  comboKey,
  variantPrice,
  priceRange,
  cartKeyOf,
  cartCount,
  addToCart,
  setLineQty,
  removeLine,
  cartLines,
};
