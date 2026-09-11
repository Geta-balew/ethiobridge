// Centralized price calculation using the admin-controlled exchange rate,
// global site-wide discount, and per-item discount.
// Items may be priced in AED (Dirham) via `price_aed`, or in ETB via `price`.

export function basePrice(item, setting) {
  const rate = Number(setting?.exchange_rate) || 52;
  if (item?.price_aed && Number(item.price_aed) > 0) {
    return Math.round(Number(item.price_aed) * rate);
  }
  return Number(item?.price) || 0;
}

export function computePrice(item, setting) {
  const globalDiscount = Number(setting?.global_discount_percent) || 0;
  let base;
  if (item?.discounted_price && Number(item.discounted_price) > 0) {
    // Absolute ETB override (manual discounted price)
    base = Number(item.discounted_price);
  } else {
    base = basePrice(item, setting);
    const itemDiscount = Number(item?.discount_percent) || 0;
    if (itemDiscount > 0) base = base * (1 - itemDiscount / 100);
  }
  return Math.round(base * (1 - globalDiscount / 100));
}

export function discountPercent(item, setting) {
  const original = basePrice(item, setting);
  const final = computePrice(item, setting);
  if (original <= 0 || final >= original) return 0;
  return Math.round(((original - final) / original) * 100);
}