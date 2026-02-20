import { useState, useEffect, useRef } from 'react';
import CopyButton from '../../components/ui/CopyButton.jsx';

function highlightJson(str) {
  return str
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
      (match) => {
        let cls = '#79c0ff'; // number
        if (/^"/.test(match)) {
          cls = /:$/.test(match) ? '#7ee787' : '#a5d6ff'; // key : string
        } else if (/true|false/.test(match)) {
          cls = '#ffb84d';
        } else if (/null/.test(match)) {
          cls = '#ffb84d';
        }
        return `<span style="color:${cls}">${match}</span>`;
      }
    );
}

function countDepth(obj, depth = 0) {
  if (typeof obj !== 'object' || obj === null) return depth;
  return Math.max(...Object.values(obj).map(v => countDepth(v, depth + 1)), depth);
}

function countKeys(obj) {
  if (typeof obj !== 'object' || obj === null) return 0;
  let count = Object.keys(obj).length;
  for (const v of Object.values(obj)) count += countKeys(v);
  return count;
}

export default function JsonTool() {
  const [input, setInput] = useState('');
  const [formatted, setFormatted] = useState('');
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const timerRef = useRef(null);

  function processJson(text, indent = 2) {
    const trimmed = text.trim();
    if (!trimmed) { setFormatted(''); setError(null); setStats(null); return; }
    try {
      const parsed = JSON.parse(trimmed);
      const out = JSON.stringify(parsed, null, indent);
      setFormatted(out);
      setError(null);
      setStats({
        keys: countKeys(parsed),
        depth: countDepth(parsed),
        size: new Blob([trimmed]).size,
      });
    } catch (e) {
      setFormatted('');
      setError(e.message);
      setStats(null);
    }
  }

  useEffect(() => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => processJson(input), 300);
    return () => clearTimeout(timerRef.current);
  }, [input]);

  function minify() {
    const trimmed = input.trim();
    if (!trimmed) return;
    try {
      setFormatted(JSON.stringify(JSON.parse(trimmed)));
    } catch (_) {}
  }

  const S = {
    label: { fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', color: 'var(--color-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-display)' },
    panelHead: { height: 38, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 14px', borderBottom: '1px solid var(--color-rule)', background: 'var(--color-surface)', flexShrink: 0 },
    textArea: { flex: 1, width: '100%', padding: '14px 16px', background: 'var(--color-base)', color: 'var(--color-ink)', border: 'none', resize: 'none', fontFamily: 'var(--font-mono)', fontSize: 12.5, lineHeight: 1.75, outline: 'none', overflowY: 'auto', caretColor: 'var(--color-accent)' },
  };

  return (
    <div className="flex h-full overflow-hidden" style={{ background: 'var(--color-base)' }}>

      {/* Input panel */}
      <div style={{ flex: '0 0 50%', display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--color-rule)' }}>
        <div style={S.panelHead}>
          <span style={S.label}>INPUT</span>
          <div style={{ display: 'flex', gap: 6 }}>
            <SmallBtn onClick={() => setInput('{"name":"Alice","age":31,"roles":["admin","user"],"active":true,"address":{"city":"Berlin","zip":"10115"}}')}>EXAMPLE</SmallBtn>
            <SmallBtn onClick={() => processJson(input, 2)}>FORMAT</SmallBtn>
            <SmallBtn onClick={minify}>MINIFY</SmallBtn>
            <SmallBtn onClick={() => { setInput(''); setFormatted(''); setError(null); setStats(null); }}>CLEAR</SmallBtn>
          </div>
        </div>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder='Paste JSON here...'
          spellCheck={false}
          style={S.textArea}
        />
        {/* Status bar */}
        <div style={{ height: 28, display: 'flex', alignItems: 'center', padding: '0 14px', borderTop: '1px solid var(--color-rule)', background: 'var(--color-surface)', flexShrink: 0, gap: 12 }}>
          {error ? (
            <span style={{ fontSize: 11, color: 'var(--color-danger)', fontFamily: 'var(--font-mono)' }}>⚠ {error.split('\n')[0].slice(0, 80)}</span>
          ) : input.trim() ? (
            <span style={{ fontSize: 11, color: 'var(--color-ok)', fontFamily: 'var(--font-mono)' }}>✓ Valid JSON</span>
          ) : (
            <span style={{ fontSize: 11, color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>Awaiting input</span>
          )}
        </div>
      </div>

      {/* Output panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={S.panelHead}>
          <span style={S.label}>FORMATTED</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {stats && (
              <span style={{ fontSize: 10, color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>
                {stats.keys} keys · depth {stats.depth} · {stats.size}B
              </span>
            )}
            <CopyButton text={formatted} />
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px' }}>
          {formatted ? (
            <pre
              style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: 12.5, lineHeight: 1.75, color: 'var(--color-ink)', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}
              dangerouslySetInnerHTML={{ __html: highlightJson(formatted) }}
            />
          ) : (
            <div style={{ color: 'var(--color-muted)', fontSize: 12, fontFamily: 'var(--font-mono)', paddingTop: 8 }}>
              Formatted output will appear here
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SmallBtn({ children, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 600, letterSpacing: '0.1em',
        padding: '3px 9px', borderRadius: 3, cursor: 'pointer', border: '1px solid',
        borderColor: hov ? 'var(--color-dim)' : 'var(--color-wire)',
        color: hov ? 'var(--color-ink)' : 'var(--color-dim)',
        background: hov ? 'var(--color-hover)' : 'transparent',
        transition: 'all 0.13s',
      }}
    >
      {children}
    </button>
  );
}
