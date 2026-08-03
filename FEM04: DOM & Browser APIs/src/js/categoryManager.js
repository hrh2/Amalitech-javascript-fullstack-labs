// categoryManager.js
// Owns the custom category data model: creating and listing the
// categories notes can be organized into. Assigning notes to a category
// and filtering by category are handled in later commits on this
// feature branch. Has no knowledge of the DOM — ui.js renders.

import { saveCategories, loadCategories } from "./storage.js";

/** Small fixed palette so category colors stay visually consistent. */
export const CATEGORY_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ec4899", // pink
];

export class Category {
  constructor(name, color = CATEGORY_COLORS[0]) {
    this.id = generateId();
    this.name = name;
    this.color = color;
  }
}

function generateId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `category_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/** In-memory cache of all categories for the current user. */
let categories = [];

export const initCategories = () => {
  categories = loadCategories();
  return categories;
};

export const getCategories = () => categories;

export const getCategoryById = (id) => categories.find((c) => c.id === id) || null;

export const categoryNameExists = (name) => {
  const clean = name.trim().toLowerCase();
  return categories.some((c) => c.name.trim().toLowerCase() === clean);
};

/**
 * Creates a new custom category, guarding against blank names and
 * case-insensitive duplicates.
 *
 * @param {string} name
 * @param {string} [color] one of CATEGORY_COLORS
 * @returns {{ ok: true, category: Category } | { ok: false, error: string }}
 */
export const createCategory = (name, color = CATEGORY_COLORS[0]) => {
  const clean = name.trim();
  if (!clean) {
    return { ok: false, error: "Category name can't be empty." };
  }
  if (categoryNameExists(clean)) {
    return { ok: false, error: "A category with that name already exists." };
  }

  const category = new Category(clean, color);
  categories.push(category);
  saveCategories(categories);
  return { ok: true, category };
};
