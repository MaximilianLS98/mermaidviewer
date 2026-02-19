import { useMemo, useState } from 'react';
import CopyButton from '../../components/ui/CopyButton.jsx';

function splitLines(text) {
  return text.replace(/\r\n/g, '\n').split('\n');
}

function buildDiff(leftText, rightText) {
  const left = splitLines(leftText);
  const right = splitLines(rightText);
  const rows = [];
  const lcs = Array.from({ length: left.length + 1 }, () =>
    Array(right.length + 1).fill(0)
  );

  for (let i = left.length - 1; i >= 0; i -= 1) {
    for (let j = right.length - 1; j >= 0; j -= 1) {
      lcs[i][j] =
        left[i] === right[j]
          ? lcs[i + 1][j + 1] + 1
          : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }

  let i = 0;
  let j = 0;
  while (i < left.length && j < right.length) {
    if (left[i] === right[j]) {
      rows.push({ type: 'same', left: left[i], right: right[j], leftNo: i + 1, rightNo: j + 1 });
      i += 1;
      j += 1;
    } else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
      rows.push({ type: 'removed', left: left[i], right: '', leftNo: i + 1, rightNo: null });
      i += 1;
    } else {
      rows.push({ type: 'added', left: '', right: right[j], leftNo: null, rightNo: j + 1 });
      j += 1;
    }
  }

  while (i < left.length) {
    rows.push({ type: 'removed', left: left[i], right: '', leftNo: i + 1, rightNo: null });
    i += 1;
  }
  while (j < right.length) {
    rows.push({ type: 'added', left: '', right: right[j], leftNo: null, rightNo: j + 1 });
    j += 1;
  }

  const stats = rows.reduce(
    (acc, row) => {
      if (row.type === 'added') acc.added += 1;
      if (row.type === 'removed') acc.removed += 1;
      if (row.type === 'same') acc.unchanged += 1;
      return acc;
    },
    { added: 0, removed: 0, unchanged: 0 }
  );

  return { rows, stats };
}

function toUnifiedText(rows) {
  return rows
    .map((row) => {
      if (row.type === 'same') return `  ${row.left}`;
      if (row.type === 'added') return `+ ${row.right}`;
      return `- ${row.left}`;
    })
    .join('\n');
}

function rowStyle(type) {
  if (type === 'added') return { background: 'rgba(52,212,122,0.1)', color: 'var(--color-ink)' };
  if (type === 'removed') return { background: 'rgba(255,77,106,0.1)', color: 'var(--color-ink)' };
  return { background: 'transparent', color: 'var(--color-dim)' };
}

export default function DiffTool() {
  const [leftText, setLeftText] = useState(
    'host=api.internal\nretries=2\ntimeout=5000\nfeatureFlag=true'
  );
  const [rightText, setRightText] = useState(
    'host=api.internal\nretries=3\ntimeout=8000\nfeatureFlag=true\nlogLevel=debug'
  );
  const [viewMode, setViewMode] = useState('side');

  const { rows, stats } = useMemo(
    () => buildDiff(leftText, rightText),
    [leftText, rightText]
  );
  const unifiedText = useMemo(() => toUnifiedText(rows), [rows]);

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
      <div style={{ flex: '0 0 46%', display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--color-rule)' }}>
        <div style={S.panelHead}>
          <span style={S.label}>Left Input (Old)</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-dim)' }}>
            {splitLines(leftText).length} lines
          </span>
        </div>
        <textarea value={leftText} onChange={(event) => setLeftText(event.target.value)} spellCheck={false} style={S.textArea} />
        <div style={{ ...S.panelHead, borderTop: '1px solid var(--color-rule)', borderBottom: 'none' }}>
          <span style={S.label}>Right Input (New)</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-dim)' }}>
            {splitLines(rightText).length} lines
          </span>
        </div>
        <textarea value={rightText} onChange={(event) => setRightText(event.target.value)} spellCheck={false} style={S.textArea} />
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={S.panelHead}>
          <span style={S.label}>Diff Output</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-ok)' }}>+{stats.added}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-danger)' }}>-{stats.removed}</span>
            <button
              onClick={() => setViewMode((mode) => (mode === 'side' ? 'unified' : 'side'))}
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: '0.1em',
                padding: '3px 9px',
                borderRadius: 3,
                cursor: 'pointer',
                border: '1px solid var(--color-wire)',
                color: 'var(--color-dim)',
                background: 'transparent',
              }}
            >
              {viewMode === 'side' ? 'UNIFIED' : 'SIDE-BY-SIDE'}
            </button>
            <CopyButton text={unifiedText} />
          </div>
        </div>

        {viewMode === 'unified' ? (
          <pre style={{ margin: 0, padding: '14px 16px', overflow: 'auto', fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1.7 }}>
            {rows.map((row, index) => (
              <div key={index} style={rowStyle(row.type)}>
                {row.type === 'same' ? '  ' : row.type === 'added' ? '+ ' : '- '}
                {row.type === 'same' ? row.left : row.type === 'added' ? row.right : row.left}
              </div>
            ))}
          </pre>
        ) : (
          <div style={{ flex: 1, overflow: 'auto', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ position: 'sticky', top: 0, background: 'var(--color-surface)', zIndex: 1 }}>
                <tr>
                  <th style={thStyle}>L#</th>
                  <th style={thStyle}>Old</th>
                  <th style={thStyle}>R#</th>
                  <th style={thStyle}>New</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => {
                  const style = rowStyle(row.type);
                  return (
                    <tr key={index} style={{ ...style, borderBottom: '1px solid var(--color-rule)' }}>
                      <td style={lineNumberStyle}>{row.leftNo ?? ''}</td>
                      <td style={codeCellStyle}>{row.left}</td>
                      <td style={lineNumberStyle}>{row.rightNo ?? ''}</td>
                      <td style={codeCellStyle}>{row.right}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const thStyle = {
  textAlign: 'left',
  fontFamily: 'var(--font-display)',
  fontSize: 10,
  letterSpacing: '0.1em',
  color: 'var(--color-muted)',
  borderBottom: '1px solid var(--color-rule)',
  padding: '8px',
};

const lineNumberStyle = {
  width: 45,
  color: 'var(--color-muted)',
  padding: '6px 8px',
  borderRight: '1px solid var(--color-rule)',
  verticalAlign: 'top',
};

const codeCellStyle = {
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
  padding: '6px 8px',
  verticalAlign: 'top',
};
