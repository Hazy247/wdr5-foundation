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
      <img src="${post.image || "assets/images/update-research.jpg"}" alt="">
      <div>
        <span class="eyebrow">${post.category || "Update"}</span>
        <h3><a href="updates.html#${post.id}">${post.title}</a></h3>
        <p>${post.summary}</p>
        <time datetime="${post.date}">${displayDate(post.date)}</time>
      </div>
    </article>`).join("");
}

function renderUpdatesPage(posts) {
  const mount = document.querySelector("[data-updates-grid]");
  if (!mount) return;
  const search = document.querySelector("[data-update-search]");
  const filters = document.querySelectorAll("[data-update-filter]");

  const draw = () => {
    const query = (search?.value || "").trim().toLowerCase();
    const active = document.querySelector("[data-update-filter].is-active")?.dataset.updateFilter || "All";
    const visible = posts.filter((post) => {
      const inCategory = active === "All" || post.category === active;
      const haystack = `${post.title} ${post.summary} ${post.content} ${post.category}`.toLowerCase();
      return inCategory && haystack.includes(query);
    });

    mount.innerHTML = visible.length ? visible.map((post) => `
      <article class="update-card" id="${post.id}" data-reveal>
        <img src="${post.image || "assets/images/update-research.jpg"}" alt="">
        <div class="update-body">
          <div class="update-meta"><span>${post.category || "Update"}</span><time datetime="${post.date}">${displayDate(post.date)}</time></div>
          <h2>${post.title}</h2>
          <p class="update-summary">${post.summary}</p>
          <p>${post.content || ""}</p>
        </div>
      </article>`).join("") : '<div class="empty-state"><h2>No updates found</h2><p>Try a different search or category.</p></div>';
  };

  search?.addEventListener("input", draw);
  filters.forEach((button) => button.addEventListener("click", () => {
    filters.forEach((item) => item.classList.remove("is-active"));
    button.classList.add("is-active");
    draw();
  }));
  draw();
}

getUpdates().then((posts) => {
  renderHomeUpdates(posts);
  renderUpdatesPage(posts);
});

window.WDR5Updates = { getUpdates, displayDate, fallback: FALLBACK_UPDATES };
