const departments = [
  { id: "umrah", title: "برامج العمرة", subtitle: "رحلات مختارة إلى مكة والمدينة", icon: "☾", kind: "default" },
  { id: "hajj", title: "برامج الحج", subtitle: "برامج حج بتنظيم وعناية", icon: "✧", kind: "light" },
  { id: "offers", title: "عروض خاصة", subtitle: "فرص مميزة على برامج مختارة", icon: "◇", kind: "default" },
  { id: "flights", title: "تذاكر الطيران", subtitle: "نساعدك في ترتيب رحلتك الجوية", icon: "✈", kind: "light" },
  { id: "visas", title: "التأشيرات", subtitle: "استفسر عن خدمات التأشيرات", icon: "▤", kind: "default" }
];

const trips = [
  {
    id: "umrah-sphinx-september",
    name: "عمرة 29 سبتمبر — طيران سفنكس",
    type: "عمرة",
    categories: ["umrah"],
    departures: ["29 سبتمبر"],
    duration: "15 يوم",
    makkah: "صفوة البيت / ميسان",
    makkahDistance: "غير محدد",
    madinah: "المدينة المنورة",
    madinahDistance: "غير محدد",
    airline: "طيران سفنكس",
    prices: { "رباعي": 34900, "ثلاثي": 37000, "ثنائي": 39000 },
    features: ["طيران سفنكس مباشر", "فنادق مميزة قريبة من الحرم", "تنظيم ومتابعة من فريق الوفاء"],
    badge: "أقرب رحلة",
    summary: "برنامج عمرة لمدة 15 يوماً مع خيارات تسكين متعددة وخدمة متابعة من فريقنا."
  },
  {
    id: "umrah-air-cairo-october",
    name: "عمرة أكتوبر — إير كايرو",
    type: "عمرة",
    categories: ["umrah"],
    departures: ["6 أكتوبر", "15 أكتوبر", "21 أكتوبر"],
    duration: "15 يوم (11 مكة / 4 المدينة)",
    makkah: "نسمات الخير (5 نجوم)",
    makkahDistance: "غير محدد",
    madinah: "أمجاد الغراء (5 نجوم)",
    madinahDistance: "غير محدد",
    airline: "إير كايرو (القاهرة — ينبع / جدة)",
    prices: { "رباعي": 39500 },
    features: ["طيران إير كايرو", "إمكانية التقسيط على 8 شهور", "فنادق 5 نجوم"],
    badge: "تقسيط متاح",
    summary: "رحلة واحدة بثلاثة مواعيد مغادرة للاختيار بينها، مع إقامة في فنادق خمس نجوم."
  },
  {
    id: "umrah-maysan-sep-oct",
    name: "عمرة شهر 9 و10 — ميسان القياسي",
    type: "عمرة",
    categories: ["umrah", "offers"],
    departures: ["21 سبتمبر", "28 سبتمبر", "5 أكتوبر", "12 أكتوبر", "19 أكتوبر"],
    duration: "15 يوم",
    makkah: "ميسان القياسي",
    makkahDistance: "1900 متر",
    madinah: "برج مودة أو منى السلام",
    madinahDistance: "غير محدد",
    airline: "غير محدد",
    prices: { "رباعي": 31900 },
    features: ["عرض خاص اقتصادي", "باصات ترددية للحرم طوال اليوم"],
    badge: "عرض خاص",
    summary: "برنامج اقتصادي بمواعيد متعددة وخدمة باصات ترددية إلى الحرم طوال اليوم."
  },
  {
    id: "umrah-safwa-september",
    name: "عمرة 30 سبتمبر — صفوة البيت",
    type: "عمرة",
    categories: ["umrah"],
    departures: ["30 سبتمبر"],
    duration: "15 يوم",
    makkah: "فندق صفوة البيت",
    makkahDistance: "غير محدد",
    madinah: "فندق منار الإيمان",
    madinahDistance: "غير محدد",
    airline: "غير محدد",
    prices: { "رباعي": 35000 },
    features: ["خدمات متكاملة وتنظيم احترافي", "متابعة دائمة من الفريق"],
    badge: "مميز",
    summary: "إقامة في فندق صفوة البيت بمكة وفندق منار الإيمان بالمدينة، مع متابعة من فريقنا."
  },
  {
    id: "hajj-direct-2027",
    name: "برنامج الحج المباشر — طوافة 5 نجوم",
    type: "حج",
    categories: ["hajj"],
    departures: ["8 مايو 2027"],
    duration: "20 يوم / 19 ليلة",
    makkah: "سنود أجياد",
    makkahDistance: "450 متر",
    madinah: "إعمار رويال",
    madinahDistance: "200 متر",
    airline: "غير محدد",
    prices: { "رباعي": 560000, "ثلاثي": 600000, "ثنائي": 690000 },
    features: ["إشراف ديني (د. الشحات عزازي)", "بوفيه إفطار وعشاء", "أتوبيسات فاخرة موديل 2027"],
    badge: "حج فاخر",
    summary: "برنامج حج لمدة 20 يوماً مع إقامة قريبة وإشراف ديني وخدمات ضيافة ونقل."
  }
];

window.AlWafaaData = {
  departments,
  trips,
  whatsappNumber: "201034196"
};
