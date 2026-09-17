// Centralized price calculation using the admin-controlled Dirham module.
// Base price = Dirham value × conversion rate (from Price Controlling).
//   final AED = (purchase_price + shipping_fee) * (1 + profit_margin / 100)
//   base ETB = final AED * exchange_rate
// The admin can also set a per-item picker delivery fee; the combined price
// shown to the customer = discounted base + picker delivery fee.
// Regional delivery fees are computed separately at checkout.

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

export function itemPickerFee(item) {
  return Number(item?.picker_delivery_fee) || 0;
}

// Discounted base price (before adding the picker delivery fee).
export function discountedBasePrice(item, setting) {
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

// Final combined price the customer sees: discounted base + picker delivery fee.
export function computePrice(item, setting) {
  return discountedBasePrice(item, setting) + itemPickerFee(item);
}

export function discountPercent(item, setting) {
  const original = basePrice(item, setting);
  const final = discountedBasePrice(item, setting);
  if (original <= 0 || final >= original) return 0;
  return Math.round(((original - final) / original) * 100);
}

// Regional delivery fee. Free within Addis Ababa. Hawassa (Sidama) starts at
// 400 ETB and scales by weight (item quantity). Other regions scale by
// approximate distance from Addis Ababa.
const REGION_DISTANCE_KM = {
  Amhara: 320,
  Oromia: 120,
  Tigray: 600,
  SNNPR: 260,
  Somali: 700,
  Afar: 250,
  "Benishangul-Gumuz": 500,
  Gambela: 760,
  Harari: 525,
  "Dire Dawa": 515,
};

export function deliveryFeeFor(region, totalQty) {
  const qty = Math.max(1, Number(totalQty) || 1);
  if (!region || region === "Addis Ababa") return 0;
  if (region === "Sidama") return 400 + (qty - 1) * 50; // Hawassa base + weight
  const distance = REGION_DISTANCE_KM[region] || 400;
  return Math.round(distance * 2 + (qty - 1) * 30);
}