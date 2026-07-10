# DOM & Browser APIs: Note Taking App
## Learning Objectives

* **DOM Manipulation:** Dynamically create, read, update, and delete elements in the Document Object Model using JavaScript.
* **Event Handling:** Implement event listeners for user interactions and utilize event bubbling/delegation for efficient event management.
* **Browser APIs:** Work with `localStorage` for data persistence, `sessionStorage` for temporary data, and the Geolocation API for location-based features.
* **Interactive Web Development:** Build responsive, interactive web experiences by combining DOM manipulation, event handling, and browser APIs.
* **Form Validation:** Implement client-side validation with dynamic feedback messages.
* **Accessibility:** Ensure keyboard navigation and proper focus management for all interactive elements.

## Introduction

You will build a Note-Taking Web App that allows users to create, organize, and manage their notes with features like tagging, archiving, and searching. The focus is on mastering DOM manipulation, implementing efficient event handling patterns, utilizing browser storage APIs, and creating an accessible, interactive user experience.

## Project Setup

### 1. Design the UI

* Design the UI to match the Figma design provided.

### 2. Set Up the JavaScript Codebase

* Structure code using ES6 modules (`storage.js`, `noteManager.js`, `ui.js`, `themes.js`).
* Set up HTML structure with semantic elements.
* Create CSS for base styling and theme variations.
* Initialize project with necessary files and folder structure.

### 3. Plan Core Features

* Identify DOM elements that need manipulation.
* Map out event listeners needed (clicks, inputs, keyboard events).
* Design data structure for notes (objects with `id`, `title`, `content`, `tags`, `archived`, `timestamp`, `location`).
* Plan `localStorage` schema for notes and user preferences.

## Tasks

### 1. JavaScript Functionality Implementation

#### A. Note CRUD Operations (DOM Manipulation)

**Create Notes**

* Capture form input (title, content, tags).
* Generate unique note IDs.
* Dynamically create note DOM elements.
* Append notes to the display area.
* Clear form after submission.

**Read/Display Notes**

* Retrieve notes from `localStorage` on page load.
* Render notes dynamically in the DOM.
* Display note metadata (date, tags, location if available).

**Update Notes**

* Enable inline editing or modal-based editing.
* Update DOM elements in real-time.
* Sync changes to `localStorage`.

**Delete Notes**

* Remove note elements from DOM.
* Delete from `localStorage`.
* Show confirmation before deletion (optional).

#### B. Archive & Organization Features

**Archive System**

* Toggle archive status on notes.
* Show/hide archived notes.
* Update DOM classes to reflect archived state.

**Tag System**

* Add multiple tags to notes.
* Display all unique tags in sidebar.
* Filter notes by selected tag.
* Dynamically update tag list as notes change.

**Search Functionality**

* Search by title, content, and tags.
* Filter and display matching notes in real time.
* Highlight search terms (bonus).

#### C. Event Handling Implementation

**Event Listeners**

* Form submit for note creation.
* Click events for edit, delete, archive buttons.
* Input events for search field.
* Change events for theme and font selectors.
* Click events for tag filters and navigation.

**Event Delegation**

* Use event bubbling on note container.
* Single listener for all note actions (edit, delete, archive).
* Identify target note using `event.target` and data attributes.

**Keyboard Navigation**

* Tab through all interactive elements.
* Enter key to submit forms.
* Escape key to close modals/cancel edits.
* Arrow keys for navigation (bonus).
* Ensure proper focus management.

#### D. Browser APIs Integration

**localStorage**

* Save all notes as JSON.
* Persist user preferences (theme, font).
* Load data on page initialization.
* Update storage on every change.
* Handle `localStorage` quota errors.

**sessionStorage**

* Auto-save draft notes while typing.
* Restore unsaved drafts on page reload.
* Clear drafts after successful save.

**Geolocation API (Bonus)**

* Request user location permission.
* Add location data to notes (city, coordinates).
* Display location tags on notes.
* Handle permission denials gracefully.

#### E. Form Validation

* Check for required fields (title minimum).
* Display error messages dynamically in DOM.
* Disable submit until form is valid.
* Show success feedback after note creation.
* Validate on blur and on submit.

#### F. Theme & Customization

**Color Theme System**

* Implement light and dark themes.
* Toggle theme by adding/removing CSS classes.
* Save preference to `localStorage`.
* Apply saved theme on page load.

**Font Theme System**

* Offer serif, sans-serif, and monospace options.
* Update `font-family` on body or root element.
* Persist selection in `localStorage`.

### 2. ES6 Module Organization

**storage.js**

```js id="stg001"
export const saveNotes = (notes) => { ... }
export const loadNotes = () => { ... }
export const savePreferences = (prefs) => { ... }
export const loadPreferences = () => { ... }
export const saveDraft = (draft) => { ... }
export const loadDraft = () => { ... }
```

**noteManager.js**

```js id="ntm002"
export class Note {
  constructor(title, content, tags) { ... }
  archive() { ... }
  addTag(tag) { ... }
}

export const createNote = (title, content, tags) => { ... }
export const deleteNote = (id) => { ... }
export const updateNote = (id, updates) => { ... }
export const searchNotes = (query) => { ... }
export const filterByTag = (tag) => { ... }
```

**ui.js**

```js id="ui003"
export const renderNote = (note) => { ... }
export const renderAllNotes = (notes) => { ... }
export const showValidationError = (field, message) => { ... }
export const updateTagList = (tags) => { ... }
export const toggleArchiveView = () => { ... }
```

**themes.js**

```js id="thm004"
export const applyTheme = (themeName) => { ... }
export const applyFont = (fontName) => { ... }
```

**main.js**

```js id="main005"
import * as storage from './storage.js';
import * as noteManager from './noteManager.js';
import * as ui from './ui.js';
import * as themes from './themes.js';
// Initialize app, set up event listeners
```

### 3. Accessibility Implementation

* Ensure all interactive elements are keyboard accessible.
* Add ARIA labels where needed.
* Manage focus when opening/closing modals.
* Provide visible focus indicators.
* Ensure color contrast meets WCAG standards.
* Test complete app flow using only keyboard.

### 4. Responsive Design

* Implement mobile-friendly layout.
* Use CSS Grid or Flexbox for responsive note grid.
* Ensure touch-friendly button sizes on mobile.
* Test on various screen sizes.
* Optimize for both portrait and landscape orientations.

## Evaluation Criteria

| Criteria                       | Score | Description                                                                                                                                                                                                    |
| ------------------------------ | ----: | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DOM Manipulation               |   25% | Effectively creates, reads, updates, and deletes DOM elements dynamically. Properly manages note rendering, form handling, and dynamic content updates.                                                        |
| Event Handling                 |   25% | Successfully implements various event listeners (click, input, submit, keyboard). Demonstrates proper use of event delegation/bubbling for efficient event management.                                         |
| Browser APIs Integration       |   20% | Properly uses `localStorage` for data persistence, `sessionStorage` for draft management, and implements at least one additional browser API (e.g., geolocation). Handles errors and edge cases appropriately. |
| Code Organization & Modules    |   15% | Demonstrates clear code structure with well-organized ES6 modules and proper use of `import`/`export` to ensure modular, maintainable, and reusable code.                                                      |
| Interactive Features & UX      |   10% | Successfully implements core features (CRUD, archive, tags, search, themes). Creates smooth, responsive user experience with proper validation and feedback.                                                   |
| Accessibility & Responsiveness |    5% | Ensures keyboard navigation works throughout the app, implements proper focus management, and creates a responsive design that works across different device sizes.                                            |

## Bonus Challenges (Optional)

* **Rich Text Editor:** Implement basic formatting (bold, italic, lists) using `contenteditable`.
* **Note Categories/Folders:** Add hierarchical organization beyond tags.
* **Export/Import:** Allow users to export notes as JSON or import from file.
* **Drag & Drop:** Reorder notes or drag to archive.
* **Markdown Support:** Parse and render markdown in note content.
* **Note Sharing:** Generate shareable links for individual notes.
* **Dark Mode Auto-Detection:** Use `prefers-color-scheme` media query.
* **PWA Features:** Add service worker for offline capability.
