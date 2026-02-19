import mermaid from 'mermaid';

// ============================================================
// Mermaid Initialization
// ============================================================

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  themeVariables: {
    darkMode: true,
    background: '#060c14',
    mainBkg: '#0f2040',
    nodeBorder: '#2a5a8c',
    clusterBkg: '#0c1724',
    clusterBorder: '#2a5070',
    titleColor: '#cde5f5',
    edgeLabelBackground: '#0c1724',
    primaryColor: '#0f2040',
    primaryTextColor: '#cde5f5',
    primaryBorderColor: '#2a5a8c',
    lineColor: '#4a8ab0',
    secondaryColor: '#0d1e35',
    tertiaryColor: '#081525',
    fontFamily: '"IBM Plex Mono", monospace',
    fontSize: '14px',
  },
  securityLevel: 'loose',
  flowchart: { htmlLabels: true, curve: 'basis' },
  sequence: { useMaxWidth: false },
  gantt: { useMaxWidth: false },
});

// ============================================================
// State
// ============================================================

let savedCharts = {};
try {
  savedCharts = JSON.parse(localStorage.getItem('mv-charts') || '{}');
} catch (_) { savedCharts = {}; }

let currentId   = null;
let currentName = 'Untitled';
let isModified  = false;

// Render control
let renderVersion = 0;
let renderTimer   = null;

// Transform state
const tf = { scale: 1, x: 0, y: 0 };
let isDragging  = false;
let dragAnchor  = { x: 0, y: 0 };

// Resize state
let isResizing       = false;
let resizeStartX     = 0;
let resizeStartWidth = 0;

// ============================================================
// DOM References
// ============================================================

const editor           = document.getElementById('editor');
const mermaidOutput    = document.getElementById('mermaid-output');
const previewContainer = document.getElementById('preview-container');
const previewInner     = document.getElementById('preview-inner');
const zoomDisplay      = document.getElementById('zoom-level');
const chartNameDisplay = document.getElementById('chart-name-display');
const savedList        = document.getElementById('saved-list');
const savedCount       = document.getElementById('saved-count');
const saveModal        = document.getElementById('save-modal');
const chartNameInput   = document.getElementById('chart-name-input');
const errorBar         = document.getElementById('error-bar');
const errorText        = document.getElementById('error-text');
const sidebar          = document.getElementById('sidebar');
const editorPanel      = document.getElementById('editor-panel');
const divider          = document.getElementById('divider');
const modifiedDot      = document.getElementById('modified-dot');

// ============================================================
// Rendering
// ============================================================

function showEmptyState() {
  mermaidOutput.innerHTML = `
    <div class="empty-state">
      <div class="empty-icon">⬡</div>
      <p>Paste a Mermaid chart<br/>to see it rendered here</p>
      <span class="empty-sub">flowchart · sequence · gantt · pie · ...</span>
    </div>
  `;
}

async function renderChart() {
  const version = ++renderVersion;
  const code = editor.value.trim();

  // Ensure fonts are loaded so Mermaid's text-measurement gives correct metrics
  await document.fonts.ready;

  if (!code) {
    if (version !== renderVersion) return;
    showEmptyState();
    errorBar.classList.remove('visible');
    return;
  }

  try {
    const id = `mg${version}`;
    const { svg, bindFunctions } = await mermaid.render(id, code);

    if (version !== renderVersion) return;

    mermaidOutput.innerHTML = svg;
    if (bindFunctions) bindFunctions(mermaidOutput);

    const svgEl = mermaidOutput.querySelector('svg');
    if (svgEl) {
      svgEl.style.display = 'block';
      svgEl.style.maxWidth = 'none';
    }

    errorBar.classList.remove('visible');
  } catch (err) {
    if (version !== renderVersion) return;
    // Strip noise from mermaid error messages
    let msg = String(err.message || err).replace(/^Error:\s*/i, '').split('\n')[0];
    errorText.textContent = msg.length > 120 ? msg.slice(0, 120) + '…' : msg;
    errorBar.classList.add('visible');
  }
}

function scheduleRender() {
  clearTimeout(renderTimer);
  renderTimer = setTimeout(renderChart, 450);
  if (currentId) markModified(true);
}

function markModified(value) {
  isModified = value;
  modifiedDot.style.display = value ? 'inline-block' : 'none';
}

// ============================================================
// Transform: Zoom & Pan
// ============================================================

function applyTransform(animate = false) {
  if (animate) {
    previewInner.style.transition = 'transform 0.22s cubic-bezier(0.4, 0, 0.2, 1)';
    setTimeout(() => { previewInner.style.transition = ''; }, 230);
  } else {
    previewInner.style.transition = '';
  }
  previewInner.style.transform = `translate(${tf.x}px, ${tf.y}px) scale(${tf.scale})`;
  zoomDisplay.textContent = Math.round(tf.scale * 100) + '%';
}

function fitToView() {
  const svgEl = mermaidOutput.querySelector('svg');
  if (!svgEl) return;

  const cRect = previewContainer.getBoundingClientRect();
  const sBCR  = svgEl.getBoundingClientRect();

  // Natural (unscaled) dimensions
  const nW = sBCR.width  / tf.scale;
  const nH = sBCR.height / tf.scale;

  const pad = 40;
  const newScale = Math.min(
    (cRect.width  - pad * 2) / nW,
    (cRect.height - pad * 2) / nH,
    3
  );

  tf.scale = newScale;
  tf.x = (cRect.width  - nW * newScale) / 2;
  tf.y = (cRect.height - nH * newScale) / 2;
  applyTransform(true);
}

function zoomAround(cx, cy, factor, animate = false) {
  const newScale = Math.max(0.04, Math.min(20, tf.scale * factor));
  const ratio = newScale / tf.scale;
  tf.x = cx - ratio * (cx - tf.x);
  tf.y = cy - ratio * (cy - tf.y);
  tf.scale = newScale;
  applyTransform(animate);
}

// Mouse wheel zoom (toward cursor)
previewContainer.addEventListener('wheel', (e) => {
  e.preventDefault();
  const rect = previewContainer.getBoundingClientRect();
  zoomAround(
    e.clientX - rect.left,
    e.clientY - rect.top,
    e.deltaY > 0 ? 0.87 : 1.15
  );
}, { passive: false });

// Drag to pan
previewContainer.addEventListener('mousedown', (e) => {
  if (e.button !== 0) return;
  isDragging = true;
  dragAnchor = { x: e.clientX - tf.x, y: e.clientY - tf.y };
  previewContainer.classList.add('dragging');
  e.preventDefault();
});

document.addEventListener('mousemove', (e) => {
  if (!isDragging) return;
  tf.x = e.clientX - dragAnchor.x;
  tf.y = e.clientY - dragAnchor.y;
  applyTransform();
});

document.addEventListener('mouseup', () => {
  if (!isDragging) return;
  isDragging = false;
  previewContainer.classList.remove('dragging');
});

// Touch support
let lastTouchDist = 0;
previewContainer.addEventListener('touchstart', (e) => {
  if (e.touches.length === 2) {
    lastTouchDist = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    );
  } else if (e.touches.length === 1) {
    isDragging = true;
    dragAnchor = { x: e.touches[0].clientX - tf.x, y: e.touches[0].clientY - tf.y };
  }
  e.preventDefault();
}, { passive: false });

previewContainer.addEventListener('touchmove', (e) => {
  if (e.touches.length === 2) {
    const dist = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    );
    const rect = previewContainer.getBoundingClientRect();
    const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
    const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top;
    zoomAround(cx, cy, dist / lastTouchDist);
    lastTouchDist = dist;
  } else if (e.touches.length === 1 && isDragging) {
    tf.x = e.touches[0].clientX - dragAnchor.x;
    tf.y = e.touches[0].clientY - dragAnchor.y;
    applyTransform();
  }
  e.preventDefault();
}, { passive: false });

previewContainer.addEventListener('touchend', () => { isDragging = false; });

// Zoom buttons
document.getElementById('zoom-in').addEventListener('click', () => {
  const r = previewContainer.getBoundingClientRect();
  zoomAround(r.width / 2, r.height / 2, 1.3, true);
});

document.getElementById('zoom-out').addEventListener('click', () => {
  const r = previewContainer.getBoundingClientRect();
  zoomAround(r.width / 2, r.height / 2, 1 / 1.3, true);
});

document.getElementById('zoom-fit').addEventListener('click', fitToView);

document.getElementById('zoom-reset').addEventListener('click', () => {
  tf.scale = 1; tf.x = 0; tf.y = 0;
  applyTransform(true);
});

// ============================================================
// Resizable Split Pane
// ============================================================

divider.addEventListener('mousedown', (e) => {
  isResizing = true;
  resizeStartX = e.clientX;
  resizeStartWidth = editorPanel.getBoundingClientRect().width;
  divider.classList.add('dragging');
  document.body.style.cursor = 'col-resize';
  document.body.style.userSelect = 'none';
  e.preventDefault();
});

document.addEventListener('mousemove', (e) => {
  if (!isResizing) return;
  const dx = e.clientX - resizeStartX;
  const w  = Math.max(200, Math.min(resizeStartWidth + dx, window.innerWidth * 0.72));
  editorPanel.style.flex  = 'none';
  editorPanel.style.width = w + 'px';
});

document.addEventListener('mouseup', () => {
  if (!isResizing) return;
  isResizing = false;
  divider.classList.remove('dragging');
  document.body.style.cursor = '';
  document.body.style.userSelect = '';
});

// ============================================================
// Sidebar Toggle
// ============================================================

document.getElementById('sidebar-toggle').addEventListener('click', () => {
  sidebar.classList.toggle('collapsed');
});

// ============================================================
// Save & Load (localStorage)
// ============================================================

function persistCharts() {
  try {
    localStorage.setItem('mv-charts', JSON.stringify(savedCharts));
  } catch (_) { /* quota exceeded — silent */ }
}

function renderSavedList() {
  const entries = Object.entries(savedCharts)
    .sort((a, b) => b[1].savedAt - a[1].savedAt);

  savedCount.textContent = entries.length;

  if (entries.length === 0) {
    savedList.innerHTML = '<div class="saved-empty">No saved charts yet.<br />Hit <strong>SAVE</strong> to start.</div>';
    return;
  }

  savedList.innerHTML = entries.map(([id, chart]) => `
    <div class="saved-item${id === currentId ? ' active' : ''}" data-id="${id}">
      <div class="saved-item-name">${esc(chart.name)}</div>
      <div class="saved-item-date">${fmtDate(chart.savedAt)}</div>
      <button class="saved-item-delete" data-id="${id}" title="Delete">×</button>
    </div>
  `).join('');
}

function loadChart(id) {
  const chart = savedCharts[id];
  if (!chart) return;
  currentId   = id;
  currentName = chart.name;
  editor.value = chart.code;
  chartNameDisplay.textContent = chart.name;
  markModified(false);
  renderChart();
  renderSavedList();
  tf.scale = 1; tf.x = 0; tf.y = 0;
  applyTransform();
  setTimeout(fitToView, 350);
}

function deleteChart(id) {
  const name = savedCharts[id]?.name || 'this chart';
  if (!confirm(`Delete "${name}"?`)) return;
  delete savedCharts[id];
  if (currentId === id) {
    currentId   = null;
    currentName = 'Untitled';
    chartNameDisplay.textContent = 'Untitled';
    markModified(false);
  }
  persistCharts();
  renderSavedList();
}

// Delegated click handlers on saved list
savedList.addEventListener('click', (e) => {
  const del  = e.target.closest('.saved-item-delete');
  if (del)  { deleteChart(del.dataset.id); return; }
  const item = e.target.closest('.saved-item');
  if (item) { loadChart(item.dataset.id); }
});

document.getElementById('sidebar-new-btn').addEventListener('click', newChart);

// ============================================================
// New Chart
// ============================================================

function newChart() {
  currentId   = null;
  currentName = 'Untitled';
  chartNameDisplay.textContent = 'Untitled';
  editor.value = '';
  markModified(false);
  showEmptyState();
  errorBar.classList.remove('visible');
  tf.scale = 1; tf.x = 0; tf.y = 0;
  applyTransform();
  renderSavedList();
  editor.focus();
}

document.getElementById('new-btn').addEventListener('click', newChart);

// ============================================================
// Save Modal
// ============================================================

function openSaveModal() {
  chartNameInput.value = (currentName && currentName !== 'Untitled') ? currentName : '';
  saveModal.classList.add('active');
  setTimeout(() => chartNameInput.focus(), 60);
}

function closeSaveModal() {
  saveModal.classList.remove('active');
}

function confirmSave() {
  const name = chartNameInput.value.trim() || 'Untitled';
  const id   = currentId || ('c' + Date.now());
  currentId   = id;
  currentName = name;

  savedCharts[id] = { name, code: editor.value, savedAt: Date.now() };

  persistCharts();
  renderSavedList();
  chartNameDisplay.textContent = name;
  markModified(false);
  closeSaveModal();
  flashSaveButton();
}

function flashSaveButton() {
  const btn = document.getElementById('save-btn');
  btn.textContent = 'SAVED ✓';
  btn.classList.add('btn-success');
  btn.classList.remove('btn-primary');
  setTimeout(() => {
    btn.textContent = 'SAVE';
    btn.classList.remove('btn-success');
    btn.classList.add('btn-primary');
  }, 1600);
}

document.getElementById('save-btn').addEventListener('click', openSaveModal);
document.getElementById('confirm-save').addEventListener('click', confirmSave);
document.getElementById('cancel-save').addEventListener('click', closeSaveModal);
saveModal.addEventListener('click', (e) => { if (e.target === saveModal) closeSaveModal(); });
chartNameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter')  confirmSave();
  if (e.key === 'Escape') closeSaveModal();
});

// ============================================================
// Editor Events
// ============================================================

editor.addEventListener('input', scheduleRender);

// Tab → 4 spaces
editor.addEventListener('keydown', (e) => {
  if (e.key === 'Tab') {
    e.preventDefault();
    const s = editor.selectionStart;
    const end = editor.selectionEnd;
    editor.value = editor.value.slice(0, s) + '    ' + editor.value.slice(end);
    editor.selectionStart = editor.selectionEnd = s + 4;
    scheduleRender();
  }
});

// ============================================================
// Keyboard Shortcuts
// ============================================================

document.addEventListener('keydown', (e) => {
  const mod = e.ctrlKey || e.metaKey;
  if (!mod) return;

  switch (e.key) {
    case 's':
      e.preventDefault();
      openSaveModal();
      break;
    case '0':
      e.preventDefault();
      fitToView();
      break;
    case '=':
    case '+':
      e.preventDefault();
      document.getElementById('zoom-in').click();
      break;
    case '-':
      e.preventDefault();
      document.getElementById('zoom-out').click();
      break;
  }
});

// ============================================================
// Utilities
// ============================================================

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fmtDate(ts) {
  return new Date(ts).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

// ============================================================
// Initialization
// ============================================================

const DEFAULT_CHART = `flowchart TD
    A([🚀 Request]) --> B{Cache Hit?}
    B -->|Yes| C[Return Cached Data]
    B -->|No| D[Fetch from API]
    D --> E{Success?}
    E -->|Yes| F[Store in Cache]
    E -->|No| G([⚠ Return Error])
    F --> C
    C --> H([✅ Send Response])
    G --> H`;

editor.value = DEFAULT_CHART;
renderSavedList();

// Wait for custom fonts to finish loading before the first render so Mermaid's
// internal text-width measurements (used to size note boxes, labels, etc.) use
// the real font metrics rather than fallback-font metrics.
document.fonts.ready.then(() => {
  renderChart().then(() => {
    setTimeout(fitToView, 400);
  });
});
