(() => {
  "use strict";

  const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTFXnAKYvMReHVAPotobX9eM_V-iNiSoUIrpebrOe4bjJGwR-DvOMRe1qwg5uA5Wrca2_R7LiFAAsS6/pub?output=csv";
  const WHATSAPP_NUMBER = "201140078016";
  const app = document.getElementById("app");
  const currentYear = document.getElementById("current-year");
  let serviceRecords = [];
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
    const tables = { departments: [], services: [] };
    const tableHeaders = [];
    let serviceTableIndex = 0;

    rows.forEach((row, rowIndex) => {
      row.forEach((cell, columnIndex) => {
        const firstHeader = normalizeHeader(cell);
        const nextHeader = normalizeHeader(row[columnIndex + 1]);
        const thirdHeader = normalizeHeader(row[columnIndex + 2]);
        const isDepartmentTable = columnIndex === 0 &&
          firstHeader === "departmentid" &&
          nextHeader === "title" &&
          thirdHeader === "image";
        const isFlightTable = firstHeader === "id" &&
          nextHeader === "from" &&
          thirdHeader === "to";
        const isReligiousTable = firstHeader === "id" &&
          nextHeader === "title" &&
          (thirdHeader === "category" ||
            row.slice(columnIndex + 1).some((value) => normalizeHeader(value) === "makkahotel"));
        const isDepartmentServiceTable = firstHeader === "id" &&
          nextHeader === "departmentid" &&
          thirdHeader === "title";
        const isServiceTable = isFlightTable || isReligiousTable || isDepartmentServiceTable;
        if (isDepartmentTable || isServiceTable) {
          const headers = row.slice(columnIndex).map(normalizeHeader);
          tableHeaders.push({
            rowIndex,
            columnIndex,
            headers,
            type: isDepartmentTable ? "departments" : "services",
            kind: isFlightTable ? "flight" : "religious"
          });
        }
      });
    });

    if (!tableHeaders.some((header) => header.type === "departments")) {
      throw new Error("لم نعثر على جدول الأقسام الذي يحتوي Department_ID وTitle وImage.");
    }
    tableHeaders.forEach((tableHeader) => {
      const { rowIndex, columnIndex, headers } = tableHeader;
      const nextTable = tableHeaders.find((header) =>
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

      for (let dataIndex = rowIndex + 1; dataIndex < rows.length; dataIndex += 1) {
        const cells = rows[dataIndex];
        const hasAnotherHeader = tableHeaders.some((header) => header.rowIndex === dataIndex);
        if (hasAnotherHeader) break;
        const values = cells.slice(columnIndex, columnIndex + width);
        if (!values.some((value) => value.trim())) continue;
        if (tableHeader.type === "departments") {
          const department = {
            id: get(cells, "departmentid"),
            title: get(cells, "title"),
            image: get(cells, "image")
          };
          if (department.id && department.title) tables.departments.push(department);
          continue;
        }

        const isFlight = headerIndexes.has("from") && headerIndexes.has("to");
        const record = {
          kind: isFlight ? "flight" : "religious",
          id: get(cells, "id"),
          tableIndex: serviceTableIndex,
          departmentId: get(cells, "departmentid"),
          from: get(cells, "from"),
          to: get(cells, "to"),
          title: get(cells, "title"),
          category: get(cells, "category"),
          date: get(cells, "date"),
          duration: get(cells, "duration"),
          airline: get(cells, "airline"),
          ticketClass: get(cells, "ticketclass"),
          tripType: get(cells, "triptype"),
          price: get(cells, "priceeg"),
          seats: get(cells, "availableseats"),
          weight: get(cells, "weight"),
          makkahHotel: get(cells, "makkahotel"),
          makkahDistance: get(cells, "makkadist"),
          madinahHotel: get(cells, "madinahotel"),
          image: get(cells, "image"),
          description: get(cells, "description"),
          offer: get(cells, "offer")
        };
        const hasRequiredDetails = isFlight
          ? record.from && record.to
          : record.title || record.makkahHotel || record.madinahHotel;
        if (hasRequiredDetails) tables.services.push(record);
      }
      if (tableHeader.type === "services") serviceTableIndex += 1;
    });

    const normalizedDepartments = tables.departments.map((department) => ({
      ...department,
      normalizedId: normalizeHeader(department.id),
      normalizedTitle: normalizeHeader(department.title)
    }));
    tables.services.forEach((service) => {
      const category = normalizeHeader(service.category);
      const explicitId = normalizeHeader(service.departmentId);
      const explicitDepartment = explicitId
        ? normalizedDepartments.find((department) => explicitId === department.normalizedId)
        : undefined;
      const matchedDepartment = normalizedDepartments.find((department) =>
        category && (
          category === department.normalizedId ||
          category === department.normalizedTitle ||
          category.includes(department.normalizedId) ||
          department.normalizedId.includes(category)
        )
      );
      const flightDepartment = service.kind === "flight"
        ? normalizedDepartments.find((department) =>
            department.normalizedId.includes("flight") ||
            department.normalizedTitle.includes("flight") ||
            department.normalizedTitle.includes("طيران")
          )
        : undefined;
      const orderedDepartment = normalizedDepartments[service.tableIndex];
      const department = explicitDepartment || flightDepartment || matchedDepartment || orderedDepartment;
      service.departmentId = department?.id || service.departmentId;
      service.departmentTitle = department?.title || "";
      delete service.tableIndex;
    });
    return tables;
  }

  function whatsappUrl(record) {
    const serviceName = record.kind === "flight"
      ? `تذكرة طيران: ${displayValue(record.from)} إلى ${displayValue(record.to)}`
      : `برنامج ${categoryLabel(record.category || record.departmentTitle)}: ${displayValue(record.title)}`;
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
    if (value === undefined || value === null || !String(value).trim()) return "";
    return `<div class="service-detail"><span>${escapeHtml(label)}</span><strong>${escapeHtml(displayValue(value))}</strong></div>`;
  }

  function serviceTitle(record) {
    return record.kind === "flight"
      ? `${displayValue(record.from)} إلى ${displayValue(record.to)}`
      : displayValue(record.title);
  }

  function serviceDetails(record) {
    const isFlight = record.kind === "flight";
    const details = isFlight
      ? [
          ["شركة الطيران", record.airline],
          ["التاريخ", record.date],
          ["درجة التذكرة", record.ticketClass],
          ["نوع الرحلة", record.tripType],
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
          ["شركة الطيران", record.airline],
          ["المقاعد المتاحة", record.seats]
        ];
    return details;
  }

  function serviceCard(record, index) {
    const isFlight = record.kind === "flight";
    const isOffer = String(record.offer).trim().toLocaleLowerCase("en") === "yes";
    const title = serviceTitle(record);
    const category = isFlight
      ? "تذاكر الطيران"
      : categoryLabel(record.category || record.departmentTitle);
    const summaryDetails = isFlight
      ? [["التاريخ", record.date], ["درجة التذكرة", record.ticketClass]]
      : [["التاريخ", record.date], ["مدة البرنامج", record.duration]];
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
          <div class="service-details service-summary">${summaryDetails.map(([label, value]) => detailItem(label, value)).join("")}</div>
          <div class="service-card-footer">
            <span class="service-price">${escapeHtml(formatPrice(record.price))}</span>
            <div class="service-card-actions">
              <button class="button button-details" type="button" data-show-details="${index}">عرض التفاصيل</button>
              <a class="button button-whatsapp" href="${escapeHtml(whatsappUrl(record))}" target="_blank" rel="noopener noreferrer">احجز الآن <span aria-hidden="true">↗</span></a>
            </div>
          </div>
        </div>
      </article>`;
  }

  function serviceDetailsMarkup(record) {
    const title = serviceTitle(record);
    const description = String(record.description ?? "").trim();
    const category = record.kind === "flight"
      ? "تذاكر الطيران"
      : categoryLabel(record.category || record.departmentTitle);
    return `
      <div class="service-modal-heading">
        ${imageMarkup(record, title)}
        <div class="service-modal-title">
          <span class="service-category">${escapeHtml(category)}</span>
          <h2 id="service-modal-title">${escapeHtml(title)}</h2>
          <span class="service-price">${escapeHtml(formatPrice(record.price))}</span>
        </div>
      </div>
      <div class="service-details service-modal-details">${serviceDetails(record).map(([label, value]) => detailItem(label, value)).join("")}</div>
      ${description ? `<section class="service-modal-description"><h3>تفاصيل الخدمة</h3><p>${escapeHtml(description)}</p></section>` : ""}`;
  }

  function sectionMarkup(id, eyebrow, title, description, records, allServices) {
    const content = records.length
      ? `<div class="service-grid">${records.map((record) => serviceCard(record, allServices.indexOf(record))).join("")}</div>`
      : `<p class="section-empty">لا توجد عروض متاحة حالياً. تواصل معنا لمعرفة أحدث الخيارات.</p>`;
    return `
      <section class="content-section dynamic-section page-panel" data-page="${escapeHtml(id)}">
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

  function departmentCard(department) {
    let image = '<span class="department-card-placeholder" aria-hidden="true">✧</span>';
    if (department.image) {
      try {
        const imageUrl = new URL(department.image, window.location.href);
        if (["http:", "https:"].includes(imageUrl.protocol)) {
          image = `<img class="department-card-image" src="${escapeHtml(imageUrl.href)}" alt="${escapeHtml(department.title)}" loading="lazy">`;
        }
      } catch {
        image = '<span class="department-card-placeholder" aria-hidden="true">✧</span>';
      }
    }
    return `
      <a class="department-card" href="#department/${encodeURIComponent(department.id)}">
        ${image}
        <span class="department-card-overlay"></span>
        <span class="department-info"><h3>${escapeHtml(department.title)}</h3></span>
        <span class="department-arrow" aria-hidden="true">←</span>
      </a>`;
  }

  function renderHome(tables) {
    serviceRecords = tables.services;
    const offers = tables.services
      .filter((record) => String(record.offer).trim().toLocaleLowerCase("en") === "yes");
    const departments = tables.departments;
    const departmentCards = departments.length
      ? `<div class="department-grid">${departments.map(departmentCard).join("")}</div>`
      : '<p class="section-empty">لا توجد أقسام متاحة حالياً.</p>';
    const departmentSections = departments.map((department) => {
      const services = tables.services.filter((service) => service.departmentId === department.id);
      return sectionMarkup(
        `department:${department.id}`,
        "القسم",
        department.title,
        `استكشف خدمات ${department.title} وتفاصيل الرحلات المتاحة.`,
        services,
        tables.services
      );
    }).join("");
    const firstDepartmentAction = departments[0]
      ? `<a class="button button-ghost" href="#department/${encodeURIComponent(departments[0].id)}">تعرّف على ${escapeHtml(departments[0].title)}</a>`
      : "";

    document.querySelector(".main-nav").innerHTML = `
      <a href="#home">الرئيسية</a>
      <a href="#offers">العروض الخاصة</a>
      ${departments.map((department) =>
        `<a href="#department/${encodeURIComponent(department.id)}">${escapeHtml(department.title)}</a>`
      ).join("")}`;

    app.innerHTML = `
      <div class="page-panel home-panel" data-page="home" id="home">
        <section class="hero">
          <div class="hero-inner">
            <div class="hero-copy">
              <span class="eyebrow">الوفاء ترافل · رحلتك تبدأ من هنا</span>
              <h1>رحلتك القادمة<br><em>بكل عناية ووفاء</em></h1>
              <p>اكتشف خدماتنا، وتواصل مباشرة مع فريقنا لحجز رحلتك بكل سهولة.</p>
              <div class="hero-actions">
                <a class="button button-primary" href="#offers">اكتشف العروض المميزة <span aria-hidden="true">←</span></a>
                ${firstDepartmentAction}
              </div>
            </div>
            <div class="hero-art" aria-hidden="true">
              <span class="hero-orbit"></span>
              <img class="hero-logo-img" src="kabaa-logo-1.png" alt="" width="220" height="220">
              <span class="floating-note">الوفاء ترافل<span>نرافقك في كل خطوة</span></span>
            </div>
          </div>
        </section>
        <section class="content-section home-departments" aria-labelledby="departments-heading">
          <div class="section-heading"><div><span class="section-kicker">خدماتنا</span><h2 id="departments-heading">اختر القسم المناسب لرحلتك</h2><p>استعرض الخدمات المتاحة في كل قسم.</p></div></div>
          ${departmentCards}
        </section>
      </div>
      ${sectionMarkup("offers", "عروض مميزة", "عروض خاصة 🔥", "أفضل الفرص المختارة من جميع الأقسام.", offers, tables.services)}
      ${departmentSections}
      <dialog class="service-modal" id="service-details-modal" aria-labelledby="service-modal-title">
        <button class="service-modal-close" type="button" data-close-details aria-label="إغلاق التفاصيل">×</button>
        <div class="service-modal-content" data-modal-content></div>
      </dialog>
    `;
    updateActivePage();
  }

  function updateActivePage() {
    let requestedPage = window.location.hash.slice(1);
    let page = "home";

    if (requestedPage === "offers") {
      page = "offers";
    } else if (requestedPage.startsWith("department/")) {
      try {
        const departmentId = decodeURIComponent(requestedPage.slice("department/".length));
        if ([...app.querySelectorAll(".page-panel")]
          .some((panel) => panel.dataset.page === `department:${departmentId}`)) {
          page = `department:${departmentId}`;
        }
      } catch {
        page = "home";
      }
    } else if (requestedPage && requestedPage !== "home") {
      const department = [...app.querySelectorAll(".department-card")]
        .find((card) => {
          try {
            return decodeURIComponent(card.getAttribute("href").split("/").pop()) === requestedPage;
          } catch {
            return false;
          }
        });
      if (department) page = `department:${requestedPage}`;
    }

    app.querySelectorAll(".page-panel").forEach((panel) => {
      panel.hidden = panel.dataset.page !== page;
    });
    document.querySelectorAll(".main-nav a").forEach((link) => {
      const isActive = page.startsWith("department:")
        ? link.hash === `#department/${encodeURIComponent(page.slice("department:".length))}`
        : link.hash === `#${page}`;
      if (isActive) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
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
    if (!(event.target instanceof Element)) return;
    if (event.target.closest("[data-retry]")) {
      loadOffers();
      return;
    }
    const detailsButton = event.target.closest("[data-show-details]");
    if (detailsButton) {
      const record = serviceRecords[Number(detailsButton.dataset.showDetails)];
      const modal = app.querySelector("#service-details-modal");
      if (!record || !(modal instanceof HTMLDialogElement)) return;
      modal.querySelector("[data-modal-content]").innerHTML = serviceDetailsMarkup(record);
      modal.showModal();
      return;
    }
    const closeButton = event.target.closest("[data-close-details]");
    if (closeButton) {
      app.querySelector("#service-details-modal")?.close();
    }
  });
  app.addEventListener("click", (event) => {
    const modal = app.querySelector("#service-details-modal");
    if (event.target === modal && modal instanceof HTMLDialogElement) modal.close();
  });

  window.addEventListener("hashchange", () => {
    updateActivePage();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  document.querySelectorAll("[data-business-contact]").forEach((link) => {
    link.href = `https://wa.me/${WHATSAPP_NUMBER}`;
  });
  if (!window.location.hash) {
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#home`);
  }
  loadOffers();
})();
