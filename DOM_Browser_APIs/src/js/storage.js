// storage.js
// Wraps all Web Storage API (localStorage / sessionStorage) access in one
// place so the rest of the app never touches `localStorage` directly.
// This makes it easy to handle quota errors and (de)serialize JSON safely.

const NOTES_KEY_PREFIX = "notes_app:notes:";
const PREFS_KEY_PREFIX = "notes_app:prefs:";
const DRAFT_KEY_PREFIX = "notes_app:draft:";
const USERS_KEY = "notes_app:users";
const SESSION_KEY = "notes_app:session";

/** Safely parse JSON, returning a fallback value instead of throwing. */
function safeParse(raw, fallback) {
  if (raw === null || raw === undefined) return fallback;
  try {
    return JSON.parse(raw);
  } catch (err) {
    console.error("storage.js: failed to parse JSON", err);
    return fallback;
  }
}

function currentUserKey() {
  const session = safeParse(localStorage.getItem(SESSION_KEY), null);
  return session ? session.username : "guest";
}

/* ---------------------------------------------------------
 * Notes persistence (localStorage) — scoped per logged-in user
 * ------------------------------------------------------- */

export const saveNotes = (notes) => {
  try {
    const key = NOTES_KEY_PREFIX + currentUserKey();
    localStorage.setItem(key, JSON.stringify(notes));
    return true;
  } catch (err) {
    // Quota exceeded or storage disabled
    console.error("storage.js: could not save notes", err);
    return false;
  }
};

export const loadNotes = () => {
  const key = NOTES_KEY_PREFIX + currentUserKey();
  return safeParse(localStorage.getItem(key), []);
};

/* ---------------------------------------------------------
 * User preferences (theme, font) — localStorage
 * ------------------------------------------------------- */

export const savePreferences = (prefs) => {
  try {
    const key = PREFS_KEY_PREFIX + currentUserKey();
    localStorage.setItem(key, JSON.stringify(prefs));
    return true;
  } catch (err) {
    console.error("storage.js: could not save preferences", err);
    return false;
  }
};

export const loadPreferences = () => {
  const key = PREFS_KEY_PREFIX + currentUserKey();
  return safeParse(localStorage.getItem(key), { theme: "light", font: "sans" });
};

/* ---------------------------------------------------------
 * Draft autosave — sessionStorage (cleared when tab closes)
 * ------------------------------------------------------- */

export const saveDraft = (draft) => {
  try {
    const key = DRAFT_KEY_PREFIX + currentUserKey();
    sessionStorage.setItem(key, JSON.stringify(draft));
    return true;
  } catch (err) {
    console.error("storage.js: could not save draft", err);
    return false;
  }
};

export const loadDraft = () => {
  const key = DRAFT_KEY_PREFIX + currentUserKey();
  return safeParse(sessionStorage.getItem(key), null);
};

export const clearDraft = () => {
  const key = DRAFT_KEY_PREFIX + currentUserKey();
  sessionStorage.removeItem(key);
};

/* ---------------------------------------------------------
 * Mock authentication store (localStorage)
 * For learning purposes only — passwords are NOT hashed and this is
 * not a secure authentication system. Do not reuse in production.
 * ------------------------------------------------------- */

export const loadUsers = () => safeParse(localStorage.getItem(USERS_KEY), []);

export const saveUsers = (users) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export const getSession = () => safeParse(localStorage.getItem(SESSION_KEY), null);

export const setSession = (username) => {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ username }));
};

export const clearSession = () => {
  localStorage.removeItem(SESSION_KEY);
};
