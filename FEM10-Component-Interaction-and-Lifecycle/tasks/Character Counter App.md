# Component Interaction & Lifecycle: Character Counter App

## Learning Objectives

By the end of this lab, learners will be able to:

- Build a small multi-component Angular application that demonstrates clear parent-child communication.
- Use @Input() and @Output() to pass data and emit events between components.
- Apply Angular lifecycle hooks (ngOnInit, ngOnChanges, and ngOnDestroy) to handle component initialization, updates, and cleanup.
- Structure an Angular application for readability, reusability, and maintainability.
- Implement change detection to ensure the UI responds to user input in real-time.

### Project Requirements

**Your users should be able to:**

- Type text and instantly see **character, word, and sentence counts**.
- Choose whether to **include or exclude spaces** in the character count.
- Set a **character limit** and receive a **warning message** when the limit is exceeded.
- View the **approximate reading time** of their text.
- Analyze **letter density** (percentage of alphabetic characters).
- Toggle between **light and dark themes**.
- Navigate the entire app using **keyboard controls**.
- Experience a **responsive layout** that adapts across screen sizes.
- See **hover and focus states** for all interactive elements.

## Introduction

In this lab, you will build a **Character Counter Application** that helps users analyze and manage their written text. The app will display character, word, and sentence counts, enforce character limits, and provide real-time feedback using Angular's component communication patterns.

This project emphasizes **component hierarchy, parent-child data flow**, and the use of **lifecycle hooks** for managing updates and cleanup. Learners will demonstrate mastery of Angular's @Input() and @Output() decorators, change detection, and component structuring best practices.


## Project Setup

- Create a new Angular project using the CLI.
- Generate the components listed above.
- Establish a basic layout with a parent container and child components.

  
## Tasks

### Implement Component Interaction

- Pass data from the parent to child components using @Input().
- Emit user interactions (e.g., new limit, theme change) from child to parent using @Output() and EventEmitter.

### Use Lifecycle Hooks

- Implement ngOnInit for initialization tasks.
- Use ngOnChanges to react to updates (e.g., when the text or limit changes).
- (Optional) Add ngOnDestroy for cleanup if event subscriptions or timers are used.

### Enhance User Experience

- Style the interface with consistent spacing, color contrast, and hover states.
- Ensure responsiveness using CSS Grid or Flexbox.
- Add keyboard navigation and focus indicators.

### Testing & Knowledge Check

- Verify that communication between components works as expected.
- Test how the app behaves when exceeding the character limit.
- Use console.log() or Angular DevTools to inspect change detection behavior.


## Evaluation Criteria

| Criteria | Weight | Description |
|---|---|---|
| Component Interaction | 30% | Proper use of @Input() and @Output() for data flow |
| Lifecycle Hooks | 20% | Correct and meaningful implementation of hooks |
| Functionality | 20% | All key features (limits, counts, warnings, theme) work as intended |
| Code Quality | 15% | Clean, modular, and well-structured code |
| Responsiveness & Accessibility | 10% | Works across screen sizes and supports keyboard navigation |
| UI Polish | 5% | Visual design, hover/focus states, and overall user experience |

## Deliverables

- A functional, multi-component Angular app that meets all requirements.
- Proper use of @Input() and @Output() for component communication.
- Clean, modular code with meaningful component separation and naming.
- Demonstration of at least two lifecycle hooks.
- Responsive and accessible UI with complete interactivity.
