const adminState = {
  posts: [],
  sha: "",
  settings: window.WDR5?.normalizeSiteSettings?.() || {
    heroStats: {
      families: { icon: "users", value: "250+", label: "Families Registered" },
      countries: { icon: "globe", value: "35+", label: "Countries" },
      message: { icon: "heart", value: "Stronger", label: "Together" },
    },
  },
  settingsSha: "",
  pageContent: window.WDR5?.normalizePageContent?.() || { version: 1, pages: {} },
  pageContentSha: "",
  activePage: "",
  images: [],
  editingId: null,
};

const els = {
  connection: document.querySelector("[data-admin-connection]"),
  editor: document.querySelector("[data-admin-editor]"),
  settingsEditor: document.querySelector("[data-settings-editor]"),
  pageEditor: document.querySelector("[data-page-editor]"),
  pageSelect: document.querySelector("[data-page-select]"),
  pageFields: document.querySelector("[data-page-fields]"),
  pageSummary: document.querySelector("[data-page-editor-summary]"),
  list: document.querySelector("[data-admin-list]"),
  imageLibrary: document.querySelector("[data-image-library]"),
  imageLog: document.querySelector("[data-image-log]"),
  status: document.querySelector("[data-admin-status]"),
};

function getSettings() {
  return {
    repo: document.querySelector("#github-repo").value.trim(),
    branch: document.querySelector("#github-branch").value.trim() || "main",
    path: document.querySelector("#github-path").value.trim() || "data/updates.json",
    settingsPath: document.querySelector("#github-settings-path").value.trim() || "data/site-settings.json",
    pageContentPath: document.querySelector("#github-page-content-path").value.trim() || "data/page-content.json",
    uploadFolder: (document.querySelector("#github-upload-folder")?.value.trim() || "assets/images/uploads").replace(/^\/+|\/+$/g, ""),
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

function encodeArrayBufferBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return btoa(binary);
}

function decodeBase64(text) {
  const binary = atob(text.replace(/\n/g, ""));
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function normalizeSettings(settings) {
  return window.WDR5?.normalizeSiteSettings
    ? window.WDR5.normalizeSiteSettings(settings)
    : adminState.settings;
}

function normalizePageContent(content) {
  return window.WDR5?.normalizePageContent
    ? window.WDR5.normalizePageContent(content)
    : (content && typeof content === "object" ? content : { version: 1, pages: {} });
}

function slugify(value) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function isImagePath(path = "") {
  return /\.(png|jpe?g|webp|gif)$/i.test(path);
}

function imageAltFromPath(path = "") {
  return path
    .split("/")
    .pop()
    .replace(/\.[^.]+$/, "")
    .replace(/^\w{6,}-\w{5}-/, "")
    .replace(/[-_]+/g, " ")
    .trim() || "Article image";
}

function buildUploadPath(file, altText, uploadFolder = "assets/images/uploads") {
  const extensions = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
  };
  const extension = extensions[file.type];
  if (!extension) throw new Error("Please upload a JPG, PNG, WebP or GIF image.");
  if (file.size > 5 * 1024 * 1024) throw new Error("Please keep uploaded images under 5 MB.");

  const originalName = file.name.replace(/\.[^.]+$/, "");
  const baseName = slugify(altText || originalName || "article-image") || "article-image";
  const stamp = Date.now().toString(36);
  const suffix = Math.random().toString(36).slice(2, 7);
  return `${uploadFolder || "assets/images/uploads"}/${stamp}-${suffix}-${baseName}.${extension}`;
}

function imageMarkdown(path, altText, caption) {
  const alt = (altText || "Article image").replace(/[\[\]\n\r]/g, " ").trim();
  const cleanCaption = (caption || "").replace(/["\n\r]/g, " ").trim();
  return cleanCaption ? `![${alt}](${path} "${cleanCaption}")` : `![${alt}](${path})`;
}

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

function insertIntoTextarea(textarea, value) {
  const start = textarea.selectionStart ?? textarea.value.length;
  const end = textarea.selectionEnd ?? textarea.value.length;
  const before = textarea.value.slice(0, start).replace(/\s+$/, "");
  const after = textarea.value.slice(end).replace(/^\s+/, "");
  textarea.value = `${before}${before ? "\n\n" : ""}${value}${after ? "\n\n" : ""}${after}`;
  const cursor = before.length + (before ? 2 : 0) + value.length;
  textarea.focus();
  textarea.setSelectionRange(cursor, cursor);
}

function renderList() {
  const posts = [...adminState.posts].sort((a, b) => new Date(b.date) - new Date(a.date));
  els.list.innerHTML = posts.length ? posts.map((post) => `
    <article class="admin-post">
      <img src="${escapeHtml(post.image || "assets/images/update-research.jpg")}" alt="">
      <div>
        <span>${escapeHtml(post.category || "Update")} - ${escapeHtml(post.date)}</span>
        <h3>${escapeHtml(post.title)}</h3>
        <p>${escapeHtml(post.summary)}</p>
      </div>
      <div class="admin-post-actions">
        <a href="update.html?id=${encodeURIComponent(post.id)}" target="_blank" rel="noopener">View article</a>
        <button type="button" data-edit="${escapeHtml(post.id)}">Edit</button>
        <button class="danger-link" type="button" data-delete="${escapeHtml(post.id)}">Delete</button>
      </div>
    </article>`).join("") : '<p class="empty-state">No posts yet. Add the first update using the editor.</p>';

  els.list.querySelectorAll("[data-edit]").forEach((button) => button.addEventListener("click", () => editPost(button.dataset.edit)));
  els.list.querySelectorAll("[data-delete]").forEach((button) => button.addEventListener("click", () => deletePost(button.dataset.delete)));
}

function renderImageLibrary() {
  if (!els.imageLibrary) return;

  if (!adminState.images.length) {
    els.imageLibrary.innerHTML = '<p class="empty-state">No images loaded yet. Connect to GitHub, then select Refresh image list.</p>';
    if (els.imageLog) els.imageLog.innerHTML = "<span>No image paths loaded yet.</span>";
    return;
  }

  els.imageLibrary.innerHTML = adminState.images.map((image) => `
    <article class="image-library-item">
      <img src="${escapeHtml(image.path)}" alt="">
      <div>
        <strong>${escapeHtml(image.name)}</strong>
        <code>${escapeHtml(image.path)}</code>
        <div class="image-library-actions">
          <button type="button" data-copy-image="${escapeHtml(image.path)}">Copy path</button>
          <button type="button" data-insert-image="${escapeHtml(image.path)}">Insert in article</button>
          <button type="button" data-hero-image="${escapeHtml(image.path)}">Use as header</button>
          <button type="button" data-tile-image="${escapeHtml(image.path)}">Use as tile</button>
        </div>
      </div>
    </article>`).join("");

  if (els.imageLog) {
    els.imageLog.innerHTML = `
      <strong>Image path log</strong>
      <ul>${adminState.images.map((image) => `<li><code>${escapeHtml(image.path)}</code></li>`).join("")}</ul>`;
  }

  els.imageLibrary.querySelectorAll("[data-copy-image]").forEach((button) => button.addEventListener("click", () => useImagePath("copy", button.dataset.copyImage)));
  els.imageLibrary.querySelectorAll("[data-insert-image]").forEach((button) => button.addEventListener("click", () => useImagePath("insert", button.dataset.insertImage)));
  els.imageLibrary.querySelectorAll("[data-hero-image]").forEach((button) => button.addEventListener("click", () => useImagePath("hero", button.dataset.heroImage)));
  els.imageLibrary.querySelectorAll("[data-tile-image]").forEach((button) => button.addEventListener("click", () => useImagePath("tile", button.dataset.tileImage)));
}

async function useImagePath(action, path) {
  if (!path) return;

  try {
    if (action === "copy") {
      await copyText(path);
      setStatus(`Copied image path: ${path}`, "success");
      return;
    }

    if (action === "hero") {
      document.querySelector("#post-heroImage").value = path;
      setStatus("Image path added as the full article header image. Save the update draft when ready.", "success");
      return;
    }

    if (action === "tile") {
      document.querySelector("#post-image").value = path;
      setStatus("Image path added as the tile image. Save the update draft when ready.", "success");
      return;
    }

    insertIntoTextarea(document.querySelector("#post-content"), imageMarkdown(path, imageAltFromPath(path), ""));
    setStatus("Image path inserted into the full article body. Save the update draft when ready.", "success");
  } catch (error) {
    setStatus(error.message || "Could not use that image path.", "error");
  }
}

function renderPageSelector() {
  if (!els.pageSelect) return;
  const pages = adminState.pageContent.pages || {};
  const entries = Object.entries(pages);

  if (!entries.length) {
    els.pageSelect.innerHTML = '<option value="">No editable pages loaded</option>';
    renderPageEditor();
    return;
  }

  if (!adminState.activePage || !pages[adminState.activePage]) {
    adminState.activePage = entries[0][0];
  }

  els.pageSelect.innerHTML = entries.map(([filename, page]) => (
    `<option value="${escapeHtml(filename)}"${filename === adminState.activePage ? " selected" : ""}>${escapeHtml(page.title || filename)}</option>`
  )).join("");
  renderPageEditor();
}

function renderPageEditor() {
  if (!els.pageFields) return;
  const page = adminState.pageContent.pages?.[adminState.activePage];

  if (!page || !Array.isArray(page.fields)) {
    els.pageFields.innerHTML = '<p class="empty-state">No editable fields are available for this page.</p>';
    if (els.pageSummary) els.pageSummary.textContent = "No page selected.";
    return;
  }

  if (els.pageSummary) {
    els.pageSummary.textContent = `${page.fields.length} editable field${page.fields.length === 1 ? "" : "s"} on ${page.title || adminState.activePage}.`;
  }

  els.pageFields.innerHTML = page.fields.map((field, index) => `
    <div class="page-field-card">
      <label for="page-field-${index}">${escapeHtml(field.label || field.selector || `Field ${index + 1}`)}</label>
      <textarea id="page-field-${index}" data-page-field-index="${index}"${field.type === "html" ? ' class="code-textarea"' : ""}>${escapeHtml(field.value ?? "")}</textarea>
      <span class="field-help">${
        field.type === "html"
          ? "HTML field — keep tags like &lt;span&gt; or &lt;br&gt; if you want the same styling."
          : field.type === "attribute"
            ? `Edits the ${escapeHtml(field.attribute || "attribute")} text.`
            : "Plain text field."
      }</span>
    </div>
  `).join("");
}

function savePageContentFromForm({ silent = false } = {}) {
  const page = adminState.pageContent.pages?.[adminState.activePage];
  if (!page || !Array.isArray(page.fields)) return false;

  els.pageFields?.querySelectorAll("[data-page-field-index]").forEach((fieldEl) => {
    const index = Number(fieldEl.dataset.pageFieldIndex);
    if (page.fields[index]) page.fields[index].value = fieldEl.value;
  });

  if (!silent) setStatus("Page content saved as a draft on this screen. Select Publish live changes to GitHub to update the public website.", "warning");
  return true;
}

function renderSettingsForm() {
  const settings = normalizeSettings(adminState.settings);
  adminState.settings = settings;
  document.querySelector("#stat-families-value").value = settings.heroStats.families.value;
  document.querySelector("#stat-families-label").value = settings.heroStats.families.label;
  document.querySelector("#stat-countries-value").value = settings.heroStats.countries.value;
  document.querySelector("#stat-countries-label").value = settings.heroStats.countries.label;
}

function saveSettingsFromForm({ silent = false } = {}) {
  if (!els.settingsEditor?.reportValidity()) return false;
  const data = Object.fromEntries(new FormData(els.settingsEditor).entries());
  const current = normalizeSettings(adminState.settings);

  adminState.settings = normalizeSettings({
    heroStats: {
      families: {
        ...current.heroStats.families,
        value: data.familiesValue.trim(),
        label: data.familiesLabel.trim(),
      },
      countries: {
        ...current.heroStats.countries,
        value: data.countriesValue.trim(),
        label: data.countriesLabel.trim(),
      },
      message: current.heroStats.message,
    },
  });

  renderSettingsForm();
  if (!silent) setStatus("Homepage numbers saved as a draft on this screen. Select Publish live changes to GitHub to update the public website.", "warning");
  return true;
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
  ["title", "date", "category", "summary", "image", "heroImage", "content"].forEach((field) => {
    document.querySelector(`#post-${field}`).value = post[field] || "";
  });
  document.querySelector("#post-featured").checked = Boolean(post.featured);
  els.editor.scrollIntoView({ behavior: "smooth", block: "start" });
}

function deletePost(id) {
  if (!confirm("Delete this update from the draft list? It will not affect the public website until you publish.")) return;
  adminState.posts = adminState.posts.filter((post) => post.id !== id);
  renderList();
  setStatus("Post removed from the draft list. Select Publish live changes to GitHub to update the public website.", "warning");
}

async function loadPublicData() {
  const [posts, siteSettings, pageContent] = await Promise.all([
    window.WDR5Updates.getUpdates(),
    window.WDR5.loadSiteSettings(),
    window.WDR5.loadPageContent(),
  ]);

  adminState.posts = posts;
  adminState.sha = "";
  adminState.settings = normalizeSettings(siteSettings);
  adminState.settingsSha = "";
  adminState.pageContent = normalizePageContent(pageContent);
  adminState.pageContentSha = "";
  renderList();
  renderSettingsForm();
  renderPageSelector();
  clearEditor();
  setStatus("Loaded the public copy for preview. To publish changes, enter your GitHub repository and private update key, then connect to GitHub.", "success");
}

async function readGitHubFile(settings, path) {
  const response = await fetch(`https://api.github.com/repos/${settings.repo}/contents/${path}?ref=${encodeURIComponent(settings.branch)}`, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${settings.token}`,
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub returned ${response.status} for ${path}. Check the repository, branch, path and token permissions.`);
  }

  const file = await response.json();
  return {
    sha: file.sha,
    content: decodeBase64(file.content || ""),
  };
}

async function readGitHubDirectory(settings, path) {
  const response = await fetch(`https://api.github.com/repos/${settings.repo}/contents/${path}?ref=${encodeURIComponent(settings.branch)}`, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${settings.token}`,
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });

  if (response.status === 404) return [];
  if (!response.ok) {
    throw new Error(`GitHub returned ${response.status} while loading ${path}.`);
  }

  const contents = await response.json();
  return Array.isArray(contents) ? contents : [];
}

async function getGitHubFileSha(settings, path) {
  const response = await fetch(`https://api.github.com/repos/${settings.repo}/contents/${path}?ref=${encodeURIComponent(settings.branch)}`, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${settings.token}`,
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });

  if (response.status === 404) return "";
  if (!response.ok) {
    throw new Error(`GitHub returned ${response.status} while checking ${path}.`);
  }

  const file = await response.json();
  return file.sha || "";
}

async function writeGitHubFile(settings, path, content, sha, message) {
  const body = {
    message,
    content: encodeBase64(content),
    branch: settings.branch,
  };
  const existingSha = sha || await getGitHubFileSha(settings, path);
  if (existingSha) body.sha = existingSha;

  const response = await fetch(`https://api.github.com/repos/${settings.repo}/contents/${path}`, {
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
    throw new Error(detail.message || `GitHub returned ${response.status} for ${path}.`);
  }

  const result = await response.json();
  return result.content.sha;
}

async function writeGitHubBase64File(settings, path, base64Content, message) {
  const response = await fetch(`https://api.github.com/repos/${settings.repo}/contents/${path}`, {
    method: "PUT",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${settings.token}`,
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: JSON.stringify({
      message,
      content: base64Content,
      branch: settings.branch,
    }),
  });

  if (!response.ok) {
    const detail = await response.json().catch(() => ({}));
    throw new Error(detail.message || `GitHub returned ${response.status} while uploading the image.`);
  }

  const result = await response.json();
  return result.content.path;
}

async function loadImageLibrary({ silent = false } = {}) {
  const settings = getSettings();
  if (!settings.repo || !settings.token) {
    if (!silent) setStatus("Enter your GitHub repository and private update key before loading the image list.", "error");
    return;
  }

  if (!silent) setStatus("Loading image paths from GitHub...");

  try {
    const folders = ["assets/images", settings.uploadFolder].filter(Boolean);
    const uniqueFolders = [...new Set(folders)];
    const folderContents = await Promise.all(uniqueFolders.map((folder) => readGitHubDirectory(settings, folder)));
    const imagesByPath = new Map();

    folderContents.flat().forEach((item) => {
      if (item.type !== "file" || !isImagePath(item.path)) return;
      imagesByPath.set(item.path, {
        name: item.name,
        path: item.path,
        size: item.size || 0,
      });
    });

    adminState.images = [...imagesByPath.values()].sort((a, b) => a.path.localeCompare(b.path));
    renderImageLibrary();
    if (!silent) setStatus(`Loaded ${adminState.images.length} image path${adminState.images.length === 1 ? "" : "s"} from GitHub.`, "success");
  } catch (error) {
    if (!silent) setStatus(error.message, "error");
  }
}

async function connectGitHub() {
  const settings = getSettings();
  if (!settings.repo || !settings.token) {
    setStatus("Enter the GitHub repository and your private GitHub update key before connecting.", "error");
    return;
  }

  localStorage.setItem("wdr5-admin-settings", JSON.stringify({
    repo: settings.repo,
    branch: settings.branch,
    path: settings.path,
    settingsPath: settings.settingsPath,
    uploadFolder: settings.uploadFolder,
    pageContentPath: settings.pageContentPath,
  }));
  sessionStorage.setItem("wdr5-github-token", settings.token);
  setStatus("Connecting to GitHub...");

  try {
    const updatesFile = await readGitHubFile(settings, settings.path);
    const settingsFile = await readGitHubFile(settings, settings.settingsPath);
    const pageContentFile = await readGitHubFile(settings, settings.pageContentPath);

    adminState.posts = JSON.parse(updatesFile.content);
    adminState.sha = updatesFile.sha;
    adminState.settings = normalizeSettings(JSON.parse(settingsFile.content));
    adminState.settingsSha = settingsFile.sha;
    adminState.pageContent = normalizePageContent(JSON.parse(pageContentFile.content));
    adminState.pageContentSha = pageContentFile.sha;
    renderList();
    renderSettingsForm();
    renderPageSelector();
    clearEditor();
    await loadImageLibrary({ silent: true });
    setStatus("Connected securely for this browser tab. You can now edit drafts and publish live changes to GitHub.", "success");
  } catch (error) {
    setStatus(error.message, "error");
  }
}

async function publishGitHub() {
  const settings = getSettings();
  if (!settings.repo || !settings.token) {
    setStatus("Connect to GitHub with your private update key before publishing.", "error");
    return;
  }
  if (!saveSettingsFromForm({ silent: true })) {
    setStatus("Please complete the homepage numbers before publishing.", "error");
    return;
  }
  savePageContentFromForm({ silent: true });

  setStatus("Publishing live changes to GitHub...");

  const date = new Date().toISOString().slice(0, 10);
  const postsContent = JSON.stringify([...adminState.posts].sort((a, b) => new Date(b.date) - new Date(a.date)), null, 2) + "\n";
  const settingsContent = JSON.stringify(normalizeSettings(adminState.settings), null, 2) + "\n";
  const pageContent = JSON.stringify(normalizePageContent(adminState.pageContent), null, 2) + "\n";

  try {
    adminState.sha = await writeGitHubFile(settings, settings.path, postsContent, adminState.sha, `Update foundation posts (${date})`);
    adminState.settingsSha = await writeGitHubFile(settings, settings.settingsPath, settingsContent, adminState.settingsSha, `Update homepage numbers (${date})`);
    adminState.pageContentSha = await writeGitHubFile(settings, settings.pageContentPath, pageContent, adminState.pageContentSha, `Update editable page content (${date})`);
    setStatus("Published. GitHub Pages will refresh after its deployment finishes.", "success");
  } catch (error) {
    setStatus(error.message, "error");
  }
}

function downloadJson(content, filename) {
  const blob = new Blob([content], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

function exportJson() {
  const content = JSON.stringify(adminState.posts, null, 2) + "\n";
  downloadJson(content, "updates.json");
  setStatus("Downloaded updates.json for manual upload to GitHub.", "success");
}

function exportSettingsJson() {
  if (!saveSettingsFromForm({ silent: true })) {
    setStatus("Please complete the homepage numbers before downloading.", "error");
    return;
  }
  const content = JSON.stringify(normalizeSettings(adminState.settings), null, 2) + "\n";
  downloadJson(content, "site-settings.json");
  setStatus("Downloaded site-settings.json for manual upload to GitHub.", "success");
}

function exportPageContentJson() {
  savePageContentFromForm({ silent: true });
  const content = JSON.stringify(normalizePageContent(adminState.pageContent), null, 2) + "\n";
  downloadJson(content, "page-content.json");
  setStatus("Downloaded page-content.json for manual upload to GitHub.", "success");
}

async function uploadArticleImage() {
  const settings = getSettings();
  if (!settings.repo || !settings.token) {
    setStatus("Enter your GitHub repository and private update key before uploading images.", "error");
    return;
  }

  const fileInput = document.querySelector("#article-image-file");
  const file = fileInput?.files?.[0];
  if (!file) {
    setStatus("Choose an image file to upload.", "error");
    return;
  }

  const altText = document.querySelector("#article-image-alt").value.trim();
  const caption = document.querySelector("#article-image-caption").value.trim();
  const placement = document.querySelector("#article-image-placement").value;

  try {
    const path = buildUploadPath(file, altText, settings.uploadFolder);
    setStatus("Uploading image to GitHub...");
    const base64Content = encodeArrayBufferBase64(await file.arrayBuffer());
    const uploadedPath = await writeGitHubBase64File(settings, path, base64Content, `Upload website image (${new Date().toISOString().slice(0, 10)})`);
    adminState.images = [
      { name: uploadedPath.split("/").pop(), path: uploadedPath, size: file.size },
      ...adminState.images.filter((image) => image.path !== uploadedPath),
    ].sort((a, b) => a.path.localeCompare(b.path));
    renderImageLibrary();

    if (placement === "hero") {
      document.querySelector("#post-heroImage").value = uploadedPath;
      setStatus("Image uploaded and added as the full article header image. Save the update draft, then publish live changes.", "success");
    } else if (placement === "tile") {
      document.querySelector("#post-image").value = uploadedPath;
      setStatus("Image uploaded and added as the tile image. Save the update draft, then publish live changes.", "success");
    } else {
      insertIntoTextarea(document.querySelector("#post-content"), imageMarkdown(uploadedPath, altText, caption));
      setStatus("Image uploaded and inserted into the full article body. Save the update draft, then publish live changes.", "success");
    }

    fileInput.value = "";
    document.querySelector("#article-image-alt").value = "";
    document.querySelector("#article-image-caption").value = "";
  } catch (error) {
    setStatus(error.message, "error");
  }
}

els.settingsEditor?.addEventListener("submit", (event) => {
  event.preventDefault();
  saveSettingsFromForm();
});

els.pageSelect?.addEventListener("change", () => {
  savePageContentFromForm({ silent: true });
  adminState.activePage = els.pageSelect.value;
  renderPageEditor();
});

els.pageEditor?.addEventListener("submit", (event) => {
  event.preventDefault();
  savePageContentFromForm();
});

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
    heroImage: data.heroImage.trim(),
    content: data.content.trim(),
    featured: data.featured === "on",
  };
  const index = adminState.posts.findIndex((item) => item.id === id);
  if (index >= 0) adminState.posts[index] = post;
  else adminState.posts.unshift(post);
  renderList();
  clearEditor();
  setStatus("Update saved as a draft on this screen. Select Publish live changes to GitHub to update the public website.", "warning");
});

document.querySelector("[data-connect-github]")?.addEventListener("click", connectGitHub);
document.querySelector("[data-load-public]")?.addEventListener("click", loadPublicData);
document.querySelector("[data-publish-github]")?.addEventListener("click", publishGitHub);
document.querySelector("[data-export-json]")?.addEventListener("click", exportJson);
document.querySelector("[data-export-settings-json]")?.addEventListener("click", exportSettingsJson);
document.querySelector("[data-export-page-content-json]")?.addEventListener("click", exportPageContentJson);
document.querySelector("[data-upload-article-image]")?.addEventListener("click", uploadArticleImage);
document.querySelector("[data-load-images]")?.addEventListener("click", () => loadImageLibrary());
document.querySelector("[data-clear-editor]")?.addEventListener("click", clearEditor);

const saved = JSON.parse(localStorage.getItem("wdr5-admin-settings") || "{}");
document.querySelector("#github-repo").value = saved.repo || "";
document.querySelector("#github-branch").value = saved.branch || "main";
document.querySelector("#github-path").value = saved.path || "data/updates.json";
document.querySelector("#github-settings-path").value = saved.settingsPath || "data/site-settings.json";
document.querySelector("#github-page-content-path").value = saved.pageContentPath || "data/page-content.json";
document.querySelector("#github-upload-folder").value = saved.uploadFolder || "assets/images/uploads";
document.querySelector("#github-token").value = sessionStorage.getItem("wdr5-github-token") || "";
renderImageLibrary();
renderPageSelector();
loadPublicData();
