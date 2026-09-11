// Centralized price calculation using the admin-controlled exchange rate and global discount.
// Items may be priced in AED (Dirham) via `price_aed`, or in ETB via `price`.
// The displayed ETB price = base × (1 - global_discount_percent/100), where base is
// the per-item discounted_price if set, otherwise the AED→ETB conversion (or the ETB price).

export function basePrice(item, setting) {
  const rate = Number(setting?.exchange_rate) || 52;
  if (item?.price_aed && Number(item.price_aed) > 0) {
    return Math.round(Number(item.price_aed) * rate);
  }
  return Number(item?.price) || 0;
}

export function computePrice(item, setting) {
  const discount = Number(setting?.global_discount_percent) || 0;
  let base = basePrice(item, setting);
  if (item?.discounted_price && Number(item.discounted_price) > 0) {
    base = Number(item.discounted_price);
  }
  return Math.round(base * (1 - discount / 100));
}

export function discountPercent(item, setting) {
  const original = basePrice(item, setting);
  const final = computePrice(item, setting);
  if (original <= 0 || final >= original) return 0;
  return Math.round(((original - final) / original) * 100);
}