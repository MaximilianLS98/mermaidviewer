import { useState, useCallback } from 'react';
import CopyButton from '../../components/ui/CopyButton.jsx';

function parseUrl(urlString) {
  try {
    const url = new URL(urlString);
    const params = [];
    url.searchParams.forEach((value, key) => params.push({ key, value }));
    return {
      protocol: url.protocol.replace(':', ''),
      host: url.hostname,
      port: url.port,
      path: url.pathname,
      params,
      fragment: url.hash.slice(1),
      error: null,
    };
  } catch (e) {
    return { protocol: 'https', host: '', port: '', path: '/', params: [], fragment: '', error: e.message };
  }
}

function buildUrl({ protocol, host, port, path, params, fragment }) {
  try {
    if (!host) return '';
    const base = `${protocol || 'https'}://${host}${port ? ':' + port : ''}${path || '/'}`;
    const url = new URL(base);
    params.filter(p => p.key).forEach(p => url.searchParams.append(p.key, p.value));
    if (fragment) url.hash = fragment;
    return url.toString();
  } catch {
    return '';
  }
}

const EXAMPLE_URL = 'https://api.example.com:8080/v2/users?page=1&limit=20&filter=active#results';
const EMPTY_FIELDS = { protocol: 'https', host: '', port: '', path: '/', params: [], fragment: '', error: null };

export default function UrlTool() {
  const [raw, setRaw] = useState('');
  const [fields, setFields] = useState(EMPTY_FIELDS);

  const updateRaw = useCallback((value) => {
    setRaw(value);
    setFields(parseUrl(value));
  }, []);

  const applyFields = useCallback((next) => {
    setFields(next);
    const built = buildUrl(next);
    if (built) setRaw(built);
  }, []);

  function updateField(key, value) {
    applyFields({ ...fields, [key]: value });
  }

  function addParam() {
    applyFields({ ...fields, params: [...fields.params, { key: '', value: '' }] });
  }

  function updateParam(index, key, value) {
    const params = fields.params.map((p, i) => i === index ? { ...p, [key]: value } : p);
    applyFields({ ...fields, params });
  }

  function removeParam(index) {
    applyFields({ ...fields, params: fields.params.filter((_, i) => i !== index) });
  }

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
      background: 'var(--color-elevated)',
      color: 'var(--color-ink)',
      border: '1px solid var(--color-wire)',
      borderRadius: 4,
      fontFamily: 'var(--font-mono)',
      fontSize: 12,
      padding: '7px 10px',
      outline: 'none',
    },
    fieldLabel: {
      fontSize: 10,
      fontWeight: 600,
      letterSpacing: '0.1em',
      color: 'var(--color-muted)',
      textTransform: 'uppercase',
      fontFamily: 'var(--font-display)',
      width: 72,
      flexShrink: 0,
    },
    smallBtn: {
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

  const FIELDS = [
    { key: 'protocol', label: 'Protocol', placeholder: 'https' },
    { key: 'host',     label: 'Host',     placeholder: 'example.com' },
    { key: 'port',     label: 'Port',     placeholder: '8080' },
    { key: 'path',     label: 'Path',     placeholder: '/api/v1' },
    { key: 'fragment', label: 'Fragment', placeholder: 'section' },
  ];

  return (
    <div className="flex h-full overflow-hidden" style={{ background: 'var(--color-base)' }}>
      {/* Left: URL input + fields */}
      <div style={{ flex: '0 0 50%', display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--color-rule)', overflow: 'hidden' }}>
        <div style={S.panelHead}>
          <span style={S.label}>Full URL</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button style={S.smallBtn} onClick={() => updateRaw(EXAMPLE_URL)}>EXAMPLE</button>
            <CopyButton text={raw} />
          </div>
        </div>

        <div style={{ padding: 14, borderBottom: '1px solid var(--color-rule)' }}>
          <textarea
            value={raw}
            onChange={e => updateRaw(e.target.value)}
            spellCheck={false}
            rows={3}
            style={{ ...S.input, width: '100%', resize: 'none', lineHeight: 1.6 }}
            placeholder="Paste a URL to decompose…"
          />
          {fields.error && (
            <div style={{ marginTop: 6, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-danger)' }}>
              {fields.error}
            </div>
          )}
        </div>

        <div style={{ padding: '12px 14px', overflowY: 'auto', flex: 1 }}>
          <div style={{ ...S.label, marginBottom: 10 }}>Components</div>
          {FIELDS.map(({ key, label, placeholder }) => (
            <div key={key} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
              <span style={S.fieldLabel}>{label}</span>
              <input
                value={fields[key] || ''}
                onChange={e => updateField(key, e.target.value)}
                placeholder={placeholder}
                spellCheck={false}
                style={{ ...S.input, flex: 1 }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Right: Query params */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={S.panelHead}>
          <span style={S.label}>
            Query Parameters
            {fields.params.length > 0 && (
              <span style={{ color: 'var(--color-accent)', marginLeft: 8 }}>
                {fields.params.length}
              </span>
            )}
          </span>
          <button onClick={addParam} style={S.smallBtn}>+ ADD</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
          {fields.params.length === 0 && (
            <div style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
              No query parameters found.
            </div>
          )}
          {fields.params.map((param, i) => (
            <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 8, alignItems: 'center' }}>
              <input
                value={param.key}
                onChange={e => updateParam(i, 'key', e.target.value)}
                placeholder="key"
                spellCheck={false}
                style={{ ...S.input, flex: '0 0 38%' }}
              />
              <span style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)', fontSize: 13, flexShrink: 0 }}>=</span>
              <input
                value={param.value}
                onChange={e => updateParam(i, 'value', e.target.value)}
                placeholder="value"
                spellCheck={false}
                style={{ ...S.input, flex: 1 }}
              />
              <button
                onClick={() => removeParam(i)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-muted)', fontFamily: 'var(--font-mono)', fontSize: 16, padding: '0 4px', lineHeight: 1, flexShrink: 0 }}
              >
                ×
              </button>
            </div>
          ))}
        </div>

        {/* Encoded query string preview */}
        {fields.params.some(p => p.key) && (
          <div style={{ borderTop: '1px solid var(--color-rule)', padding: '10px 14px', background: 'var(--color-surface)' }}>
            <div style={{ ...S.label, marginBottom: 6 }}>Encoded Query String</div>
            <pre style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-dim)', whiteSpace: 'pre-wrap', wordBreak: 'break-all', lineHeight: 1.6 }}>
              {(() => {
                try {
                  const p = new URLSearchParams(fields.params.filter(x => x.key).map(x => [x.key, x.value]));
                  return '?' + p.toString();
                } catch {
                  return '';
                }
              })()}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
