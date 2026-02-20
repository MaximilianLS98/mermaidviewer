import { useState, useEffect, useRef, useCallback } from 'react';
import { useMermaid } from './useMermaid.js';
import { usePanZoom } from './usePanZoom.js';
import { useSavedCharts } from './useSavedCharts.js';

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

function fmtDate(ts) {
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function safeFilename(name) {
  return (name || 'chart').trim()
    .replace(/[^\w\s\-]/g, '').replace(/\s+/g, '_').replace(/_{2,}/g, '_') || 'chart';
}

function buildExportSVG(svgEl, currentScale, padding = 32) {
  if (!svgEl) return null;
  const clone = svgEl.cloneNode(true);
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');

  let nW, nH;
  const vb = svgEl.viewBox?.baseVal;
  if (vb && vb.width > 0 && vb.height > 0) {
    nW = vb.width; nH = vb.height;
  } else {
    nW = parseFloat(svgEl.getAttribute('width'))  || svgEl.getBoundingClientRect().width  / currentScale;
    nH = parseFloat(svgEl.getAttribute('height')) || svgEl.getBoundingClientRect().height / currentScale;
  }

  const totalW = nW + padding * 2;
  const totalH = nH + padding * 2;
  clone.setAttribute('width',   totalW);
  clone.setAttribute('height',  totalH);
  clone.setAttribute('viewBox', `${-padding} ${-padding} ${totalW} ${totalH}`);

  const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  bg.setAttribute('x', -padding); bg.setAttribute('y', -padding);
  bg.setAttribute('width', totalW); bg.setAttribute('height', totalH);
  bg.setAttribute('fill', '#060c14');
  clone.insertBefore(bg, clone.firstChild);

  const xmlStr = '<?xml version="1.0" encoding="UTF-8"?>\n' +
    new XMLSerializer().serializeToString(clone);
  return { xmlStr, totalW, totalH };
}

export default function MermaidTool() {
  const [code, setCode] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentId, setCurrentId] = useState(null);
  const [currentName, setCurrentName] = useState('Untitled');
  const [isModified, setIsModified] = useState(false);
  const [zoomPct, setZoomPct] = useState(100);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [modalName, setModalName] = useState('');
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [exportLabel, setExportLabel] = useState('EXPORT ▾');
  const [saveFlash, setSaveFlash] = useState(false);
  const [editorWidth, setEditorWidth] = useState(null); // null = 42%

  const containerRef = useRef(null);
  const innerRef     = useRef(null);
  const outputRef    = useRef(null);
  const editorRef    = useRef(null);
  const modalInputRef = useRef(null);
  const dividerRef   = useRef(null);

  const { charts, save, remove } = useSavedCharts();
  const { svg, error } = useMermaid(code);
  const { tf, fitToView, resetTransform, zoomAround, attachListeners } = usePanZoom(
    containerRef, innerRef, setZoomPct
  );

  // Attach pan/zoom listeners
  useEffect(() => {
    return attachListeners();
  }, []);

  // Inject SVG into output div and bind functions
  useEffect(() => {
    if (!outputRef.current) return;
    if (svg) {
      outputRef.current.innerHTML = svg.svg;
      if (svg.bindFunctions) svg.bindFunctions(outputRef.current);
      const svgEl = outputRef.current.querySelector('svg');
      if (svgEl) {
        svgEl.style.display = 'block';
        svgEl.style.maxWidth = 'none';
      }
    }
  }, [svg]);

  // Fit to view after first render
  useEffect(() => {
    if (svg) {
      const svgEl = outputRef.current?.querySelector('svg');
      if (svgEl) setTimeout(() => fitToView(svgEl), 350);
    }
  }, [svg]);

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e) {
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;
      switch (e.key) {
        case 's': e.preventDefault(); openSaveModal(); break;
        case '0': e.preventDefault(); {
          const svgEl = outputRef.current?.querySelector('svg');
          if (svgEl) fitToView(svgEl);
          break;
        }
        case '=':
        case '+': e.preventDefault(); zoomIn(); break;
        case '-': e.preventDefault(); zoomOut(); break;
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [currentId]);

  // Close export menu on outside click
  useEffect(() => {
    if (!exportMenuOpen) return;
    const close = () => setExportMenuOpen(false);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [exportMenuOpen]);

  function handleCodeChange(e) {
    setCode(e.target.value);
    if (currentId) setIsModified(true);
  }

  function handleTabKey(e) {
    if (e.key !== 'Tab') return;
    e.preventDefault();
    const el = e.target;
    const s = el.selectionStart;
    const end = el.selectionEnd;
    const newVal = el.value.slice(0, s) + '    ' + el.value.slice(end);
    setCode(newVal);
    requestAnimationFrame(() => {
      el.selectionStart = el.selectionEnd = s + 4;
    });
  }

  function zoomIn() {
    const r = containerRef.current?.getBoundingClientRect();
    if (r) zoomAround(r.width / 2, r.height / 2, 1.3, true);
  }

  function zoomOut() {
    const r = containerRef.current?.getBoundingClientRect();
    if (r) zoomAround(r.width / 2, r.height / 2, 1 / 1.3, true);
  }

  function loadChart(id) {
    const chart = charts[id];
    if (!chart) return;
    setCurrentId(id);
    setCurrentName(chart.name);
    setCode(chart.code);
    setIsModified(false);
    resetTransform();
  }

  function deleteChart(id) {
    const name = charts[id]?.name || 'this chart';
    if (!confirm(`Delete "${name}"?`)) return;
    remove(id);
    if (currentId === id) {
      setCurrentId(null);
      setCurrentName('Untitled');
      setIsModified(false);
    }
  }

  function newChart() {
    setCurrentId(null);
    setCurrentName('Untitled');
    setCode('');
    setIsModified(false);
    if (outputRef.current) outputRef.current.innerHTML = '';
    resetTransform();
    editorRef.current?.focus();
  }

  function openSaveModal() {
    setModalName(currentName !== 'Untitled' ? currentName : '');
    setShowSaveModal(true);
    setTimeout(() => modalInputRef.current?.focus(), 60);
  }

  function confirmSave() {
    const name = modalName.trim() || 'Untitled';
    const id = currentId || ('c' + Date.now());
    setCurrentId(id);
    setCurrentName(name);
    setIsModified(false);
    save(id, name, code);
    setShowSaveModal(false);
    setSaveFlash(true);
    setTimeout(() => setSaveFlash(false), 1600);
  }

  function handleModalKey(e) {
    if (e.key === 'Enter')  confirmSave();
    if (e.key === 'Escape') setShowSaveModal(false);
  }

  // Export
  function doExportSVG() {
    setExportMenuOpen(false);
    const svgEl = outputRef.current?.querySelector('svg');
    const result = buildExportSVG(svgEl, tf.current.scale, 32);
    if (!result) return;
    const blob = new Blob([result.xmlStr], { type: 'image/svg+xml;charset=utf-8' });
    triggerDownload(URL.createObjectURL(blob), safeFilename(currentName) + '.svg');
  }

  async function doExportPNG() {
    setExportMenuOpen(false);
    const svgEl = outputRef.current?.querySelector('svg');
    const result = buildExportSVG(svgEl, tf.current.scale, 32);
    if (!result) return;

    let { xmlStr, totalW, totalH } = result;
    xmlStr = xmlStr.replace(/@import\s+url\([^)]*\)\s*;?/g, '');
    const svgDataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xmlStr);

    setExportLabel('RENDERING…');
    try {
      await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width  = Math.round(totalW * 3);
          canvas.height = Math.round(totalH * 3);
          const ctx = canvas.getContext('2d');
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.fillStyle = '#060c14';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          canvas.toBlob(pngBlob => {
            triggerDownload(URL.createObjectURL(pngBlob), safeFilename(currentName) + '.png');
            resolve();
          }, 'image/png');
        };
        img.onerror = () => reject(new Error('SVG render failed'));
        img.src = svgDataUrl;
      });
      setExportLabel('SAVED ✓');
    } catch (err) {
      setExportLabel('ERROR');
      console.error('PNG export failed:', err);
    } finally {
      setTimeout(() => setExportLabel('EXPORT ▾'), 1500);
    }
  }

  function triggerDownload(url, filename) {
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 300);
  }

  // Resizable divider
  const isResizing   = useRef(false);
  const resizeStartX = useRef(0);
  const resizeStartW = useRef(0);

  function onDividerMouseDown(e) {
    isResizing.current = true;
    resizeStartX.current = e.clientX;
    const workspaceW = containerRef.current?.closest('.workspace')?.getBoundingClientRect().width;
    resizeStartW.current = editorWidth ?? (workspaceW ? workspaceW * 0.42 : 400);
    dividerRef.current?.classList.add('dragging');
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    e.preventDefault();
  }

  useEffect(() => {
    function onMove(e) {
      if (!isResizing.current) return;
      const dx = e.clientX - resizeStartX.current;
      const w = Math.max(200, Math.min(resizeStartW.current + dx, window.innerWidth * 0.72));
      setEditorWidth(w);
    }
    function onUp() {
      if (!isResizing.current) return;
      isResizing.current = false;
      dividerRef.current?.classList.remove('dragging');
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
  }, []);

  const sortedCharts = Object.entries(charts).sort((a, b) => b[1].savedAt - a[1].savedAt);

  return (
    <div className="flex h-full overflow-hidden" style={{ background: 'var(--color-base)' }}>

      {/* Sidebar */}
      <aside
        style={{
          width: sidebarOpen ? 224 : 0,
          minWidth: sidebarOpen ? 224 : 0,
          background: 'var(--color-surface)',
          borderRight: '1px solid var(--color-rule)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          flexShrink: 0,
          transition: 'width 0.28s cubic-bezier(0.4,0,0.2,1), min-width 0.28s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        {/* Sidebar header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '13px 14px', borderBottom: '1px solid var(--color-rule)', flexShrink: 0,
        }}>
          <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', color: 'var(--color-muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
            SAVED CHARTS
          </span>
          <span style={{
            background: 'rgba(0,212,255,0.12)', border: '1px solid var(--color-deep)',
            color: 'var(--color-accent)', borderRadius: 10, padding: '1px 7px',
            fontSize: 10, fontFamily: 'var(--font-mono)', lineHeight: 1.6, flexShrink: 0,
          }}>
            {sortedCharts.length}
          </span>
        </div>

        {/* Chart list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 6 }}>
          {sortedCharts.length === 0 ? (
            <div style={{ color: 'var(--color-muted)', fontSize: 11, textAlign: 'center', padding: '28px 14px', lineHeight: 1.7 }}>
              No saved charts yet.<br />Hit <strong style={{ color: 'var(--color-dim)' }}>SAVE</strong> to start.
            </div>
          ) : sortedCharts.map(([id, chart]) => {
            const active = id === currentId;
            return (
              <div
                key={id}
                className="saved-item sidebar-item-bar"
                onClick={() => loadChart(id)}
                style={{
                  padding: '8px 10px', borderRadius: 4, cursor: 'pointer', marginBottom: 2,
                  border: `1px solid ${active ? 'var(--color-deep)' : 'transparent'}`,
                  position: 'relative', overflow: 'hidden',
                  background: active ? 'rgba(0,212,255,0.12)' : 'transparent',
                  transition: 'background 0.13s, border-color 0.13s',
                }}
              >
                <div style={{
                  fontSize: 12, fontWeight: 500, color: active ? 'var(--color-accent)' : 'var(--color-ink)',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  paddingRight: 22, marginBottom: 2,
                }}>
                  {chart.name}
                </div>
                <div style={{ fontSize: 10, color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>
                  {fmtDate(chart.savedAt)}
                </div>
                <button
                  className="saved-item-delete"
                  onClick={e => { e.stopPropagation(); deleteChart(id); }}
                  style={{
                    position: 'absolute', top: 7, right: 7, background: 'none', border: 'none',
                    color: 'var(--color-muted)', cursor: 'pointer', fontSize: 15, lineHeight: 1,
                    padding: '1px 4px', borderRadius: 2,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-danger)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-muted)'; }}
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>

        {/* New chart button */}
        <button
          onClick={newChart}
          style={{
            margin: 8, padding: 9, background: 'transparent', border: '1px solid var(--color-rule)',
            color: 'var(--color-muted)', borderRadius: 4, cursor: 'pointer',
            fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 500, letterSpacing: '0.04em',
            transition: 'all 0.15s', flexShrink: 0, whiteSpace: 'nowrap',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'var(--color-soft)';
            e.currentTarget.style.color = 'var(--color-accent)';
            e.currentTarget.style.background = 'rgba(0,212,255,0.06)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'var(--color-rule)';
            e.currentTarget.style.color = 'var(--color-muted)';
            e.currentTarget.style.background = 'transparent';
          }}
        >
          ＋ New Chart
        </button>
      </aside>

      {/* Main */}
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">

        {/* Topbar */}
        <header style={{
          height: 50, background: 'var(--color-surface)', borderBottom: '1px solid var(--color-rule)',
          display: 'flex', alignItems: 'center', padding: '0 14px 0 12px', gap: 14,
          flexShrink: 0, position: 'relative',
        }}>
          {/* Gradient accent line */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: 1,
            background: 'linear-gradient(90deg, var(--color-deep) 0%, transparent 50%)', opacity: 0.5,
          }} />

          {/* Left: sidebar toggle + logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <button
              onClick={() => setSidebarOpen(v => !v)}
              style={{ display: 'flex', flexDirection: 'column', gap: 4, background: 'none', border: 'none', cursor: 'pointer', padding: '5px 4px', borderRadius: 4 }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-hover)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
            >
              {[0,1,2].map(i => (
                <span key={i} style={{ display: 'block', width: 18, height: 2, background: 'var(--color-dim)', borderRadius: 1 }} />
              ))}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 7, userSelect: 'none' }}>
              <span className="hex-pulse" style={{ fontSize: 22, color: 'var(--color-accent)', lineHeight: 1 }}>⬡</span>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 19, fontWeight: 700, letterSpacing: '0.06em', color: 'var(--color-ink)', lineHeight: 1 }}>
                MERMAID<span style={{ color: 'var(--color-accent)' }}>VIEWER</span>
              </span>
            </div>
          </div>

          {/* Chart name */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 7, overflow: 'hidden', minWidth: 0 }}>
            <span style={{ fontSize: 10, letterSpacing: '0.12em', color: 'var(--color-muted)', textTransform: 'uppercase', flexShrink: 0 }}>CHART</span>
            <span style={{ color: 'var(--color-muted)', fontSize: 9, flexShrink: 0 }}>▸</span>
            <span style={{ fontSize: 13, color: 'var(--color-amber)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: 'var(--font-display)', letterSpacing: '0.03em' }}>
              {currentName}
            </span>
            {isModified && (
              <span style={{ display: 'inline-block', width: 6, height: 6, background: 'var(--color-amber)', borderRadius: '50%', flexShrink: 0, boxShadow: '0 0 6px var(--color-amber)' }} />
            )}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <span style={{ fontSize: 10, color: 'var(--color-muted)', letterSpacing: '0.04em' }}>⌘S save · ⌘0 fit</span>
            <Btn ghost onClick={newChart}>NEW</Btn>
            <Btn
              primary={!saveFlash}
              success={saveFlash}
              onClick={openSaveModal}
            >
              {saveFlash ? 'SAVED ✓' : 'SAVE'}
            </Btn>
            <div style={{ position: 'relative' }}>
              <Btn ghost onClick={e => { e.stopPropagation(); const svgEl = outputRef.current?.querySelector('svg'); if (!svgEl) { return; } setExportMenuOpen(v => !v); }}>
                {exportLabel}
              </Btn>
              <div
                style={{
                  position: 'absolute', top: 'calc(100% + 7px)', right: 0,
                  background: 'var(--color-elevated)', border: '1px solid var(--color-wire)',
                  borderRadius: 8, minWidth: 192, padding: 5, zIndex: 50,
                  boxShadow: '0 16px 40px rgba(0,0,0,0.55)',
                  opacity: exportMenuOpen ? 1 : 0,
                  pointerEvents: exportMenuOpen ? 'all' : 'none',
                  transform: exportMenuOpen ? 'translateY(0)' : 'translateY(-6px)',
                  transition: 'opacity 0.15s ease, transform 0.15s ease',
                }}
              >
                <ExportItem ext="PNG" desc="Raster · 3× hi-res" onClick={doExportPNG} />
                <ExportItem ext="SVG" desc="Vector · lossless" onClick={doExportSVG} />
              </div>
            </div>
          </div>
        </header>

        {/* Workspace */}
        <div className="workspace flex flex-1 overflow-hidden">

          {/* Editor panel */}
          <div
            style={{
              display: 'flex', flexDirection: 'column', overflow: 'hidden',
              flex: editorWidth ? 'none' : '0 0 42%',
              width: editorWidth ? editorWidth : undefined,
              borderRight: '1px solid var(--color-rule)',
            }}
          >
            <PanelHead title="CHART CODE" hint="mermaid syntax">
              <button
                onClick={() => setCode(DEFAULT_CHART)}
                style={{ fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', padding: '3px 9px', borderRadius: 3, cursor: 'pointer', border: '1px solid var(--color-wire)', background: 'transparent', color: 'var(--color-dim)' }}
              >
                EXAMPLE
              </button>
            </PanelHead>
            <textarea
              ref={editorRef}
              value={code}
              onChange={handleCodeChange}
              onKeyDown={handleTabKey}
              spellCheck={false}
              autoCorrect="off"
              autoCapitalize="off"
              placeholder={`Paste your Mermaid chart code here...\n\nExample:\nflowchart LR\n    A --> B --> C`}
              style={{
                flex: 1, width: '100%', padding: '16px 18px',
                background: 'var(--color-base)', color: 'var(--color-ink)',
                border: 'none', resize: 'none', fontFamily: 'var(--font-mono)',
                fontSize: 13, lineHeight: 1.75, outline: 'none', overflowY: 'auto',
                tabSize: 2, caretColor: 'var(--color-accent)',
              }}
            />
            {error && (
              <div
                className="error-slide-up"
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '7px 14px',
                  background: 'rgba(255,77,106,0.08)', borderTop: '1px solid rgba(255,77,106,0.25)',
                  color: 'var(--color-danger)', fontSize: 11, fontFamily: 'var(--font-mono)', flexShrink: 0,
                }}
              >
                <span style={{ flexShrink: 0, fontSize: 12 }}>⚠</span>
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Resize divider */}
          <div
            ref={dividerRef}
            className="divider-line"
            onMouseDown={onDividerMouseDown}
          />

          {/* Preview panel */}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            <PanelHead title="PREVIEW">
              <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <ZoomBtn onClick={zoomOut}>−</ZoomBtn>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-dim)', minWidth: 44, textAlign: 'center' }}>
                  {zoomPct}%
                </span>
                <ZoomBtn onClick={zoomIn}>＋</ZoomBtn>
                <div style={{ width: 1, height: 14, background: 'var(--color-rule)', margin: '0 4px' }} />
                <ZoomBtn onClick={() => { const svgEl = outputRef.current?.querySelector('svg'); if (svgEl) fitToView(svgEl); }} style={{ fontFamily: 'var(--font-display)', fontSize: 10, letterSpacing: '0.08em' }}>FIT</ZoomBtn>
                <ZoomBtn onClick={() => { resetTransform(); }}>1:1</ZoomBtn>
              </div>
            </PanelHead>

            <div
              ref={containerRef}
              className="dot-grid"
              style={{ flex: 1, overflow: 'hidden', position: 'relative', cursor: 'grab' }}
            >
              <div
                ref={innerRef}
                style={{ position: 'absolute', top: 0, left: 0, transformOrigin: '0 0', padding: 24 }}
              >
                {!svg && !error && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '80px 40px', color: 'var(--color-muted)', userSelect: 'none' }}>
                    <div style={{ fontSize: 52, color: 'var(--color-accent)', opacity: 0.2, lineHeight: 1 }}>⬡</div>
                    <p style={{ fontSize: 13, textAlign: 'center', lineHeight: 1.7, maxWidth: 200 }}>
                      Paste a Mermaid chart<br />to see it rendered here
                    </p>
                    <span style={{ fontSize: 11, color: 'var(--color-muted)', fontFamily: 'var(--font-mono)', opacity: 0.7 }}>
                      flowchart · sequence · gantt · pie · ...
                    </span>
                  </div>
                )}
                <div id="mermaid-output" ref={outputRef} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save modal */}
      {showSaveModal && (
        <div
          className="modal-overlay active"
          style={{
            position: 'fixed', inset: 0, background: 'rgba(6,12,20,0.8)',
            backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 200,
          }}
          onClick={e => { if (e.target === e.currentTarget) setShowSaveModal(false); }}
        >
          <div
            className="modal-box"
            style={{
              background: 'var(--color-elevated)', border: '1px solid var(--color-wire)',
              borderRadius: 8, width: 380,
              boxShadow: '0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,212,255,0.06), inset 0 1px 0 rgba(255,255,255,0.04)',
            }}
          >
            <div style={{ padding: '18px 20px 14px', fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--color-accent)', borderBottom: '1px solid var(--color-rule)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 18, filter: 'drop-shadow(0 0 6px rgba(0,212,255,0.7))' }}>⬡</span>
              SAVE CHART
            </div>
            <div style={{ padding: 20 }}>
              <label style={{ display: 'block', fontSize: 10, letterSpacing: '0.12em', color: 'var(--color-muted)', marginBottom: 8, textTransform: 'uppercase', fontWeight: 600 }}>
                CHART NAME
              </label>
              <input
                ref={modalInputRef}
                type="text"
                value={modalName}
                onChange={e => setModalName(e.target.value)}
                onKeyDown={handleModalKey}
                placeholder="Enter a name..."
                maxLength={80}
                style={{
                  width: '100%', background: 'var(--color-surface)', border: '1px solid var(--color-wire)',
                  borderRadius: 4, color: 'var(--color-ink)', fontFamily: 'var(--font-sans)', fontSize: 14,
                  padding: '10px 12px', outline: 'none',
                }}
                onFocus={e => {
                  e.target.style.borderColor = 'var(--color-accent)';
                  e.target.style.boxShadow = '0 0 0 3px rgba(0,212,255,0.12)';
                }}
                onBlur={e => {
                  e.target.style.borderColor = 'var(--color-wire)';
                  e.target.style.boxShadow = '';
                }}
              />
            </div>
            <div style={{ padding: '12px 20px 18px', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Btn ghost onClick={() => setShowSaveModal(false)}>CANCEL</Btn>
              <Btn primary onClick={confirmSave}>SAVE CHART</Btn>
            </div>
          </div>
        </div>
      )}

      {/* Export dropdown rendered via inline open/close */}
    </div>
  );
}

// ── Inline helper components ──────────────────────────────────────

function Btn({ children, primary, ghost, success, onClick }) {
  const [hov, setHov] = useState(false);
  let bg, border, color;
  if (success) {
    bg = 'rgba(52,212,122,0.15)'; border = 'var(--color-ok)'; color = 'var(--color-ok)';
  } else if (primary) {
    bg = hov ? 'var(--color-soft)' : 'var(--color-deep)';
    border = hov ? 'var(--color-accent)' : 'var(--color-soft)';
    color = '#fff';
  } else {
    bg = hov ? 'var(--color-hover)' : 'transparent';
    border = hov ? 'var(--color-dim)' : 'var(--color-wire)';
    color = hov ? 'var(--color-ink)' : 'var(--color-dim)';
  }
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 600, letterSpacing: '0.12em',
        padding: '6px 14px', borderRadius: 4, cursor: 'pointer', border: `1px solid ${border}`,
        background: bg, color, transition: 'all 0.15s', textTransform: 'uppercase', whiteSpace: 'nowrap',
        boxShadow: (primary && hov) ? '0 0 16px rgba(0,212,255,0.3)' : 'none',
      }}
    >
      {children}
    </button>
  );
}

function ZoomBtn({ children, onClick, style: s }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? 'rgba(0,212,255,0.06)' : 'transparent',
        border: `1px solid ${hov ? 'var(--color-soft)' : 'var(--color-rule)'}`,
        color: hov ? 'var(--color-accent)' : 'var(--color-dim)',
        cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600,
        padding: '2px 8px', borderRadius: 4, transition: 'all 0.13s', minWidth: 26,
        textAlign: 'center', lineHeight: 1.6, ...s,
      }}
    >
      {children}
    </button>
  );
}

function PanelHead({ title, hint, children }) {
  return (
    <div style={{
      height: 38, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 14px', borderBottom: '1px solid var(--color-rule)',
      background: 'var(--color-surface)', flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 600, letterSpacing: '0.14em', color: 'var(--color-muted)', textTransform: 'uppercase' }}>
          {title}
        </span>
        {hint && <span style={{ fontSize: 10, color: 'var(--color-muted)', fontStyle: 'italic', fontFamily: 'var(--font-mono)' }}>{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function ExportItem({ ext, desc, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 11, width: '100%', padding: '8px 10px',
        background: hov ? 'var(--color-hover)' : 'none', border: 'none', borderRadius: 4,
        cursor: 'pointer', textAlign: 'left', transition: 'background 0.12s', color: 'var(--color-ink)',
      }}
    >
      <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--color-accent)', minWidth: 34 }}>
        {ext}
      </span>
      <span style={{ fontSize: 10, color: 'var(--color-muted)', fontFamily: 'var(--font-mono)', lineHeight: 1 }}>
        {desc}
      </span>
    </button>
  );
}
