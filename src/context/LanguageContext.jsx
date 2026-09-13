import { createContext, useContext, useEffect, useState } from "react";

const LanguageContext = createContext(null);

const dict = {
  en: {
    summer_sale: "Summer Sale: Up to 50% Off on Top Brands | Limited Time Offer!",
    shop_now: "Shop Now",
    upgrade_everyday: "Upgrade your Everyday",
    upgrade_sub: "Shop the latest electronics, watches and more — delivered from Dubai to Addis.",
    step_style: "Step into Style",
    step_style_sub: "Branded shoes and perfumes, hand-carried and delivered to your door.",
    timeless: "Timeless Elegance",
    timeless_sub: "Premium watches from top brands, verified and delivered to you.",
    todays_deals: "Today's Deals",
    see_all: "See all",
    see_all_deals: "See all deals",
    shop_by_category: "Shop by Category",
    electronics: "Electronics",
    fashion: "Fashion",
    home_living: "Home & Living",
    beauty_health: "Beauty & Health",
    groceries: "Groceries",
    kids: "Kids",
    other: "Other",
    watches: "Watches",
    shoes_perfumes: "Shoes & Perfumes",
    fast_delivery: "Fast & Free Delivery",
    fast_delivery_sub: "On millions of items",
    pay_on_delivery: "Pay on Delivery",
    pay_on_delivery_sub: "Cash on delivery available",
    top_brands: "Top Brands",
    top_brands_sub: "100% Original Products",
    support: "24/7 Customer Support",
    support_sub: "We're here to help",
    membership_title: "One membership, many benefits",
    membership_sub: "Join EthioBridge Prime for free delivery, exclusive deals and priority picker matching.",
    join_now: "Join Now",
    all_items: "All items",
    no_items: "No items found.",
    footer: "EthioBridge · Dubai → Addis delivery service",
    search_placeholder: "Search items…",
    cart: "Cart",
    my_orders: "My Orders",
    picker: "Picker",
    admin: "Admin",
    tickets: "Tickets",
    visa: "Visa",
    pickers: "Pickers",
  },
  am: {
    summer_sale: "የበጋ ሽያጭ: ከፍተኛ ቅናሽ እስከ 50% በከፍተኛ ደረጃ ምርቶች | ለተወሰነ ጊዜ!",
    shop_now: "አሁን ይግዙ",
    upgrade_everyday: "የእለት ጉዞዎን ያሻሽሉ",
    upgrade_sub: "ዘመናዊ ኤሌክትሮኒክስ፣ ሰዓቶች እና ተጨማሪ — ከዱባይ እስከ አዲስ አበባ ይደርሳሉ።",
    step_style: "ወደ ስታይል ይግቡ",
    step_style_sub: "የተወሰኑ ጫማዎች እና ሽቶዎች፣ በእጅ የተወሰዱ እና ወደ በርዎ የተደረሱ።",
    timeless: "ዘላለማዊ ውበት",
    timeless_sub: "ከከፍተኛ ደረጃ ምርቶች የተወሰኑ ሰዓቶች፣ የተረጋገጡ እና የተደረሱ።",
    todays_deals: "የዛሬ ቅናሾች",
    see_all: "ሁሉንም ይመልከቱ",
    see_all_deals: "ሁሉንም ቅናሾች ይመልከቱ",
    shop_by_category: "በምድብ ይግዙ",
    electronics: "ኤሌክትሮኒክስ",
    fashion: "ፋሽን",
    home_living: "ቤት እና አትናት",
    beauty_health: "ውበት እና ጤና",
    groceries: "ለማብሰያ",
    kids: "ልጆች",
    other: "ሌላ",
    watches: "ሰዓቶች",
    shoes_perfumes: "ጫማዎች እና ሽቶዎች",
    fast_delivery: "ፈጣን እና ነፃ አቅርቦት",
    fast_delivery_sub: "በብዙ ምርቶች ላይ",
    pay_on_delivery: "በመድረሻ ይክፈሉ",
    pay_on_delivery_sub: "ጥሬ በመድረሻ መክፈል ይቻላል",
    top_brands: "ከፍተኛ ደረጃ ምርቶች",
    top_brands_sub: "100% ኦሪጅናል ምርቶች",
    support: "24/7 የደንበኛ እገዛ",
    support_sub: "እኛ ለርዎ እንገኛለን",
    membership_title: "አንድ አባልነት፣ ብዙ ጥቅሞች",
    membership_sub: "ለነፃ አቅርቦት፣ ልዩ ቅናሾች እና ቅድሚያ የመራጃ አገልግሎት ይቀላቹ።",
    join_now: "አሁን ይቀላቹ",
    all_items: "ሁሉም ምርቶች",
    no_items: "ምርት አልተገኘም።",
    footer: "ኤትዮብሪጅ · ከዱባይ ወደ አዲስ አበባ አቅርቦት አገልግሎት",
    search_placeholder: "ምርቶችን ይፈልጉ…",
    cart: "ጋሪ",
    my_orders: "የእኔ ትዕዛዞች",
    picker: "መራጫ",
    admin: "አስተዳዳሪ",
    tickets: "ቲኬቶች",
    visa: "ቪዛ",
    pickers: "መራጮች",
  },
};

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => (typeof window !== "undefined" && localStorage.getItem("ethio_lang")) || "en");
  useEffect(() => { localStorage.setItem("ethio_lang", lang); }, [lang]);
  const t = (key) => dict[lang]?.[key] ?? dict.en[key] ?? key;
  const toggle = () => setLang((l) => (l === "en" ? "am" : "en"));
  return <LanguageContext.Provider value={{ lang, setLang, toggle, t }}>{children}</LanguageContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) return { lang: "en", setLang: () => {}, toggle: () => {}, t: (k) => k };
  return ctx;
}