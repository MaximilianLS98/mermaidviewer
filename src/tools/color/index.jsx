import { useState, useEffect } from 'react';
import CopyButton from '../../components/ui/CopyButton.jsx';

const RECENT_KEY = 'devtools-recent-colors';
const MAX_RECENT = 12;

function hexToRgb(hex) {
  const m = hex.replace('#', '').match(/^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (!m) return null;
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s;
  const l = (max + min) / 2;
  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

function contrastRatio(r, g, b) {
  // Relative luminance
  const lum = [r, g, b].map(c => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  const L = 0.2126 * lum[0] + 0.7152 * lum[1] + 0.0722 * lum[2];
  const white = 1, black = 0;
  return {
    vsWhite: (white + 0.05) / (L + 0.05),
    vsBlack: (L + 0.05) / (black + 0.05),
  };
}

function isValidHex(hex) {
  return /^#[0-9a-fA-F]{6}$/.test(hex);
}

function loadRecent() {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch (_) { return []; }
}

function saveRecent(colors) {
  try { localStorage.setItem(RECENT_KEY, JSON.stringify(colors)); } catch (_) {}
}

function addRecent(hex, prev) {
  const arr = [hex, ...prev.filter(c => c !== hex)].slice(0, MAX_RECENT);
  saveRecent(arr);
  return arr;
}

export default function ColorTool() {
  const [hex, setHex] = useState('');
  const [inputVal, setInputVal] = useState('');
  const [recent, setRecent] = useState(loadRecent);

  function applyHex(h) {
    const normalized = h.startsWith('#') ? h : '#' + h;
    if (isValidHex(normalized)) {
      setHex(normalized);
      setInputVal(normalized);
      setRecent(prev => addRecent(normalized, prev));
    }
  }

  function handleTextChange(e) {
    const val = e.target.value;
    setInputVal(val);
    const normalized = val.startsWith('#') ? val : '#' + val;
    if (isValidHex(normalized)) applyHex(normalized);
  }

  function handlePickerChange(e) {
    applyHex(e.target.value);
    setInputVal(e.target.value);
  }

  const rgb = hexToRgb(hex);
  const hsl = rgb ? rgbToHsl(rgb.r, rgb.g, rgb.b) : null;
  const contrast = rgb ? contrastRatio(rgb.r, rgb.g, rgb.b) : null;

  const formats = rgb && hsl ? [
    { label: 'HEX',  value: hex.toUpperCase() },
    { label: 'RGB',  value: `${rgb.r}, ${rgb.g}, ${rgb.b}` },
    { label: 'HSL',  value: `${hsl.h}°, ${hsl.s}%, ${hsl.l}%` },
    { label: 'CSS rgb()',   value: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` },
    { label: 'CSS hsl()',   value: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)` },
    { label: 'CSS variable', value: `--color: ${hex.toUpperCase()};` },
  ] : [];

  const S = {
    label: { fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', color: 'var(--color-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-display)' },
  };

  function aaLabel(ratio) {
    if (ratio >= 7) return { txt: 'AAA', color: 'var(--color-ok)' };
    if (ratio >= 4.5) return { txt: 'AA', color: 'var(--color-ok)' };
    if (ratio >= 3) return { txt: 'AA Large', color: 'var(--color-amber)' };
    return { txt: 'Fail', color: 'var(--color-danger)' };
  }

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: 'var(--color-base)', overflowY: 'auto' }}>

      {/* Header / picker row */}
      <div style={{ flexShrink: 0, borderBottom: '1px solid var(--color-rule)', background: 'var(--color-surface)', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Native color picker */}
        <label style={{ position: 'relative', cursor: 'pointer', flexShrink: 0 }}>
          <input
            type="color"
            value={hex || '#000000'}
            onChange={handlePickerChange}
            style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }}
          />
          <div style={{ width: 40, height: 40, borderRadius: 6, background: hex || 'var(--color-elevated)', border: '2px solid var(--color-wire)', boxShadow: hex ? `0 2px 12px ${hex}55` : 'none' }} />
        </label>

        {/* Text input */}
        <input
          type="text"
          value={inputVal}
          onChange={handleTextChange}
          placeholder="#rrggbb"
          maxLength={7}
          style={{
            background: 'var(--color-elevated)', border: '1px solid var(--color-wire)', borderRadius: 4,
            color: 'var(--color-ink)', fontFamily: 'var(--font-mono)', fontSize: 16, padding: '8px 12px',
            outline: 'none', width: 130, letterSpacing: '0.05em',
          }}
          onFocus={e => { e.target.style.borderColor = 'var(--color-accent)'; }}
          onBlur={e => { e.target.style.borderColor = 'var(--color-wire)'; }}
        />

        <button
          onClick={() => applyHex('#00d4ff')}
          style={{ fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', padding: '6px 12px', borderRadius: 3, cursor: 'pointer', border: '1px solid var(--color-wire)', background: 'transparent', color: 'var(--color-dim)' }}
        >
          EXAMPLE
        </button>

        {!hex && <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>Type a hex color or click the swatch</span>}
      </div>

      {/* Large swatch */}
      {hex && (
        <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'center', padding: '20px 0 10px', borderBottom: '1px solid var(--color-rule)' }}>
          <div style={{ width: 200, height: 100, borderRadius: 10, background: hex, boxShadow: `0 8px 32px ${hex}66, 0 2px 8px rgba(0,0,0,0.4)` }} />
        </div>
      )}

      {/* Format cards */}
      <div style={{ flexShrink: 0, padding: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 8 }}>
        {formats.map(f => (
          <div key={f.label} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-rule)', borderRadius: 6, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <div>
              <div style={S.label}>{f.label}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--color-ink)', marginTop: 3 }}>
                {f.value}
              </div>
            </div>
            <CopyButton text={f.value} />
          </div>
        ))}
      </div>

      {/* Contrast */}
      {contrast && (
        <div style={{ flexShrink: 0, padding: '0 16px 12px' }}>
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-rule)', borderRadius: 6, padding: '10px 14px' }}>
            <div style={{ ...S.label, marginBottom: 8 }}>Contrast Ratio (WCAG)</div>
            <div style={{ display: 'flex', gap: 16 }}>
              <ContrastRow label="vs White" ratio={contrast.vsWhite} aaLabel={aaLabel} />
              <ContrastRow label="vs Black" ratio={contrast.vsBlack} aaLabel={aaLabel} />
            </div>
          </div>
        </div>
      )}

      {/* Recent colors */}
      {recent.length > 0 && (
        <div style={{ flexShrink: 0, padding: '0 16px 16px' }}>
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-rule)', borderRadius: 6, padding: '10px 14px' }}>
            <div style={{ ...S.label, marginBottom: 10 }}>Recent Colors</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {recent.map(c => (
                <button
                  key={c}
                  onClick={() => applyHex(c)}
                  title={c}
                  style={{ width: 28, height: 28, borderRadius: 4, background: c, border: c === hex ? '2px solid var(--color-accent)' : '2px solid transparent', cursor: 'pointer', transition: 'border-color 0.15s' }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ContrastRow({ label, ratio, aaLabel }) {
  const aa = aaLabel(ratio);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 11, color: 'var(--color-dim)', fontFamily: 'var(--font-mono)', minWidth: 70 }}>{label}</span>
      <span style={{ fontSize: 12, color: 'var(--color-ink)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{ratio.toFixed(2)}:1</span>
      <span style={{ fontSize: 10, color: aa.color, fontFamily: 'var(--font-mono)', fontWeight: 700, background: `${aa.color}20`, padding: '1px 6px', borderRadius: 3 }}>
        {aa.txt}
      </span>
    </div>
  );
}
