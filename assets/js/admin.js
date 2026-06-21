const adminState = {
  posts: [],
  sha: "",
  editingId: null,
};

const els = {
  connection: document.querySelector("[data-admin-connection]"),
  editor: document.querySelector("[data-admin-editor]"),
  list: document.querySelector("[data-admin-list]"),
  status: document.querySelector("[data-admin-status]"),
};

function getSettings() {
  return {
    repo: document.querySelector("#github-repo").value.trim(),
    branch: document.querySelector("#github-branch").value.trim() || "main",
    path: document.querySelector("#github-path").value.trim() || "data/updates.json",
    token: document.querySelector("#github-token").value.trim(),
  };
}

function setStatus(message, type = "") {
  els.status.textContent = message;
  els.status.className = `admin-status ${type}`.trim();
}

function encodeBase64(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary);
}

function decodeBase64(text) {
  const binary = atob(text.replace(/\n/g, ""));
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function slugify(value) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function renderList() {
  const posts = [...adminState.posts].sort((a, b) => new Date(b.date) - new Date(a.date));
  els.list.innerHTML = posts.length ? posts.map((post) => `
    <article class="admin-post">
      <img src="${post.image || "assets/images/update-research.jpg"}" alt="">
      <div>
        <span>${post.category || "Update"} · ${post.date}</span>
        <h3>${post.title}</h3>
        <p>${post.summary}</p>
      </div>
      <div class="admin-post-actions">
        <button type="button" data-edit="${post.id}">Edit</button>
        <button class="danger-link" type="button" data-delete="${post.id}">Delete</button>
      </div>
    </article>`).join("") : '<p class="empty-state">No posts yet. Add the first update using the editor.</p>';

  els.list.querySelectorAll("[data-edit]").forEach((button) => button.addEventListener("click", () => editPost(button.dataset.edit)));
  els.list.querySelectorAll("[data-delete]").forEach((button) => button.addEventListener("click", () => deletePost(button.dataset.delete)));
}

function clearEditor() {
  els.editor.reset();
  adminState.editingId = null;
  document.querySelector("[data-editor-title]").textContent = "Add an update";
  document.querySelector("#post-date").value = new Date().toISOString().slice(0, 10);
  document.querySelector("#post-featured").checked = true;
}

function editPost(id) {
  const post = adminState.posts.find((item) => item.id === id);
  if (!post) return;
  adminState.editingId = id;
  document.querySelector("[data-editor-title]").textContent = "Edit update";
  ["title", "date", "category", "summary", "image", "content"].forEach((field) => {
    document.querySelector(`#post-${field}`).value = post[field] || "";
  });
  document.querySelector("#post-featured").checked = Boolean(post.featured);
  els.editor.scrollIntoView({ behavior: "smooth", block: "start" });
}

function deletePost(id) {
  if (!confirm("Delete this update from the working list? It will not reach GitHub until you publish.")) return;
  adminState.posts = adminState.posts.filter((post) => post.id !== id);
  renderList();
  setStatus("Post removed from the working list. Publish to save the change.", "warning");
}

async function loadPublicData() {
  const posts = await window.WDR5Updates.getUpdates();
  adminState.posts = posts;
  adminState.sha = "";
  renderList();
  clearEditor();
  setStatus("Loaded the current public updates. Connect GitHub when you are ready to publish.", "success");
}

async function connectGitHub() {
  const settings = getSettings();
  if (!settings.repo || !settings.token) {
    setStatus("Enter the GitHub repository and a fine-grained access token.", "error");
    return;
  }
  localStorage.setItem("wdr5-admin-settings", JSON.stringify({
    repo: settings.repo,
    branch: settings.branch,
    path: settings.path,
  }));
  sessionStorage.setItem("wdr5-github-token", settings.token);
  setStatus("Connecting to GitHub…");

  try {
    const response = await fetch(`https://api.github.com/repos/${settings.repo}/contents/${settings.path}?ref=${encodeURIComponent(settings.branch)}`, {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${settings.token}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });
    if (!response.ok) throw new Error(`GitHub returned ${response.status}. Check the repository, branch, path and token permissions.`);
    const file = await response.json();
    adminState.posts = JSON.parse(decodeBase64(file.content));
    adminState.sha = file.sha;
    renderList();
    clearEditor();
    setStatus("Connected. The current updates file is ready to edit.", "success");
  } catch (error) {
    setStatus(error.message, "error");
  }
}

async function publishGitHub() {
  const settings = getSettings();
  if (!settings.repo || !settings.token) {
    setStatus("Connect GitHub before publishing.", "error");
    return;
  }
  setStatus("Publishing changes to GitHub…");

  const content = JSON.stringify([...adminState.posts].sort((a, b) => new Date(b.date) - new Date(a.date)), null, 2) + "\n";
  const body = {
    message: `Update foundation posts (${new Date().toISOString().slice(0, 10)})`,
    content: encodeBase64(content),
    branch: settings.branch,
  };
  if (adminState.sha) body.sha = adminState.sha;

  try {
    const response = await fetch(`https://api.github.com/repos/${settings.repo}/contents/${settings.path}`, {
      method: "PUT",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${settings.token}`,
        "Content-Type": "application/json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const detail = await response.json().catch(() => ({}));
      throw new Error(detail.message || `GitHub returned ${response.status}.`);
    }
    const result = await response.json();
    adminState.sha = result.content.sha;
    setStatus("Published. GitHub Pages will refresh after its deployment finishes.", "success");
  } catch (error) {
    setStatus(error.message, "error");
  }
}

function exportJson() {
  const content = JSON.stringify(adminState.posts, null, 2) + "\n";
  const blob = new Blob([content], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "updates.json";
  link.click();
  URL.revokeObjectURL(link.href);
  setStatus("Downloaded updates.json for manual upload to GitHub.", "success");
}

els.editor?.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(els.editor).entries());
  const id = adminState.editingId || `${slugify(data.title)}-${Date.now().toString().slice(-5)}`;
  const post = {
    id,
    title: data.title.trim(),
    date: data.date,
    category: data.category,
    summary: data.summary.trim(),
    image: data.image.trim() || "assets/images/update-research.jpg",
    content: data.content.trim(),
    featured: data.featured === "on",
  };
  const index = adminState.posts.findIndex((item) => item.id === id);
  if (index >= 0) adminState.posts[index] = post;
  else adminState.posts.unshift(post);
  renderList();
  clearEditor();
  setStatus("Update saved to the working list. Publish to send it to GitHub.", "warning");
});

document.querySelector("[data-connect-github]")?.addEventListener("click", connectGitHub);
document.querySelector("[data-load-public]")?.addEventListener("click", loadPublicData);
document.querySelector("[data-publish-github]")?.addEventListener("click", publishGitHub);
document.querySelector("[data-export-json]")?.addEventListener("click", exportJson);
document.querySelector("[data-clear-editor]")?.addEventListener("click", clearEditor);

const saved = JSON.parse(localStorage.getItem("wdr5-admin-settings") || "{}");
document.querySelector("#github-repo").value = saved.repo || "";
document.querySelector("#github-branch").value = saved.branch || "main";
document.querySelector("#github-path").value = saved.path || "data/updates.json";
document.querySelector("#github-token").value = sessionStorage.getItem("wdr5-github-token") || "";
loadPublicData();
