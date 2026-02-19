import { lazy } from 'react';

export const TOOLS = [
  { id: 'mermaid', label: 'Mermaid', icon: '⬡',   component: lazy(() => import('./mermaid/index.jsx')) },
  { id: 'json',    label: 'JSON',    icon: '{ }',  component: lazy(() => import('./json/index.jsx')) },
  { id: 'jwt',     label: 'JWT',     icon: '⊛',   component: lazy(() => import('./jwt/index.jsx')) },
  { id: 'base64',  label: 'Base64',  icon: '∞',   component: lazy(() => import('./base64/index.jsx')) },
  { id: 'color',   label: 'Color',   icon: '◈',   component: lazy(() => import('./color/index.jsx')) },
];
