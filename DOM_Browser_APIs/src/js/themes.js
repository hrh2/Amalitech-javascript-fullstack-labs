// themes.js
// Applies and persists the color theme (light/dark) and font theme
// (sans/serif/mono) by toggling data-attributes on <html>, which the
// CSS custom properties in variables.css key off of.

import { savePreferences, loadPreferences } from "./storage.js";

const root = document.documentElement;

export const applyTheme = (themeName) => {
  root.setAttribute("data-theme", themeName);
  const prefs = loadPreferences();
  savePreferences({ ...prefs, theme: themeName });
};

export const applyFont = (fontName) => {
  root.setAttribute("data-font", fontName);
  const prefs = loadPreferences();
  savePreferences({ ...prefs, font: fontName });
};

/** Call once on page load to restore the user's saved preferences. */
export const initTheme = () => {
  const prefs = loadPreferences();
  applyTheme(prefs.theme || "light");
  applyFont(prefs.font || "sans");
  return prefs;
};
