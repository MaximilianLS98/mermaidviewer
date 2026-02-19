import { useMemo, useState } from 'react';
import CopyButton from '../../components/ui/CopyButton.jsx';

const AVAILABLE_FLAGS = ['g', 'i', 'm', 's'];

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function toggleFlag(flags, flag) {
  const next = new Set(flags.split(''));
  if (next.has(flag)) next.delete(flag);
  else next.add(flag);
  return AVAILABLE_FLAGS.filter((item) => next.has(item)).join('');
}

function collectMatches(pattern, flags, text) {
  if (!pattern.trim()) return { regex: null, matches: [], error: null };

  let regex;
  try {
    regex = new RegExp(pattern, flags);
  } catch (error) {
    return { regex: null, matches: [], error: error.message };
  }

  const matches = [];
  if (!flags.includes('g')) {
    const result = regex.exec(text);
    if (result) {
      matches.push({
        value: result[0],
        index: result.index,
        end: result.index + result[0].length,
        groups: result.slice(1),
      });
    }
    return { regex, matches, error: null };
  }

  let result = regex.exec(text);
  let safety = 0;
  while (result && safety < 5000) {
    matches.push({
      value: result[0],
      index: result.index,
      end: result.index + result[0].length,
      groups: result.slice(1),
    });

    if (result[0] === '') regex.lastIndex += 1;
    result = regex.exec(text);
    safety += 1;
  }

  return { regex, matches, error: null };
}

function highlightMatches(text, matches) {
  if (!matches.length) return escapeHtml(text);

  let cursor = 0;
  const chunks = [];
  matches.forEach((match, idx) => {
    if (match.index > cursor) {
      chunks.push(escapeHtml(text.slice(cursor, match.index)));
    }
    const color = idx % 2 === 0 ? 'rgba(0,212,255,0.2)' : 'rgba(255,184,77,0.2)';
    const safeMatch = escapeHtml(text.slice(match.index, match.end));
    chunks.push(`<mark style="background:${color};color:var(--color-ink);padding:0 1px;border-radius:2px;">${safeMatch || ' '}</mark>`);
    cursor = match.end;
  });
  if (cursor < text.length) {
    chunks.push(escapeHtml(text.slice(cursor)));
  }
  return chunks.join('');
}

export default function RegexTool() {
  const [pattern, setPattern] = useState('\\b\\w+@\\w+\\.\\w+\\b');
  const [flags, setFlags] = useState('gm');
  const [input, setInput] = useState(
    'Contact us at team@example.com.\nAlso notify ops@example.org when deploys fail.'
  );

  const { matches, error } = useMemo(
    () => collectMatches(pattern, flags, input),
    [pattern, flags, input]
  );

  const highlighted = useMemo(() => highlightMatches(input, matches), [input, matches]);
  const matchesJson = useMemo(
    () =>
      JSON.stringify(
        matches.map((match, index) => ({
          match: index + 1,
          value: match.value,
          index: match.index,
          end: match.end,
          groups: match.groups,
        })),
        null,
        2
      ),
    [matches]
  );

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
    textArea: {
      flex: 1,
      width: '100%',
      padding: '14px 16px',
      background: 'var(--color-base)',
      color: 'var(--color-ink)',
      border: 'none',
      resize: 'none',
      fontFamily: 'var(--font-mono)',
      fontSize: 12.5,
      lineHeight: 1.7,
      outline: 'none',
      overflowY: 'auto',
      caretColor: 'var(--color-accent)',
    },
  };

  return (
    <div className="flex h-full overflow-hidden" style={{ background: 'var(--color-base)' }}>
      <div style={{ flex: '0 0 50%', display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--color-rule)' }}>
        <div style={S.panelHead}>
          <span style={S.label}>Pattern + Input</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: error ? 'var(--color-danger)' : 'var(--color-muted)' }}>
            {error || `${matches.length} matches`}
          </span>
        </div>
        <div style={{ borderBottom: '1px solid var(--color-rule)', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 10, background: 'var(--color-surface)' }}>
          <input
            value={pattern}
            onChange={(event) => setPattern(event.target.value)}
            spellCheck={false}
            placeholder="Regex pattern..."
            style={{
              width: '100%',
              background: 'var(--color-elevated)',
              color: 'var(--color-ink)',
              border: '1px solid var(--color-wire)',
              borderRadius: 4,
              fontFamily: 'var(--font-mono)',
              fontSize: 12.5,
              padding: '8px 10px',
              outline: 'none',
            }}
          />
          <div style={{ display: 'flex', gap: 6 }}>
            {AVAILABLE_FLAGS.map((flag) => {
              const active = flags.includes(flag);
              return (
                <button
                  key={flag}
                  onClick={() => setFlags((current) => toggleFlag(current, flag))}
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    cursor: 'pointer',
                    borderRadius: 4,
                    padding: '4px 9px',
                    border: `1px solid ${active ? 'rgba(0,212,255,0.35)' : 'var(--color-wire)'}`,
                    color: active ? 'var(--color-accent)' : 'var(--color-dim)',
                    background: active ? 'rgba(0,212,255,0.1)' : 'transparent',
                  }}
                >
                  {flag}
                </button>
              );
            })}
          </div>
        </div>
        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          spellCheck={false}
          placeholder="Paste test text here..."
          style={S.textArea}
        />
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={S.panelHead}>
          <span style={S.label}>Matches</span>
          <CopyButton text={matchesJson} />
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {matches.length === 0 && !error && (
            <div style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
              No matches found.
            </div>
          )}
          {matches.map((match, index) => (
            <div key={`${match.index}-${index}`} style={{ border: '1px solid var(--color-rule)', borderRadius: 6, background: 'var(--color-surface)', overflow: 'hidden' }}>
              <div style={{ padding: '6px 10px', borderBottom: '1px solid var(--color-rule)', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-accent)' }}>Match {index + 1}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-dim)' }}>
                  [{match.index}, {match.end})
                </span>
              </div>
              <div style={{ padding: '8px 10px', fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1.6, color: 'var(--color-ink)' }}>
                {match.value || '(empty match)'}
                {match.groups.length > 0 && (
                  <div style={{ marginTop: 6, color: 'var(--color-dim)', fontSize: 11 }}>
                    Groups: {match.groups.map((group, groupIndex) => `[${groupIndex + 1}] ${group ?? 'null'}`).join(' | ')}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        <div style={{ borderTop: '1px solid var(--color-rule)', background: 'var(--color-surface)', padding: '10px 14px', maxHeight: '40%', overflowY: 'auto' }}>
          <div style={{ ...S.label, marginBottom: 8 }}>Highlighted Input</div>
          <pre
            style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1.75, color: 'var(--color-ink)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
            dangerouslySetInnerHTML={{ __html: highlighted }}
          />
        </div>
      </div>
    </div>
  );
}
