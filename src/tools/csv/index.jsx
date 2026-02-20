import { useState, useMemo } from 'react';
import CopyButton from '../../components/ui/CopyButton.jsx';

const DEFAULT_CSV = `name,age,city,role
Alice,31,New York,Engineer
Bob,25,London,Designer
Carol,28,Berlin,Manager
Dave,34,Tokyo,Engineer
Eve,22,Sydney,Intern`;

// ── CSV parser (handles quoted fields, escaped quotes) ────────────────────
function detectDelimiter(text) {
  const line = text.split('\n')[0] || '';
  const tabs   = (line.match(/\t/g) || []).length;
  const commas = (line.match(/,/g)  || []).length;
  const semis  = (line.match(/;/g)  || []).length;
  if (tabs > commas && tabs > semis) return '\t';
  if (semis > commas) return ';';
  return ',';
}

function parseCsv(text, delim) {
  if (!text.trim()) return [];
  const rows = [];
  let row = [];
  let cell = '';
  let inQuote = false;

  for (let i = 0; i <= text.length; i++) {
    const ch = i < text.length ? text[i] : '\n'; // sentinel newline at end
    if (inQuote) {
      if (ch === '"') {
        if (text[i + 1] === '"') { cell += '"'; i++; } // escaped quote
        else inQuote = false;
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      inQuote = true;
    } else if (ch === delim) {
      row.push(cell);
      cell = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(cell);
      cell = '';
      if (row.some(c => c !== '')) rows.push(row);
      row = [];
    } else {
      cell += ch;
    }
  }
  return rows;
}

export default function CsvTool() {
  const [input, setInput] = useState('');
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState('asc'); // 'asc' | 'desc'
  const [copied, setCopied] = useState(null); // { row, col } or { col: 'col', colIndex }

  const { headers, dataRows, delimiter, error } = useMemo(() => {
    try {
      const delim = detectDelimiter(input);
      const rows = parseCsv(input, delim);
      if (rows.length === 0) return { headers: [], dataRows: [], delimiter: delim, error: null };
      const [headerRow, ...rest] = rows;
      return { headers: headerRow, dataRows: rest, delimiter: delim, error: null };
    } catch (e) {
      return { headers: [], dataRows: [], delimiter: ',', error: e.message };
    }
  }, [input]);

  const sortedRows = useMemo(() => {
    if (sortCol === null) return dataRows;
    const col = sortCol;
    return [...dataRows].sort((a, b) => {
      const av = a[col] ?? '';
      const bv = b[col] ?? '';
      const numA = Number(av), numB = Number(bv);
      const bothNum = !isNaN(numA) && !isNaN(numB) && av !== '' && bv !== '';
      const cmp = bothNum ? numA - numB : av.localeCompare(bv);
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [dataRows, sortCol, sortDir]);

  function handleSort(colIndex) {
    if (sortCol === colIndex) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortCol(colIndex);
      setSortDir('asc');
    }
  }

  function copyCell(row, col, value) {
    navigator.clipboard.writeText(value).catch(() => {});
    setCopied({ row, col });
    setTimeout(() => setCopied(null), 1200);
  }

  function copyColumn(colIndex) {
    const values = sortedRows.map(r => r[colIndex] ?? '').join('\n');
    navigator.clipboard.writeText(values).catch(() => {});
    setCopied({ col: 'col', colIndex });
    setTimeout(() => setCopied(null), 1200);
  }

  const isCopied = (row, col) => copied?.row === row && copied?.col === col;
  const isColCopied = (colIndex) => copied?.col === 'col' && copied?.colIndex === colIndex;

  const delimLabel = { ',': 'CSV', '\t': 'TSV', ';': 'CSV (semicolon)' }[delimiter] || 'CSV';

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
    th: {
      padding: '8px 12px',
      textAlign: 'left',
      fontFamily: 'var(--font-display)',
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      color: 'var(--color-accent)',
      background: 'var(--color-surface)',
      borderBottom: '1px solid var(--color-rule)',
      borderRight: '1px solid var(--color-rule)',
      whiteSpace: 'nowrap',
      userSelect: 'none',
      cursor: 'pointer',
    },
    td: {
      padding: '7px 12px',
      fontFamily: 'var(--font-mono)',
      fontSize: 12,
      color: 'var(--color-ink)',
      borderBottom: '1px solid var(--color-rule)',
      borderRight: '1px solid var(--color-rule)',
      whiteSpace: 'nowrap',
      maxWidth: 220,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      cursor: 'pointer',
    },
  };

  return (
    <div className="flex h-full overflow-hidden" style={{ background: 'var(--color-base)' }}>
      {/* Left: input */}
      <div style={{ flex: '0 0 38%', display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--color-rule)' }}>
        <div style={S.panelHead}>
          <span style={S.label}>
            Input ({delimLabel})
            {(dataRows.length > 0) && (
              <span style={{ color: 'var(--color-dim)', marginLeft: 8, fontWeight: 400 }}>
                {dataRows.length} rows · {headers.length} cols
              </span>
            )}
          </span>
          <button
            onClick={() => { setInput(DEFAULT_CSV); setSortCol(null); }}
            style={{
              fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 600, letterSpacing: '0.1em',
              padding: '3px 9px', borderRadius: 3, cursor: 'pointer',
              border: '1px solid var(--color-wire)', background: 'transparent', color: 'var(--color-dim)',
            }}
          >
            EXAMPLE
          </button>
        </div>
        <textarea
          value={input}
          onChange={e => { setInput(e.target.value); setSortCol(null); }}
          spellCheck={false}
          placeholder="Paste CSV or TSV data here…"
          style={{
            flex: 1,
            padding: '14px 16px',
            background: 'var(--color-base)',
            color: 'var(--color-ink)',
            border: 'none',
            resize: 'none',
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            lineHeight: 1.7,
            outline: 'none',
            caretColor: 'var(--color-accent)',
          }}
        />
        {error && (
          <div style={{ padding: '8px 14px', color: 'var(--color-danger)', fontFamily: 'var(--font-mono)', fontSize: 11, borderTop: '1px solid var(--color-rule)' }}>
            {error}
          </div>
        )}
      </div>

      {/* Right: table */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={S.panelHead}>
          <span style={S.label}>
            Table
            <span style={{ color: 'var(--color-dim)', marginLeft: 8, fontWeight: 400 }}>
              {sortCol !== null ? `sorted by col ${sortCol + 1} ${sortDir === 'asc' ? '↑' : '↓'}` : 'click header to sort · click cell to copy'}
            </span>
          </span>
          <CopyButton text={input} />
        </div>

        <div style={{ flex: 1, overflow: 'auto' }}>
          {headers.length === 0 ? (
            <div style={{ padding: 14, color: 'var(--color-muted)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
              Paste CSV or TSV data on the left to render the table.
            </div>
          ) : (
            <table style={{ borderCollapse: 'collapse', minWidth: '100%' }}>
              <thead>
                <tr>
                  {/* Row number header */}
                  <th
                    style={{ ...S.th, color: 'var(--color-muted)', width: 40, textAlign: 'center', cursor: 'default' }}
                  >
                    #
                  </th>
                  {headers.map((h, i) => (
                    <th
                      key={i}
                      style={{
                        ...S.th,
                        color: sortCol === i ? 'var(--color-accent)' : 'var(--color-dim)',
                        background: sortCol === i ? 'var(--color-elevated)' : 'var(--color-surface)',
                      }}
                      onClick={() => handleSort(i)}
                      title={`Sort by ${h || `column ${i + 1}`} — click again to copy column`}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span
                          onClick={e => { e.stopPropagation(); copyColumn(i); }}
                          title="Copy column"
                          style={{
                            color: isColCopied(i) ? 'var(--color-ok)' : 'var(--color-muted)',
                            fontSize: 9,
                            marginRight: 2,
                            cursor: 'pointer',
                          }}
                        >
                          {isColCopied(i) ? '✓' : '⎘'}
                        </span>
                        {h || <span style={{ color: 'var(--color-muted)', fontStyle: 'italic' }}>col {i + 1}</span>}
                        {sortCol === i && (
                          <span style={{ fontSize: 10, color: 'var(--color-accent)' }}>
                            {sortDir === 'asc' ? ' ↑' : ' ↓'}
                          </span>
                        )}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedRows.map((row, ri) => (
                  <tr
                    key={ri}
                    style={{ background: ri % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.018)' }}
                  >
                    <td style={{ ...S.td, color: 'var(--color-muted)', textAlign: 'center', fontSize: 10, width: 40 }}>
                      {ri + 1}
                    </td>
                    {headers.map((_, ci) => {
                      const cell = row[ci] ?? '';
                      const wasCopied = isCopied(ri, ci);
                      return (
                        <td
                          key={ci}
                          style={{
                            ...S.td,
                            background: wasCopied ? 'rgba(52,212,122,0.08)' : undefined,
                            color: wasCopied ? 'var(--color-ok)' : 'var(--color-ink)',
                          }}
                          onClick={() => copyCell(ri, ci, cell)}
                          title={cell}
                        >
                          {wasCopied ? '✓ copied' : (cell || <span style={{ color: 'var(--color-muted)', fontStyle: 'italic' }}>null</span>)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
