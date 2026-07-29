# Notes — Note Taking Web App

A DOM & Browser APIs lab project: a note-taking app for creating, tagging,
searching, and archiving notes, built with vanilla JavaScript ES6 modules,
semantic/accessible HTML, and the design system from the provided Figma file.

## Running it

Because the app uses native ES6 modules (`import`/`export`), it must be
served over HTTP — opening `index.html` directly via `file://` will be
blocked by the browser's CORS policy for modules.

From the project folder, run any static file server, for example:

```bash
npx serve .
# or
python3 -m http.server 8080
```

Then open the printed URL (e.g. `http://localhost:8080`). You'll land on
the sign-up flow first — create an account (stored locally in your
browser) to reach the note-taking app.

## Project structure

```
note-taking-app/
├── index.html              All Notes app shell (list + editor + actions)
├── login.html               Log in
├── signup.html               Create account
├── forgot-password.html      Request a reset link
├── reset-password.html       Choose a new password
├── css/
│   ├── variables.css        Design tokens: color, radius, spacing, type
│   ├── base.css              Reset + global typography + focus styles
│   ├── components.css        Buttons, inputs, tags, modals, toast, dropdown
│   ├── layout.css             App shell grid + responsive breakpoints
│   └── auth.css                Auth screen layout
└── js/
    ├── storage.js             localStorage / sessionStorage wrapper
    ├── noteManager.js         Note model + CRUD/search/filter logic
    ├── ui.js                    DOM rendering, toasts, modal focus-trapping
    ├── themes.js                Color theme + font theme application
    ├── auth.js                   Mock (front-end only) authentication
    ├── icons.js                   Inline SVG icon set
    └── main.js                    App state + event wiring (entry point)
```

## Feature checklist

**DOM manipulation (CRUD)**
- Create, read, update, and delete notes, all rendered dynamically from
  the in-memory `notes` array in `noteManager.js` and reflected instantly
  in the DOM by `ui.js`.

**Archive & organization**
- Archive / restore notes via confirmation modals; a dedicated
  "Archived Notes" view; a live, deduplicated tag list in the sidebar;
  click-to-filter by tag ("Notes Tagged: `X`"); real-time search across
  title, content, and tags with `<mark>` highlighting of matches.

**Event handling**
- Form `submit`, `click`, `input`, and `change` listeners throughout.
- **Event delegation**: the note list and both tag lists use a single
  listener on their parent `<ul>` (via `event.target.closest(...)`)
  rather than one listener per item.
- **Keyboard support**: <kbd>Tab</kbd> order follows the visual layout,
  <kbd>Enter</kbd> saves the note or submits a form, <kbd>Escape</kbd>
  closes any open modal or cancels an in-progress edit, and modals trap
  focus (<kbd>Tab</kbd>/<kbd>Shift+Tab</kbd> cycle only within the
  dialog) and restore focus to the triggering element on close.

**Browser APIs**
- `localStorage`: notes and user preferences (theme/font), scoped per
  logged-in user.
- `sessionStorage`: drafts of in-progress notes autosave as you type and
  are restored (with a toast + "Discard" action) if the tab reloads
  before you save; cleared automatically once a note is saved.
- `Geolocation API` (bonus): "Add my location" attaches coordinates to a
  note and gracefully reports permission denial or timeouts via toast.

**Form validation**
- Title is required; Save is blocked and an inline, `role="alert"` error
  is shown until a title is entered; validated on blur and on submit
  attempt.

**Theming**
- Light/dark color theme and sans/serif/mono font theme, both persisted
  to `localStorage` and re-applied on load via `data-theme` /
  `data-font` attributes that the CSS custom properties key off of.

**Accessibility**
- Semantic landmarks (`header`/`nav`/`main`/`aside`/`section`), a
  "skip to note content" link, labelled form fields, `aria-current` for
  active nav/tag/note state, `aria-live` toast region, `role="dialog"`
  / `alertdialog` modals with focus trapping, visible focus rings
  everywhere, and `prefers-reduced-motion` support.

**Responsive design**
- Desktop: 3-pane layout (sidebar, list, editor + actions column).
- Tablet: 2-pane layout, action buttons collapse into header icons.
- Mobile: single-pane view switched by a bottom tab bar (Home, Search,
  Archived, Tags, Settings) plus a floating "create note" button, with
  a "Go Back" affordance in the editor header.

## A note on authentication

The sign-up/login/forgot/reset-password screens are implemented
front-end-only, storing users in `localStorage` in plain text purely so
the screens from the design have something to do. **This is not secure
and must never be used as a real authentication system** — a production
app needs a real backend, hashed passwords, and server-side sessions.
