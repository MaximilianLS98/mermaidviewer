import { useState, useCallback } from 'react';
import CopyButton from '../../components/ui/CopyButton.jsx';

const BASES = [
  { id: 'dec', label: 'Decimal',  base: 10, prefix: '',   placeholder: '255' },
  { id: 'hex', label: 'Hex',      base: 16, prefix: '0x', placeholder: 'FF' },
  { id: 'bin', label: 'Binary',   base: 2,  prefix: '0b', placeholder: '11111111' },
  { id: 'oct', label: 'Octal',    base: 8,  prefix: '0o', placeholder: '377' },
];

function toAll(n) {
  return {
    dec: n.toString(10),
    hex: n < 0 ? '-' + Math.abs(n).toString(16).toUpperCase() : n.toString(16).toUpperCase(),
    bin: n < 0 ? '-' + Math.abs(n).toString(2) : n.toString(2),
    oct: n < 0 ? '-' + Math.abs(n).toString(8) : n.toString(8),
  };
}

function twosComplement32(n) {
  if (n >= 0) return null;
  const u = (n >>> 0); // converts negative to unsigned 32-bit
  return u.toString(2).padStart(32, '0');
}

function chunkBin(bin) {
  // Group binary string into nibbles for readability
  return bin.replace(/-/, '')
    .split('')
    .reverse()
    .join('')
    .match(/.{1,4}/g)
    .map(s => s.split('').reverse().join(''))
    .reverse()
    .join(' ');
}

const EMPTY_VALUES = { dec: '', hex: '', bin: '', oct: '' };
const EXAMPLE_N = 255;

export default function NumbaseTool() {
  const [values, setValues] = useState(EMPTY_VALUES);
  const [error, setError] = useState(null);
  const [lastN, setLastN] = useState(null);

  const handleChange = useCallback((id, raw) => {
    const baseInfo = BASES.find(b => b.id === id);
    // Strip prefix if user typed it
    let stripped = raw.trim();
    if (id === 'hex') stripped = stripped.replace(/^-?0x/i, m => m.startsWith('-') ? '-' : '');
    if (id === 'bin') stripped = stripped.replace(/^-?0b/i, m => m.startsWith('-') ? '-' : '');
    if (id === 'oct') stripped = stripped.replace(/^-?0o/i, m => m.startsWith('-') ? '-' : '');

    // Allow typing in-progress (empty / lone minus)
    if (stripped === '' || stripped === '-') {
      setValues(v => ({ ...v, [id]: raw }));
      setError(null);
      return;
    }

    const n = parseInt(stripped, baseInfo.base);
    if (isNaN(n)) {
      setValues(v => ({ ...v, [id]: raw }));
      setError(`"${stripped}" is not a valid ${baseInfo.label.toLowerCase()} number`);
      return;
    }

    setError(null);
    setLastN(n);
    setValues(toAll(n));
  }, []);

  const tc32 = twosComplement32(lastN);

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
    input: {
      width: '100%',
      background: 'var(--color-elevated)',
      color: 'var(--color-ink)',
      border: '1px solid var(--color-wire)',
      borderRadius: 4,
      fontFamily: 'var(--font-mono)',
      fontSize: 13,
      padding: '9px 10px',
      outline: 'none',
      caretColor: 'var(--color-accent)',
    },
  };

  // For display in info panel
  const n = lastN;
  const hasValue = n !== null;
  const bitLength = hasValue ? (n === 0 ? 1 : Math.floor(Math.log2(Math.abs(n))) + 1) : null;
  const unsigned32 = hasValue ? (n >= 0 ? n : n >>> 0) : null;
  const infoRows = hasValue ? [
    { label: 'Decimal', value: values.dec },
    { label: 'Bit length', value: String(bitLength) + (n < 0 ? ' + sign' : '') },
    { label: 'Unsigned 32-bit', value: unsigned32.toString(10) },
  ] : [];

  return (
    <div className="flex h-full overflow-hidden" style={{ background: 'var(--color-base)' }}>
      {/* Left: 4 base inputs */}
      <div style={{ flex: '0 0 50%', display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--color-rule)', overflow: 'hidden' }}>
        <div style={S.panelHead}>
          <span style={S.label}>Number Bases</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {(error || hasValue) && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: error ? 'var(--color-danger)' : 'var(--color-muted)' }}>
                {error ? `⚠ ${error}` : `= ${n}`}
              </span>
            )}
            <button
              style={{
                fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 600, letterSpacing: '0.1em',
                padding: '3px 9px', borderRadius: 3, cursor: 'pointer',
                border: '1px solid var(--color-wire)', background: 'transparent', color: 'var(--color-dim)',
              }}
              onClick={() => { setValues(toAll(EXAMPLE_N)); setLastN(EXAMPLE_N); setError(null); }}
            >
              EXAMPLE
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {BASES.map(({ id, label, base, prefix }) => (
            <div key={id}>
              <div style={{ ...S.label, marginBottom: 6 }}>
                {label}
                <span style={{ color: 'var(--color-dim)', marginLeft: 8, fontWeight: 400 }}>
                  base {base}{prefix ? ` · ${prefix}…` : ''}
                </span>
              </div>
              <input
                value={values[id]}
                onChange={e => handleChange(id, e.target.value)}
                spellCheck={false}
                placeholder={`e.g. ${BASES.find(b => b.id === id).placeholder}`}
                style={S.input}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Right: info panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={S.panelHead}>
          <span style={S.label}>Properties</span>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {!hasValue && (
            <div style={{ padding: 14, color: 'var(--color-muted)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
              Enter a number in any field on the left.
            </div>
          )}
          {infoRows.map(({ label, value }) => (
            <div
              key={label}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderBottom: '1px solid var(--color-rule)', gap: 8 }}
            >
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-dim)' }}>{label}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-ink)' }}>{value}</span>
                <CopyButton text={value} />
              </div>
            </div>
          ))}

          {/* Binary nibble view */}
          {hasValue && (
          <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--color-rule)' }}>
            <div style={{ ...S.label, marginBottom: 8 }}>Binary (nibble groups)</div>
            <code style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-ink)', wordBreak: 'break-word', lineHeight: 1.8 }}>
              {values.bin ? chunkBin(values.bin) : '—'}
            </code>
          </div>
          )}

          {/* Two's complement */}
          {hasValue && tc32 && (
            <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--color-rule)' }}>
              <div style={{ ...S.label, marginBottom: 8 }}>
                32-bit two's complement
                <span style={{ color: 'var(--color-dim)', marginLeft: 8, fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
                  ({unsigned32})
                </span>
              </div>
              <code style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--color-amber)', wordBreak: 'break-word', lineHeight: 1.8 }}>
                {tc32.match(/.{4}/g).join(' ')}
              </code>
            </div>
          )}

          {/* Quick reference */}
          {hasValue && (
            <div style={{ padding: '12px 14px' }}>
              <div style={{ ...S.label, marginBottom: 10 }}>All representations</div>
              {BASES.map(({ id, label, prefix }) => {
                const raw = values[id] || '';
                const display = `${prefix}${raw}`;
                return (
                  <div key={id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-dim)', width: 60 }}>{label}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, justifyContent: 'flex-end' }}>
                      <code style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-ink)' }}>{display}</code>
                      <CopyButton text={display} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
