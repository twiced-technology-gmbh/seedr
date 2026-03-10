---
name: redline
description: |
  Visual UI feedback tool — annotate elements in a running web app, then fix them from annotation files.
  Two modes: `/redline setup` installs a lightweight annotation overlay into any web project (Tauri, React, Vue, Svelte, plain HTML).
  `/redline <path>` reads an annotation JSON file and fixes all annotated issues in the codebase.
  Use this skill whenever the user mentions: redline, UI annotations, visual feedback, annotate elements,
  fix annotations, paint feedback on UI, mark up the UI, visual code review of a running app,
  or wants to annotate and fix visual issues in their web app.
tools: Read, Glob, Grep, Bash, Edit, Write, Agent, AskUserQuestion
---

# Redline — Visual UI Annotation & Fix

Annotate elements in a running web app, then process those annotations to fix the code.

## Modes

### `/redline setup`

Installs the annotation overlay into the current project. This is a one-time setup per project.

#### Step 1: Detect the project type and HTML entry point

Search for the HTML entry point. Check these paths in order:

1. `index.html` (Vite, Tauri, plain HTML)
2. `src/index.html`
3. `public/index.html` (CRA)
4. `src/app.html` (SvelteKit)
5. `app/layout.tsx` or `app/layout.jsx` (Next.js App Router — use Script component)
6. `pages/_document.tsx` or `pages/_document.jsx` (Next.js Pages Router)
7. `app/root.tsx` (Remix)

If none found, ask the user for the path.

#### Step 2: Create the overlay file

Write the annotation overlay to `dev/annotation-overlay.js` in the project root.

Read the bundled asset file at `SKILL_DIR/assets/annotation-overlay.js` and write it to `<project-root>/dev/annotation-overlay.js`.

SKILL_DIR is the directory containing this SKILL.md file. Use the path of this skill file to resolve it.

#### Step 3: Add the script tag

Add a dev-only script tag to the HTML entry point. The tag should be conditional so it only loads in development:

**For HTML files** (index.html, app.html, etc.):
```html
<!-- Redline: dev-only annotation overlay -->
<script data-dev-only src="/dev/annotation-overlay.js"></script>
```
Add it just before `</body>` or at the end of `<head>`.

**For Next.js App Router** (app/layout.tsx):
```tsx
import Script from 'next/script'
// ... in the layout body:
{process.env.NODE_ENV === 'development' && (
  <Script src="/dev/annotation-overlay.js" strategy="lazyOnload" />
)}
```

**For Next.js Pages Router** (_document.tsx):
```tsx
{process.env.NODE_ENV === 'development' && (
  <script src="/dev/annotation-overlay.js" />
)}
```

**For Remix** (app/root.tsx):
Add a `<script>` tag inside the document body, conditionally on dev mode.

#### Step 4: Update .gitignore

Add these entries to `.gitignore` if not already present:
```
.claude/redline/
```

Do NOT gitignore `dev/annotation-overlay.js` — it should be committed so other developers on the team can use it too.

#### Step 5: Create redline directory

```bash
mkdir -p .claude/redline
```

#### Step 6: Confirm to the user

Tell the user:
- Setup is complete
- How to use it: press `Cmd+Shift+A` (Mac) or `Ctrl+Shift+A` (Windows/Linux) while the app is running
- They'll name the annotation session, click elements and type feedback, then press the hotkey again to finish
- The filename gets copied to clipboard — paste it to any coding agent with `/redline <filename>`

---

### `/redline <filename>`

Process an annotation file and fix the issues in the codebase.

#### Step 1: Find and read the annotation file

The argument is a filename (e.g. `home-2026-03-10-1430.json`). Search for it in this order:

1. `~/Downloads/<filename>` (default browser download location on macOS/Windows/Linux)
2. If not found, run: `find ~ -maxdepth 2 -name "<filename>" -type f 2>/dev/null | head -1` to check other common locations
3. If still not found, try the argument as an absolute or relative path

Read the JSON file. It has this structure:

```json
{
  "view": "/dashboard",
  "url": "http://localhost:1420/dashboard",
  "timestamp": "2026-03-10T14:30:00Z",
  "annotations": [
    {
      "selector": "div.card > h2.title",
      "comment": "too much padding",
      "tagName": "H2",
      "classes": "title text-lg font-bold",
      "text": "Product Name",
      "position": { "x": 340, "y": 210 }
    }
  ]
}
```

#### Step 2: Analyze annotations and group by file

For each annotation, find the source file(s) that define the element:

1. **Search by class names**: Grep for the CSS classes in the `classes` field across `.css`, `.scss`, `.less`, `.tsx`, `.jsx`, `.vue`, `.svelte`, `.html` files
2. **Search by selector**: If classes aren't unique enough, search for the full selector pattern
3. **Search by text content**: Use the `text` field to locate the component that renders this element
4. **Cross-reference**: The `view` field (route) helps narrow down which component/page file to look at

Group annotations by the source file they map to. This determines which fixes can be parallelized.

#### Step 3: Apply fixes

For annotations that map to different files, dispatch parallel agents — one per file. Each agent:

1. Reads the source file
2. Locates the element matching the annotation's selector/classes
3. Interprets the comment (e.g., "too much padding" → reduce padding, "wrong color" → check design system or nearby elements for the intended color)
4. Applies the minimal fix

For ambiguous comments (e.g., "fix this", "wrong", "ugly"), flag them in the summary rather than guessing. Include the selector and current styles so the user can clarify.

#### Step 4: Summary

After all fixes are applied, show a summary:

```
Redline: processed <N> annotations from <view>

Fixed:
  - div.card > h2.title: reduced padding from 24px to 12px (src/components/Card.tsx:15)
  - button.submit: changed color from #333 to var(--primary) (src/styles/buttons.css:42)

Skipped (ambiguous):
  - nav > a.active: comment was "fix this" — please clarify what needs to change

Files modified:
  - src/components/Card.tsx
  - src/styles/buttons.css
```
