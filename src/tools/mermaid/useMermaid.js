import { useState, useEffect, useRef } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  themeVariables: {
    darkMode: true,
    background: '#060c14',
    mainBkg: '#0f2040',
    nodeBorder: '#2a5a8c',
    clusterBkg: '#0c1724',
    clusterBorder: '#2a5070',
    titleColor: '#cde5f5',
    edgeLabelBackground: '#0c1724',
    primaryColor: '#0f2040',
    primaryTextColor: '#cde5f5',
    primaryBorderColor: '#2a5a8c',
    lineColor: '#4a8ab0',
    secondaryColor: '#0d1e35',
    tertiaryColor: '#081525',
    fontFamily: '"IBM Plex Mono", monospace',
    fontSize: '14px',
  },
  securityLevel: 'loose',
  flowchart: { htmlLabels: true, curve: 'basis' },
  sequence: { useMaxWidth: false },
  gantt: { useMaxWidth: false },
});

export function useMermaid(code) {
  const [result, setResult] = useState({ svg: null, error: null });
  const versionRef = useRef(0);
  const timerRef = useRef(null);

  useEffect(() => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      const version = ++versionRef.current;

      await document.fonts.ready;

      const trimmed = code.trim();
      if (!trimmed) {
        if (version !== versionRef.current) return;
        setResult({ svg: null, error: null });
        return;
      }

      try {
        const id = `mg${version}`;
        const rendered = await mermaid.render(id, trimmed);
        if (version !== versionRef.current) return;
        setResult({ svg: rendered, error: null });
      } catch (err) {
        if (version !== versionRef.current) return;
        let msg = String(err.message || err).replace(/^Error:\s*/i, '').split('\n')[0];
        if (msg.length > 120) msg = msg.slice(0, 120) + '…';
        setResult({ svg: null, error: msg });
      }
    }, 450);

    return () => clearTimeout(timerRef.current);
  }, [code]);

  return result;
}
