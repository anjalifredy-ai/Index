// ====== CONFIG — apna GitHub username/repo yaha set hai ======
const GITHUB_USER = "anjalifredy-ai";
const GITHUB_REPO = "Library";
const RELEASE_TAG = "apps";

const API_URL = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/releases/tags/${RELEASE_TAG}`;

const grid = document.getElementById("grid");
const status = document.getElementById("status");
const refreshBtn = document.getElementById("refreshBtn");

// Parse the release body for "filename.apk :: description" lines
function parseDescriptions(body) {
  const map = {};
  if (!body) return map;
  const lines = body.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const parts = trimmed.split("::");
    const fileName = parts[0].trim();
    const desc = parts.length > 1 ? parts.slice(1).join("::").trim() : "";
    if (fileName) map[fileName.toLowerCase()] = desc;
  }
  return map;
}

function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return "";
  if (bytes < 1024) return bytes + " B";
  const kb = bytes / 1024;
  if (kb < 1024) return kb.toFixed(0) + " KB";
  const mb = kb / 1024;
  return mb.toFixed(1) + " MB";
}

function appDisplayName(fileName) {
  // strip .apk and clean up dashes/underscores
  return fileName
    .replace(/\.apk$/i, "")
    .replace(/[_-]+/g, " ")
    .trim();
}

function initials(name) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "A";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function renderCards(assets, descMap) {
  grid.innerHTML = "";

  const apkAssets = assets.filter(a => a.name.toLowerCase().endsWith(".apk"));

  if (apkAssets.length === 0) {
    status.textContent = "Koi app abhi upload nahi hui hai.";
    status.classList.remove("error");
    status.style.display = "block";
    return;
  }

  status.style.display = "none";

  apkAssets.forEach((asset, i) => {
    const displayName = appDisplayName(asset.name);
    const desc = descMap[asset.name.toLowerCase()] || "";
    const size = formatBytes(asset.size);

    const card = document.createElement("div");
    card.className = "card";
    card.style.animationDelay = (i * 0.05) + "s";

    card.innerHTML = `
      <div class="card-top">
        <div class="card-icon">${initials(displayName)}</div>
        <div class="card-name">${escapeHtml(displayName)}</div>
      </div>
      ${desc ? `<div class="card-desc">${escapeHtml(desc)}</div>` : `<div class="card-desc">&nbsp;</div>`}
      <div class="card-meta">
        <span>${size}</span>
        <span>APK</span>
      </div>
      <a class="get-btn" href="${asset.browser_download_url}" download>⬇ Get</a>
    `;

    grid.appendChild(card);
  });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

async function loadApps() {
  status.style.display = "block";
  status.classList.remove("error");
  status.textContent = "Loading apps…";
  grid.innerHTML = "";

  try {
    const res = await fetch(API_URL, {
      headers: { "Accept": "application/vnd.github+json" }
    });

    if (!res.ok) {
      throw new Error("Release nahi mila (status " + res.status + ")");
    }

    const data = await res.json();
    const descMap = parseDescriptions(data.body);
    renderCards(data.assets || [], descMap);
  } catch (err) {
    status.textContent = "Apps load nahi ho paaye: " + err.message;
    status.classList.add("error");
    status.style.display = "block";
  }
}

refreshBtn.addEventListener("click", () => {
  refreshBtn.classList.add("spin");
  loadApps().finally(() => {
    setTimeout(() => refreshBtn.classList.remove("spin"), 700);
  });
});

loadApps();
