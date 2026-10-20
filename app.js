(() => {
  "use strict";

  const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTFXnAKYvMReHVAPotobX9eM_V-iNiSoUIrpebrOe4bjJGwR-DvOMRe1qwg5uA5Wrca2_R7LiFAAsS6/pub?output=csv";
  const WHATSAPP_NUMBER = "201140078016";
  const app = document.getElementById("app");
  const currentYear = document.getElementById("current-year");
  const knownHeaders = new Set([
    "id", "from", "to", "date", "duration", "airline", "ticketclass",
    "priceeg", "availableseats", "triptype", "weight", "image",
    "description", "offer", "title", "category", "makkahotel",
    "makkadist", "madinahotel", "totalseats", "bookedseats"
  ]);

  currentYear.textContent = new Date().getFullYear();

  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);

  const normalizeHeader = (value) => String(value ?? "")
    .replace(/^\uFEFF/, "")
    .toLocaleLowerCase("en")
    .replace(/[^a-z0-9]/g, "");

  const displayValue = (value) => String(value ?? "").trim() || "غير محدد";
  const numericValue = (value) => {
    const numericText = String(value ?? "").trim().replace(/[,\s٬]/g, "");
    if (!numericText) return undefined;
    const number = Number(numericText);
    return Number.isFinite(number) ? number : undefined;
  };
  const categoryLabel = (value) => {
    const category = String(value ?? "").trim();
    const normalized = category.toLocaleLowerCase("en");
    if (normalized === "umrah" || category.includes("عمرة")) return "العمرة";
    if (normalized === "hajj" || category.includes("حج")) return "الحج";
    return displayValue(category);
  };

  function formatPrice(value) {
    const rawPrice = String(value ?? "").trim();
    if (!rawPrice) return "السعر عند الاستفسار";
    const numericText = rawPrice.replace(/[,\s٬]/g, "").replace(/[^\d.-]/g, "");
    const numericPrice = numericText ? Number(numericText) : NaN;
    const formatted = Number.isFinite(numericPrice)
      ? new Intl.NumberFormat("en-US").format(numericPrice)
      : rawPrice;
    return `${formatted} ج.م`;
  }

  function parseCsv(text) {
    const rows = [];
    let row = [];
    let cell = "";
    let quoted = false;

    for (let index = 0; index < text.length; index += 1) {
      const character = text[index];
      if (character === '"') {
        if (quoted && text[index + 1] === '"') {
          cell += '"';
          index += 1;
        } else {
          quoted = !quoted;
        }
      } else if (character === "," && !quoted) {
        row.push(cell);
        cell = "";
      } else if ((character === "\n" || character === "\r") && !quoted) {
        if (character === "\r" && text[index + 1] === "\n") index += 1;
        row.push(cell);
        if (row.some((entry) => entry.trim())) rows.push(row);
        row = [];
        cell = "";
      } else {
        cell += character;
      }
    }

    if (cell || row.length) {
      row.push(cell);
      if (row.some((entry) => entry.trim())) rows.push(row);
    }
    return rows;
  }

  function readTables(csvText) {
    const rows = parseCsv(csvText);
    const tables = { flights: [], religious: [] };
    const headerRows = [];

    rows.forEach((row, rowIndex) => {
      row.forEach((cell, columnIndex) => {
        if (normalizeHeader(cell) !== "id") return;
        const headers = row.slice(columnIndex).map(normalizeHeader);
        if (headers.some((header) => knownHeaders.has(header))) {
          headerRows.push({ rowIndex, columnIndex, headers });
        }
      });
    });

    if (!headerRows.length) {
      throw new Error("لم نعثر على صفوف العناوين المتوقعة في ملف CSV.");
    }

    headerRows.forEach((tableHeader) => {
      const { rowIndex, columnIndex, headers } = tableHeader;
      const nextTable = headerRows.find((header) =>
        header.rowIndex === rowIndex && header.columnIndex > columnIndex
      );
      const width = nextTable
        ? nextTable.columnIndex - columnIndex
        : headers.length;
      const headerIndexes = new Map();
      headers.slice(0, width).forEach((header, index) => {
        if (header) headerIndexes.set(header, columnIndex + index);
      });
      const get = (cells, ...keys) => {
        for (const key of keys) {
          const index = headerIndexes.get(key);
          if (index !== undefined && cells[index] !== undefined) return cells[index].trim();
        }
        return "";
      };
      const isFlightTable = headerIndexes.has("from") || headerIndexes.has("ticketclass");
      const isReligiousTable = headerIndexes.has("title") || headerIndexes.has("makkahotel");
      if (!isFlightTable && !isReligiousTable) return;

      for (let dataIndex = rowIndex + 1; dataIndex < rows.length; dataIndex += 1) {
        const cells = rows[dataIndex];
        const hasAnotherHeader = headerRows.some((header) => header.rowIndex === dataIndex);
        if (hasAnotherHeader) break;
        const values = cells.slice(columnIndex, columnIndex + width);
        if (!values.some((value) => value.trim())) continue;
        const id = get(cells, "id");
        const record = isFlightTable ? {
          kind: "flight",
          id,
          from: get(cells, "from"),
          to: get(cells, "to"),
          date: get(cells, "date"),
          duration: get(cells, "duration"),
          airline: get(cells, "airline"),
          ticketClass: get(cells, "ticketclass"),
          price: get(cells, "priceeg"),
          seats: get(cells, "availableseats"),
          weight: get(cells, "weight"),
          image: get(cells, "image"),
          description: get(cells, "description"),
          offer: get(cells, "offer")
        } : {
          kind: "religious",
          id,
          title: get(cells, "title"),
          category: get(cells, "category"),
          date: get(cells, "date"),
          price: get(cells, "priceeg"),
          makkahHotel: get(cells, "makkahotel"),
          makkahDistance: get(cells, "makkadist"),
          madinahHotel: get(cells, "madinahotel"),
          totalSeats: get(cells, "totalseats"),
          bookedSeats: get(cells, "bookedseats"),
          duration: get(cells, "duration"),
          image: get(cells, "image"),
          description: get(cells, "description"),
          airline: get(cells, "airline"),
          offer: get(cells, "offer")
        };
        const hasDetails = Object.entries(record)
          .some(([key, value]) => key !== "kind" && key !== "id" && String(value).trim());
        if (!hasDetails || (isFlightTable && (!record.from || !record.to)) ||
          (isReligiousTable && !record.title)) continue;
        if (isFlightTable) tables.flights.push(record);
        else tables.religious.push(record);
      }
    });
    return tables;
  }

  function whatsappUrl(record) {
    const serviceName = record.kind === "flight"
      ? `تذكرة طيران: ${displayValue(record.from)} إلى ${displayValue(record.to)}`
      : `برنامج ${categoryLabel(record.category)}: ${displayValue(record.title)}`;
    const message = [
      "السلام عليكم، أرغب في الاستفسار والحجز:",
      serviceName,
      `التاريخ: ${displayValue(record.date)}`,
      `السعر: ${formatPrice(record.price)}`,
      `رقم العرض: ${displayValue(record.id)}`
    ].join("\n");
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  }

  function imageMarkup(record, alt) {
    const image = String(record.image ?? "").trim();
    if (!image) return `<div class="service-image-placeholder" aria-hidden="true">✧</div>`;
    let imageUrl;
    try {
      imageUrl = new URL(image, window.location.href);
    } catch {
      return `<div class="service-image-placeholder" aria-hidden="true">✧</div>`;
    }
    if (!["http:", "https:"].includes(imageUrl.protocol)) {
      return `<div class="service-image-placeholder" aria-hidden="true">✧</div>`;
    }
    return `<img class="service-image" src="${escapeHtml(imageUrl.href)}" alt="${escapeHtml(alt)}" loading="lazy">`;
  }

  function detailItem(label, value) {
    return `<div class="service-detail"><span>${escapeHtml(label)}</span><strong>${escapeHtml(displayValue(value))}</strong></div>`;
  }

  function serviceCard(record) {
    const isFlight = record.kind === "flight";
    const isOffer = String(record.offer).trim().toLocaleLowerCase("en") === "yes";
    const title = isFlight
      ? `${displayValue(record.from)} إلى ${displayValue(record.to)}`
      : displayValue(record.title);
    const category = isFlight ? "تذاكر الطيران" : categoryLabel(record.category);
    const totalSeats = numericValue(record.totalSeats);
    const bookedSeats = numericValue(record.bookedSeats);
    const details = isFlight
      ? [
          ["شركة الطيران", record.airline],
          ["التاريخ", record.date],
          ["درجة التذكرة", record.ticketClass],
          ["المقاعد المتاحة", record.seats],
          ["الوزن", record.weight],
          ["مدة الرحلة", record.duration]
        ]
      : [
          ["التاريخ", record.date],
          ["فندق مكة", record.makkahHotel],
          ["المسافة إلى الحرم", record.makkahDistance],
          ["فندق المدينة", record.madinahHotel],
          ["مدة البرنامج", record.duration],
          ["المقاعد المتاحة", totalSeats !== undefined && bookedSeats !== undefined
            ? Math.max(0, totalSeats - bookedSeats)
            : record.totalSeats]
        ];
    const description = String(record.description ?? "").trim();
    return `
      <article class="service-card">
        ${imageMarkup(record, title)}
        <div class="service-card-content">
          <div class="service-card-heading">
            <span class="service-category">${escapeHtml(category)}</span>
            <span class="service-card-tags">
              ${isOffer ? '<span class="service-offer-badge">عرض خاص 🔥</span>' : ""}
              <span class="service-id">#${escapeHtml(record.id || "—")}</span>
            </span>
          </div>
          <h3>${escapeHtml(title)}</h3>
          ${isFlight ? `<p class="service-route">${escapeHtml(displayValue(record.airline))}</p>` : ""}
          <div class="service-details">${details.map(([label, value]) => detailItem(label, value)).join("")}</div>
          ${description ? `<p class="service-description">${escapeHtml(description)}</p>` : ""}
          <div class="service-card-footer">
            <span class="service-price">${escapeHtml(formatPrice(record.price))}</span>
            <a class="button button-whatsapp" href="${escapeHtml(whatsappUrl(record))}" target="_blank" rel="noopener noreferrer">احجز الآن <span aria-hidden="true">↗</span></a>
          </div>
        </div>
      </article>`;
  }

  function sectionMarkup(id, eyebrow, title, description, records) {
    const content = records.length
      ? `<div class="service-grid">${records.map(serviceCard).join("")}</div>`
      : `<p class="section-empty">لا توجد عروض متاحة حالياً. تواصل معنا لمعرفة أحدث الخيارات.</p>`;
    return `
      <section class="content-section dynamic-section" id="${id}">
        <div class="section-heading">
          <div>
            <span class="section-kicker">${escapeHtml(eyebrow)}</span>
            <h2>${escapeHtml(title)}</h2>
            <p>${escapeHtml(description)}</p>
          </div>
        </div>
        ${content}
      </section>`;
  }

  function renderHome(tables) {
    const offers = [...tables.flights, ...tables.religious]
      .filter((record) => String(record.offer).trim().toLocaleLowerCase("en") === "yes");
    app.innerHTML = `
      <section class="hero" id="home">
        <div class="hero-inner">
          <div class="hero-copy">
            <span class="eyebrow">الوفاء ترافل · رحلتك تبدأ من هنا</span>
            <h1>رحلتك القادمة<br><em>بكل عناية ووفاء</em></h1>
            <p>اكتشف عروض الطيران وبرامج الحج والعمرة، وتواصل مباشرة مع فريقنا لحجز رحلتك بكل سهولة.</p>
            <div class="hero-actions">
              <a class="button button-primary" href="#offers">اكتشف العروض المميزة <span aria-hidden="true">←</span></a>
              <a class="button button-ghost" href="#flights">تصفح الرحلات الجوية</a>
            </div>
          </div>
          <div class="hero-art" aria-hidden="true">
            <span class="hero-orbit"></span>
            <img class="hero-logo-img" src="kabaa-logo-1.png" alt="" width="220" height="220">
            <span class="floating-note">الوفاء ترافل<span>نرافقك في كل خطوة</span></span>
          </div>
        </div>
      </section>
      <section class="trust-strip" aria-label="مميزات الوفاء ترافل">
        <div class="trust-inner">
          <div class="trust-item"><span class="trust-icon" aria-hidden="true">✧</span><span><strong>عروض محدثة</strong><small>من جدولنا مباشرة</small></span></div>
          <div class="trust-item"><span class="trust-icon" aria-hidden="true">✈</span><span><strong>خيارات سفر متنوعة</strong><small>طيران وبرامج دينية</small></span></div>
          <div class="trust-item"><span class="trust-icon" aria-hidden="true">☏</span><span><strong>حجز مباشر</strong><small>تواصل معنا عبر واتساب</small></span></div>
        </div>
      </section>
      ${sectionMarkup("offers", "عروض مميزة", "عروض خاصة 🔥", "أفضل الفرص المختارة من برامجنا وتذاكر الطيران.", offers)}
      ${sectionMarkup("flights", "رحلاتك الجوية", "حجز تذاكر الطيران", "تفاصيل الرحلات والأسعار والمقاعد المتاحة.", tables.flights)}
      ${sectionMarkup("religious", "رحلات إيمانية", "برامج الحج والعمرة", "إقامة مريحة وتفاصيل واضحة لتخطط لرحلتك المباركة.", tables.religious)}
    `;
  }

  function renderState(title, message, isError = false) {
    app.innerHTML = `
      <section class="content-section data-state${isError ? " data-state-error" : ""}" role="${isError ? "alert" : "status"}">
        ${isError ? "" : '<span class="loading-spinner" aria-hidden="true"></span>'}
        <h1>${escapeHtml(title)}</h1>
        <p>${escapeHtml(message)}</p>
        ${isError ? '<button class="button button-primary" type="button" data-retry>إعادة المحاولة</button>' : ""}
      </section>`;
  }

  async function loadOffers() {
    renderState("نجهّز رحلتك", "جارٍ تحميل أحدث عروض الطيران وبرامج الحج والعمرة...");
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch(SHEET_CSV_URL, {
        signal: controller.signal,
        cache: "no-store"
      });
      if (!response.ok) throw new Error(`فشل تحميل جدول العروض (HTTP ${response.status}).`);
      const csvText = await response.text();
      const tables = readTables(csvText);
      renderHome(tables);
      document.querySelectorAll("[data-business-contact]").forEach((link) => {
        link.href = `https://wa.me/${WHATSAPP_NUMBER}`;
      });
    } catch (error) {
      const message = error.name === "AbortError"
        ? "استغرق تحميل البيانات وقتاً أطول من المتوقع. تحقق من اتصالك وحاول مرة أخرى."
        : error instanceof TypeError
          ? "تعذر الاتصال بجدول البيانات. تحقق من اتصال الإنترنت وإعدادات مشاركة CSV."
          : error.message || "حدث خطأ أثناء تحميل بيانات الرحلات.";
      renderState("تعذر تحميل العروض", message, true);
    } finally {
      window.clearTimeout(timeout);
    }
  }

  app.addEventListener("click", (event) => {
    if (event.target instanceof Element && event.target.closest("[data-retry]")) {
      loadOffers();
    }
  });

  document.querySelectorAll("[data-business-contact]").forEach((link) => {
    link.href = `https://wa.me/${WHATSAPP_NUMBER}`;
  });
  loadOffers();
})();
