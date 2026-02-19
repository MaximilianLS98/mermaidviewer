# DevTools

A fast, local-first developer toolbox with a dark "Deep Ocean Blueprint" aesthetic. No accounts, no tracking, no backend — everything runs in the browser.

A version also lives on my website at [https://mermaid.m8n.no](https://mermaid.m8n.no), still fully local-first.

Built with React 19, Tailwind v4, and Vite.

---

## Tools

| Tool | What it does |
|---|---|
| **Mermaid** | Write and preview Mermaid diagrams with pan/zoom, save to localStorage, and export as PNG or SVG |
| **JSON** | Format or minify JSON with syntax highlighting, validation, and stats (key count, depth, size) |
| **JWT** | Decode a JWT into its header, payload, and signature — with timestamp annotations and expiry status |
| **Base64** | Auto-detects whether to encode or decode, with a URL-safe mode toggle |
| **Color** | Hex/RGB/HSL picker with format cards, WCAG contrast ratios, and a recently used colors row |

---

## Getting Started

Requires [Node.js](https://nodejs.org) 18+.

```bash
git clone https://github.com/MaximilianLS98/mermaidviewer.git
cd mermaidviewer
npm install
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173).

```bash
npm run build    # production build → dist/
npm run preview  # preview the production build locally
```

---

## Stack

- **[React 19](https://react.dev)** — UI
- **[Tailwind CSS v4](https://tailwindcss.com)** — styling via `@theme` tokens
- **[Vite 7](https://vite.dev)** — dev server and bundler
- **[Mermaid 11](https://mermaid.js.org)** — diagram rendering

No other runtime dependencies.

---

## Design

All tools share a consistent "Deep Ocean Blueprint" theme — deep navy backgrounds, cyan accents, and IBM Plex typography. The color palette is defined as a single Tailwind `@theme` block in `src/styles.css`, making it easy to adjust globally.

Tool bundles are lazy-loaded, so Mermaid's large dependency only downloads when you open that tab.

---

## License

MIT
