const FALLBACK_UPDATES = [
  {
    id: "research-grant-awarded",
    title: "New Research Grant Awarded",
    date: "2024-05-15",
    category: "Research",
    summary: "Supporting a new study to better understand the role of WDR5.",
    image: "assets/images/update-research.jpg",
    content: "The WDR5 Foundation is supporting a focused research project designed to improve understanding of WDR5-related pathways and identify promising directions for future study.",
    featured: true
  },
  {
    id: "community-spotlight",
    title: "Community Spotlight",
    date: "2024-04-28",
    category: "Community",
    summary: "Meet the families and advocates making a difference every day.",
    image: "assets/images/update-community.jpg",
    content: "Our community spotlight series shares lived experience, practical knowledge and the many ways families are helping one another feel less alone.",
    featured: true
  },
  {
    id: "understanding-wdr5-webinar",
    title: "Understanding WDR5 Webinar",
    date: "2024-04-10",
    category: "Events",
    summary: "Join our upcoming webinar with leading experts in the field.",
    image: "assets/images/update-webinar.jpg",
    content: "This introductory webinar brings researchers, clinicians and families together for a clear overview of current knowledge and an open community question session.",
    featured: true
  }
];

function displayDate(value) {
  const date = new Date(`${value}T12:00:00`);
  return new Intl.DateTimeFormat("en", { month: "long", day: "numeric", year: "numeric" }).format(date);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getHashId() {
  if (!location.hash) return "";
  try {
    return decodeURIComponent(location.hash.slice(1));
  } catch {
    return location.hash.slice(1);
  }
}

function getArticleId() {
  const params = new URLSearchParams(location.search);
  return params.get("id") || getHashId();
}

function articleUrl(post) {
  return `update.html?id=${encodeURIComponent(post.id)}`;
}

function safeUrl(value) {
  const url = String(value || "").trim();
  if (/^(javascript|data):/i.test(url)) return "";
  return url;
}

function imageSrc(value, fallback = "assets/images/update-research.jpg") {
  return escapeHtml(safeUrl(value) || fallback);
}

function parseImageLine(line) {
  const match = line.match(/^!\[([^\]]*)\]\((\S+?)(?:\s+"([^"]+)")?\)$/);
  if (!match) return null;
  const src = safeUrl(match[2]);
  if (!src) return null;
  return {
    alt: match[1] || "",
    src,
    caption: match[3] || "",
  };
}

function renderFigure(image) {
  return `
    <figure>
      <img src="${escapeHtml(image.src)}" alt="${escapeHtml(image.alt)}">
      ${image.caption ? `<figcaption>${escapeHtml(image.caption)}</figcaption>` : ""}
    </figure>`;
}

function formatArticleContent(value) {
  const text = String(value || "").trim();
  if (!text) return "<p>More details will be added soon.</p>";

  return text.split(/\n{2,}/).map((block) => {
    const lines = block.split(/\n/).map((line) => line.trim()).filter(Boolean);
    if (!lines.length) return "";

    if (lines.length === 1) {
      const image = parseImageLine(lines[0]);
      if (image) return renderFigure(image);
    }

    if (lines.length === 1 && lines[0].startsWith("### ")) {
      return `<h3>${escapeHtml(lines[0].slice(4))}</h3>`;
    }

    if (lines.length === 1 && lines[0].startsWith("## ")) {
      return `<h2>${escapeHtml(lines[0].slice(3))}</h2>`;
    }

    if (lines.every((line) => /^[-*]\s+/.test(line))) {
      return `<ul>${lines.map((line) => `<li>${escapeHtml(line.replace(/^[-*]\s+/, ""))}</li>`).join("")}</ul>`;
    }

    return `<p>${lines.map(escapeHtml).join("<br>")}</p>`;
  }).join("");
}

async function getUpdates() {
  try {
    const response = await fetch(`data/updates.json?v=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) throw new Error("Could not load updates.");
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error("Update data is not an array.");
    return data.sort((a, b) => new Date(b.date) - new Date(a.date));
  } catch {
    return [...FALLBACK_UPDATES];
  }
}

function renderHomeUpdates(posts) {
  const mount = document.querySelector("[data-home-updates]");
  if (!mount) return;
  const featured = posts.filter((post) => post.featured).slice(0, 3);
  mount.innerHTML = featured.map((post) => `
    <article class="mini-update">
      <img src="${imageSrc(post.image)}" alt="">
      <div>
        <span class="eyebrow">${escapeHtml(post.category || "Update")}</span>
        <h3><a href="updates.html#${encodeURIComponent(post.id)}">${escapeHtml(post.title)}</a></h3>
        <p>${escapeHtml(post.summary)}</p>
        <time datetime="${escapeHtml(post.date)}">${displayDate(post.date)}</time>
      </div>
    </article>`).join("");
}

function renderUpdatesPage(posts) {
  const mount = document.querySelector("[data-updates-grid]");
  if (!mount) return;
  const search = document.querySelector("[data-update-search]");
  const filters = document.querySelectorAll("[data-update-filter]");
  let shouldScrollToHash = Boolean(getHashId());

  const scrollToLinkedPost = () => {
    const id = getHashId();
    if (!id) return;
    const target = document.getElementById(id);
    if (!target) return;
    document.querySelectorAll(".update-card.is-targeted").forEach((card) => card.classList.remove("is-targeted"));
    target.classList.add("is-targeted");
    target.setAttribute("tabindex", "-1");
    requestAnimationFrame(() => {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      target.focus({ preventScroll: true });
    });
  };

  const draw = () => {
    const query = (search?.value || "").trim().toLowerCase();
    const active = document.querySelector("[data-update-filter].is-active")?.dataset.updateFilter || "All";
    const visible = posts.filter((post) => {
      const inCategory = active === "All" || post.category === active;
      const haystack = `${post.title} ${post.summary} ${post.content} ${post.category}`.toLowerCase();
      return inCategory && haystack.includes(query);
    });

    mount.innerHTML = visible.length ? visible.map((post) => `
      <a class="update-card update-card-link-card" id="${escapeHtml(post.id)}" href="${articleUrl(post)}" aria-label="Read full article: ${escapeHtml(post.title)}">
        <img src="${imageSrc(post.image)}" alt="">
        <div class="update-body">
          <div class="update-meta"><span>${escapeHtml(post.category || "Update")}</span><time datetime="${escapeHtml(post.date)}">${displayDate(post.date)}</time></div>
          <h2>${escapeHtml(post.title)}</h2>
          <p class="update-summary">${escapeHtml(post.summary)}</p>
          <span class="text-link">Read full article -></span>
        </div>
      </a>`).join("") : '<div class="empty-state"><h2>No updates found</h2><p>Try a different search or category.</p></div>';

    if (shouldScrollToHash) {
      shouldScrollToHash = false;
      scrollToLinkedPost();
    }
  };

  search?.addEventListener("input", () => {
    shouldScrollToHash = false;
    draw();
  });
  filters.forEach((button) => button.addEventListener("click", () => {
    filters.forEach((item) => item.classList.remove("is-active"));
    button.classList.add("is-active");
    shouldScrollToHash = false;
    draw();
  }));
  window.addEventListener("hashchange", () => {
    shouldScrollToHash = true;
    draw();
  });
  draw();
}

function renderArticlePage(posts) {
  const mount = document.querySelector("[data-update-article]");
  if (!mount) return;

  const articleId = getArticleId();
  const post = posts.find((item) => item.id === articleId);
  const heading = document.querySelector("[data-article-heading]");
  const intro = document.querySelector("[data-article-intro]");

  if (!post) {
    if (heading) heading.textContent = "Update not found";
    if (intro) intro.textContent = "The article may have moved or been removed.";
    document.title = "Update not found | WDR5 Foundation";
    mount.innerHTML = `
      <div class="empty-state">
        <h2>We could not find that update.</h2>
        <p>Please return to the updates page and choose another article.</p>
        <a class="button button-purple" href="updates.html">Back to updates</a>
      </div>`;
    return;
  }

  if (heading) heading.textContent = post.title;
  if (intro) intro.textContent = post.summary;
  document.title = `${post.title} | WDR5 Foundation`;

  const heroImage = safeUrl(post.heroImage);

  mount.innerHTML = `
    <article class="article-detail">
      <a class="text-link" href="updates.html#${encodeURIComponent(post.id)}">← Back to updates</a>
      <div class="article-meta"><span>${escapeHtml(post.category || "Update")}</span><time datetime="${escapeHtml(post.date)}">${displayDate(post.date)}</time></div>
      <h1>${escapeHtml(post.title)}</h1>
      <p class="article-summary">${escapeHtml(post.summary)}</p>
      ${heroImage ? `<img class="article-image" src="${escapeHtml(heroImage)}" alt="">` : ""}
      <div class="article-content">${formatArticleContent(post.content)}</div>
      <div class="article-actions">
        <a class="button button-purple" href="updates.html#${encodeURIComponent(post.id)}">Back to all updates</a>
        <a class="button button-outline-dark" href="register.html#newsletter">Join the newsletter</a>
      </div>
    </article>`;

  renderRelatedUpdates(posts, post.id);
}

function renderRelatedUpdates(posts, currentId) {
  const mount = document.querySelector("[data-related-updates]");
  if (!mount) return;
  const related = posts.filter((post) => post.id !== currentId).slice(0, 3);
  mount.innerHTML = related.length ? related.map((post) => `
    <a class="related-update" href="${articleUrl(post)}">
      <img src="${imageSrc(post.image)}" alt="">
      <span>
        <span class="eyebrow">${escapeHtml(post.category || "Update")}</span>
        <strong>${escapeHtml(post.title)}</strong>
        <small>${displayDate(post.date)}</small>
      </span>
    </a>`).join("") : '<p class="empty-state">More updates will appear here soon.</p>';
}

getUpdates().then((posts) => {
  renderHomeUpdates(posts);
  renderUpdatesPage(posts);
  renderArticlePage(posts);
});

window.WDR5Updates = {
  getUpdates,
  displayDate,
  articleUrl,
  formatArticleContent,
  fallback: FALLBACK_UPDATES
};
