/**
 * types.ts
 * ---------------------------------------------------------------------
 * Every data contract for the Journal App lives here. Nothing in this
 * file touches the DOM or localStorage — it's pure type/shape
 * definitions, so it can be imported anywhere without side effects.
 */
/** The fixed set of moods a journal entry can be tagged with. */
export var Mood;
(function (Mood) {
    Mood["HAPPY"] = "HAPPY";
    Mood["SAD"] = "SAD";
    Mood["MOTIVATED"] = "MOTIVATED";
    Mood["STRESSED"] = "STRESSED";
    Mood["CALM"] = "CALM";
})(Mood || (Mood = {}));
//# sourceMappingURL=types.js.map