import { lazy } from 'react';

export const TOOLS = [
  { id: 'mermaid',   label: 'Mermaid',   icon: '⬡',   component: lazy(() => import('./mermaid/index.jsx')) },
  { id: 'json',      label: 'JSON',      icon: '{ }', component: lazy(() => import('./json/index.jsx')) },
  { id: 'jwt',       label: 'JWT',       icon: '⊛',   component: lazy(() => import('./jwt/index.jsx')) },
  { id: 'base64',    label: 'Base64',    icon: '∞',   component: lazy(() => import('./base64/index.jsx')) },
  { id: 'color',     label: 'Color',     icon: '◈',   component: lazy(() => import('./color/index.jsx')) },
  { id: 'regex',     label: 'Regex',     icon: '.*',  component: lazy(() => import('./regex/index.jsx')) },
  { id: 'diff',      label: 'Diff',      icon: '±',   component: lazy(() => import('./diff/index.jsx')) },
  { id: 'cron',      label: 'CRON',      icon: '⏱',   component: lazy(() => import('./cron/index.jsx')) },
  { id: 'markdown',  label: 'Markdown',  icon: '✎',   component: lazy(() => import('./markdown/index.jsx')) },
  { id: 'url',       label: 'URL',       icon: '⊕',   component: lazy(() => import('./url/index.jsx')) },
  { id: 'timestamp', label: 'Timestamp', icon: 'τ',   component: lazy(() => import('./timestamp/index.jsx')) },
  { id: 'hash',      label: 'Hash',      icon: '#',   component: lazy(() => import('./hash/index.jsx')) },
  { id: 'numbase',   label: 'Base',      icon: '0x',  component: lazy(() => import('./numbase/index.jsx')) },
  { id: 'uuid',      label: 'UUID',      icon: '⊙',   component: lazy(() => import('./uuid/index.jsx')) },
  { id: 'csv',       label: 'CSV',       icon: '⊞',   component: lazy(() => import('./csv/index.jsx')) },
];
