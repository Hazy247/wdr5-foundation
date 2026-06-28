const WDR5 = {
  nav: [
    ["Home", "index.html"],
    ["What is WDR5", "what-is-wdr5.html"],
    ["About Us", "about.html"],
    ["Resources", "resources.html"],
    ["Updates", "updates.html"],
    ["Register", "register.html"],
  ],
  socials: [
    ["Facebook", "https://www.facebook.com/"],
    ["Instagram", "https://www.instagram.com/"],
    ["Email", "contact.html"],
  ],
};

const defaultSiteSettings = {
  heroStats: {
    families: { icon: "users", value: "250+", label: "Families Registered" },
    countries: { icon: "globe", value: "35+", label: "Countries" },
    message: { icon: "heart", value: "Stronger", label: "Together" },
  },
};

const heroStatOrder = ["families", "countries", "message"];

const pageName = location.pathname.split("/").pop() || "index.html";
const root = document.documentElement;
root.classList.add("js");

function icon(name, size = 20) {
  const paths = {
    heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.7-7.5 1.1-1.1a5.5 5.5 0 0 0 0-7.8Z"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z"/>',
    mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-10 6L2 7"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    close: '<path d="M18 6 6 18M6 6l12 12"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    shield: '<path d="M20 13c0 5-3.5 7.5-8 9-4.5-1.5-8-4-8-9V5l8-3 8 3v8Z"/><path d="m9 12 2 2 4-4"/>',
  };
  return `<svg aria-hidden="true" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${paths[name] || paths.arrow}</svg>`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function normalizeSiteSettings(settings = {}) {
  const source = settings && typeof settings === "object" ? settings : {};
  const incomingStats = Array.isArray(source.heroStats)
    ? Object.fromEntries(heroStatOrder.map((key, index) => [key, source.heroStats[index] || {}]))
    : source.heroStats || {};

  const heroStats = {};
  heroStatOrder.forEach((key) => {
    heroStats[key] = {
      ...defaultSiteSettings.heroStats[key],
      ...(incomingStats[key] || {}),
    };
  });

  return { heroStats };
}

async function loadSiteSettings() {
  try {
    const response = await fetch("data/site-settings.json", { cache: "no-store" });
    if (!response.ok) throw new Error("Site settings file not available.");
    return normalizeSiteSettings(await response.json());
  } catch (error) {
    return normalizeSiteSettings();
  }
}

function normalizePageContent(content = {}) {
  const pages = content && typeof content === "object" && content.pages && typeof content.pages === "object"
    ? content.pages
    : {};
  return { version: content.version || 1, pages };
}

async function loadPageContent() {
  try {
    const response = await fetch("data/page-content.json", { cache: "no-store" });
    if (!response.ok) throw new Error("Page content file not available.");
    return normalizePageContent(await response.json());
  } catch (error) {
    return normalizePageContent();
  }
}

function applyEditablePageContent(content = {}) {
  const normalized = normalizePageContent(content);
  const currentPage = pageName || "index.html";
  const page = normalized.pages[currentPage];
  if (!page || !Array.isArray(page.fields)) return;

  page.fields.forEach((field) => {
    if (!field?.selector) return;
    const target = document.querySelector(field.selector);
    if (!target) return;

    if (field.type === "html") {
      target.innerHTML = field.value ?? "";
    } else if (field.type === "attribute" && field.attribute) {
      target.setAttribute(field.attribute, field.value ?? "");
    } else {
      target.textContent = field.value ?? "";
    }
  });
}

function renderHeroStats(settings = defaultSiteSettings) {
  const mount = document.querySelector("[data-hero-stats]");
  if (!mount) return;
  const normalized = normalizeSiteSettings(settings);

  mount.innerHTML = heroStatOrder.map((key) => {
    const stat = normalized.heroStats[key];
    return `
      <div class="stat">
        ${icon(stat.icon, stat.icon === "globe" ? 34 : 38)}
        <span><strong>${escapeHtml(stat.value)}</strong><small>${escapeHtml(stat.label)}</small></span>
      </div>`;
  }).join("");
}

function renderHeader() {
  const mount = document.querySelector("[data-site-header]");
  if (!mount) return;

  const nav = WDR5.nav.map(([label, href]) => {
    const active = pageName === href
      || (pageName === "" && href === "index.html")
      || (pageName === "update.html" && href === "updates.html");
    return `<a class="nav-link${active ? " is-active" : ""}" href="${href}"${active ? ' aria-current="page"' : ""}>${label}</a>`;
  }).join("");

  mount.innerHTML = `
    <div class="topline">
      <div class="shell topline-inner">
        <p>Connecting <span>•</span> Supporting <span>•</span> Advancing <span>•</span> Hope</p>
        <div class="top-links">
          <a href="contact.html">Contact Us</a>
          <a href="${WDR5.socials[0][1]}" aria-label="Facebook">f</a>
          <a href="${WDR5.socials[1][1]}" aria-label="Instagram">◎</a>
          <a href="contact.html" aria-label="Email">${icon("mail", 16)}</a>
        </div>
      </div>
    </div>
    <header class="site-header">
      <div class="shell header-inner">
        <a class="brand" href="index.html" aria-label="WDR5 Foundation home">
          <img src="assets/images/logo.png" alt="WDR5 Foundation">
        </a>
        <nav class="desktop-nav" aria-label="Primary navigation">${nav}</nav>
        <a class="button button-coral header-donate" href="donate.html">${icon("heart")} Donate</a>
        <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="mobile-menu" aria-label="Open navigation">${icon("menu", 25)}</button>
      </div>
      <nav class="mobile-nav" id="mobile-menu" aria-label="Mobile navigation">
        <div class="shell">${nav}<a class="button button-coral" href="donate.html">${icon("heart")} Donate</a></div>
      </nav>
    </header>`;

  const toggle = mount.querySelector(".menu-toggle");
  const mobile = mount.querySelector(".mobile-nav");
  toggle?.addEventListener("click", () => {
    const open = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!open));
    toggle.setAttribute("aria-label", open ? "Open navigation" : "Close navigation");
    toggle.innerHTML = icon(open ? "menu" : "close", 25);
    mobile.classList.toggle("is-open", !open);
  });
}

function renderFooter() {
  const mount = document.querySelector("[data-site-footer]");
  if (!mount) return;
  mount.innerHTML = `
    <section class="action-rail" aria-label="Quick links">
      <div class="shell action-grid">
        <a href="register.html#newsletter"><span class="action-icon">${icon("mail", 29)}</span><span>Newsletter<br>Registration</span></a>
        <a href="register.html"><span class="action-icon">${icon("users", 29)}</span><span>Family Connection<br>Directory</span></a>
        <a href="resources.html"><span class="action-icon">▱</span><span>Resources<br>Library</span></a>
        <a href="updates.html"><span class="action-icon">▤</span><span>Updates<br>&amp; News</span></a>
      </div>
    </section>
    <footer class="footer">
      <div class="shell footer-grid">
        <div>
          <img class="footer-logo" src="assets/images/logo.png" alt="WDR5 Foundation">
          <p>Building connection, sharing knowledge and accelerating hope for everyone affected by WDR5-related conditions.</p>
        </div>
        <div>
          <h3>Explore</h3>
          <a href="what-is-wdr5.html">What is WDR5?</a>
          <a href="resources.html">Resources</a>
          <a href="updates.html">Latest updates</a>
        </div>
        <div>
          <h3>Get involved</h3>
          <a href="register.html">Join the community</a>
          <a href="donate.html">Support research</a>
          <a href="contact.html">Contact us</a>
        </div>
        <div>
          <h3>Stay connected</h3>
          <p>Receive carefully selected research, community and event updates.</p>
          <a class="text-link" href="register.html#newsletter">Register for the newsletter ${icon("arrow", 16)}</a>
        </div>
      </div>
      <div class="shell footer-bottom">
        <span>© <span data-year></span> WDR5 Foundation</span>
        <span>Community • Research • Hope</span>
      </div>
    </footer>`;
}

function initForms() {
  document.querySelectorAll("form[data-static-form]").forEach((form) => {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const status = form.querySelector("[data-form-status]");
      if (!form.reportValidity()) return;

      const endpoint = form.dataset.endpoint?.trim();
      const values = Object.fromEntries(new FormData(form).entries());
      const button = form.querySelector('button[type="submit"]');
      button?.setAttribute("disabled", "");
      if (status) status.textContent = "Sending…";

      try {
        if (endpoint) {
          const response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify(values),
          });
          if (!response.ok) throw new Error("Form service rejected the request.");
          if (status) status.textContent = "Thank you — your message has been sent.";
        } else {
          const key = `wdr5-${form.dataset.formName || "form"}-drafts`;
          const saved = JSON.parse(localStorage.getItem(key) || "[]");
          saved.push({ ...values, submittedAt: new Date().toISOString() });
          localStorage.setItem(key, JSON.stringify(saved));
          if (status) status.textContent = "Thank you — this preview saved your submission in this browser. Connect a form endpoint before launch.";
        }
        form.reset();
      } catch (error) {
        if (status) status.textContent = "We could not send that just now. Please try again.";
      } finally {
        button?.removeAttribute("disabled");
      }
    });
  });
}

function initFaqs() {
  document.querySelectorAll(".faq-button").forEach((button) => {
    button.addEventListener("click", () => {
      const item = button.closest(".faq-item");
      const expanded = button.getAttribute("aria-expanded") === "true";
      button.setAttribute("aria-expanded", String(!expanded));
      item.classList.toggle("is-open", !expanded);
    });
  });
}

function initReveal() {
  const nodes = document.querySelectorAll("[data-reveal]");
  if (!("IntersectionObserver" in window)) {
    nodes.forEach((node) => node.classList.add("is-visible"));
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  nodes.forEach((node) => observer.observe(node));
}

renderHeader();
renderFooter();
document.querySelectorAll("[data-year]").forEach((el) => { el.textContent = new Date().getFullYear(); });
initForms();
initFaqs();
initReveal();
if (document.querySelector("[data-hero-stats]")) {
  loadSiteSettings().then(renderHeroStats);
}
loadPageContent().then(applyEditablePageContent);

window.WDR5 = {
  icon,
  defaultSiteSettings,
  normalizeSiteSettings,
  loadSiteSettings,
  renderHeroStats,
  normalizePageContent,
  loadPageContent,
  applyEditablePageContent,
};
