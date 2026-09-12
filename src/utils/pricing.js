// Centralized price calculation using the admin-controlled Dirham module.
// An item priced via the Dirham module uses:
//   final AED = (purchase_price + shipping_fee) * (1 + profit_margin / 100)
//   final ETB = final AED * exchange_rate
// Items may also be priced manually in AED (price_aed) or ETB (price).
// Global site-wide discount and per-item discount then apply on top.

export function basePriceAed(item) {
  if (item?.purchase_price != null && Number(item.purchase_price) > 0) {
    const purchase = Number(item.purchase_price) || 0;
    const shipping = Number(item.shipping_fee) || 0;
    const margin = Number(item.profit_margin) || 0;
    return (purchase + shipping) * (1 + margin / 100);
  }
  if (item?.price_aed && Number(item.price_aed) > 0) return Number(item.price_aed);
  return null;
}

export function basePrice(item, setting) {
  const rate = Number(setting?.exchange_rate) || 52;
  const aed = basePriceAed(item);
  if (aed != null) return Math.round(aed * rate);
  return Number(item?.price) || 0;
}

export function computePrice(item, setting) {
  const globalDiscount = Number(setting?.global_discount_percent) || 0;
  let base;
  if (item?.discounted_price && Number(item.discounted_price) > 0) {
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