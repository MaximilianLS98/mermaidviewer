import { useState, useEffect, useRef } from 'react';
import CopyButton from '../../components/ui/CopyButton.jsx';

const B64_CHARS = /^[A-Za-z0-9+/=\-_]+$/;
const B64_URL_CHARS = /^[A-Za-z0-9\-_]+$/;

function looksLikeBase64(str) {
  if (!str || str.length === 0) return false;
  const s = str.trim();
  // Standard base64
  if (B64_CHARS.test(s) && s.length % 4 === 0) return true;
  // URL-safe (no padding)
  if (B64_URL_CHARS.test(s)) return true;
  return false;
}

function encode(text, urlSafe) {
  let b = btoa(unescape(encodeURIComponent(text)));
  if (urlSafe) b = b.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  return b;
}

function decode(b64, urlSafe) {
  let s = b64.trim();
  if (urlSafe) s = s.replace(/-/g, '+').replace(/_/g, '/');
  // Add padding
  while (s.length % 4) s += '=';
  return decodeURIComponent(escape(atob(s)));
}

export default function Base64Tool() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [urlSafe, setUrlSafe] = useState(false);
  const [mode, setMode] = useState('encode'); // 'encode' | 'decode'
  const [error, setError] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => process(input), 150);
    return () => clearTimeout(timerRef.current);
  }, [input, urlSafe]);

  function process(text) {
    const trimmed = text.trim();
    if (!trimmed) { setOutput(''); setError(null); return; }

    const shouldDecode = looksLikeBase64(trimmed);
    setMode(shouldDecode ? 'decode' : 'encode');

    if (shouldDecode) {
      try {
        setOutput(decode(trimmed, urlSafe));
        setError(null);
      } catch (_) {
        setOutput('');
        setError('Invalid Base64 input');
      }
    } else {
      try {
        setOutput(encode(trimmed, urlSafe));
        setError(null);
      } catch (_) {
        setOutput('');
        setError('Encoding failed');
      }
    }
  }

  const S = {
    panelHead: { height: 38, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 14px', borderBottom: '1px solid var(--color-rule)', background: 'var(--color-surface)', flexShrink: 0 },
    label: { fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', color: 'var(--color-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-display)' },
    textArea: { flex: 1, width: '100%', padding: '14px 16px', background: 'var(--color-base)', color: 'var(--color-ink)', border: 'none', resize: 'none', fontFamily: 'var(--font-mono)', fontSize: 12.5, lineHeight: 1.75, outline: 'none', overflowY: 'auto', caretColor: 'var(--color-accent)' },
  };

  const modeLabel = mode === 'encode' ? 'ENCODING →' : '← DECODING';
  const modeColor = mode === 'encode' ? 'var(--color-accent)' : 'var(--color-amber)';

  return (
    <div className="flex h-full overflow-hidden" style={{ background: 'var(--color-base)' }}>

      {/* Input */}
      <div style={{ flex: '0 0 50%', display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--color-rule)' }}>
        <div style={S.panelHead}>
          <span style={S.label}>INPUT</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={() => setInput('Hello, World! This is a Base64 example.')}
              style={{ fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', padding: '3px 9px', borderRadius: 3, cursor: 'pointer', border: '1px solid var(--color-wire)', background: 'transparent', color: 'var(--color-dim)' }}
            >
              EXAMPLE
            </button>
            <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', fontSize: 10, color: 'var(--color-dim)', fontFamily: 'var(--font-mono)' }}>
              <input
                type="checkbox"
                checked={urlSafe}
                onChange={e => setUrlSafe(e.target.checked)}
                style={{ accentColor: 'var(--color-accent)' }}
              />
              URL-safe
            </label>
            <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 600, color: modeColor }}>
              {input.trim() ? modeLabel : ''}
            </span>
          </div>
        </div>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type text to encode, or paste Base64 to decode..."
          spellCheck={false}
          style={S.textArea}
        />
        <div style={{ height: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 14px', borderTop: '1px solid var(--color-rule)', background: 'var(--color-surface)', flexShrink: 0 }}>
          <span style={{ fontSize: 11, color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>
            {input.length} chars
          </span>
          {error && <span style={{ fontSize: 11, color: 'var(--color-danger)', fontFamily: 'var(--font-mono)' }}>⚠ {error}</span>}
        </div>
      </div>

      {/* Output */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={S.panelHead}>
          <span style={S.label}>OUTPUT</span>
          <CopyButton text={output} />
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px' }}>
          {output ? (
            <pre style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: 12.5, lineHeight: 1.75, color: 'var(--color-ink)', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
              {output}
            </pre>
          ) : (
            <div style={{ color: 'var(--color-muted)', fontSize: 12, fontFamily: 'var(--font-mono)', paddingTop: 8 }}>
              Output will appear here
            </div>
          )}
        </div>
        <div style={{ height: 28, display: 'flex', alignItems: 'center', padding: '0 14px', borderTop: '1px solid var(--color-rule)', background: 'var(--color-surface)', flexShrink: 0 }}>
          <span style={{ fontSize: 11, color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>
            {output.length} chars
          </span>
        </div>
      </div>
    </div>
  );
}
