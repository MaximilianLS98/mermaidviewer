import { useState } from 'react';
import CopyButton from '../../components/ui/CopyButton.jsx';

function b64urlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  try { return JSON.parse(atob(str)); } catch (_) { return null; }
}

function fmtTimestamp(ts) {
  return new Date(ts * 1000).toLocaleString();
}

function ExpiryBadge({ exp }) {
  if (!exp) return <span style={{ fontSize: 11, color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>NO EXPIRY</span>;
  const now = Math.floor(Date.now() / 1000);
  const diff = exp - now;
  if (diff < 0) {
    return <span style={{ fontSize: 11, color: 'var(--color-danger)', background: 'rgba(255,77,106,0.1)', padding: '2px 8px', borderRadius: 3, fontFamily: 'var(--font-mono)', fontWeight: 600 }}>EXPIRED</span>;
  }
  const d = Math.floor(diff / 86400);
  const h = Math.floor((diff % 86400) / 3600);
  return (
    <span style={{ fontSize: 11, color: 'var(--color-ok)', background: 'rgba(52,212,122,0.1)', padding: '2px 8px', borderRadius: 3, fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
      VALID · expires in {d}d {h}h
    </span>
  );
}

function JsonCard({ title, data, extra }) {
  const str = JSON.stringify(data, null, 2);
  return (
    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-rule)', borderRadius: 6, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 14px', borderBottom: '1px solid var(--color-rule)' }}>
        <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', color: 'var(--color-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-display)' }}>
          {title}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {extra}
          <CopyButton text={str} />
        </div>
      </div>
      <pre style={{ margin: 0, padding: '12px 14px', fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1.7, color: 'var(--color-ink)', overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
        {formatPayload(data)}
      </pre>
    </div>
  );
}

function formatPayload(data) {
  if (!data) return '';
  const TIMESTAMP_KEYS = new Set(['iat', 'exp', 'nbf']);
  const lines = JSON.stringify(data, null, 2).split('\n');
  return lines.map(line => {
    // Check if this line contains a timestamp key
    const m = line.match(/^\s*"(\w+)":\s*(\d+)/);
    if (m && TIMESTAMP_KEYS.has(m[1])) {
      return line + `  // ${fmtTimestamp(Number(m[2]))}`;
    }
    return line;
  }).join('\n');
}

export default function JwtTool() {
  const [input, setInput] = useState('');

  const trimmed = input.trim();
  const parts = trimmed.split('.');
  const isValid = parts.length === 3;

  let header = null, payload = null, signature = null, parseError = null;
  if (trimmed) {
    if (!isValid) {
      parseError = 'Invalid JWT: expected 3 dot-separated parts';
    } else {
      header = b64urlDecode(parts[0]);
      payload = b64urlDecode(parts[1]);
      signature = parts[2];
      if (!header || !payload) parseError = 'Failed to decode JWT parts';
    }
  }

  const S = {
    label: { fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', color: 'var(--color-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-display)' },
  };

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: 'var(--color-base)' }}>

      {/* Input */}
      <div style={{ flexShrink: 0, borderBottom: '1px solid var(--color-rule)', background: 'var(--color-surface)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 14px', height: 38, borderBottom: '1px solid var(--color-rule)' }}>
          <span style={S.label}>JWT INPUT</span>
          {trimmed && !parseError && (
            <span style={{ fontSize: 11, color: 'var(--color-ok)', fontFamily: 'var(--font-mono)' }}>✓ Decoded</span>
          )}
          {parseError && (
            <span style={{ fontSize: 11, color: 'var(--color-danger)', fontFamily: 'var(--font-mono)' }}>⚠ {parseError}</span>
          )}
        </div>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Paste a JWT token here..."
          spellCheck={false}
          rows={3}
          style={{
            width: '100%', padding: '12px 14px', background: 'transparent', color: 'var(--color-ink)',
            border: 'none', resize: 'none', fontFamily: 'var(--font-mono)', fontSize: 12.5,
            lineHeight: 1.6, outline: 'none', caretColor: 'var(--color-accent)',
          }}
        />
      </div>

      {/* Cards */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {!trimmed && (
          <div style={{ color: 'var(--color-muted)', fontSize: 13, fontFamily: 'var(--font-mono)', textAlign: 'center', paddingTop: 40 }}>
            Paste a JWT token above to decode it
          </div>
        )}

        {header && <JsonCard title="Header" data={header} />}

        {payload && (
          <JsonCard
            title="Payload"
            data={payload}
            extra={<ExpiryBadge exp={payload.exp} />}
          />
        )}

        {signature && (
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-rule)', borderRadius: 6, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 14px', borderBottom: '1px solid var(--color-rule)' }}>
              <span style={S.label}>Signature</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 10, color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>
                  Verification requires secret
                </span>
                <CopyButton text={signature} />
              </div>
            </div>
            <div style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1.6, color: 'var(--color-dim)', wordBreak: 'break-all' }}>
              {signature}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
