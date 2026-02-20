import { useState, useCallback } from 'react';
import CopyButton from '../../components/ui/CopyButton.jsx';

// ── UUID v4 ──────────────────────────────────────────────────────────────
function uuidV4() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 10
  const h = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`;
}

// ── UUID v7 ──────────────────────────────────────────────────────────────
function uuidV7() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  const ms = BigInt(Date.now());
  bytes[0] = Number((ms >> 40n) & 0xffn);
  bytes[1] = Number((ms >> 32n) & 0xffn);
  bytes[2] = Number((ms >> 24n) & 0xffn);
  bytes[3] = Number((ms >> 16n) & 0xffn);
  bytes[4] = Number((ms >> 8n)  & 0xffn);
  bytes[5] = Number(ms          & 0xffn);
  bytes[6] = (bytes[6] & 0x0f) | 0x70; // version 7
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 10
  const h = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`;
}

// ── Nanoid ───────────────────────────────────────────────────────────────
const NANOID_ALPHABET = 'useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict';
function nanoid(size = 21) {
  const bytes = crypto.getRandomValues(new Uint8Array(size));
  return Array.from(bytes, b => NANOID_ALPHABET[b & 63]).join('');
}

const TYPES = [
  { id: 'v4',     label: 'UUID v4',    description: 'Random 128-bit ID' },
  { id: 'v7',     label: 'UUID v7',    description: 'Time-ordered, random' },
  { id: 'nanoid', label: 'Nanoid',     description: 'URL-safe, compact' },
];

function generate(type, format) {
  let id;
  if (type === 'v4') id = uuidV4();
  else if (type === 'v7') id = uuidV7();
  else id = nanoid(21);

  if (type === 'nanoid') return id;

  if (format === 'compact') return id.replace(/-/g, '');
  if (format === 'upper')   return id.toUpperCase();
  if (format === 'braces')  return `{${id.toUpperCase()}}`;
  return id; // 'hyphenated' default
}

const FORMATS = [
  { id: 'hyphenated', label: 'Hyphenated' },
  { id: 'compact',    label: 'Compact' },
  { id: 'upper',      label: 'Uppercase' },
  { id: 'braces',     label: '{Braces}' },
];

export default function UuidTool() {
  const [type, setType] = useState('v4');
  const [format, setFormat] = useState('hyphenated');
  const [quantity, setQuantity] = useState(5);
  const [ids, setIds] = useState([]);

  const regenerate = useCallback((newType = type, newFormat = format, newQty = quantity) => {
    setIds(Array.from({ length: newQty }, () => generate(newType, newFormat)));
  }, [type, format, quantity]);

  function handleType(t) {
    setType(t);
    regenerate(t, format, quantity);
  }
  function handleFormat(f) {
    setFormat(f);
    regenerate(type, f, quantity);
  }
  function handleQty(q) {
    const clamped = Math.max(1, Math.min(50, q));
    setQuantity(clamped);
    regenerate(type, format, clamped);
  }

  const allText = ids.join('\n');

  const S = {
    label: {
      fontSize: 10,
      fontWeight: 600,
      letterSpacing: '0.12em',
      color: 'var(--color-muted)',
      textTransform: 'uppercase',
      fontFamily: 'var(--font-display)',
    },
    panelHead: {
      height: 38,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 14px',
      borderBottom: '1px solid var(--color-rule)',
      background: 'var(--color-surface)',
      flexShrink: 0,
    },
    segBtn: (active) => ({
      fontFamily: 'var(--font-display)',
      fontSize: 10,
      fontWeight: 600,
      letterSpacing: '0.08em',
      padding: '4px 10px',
      borderRadius: 3,
      cursor: 'pointer',
      border: `1px solid ${active ? 'rgba(0,212,255,0.35)' : 'var(--color-wire)'}`,
      background: active ? 'rgba(0,212,255,0.1)' : 'transparent',
      color: active ? 'var(--color-accent)' : 'var(--color-dim)',
    }),
    genBtn: {
      fontFamily: 'var(--font-display)',
      fontSize: 10,
      fontWeight: 600,
      letterSpacing: '0.1em',
      padding: '3px 9px',
      borderRadius: 3,
      cursor: 'pointer',
      border: '1px solid var(--color-wire)',
      background: 'transparent',
      color: 'var(--color-dim)',
    },
  };

  return (
    <div className="flex h-full overflow-hidden" style={{ background: 'var(--color-base)' }}>
      {/* Left: controls */}
      <div style={{ flex: '0 0 50%', display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--color-rule)', overflow: 'hidden' }}>
        <div style={S.panelHead}>
          <span style={S.label}>Generator Settings</span>
        </div>

        <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto', flex: 1 }}>
          {/* Type */}
          <div>
            <div style={{ ...S.label, marginBottom: 8 }}>Type</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {TYPES.map(t => (
                <button key={t.id} onClick={() => handleType(t.id)} style={S.segBtn(type === t.id)}>
                  {t.label}
                </button>
              ))}
            </div>
            <div style={{ marginTop: 8, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-muted)' }}>
              {TYPES.find(t => t.id === type)?.description}
            </div>
          </div>

          {/* Format (UUID only) */}
          {type !== 'nanoid' && (
            <div>
              <div style={{ ...S.label, marginBottom: 8 }}>Format</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {FORMATS.map(f => (
                  <button key={f.id} onClick={() => handleFormat(f.id)} style={S.segBtn(format === f.id)}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div>
            <div style={{ ...S.label, marginBottom: 8 }}>Quantity (1–50)</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="number"
                value={quantity}
                min={1}
                max={50}
                onChange={e => handleQty(Number(e.target.value) || 1)}
                style={{
                  width: 80,
                  background: 'var(--color-elevated)',
                  color: 'var(--color-ink)',
                  border: '1px solid var(--color-wire)',
                  borderRadius: 4,
                  fontFamily: 'var(--font-mono)',
                  fontSize: 13,
                  padding: '7px 10px',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          {/* Regenerate */}
          <button
            onClick={() => regenerate()}
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.12em',
              padding: '9px 14px',
              borderRadius: 4,
              cursor: 'pointer',
              border: '1px solid rgba(0,212,255,0.3)',
              background: 'rgba(0,212,255,0.07)',
              color: 'var(--color-accent)',
              alignSelf: 'flex-start',
            }}
          >
            ↻ REGENERATE
          </button>

          {/* Preview of one */}
          {ids[0] && (
            <div>
              <div style={{ ...S.label, marginBottom: 6 }}>Example</div>
              <code style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-dim)', wordBreak: 'break-all' }}>
                {ids[0]}
              </code>
            </div>
          )}
        </div>
      </div>

      {/* Right: generated list */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={S.panelHead}>
          <span style={S.label}>
            Generated
            <span style={{ color: 'var(--color-accent)', marginLeft: 8 }}>{ids.length}</span>
          </span>
          <CopyButton text={allText} />
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px' }}>
          {ids.map((id, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 10px',
                marginBottom: 6,
                borderRadius: 5,
                border: '1px solid var(--color-rule)',
                background: 'var(--color-surface)',
                gap: 8,
              }}
            >
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-muted)', flexShrink: 0, width: 22 }}>
                {i + 1}
              </span>
              <code style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-ink)', flex: 1, wordBreak: 'break-all' }}>
                {id}
              </code>
              <CopyButton text={id} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
