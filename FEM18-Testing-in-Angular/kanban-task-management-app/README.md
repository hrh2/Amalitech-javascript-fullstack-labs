# Kanban Task Management App

A small Kanban board manager built while learning Angular. This is the FEM18 ("Testing in Angular") build on top of the FEM17 ("HTTP & API Integration") app: boards
and tasks now live behind a REST API (a MockAPI project) and the app does full CRUD against it with `HttpClient`.
See `../notes/FEM18-Testing-with-Jest.md` for the testing write-up and `../../FEM17-HTTP-APIs/notes/FEM17-HTTP-API-Integration.md` for the API integration.

## Running it

```bash
npm install
npm start     # Angular dev server on http://localhost:4200
```

The data lives on MockAPI (`boards` and `tasks` resources). Its base URL is `apiUrl` in `src/environments/`
(`environment.development.ts` for `ng serve`, `environment.ts` for production builds).

## Testing

Tests use **Jest** (`jest` + `jest-preset-angular`) instead of Angular's default runner.

```bash
npm test                  # run everything once
npm run test:watch        # re-run on save
npm run test:coverage     # run + coverage report (fails if below the thresholds)
npx jest board-list       # only files whose path matches "board-list"
```

The coverage summary prints in the terminal; the full HTML report is written to `coverage/lcov-report/index.html`.
Thresholds (in `jest.config.ts`): 95% statements/functions/lines, 85% branches.

**Conventions**
- A test sits next to the file it tests: `task.service.ts` -> `task.service.spec.ts`. Cross-cutting tests that use
  several real parts together are named `*.integration.spec.ts`.
- `describe('<ClassName>')`, then `it('does X when Y')` written as a sentence about behaviour, not implementation.
- Shared helpers live in `src/app/testing/` (`fixtures.ts` builds sample boards/tasks, `mocks.ts` builds service mocks).
- Network is never real: services are tested with `HttpTestingController`, components with mocked services.
- New feature or bug fix? Write the failing test first, then the code (see the TDD section in the notes).

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.2.21.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
