(() => {
  "use strict";

  const { departments, trips, whatsappNumber } = window.AlWafaaData;
  const app = document.getElementById("app");
  const currentYear = document.getElementById("current-year");
  let activeRoute = { type: "home" };

  currentYear.textContent = new Date().getFullYear();

  const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);

  const formatPrice = (price) => new Intl.NumberFormat("en-US").format(price);
  const formatProgramCount = (count) => count === 1 ? "برنامج واحد متاح" : `${count} برامج متاحة`;
  const departmentFor = (id) => departments.find((department) => department.id === id);
  const tripFor = (id) => trips.find((trip) => trip.id === id);
  const tripUrl = (id) => `#trip/${encodeURIComponent(id)}`;
  const categoryUrl = (id) => `#category/${encodeURIComponent(id)}`;
  const whatsappUrl = (message = "") =>
    `https://wa.me/${whatsappNumber}${message ? `?text=${encodeURIComponent(message)}` : ""}`;

  document.querySelectorAll("[data-business-contact]").forEach((link) => {
    link.href = whatsappUrl();
  });

  function tripCard(trip) {
    const firstPrice = Object.values(trip.prices)[0];
    const departureCount = trip.departures.length;
    const searchable = [trip.name, trip.airline, trip.summary].join(" ").toLocaleLowerCase("ar");

    return `
      <article class="trip-card" data-search="${escapeHtml(searchable)}">
        <div class="trip-card-top">
          <span class="trip-badge">${escapeHtml(trip.badge)}</span>
          <span class="trip-category">${escapeHtml(trip.type)}</span>
          <h3>${escapeHtml(trip.name)}</h3>
        </div>
        <div class="trip-card-body">
          <div class="trip-meta">
            <span>◷ <strong>${escapeHtml(trip.duration)}</strong></span>
            <span>✈ <strong>${escapeHtml(trip.airline)}</strong></span>
          </div>
          <p class="trip-summary">${escapeHtml(trip.summary)}</p>
          <span class="date-count">▦ ${departureCount} ${departureCount === 1 ? "موعد مغادرة متاح" : "مواعيد مغادرة متاحة"}</span>
        </div>
        <div class="trip-card-footer">
          <div>
            <span class="price-caption">${Object.keys(trip.prices).length > 1 ? "يبدأ من" : "سعر الفرد"}</span>
            <span class="price-number">${formatPrice(firstPrice)} <small>جنيه</small></span>
          </div>
          <a class="button button-dark" href="${tripUrl(trip.id)}">اكتشف البرنامج <span aria-hidden="true">←</span></a>
        </div>
      </article>`;
  }

  function renderNotFound(message) {
    app.innerHTML = `
      <section class="content-section">
        <div class="empty-state">
          <span class="section-kicker">الوفاء ترافل</span>
          <h1>${escapeHtml(message)}</h1>
          <p>يمكنك العودة للرئيسية واستكشاف البرامج والخدمات المتاحة.</p>
          <a class="button button-dark" href="#home">العودة للرئيسية</a>
        </div>
      </section>`;
  }

  function renderHome() {
    const departmentCards = departments.map((department) => {
      const count = trips.filter((trip) => trip.categories.includes(department.id)).length;
      const visualStyle = department.kind === "light" ? " light-card" : "";
      const subtitle = count ? formatProgramCount(count) : department.subtitle;

      return `
        <a class="department-card${visualStyle}" href="${categoryUrl(department.id)}">
          <span class="department-icon" aria-hidden="true">${department.icon}</span>
          <span class="department-info">
            <h3>${escapeHtml(department.title)}</h3>
            <p>${escapeHtml(subtitle)}</p>
          </span>
          <span class="department-arrow" aria-hidden="true">←</span>
        </a>`;
    }).join("");

    const featuredTrips = trips.filter((trip) => trip.categories.includes("umrah")).slice(0, 3);
    app.innerHTML = `
      <section class="hero">
        <div class="hero-inner">
          <div class="hero-copy">
            <span class="eyebrow">رحلات مختارة بعناية</span>
            <h1>رحلتك المباركة<br><em>تبدأ من هنا</em></h1>
            <p>برامج حج وعمرة بتفاصيل واضحة وخيارات تناسبك. اختر وجهتك وموعدك، ودع فريق الوفاء يهتم بباقي الرحلة.</p>
            <div class="hero-actions">
              <a class="button button-primary" href="${categoryUrl("umrah")}">اكتشف برامج العمرة <span aria-hidden="true">←</span></a>
              <a class="button button-ghost" href="${categoryUrl("hajj")}">تعرّف على برامج الحج</a>
            </div>
          </div>
          <div class="hero-art" aria-hidden="true">
            <span class="hero-orbit"></span>
            <img class="hero-logo-img" src="kabaa-logo-1.png" alt="" width="220" height="220">
            <span class="floating-note">رحلتك.. بكل عناية<span>من أول خطوة حتى العودة</span></span>
          </div>
        </div>
      </section>
      <section class="trust-strip" aria-label="مميزات الوفاء ترافل">
        <div class="trust-inner">
          <div class="trust-item"><span class="trust-icon" aria-hidden="true">✧</span><span><strong>برامج مختارة</strong><small>تفاصيل واضحة قبل الحجز</small></span></div>
          <div class="trust-item"><span class="trust-icon" aria-hidden="true">◷</span><span><strong>مواعيد مرنة</strong><small>اختر موعد المغادرة المناسب</small></span></div>
          <div class="trust-item"><span class="trust-icon" aria-hidden="true">☏</span><span><strong>تواصل مباشر</strong><small>فريقنا معك عبر واتساب</small></span></div>
        </div>
      </section>
      <section class="content-section" aria-labelledby="departments-title">
        <div class="section-heading">
          <div>
            <span class="section-kicker">خدماتنا</span>
            <h2 id="departments-title">اختر وجهتك القادمة</h2>
            <p>تصفّح أقسام الوفاء واختر الخدمة التي تناسب خططك.</p>
          </div>
        </div>
        <div class="department-grid">${departmentCards}</div>
      </section>
      <section class="featured-section">
        <div class="content-section">
          <div class="section-heading">
            <div>
              <span class="section-kicker">برامج مختارة</span>
              <h2>رحلات عمرة مميزة</h2>
              <p>اختر البرنامج، ثم حدّد موعد المغادرة ونوع التسكين.</p>
            </div>
            <a class="text-link" href="${categoryUrl("umrah")}">جميع برامج العمرة ←</a>
          </div>
          <div class="trip-grid">${featuredTrips.map(tripCard).join("")}</div>
        </div>
      </section>`;
  }

  function renderCategory(categoryId) {
    const department = departmentFor(categoryId);
    if (!department) {
      renderNotFound("لم نعثر على هذا القسم");
      return;
    }

    const categoryTrips = trips.filter((trip) => trip.categories.includes(categoryId));
    const showInquiry = categoryTrips.length === 0;
    const inquiryMessage = `السلام عليكم، أود الاستفسار عن ${department.title}.`;
    const cards = categoryTrips.map(tripCard).join("");
    const emptyMessage = showInquiry
      ? `يسعدنا مساعدتك في ${escapeHtml(department.title)}`
      : "لا توجد برامج تطابق بحثك";

    app.innerHTML = `
      <section class="page-banner">
        <div class="page-banner-inner">
          <nav class="breadcrumb" aria-label="مسار التنقل">
            <a href="#home">الرئيسية</a><span aria-hidden="true">/</span><span>${escapeHtml(department.title)}</span>
          </nav>
          <span class="section-kicker">${escapeHtml(department.title)}</span>
          <h1>${escapeHtml(department.title)}</h1>
          <p>${escapeHtml(department.subtitle)}. تعرّف على الخيارات والتفاصيل، واختر ما يناسب رحلتك.</p>
        </div>
      </section>
      <section class="content-section category-content">
        ${showInquiry
          ? `<div class="empty-state">
              <span class="section-kicker">خدمة واستفسارات</span>
              <h2>${emptyMessage}</h2>
              <p>تواصل مع فريق الوفاء لمعرفة الخيارات المتاحة والتفاصيل المناسبة لرحلتك.</p>
              <a class="button button-primary" href="${whatsappUrl(inquiryMessage)}" target="_blank" rel="noopener noreferrer">استفسر عبر واتساب</a>
            </div>`
          : `<div class="listing-toolbar">
              <div><span class="section-kicker">كتالوج البرامج</span>
                <p class="listing-count" id="listing-count">${formatProgramCount(categoryTrips.length)}</p></div>
              <label class="search-wrap" for="trip-search">
                <span aria-hidden="true">⌕</span>
                <input class="search-field" id="trip-search" type="search" autocomplete="off" placeholder="ابحث باسم البرنامج أو الطيران..." aria-controls="trip-grid">
              </label>
            </div>
            <div class="trip-grid" id="trip-grid">${cards}</div>
            <div class="empty-state search-empty" id="search-empty" hidden>
              <h2>${emptyMessage}</h2><p>جرّب البحث باسم البرنامج أو شركة الطيران.</p>
            </div>`}
      </section>`;
  }

  function renderTrip(tripId) {
    const trip = tripFor(tripId);
    if (!trip) {
      renderNotFound("لم نعثر على هذا البرنامج");
      return;
    }

    const department = departmentFor(trip.categories[0]);
    if (!department) {
      renderNotFound("تفاصيل هذا البرنامج غير مكتملة");
      return;
    }

    const prices = Object.entries(trip.prices);
    const initialPrice = prices[0]?.[1];
    if (!trip.departures.length || !prices.length) {
      renderNotFound("الحجز لهذا البرنامج غير متاح حالياً");
      return;
    }

    const departureOptions = trip.departures.map((departure, index) =>
      `<option value="${escapeHtml(departure)}"${index === 0 ? " selected" : ""}>${escapeHtml(departure)}</option>`
    ).join("");
    const occupancyOptions = prices.map(([occupancy, price], index) => `
      <label class="occupancy-option">
        <input type="radio" name="occupancy" value="${escapeHtml(occupancy)}" data-price="${price}"${index === 0 ? " checked" : ""} required>
        <span><b>${escapeHtml(occupancy)}</b><small>${formatPrice(price)} ج</small></span>
      </label>`).join("");
    const features = trip.features.map((feature) => `<li>${escapeHtml(feature)}</li>`).join("");
    const dateCountText = `${trip.departures.length} ${trip.departures.length === 1 ? "موعد مغادرة متاح" : "مواعيد مغادرة متاحة"}`;

    app.innerHTML = `
      <section class="content-section detail-page">
        <nav class="breadcrumb" aria-label="مسار التنقل">
          <a href="#home">الرئيسية</a><span aria-hidden="true">/</span>
          <a href="${categoryUrl(department.id)}">${escapeHtml(department.title)}</a><span aria-hidden="true">/</span>
          <span>${escapeHtml(trip.name)}</span>
        </nav>
        <div class="detail-layout">
          <article class="detail-main">
            <div class="detail-cover">
              <span class="trip-category">${escapeHtml(trip.type)} · ${escapeHtml(trip.badge)}</span>
              <h1>${escapeHtml(trip.name)}</h1>
              <p>${escapeHtml(dateCountText)}</p>
            </div>
            <div class="detail-content">
              <span class="section-kicker">تفاصيل البرنامج</span>
              <h2>كل تفاصيل رحلتك</h2>
              <div class="spec-grid">
                <div class="spec-item"><span>مدة البرنامج</span><strong>${escapeHtml(trip.duration)}</strong></div>
                <div class="spec-item"><span>شركة الطيران</span><strong>${escapeHtml(trip.airline)}</strong></div>
                <div class="spec-item"><span>فندق مكة · المسافة</span><strong>${escapeHtml(trip.makkah)} · ${escapeHtml(trip.makkahDistance)}</strong></div>
                <div class="spec-item"><span>فندق المدينة · المسافة</span><strong>${escapeHtml(trip.madinah)} · ${escapeHtml(trip.madinahDistance)}</strong></div>
              </div>
              <div class="detail-description">
                <h3>عن البرنامج</h3>
                <p>${escapeHtml(trip.summary)}</p>
              </div>
              <div class="features-section">
                <h3>مميزات البرنامج</h3>
                <ul class="feature-list">${features}</ul>
              </div>
            </div>
          </article>
          <aside class="booking-card" aria-labelledby="booking-heading">
            <div class="booking-card-heading">
              <span class="section-kicker">خطوتك التالية</span>
              <h2 id="booking-heading">احجز رحلتك</h2>
              <p>${escapeHtml(dateCountText)} · أرسل طلبك مباشرة لفريقنا</p>
            </div>
            <form id="booking-form" novalidate>
              <div class="booking-price">
                <span>السعر للفرد</span>
                <strong id="selected-price">${formatPrice(initialPrice)}</strong>
                <small>جنيه مصري</small>
              </div>
              <div class="form-field">
                <label for="departure-date">موعد المغادرة</label>
                <select class="form-control" id="departure-date" name="departure" required>${departureOptions}</select>
                ${trip.departures.length > 1 ? `<p class="form-hint">اختر موعدك من بين ${trip.departures.length} مواعيد متاحة.</p>` : ""}
              </div>
              <fieldset class="form-field booking-fieldset">
                <legend class="booking-legend">نوع التسكين</legend>
                <div class="occupancy-options">${occupancyOptions}</div>
              </fieldset>
              <div class="form-field">
                <label for="customer-name">الاسم الكامل</label>
                <input class="form-control" id="customer-name" name="name" type="text" autocomplete="name" placeholder="اكتب اسمك" required>
              </div>
              <div class="form-field">
                <label for="customer-phone">رقم الهاتف / واتساب</label>
                <input class="form-control" id="customer-phone" name="phone" type="tel" autocomplete="tel" inputmode="tel" placeholder="مثال: 01012345678" required>
              </div>
              <p class="form-error" id="booking-error" role="alert" hidden></p>
              <button class="button button-whatsapp" type="submit">أرسل طلب الحجز عبر واتساب <span aria-hidden="true">↗</span></button>
              <p class="privacy-note">ستظهر لك رسالة جاهزة بالتفاصيل لمراجعتها قبل الإرسال.</p>
            </form>
          </aside>
        </div>
      </section>`;
  }

  function parseRoute() {
    const rawParts = window.location.hash.slice(1).split("/");
    const view = rawParts.shift();
    if (!view || view === "home") return { type: "home" };

    let id;
    try {
      if (rawParts.length !== 1 || !rawParts[0]) throw new Error("Invalid route");
      id = decodeURIComponent(rawParts[0]);
    } catch {
      return { type: "not-found", message: "الرابط غير صالح" };
    }

    if (view === "category") return { type: "category", categoryId: id };
    if (view === "trip") return { type: "trip", tripId: id };
    return { type: "not-found", message: "لم نعثر على هذه الصفحة" };
  }

  function updateNavigation(route) {
    const activeDepartment = route.type === "category"
      ? route.categoryId
      : route.type === "trip"
        ? tripFor(route.tripId)?.categories[0]
        : undefined;

    document.querySelectorAll("[data-nav-home], [data-nav-category]").forEach((link) => {
      const isHome = link.hasAttribute("data-nav-home");
      const isActive = isHome ? route.type === "home" : link.dataset.navCategory === activeDepartment;
      if (isActive) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
  }

  function renderRoute() {
    activeRoute = parseRoute();
    if (activeRoute.type === "home") renderHome();
    else if (activeRoute.type === "category") renderCategory(activeRoute.categoryId);
    else if (activeRoute.type === "trip") renderTrip(activeRoute.tripId);
    else renderNotFound(activeRoute.message);

    updateNavigation(activeRoute);
    window.scrollTo({ top: 0, behavior: "auto" });
    app.focus({ preventScroll: true });
  }

  function showBookingError(message) {
    const error = document.getElementById("booking-error");
    if (!error) return;
    error.textContent = message;
    error.hidden = false;
  }

  app.addEventListener("input", (event) => {
    if (!(event.target instanceof HTMLInputElement) || event.target.id !== "trip-search") return;
    const query = event.target.value.trim().toLocaleLowerCase("ar");
    const cards = [...app.querySelectorAll(".trip-card")];
    let visibleCount = 0;

    cards.forEach((card) => {
      const matches = card.dataset.search.includes(query);
      card.hidden = !matches;
      if (matches) visibleCount += 1;
    });

    const count = document.getElementById("listing-count");
    const empty = document.getElementById("search-empty");
    if (count) count.textContent = query ? `${visibleCount} من ${cards.length} برامج` : formatProgramCount(cards.length);
    if (empty) empty.hidden = visibleCount !== 0;
  });

  app.addEventListener("change", (event) => {
    if (!(event.target instanceof HTMLInputElement) || event.target.name !== "occupancy") return;
    const price = document.getElementById("selected-price");
    if (price) price.textContent = formatPrice(Number(event.target.dataset.price));
  });

  app.addEventListener("submit", (event) => {
    if (!(event.target instanceof HTMLFormElement) || event.target.id !== "booking-form") return;
    event.preventDefault();

    const trip = activeRoute.type === "trip" ? tripFor(activeRoute.tripId) : undefined;
    if (!trip) {
      showBookingError("تعذر العثور على تفاصيل البرنامج. أعد فتح صفحة الرحلة وحاول مرة أخرى.");
      return;
    }

    const form = event.target;
    if (!form.reportValidity()) return;
    const formData = new FormData(form);
    const departure = String(formData.get("departure") || "");
    const occupancy = String(formData.get("occupancy") || "");
    const name = String(formData.get("name") || "").trim();
    const phone = String(formData.get("phone") || "").trim();
    const price = trip.prices[occupancy];

    if (!trip.departures.includes(departure) || !price || !name || !phone) {
      showBookingError("يرجى اختيار موعد وتسكين صحيحين وإكمال بيانات التواصل.");
      return;
    }

    const message = [
      "السلام عليكم، أرغب في طلب حجز البرنامج التالي:",
      "",
      `البرنامج: ${trip.name}`,
      `موعد المغادرة: ${departure}`,
      `نوع التسكين: ${occupancy}`,
      `السعر للفرد: ${formatPrice(price)} جنيه مصري`,
      `الاسم: ${name}`,
      `رقم الهاتف / واتساب: ${phone}`
    ].join("\n");

    const bookingWindow = window.open(whatsappUrl(message), "_blank");
    if (bookingWindow) {
      bookingWindow.opener = null;
    } else {
      showBookingError("تعذر فتح واتساب. اسمح بالنوافذ المنبثقة أو تواصل معنا مباشرة.");
    }
  });

  window.addEventListener("hashchange", renderRoute);
  if (!window.location.hash) history.replaceState(null, "", `${window.location.pathname}${window.location.search}#home`);
  renderRoute();
})();
