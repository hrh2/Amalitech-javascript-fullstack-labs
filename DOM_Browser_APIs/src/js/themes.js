// themes.js
// Applies and persists the color theme (light/dark/system) and font
// theme (sans/serif/mono) by toggling data-attributes on <html>, which
// the CSS custom properties in variables.css key off of.
//
// The user's *preference* (light | dark | system) is stored separately
// from the *resolved* theme actually painted on screen, because
// "system" needs to keep tracking the OS-level color scheme live.

import { savePreferences, loadPreferences } from "./storage.js";

const root = document.documentElement;
const darkMediaQuery = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;

function resolveTheme(pref) {
  if (pref === "system") {
    return darkMediaQuery && darkMediaQuery.matches ? "dark" : "light";
  }
  return pref === "dark" ? "dark" : "light";
}

/** themeName is the user's preference: 'light' | 'dark' | 'system'. */
export const applyTheme = (themeName) => {
  root.setAttribute("data-theme-pref", themeName);
  root.setAttribute("data-theme", resolveTheme(themeName));
  const prefs = loadPreferences();
  savePreferences({ ...prefs, theme: themeName });
};

export const applyFont = (fontName) => {
  root.setAttribute("data-font", fontName);
  const prefs = loadPreferences();
  savePreferences({ ...prefs, font: fontName });
};

export const getThemePref = () => root.getAttribute("data-theme-pref") || "light";
export const getFontPref = () => root.getAttribute("data-font") || "sans";

/** Call once on page load to restore the user's saved preferences. */
export const initTheme = () => {
  const prefs = loadPreferences();
  applyTheme(prefs.theme || "light");
  applyFont(prefs.font || "sans");

  // If the user picked "System", keep following the OS theme live.
  darkMediaQuery?.addEventListener("change", () => {
    if (getThemePref() === "system") {
      root.setAttribute("data-theme", resolveTheme("system"));
    }
  });

  return prefs;
};
