# Phase-One Technical Interview — Scenario-Based Preparation Guide
**For: Full-Stack JavaScript Developer (Angular/TypeScript focus)**
**Framework: Problem Decomposition & Planning · Debugging, Testing & Self-Correction · Trade-off Analysis & Contextual Clarity**

---

## How to use this guide

Your interview does not grade the final answer. It grades **how you get there**. Every scenario below is built the same way: a realistic problem → what's actually being tested → how a strong engineer thinks before speaking → a spoken answer you can adapt → the technical process → the concepts behind it → alternatives → common mistakes → vocabulary → likely follow-ups.

Don't memorize the "professional answer" word for word. Learn the **reasoning shape**. If you internalize the shape, you can handle a scenario that isn't even in this document.

---

# SECTION A — Angular / Frontend Scenarios

## Scenario 1 — Dashboard Gets Slower as Data Grows

### 1. Interviewer question
"We have a dashboard that renders fine with test data, but users report it becomes noticeably slower as their dataset grows. How would you investigate and improve it?"

### 2. What the interviewer is testing
Primarily **Problem Decomposition & Planning** (how you structure an open-ended performance investigation) and **Debugging, Testing & Self-Correction** (whether you look for evidence before changing code). They want to see you avoid guessing.

### 3. Strong candidate thinking process
- What does "slower" mean concretely — initial load, scrolling, interaction lag, or all three?
- How much data are we talking about — hundreds of rows or hundreds of thousands?
- Is this Angular change detection running too often, DOM size, or an expensive computation?
- What should I measure before touching any code — Chrome DevTools Performance tab, Angular DevTools change-detection profiler, network waterfall?
- Is the data rendered in a table/list — if so, is virtualization already in place?
- Are there `*ngFor` loops without `trackBy`, causing full re-renders?
- Is `ChangeDetectionStrategy.OnPush` being used, or is the whole tree checked on every event?

### 4. Professional answer
"Before I change anything, I'd want to reproduce the slowdown with a realistic data volume and actually profile it, because 'slow' can come from very different root causes — layout thrashing, change detection running too often, or just too many DOM nodes. I'd open Angular DevTools' profiler first to see if change detection cycles are unusually frequent or expensive. If I see the whole component tree re-checking on every user action, I'd look at whether we're using default change detection everywhere and whether a `trackBy` function is missing on the `*ngFor`, which would force Angular to destroy and recreate DOM nodes instead of reusing them. If the dataset itself is large — say, thousands of rows — I'd consider virtual scrolling with the CDK so we only render what's visible. I'd also check whether any expensive computation, like a filter or sort, is being called directly in the template, because that gets re-executed on every change detection cycle. Once I have a hypothesis, I'd fix one thing, re-measure, and confirm the improvement before moving to the next optimization — I wouldn't change five things at once, because then I can't tell what actually helped."

### 5. Step-by-step technical approach
1. Reproduce with realistic data volume.
2. Profile with Angular DevTools + Chrome Performance tab.
3. Identify whether the bottleneck is change detection frequency, DOM size, or computation cost.
4. Form a hypothesis (e.g., "missing trackBy causes full list re-render").
5. Isolate by testing one fix in isolation.
6. Verify the fix against the profiler, not assumption.
7. Apply incrementally: `trackBy`, `OnPush`, virtual scrolling, memoized selectors.
8. Add a performance-oriented test or benchmark if the team has one.
9. Monitor real-world behavior post-deploy if possible.

### 6. Technical concepts behind the answer
- **Change detection**: Angular's default strategy checks the entire component tree on every event; `OnPush` limits checks to input reference changes.
- **trackBy**: tells Angular how to identify list items so it can reuse DOM nodes instead of recreating them.
- **Virtual scrolling**: only renders DOM elements for visible rows (CDK `cdk-virtual-scroll-viewport`).
- **Template expression cost**: any function called in a template re-runs on every check cycle — expensive logic belongs in a memoized property or pipe.

### 7. Alternatives and trade-offs
- **OnPush + immutable data** — very effective, but requires discipline across the codebase (all state updates must produce new references). Good long-term investment.
- **Virtual scrolling** — solves DOM-size problems well, but adds complexity for variable-height rows and can complicate scroll-to-item features.
- **Pagination instead of virtualization** — simpler to implement, but changes UX (user loses "infinite scroll" feel). Good when backend can paginate cheaply.
The right choice depends on whether the pain is DOM volume or logic cost, and how much the team can refactor right now versus later.

### 8. What could go wrong?
Jumping straight to "let's just add pagination" or "let's memoize everything" without profiling first. Changing multiple things simultaneously so the real cause is never confirmed. Ignoring that "slow" might mean something totally different (e.g., a slow API call, not rendering at all).

### 9. Interview signals / keywords
Use *change detection*, *trackBy*, *OnPush*, *reference equality*, *virtual scrolling*, *profiling* — but only attach them to the specific mechanism you're describing, not as a list.

### 10. Follow-up questions
- "What if OnPush doesn't help because the array reference changes every time anyway?" → Talk about ensuring state updates are truly immutable (not mutating and reassigning the same array in place).
- "What if the slowdown is actually in the API response time, not rendering?" → Show you'd check the network tab first, not assume it's frontend.
- "The team refuses to refactor to OnPush right now — what do you do?" → Discuss incremental, low-risk wins first (trackBy, virtual scroll) before the bigger architectural change.

---

## Scenario 2 — Component Receives Data But UI Doesn't Update

### 1. Interviewer question
"A component clearly receives new data — you've verified it in the debugger — but the screen doesn't reflect the change. How would you investigate?"

### 2. What the interviewer is testing
**Debugging, Testing & Self-Correction.** They want to see systematic isolation, not random guessing ("maybe try ChangeDetectorRef.detectChanges()").

### 3. Strong candidate thinking process
- Is this `OnPush` change detection, and is the input a new reference or a mutated existing object?
- Is the data coming from an `@Input()`, a service, a signal, or an observable in the template with `async`?
- Is the update happening outside Angular's zone (e.g., a third-party callback, a WebSocket handler)?
- Am I mutating an array/object in place instead of creating a new one?
- Does the template actually bind to the right property, or is there a typo/stale reference?

### 4. Professional answer
"First I'd confirm the strategy the component uses. If it's `OnPush`, Angular only re-renders when an `@Input()` reference changes or an event originates inside the component — so my first hypothesis would be that the parent is mutating the existing object or array instead of replacing it, meaning the reference never actually changes and Angular has no signal to re-check. I'd check that in the parent — is it doing `array.push()` or is it doing `array = [...array, newItem]`? If the data comes through a service and an RxJS stream instead, I'd check whether the update happens outside the Angular zone, for example inside a raw `setTimeout` from a third-party library or a WebSocket callback that isn't zone-patched — in that case Angular literally doesn't know a change happened. Depending on what I find, the fix is either enforcing immutable updates, running the update inside `NgZone.run()`, or in specific justified cases manually calling `markForCheck()`. I'd avoid reaching for `detectChanges()` as a blanket fix, because that usually masks the real issue instead of resolving it."

### 5. Step-by-step technical approach
1. Confirm change detection strategy (default vs OnPush).
2. Check whether the input reference actually changes.
3. Check where the update originates (inside/outside Angular zone).
4. Isolate with a minimal reproduction (log before/after reference).
5. Form and confirm hypothesis.
6. Apply the correct fix (immutability fix, zone fix, or targeted `markForCheck`).
7. Verify the fix works without needing manual `detectChanges()` calls sprinkled everywhere.
8. Add a regression test if feasible.

### 6. Technical concepts behind the answer
- **OnPush + reference equality**: OnPush skips checks unless input references change.
- **NgZone**: Angular patches async APIs to know when to run change detection; some third-party code bypasses this.
- **Immutability**: replacing objects/arrays instead of mutating them is what makes reference-based checks reliable.

### 7. Alternatives and trade-offs
- **Fix the data flow to be immutable** — correct long-term fix, but may require touching multiple places that mutate state.
- **Wrap the async callback in `NgZone.run()`** — right choice when the issue is genuinely a zone boundary problem, but doesn't fix an underlying mutation habit if that's the actual cause.
- **Switch to Signals** — Angular Signals track dependencies directly and sidestep a lot of this class of bug, worth mentioning as a longer-term architectural option.

### 8. What could go wrong?
Reaching for `ChangeDetectorRef.detectChanges()` immediately without understanding why it was needed — this hides bugs and can cause performance issues (checking too often) or `ExpressionChangedAfterItHasBeenCheckedError`.

### 9. Interview signals / keywords
*Reference equality*, *zone*, *OnPush*, *immutability*, *root cause vs symptom fix*.

### 10. Follow-up questions
- "What if `markForCheck()` fixes it — is that a good enough fix?" → Explain it can be acceptable but you'd still want to understand *why* it was needed, in case it signals a broader mutation problem.
- "How would Signals change this scenario?" → Signals re-run dependents automatically when the signal value changes, removing the OnPush/reference pitfall entirely.

---

## Scenario 3 — Memory Leak From Unsubscribed Observables

### 1. Interviewer question
"After users navigate through the app for a while, the browser tab starts consuming more and more memory, and eventually things get sluggish. What's your approach?"

### 2. What the interviewer is testing
**Debugging, Testing & Self-Correction**, with some **Trade-off Analysis** on subscription-management strategy.

### 3. Strong candidate thinking process
- Is this really a memory leak or just normal growth (cache, logs)? I need evidence, not assumption.
- Where would I look first — Chrome's Memory tab, taking heap snapshots before/after navigating the same route repeatedly?
- If snapshots show detached DOM nodes or growing subscriber counts, which components subscribe to observables in `ngOnInit` without unsubscribing in `ngOnDestroy`?
- Are there long-lived services (singletons) holding subscriptions that reference destroyed components?
- Is this an event listener leak (native DOM listeners) rather than RxJS?

### 4. Professional answer
"I wouldn't assume it's RxJS just because that's the usual suspect — I'd first confirm it's an actual leak by taking two heap snapshots in Chrome DevTools after navigating to and away from the same route several times, and comparing retained memory. If I see detached DOM trees or a growing number of subscribers, that points to components not cleaning up. My next step is to look at which components subscribe manually with `.subscribe()` instead of using the `async` pipe, especially ones subscribing to a shared, long-lived service's observable. The async pipe unsubscribes automatically when the component is destroyed, so manual subscriptions are usually where this breaks — either missing a `takeUntil(this.destroy$)` pattern or missing `ngOnDestroy` entirely. I'd fix the specific leaking subscriptions first, re-run the same heap snapshot comparison to confirm memory is actually released, and only then look at whether this pattern repeats elsewhere in the codebase, because it often does."

### 5. Step-by-step technical approach
1. Confirm the leak with heap snapshots (before/after repeated navigation).
2. Identify growing objects (detached DOM, subscriber count).
3. Search for manual `.subscribe()` calls without teardown.
4. Isolate one component, add a fix, and re-measure.
5. Apply consistent teardown pattern (`takeUntil`, `async` pipe, or `DestroyRef` with Angular's `takeUntilDestroyed()`).
6. Sweep the codebase for the same anti-pattern.
7. Add lint rule or code review guideline if the team lacks one.

### 6. Technical concepts behind the answer
- **Memory leak**: memory that should be reclaimed after a component is destroyed but isn't, because something still holds a reference to it.
- **Subscription lifecycle**: an RxJS subscription keeps a reference to its subscriber (often the component) until unsubscribed.
- **async pipe**: automatically manages subscribe/unsubscribe tied to the component's lifecycle.
- **takeUntilDestroyed()**: modern Angular utility tied to `DestroyRef` for automatic teardown.

### 7. Alternatives and trade-offs
- **`async` pipe wherever possible** — simplest, least error-prone, but not always applicable when you need imperative access to the value.
- **`takeUntil(destroy$)` pattern** — flexible and explicit, but requires discipline (every subscription must include it) and boilerplate.
- **`takeUntilDestroyed()`** — less boilerplate, modern Angular, but requires the injection context or explicit `DestroyRef`.

### 8. What could go wrong?
Assuming it's a leak without evidence and refactoring randomly. Fixing only the component the interviewer describes without checking whether the same pattern is repeated elsewhere. Confusing normal memory growth (e.g., caching) with an actual leak.

### 9. Interview signals / keywords
*Heap snapshot*, *detached DOM nodes*, *subscription lifecycle*, *teardown*, *root cause vs single instance fix*.

### 10. Follow-up questions
- "What if the leak is in a shared singleton service instead of a component?" → Discuss that the service itself needs to manage its own subscriptions carefully since it never gets destroyed, so listeners inside it need explicit unsubscribe logic, not per-component cleanup.
- "How would you prevent this class of bug going forward?" → Mention lint rules, code review checklist, or preferring reactive templates (`async` pipe/signals) over manual subscriptions as a team convention.

---

## Scenario 4 — Ambiguous Component Communication Requirement

### 1. Interviewer question
"The product owner asks for a 'notification badge' that several unrelated parts of the app need to update and read from. How would you approach designing this?"

### 2. What the interviewer is testing
Primarily **Problem Decomposition & Planning**, with **Trade-off Analysis** for the state-sharing mechanism chosen.

### 3. Strong candidate thinking process
- What's actually ambiguous here? Who updates the badge, how many places read it, does it need to persist across page reloads, is there a backend source of truth?
- Do these components have a parent-child relationship, or are they scattered across unrelated feature modules?
- Is this a case for `@Input()`/`@Output()`, a shared service with a subject/signal, or a full state-management library?
- What's the expected data volume and update frequency — is this over-engineering territory or genuinely complex shared state?

### 4. Professional answer
"Before designing anything, I'd clarify a few things with the product owner or tech lead: is the badge count coming from the backend in real time, or computed client-side from data we already have? And which components need to read or write it — are they nested, or completely separate feature areas? If it's a small, isolated piece of shared state read/written by several unrelated components, I wouldn't reach for a full state management library — that's usually over-engineering for one badge. I'd create a small, focused service holding either a `BehaviorSubject` or, in a newer Angular codebase, a signal, exposing a read-only observable/signal and explicit methods to update it, so components can't just mutate shared state directly — that keeps the data flow predictable. If it turns out multiple pieces of related state need to interact (unread counts, notification list, filters), then I'd reconsider and look at a proper state management approach. I'd rather start simple and evolve than add complexity upfront for a single badge."

### 5. Step-by-step technical approach
1. Clarify scope: data source, update frequency, consuming components.
2. Decide scope of the "shared state" — isolated value vs part of a larger domain.
3. Design a minimal service API (read-only stream + update methods).
4. Implement using `BehaviorSubject` or Signals depending on the codebase's direction.
5. Add tests for the service logic independent of components.
6. Wire components to the service via `async` pipe or signal reads.
7. Revisit if the scope grows (multiple related pieces of state).

### 6. Technical concepts behind the answer
- **Shared service with BehaviorSubject/Signal**: lightweight pattern for state that doesn't warrant a full store.
- **Encapsulation of state**: exposing read-only streams and update methods, not the raw subject, avoids uncontrolled mutation.
- **YAGNI (You Aren't Gonna Need It)**: avoiding unnecessary architecture for a small, well-scoped problem.

### 7. Alternatives and trade-offs
- **Shared service (Subject/Signal)** — simple, low overhead, ideal for isolated pieces of state. Can get messy if many unrelated services start doing this ad hoc.
- **NgRx / a state management library** — great for complex, interrelated state with time-travel debugging and strict unidirectional flow, but adds real boilerplate and a learning curve — overkill for one badge.
- **Parent-mediated `@Input()`/`@Output()`** — works only if components share a reasonably close common ancestor; falls apart for scattered, unrelated components.

### 8. What could go wrong?
Introducing a full state management library for a trivial piece of shared state ("resume-driven development"). Exposing the raw `Subject` publicly so any component can push arbitrary values, breaking predictability. Not clarifying the actual scope before deciding architecture.

### 9. Interview signals / keywords
*Encapsulation*, *single source of truth*, *over-engineering*, *scope clarification*, *unidirectional data flow*.

### 10. Follow-up questions
- "What if the requirement grows to include five more shared pieces of related state?" → Explain you'd revisit and likely consolidate into a proper store at that point.
- "How would you test this service in isolation?" → Discuss testing the service methods and emitted values directly without needing a component.

---

## Scenario 5 — Form Validation Feels Laggy and Inconsistent

### 1. Interviewer question
"Users say a registration form's username-availability check feels slow and sometimes shows the wrong result — like it flashes 'available' then 'taken.' How would you investigate?"

### 2. What the interviewer is testing
**Debugging, Testing & Self-Correction**, plus **Trade-off Analysis** on async validation strategy.

### 3. Strong candidate thinking process
- Is this an async validator hitting the API on every keystroke?
- Is there a race condition — an earlier, slower request resolving after a later, faster one, overwriting the correct result?
- Is there debouncing in place at all?
- Are previous in-flight requests being cancelled when a new keystroke happens?

### 4. Professional answer
"This smells like a classic race condition in an async validator. If the validator fires an HTTP call on every keystroke without debouncing, we're sending many overlapping requests, and if an earlier request for, say, 'ann' resolves after a later request for 'anna', the UI can show a stale result — that likely explains the flashing behavior. First, I'd verify this by logging request order versus response order. Assuming that's confirmed, the fix has two parts: debounce the input so we're not firing a request per keystroke, and switch from an operator like `mergeMap` to `switchMap` in the validator's observable chain so that a new keystroke cancels the previous in-flight request instead of letting it resolve out of order. That directly removes the race condition instead of trying to patch it with timestamps or flags."

### 5. Step-by-step technical approach
1. Reproduce and log request/response order.
2. Confirm race condition hypothesis (stale response overwriting fresh one).
3. Check for missing debounce and wrong flattening operator.
4. Apply `debounceTime` + `distinctUntilChanged` + `switchMap`.
5. Verify no more out-of-order results.
6. Add a test simulating delayed responses arriving out of order.
7. Check loading-state UX (spinner while validating) for a complete experience.

### 6. Technical concepts behind the answer
- **Race condition**: outcome depends on unpredictable timing of concurrent operations.
- **switchMap vs mergeMap vs concatMap**: `switchMap` cancels the previous inner observable when a new source value arrives — ideal for "only the latest matters" scenarios like typeahead/validation.
- **debounceTime/distinctUntilChanged**: reduce unnecessary requests.

### 7. Alternatives and trade-offs
- **switchMap** — correct default for "only latest result matters"; not appropriate if you need every request's result (e.g., submitting multiple independent forms).
- **Manual request cancellation with flags/IDs** — works but is more error-prone and harder to read than relying on RxJS's built-in cancellation semantics.

### 8. What could go wrong?
Fixing this by adding a `setTimeout` delay as a band-aid instead of addressing the flattening strategy. Not writing a test that actually simulates out-of-order responses, so the bug could silently return later.

### 9. Interview signals / keywords
*Race condition*, *switchMap*, *debounce*, *stale response*, *cancellation*.

### 10. Follow-up questions
- "What if the backend itself is slow and inconsistent?" → Discuss adding a loading indicator and possibly a minimum-length threshold before triggering validation, plus talking to the backend team about latency.
- "How would this differ for a search-as-you-type feature vs form validation?" → Same pattern (switchMap + debounce) generally applies to both.

---

## Scenario 6 — User Can Still Access a Page After Logging Out

### 1. Interviewer question
"QA reports that after a user logs out, pressing the browser back button sometimes still shows a protected page briefly before redirecting. How would you approach this?"

### 2. What the interviewer is testing
**Debugging, Testing & Self-Correction** and **Trade-off Analysis & Contextual Clarity** (since this touches security/UX trade-offs).

### 3. Strong candidate thinking process
- Is this purely a UI flash (page renders before the guard redirects) or an actual data-exposure issue (API still returns data)?
- What does the route guard check — a token in memory, in a service, or reading from storage synchronously?
- Is there a timing gap between clearing auth state and the guard evaluating?
- Does the browser serve a cached page from bfcache before Angular's router even runs?

### 4. Professional answer
"The first thing I'd nail down is whether this is a real security issue — the API returning actual protected data — or a cosmetic flash where the old page briefly repaints before the guard kicks in, because those have very different severity and different fixes. I'd check the Network tab during reproduction: if no protected API call succeeds after logout, it's a rendering/caching issue, most likely the browser's back-forward cache (bfcache) showing a snapshot of the page before Angular's router guard re-evaluates. If that's the case, the fix is to ensure the guard re-checks authentication state on every navigation, including from bfcache restores, and possibly disable bfcache for authenticated routes, or clear sensitive state so the cached snapshot doesn't show real data. If instead an API call does succeed and returns data, that's a bigger issue — the backend needs to invalidate the token immediately server-side, not just rely on the frontend clearing local storage, since a stolen token would otherwise still work."

### 5. Step-by-step technical approach
1. Reproduce and check Network tab: does a protected API call actually succeed post-logout?
2. If no data leak — investigate bfcache/rendering behavior.
3. If data leak — treat as a security bug, verify server-side token invalidation.
4. Fix guard/pageshow event handling for bfcache scenario, or fix backend token expiry for real leak.
5. Test with actual back-navigation after logout, not just route changes.
6. Confirm fix across browsers (bfcache behavior varies).

### 6. Technical concepts behind the answer
- **Route guards**: Angular's `CanActivate`/functional guards run before navigation completes but don't control browser-level page caching.
- **bfcache (back/forward cache)**: browsers can restore a full page snapshot without re-running JS, which can bypass guard logic if not handled.
- **Token invalidation**: client-side logout (clearing local storage) doesn't invalidate a token server-side unless the backend also revokes it.

### 7. Alternatives and trade-offs
- **Client-only fix (guard + bfcache handling)** — solves the visual/UX flash, cheap, but doesn't fix a real backend token-leak issue if one exists.
- **Server-side token revocation** — the only real fix if actual data is exposed; adds backend complexity (token blacklist/short-lived tokens) but is necessary for real security.
This scenario shows why distinguishing "looks like a bug" from "is a security bug" matters before proposing a fix.

### 8. What could go wrong?
Treating this purely as a cosmetic bug without checking whether real data is exposed — that would be a serious miss in a security-conscious interview. Or overreacting and redesigning the whole auth system for what turns out to be a rendering artifact.

### 9. Interview signals / keywords
*bfcache*, *token invalidation*, *guard re-evaluation*, *severity triage*, *security vs UX*.

### 10. Follow-up questions
- "What if this only happens in Safari?" → Discuss browser-specific bfcache behavior and testing across browsers.
- "The security team says tokens must be revocable instantly — how does that change your API design?" → Discuss short-lived access tokens with refresh tokens, or a server-side session/blacklist check.

---

## Scenario 7 — Choosing Between Signals and RxJS for New State

### 1. Interviewer question
"You're adding a new piece of state to an existing Angular app that already uses RxJS extensively. Would you use Signals or RxJS, and why?"

### 2. What the interviewer is testing
Primarily **Trade-off Analysis & Contextual Clarity** — this is a judgment question, not a "correct answer" question.

### 3. Strong candidate thinking process
- What's the nature of this state — a simple synchronous value, or something inherently asynchronous (HTTP, WebSocket, timers)?
- Does the rest of the codebase already lean on RxJS operators for this kind of data (combineLatest, switchMap chains)?
- Is consistency with the existing codebase more valuable right now than "the technically newer tool"?
- Would mixing Signals and RxJS in this specific spot add unnecessary interop complexity, or is it clean and well-isolated?

### 4. Professional answer
"My honest answer is 'it depends on the shape of the state and the surrounding code,' and I'd explain why rather than pick one dogmatically. Signals are a great fit for local, synchronous UI state — things like a toggle, a selected tab, or a derived computed value — because they're simpler to reason about and don't need subscription management. RxJS is still the better tool when the state is inherently a stream of asynchronous events over time — HTTP requests, WebSocket messages, or anything where I need operators like `debounceTime`, `switchMap`, or `combineLatest`. If the existing codebase already composes several RxJS streams together for related state, I'd lean toward staying consistent with RxJS for that specific piece, even if Signals could technically work, because introducing a second paradigm in the middle of an existing reactive chain adds interop overhead and cognitive load for the team. If this is a genuinely new, isolated piece of local UI state, I'd use Signals, since that's the direction Angular is heading and it reduces boilerplate."

### 5. Step-by-step technical approach
1. Classify the state: synchronous/local vs asynchronous/stream-based.
2. Check surrounding code for existing patterns (consistency).
3. Evaluate interop cost if mixing signals and observables.
4. Choose the option that minimizes complexity for this specific piece of state.
5. Document the decision briefly for teammates (why this pattern here).

### 6. Technical concepts behind the answer
- **Signals**: fine-grained, synchronous reactive primitives with automatic dependency tracking, no manual subscription/unsubscription.
- **RxJS Observables**: model asynchronous streams over time, with a rich operator set for combining/transforming them.
- **toSignal()/toObservable()**: interop utilities Angular provides to bridge the two when needed.

### 7. Alternatives and trade-offs
- **Signals-first** — less boilerplate, easier onboarding, but weaker for complex async composition.
- **RxJS-first** — powerful for async orchestration, more boilerplate and a steeper learning curve.
- **Mixed, deliberately** — usually the most realistic answer in an existing large codebase: use each where it fits, and use interop functions at the boundary, rather than forcing one paradigm everywhere.

### 8. What could go wrong?
Giving a purely dogmatic answer ("Signals are new so always use Signals") without considering the existing codebase. Not acknowledging that mixing paradigms has a real cost. Failing to mention Angular's own interop tools.

### 9. Interview signals / keywords
*Consistency*, *interop*, *cognitive load*, *fit for purpose*, *synchronous vs asynchronous state*.

### 10. Follow-up questions
- "What if the team is planning to eventually migrate fully to Signals?" → Discuss doing new isolated state in Signals now to reduce future migration surface, while leaving complex async chains for a planned, separate migration.
- "How would you explain this decision to a less experienced teammate?" → Emphasize simple heuristics: "is it a stream over time, or a value that changes?"

---

## Scenario 8 — Designing a Reusable Component API

### 1. Interviewer question
"You need to build a reusable data-table component used by at least three different feature teams, each with slightly different needs. How would you approach the design?"

### 2. What the interviewer is testing
**Problem Decomposition & Planning**, with a secondary focus on **Trade-off Analysis** (flexibility vs simplicity).

### 3. Strong candidate thinking process
- What do the three teams actually need in common, versus what's team-specific?
- Should this be configuration-driven (inputs/options) or should it support content projection for full flexibility?
- What's the risk of over-generalizing this component into something unmaintainable ("God component")?
- How should sorting/filtering/pagination be handled — inside the component, or delegated to the parent?

### 4. Professional answer
"Before designing the API, I'd want to actually gather the three teams' requirements and separate the common core — displaying rows and columns, maybe sorting — from the parts that differ, like custom cell rendering or row actions. I'd design the component around a small, stable set of `@Input()`s for the common behavior, and use content projection or template references for anything that varies per team, like custom cell templates, rather than adding a growing list of boolean flags for every edge case, because that quickly turns into an unmaintainable 'God component' with dozens of conditional branches. For behavior like sorting or filtering, I'd think carefully about whether the component owns that state internally, or whether it just emits events and lets the parent own the data — for a genuinely reusable component I'd lean toward the latter, since it keeps the component simpler and gives consuming teams control over their own data flow. I'd also version this carefully since three teams will depend on it — breaking changes need a clear migration path."

### 5. Step-by-step technical approach
1. Gather actual requirements from the three consuming teams.
2. Separate common core behavior from team-specific customization.
3. Design a small, stable input/output API for the core.
4. Use content projection / template refs for customizable parts.
5. Decide state ownership (component-internal vs parent-controlled).
6. Build and test the core in isolation with unit tests.
7. Pilot with one team before rolling out to all three.
8. Document the public API clearly for other teams.

### 6. Technical concepts behind the answer
- **Content projection (`ng-content`, template refs)**: lets consumers inject custom markup without the component needing to know about every use case.
- **Separation of concerns**: keeping data-fetching/business logic out of a purely presentational reusable component.
- **API stability/versioning**: reusable components need a more conservative approach to breaking changes since multiple teams depend on them.

### 7. Alternatives and trade-offs
- **Highly configurable component (many inputs/flags)** — quick short-term wins per request, but tends to accumulate complexity and becomes hard to maintain ("prop explosion").
- **Content-projection-driven design** — more flexible and cleaner long-term, but requires more upfront design thought and a bit more code from consumers.
- **Headless component (logic only, no fixed markup)** — maximum flexibility for very different UI needs across teams, but pushes more responsibility (and duplicated styling work) onto each consumer.

### 8. What could go wrong?
Designing the component around only the first team's requirements and bolting on flags for the other two later. Letting the component manage too much internal state, making it hard for teams with different data-fetching needs to use it. Skipping documentation, causing every team to reverse-engineer usage from source code.

### 9. Interview signals / keywords
*Reusability*, *content projection*, *separation of concerns*, *API stability*, *avoiding prop explosion*.

### 10. Follow-up questions
- "One team needs server-side pagination, another needs client-side — how do you handle that?" → Discuss exposing pagination as events/inputs so the parent decides the strategy, rather than baking one assumption into the component.
- "A fourth team joins with a very different need — do you extend this component or build a new one?" → Discuss evaluating whether the need fits the existing abstraction or if forcing it in would violate single responsibility.

---

## Scenario 9 — Flaky Test Failing Intermittently in CI

### 1. Interviewer question
"A test for an Angular component passes locally every time but fails intermittently in CI. How do you approach this?"

### 2. What the interviewer is testing
**Debugging, Testing & Self-Correction**, with a bit of **Problem Decomposition** in narrowing down causes systematically.

### 3. Strong candidate thinking process
- What kind of test is this — unit test with TestBed, or an integration/e2e test?
- Is there a timing dependency — async code not properly awaited (`fakeAsync`/`tick`/`whenStable`) or a real timeout race?
- Could this be test-order dependency — shared state leaking between tests?
- Is CI running tests in parallel or in a different environment (headless browser, different timezone, different locale)?

### 4. Professional answer
"Flaky tests are almost always about either timing or shared state, so I'd start by pulling the CI logs to see the actual failure — is it a timeout, a mismatched value, or an element not found? If it's timing-related, a common cause in Angular tests is asynchronous code not being properly synchronized with the test — for example using a raw `setTimeout` when the test should be using `fakeAsync` and `tick()`, or not awaiting `fixture.whenStable()` after an async operation. I'd also check if this test depends on execution order — for instance, a shared mock or a piece of module-level state that a previous test mutates, which would explain why it fails only when run alongside other tests, as CI usually does, but passes when run in isolation locally. Rather than just adding retries to hide the flakiness, I'd try to reproduce it locally by running the full suite (not just this one test) and, if needed, add explicit synchronization or reset shared mocks in `beforeEach` to remove the non-determinism at its source."

### 5. Step-by-step technical approach
1. Pull CI logs — identify the actual failure mode (timeout, order, race).
2. Try to reproduce by running the full suite locally, not the isolated test.
3. Check for unhandled async in the test (missing fakeAsync/tick/whenStable).
4. Check for shared/module-level state between tests.
5. Fix the synchronization or isolation issue at the source.
6. Re-run in CI multiple times to confirm stability.
7. Avoid masking flakiness with blind retries unless it's a genuinely external factor (e.g., network in e2e).

### 6. Technical concepts behind the answer
- **Flaky test**: a test whose result depends on non-deterministic factors like timing or shared state rather than the code under test.
- **fakeAsync/tick**: Angular testing utilities to control simulated time deterministically.
- **Test isolation**: each test should not depend on side effects from another test.

### 7. Alternatives and trade-offs
- **Fix the root cause (sync/isolation)** — the correct long-term approach, though it can take longer to track down.
- **Add retries in CI** — pragmatic short-term mitigation to unblock a pipeline, but should never replace investigating the root cause, since it hides real bugs (including potential production race conditions).

### 8. What could go wrong?
Adding a retry or increasing a timeout as the "fix" without understanding why the test was flaky in the first place — this can hide a genuine race condition that also affects users in production, not just the test.

### 9. Interview signals / keywords
*Flaky test*, *test isolation*, *race condition*, *fakeAsync*, *masking vs fixing root cause*.

### 10. Follow-up questions
- "What if the flakiness only happens in CI, never locally, even running the full suite?" → Discuss environment differences: headless browser timing, resource constraints (slower CI machines), parallel test workers.
- "How would you convince the team not to just add a retry and move on?" → Explain the risk that hidden race conditions can eventually surface as real production bugs.

---

## Scenario 10 — Bundle Size Regression After Adding a Library

### 1. Interviewer question
"After a developer added a new charting library, users on slower connections report the app takes noticeably longer to load. How would you approach this?"

### 2. What the interviewer is testing
**Debugging, Testing & Self-Correction** and **Trade-off Analysis** (build performance vs feature convenience).

### 3. Strong candidate thinking process
- Is the entire library being loaded upfront, or only where it's used?
- What does the bundle analyzer actually show — how large is the library, and is it tree-shakeable?
- Is the charting feature used on every page, or only a specific one?
- Could this be lazy-loaded instead of bundled into the main chunk?

### 4. Professional answer
"I'd start with evidence, not assumption — running a bundle analyzer to see exactly how much the new library added to the initial bundle and whether it landed in the main chunk or a separate one. If it's in the main bundle but the charting feature is only used on one specific page, that's the real problem: everyone pays the loading cost even if they never visit that page. In that case, I'd move the chart feature into a lazy-loaded route or a lazy-loaded standalone component, so it's only fetched when actually needed. I'd also check whether the library supports tree-shaking or has a lighter alternative import path, since some charting libraries ship a lot of unused functionality by default. Before finalizing, I'd re-run the bundle analyzer to confirm the initial bundle size actually dropped, and check the real-world load time improvement, not just the theoretical bundle size number."

### 5. Step-by-step technical approach
1. Run a bundle analyzer (e.g., `source-map-explorer` or Angular's build stats) to measure the actual impact.
2. Identify which chunk the library landed in.
3. Determine actual usage scope (one page vs everywhere).
4. Apply lazy loading for the feature if usage is limited.
5. Check for tree-shaking/lighter import paths.
6. Re-measure bundle size and load time after the fix.
7. Consider a lighter-weight alternative library if the current one is disproportionately heavy for its usage.

### 6. Technical concepts behind the answer
- **Lazy loading**: deferring the loading of a module/component until it's actually needed, common via Angular's route-level or standalone component lazy loading.
- **Tree-shaking**: eliminating unused code from a bundle at build time — requires ES modules and side-effect-free code.
- **Bundle analysis**: measuring what's actually contributing to bundle size instead of guessing.

### 7. Alternatives and trade-offs
- **Lazy load the feature** — keeps the library available but removes it from the critical path; slight delay the first time the feature loads.
- **Replace with a lighter library** — can meaningfully shrink bundle size, but costs migration effort and might mean losing some features.
- **Load via CDN with caching** — reduces your own bundle size, but adds an external dependency and a request to a third-party domain, which has its own trade-offs (privacy, reliability).

### 8. What could go wrong?
Assuming the library itself is "just heavy" and swapping it out immediately without checking whether lazy loading alone would solve the actual problem — that's a bigger, riskier change than necessary.

### 9. Interview signals / keywords
*Bundle analysis*, *lazy loading*, *tree-shaking*, *critical path*, *evidence-based optimization*.

### 10. Follow-up questions
- "What if the chart is on the landing page, so lazy loading doesn't help much?" → Discuss whether the chart can be deferred until after initial render (e.g., loaded after first paint) or whether a lighter library is genuinely the better call here.
- "How do you prevent this regression from happening again?" → Mention bundle-size budgets/checks in CI that fail the build if the bundle grows past a threshold.

---

## Scenario 11 — State Synchronization Issue Across Components After API Update

### 1. Interviewer question
"A user updates their profile in one part of the app, but the header, which also shows the user's name, still shows the old value until a full page refresh. How do you investigate and fix this?"

### 2. What the interviewer is testing
A combination of **Debugging** and **Trade-off Analysis** — this touches shared state design plus API integration.

### 3. Strong candidate thinking process
- Where does the header get its data from — a separate API call, a shared service, or a store?
- Is the profile-update component only updating its own local state after a successful save, without notifying anything else?
- Is there a single source of truth for "current user," or does each component fetch its own copy?
- What's the simplest fix here vs. the more scalable one?

### 4. Professional answer
"This is a classic state-synchronization problem — the header and the profile form are almost certainly each holding their own independent copy of the user data instead of sharing one source of truth. I'd confirm that first: does the header re-fetch on its own schedule, or does it read from a shared service? If each component fetches independently, the quick fix is to have the profile-update flow, after a successful save, push the updated user object into a shared service — a `BehaviorSubject` or signal holding 'current user' — that both the header and the form read from. That way, updating it in one place reflects everywhere immediately, without needing a full page refresh or every component re-fetching from the API. If the app doesn't already have this kind of shared 'current user' state, this is a good moment to introduce it, since this exact bug will keep recurring anywhere user data is shown in more than one place."

### 5. Step-by-step technical approach
1. Confirm each component's actual data source (independent fetch vs shared state).
2. Identify missing synchronization point after the update mutation.
3. Introduce or use an existing shared "current user" service/store.
4. Update the shared state after a successful API response (not optimistically, unless intentional).
5. Verify both header and form reflect the change without refresh.
6. Test the update path with a unit/integration test.

### 6. Technical concepts behind the answer
- **Single source of truth**: one authoritative place for a piece of data, avoiding duplicated, independently-fetched copies.
- **State synchronization**: ensuring all parts of the UI reflect the same underlying state after a mutation.
- **Optimistic vs confirmed update**: updating the UI immediately (assuming success) vs waiting for the API response before updating shared state.

### 7. Alternatives and trade-offs
- **Shared service holding current user** — straightforward, solves the immediate problem, minimal new infrastructure.
- **Optimistic update** — updates the UI instantly for a snappier feel, but requires a rollback strategy if the API call fails — added complexity for better perceived performance.
- **Refetch user data app-wide on every profile update** — simplest to write, but wasteful (extra network calls) and doesn't scale if user data is shown in many places.

### 8. What could go wrong?
Patching only the header to also re-fetch on a timer (masking the symptom) instead of fixing the actual missing synchronization. Introducing an optimistic update without handling the failure case, leaving the UI in an inconsistent state if the save fails.

### 9. Interview signals / keywords
*Single source of truth*, *state synchronization*, *optimistic update*, *shared service*, *root cause*.

### 10. Follow-up questions
- "What if the update needs to happen instantly, before the API confirms success, for good UX?" → Discuss optimistic updates with rollback on failure, and how you'd communicate a failed save to the user.
- "What if ten different components show user data, not just two?" → Discuss this being a stronger signal for a proper store/state layer rather than an ad hoc shared service.

---

# SECTION B — JavaScript / TypeScript Scenarios

## Scenario 12 — Async Loop Doesn't Behave as Expected

### 1. Interviewer question
"A developer wrote a loop that calls an async API for each item in an array, expecting them to run one after another, but they seem to run all at once and produce inconsistent results. What's happening, and how would you fix it?"

### 2. What the interviewer is testing
**Debugging, Testing & Self-Correction**, and understanding of the JavaScript async model — a core JS fundamentals check.

### 3. Strong candidate thinking process
- What does the actual loop look like — `forEach` with an async callback, or a `for` loop?
- Does `forEach` even wait for promises? (It doesn't — it ignores the returned promise.)
- Is the intent truly sequential execution, or just "wait for all to finish," which changes the right tool?
- Are results being collected in a way that depends on order, and is that assumption safe?

### 4. Professional answer
"The most common cause here is using `array.forEach` with an `async` callback, expecting it to behave like a sequential loop — but `forEach` doesn't await anything; it fires all the callbacks immediately and ignores the returned promises entirely, so all the async calls start essentially at the same time, and the loop 'finishes' before any of them resolve. Before fixing it, I'd clarify the actual intent: does this genuinely need to be sequential — one request must complete before the next starts — or does it just need to wait for all of them to finish, order not mattering? If sequential execution is required, for example because each call depends on the previous one's result, I'd switch to a plain `for...of` loop with `await` inside it. If the calls are independent and we just want them all done, but not necessarily one-by-one, I'd use `Promise.all` for concurrency, which is also faster since the requests run in parallel rather than waiting on each other unnecessarily."

### 5. Step-by-step technical approach
1. Confirm the actual code pattern (forEach with async, or similar).
2. Clarify whether sequential order is actually required.
3. If sequential: replace with `for...of` + `await`.
4. If order doesn't matter: replace with `Promise.all` for concurrent execution.
5. Add error handling — a single rejection in `Promise.all` will reject the whole batch; consider `Promise.allSettled` if partial failures should be tolerated.
6. Test with a case where item order matters/doesn't, and where one call fails.

### 6. Technical concepts behind the answer
- **forEach and promises**: `forEach` does not await callback return values; it's fire-and-forget for each iteration.
- **for...of + await**: waits for each promise before continuing to the next iteration — true sequential execution.
- **Promise.all vs Promise.allSettled**: `Promise.all` rejects immediately if any promise rejects; `allSettled` waits for all and reports each outcome.

### 7. Alternatives and trade-offs
- **for...of + await (sequential)** — correct when calls depend on each other, but slower overall since nothing runs in parallel.
- **Promise.all (concurrent)** — much faster for independent calls, but an "all or nothing" failure model unless paired with `allSettled`.
- **Batched concurrency (e.g., a concurrency limit of 5 at a time)** — useful when the API can't handle full parallel load; more complex to implement.

### 8. What could go wrong?
Not realizing `forEach` silently swallows the async intent — this is a very common and subtle JavaScript bug. Switching to `Promise.all` when order actually mattered, breaking dependent logic. Not handling partial failures.

### 9. Interview signals / keywords
*Fire-and-forget*, *sequential vs concurrent execution*, *Promise.all*, *Promise.allSettled*, *event loop*.

### 10. Follow-up questions
- "What if one call in the middle fails — what should happen to the rest?" → Discuss `allSettled` if partial success is acceptable, or a deliberate short-circuit/rollback if not.
- "How would you limit concurrency to avoid overwhelming the API?" → Describe a simple batching approach or a concurrency-limiting utility.

---

## Scenario 13 — Closure Captures the Wrong Value

### 1. Interviewer question
"A developer sets up several buttons in a loop, each meant to log its own index when clicked, but every button logs the same, final index. What's going on?"

### 2. What the interviewer is testing
**Debugging, Testing & Self-Correction** — a fundamentals check on closures and scoping.

### 3. Strong candidate thinking process
- Is the loop using `var` or `let`?
- Does the click handler run immediately, or later, after the loop has already finished?
- What does each closure actually capture — the variable itself, or its value at that point in time?

### 4. Professional answer
"This is the classic closure-and-`var` scoping issue. If the loop uses `var`, there's only a single shared variable across all iterations, because `var` is function-scoped, not block-scoped. Each click handler is a closure that references that same variable, not a snapshot of its value at the time it was created — so by the time any button is actually clicked, the loop has already finished, and the variable holds its final value, which is what every handler sees. The straightforward fix is switching from `var` to `let`, since `let` is block-scoped and creates a new binding for each loop iteration, so each closure captures its own separate variable. If for some reason `let` isn't an option, an alternative is wrapping the handler creation in an IIFE that captures the current value as a parameter, but that's mostly a legacy pattern now that `let` exists."

### 5. Step-by-step technical approach
1. Confirm `var` vs `let` in the loop.
2. Explain the closure capturing the variable, not a value snapshot.
3. Apply the fix: change `var` to `let`.
4. Verify each handler now logs its own distinct index.
5. (If legacy code prevents `let`) discuss IIFE-based capture as an alternative.

### 6. Technical concepts behind the answer
- **Closures**: a function retains access to variables from its enclosing scope even after that scope has finished executing.
- **var (function-scoped) vs let (block-scoped)**: `var` shares one binding across the whole function; `let` creates a new binding per block iteration.

### 7. Alternatives and trade-offs
- **Switch to `let`** — simplest, idiomatic modern JavaScript fix.
- **IIFE parameter capture** — works in older codebases without `let`/ES6, but is more verbose and considered legacy style now.

### 8. What could go wrong?
Not recognizing this as a scoping issue and instead trying unrelated fixes (e.g., blaming the click event itself). Missing that this is a very common interview fundamentals check, and rushing past the "why" instead of explaining the mechanism clearly.

### 9. Interview signals / keywords
*Closure*, *block scope vs function scope*, *binding per iteration*, *IIFE*.

### 10. Follow-up questions
- "What if this were TypeScript with strict settings — would it catch this?" → Explain TypeScript's type system doesn't prevent this scoping issue; it's a runtime/language-semantics matter, not a type error.
- "Can you think of a case where `var`'s behavior is actually desired?" → Rare, but you could mention intentionally sharing state across iterations, though this is unusual and best done explicitly rather than relying on `var`'s quirk.

---

## Scenario 14 — Typing an Unpredictable External API Response

### 1. Interviewer question
"You're integrating a third-party API whose response shape is inconsistently documented and sometimes includes unexpected null or missing fields. How do you approach typing this in TypeScript?"

### 2. What the interviewer is testing
**Trade-off Analysis & Contextual Clarity** — judgment about type safety vs practicality, and awareness that TypeScript types don't guarantee runtime correctness.

### 3. Strong candidate thinking process
- TypeScript types are compile-time only — they don't validate anything at runtime. So how do I bridge that gap?
- Should I type the response optimistically and hope it matches, or validate it at the boundary?
- What's the cost of being wrong here — is this data driving critical UI/business logic?
- Is there a runtime validation library already used in the project (Zod, io-ts, class-validator)?

### 4. Professional answer
"The key thing to keep in mind is that TypeScript types disappear at runtime — declaring an interface for the response doesn't actually guarantee the API will honor it, especially if the documentation is unreliable. So instead of just writing an optimistic interface and trusting it, I'd validate the response at the boundary where it enters our codebase, using a runtime validation library like Zod, and derive the TypeScript type from that schema. That way, if a field is unexpectedly null or missing, we catch it explicitly at the integration point with a clear error, rather than letting `undefined` silently propagate deep into the UI and cause a confusing crash three components later. For fields that are genuinely optional or unreliable, I'd model them as optional or nullable in the schema rather than pretending they're always present, and handle the missing case deliberately in the UI instead of assuming happy-path data."

### 5. Step-by-step technical approach
1. Identify all known and observed shapes/edge cases of the response.
2. Define a runtime schema (e.g., Zod) at the API boundary.
3. Derive the TypeScript type from that schema, not written separately by hand.
4. Validate/parse the response immediately after fetching.
5. Handle validation failures explicitly (log, fallback, or surfaced error).
6. Model genuinely optional fields as optional/nullable, not forced non-null.
7. Add tests covering the observed edge cases (missing fields, nulls).

### 6. Technical concepts behind the answer
- **Compile-time vs runtime typing**: TypeScript erases types at compile time; nothing stops a mismatched runtime value from flowing through unless you validate it.
- **Runtime validation (Zod, io-ts, etc.)**: schemas that both validate data at runtime and generate matching TypeScript types.
- **Boundary validation**: validating untrusted/external data right where it enters your system, rather than trusting it everywhere downstream.

### 7. Alternatives and trade-offs
- **Runtime validation library** — high confidence, catches real mismatches early, but adds a dependency and a bit of upfront schema-writing effort.
- **Manual type + optional chaining everywhere** — quicker to start, but pushes the responsibility of "is this actually safe" to every consumer of the data, increasing the chance of a missed `undefined` case.
- **`any`/loose typing** — fastest to write, but defeats the purpose of using TypeScript at all and hides bugs until runtime.

### 8. What could go wrong?
Writing an optimistic interface, marking everything as required, and letting `undefined`/`null` cause a runtime crash deep in a component. Overusing non-null assertions (`!`) to silence the compiler instead of actually handling the uncertain data.

### 9. Interview signals / keywords
*Compile-time vs runtime*, *boundary validation*, *type erasure*, *schema-derived types*, *defensive integration*.

### 10. Follow-up questions
- "What if adding a validation library isn't allowed by the project's constraints?" → Discuss writing manual type guards/parsing functions at the boundary as a lighter-weight alternative.
- "How would you handle a field that's sometimes a string and sometimes a number?" → Discuss union types combined with a runtime check/normalization step right at the boundary.

---

## Scenario 15 — Unexpected Shared Reference Causes a Bug

### 1. Interviewer question
"A developer copies an object with `const copy = original` to make changes without affecting the original, but the original ends up changed too. What's the issue and how would you explain it?"

### 2. What the interviewer is testing
**Debugging** fundamentals — reference vs value semantics, a common and important JS concept.

### 3. Strong candidate thinking process
- Are objects/arrays copied by value or by reference in JavaScript?
- What does `const copy = original` actually do — copy the object, or copy the reference to the same object?
- What are the correct ways to create an actual independent copy — shallow vs deep?

### 4. Professional answer
"In JavaScript, objects and arrays are reference types — assigning `const copy = original` doesn't create a new object, it just creates a second variable pointing to the exact same object in memory. So any mutation through `copy` is really a mutation of the same underlying object that `original` also points to, which explains why both appear to change. To actually get an independent copy, you need to explicitly create a new object — a shallow copy with the spread operator or `Object.assign`, or, if the object is nested, a deep copy, since a shallow copy still shares references for any nested objects or arrays inside it. Which one is appropriate depends on the data's shape — if it's nested and you need full independence, `structuredClone` or a deep-copy utility is safer than a shallow spread."

### 5. Step-by-step technical approach
1. Confirm the copy method used (`= assignment` vs spread/clone).
2. Explain reference vs value semantics for objects/arrays.
3. Distinguish shallow copy from deep copy needs based on nesting.
4. Apply the correct copy method (spread for shallow, `structuredClone`/deep-copy for nested).
5. Verify original object is unaffected after the fix.
6. Add a test asserting independence after mutation.

### 6. Technical concepts behind the answer
- **Reference types vs primitive types**: objects/arrays are stored by reference; strings/numbers/booleans by value.
- **Shallow copy vs deep copy**: shallow copy duplicates the top level only; nested objects/arrays are still shared references.
- **Immutability discipline**: many bugs (including Angular's change-detection issues) trace back to this exact misunderstanding.

### 7. Alternatives and trade-offs
- **Spread operator / Object.assign (shallow)** — fast and simple, sufficient when the object has no nested reference types that need independence.
- **structuredClone / deep-copy library** — necessary for nested structures, but has a performance cost for large objects and won't clone things like functions.
- **Immutable data structures (e.g., Immutable.js, or disciplined patterns)** — prevents this class of bug entirely at the cost of a different API and learning curve.

### 8. What could go wrong?
Using a shallow copy and assuming it's fully independent when the object has nested structures, causing the same bug one level deeper. Not testing the fix against a nested-object case.

### 9. Interview signals / keywords
*Reference semantics*, *shallow vs deep copy*, *immutability*, *structuredClone*.

### 10. Follow-up questions
- "What if the object contains functions or dates — does structuredClone handle that?" → Discuss that `structuredClone` handles many built-in types (dates, maps, sets) but not functions; those need special handling.
- "How does this relate to the Angular OnPush bug from earlier?" → Connect the dots: OnPush relies on reference changes, so accidentally mutating shared references silently breaks it too.

---

## Scenario 16 — Heavy Computation Freezes the UI

### 1. Interviewer question
"A feature that processes a large CSV file client-side causes the whole page to freeze for a few seconds while it runs. How would you address this?"

### 2. What the interviewer is testing
**Debugging & Problem Decomposition**, with understanding of the JavaScript event loop and concurrency model.

### 3. Strong candidate thinking process
- JavaScript is single-threaded — a long synchronous task blocks the main thread, including rendering and user input.
- Is this task truly CPU-bound (parsing/processing), or could it be broken into smaller async chunks?
- Would a Web Worker be appropriate here, moving the work off the main thread entirely?
- Is there a way to show progress/feedback rather than a completely frozen UI, even before optimizing the computation itself?

### 4. Professional answer
"Because JavaScript runs on a single main thread, a long synchronous computation — like parsing and processing a big CSV — blocks everything else: rendering, click handlers, even simple UI updates, which is exactly the 'frozen' feeling users are describing. The cleanest fix is to move that processing off the main thread entirely using a Web Worker, since workers run in a separate thread and communicate with the main thread via messages, without blocking the UI. If a full worker setup is too big a change right now, a lighter interim approach is to break the processing into smaller chunks and yield back to the browser between them — for example processing a batch of rows, then using `setTimeout(fn, 0)` or `requestIdleCallback` to schedule the next batch, which lets the browser render and respond to input in between. Either way, I'd also add a visible progress indicator, since even a well-optimized process that takes a few seconds should give the user feedback rather than looking frozen."

### 5. Step-by-step technical approach
1. Confirm the task is CPU-bound and synchronous (profile if unsure).
2. Evaluate Web Worker feasibility given project constraints/build setup.
3. If using a worker: move parsing/processing logic there, communicate via postMessage.
4. If not using a worker: chunk the work and yield between chunks.
5. Add a progress indicator/UI feedback regardless of the chosen approach.
6. Test with a large realistic file to confirm the UI stays responsive.
7. Measure actual processing time before/after to confirm improvement.

### 6. Technical concepts behind the answer
- **Event loop / single-threaded execution**: JavaScript's main thread handles rendering, user interaction, and script execution — a long synchronous task starves all of them.
- **Web Workers**: run JavaScript in a separate thread, ideal for CPU-heavy work that shouldn't block the UI.
- **Chunking/yielding**: breaking work into smaller pieces and returning control to the browser between them as a lighter-weight alternative to workers.

### 7. Alternatives and trade-offs
- **Web Worker** — real, correct architectural fix for CPU-bound work; adds build/communication complexity (structured message passing, no direct DOM access from the worker).
- **Chunking with setTimeout/requestIdleCallback** — much simpler to implement, doesn't require build changes, but the main thread is still doing the work, just in smaller slices — some responsiveness improvement, not full parallelism.
- **Server-side processing** — moves the load off the client entirely, best UX if feasible, but requires backend capacity and a network round trip, plus potentially larger upload sizes.

### 8. What could go wrong?
Trying to "optimize" the synchronous code without addressing that it's blocking the main thread at all — even a faster synchronous function can still noticeably freeze the UI at scale. Not adding any user feedback, leaving the perceived experience broken even after a technical fix.

### 9. Interview signals / keywords
*Single-threaded*, *main thread blocking*, *Web Worker*, *chunking*, *perceived performance*.

### 10. Follow-up questions
- "What if the CSV processing needs to update the DOM as it goes?" → Discuss that a worker can't touch the DOM directly, so it would post progress/results back to the main thread, which then updates the UI.
- "What if this needs to work in an environment without Web Worker support?" → Discuss the chunking fallback and feature-detecting worker support.

---

# SECTION C — Backend / Full-Stack Scenarios

## Scenario 17 — API Sometimes Takes 5 Seconds and the App Feels Frozen

### 1. Interviewer question
"Users report that the app 'freezes' for several seconds sometimes when loading a certain screen. Investigation shows the API occasionally takes about 5 seconds to respond. How do you approach this end-to-end?"

### 2. What the interviewer is testing
All three modules to some degree, but mainly **Problem Decomposition & Planning** (this spans frontend and backend) and **Trade-off Analysis** (UX mitigation vs root-cause backend fix).

### 3. Strong candidate thinking process
- Is "freezes" literally a blocked UI (no loading indicator, synchronous wait) or just a slow response with no feedback?
- Why does the API sometimes take 5 seconds — is it consistent under load, a specific query, cold starts, or a downstream dependency?
- Is the frontend handling long-running requests gracefully (timeout, cancellation, loading state) regardless of the backend fix?
- Should I address this as one problem, or as two separate problems — frontend UX and backend latency?

### 4. Professional answer
"I'd split this into two tracks, because they're both real issues even though they compound each other. On the frontend side, if the screen genuinely locks up rather than just feeling slow, that's a UX bug independent of the API speed — there should be a loading state, and ideally the user should still be able to interact with unrelated parts of the app. I'd fix that regardless of what we find on the backend. On the backend side, 'sometimes 5 seconds' suggests this isn't a constant, predictable cost — it points to something like a slow query under certain conditions, an external dependency call, connection pool exhaustion under load, or a missing index that only bites for larger datasets. I'd want to look at backend logs or tracing for that specific endpoint to see where the time is actually going before assuming it's the database. Once I isolate where the delay happens, the fix might be adding an index, caching a expensive computation, or adding a timeout with a retry/backoff if it's a flaky external call. Meanwhile, on the frontend, adding a reasonable request timeout and clear loading/error states means that even in the worst case, the user isn't staring at a frozen screen with no feedback."

### 5. Step-by-step technical approach
1. Reproduce and confirm: is the UI blocked, or just visually unresponsive without feedback?
2. Fix frontend UX independent of backend cause (loading state, non-blocking UI, timeout/cancel).
3. Investigate backend: logs/tracing on the slow endpoint to locate where time is spent.
4. Form a hypothesis (slow query, external dependency, connection pool, cold start).
5. Isolate and confirm (e.g., query execution time under load).
6. Apply the targeted backend fix (index, caching, connection pooling, async processing).
7. Re-test end-to-end under realistic load.
8. Monitor response-time percentiles (not just average) after deploying.

### 6. Technical concepts behind the answer
- **Latency vs perceived performance**: a slow but well-communicated wait feels very different from an unexplained freeze.
- **Percentile-based monitoring (p95/p99)**: "sometimes 5 seconds" is a tail-latency problem, better understood through percentiles than averages.
- **Backend bottleneck causes**: N+1 queries, missing indexes, connection pool exhaustion, cold starts, unbounded external calls.
- **Timeouts and graceful degradation**: frontend should never assume a backend call always completes quickly.

### 7. Alternatives and trade-offs
- **Fix frontend UX only (quick win)** — improves perceived experience immediately, but doesn't solve the underlying slowness, which may worsen as data/usage grows.
- **Fix backend root cause** — the real, durable fix, but takes longer to diagnose and may require infrastructure or query changes.
- **Caching the expensive result** — fast to implement and very effective if data doesn't change often, but introduces staleness trade-offs that need to be acceptable for this use case.
Doing both frontend and backend work in parallel is usually the pragmatic real-world answer.

### 8. What could go wrong?
Only fixing the frontend loading indicator and calling it done, leaving the actual latency (and its potential to get worse) unaddressed. Guessing "it's probably the database" without checking logs/tracing first. Looking only at average response time and missing that the issue is specifically in the tail (p95/p99).

### 9. Interview signals / keywords
*Tail latency*, *p95/p99*, *root cause vs symptom*, *graceful degradation*, *caching*, *connection pool exhaustion*.

### 10. Follow-up questions
- "What if the 5-second delay only happens for users in a specific region?" → Discuss investigating CDN/edge latency, database region placement, or network path issues rather than assuming it's purely compute-bound.
- "What if adding an index isn't possible right now (large table, migration risk)?" → Discuss short-term mitigation like caching or query restructuring while planning the index migration safely.

---

## Scenario 18 — Frontend/Backend Contract Mismatch on Pagination

### 1. Interviewer question
"After a backend update, a paginated list in the UI starts showing duplicate items and occasionally skips some. What's your approach?"

### 2. What the interviewer is testing
**Debugging, Testing & Self-Correction**, with **Trade-off Analysis** on pagination strategy choice.

### 3. Strong candidate thinking process
- What pagination strategy is being used — offset-based (page/limit) or cursor-based?
- Did the backend change something about ordering, sorting stability, or the pagination contract itself?
- Are duplicates/skips consistent with data being inserted/deleted between page requests (a classic offset-pagination issue)?
- Is the frontend making the same assumptions about the response shape that the backend still honors?

### 4. Professional answer
"Duplicates and skipped items together is a strong signal of an offset-based pagination issue combined with changing underlying data — if items are being inserted or deleted between page requests, an offset like 'skip 20, take 20' can shift what's on each page, causing exactly this symptom. I'd first confirm what pagination strategy the API uses and whether that changed in this update — did we go from cursor-based to offset-based, or did sorting stability change (e.g., no longer a strict, unique sort order, so ties get reordered unpredictably between requests)? I'd check the actual API responses page by page in a stable, controlled test to see whether IDs repeat or gaps appear. If the underlying cause is offset pagination on frequently-changing data, the more robust fix is switching to cursor-based pagination, which anchors each page to a specific item rather than a shifting numeric offset. If that's too large a change right now, ensuring a stable, unique sort key (not just a non-unique 'created date' that can tie) is a smaller mitigation."

### 5. Step-by-step technical approach
1. Confirm the pagination strategy and what changed in the backend update.
2. Reproduce with controlled test data to see duplicate/skip patterns clearly.
3. Check for non-unique or unstable sort order.
4. Form hypothesis: offset-pagination + changing/unstable-sorted data.
5. Confirm by testing with static data (does the issue disappear?).
6. Apply fix: cursor-based pagination or a stable unique sort key.
7. Update frontend to match the (possibly new) contract.
8. Add an integration test covering pagination with concurrent inserts/deletes if feasible.

### 6. Technical concepts behind the answer
- **Offset-based pagination**: `LIMIT/OFFSET` — simple but fragile when the underlying data set changes between requests.
- **Cursor-based pagination**: anchors to a specific record (e.g., "items after this ID"), stable even as data changes.
- **Sort stability**: pagination is only reliable with a deterministic, unique sort order.

### 7. Alternatives and trade-offs
- **Cursor-based pagination** — much more robust for changing data, but requires backend and frontend contract changes, and doesn't support "jump to page 5" as naturally.
- **Offset-based with a stable unique sort key** — smaller change, mitigates the immediate symptom, but is still fundamentally fragile if the dataset changes frequently between requests.
- **Snapshot-based pagination** (fixing the result set at first request) — solves consistency well for a single session, but can serve increasingly stale data as more time passes.

### 8. What could go wrong?
Patching the frontend to "deduplicate" the visible symptom (filtering out repeated IDs client-side) without fixing the actual contract issue — this hides the bug and can still cause missing items. Not verifying whether this is truly a data-change issue vs. an actual backend defect in the pagination logic itself.

### 9. Interview signals / keywords
*Offset vs cursor pagination*, *sort stability*, *API contract*, *root cause vs client-side patch*.

### 10. Follow-up questions
- "What if switching to cursor pagination isn't possible due to legacy client support?" → Discuss the stable-unique-sort-key mitigation as a pragmatic middle ground.
- "How would you test this thoroughly?" → Discuss an integration test that inserts/deletes records between paginated requests and asserts no duplicates/gaps.

---

## Scenario 19 — Silent Failures After Token Expiration

### 1. Interviewer question
"Users occasionally report that parts of the app 'just stop working' — no error message, buttons seem unresponsive — and it turns out their session had expired. How would you address this?"

### 2. What the interviewer is testing
**Trade-off Analysis & Contextual Clarity** (UX + security) and **Debugging** (tracing a silent failure).

### 3. Strong candidate thinking process
- What actually happens today when an expired token is used — does the API return 401, and does the frontend handle that response at all?
- Is there a global interceptor/handler for auth errors, or does each component need to handle it individually?
- What's the right user experience here — silently redirect to login, show a message first, or attempt a silent token refresh?
- Are there in-flight requests that should be retried after a successful re-authentication?

### 4. Professional answer
"'Just stops working with no error' tells me the frontend isn't handling the 401 response at all — it's probably failing silently in a `.catch()` block that swallows the error, or not handling that status code as a distinct case. I'd first confirm the API actually returns a 401 on an expired token and trace what the frontend does with that response today. The real fix is a centralized HTTP interceptor that specifically watches for 401s, rather than relying on every component to handle authentication failures individually — that's easy to miss in some places, which is probably how we got here. From there, it's a UX decision: if the app supports refresh tokens, I'd try a silent refresh first and retry the original request; if that fails too, or there's no refresh token, I'd redirect to login with a clear message like 'your session expired,' rather than leaving the user staring at an unresponsive button. I'd also make sure this interceptor is applied globally, not just on the endpoints where someone happened to add error handling."

### 5. Step-by-step technical approach
1. Confirm the actual API behavior (401 on expired token) and trace current frontend handling.
2. Identify why the failure is silent (swallowed error, missing case).
3. Design a centralized HTTP interceptor for auth failures.
4. Decide the UX: silent refresh-and-retry vs. redirect-to-login-with-message.
5. Implement token refresh logic if supported, including retry of the original request.
6. Test both paths: refresh succeeds, refresh fails/unavailable.
7. Verify the fix covers all API calls, not just specific ones.

### 6. Technical concepts behind the answer
- **HTTP interceptors**: a centralized place to handle cross-cutting concerns like auth headers and error handling for every request.
- **Silent failure**: an error that occurs but isn't surfaced to the user or logged, making debugging and UX both worse.
- **Token refresh flow**: using a refresh token to obtain a new access token without forcing a full re-login.

### 7. Alternatives and trade-offs
- **Silent refresh + retry** — best UX (user barely notices), but adds complexity (must avoid infinite retry loops, handle concurrent requests during refresh).
- **Immediate redirect to login on 401** — simpler to implement and reason about, but interrupts the user's flow more abruptly, especially if it happens frequently.
- **Per-component error handling** — avoid this; it's exactly the inconsistency that likely caused the original bug.

### 8. What could go wrong?
Fixing this for just the specific screen the bug was reported on, leaving other screens with the same silent-failure pattern. Implementing token refresh naively and creating an infinite retry loop if the refresh itself fails. Not considering concurrent in-flight requests during a refresh, causing race conditions.

### 9. Interview signals / keywords
*HTTP interceptor*, *silent failure*, *token refresh*, *centralized error handling*, *UX for auth failures*.

### 10. Follow-up questions
- "What if multiple requests fail with 401 at the same time — do you refresh the token multiple times?" → Discuss queuing/deduplicating refresh calls so only one refresh happens and other requests wait for it.
- "How do you make sure this doesn't regress?" → Discuss an integration test simulating an expired token and asserting the interceptor behavior end-to-end.

---

## Scenario 20 — Slow Endpoint Traced to a Database Bottleneck

### 1. Interviewer question
"An endpoint that lists a user's orders along with each order's items is fine with a few orders but becomes very slow for users with hundreds of orders. How would you investigate?"

### 2. What the interviewer is testing
**Debugging, Testing & Self-Correction**, full-stack awareness of backend performance issues.

### 3. Strong candidate thinking process
- Is this scaling roughly linearly with order count, or worse (quadratic)?
- Is the backend making one query per order to fetch items — the classic N+1 query problem?
- What would confirm this — query logs, an ORM debug log, or a profiler?
- Is this purely a database issue, or does the API also serialize/transform data inefficiently?

### 4. Professional answer
"The pattern — fine with a few orders, slow with hundreds — strongly suggests an N+1 query problem: one query to get the orders, then a separate query per order to fetch its items, so the number of database round-trips grows linearly, or worse, with the number of orders. I'd confirm this by turning on query logging or looking at the ORM's debug output for this request and counting the actual number of queries executed — if it's roughly 'number of orders plus one,' that confirms the hypothesis. The fix is to replace the per-order queries with a single query that fetches all items for all the relevant orders at once — either through an ORM's eager-loading/include feature, or a JOIN, or a single `WHERE order_id IN (...)` query — and then group the results in application code. I'd verify the fix by re-checking the query count and measuring the actual response time improvement with a realistic number of orders, not just a handful."

### 5. Step-by-step technical approach
1. Reproduce with a user who has many orders.
2. Enable query logging / ORM debug output.
3. Count actual queries executed — confirm N+1 pattern.
4. Replace per-order queries with a single batched query (JOIN or IN clause / eager loading).
5. Group results in application code if needed.
6. Re-measure query count and response time.
7. Add an index on the foreign key if not already present (order_id on items table).
8. Add a regression test or monitoring for query count on this endpoint.

### 6. Technical concepts behind the answer
- **N+1 query problem**: one query to fetch a list, then a separate query per item in that list, causing query count to scale with data size.
- **Eager loading / JOIN**: fetching related data in a single query instead of many.
- **Indexing**: foreign keys used in JOIN/WHERE clauses should typically be indexed for performance at scale.

### 7. Alternatives and trade-offs
- **Eager loading via ORM** — clean, idiomatic, easy to maintain, but ORMs can sometimes over-fetch related data if not configured carefully.
- **Manual batched query + in-memory grouping** — more control and can be more efficient, but more code to maintain and more room for bugs in the grouping logic.
- **Pagination on the orders list itself** — reduces the immediate impact (fewer orders per request) but doesn't fix the underlying N+1 pattern, which will resurface as pagination size grows.

### 8. What could go wrong?
Assuming it's "just slow because of a lot of data" and reaching for caching or pagination without confirming the N+1 pattern first — that treats the symptom, not the cause, and the same inefficiency will show up elsewhere. Not verifying the fix actually reduced query count, only "feeling" faster.

### 9. Interview signals / keywords
*N+1 query problem*, *eager loading*, *batched queries*, *query count*, *indexing*.

### 10. Follow-up questions
- "What if eager loading isn't supported well by the current ORM for this relationship?" → Discuss writing the batched query manually and grouping in application code as a fallback.
- "How would you catch this kind of issue before it reaches production next time?" → Discuss query-count assertions in tests, or APM/tracing tools that flag N+1 patterns automatically.

---

# SECTION D — Testing / Git / DevOps / Security / Team Scenarios

## Scenario 21 — Merge Conflict and a Broken Build After Two Developers Work on the Same File

### 1. Interviewer question
"Two developers worked on the same file in separate branches. After merging, the build breaks. How do you handle this?"

### 2. What the interviewer is testing
**Debugging & Self-Correction**, plus professional collaboration habits (Git workflow maturity).

### 3. Strong candidate thinking process
- Is this a straightforward textual merge conflict, or a "successful" merge that's actually semantically broken (no conflict markers, but logic doesn't work together)?
- What does the build error actually say — a syntax error from a bad manual conflict resolution, or a logical incompatibility (e.g., both changed the same function's behavior differently)?
- Should I fix this alone, or is this a conversation with the other developer, since they have context I don't?
- What does the branching/review strategy look like — could this have been caught earlier with smaller, more frequent merges?

### 4. Professional answer
"First I'd read the actual build error carefully — a merge conflict that leaves in conflict markers or breaks syntax is different from a 'clean' merge that's semantically wrong, where both changes are individually valid but don't work correctly together. If it's a syntax-level issue from resolving conflict markers, that's usually quick to fix directly. If it's a semantic issue — say, one developer changed a function's return type or signature and the other's code still assumes the old one — I'd actually go talk to both developers rather than guessing at their intent, since they have context about what each change was trying to achieve. I wouldn't just pick one version and discard the other's work. Once I understand both intents, I'd figure out how to reconcile them — that might mean adjusting one side's usage to match the new signature, or realizing the two changes need a small design conversation about how they should coexist. I'd also make sure we add a test that would have caught this combination, so we don't just fix it once and see it recur."

### 5. Step-by-step technical approach
1. Read the actual build/error output carefully.
2. Distinguish syntax-level conflict resolution issues from semantic incompatibilities.
3. Talk to both developers to understand each change's intent (don't guess).
4. Reconcile the two changes deliberately, not by discarding one.
5. Fix and re-run the full test suite, not just the build.
6. Add a test covering the interaction that broke, if missing.
7. Reflect on process: would smaller/more frequent merges, or better branch hygiene, have caught this earlier?

### 6. Technical concepts behind the answer
- **Merge conflict vs semantic conflict**: Git flags textual conflicts automatically; semantic conflicts (code that merges cleanly but breaks logically) require human understanding of intent.
- **Rebase vs merge workflows**: different strategies for integrating divergent branches, each with different conflict-resolution experiences.
- **Trunk-based development / small frequent merges**: reduces the size and risk of conflicts by integrating changes more often.

### 7. Alternatives and trade-offs
- **Resolve independently based on reading the code** — faster if you're confident, but risks misunderstanding intent, especially on unfamiliar code.
- **Pair with both developers to resolve together** — slower in the moment, but much lower risk of reintroducing a bug or losing intended behavior; often the right call for non-trivial semantic conflicts.
- **Revert and re-apply changes one at a time** — useful when the conflict is too tangled to reason about directly; slower but very safe.

### 8. What could go wrong?
Picking one side's version to "make the build pass" without understanding what the other change was trying to accomplish, silently losing functionality. Not running the full test suite after resolving, assuming a passing build means everything is correct. Treating this as purely a technical problem when it's partly a communication problem.

### 9. Interview signals / keywords
*Semantic conflict*, *merge vs rebase*, *intent*, *collaboration*, *regression testing*.

### 10. Follow-up questions
- "What if the two developers disagree about how to resolve it?" → Discuss facilitating a short discussion focused on the actual requirement/goal, possibly looping in a tech lead if it's a genuine design disagreement.
- "How would you prevent this kind of conflict in the future?" → Discuss smaller PRs, more frequent integration, and clear ownership/communication when touching shared files.

---

## Scenario 22 — Requirements Change Halfway Through Implementation

### 1. Interviewer question
"You're halfway through building a feature based on an initial requirement, and the product owner tells you the requirement has changed in a way that affects your current design. How do you handle this?"

### 2. What the interviewer is testing
**Problem Decomposition & Planning** and **Trade-off Analysis & Contextual Clarity** — adapting a plan, not just accepting or resisting change blindly.

### 3. Strong candidate thinking process
- What exactly changed, and how much of my current work is actually affected versus reusable?
- Is this a small adjustment or a fundamental shift that invalidates my current architecture?
- What are the time/scope trade-offs — do we ship the original scope now and iterate, or fully pivot?
- Do I need to renegotiate the timeline, or can this be absorbed without impact?

### 4. Professional answer
"My first step would be to actually understand the new requirement clearly — I'd ask the product owner what specifically changed and why, since that context often affects how I should adapt the design, not just what to change. Then I'd assess my current work honestly: is this a change that only affects, say, the UI layer, while my data model and API design still hold up, or does it change something fundamental, like the data structure itself? If it's fundamental, I'd be upfront about the impact on the timeline rather than quietly trying to absorb it and risk delivering something rushed or incomplete — that's a trade-off conversation, not just a technical one. Where possible, I'd try to reuse what's still valid rather than starting over, and I'd break the remaining work into smaller pieces again given the new understanding, rather than trying to redesign everything in my head at once. I'd rather have a slightly uncomfortable but honest conversation about scope or timeline now than surprise everyone later."

### 5. Step-by-step technical approach
1. Clarify the new requirement precisely with the product owner.
2. Assess what existing work is still valid vs invalidated.
3. Estimate the actual impact on scope/timeline.
4. Communicate trade-offs honestly (timeline, reduced scope, or both) rather than silently absorbing risk.
5. Re-decompose the remaining work based on the new requirement.
6. Reuse valid components/logic where possible.
7. Proceed incrementally, checking in earlier this time to avoid another late surprise.

### 6. Technical concepts behind the answer
- **Sunk cost awareness**: recognizing what work is genuinely reusable vs what should be let go, without emotional attachment to discarded effort.
- **Scope/timeline trade-off communication**: technical work always has to be reconciled with business constraints; part of professional maturity is surfacing that clearly.
- **Incremental delivery**: breaking remaining work into smaller checkpoints reduces the risk of another late, expensive surprise.

### 7. Alternatives and trade-offs
- **Absorb the change silently and work extra hours** — might seem like the "helpful" choice short-term, but hides real cost from stakeholders and isn't sustainable; usually a weak long-term choice.
- **Push back and refuse to adjust scope** — sometimes appropriate if the change is unreasonable given constraints, but should be framed around trade-offs, not just resistance.
- **Renegotiate scope/timeline transparently** — usually the most professional and sustainable option, keeping stakeholders informed and decisions realistic.

### 8. What could go wrong?
Silently trying to accommodate a major change without flagging the timeline impact, leading to a rushed, buggy delivery. Getting frustrated and resisting the change instead of engaging with why it happened. Not re-assessing which parts of the existing implementation are actually still valid, and redoing work unnecessarily.

### 9. Interview signals / keywords
*Scope negotiation*, *incremental delivery*, *communication*, *reusability assessment*, *professional maturity*.

### 10. Follow-up questions
- "What if the product owner insists the timeline can't move despite the bigger scope?" → Discuss proposing a reduced-scope version that meets the deadline, with the rest as a fast follow-up, and being explicit about that trade-off.
- "How would you avoid this kind of late surprise in the future?" → Discuss earlier and more frequent check-ins/demos during implementation, so requirement misalignment surfaces sooner.

---

## Scenario 23 — Reviewing AI-Generated Code That Looks Fine but Has a Security Gap

### 1. Interviewer question
"A teammate used an AI assistant to generate an API endpoint for updating user settings, and it looks clean and works in testing. During review, you notice it doesn't check whether the requesting user actually owns the settings being updated. What do you do?"

### 2. What the interviewer is testing
**Trade-off Analysis & Contextual Clarity** with a strong security angle, and awareness of responsible AI-assisted development practices.

### 3. Strong candidate thinking process
- AI-generated code often looks syntactically clean and "textbook correct" while missing context-specific concerns like authorization — this is a known blind spot.
- Is this a missing authorization check specifically (any authenticated user can edit any other user's settings), or a broader pattern of missing security considerations in this PR?
- How would I raise this in review without it sounding like blaming the tool or the teammate?
- Is this a one-off, or does it suggest we need better guardrails (checklists, tests) for AI-assisted code in general?

### 4. Professional answer
"This is a really common blind spot with AI-generated code — it tends to produce something that looks complete and follows good syntax and structure, but AI assistants don't automatically know your specific authorization model unless it's explicitly part of the prompt or the existing code patterns it's drawing from. In this case, the endpoint works in testing because the test probably used the same user updating their own settings — it wouldn't necessarily catch that any authenticated user could update *anyone's* settings by just changing an ID in the request. In review, I'd flag it clearly and specifically: 'this endpoint doesn't verify the requester owns this settings resource — I'd want an explicit check comparing the authenticated user's ID against the resource's owner before allowing the update.' I'd frame it as a normal code-review finding, not as calling out the use of AI, since the same kind of gap can happen in hand-written code too. I'd also suggest, if this happens more than once, that the team add an explicit item to the PR checklist — or a security-focused test — specifically about authorization, since it's exactly the kind of context-dependent concern that's easy for both a human and an AI assistant to miss without deliberate attention."

### 5. Step-by-step technical approach
1. Identify the specific missing check (ownership/authorization) precisely.
2. Verify the concern with a quick test: can user A modify user B's settings?
3. Raise it as a normal, specific code review comment.
4. Discuss the fix: add an explicit ownership/authorization check before the mutation.
5. Add or request a test specifically covering the cross-user access case.
6. If this is a recurring pattern, propose a team-level checklist item or automated check for authorization on mutation endpoints.

### 6. Technical concepts behind the answer
- **Authorization vs authentication**: authentication confirms who the user is; authorization confirms what they're allowed to do — this bug is an authorization gap.
- **AI-assisted development limits**: generated code reflects common patterns, not necessarily your specific security/business rules, so review still matters.
- **Defense-in-depth in code review**: catching context-specific issues (like ownership checks) that automated tools and even AI assistants commonly miss.

### 7. Alternatives and trade-offs
- **Flag and fix in review (this case)** — correct approach; catches the issue before it reaches production.
- **Rely on tests alone to catch this** — insufficient here, since the existing test happened to use a same-user scenario; tests need to be written with adversarial cases in mind, not just happy paths.
- **Broad distrust of AI-generated code (reject it outright)** — overcorrection; the tool itself isn't the problem, the missing review discipline is. The realistic answer is "review AI-assisted code like any other code, with extra attention to context-specific rules."

### 8. What could go wrong?
Assuming that because the code "looks clean" and passes existing tests, it's safe — that's exactly the trap here. Blaming the AI tool or the teammate personally instead of focusing on the missing check and the process gap. Not writing an adversarial test (different user IDs) to actually confirm the fix.

### 9. Interview signals / keywords
*Authorization vs authentication*, *ownership check*, *adversarial testing*, *code review discipline*, *AI-assisted development*.

### 10. Follow-up questions
- "How would you validate AI-generated code differently from human-written code, if at all?" → Explain the review process should be largely the same, but you'd be specifically alert to context the AI couldn't have known (business rules, authorization model, edge cases specific to this domain).
- "What if this pattern shows up across multiple PRs from different developers using AI tools?" → Discuss adding a reusable authorization-check pattern/middleware, plus explicit team guidance on documenting security context when using AI assistance.

---

# SECTION E — Mobile / Flutter Scenarios

## Scenario 24 — App Behaves Differently on iOS vs Android

### 1. Interviewer question
"A Flutter feature works correctly on Android but shows a visual glitch or a crash on iOS only. How would you investigate?"

### 2. What the interviewer is testing
**Debugging, Testing & Self-Correction**, and awareness that Flutter's "one codebase" promise still has platform-specific edges.

### 3. Strong candidate thinking process
- Is this a rendering/layout issue (safe areas, notches) or a functional crash (platform-specific API/plugin behavior)?
- Does the code use any platform channels or plugins with different native implementations per platform?
- What does the actual iOS error/log say — a Dart exception, or a native crash log?
- Is this reproducible on an iOS simulator, or only physical devices (which could point to permissions/hardware-specific issues)?

### 4. Professional answer
"Flutter shares most UI code across platforms, but a lot of platform-specific behavior still leaks through — safe area handling, permissions, and any plugin that wraps native iOS/Android APIs differently. So my first step is figuring out whether this is a layout/rendering issue or an actual functional crash, since they point in very different directions. If it's visual — say, content overlapping the notch or status bar — that's usually a safe-area or padding issue that Android's layout happens to tolerate differently than iOS. If it's a crash, I'd check whether this feature uses any plugin or platform channel, since a lot of iOS-only bugs come from a plugin's iOS implementation behaving differently — missing a required Info.plist permission entry, for example, which iOS enforces much more strictly than Android for things like camera or location access. I'd pull the actual iOS crash log or Xcode console output rather than guessing, since that usually points directly at the native-side issue, and I'd try to reproduce on a simulator first before assuming it's device-specific."

### 5. Step-by-step technical approach
1. Classify the issue: visual/layout vs functional crash.
2. Check for platform-specific plugin/platform-channel usage in this feature.
3. Pull actual iOS logs/Xcode console output (not just Dart-side errors).
4. Check for missing iOS-specific configuration (Info.plist permissions, entitlements).
5. Reproduce on simulator first, then physical device if needed.
6. Apply the platform-specific fix (safe area widget, permission entry, plugin config).
7. Test on both platforms after the fix to confirm no regression on Android.

### 6. Technical concepts behind the answer
- **Platform channels**: Flutter's mechanism for calling native iOS/Android code, a common source of platform-specific bugs.
- **Safe area handling**: iOS devices with notches/home indicators require explicit safe-area-aware layout (`SafeArea` widget) that Android may not need in the same way.
- **Platform-specific configuration**: iOS often requires explicit permission strings in `Info.plist`, while Android's manifest has a different model — missing these causes iOS-only crashes.

### 7. Alternatives and trade-offs
- **Fix at the widget/layout level (e.g., SafeArea)** — appropriate for visual glitches; simple and idiomatic Flutter solution.
- **Fix at the native configuration level (Info.plist, entitlements)** — necessary for permission-related crashes; requires some native iOS knowledge, not just Dart.
- **Platform-conditional code (`Platform.isIOS`)** — sometimes necessary for genuinely different behavior, but should be used sparingly, since overusing it undermines the benefit of a shared codebase.

### 8. What could go wrong?
Assuming Flutter's cross-platform nature means platform-specific bugs "shouldn't happen" and spending too long looking only at Dart code when the real issue is native configuration. Not checking actual iOS logs and guessing instead.

### 9. Interview signals / keywords
*Platform channel*, *safe area*, *Info.plist / entitlements*, *platform-specific configuration*, *native logs*.

### 10. Follow-up questions
- "What if the crash only happens on certain iOS versions?" → Discuss checking Apple's changelog for API deprecations/behavior changes in that iOS version and testing against the minimum supported OS version.
- "How would you prevent platform-specific regressions going forward?" → Discuss testing on both platforms as part of the standard PR/CI process, not just Android.

---

## Scenario 25 — Flutter Widget Rebuilds Too Often, Causing Jank

### 1. Interviewer question
"A Flutter screen with a live-updating list feels janky — scrolling stutters and the UI seems to freeze briefly during updates. How would you approach this?"

### 2. What the interviewer is testing
**Debugging & Trade-off Analysis** — understanding of Flutter's widget rebuild model and state management scope.

### 3. Strong candidate thinking process
- Is the entire screen rebuilding on every state update, or just the part that actually changed?
- Is `setState` being called at a high level (e.g., the whole screen's StatefulWidget) instead of scoped to just the widget that needs to change?
- Is there expensive work happening inside the `build()` method itself (not just excessive rebuild frequency)?
- What tool would confirm this — Flutter DevTools' widget rebuild profiler?

### 4. Professional answer
"This pattern — jank during frequent updates — usually points to rebuilding more of the widget tree than necessary. I'd start with Flutter DevTools' performance/rebuild tracking to see exactly which widgets rebuild on each update and how often. A common cause is calling `setState` at a high level, like the whole screen's `StatefulWidget`, which forces the entire subtree to rebuild even if only one list item actually changed. If that's confirmed, the fix is to scope state more precisely — for example using something like a `ValueNotifier`/`ValueListenableBuilder` or a state-management solution like Provider/Riverpod/Bloc so that only the specific widget depending on the changed value rebuilds, rather than the whole screen. I'd also check whether `build()` itself does anything expensive — like recomputing a filtered/sorted list on every call — since that cost is paid on every rebuild regardless of scope, and should be memoized or moved out of the build method."

### 5. Step-by-step technical approach
1. Profile with Flutter DevTools to see actual rebuild frequency and scope.
2. Identify where `setState` (or equivalent) is called and how broad its scope is.
3. Check `build()` for expensive synchronous work re-executed every rebuild.
4. Scope state updates more precisely (ValueListenableBuilder, Provider/Riverpod selectors, Bloc).
5. Move/memoize expensive computation out of the rebuild path.
6. Re-profile to confirm reduced rebuild scope and improved frame times.
7. Verify with real scrolling/interaction, not just isolated updates.

### 6. Technical concepts behind the answer
- **Widget rebuild scope**: calling `setState` rebuilds the enclosing widget and its subtree — the higher up the call, the more gets rebuilt.
- **Fine-grained reactivity (ValueListenableBuilder, Provider selectors)**: narrowing rebuilds to only the specific widget that depends on changed data.
- **build() cost**: any computation inside `build()` runs every time that widget rebuilds, so expensive logic there compounds the problem.

### 7. Alternatives and trade-offs
- **Scoped state management (Provider/Riverpod/Bloc with selectors)** — solves the rebuild-scope problem cleanly, but requires some upfront architecture and learning curve if not already in place.
- **Just wrapping expensive computation in memoization** — quick partial win if the rebuild scope itself is acceptable but the computation cost isn't; doesn't address unnecessary rebuild scope on its own.
- **`const` constructors and widget extraction** — cheap, easy improvements (letting Flutter skip rebuilding unchanged subtrees) that pair well with either of the above.

### 8. What could go wrong?
Assuming the issue is inherently "Flutter is slow" instead of investigating the actual rebuild scope with profiling tools. Adding a broad state-management library without first confirming that rebuild scope, not computation cost, is the actual bottleneck. Not verifying the fix with the profiler afterward, relying only on "it feels smoother."

### 9. Interview signals / keywords
*Widget rebuild scope*, *setState granularity*, *ValueListenableBuilder*, *memoization*, *Flutter DevTools profiling*.

### 10. Follow-up questions
- "What if profiling shows rebuild scope is already narrow, but jank persists?" → Discuss looking at expensive `build()` logic, image decoding costs, or the underlying list itself being too large without virtualization (e.g., not using `ListView.builder`).
- "How does this compare to the Angular change-detection scenario from earlier?" → Draw the parallel: both are about scoping what needs to re-render/re-check rather than recomputing everything on every change.

---

# SECTION F — Patterns and Final Checklist

## The mental framework to carry into the interview

**Clarify → Decompose → Hypothesize → Investigate → Isolate → Decide → Implement → Verify → Communicate**

- **Clarify**: What's ambiguous? What do I need to know before I start?
- **Decompose**: Break the problem into independent, manageable parts.
- **Hypothesize**: State what I believe is happening — out loud, before acting.
- **Investigate**: Gather real evidence (logs, profiler, network tab, reproduction) — don't guess.
- **Isolate**: Narrow down to the specific cause systematically, one variable at a time.
- **Decide**: Choose an approach deliberately, weighing trade-offs against context (not "the only correct way").
- **Implement**: Make the targeted change — avoid changing several things simultaneously.
- **Verify**: Confirm the fix actually addresses the root cause, re-test, check for regressions.
- **Communicate**: Narrate this whole process out loud, clearly, without unnecessary jargon.

### Common weak interview behaviors
- Jumping straight to a solution before clarifying the problem.
- Presenting only one possible approach, with no trade-offs discussed.
- Guessing at a root cause instead of describing how you'd gather evidence.
- Changing multiple things at once so you can't tell what actually fixed it.
- Treating every answer as if there's one single "correct" solution.
- Going silent while thinking instead of narrating your reasoning.
- Overusing buzzwords without tying them to what's actually happening in the scenario.
- Not adjusting your approach when the interviewer introduces new information mid-question.

### Strong interview behaviors
- Asking a targeted clarifying question before diving in.
- Explicitly stating assumptions when you can't ask ("I'll assume X for now — let me know if that's wrong").
- Saying "my hypothesis is..." before proposing a fix.
- Mentioning what you'd measure or look at first, specifically.
- Comparing at least two approaches and explaining the trade-off, even briefly.
- Adjusting your answer cleanly when new constraints are introduced, rather than defending your first idea.
- Distinguishing a quick fix from a long-term solution when relevant.
- Speaking in plain, clear language, using precise technical terms only where they add clarity.

### Technical vocabulary cheat sheet
- **Root cause** — the actual underlying reason for a problem, as opposed to its visible symptom.
- **Hypothesis** — a stated, testable belief about what's causing an issue, before you've confirmed it.
- **Isolation** — narrowing down a problem by systematically eliminating variables until the cause is found.
- **Race condition** — a bug caused by unpredictable timing between concurrent operations.
- **Regression** — a previously working feature breaking due to a new change.
- **Coupling / cohesion** — how dependent parts of a system are on each other (coupling) versus how focused a single part is on one responsibility (cohesion); lower coupling and higher cohesion are usually desirable.
- **Scalability** — how well a system continues to perform as load or data size grows.
- **Maintainability** — how easily a system can be understood, modified, and extended over time.
- **Trade-off** — a deliberate choice that gains something at the cost of something else, made explicit rather than left implicit.
- **Bottleneck** — the specific part of a system limiting overall performance.
- **Memory leak** — memory that should be released but remains referenced, growing over time.
- **State synchronization** — ensuring different parts of a system reflect the same underlying data consistently.
- **Separation of concerns** — structuring code so each part handles one distinct responsibility.
- **Idempotency** — an operation that produces the same result no matter how many times it's applied (important for retries).
- **Caching** — storing a computed or fetched result to avoid recomputing/refetching it unnecessarily.
- **Debouncing / throttling** — debouncing delays action until input pauses; throttling limits how often an action can fire regardless of input frequency.
- **Optimistic update** — updating the UI before backend confirmation, for a faster feel, with a rollback plan if it fails.

### Last-minute preparation checklist

**Tonight:**
- Re-read the three modules once and say them out loud from memory — you should be able to name them without looking.
- Pick 4–5 scenarios from this guide (spread across categories) and practice answering them out loud, timing yourself to roughly 2–3 minutes per answer.
- Practice one scenario where you deliberately ask a clarifying question before answering — this is a muscle, not a fact to memorize.
- Review the vocabulary cheat sheet once, focusing on terms you're less confident explaining in your own words.
- Get a full night's sleep — reasoning clearly matters more than cramming more scenarios.

**During the interview:**
- Turn your video on and make sure the session can record — this is a hard requirement (failure = 0).
- Think out loud, even when you're unsure — the interviewers are watching your process, not just your final answer.
- If a question is ambiguous, ask before diving in — this is expected and rewarded, not a weakness.
- When you don't know something specific, say so honestly and explain how you'd find out, rather than guessing confidently.
- If the interviewer adds new information mid-answer, pause, acknowledge it explicitly, and adjust your reasoning out loud rather than ignoring it.
- Stay calm if you make a mistake — catching and correcting yourself is itself a good signal for "Debugging, Testing & Self-Correction."
