# Tool Ideas

Sorted by usefulness.

---

## 1. Regex Tester
Test a regex pattern against input text with live match highlighting. Show match groups, indices, and a flag selector (g, i, m, s). Invaluable for anyone writing backend validation or parsing logic.

## 2. Diff Viewer
Side-by-side or unified diff between two text blocks. Useful for comparing config files, API responses, or code snippets. Line-level highlighting with added/removed counts.

## 3. URL Parser / Builder
Decompose a URL into scheme, host, path, query params, and fragment — each in an editable field. Editing any field rebuilds the full URL live. Saves constant back-and-forth with browser devtools.

## 4. Unix Timestamp Converter
Convert between Unix timestamps (seconds/ms) and human-readable dates in multiple timezones. Also shows relative time ("3 days ago"). Constantly needed when reading API responses or logs.

## 5. Hash Generator
Compute MD5, SHA-1, SHA-256, SHA-512 of any input string. Useful for verifying checksums, generating cache keys, or testing auth flows — no install required.

## 6. Number Base Converter
Convert integers between decimal, hex, binary, and octal simultaneously. Show two's complement for negative numbers. Handy for bit manipulation, CSS hex colors, and systems programming.

## 7. CRON Expression Parser
Describe a cron string in plain English ("runs every Monday at 9am UTC") and list the next N upcoming fire times. Eliminates guessing when writing scheduled jobs.

## 8. Markdown Previewer
Live-render GitHub-flavored Markdown with the Deep Ocean theme. Side-by-side editor + preview, copy HTML output button. Good companion to the existing tools for docs work.

## 9. UUID / Nanoid Generator
Generate UUIDs (v4, v7) and Nanoid strings in bulk. Options for quantity, format (hyphenated, compact, uppercase), and copy-all. Quick to reach for when seeding test data.

## 10. CSV Viewer
Parse CSV/TSV and render it as a sortable, scrollable table. Show row/column counts and allow copying a single cell or column. Helps quickly inspect data exports without opening Excel.
