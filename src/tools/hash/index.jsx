import { useState, useEffect } from 'react';
import CopyButton from '../../components/ui/CopyButton.jsx';

// ── MD5 (pure-JS, no external deps) ───────────────────────────────────────
function md5(string) {
  function rotL(n, s) { return (n << s) | (n >>> (32 - s)); }
  function add(x, y) {
    const lx = (x & 0xffff) + (y & 0xffff);
    return ((((x >>> 16) + (y >>> 16) + (lx >>> 16)) << 16) | (lx & 0xffff));
  }
  function cmn(q, a, b, x, s, t) { return add(rotL(add(add(a, q), add(x, t)), s), b); }
  function ff(a,b,c,d,x,s,t) { return cmn((b&c)|(~b&d),a,b,x,s,t); }
  function gg(a,b,c,d,x,s,t) { return cmn((b&d)|(c&~d),a,b,x,s,t); }
  function hh(a,b,c,d,x,s,t) { return cmn(b^c^d,a,b,x,s,t); }
  function ii(a,b,c,d,x,s,t) { return cmn(c^(b|~d),a,b,x,s,t); }
  function w2h(v) {
    let r = '';
    for (let i = 0; i < 4; i++) r += ('0' + ((v >>> (i * 8)) & 0xff).toString(16)).slice(-2);
    return r;
  }

  // UTF-8 encode
  let str = unescape(encodeURIComponent(string));
  const bytes = Array.from({ length: str.length }, (_, i) => str.charCodeAt(i));
  const origLen = bytes.length;

  bytes.push(0x80);
  while (bytes.length % 64 !== 56) bytes.push(0);
  const bits = origLen * 8;
  for (let i = 0; i < 4; i++) bytes.push((bits >>> (i * 8)) & 0xff);
  for (let i = 0; i < 4; i++) bytes.push(0); // high bits

  let a = 0x67452301, b = 0xefcdab89, c = 0x98badcfe, d = 0x10325476;

  for (let i = 0; i < bytes.length; i += 64) {
    const M = Array.from({ length: 16 }, (_, j) =>
      bytes[i+j*4] | (bytes[i+j*4+1]<<8) | (bytes[i+j*4+2]<<16) | (bytes[i+j*4+3]<<24)
    );
    const [A, B, C, D] = [a, b, c, d];
    a=ff(a,b,c,d,M[0],7,-680876936);d=ff(d,a,b,c,M[1],12,-389564586);c=ff(c,d,a,b,M[2],17,606105819);b=ff(b,c,d,a,M[3],22,-1044525330);
    a=ff(a,b,c,d,M[4],7,-176418897);d=ff(d,a,b,c,M[5],12,1200080426);c=ff(c,d,a,b,M[6],17,-1473231341);b=ff(b,c,d,a,M[7],22,-45705983);
    a=ff(a,b,c,d,M[8],7,1770035416);d=ff(d,a,b,c,M[9],12,-1958414417);c=ff(c,d,a,b,M[10],17,-42063);b=ff(b,c,d,a,M[11],22,-1990404162);
    a=ff(a,b,c,d,M[12],7,1804603682);d=ff(d,a,b,c,M[13],12,-40341101);c=ff(c,d,a,b,M[14],17,-1502002290);b=ff(b,c,d,a,M[15],22,1236535329);
    a=gg(a,b,c,d,M[1],5,-165796510);d=gg(d,a,b,c,M[6],9,-1069501632);c=gg(c,d,a,b,M[11],14,643717713);b=gg(b,c,d,a,M[0],20,-373897302);
    a=gg(a,b,c,d,M[5],5,-701558691);d=gg(d,a,b,c,M[10],9,38016083);c=gg(c,d,a,b,M[15],14,-660478335);b=gg(b,c,d,a,M[4],20,-405537848);
    a=gg(a,b,c,d,M[9],5,568446438);d=gg(d,a,b,c,M[14],9,-1019803690);c=gg(c,d,a,b,M[3],14,-187363961);b=gg(b,c,d,a,M[8],20,1163531501);
    a=gg(a,b,c,d,M[13],5,-1444681467);d=gg(d,a,b,c,M[2],9,-51403784);c=gg(c,d,a,b,M[7],14,1735328473);b=gg(b,c,d,a,M[12],20,-1926607734);
    a=hh(a,b,c,d,M[5],4,-378558);d=hh(d,a,b,c,M[8],11,-2022574463);c=hh(c,d,a,b,M[11],16,1839030562);b=hh(b,c,d,a,M[14],23,-35309556);
    a=hh(a,b,c,d,M[1],4,-1530992060);d=hh(d,a,b,c,M[4],11,1272893353);c=hh(c,d,a,b,M[7],16,-155497632);b=hh(b,c,d,a,M[10],23,-1094730640);
    a=hh(a,b,c,d,M[13],4,681279174);d=hh(d,a,b,c,M[0],11,-358537222);c=hh(c,d,a,b,M[3],16,-722521979);b=hh(b,c,d,a,M[6],23,76029189);
    a=hh(a,b,c,d,M[9],4,-640364487);d=hh(d,a,b,c,M[12],11,-421815835);c=hh(c,d,a,b,M[15],16,530742520);b=hh(b,c,d,a,M[2],23,-995338651);
    a=ii(a,b,c,d,M[0],6,-198630844);d=ii(d,a,b,c,M[7],10,1126891415);c=ii(c,d,a,b,M[14],15,-1416354905);b=ii(b,c,d,a,M[5],21,-57434055);
    a=ii(a,b,c,d,M[12],6,1700485571);d=ii(d,a,b,c,M[3],10,-1894986606);c=ii(c,d,a,b,M[10],15,-1051523);b=ii(b,c,d,a,M[1],21,-2054922799);
    a=ii(a,b,c,d,M[8],6,1873313359);d=ii(d,a,b,c,M[15],10,-30611744);c=ii(c,d,a,b,M[6],15,-1560198380);b=ii(b,c,d,a,M[13],21,1309151649);
    a=ii(a,b,c,d,M[4],6,-145523070);d=ii(d,a,b,c,M[11],10,-1120210379);c=ii(c,d,a,b,M[2],15,718787259);b=ii(b,c,d,a,M[9],21,-343485551);
    a=add(a,A); b=add(b,B); c=add(c,C); d=add(d,D);
  }
  return w2h(a) + w2h(b) + w2h(c) + w2h(d);
}

// ── SHA via SubtleCrypto ───────────────────────────────────────────────────
async function subtleHash(algorithm, data) {
  const buf = await crypto.subtle.digest(algorithm, new TextEncoder().encode(data));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

const ALGORITHMS = [
  { id: 'md5',    label: 'MD5',     bits: 128 },
  { id: 'sha1',   label: 'SHA-1',   bits: 160 },
  { id: 'sha256', label: 'SHA-256', bits: 256 },
  { id: 'sha512', label: 'SHA-512', bits: 512 },
];

export default function HashTool() {
  const [input, setInput] = useState('');
  const [uppercase, setUppercase] = useState(false);
  const [hashes, setHashes] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    async function compute() {
      const md5Hash = md5(input);
      const [sha1, sha256, sha512] = await Promise.all([
        subtleHash('SHA-1', input),
        subtleHash('SHA-256', input),
        subtleHash('SHA-512', input),
      ]);
      if (!cancelled) {
        setHashes({ md5: md5Hash, sha1, sha256, sha512 });
        setLoading(false);
      }
    }
    compute();
    return () => { cancelled = true; };
  }, [input]);

  const fmt = v => uppercase ? v.toUpperCase() : v;

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

  const allText = ALGORITHMS
    .map(a => `${a.label}: ${fmt(hashes[a.id] || '')}`)
    .join('\n');

  return (
    <div className="flex h-full overflow-hidden" style={{ background: 'var(--color-base)' }}>
      {/* Left: input */}
      <div style={{ flex: '0 0 50%', display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--color-rule)' }}>
        <div style={S.panelHead}>
          <span style={S.label}>Input</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-muted)' }}>
            {new TextEncoder().encode(input).length} bytes
          </span>
        </div>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          spellCheck={false}
          placeholder="Enter text to hash…"
          style={{
            flex: 1,
            padding: '14px 16px',
            background: 'var(--color-base)',
            color: 'var(--color-ink)',
            border: 'none',
            resize: 'none',
            fontFamily: 'var(--font-mono)',
            fontSize: 12.5,
            lineHeight: 1.7,
            outline: 'none',
            caretColor: 'var(--color-accent)',
          }}
        />
      </div>

      {/* Right: hashes */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={S.panelHead}>
          <span style={S.label}>
            Hashes
            {loading && <span style={{ color: 'var(--color-muted)', marginLeft: 8 }}>computing…</span>}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => setInput('Hello, World!')}
              style={{
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
              }}
            >
              EXAMPLE
            </button>
            <button
              onClick={() => setUppercase(u => !u)}
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: '0.1em',
                padding: '3px 9px',
                borderRadius: 3,
                cursor: 'pointer',
                border: `1px solid ${uppercase ? 'rgba(0,212,255,0.35)' : 'var(--color-wire)'}`,
                background: uppercase ? 'rgba(0,212,255,0.1)' : 'transparent',
                color: uppercase ? 'var(--color-accent)' : 'var(--color-dim)',
              }}
            >
              {uppercase ? 'A–F' : 'a–f'}
            </button>
            <CopyButton text={allText} />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {ALGORITHMS.map(({ id, label, bits }) => {
            const value = fmt(hashes[id] || '');
            return (
              <div key={id} style={{ border: '1px solid var(--color-rule)', borderRadius: 6, background: 'var(--color-surface)', overflow: 'hidden' }}>
                <div style={{ padding: '7px 12px', borderBottom: '1px solid var(--color-rule)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 600, color: 'var(--color-accent)', letterSpacing: '0.08em' }}>
                    {label}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-muted)' }}>
                    {bits} bits · {bits / 4} hex chars
                  </span>
                </div>
                <div style={{ padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <code style={{ fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1.5, color: 'var(--color-ink)', wordBreak: 'break-all', flex: 1 }}>
                    {value || <span style={{ color: 'var(--color-muted)' }}>—</span>}
                  </code>
                  {value && <CopyButton text={value} />}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
