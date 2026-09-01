# Angular Signals: Reactive Recipe Finder
## Introduction

In this lab, learners will build a simplified **Recipe Finder** application using **Angular Signals** to manage reactive state.

The project focuses on creating a responsive, interactive interface where users can search and filter recipes — all powered by **Signals**, `computed()`, and `effect()`.

## Scenario

Your challenge is to build a reactive Recipe Finder interface where users can:

- View a list of recipes
- Search by name or ingredient
- Filter recipes by maximum cook time
- See dynamic updates instantly as they type or adjust filters

You'll manage all app state using Angular's **Signals API** — no RxJS or external state management libraries.

## Requirements

### Functional Requirements

- Display a list of recipes (use a static array of recipe objects — name, ingredients, cookTime, image).
- Add a **search input** that filters recipes by name or ingredient.
- Add a **slider or numeric input** to filter recipes by maximum cook/prep time.
- Show the total number of filtered recipes (using `computed()`).
- Automatically update the visible list whenever the user changes search or filter values.
- Show a placeholder message when no recipes match.
- Log changes to filters or search queries using an `effect()` (e.g., console log or toast message).

### UI Requirements

- Clean, card-based layout showing recipe image, title, and prep time.
- Responsive layout (single column on mobile, grid on larger screens).
- Hover/focus states for buttons or filters.
- Consistent color scheme and typography.

## Technical Guidelines

- Use `signal()` to hold the recipes array, search query, and filter value.
- Use `computed()` to derive the filtered list of recipes dynamically.
- Use `effect()` to perform side effects (e.g., log state changes or sync filters).
- No routing, services, or async API calls — use static data defined in the component file.

## Stretch Goals (Optional)

- Add a "favorites" toggle using another signal.
- Persist search/filter state using localStorage via an `effect()`.
- Add sorting (e.g., by shortest cook time first).
- Add a light/dark theme toggle managed by a signal.

## Evaluation Criteria

| Criterion | Weight | Performance Indicators |
|---|---|---|
| Signal Usage | 30% | Uses `signal()` appropriately to store and update app state. |
| Computed & Derived State | 25% | Implements `computed()` correctly for filtering or totals. |
| Effects & Reactivity | 20% | Uses `effect()` for reactive side effects (logs, UI feedback, persistence). |
| UI Responsiveness & Accessibility | 15% | Clean, responsive layout with clear hover/focus states. |
| Code Quality & Structure | 10% | Organized, readable, and maintainable component code. |
