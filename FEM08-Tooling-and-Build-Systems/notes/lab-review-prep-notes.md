# Review Prep Notes — Developer Dashboard (FEM08: Tooling & Build Systems)

Use this as your talking-points sheet for the live TA code review. It's organized the
way a reviewer usually probes: *what did you configure → why → what does it prove you
understand.*

---

## 1. Package Management (npm)

**What's in the project:** `package.json`, `package-lock.json`, `node_modules/` (gitignored).

**Be ready to explain:**
- `package.json` scripts map a short name (`dev`, `build`, `lint`, `format`) to a real
  CLI command, so the whole team runs the same command regardless of what's installed globally.
- `package-lock.json` pins exact dependency versions/hashes so `npm install` produces an
  identical `node_modules` tree on any machine — this is what makes builds reproducible.
- `devDependencies` (vite, eslint, prettier, eslint-config-prettier) vs `dependencies`:
  everything here is a dev-time tool, none of it ships to the browser, which is why it's
  a `devDependency`.

**Likely question:** *"Why devDependency and not dependency?"*
→ Because none of these tools run in the shipped bundle; the browser never sees vite,
eslint, or prettier — only your `src/` code, bundled, does.

---

## 2. Build Automation (Vite)

**What's in the project:** `vite.config.js`, `index.html`, `src/main.js`, `dist/` (build output).

**Key config choices and why:**
| Option | Value | Reason |
|---|---|---|
| `base` | `'./'` | Makes the build's asset paths relative, so `dist/` works from any folder or subpath, not just the domain root. |
| `build.outDir` | `'dist'` | Explicit output folder, matches the lab's expectation. |
| `build.minify` | `true` | Uses Vite's built-in minifier for production JS/CSS. |
| `server.port` | `5173` | Vite's default; set explicitly so it's visible in config rather than implicit. |

**Be ready to explain the dev vs. build difference:**
- **Dev (`npm run dev`):** Vite serves your source files over native ES modules. It
  doesn't bundle anything up front — it transforms a file only when the browser requests
  it. That's why the dev server starts almost instantly even on a large project.
- **Build (`npm run build`):** Vite switches to a bundled pipeline — it merges modules,
  tree-shakes unused code, minifies, and hashes filenames (e.g. `index-C_ppV94z.js`) so
  browsers can cache assets aggressively and safely bust that cache on the next deploy.

**Discussion-prompt answer (from Course.md):** *What architectural choices let Vite's dev
server be fast?*
- It relies on the browser's native `import`/ES module support instead of pre-bundling
  the whole app before serving anything.
- Only the module the browser actually requests gets transformed, so cost scales with
  what's on screen, not with total project size.
- Vite pre-bundles heavy, rarely-changing dependencies (npm packages) once with a fast
  native bundler, so those don't get re-processed on every request.
- Hot Module Replacement swaps just the changed module in the running app instead of
  reloading and re-bundling everything.

**Evidence to show the reviewer:** the `dist/` folder's hashed filenames and the reported
gzip sizes in the terminal output from `npm run build`.

---

## 3. Code Quality (ESLint)

**What's in the project:** `.eslintrc.json`, `.eslintignore`.

**Config decisions:**
- `env: browser` — because this is client-side code (uses `document`, `window`), not Node.
- `extends: ["eslint:recommended", "prettier"]` — recommended rules catch real bugs
  (undefined vars, unreachable code); `"prettier"` turns off any ESLint rule that would
  otherwise fight with Prettier's formatting.
- Custom rules: `no-unused-vars: error`, `eqeqeq: warn`, `no-var: error`, `prefer-const: warn`
  — these were called out explicitly in the lab brief.

**Be ready to explain:** the difference between `"error"` and `"warn"` — errors fail
`npm run lint` (and CI), warnings surface but don't block. `eqeqeq` is a warning here
because `==` isn't automatically wrong (e.g. `== null` is a common intentional idiom),
but it's worth flagging for review.

**Command to demo live:** `npm run lint` (should exit clean — 0 errors).

---

## 4. Code Formatting (Prettier)

**What's in the project:** `.prettierrc`, `.prettierignore`.

**Config decisions:**
- `semi: true`, `singleQuote: true`, `trailingComma: "es5"`, `printWidth: 90`,
  `tabWidth: 2` — a concrete, opinionated style so the whole codebase reads identically
  regardless of who wrote a given file.
- `.prettierignore` excludes `dist/`, `node_modules/`, and `package-lock.json` —
  generated files shouldn't be reformatted; formatting them wastes time and creates
  meaningless diffs.
- ESLint/Prettier integration: `eslint-config-prettier` is in ESLint's `extends` list so
  the two tools don't disagree about formatting-related rules (e.g. indentation) — ESLint
  focuses on code *correctness*, Prettier owns *style*.

**Command to demo live:** `npm run format` (Prettier `--write`), then `npx prettier --check .`
to prove the whole project is compliant.

---

## 5. Application Implementation

**What's in the project:** `src/main.js`, `src/style.css`.

**What to walk the reviewer through:**
- Resources are plain JS objects in an array (`name`, `category`, `type`, `desc`, `link`).
- A single `state = { query, category }` object drives everything — the search input and
  the category buttons both just mutate `state` and call the same `render()` function.
  This avoids duplicated rendering logic between "search mode" and "filter mode."
- Cards are generated with a template-literal function (`cardTemplate`), then joined and
  injected via `innerHTML` — matches the lab's instruction to use template literals rather
  than a framework.
- Accessibility touches worth mentioning: `aria-live="polite"` on the results grid so
  screen readers announce filtered result changes, visible `:focus-visible` states on
  the search input and filter buttons, and `prefers-reduced-motion` support that disables
  the card entrance animation.

**Likely question:** *"Why not just re-run `matches()` inside two separate handlers?"*
→ Centralizing state + one `render()` call means adding a third filter axis later (say,
`type`) only requires updating `matches()`, not every event handler.

---

## 6. Reflection (from README.md)

Vite's dev server serves native ES modules and transforms only what's requested, so
startup and hot-reload are near-instant regardless of project size. The production build
switches to a bundled, minified, cache-friendly output (hashed filenames, tree-shaken
code), which keeps the shipped bundle small without any manual bundler tuning. That combo
— fast iteration locally, lean output in production — is the core trade-off build tools
are solving for.

---

## Quick command cheat-sheet for the review

```bash
npm install       # reproducible install from package-lock.json
npm run dev       # dev server, HMR
npm run build     # production bundle -> dist/
npm run preview   # serve the dist/ build locally
npm run lint       # ESLint, should report 0 errors
npm run format      # Prettier --write across the project
```
