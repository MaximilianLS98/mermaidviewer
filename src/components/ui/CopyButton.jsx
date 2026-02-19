import { useState } from 'react';

export default function CopyButton({ text, className = '' }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (_) {}
  }

  return (
    <button
      onClick={handleCopy}
      className={className}
      style={{
        fontFamily: 'var(--font-display)',
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: '0.1em',
        padding: '3px 9px',
        borderRadius: 3,
        cursor: 'pointer',
        border: '1px solid',
        transition: 'all 0.15s',
        background: copied ? 'rgba(52,212,122,0.12)' : 'transparent',
        borderColor: copied ? 'var(--color-ok)' : 'var(--color-wire)',
        color: copied ? 'var(--color-ok)' : 'var(--color-dim)',
      }}
    >
      {copied ? 'COPIED ✓' : 'COPY'}
    </button>
  );
}
