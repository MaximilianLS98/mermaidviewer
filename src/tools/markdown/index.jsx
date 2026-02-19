import { useMemo, useState } from 'react';
import CopyButton from '../../components/ui/CopyButton.jsx';

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function renderInline(text) {
  let value = escapeHtml(text);
  value = value.replace(/`([^`]+)`/g, '<code style="background:var(--color-elevated);padding:0 4px;border-radius:3px;">$1</code>');
  value = value.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer" style="color:var(--color-accent);text-decoration:none;">$1</a>');
  value = value.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  value = value.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  value = value.replace(/~~([^~]+)~~/g, '<s>$1</s>');
  return value;
}

function parseMarkdown(markdown) {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const html = [];

  let inCodeBlock = false;
  let codeLines = [];
  let inUl = false;
  let inOl = false;
  let paragraph = [];

  function closeParagraph() {
    if (!paragraph.length) return;
    html.push(`<p style="margin:0 0 12px 0;line-height:1.75;">${renderInline(paragraph.join(' '))}</p>`);
    paragraph = [];
  }

  function closeLists() {
    if (inUl) {
      html.push('</ul>');
      inUl = false;
    }
    if (inOl) {
      html.push('</ol>');
      inOl = false;
    }
  }

  lines.forEach((line) => {
    if (line.startsWith('```')) {
      closeParagraph();
      closeLists();
      if (!inCodeBlock) {
        inCodeBlock = true;
        codeLines = [];
      } else {
        const block = escapeHtml(codeLines.join('\n'));
        html.push(
          `<pre style="margin:0 0 12px 0;padding:10px 12px;background:var(--color-elevated);border:1px solid var(--color-rule);border-radius:6px;overflow:auto;"><code>${block}</code></pre>`
        );
        inCodeBlock = false;
      }
      return;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      return;
    }

    const trimmed = line.trim();
    if (!trimmed) {
      closeParagraph();
      closeLists();
      return;
    }

    const heading = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      closeParagraph();
      closeLists();
      const level = heading[1].length;
      const size = 26 - level * 2.5;
      html.push(`<h${level} style="margin:0 0 10px 0;font-size:${size}px;line-height:1.3;color:var(--color-ink);">${renderInline(heading[2])}</h${level}>`);
      return;
    }

    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      closeParagraph();
      closeLists();
      html.push('<hr style="border:none;border-top:1px solid var(--color-rule);margin:12px 0;" />');
      return;
    }

    const blockquote = trimmed.match(/^>\s?(.*)$/);
    if (blockquote) {
      closeParagraph();
      closeLists();
      html.push(
        `<blockquote style="margin:0 0 12px 0;padding:8px 12px;border-left:3px solid var(--color-accent);background:rgba(0,212,255,0.08);color:var(--color-ink);">${renderInline(
          blockquote[1]
        )}</blockquote>`
      );
      return;
    }

    const ulMatch = trimmed.match(/^[-*+]\s+(.+)$/);
    if (ulMatch) {
      closeParagraph();
      if (inOl) {
        html.push('</ol>');
        inOl = false;
      }
      if (!inUl) {
        html.push('<ul style="margin:0 0 12px 0;padding-left:20px;">');
        inUl = true;
      }
      html.push(`<li style="margin:0 0 5px 0;line-height:1.7;">${renderInline(ulMatch[1])}</li>`);
      return;
    }

    const olMatch = trimmed.match(/^\d+\.\s+(.+)$/);
    if (olMatch) {
      closeParagraph();
      if (inUl) {
        html.push('</ul>');
        inUl = false;
      }
      if (!inOl) {
        html.push('<ol style="margin:0 0 12px 0;padding-left:22px;">');
        inOl = true;
      }
      html.push(`<li style="margin:0 0 5px 0;line-height:1.7;">${renderInline(olMatch[1])}</li>`);
      return;
    }

    paragraph.push(trimmed);
  });

  closeParagraph();
  closeLists();
  if (inCodeBlock) {
    const block = escapeHtml(codeLines.join('\n'));
    html.push(
      `<pre style="margin:0 0 12px 0;padding:10px 12px;background:var(--color-elevated);border:1px solid var(--color-rule);border-radius:6px;overflow:auto;"><code>${block}</code></pre>`
    );
  }

  return html.join('');
}

export default function MarkdownTool() {
  const [input, setInput] = useState(`# Markdown Preview

Write docs in the left editor and preview instantly.

## Features
- Headings
- Lists
- \`inline code\`
- **bold**, *italic*, ~~strike~~

> Works with the same Deep Ocean theme.

\`\`\`
const greeting = "hello world";
console.log(greeting);
\`\`\`
`);

  const html = useMemo(() => parseMarkdown(input), [input]);

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
      lineHeight: 1.75,
      outline: 'none',
      overflowY: 'auto',
      caretColor: 'var(--color-accent)',
    },
  };

  return (
    <div className="flex h-full overflow-hidden" style={{ background: 'var(--color-base)' }}>
      <div style={{ flex: '0 0 50%', display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--color-rule)' }}>
        <div style={S.panelHead}>
          <span style={S.label}>Markdown Input</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-dim)' }}>
            {input.length} chars
          </span>
        </div>
        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          spellCheck={false}
          placeholder="Write markdown here..."
          style={S.textArea}
        />
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={S.panelHead}>
          <span style={S.label}>Preview</span>
          <CopyButton text={html} />
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px' }}>
          <article
            style={{
              color: 'var(--color-ink)',
              fontFamily: 'var(--font-sans)',
              fontSize: 14,
            }}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </div>
    </div>
  );
}
