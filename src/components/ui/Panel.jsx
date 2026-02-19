export function Panel({ children, className = '', style = {} }) {
  return (
    <div
      className={`flex flex-col overflow-hidden ${className}`}
      style={{ background: 'var(--color-base)', ...style }}
    >
      {children}
    </div>
  );
}

export function PanelHeader({ children, className = '' }) {
  return (
    <div
      className={`flex-shrink-0 flex items-center justify-between px-3.5 ${className}`}
      style={{
        height: 38,
        background: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-rule)',
      }}
    >
      {children}
    </div>
  );
}

export function PanelTitle({ children }) {
  return (
    <span
      style={{
        fontFamily: 'var(--font-display)',
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: '0.14em',
        color: 'var(--color-muted)',
        textTransform: 'uppercase',
      }}
    >
      {children}
    </span>
  );
}
