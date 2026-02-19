import { useState, useEffect, Suspense, lazy } from 'react';
import { TOOLS } from './tools/index.js';

function getHashTool() {
  const hash = window.location.hash.slice(1);
  return TOOLS.find(t => t.id === hash) ? hash : TOOLS[0].id;
}

export default function App() {
  const [activeTool, setActiveTool] = useState(getHashTool);

  useEffect(() => {
    const onHash = () => setActiveTool(getHashTool());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  function navigate(id) {
    window.location.hash = id;
    setActiveTool(id);
  }

  const ActiveComponent = TOOLS.find(t => t.id === activeTool)?.component;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Top bar */}
      <header
        className="flex-shrink-0 flex items-center gap-1 px-3 border-b"
        style={{
          height: 44,
          background: 'var(--color-surface)',
          borderColor: 'var(--color-rule)',
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 mr-4 select-none">
          <span
            className="hex-pulse text-accent text-xl leading-none"
            style={{ color: 'var(--color-accent)' }}
          >
            ⬡
          </span>
          <span
            className="font-display font-bold tracking-widest text-base"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ink)' }}
          >
            DEV<span style={{ color: 'var(--color-accent)' }}>TOOLS</span>
          </span>
        </div>

        {/* Tabs */}
        <nav className="flex items-center gap-1">
          {TOOLS.map(tool => {
            const active = tool.id === activeTool;
            return (
              <button
                key={tool.id}
                onClick={() => navigate(tool.id)}
                className="flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium tracking-wider transition-all duration-150"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 11,
                  letterSpacing: '0.1em',
                  background: active ? 'rgba(0,212,255,0.1)' : 'transparent',
                  color: active ? 'var(--color-accent)' : 'var(--color-dim)',
                  border: active ? '1px solid rgba(0,212,255,0.3)' : '1px solid transparent',
                }}
              >
                <span style={{ fontSize: 13 }}>{tool.icon}</span>
                {tool.label}
              </button>
            );
          })}
        </nav>
      </header>

      {/* Tool content */}
      <main className="flex-1 overflow-hidden">
        <Suspense fallback={
          <div
            className="h-full flex items-center justify-center"
            style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)', fontSize: 12 }}
          >
            Loading…
          </div>
        }>
          {ActiveComponent && <ActiveComponent />}
        </Suspense>
      </main>
    </div>
  );
}
