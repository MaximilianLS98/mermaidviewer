import { useState, useMemo } from 'react';
import CopyButton from '../../components/ui/CopyButton.jsx';

const TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Berlin',
  'Europe/Moscow',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Australia/Sydney',
];

function relativeTime(ms) {
  const diff = ms - Date.now();
  const abs = Math.abs(diff);
  const past = diff < 0;
  if (abs < 1000) return 'just now';
  const units = [
    [60_000, 'second', 1000],
    [3_600_000, 'minute', 60_000],
    [86_400_000, 'hour', 3_600_000],
    [7 * 86_400_000, 'day', 86_400_000],
    [30 * 86_400_000, 'week', 7 * 86_400_000],
    [365 * 86_400_000, 'month', 30 * 86_400_000],
    [Infinity, 'year', 365 * 86_400_000],
  ];
  for (const [limit, unit, div] of units) {
    if (abs < limit) {
      const n = Math.round(abs / div);
      return past
        ? `${n} ${unit}${n !== 1 ? 's' : ''} ago`
        : `in ${n} ${unit}${n !== 1 ? 's' : ''}`;
    }
  }
}

function parseInput(value) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const num = Number(trimmed);
  if (!isNaN(num) && trimmed !== '') {
    const ms = num > 1e12 ? num : num * 1000;
    const d = new Date(ms);
    return isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(trimmed);
  return isNaN(d.getTime()) ? null : d;
}

export default function TimestampTool() {
  const [input, setInput] = useState('');

  const date = useMemo(() => parseInput(input), [input]);
  const ms = date?.getTime() ?? null;
  const seconds = ms !== null ? Math.floor(ms / 1000) : null;

  const representations = useMemo(() => {
    if (!date) return [];
    return [
      { label: 'Unix (seconds)', value: String(seconds) },
      { label: 'Unix (milliseconds)', value: String(ms) },
      { label: 'ISO 8601', value: date.toISOString() },
      { label: 'RFC 2822', value: date.toUTCString() },
      { label: 'Relative', value: relativeTime(ms) },
    ];
  }, [date, ms, seconds]);

  const tzRows = useMemo(() => {
    if (!date) return [];
    return TIMEZONES.map(tz => ({
      tz,
      formatted: date.toLocaleString('en-US', {
        timeZone: tz,
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZoneName: 'short',
      }),
    }));
  }, [date]);

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

  return (
    <div className="flex h-full overflow-hidden" style={{ background: 'var(--color-base)' }}>
      {/* Left panel */}
      <div style={{ flex: '0 0 50%', display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--color-rule)', overflow: 'hidden' }}>
        <div style={S.panelHead}>
          <span style={S.label}>Input</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button style={S.smallBtn} onClick={() => setInput('1700000000')}>EXAMPLE</button>
            <button style={S.smallBtn} onClick={() => setInput(String(Math.floor(Date.now() / 1000)))}>NOW</button>
          </div>
        </div>

        <div style={{ padding: 14, borderBottom: '1px solid var(--color-rule)' }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            spellCheck={false}
            placeholder="Unix timestamp (s or ms) or ISO date…"
            style={{
              width: '100%',
              background: 'var(--color-elevated)',
              color: 'var(--color-ink)',
              border: '1px solid var(--color-wire)',
              borderRadius: 4,
              fontFamily: 'var(--font-mono)',
              fontSize: 13,
              padding: '9px 10px',
              outline: 'none',
            }}
          />
          {input && !date && (
            <div style={{ marginTop: 6, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-danger)' }}>
              Cannot parse — try a Unix timestamp or ISO 8601 date string.
            </div>
          )}
          {date && (
            <div style={{ marginTop: 8, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-dim)' }}>
              Detected: {ms > 1e12 ? 'milliseconds' : 'seconds'} timestamp
            </div>
          )}
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {!date && (
            <div style={{ padding: 14, color: 'var(--color-muted)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
              Enter a Unix timestamp or a date string to convert.
            </div>
          )}
          {date && representations.map(({ label, value }) => (
            <div
              key={label}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 14px',
                borderBottom: '1px solid var(--color-rule)',
                gap: 8,
              }}
            >
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-dim)', flexShrink: 0 }}>
                {label}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-ink)', wordBreak: 'break-all' }}>
                  {value}
                </span>
                <CopyButton text={value} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel: timezones */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={S.panelHead}>
          <span style={S.label}>Timezone Conversions</span>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {!date && (
            <div style={{ padding: 14, color: 'var(--color-muted)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
              Enter a valid timestamp to see timezone conversions.
            </div>
          )}
          {tzRows.map(({ tz, formatted }) => (
            <div
              key={tz}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 14px',
                borderBottom: '1px solid var(--color-rule)',
                gap: 8,
              }}
            >
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-accent)', flexShrink: 0, minWidth: 170 }}>
                {tz}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-ink)' }}>
                  {formatted}
                </span>
                <CopyButton text={formatted} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
