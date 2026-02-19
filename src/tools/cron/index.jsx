import { useMemo, useState } from 'react';
import CopyButton from '../../components/ui/CopyButton.jsx';

const MONTH_NAMES = {
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  may: 5,
  jun: 6,
  jul: 7,
  aug: 8,
  sep: 9,
  oct: 10,
  nov: 11,
  dec: 12,
};

const DOW_NAMES = {
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
};

const CRON_PRESETS = [
  { id: 'every-minute', label: 'Every minute', expression: '* * * * *' },
  { id: 'every-5-minutes', label: 'Every 5 minutes', expression: '*/5 * * * *' },
  { id: 'hourly', label: 'Hourly (top of hour)', expression: '0 * * * *' },
  { id: 'daily-midnight', label: 'Daily at midnight', expression: '0 0 * * *' },
  { id: 'daily-9am', label: 'Daily at 09:00', expression: '0 9 * * *' },
  { id: 'weekdays-9am', label: 'Weekdays at 09:00', expression: '0 9 * * 1-5' },
  { id: 'work-hours-quarter-hour', label: 'Every 15m during work hours', expression: '*/15 9-17 * * 1-5' },
  { id: 'weekly-monday', label: 'Weekly on Monday at 09:00', expression: '0 9 * * 1' },
  { id: 'monthly-first', label: 'Monthly on day 1 at 00:00', expression: '0 0 1 * *' },
];

function matchingPresetId(expression) {
  const normalized = expression.trim().replace(/\s+/g, ' ');
  const preset = CRON_PRESETS.find(
    (item) => item.expression === normalized
  );
  return preset ? preset.id : 'custom';
}

function normalizeToken(token, aliases = {}) {
  const lowered = token.toLowerCase();
  if (aliases[lowered] !== undefined) return String(aliases[lowered]);
  return token;
}

function parseField(source, min, max, aliases = {}) {
  const text = source.trim();
  if (!text) throw new Error('empty field');

  const values = new Set();
  const chunks = text.split(',');
  chunks.forEach((chunk) => {
    let part = normalizeToken(chunk.trim(), aliases);
    if (part === '*') {
      for (let value = min; value <= max; value += 1) values.add(value);
      return;
    }

    let step = 1;
    if (part.includes('/')) {
      const [base, stepText] = part.split('/');
      part = normalizeToken(base, aliases);
      step = Number(stepText);
      if (!Number.isInteger(step) || step < 1) throw new Error(`invalid step "${stepText}"`);
    }

    let start;
    let end;
    if (part === '*') {
      start = min;
      end = max;
    } else if (part.includes('-')) {
      const [startText, endText] = part.split('-');
      start = Number(normalizeToken(startText, aliases));
      end = Number(normalizeToken(endText, aliases));
      if (!Number.isInteger(start) || !Number.isInteger(end)) throw new Error(`invalid range "${part}"`);
      if (start > end) throw new Error(`range start > end in "${part}"`);
    } else {
      start = Number(part);
      end = Number(part);
      if (!Number.isInteger(start)) throw new Error(`invalid value "${part}"`);
    }

    if (start < min || end > max) throw new Error(`value out of range (${min}-${max})`);
    for (let value = start; value <= end; value += step) values.add(value);
  });

  return values;
}

function parseCron(expression) {
  const trimmed = expression.trim();
  const parts = trimmed.split(/\s+/);
  if (parts.length !== 5) {
    throw new Error('Expected 5 fields: minute hour day-of-month month day-of-week');
  }

  const [minuteExp, hourExp, domExp, monthExp, dowExp] = parts;
  const minutes = parseField(minuteExp, 0, 59);
  const hours = parseField(hourExp, 0, 23);
  const dom = parseField(domExp, 1, 31);
  const months = parseField(monthExp, 1, 12, MONTH_NAMES);
  const dow = parseField(dowExp, 0, 7, DOW_NAMES);

  if (dow.has(7)) {
    dow.delete(7);
    dow.add(0);
  }

  return {
    minuteExp,
    hourExp,
    domExp,
    monthExp,
    dowExp,
    minutes,
    hours,
    dom,
    months,
    dow,
  };
}

function isAnyField(values, min, max) {
  return values.size === max - min + 1;
}

function describeField(text, unit, anyWord) {
  if (text === '*') return anyWord;
  if (text.startsWith('*/')) return `every ${text.slice(2)} ${unit}`;
  return text;
}

function describeCron(cron) {
  const minute = describeField(cron.minuteExp, 'minute(s)', 'every minute');
  const hour = describeField(cron.hourExp, 'hour(s)', 'every hour');
  const dayOfMonth = describeField(cron.domExp, 'day(s)', 'every day');
  const month = describeField(cron.monthExp, 'month(s)', 'every month');
  const dayOfWeek = describeField(cron.dowExp, 'weekday(s)', 'every weekday');
  return `${minute}, ${hour}, ${dayOfMonth}, ${month}, ${dayOfWeek}`;
}

function matchesDate(date, cron, useUtc) {
  const minute = useUtc ? date.getUTCMinutes() : date.getMinutes();
  const hour = useUtc ? date.getUTCHours() : date.getHours();
  const day = useUtc ? date.getUTCDate() : date.getDate();
  const month = (useUtc ? date.getUTCMonth() : date.getMonth()) + 1;
  const weekday = useUtc ? date.getUTCDay() : date.getDay();

  if (!cron.minutes.has(minute)) return false;
  if (!cron.hours.has(hour)) return false;
  if (!cron.months.has(month)) return false;

  const domAny = isAnyField(cron.dom, 1, 31);
  const dowAny = isAnyField(cron.dow, 0, 6);
  const domMatch = cron.dom.has(day);
  const dowMatch = cron.dow.has(weekday);

  if (domAny && dowAny) return true;
  if (domAny) return dowMatch;
  if (dowAny) return domMatch;
  return domMatch || dowMatch;
}

function nextRuns(cron, useUtc, count = 10) {
  const runs = [];
  const start = new Date();
  start.setSeconds(0, 0);
  start.setMinutes(start.getMinutes() + 1);

  const cursor = new Date(start);
  const maxIterations = 60 * 24 * 366 * 2;
  let iterations = 0;

  while (runs.length < count && iterations < maxIterations) {
    if (matchesDate(cursor, cron, useUtc)) {
      runs.push(new Date(cursor));
    }
    cursor.setMinutes(cursor.getMinutes() + 1);
    iterations += 1;
  }

  return runs;
}

function formatRun(date, useUtc) {
  return date.toLocaleString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: undefined,
    hour12: false,
    timeZone: useUtc ? 'UTC' : undefined,
    timeZoneName: useUtc ? 'short' : undefined,
  });
}

export default function CronTool() {
  const [expression, setExpression] = useState('*/15 9-17 * * 1-5');
  const [useUtc, setUseUtc] = useState(true);
  const [count, setCount] = useState(10);
  const [selectedPreset, setSelectedPreset] = useState(
    matchingPresetId('*/15 9-17 * * 1-5')
  );

  const { cron, error, upcoming, description } = useMemo(() => {
    try {
      const parsed = parseCron(expression);
      return {
        cron: parsed,
        error: null,
        upcoming: nextRuns(parsed, useUtc, count),
        description: describeCron(parsed),
      };
    } catch (parseError) {
      return {
        cron: null,
        error: parseError.message,
        upcoming: [],
        description: '',
      };
    }
  }, [expression, useUtc, count]);

  const outputText = useMemo(
    () =>
      upcoming
        .map((date, index) => `${index + 1}. ${formatRun(date, useUtc)}`)
        .join('\n'),
    [upcoming, useUtc]
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
  };

  return (
    <div className="flex h-full overflow-hidden" style={{ background: 'var(--color-base)' }}>
      <div style={{ flex: '0 0 50%', display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--color-rule)' }}>
        <div style={S.panelHead}>
          <span style={S.label}>Expression</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: error ? 'var(--color-danger)' : 'var(--color-ok)' }}>
            {error ? `⚠ ${error}` : 'Valid CRON'}
          </span>
        </div>
        <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: 10, borderBottom: '1px solid var(--color-rule)' }}>
          <input
            value={expression}
            onChange={(event) => {
              const nextExpression = event.target.value;
              setExpression(nextExpression);
              setSelectedPreset(matchingPresetId(nextExpression));
            }}
            spellCheck={false}
            placeholder="* * * * *"
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
          <label style={{ display: 'flex', flexDirection: 'column', gap: 5, color: 'var(--color-dim)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
            Preset schedules
            <select
              value={selectedPreset}
              onChange={(event) => {
                const nextPreset = event.target.value;
                setSelectedPreset(nextPreset);
                if (nextPreset === 'custom') return;
                const preset = CRON_PRESETS.find((item) => item.id === nextPreset);
                if (!preset) return;
                setExpression(preset.expression);
              }}
              style={{
                width: '100%',
                background: 'var(--color-elevated)',
                color: 'var(--color-ink)',
                border: '1px solid var(--color-wire)',
                borderRadius: 4,
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                padding: '8px 9px',
                outline: 'none',
              }}
            >
              {CRON_PRESETS.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.label} ({preset.expression})
                </option>
              ))}
              <option value="custom">Custom expression</option>
            </select>
          </label>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-dim)', cursor: 'pointer' }}>
              <input type="checkbox" checked={useUtc} onChange={(event) => setUseUtc(event.target.checked)} style={{ accentColor: 'var(--color-accent)' }} />
              Evaluate in UTC
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-dim)' }}>
              Next
              <input
                type="number"
                value={count}
                min={1}
                max={25}
                onChange={(event) => setCount(Math.max(1, Math.min(25, Number(event.target.value) || 1)))}
                style={{
                  width: 54,
                  background: 'var(--color-elevated)',
                  border: '1px solid var(--color-wire)',
                  color: 'var(--color-ink)',
                  borderRadius: 4,
                  padding: '4px 6px',
                  fontFamily: 'var(--font-mono)',
                }}
              />
              runs
            </label>
          </div>
        </div>

        <div style={{ padding: '14px', overflowY: 'auto' }}>
          <div style={{ ...S.label, marginBottom: 8 }}>Human Description</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, lineHeight: 1.7, color: error ? 'var(--color-muted)' : 'var(--color-ink)' }}>
            {error ? 'Fix the expression to see a readable description.' : description}
          </div>
          {!error && cron && (
            <div style={{ marginTop: 16, border: '1px solid var(--color-rule)', borderRadius: 6, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {[
                    ['minute', cron.minuteExp],
                    ['hour', cron.hourExp],
                    ['day-of-month', cron.domExp],
                    ['month', cron.monthExp],
                    ['day-of-week', cron.dowExp],
                  ].map(([name, value]) => (
                    <tr key={name}>
                      <td style={{ width: 130, padding: '8px 10px', borderBottom: '1px solid var(--color-rule)', color: 'var(--color-dim)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                        {name}
                      </td>
                      <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--color-rule)', color: 'var(--color-ink)', fontFamily: 'var(--font-mono)', fontSize: 12.5 }}>
                        {value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={S.panelHead}>
          <span style={S.label}>Upcoming Runs</span>
          <CopyButton text={outputText} />
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}>
          {error && (
            <div style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
              A valid expression will show the next scheduled runs.
            </div>
          )}
          {!error &&
            upcoming.map((date, index) => (
              <div key={date.toISOString()} style={{ border: '1px solid var(--color-rule)', background: 'var(--color-surface)', borderRadius: 6, padding: '8px 10px', marginBottom: 8, display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ color: 'var(--color-accent)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>#{index + 1}</span>
                <span style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-mono)', fontSize: 12, textAlign: 'right' }}>
                  {formatRun(date, useUtc)}
                </span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
