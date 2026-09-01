"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const engine = require("../js/engine.js");
const snapshot = require("../js/snapshot.js");

describe("shipped learnings and fine-tune", () => {
  it("grades completed matches from yesterday and today without using locked 100% scores", () => {
    engine.setWeights(engine.DEFAULT_WEIGHTS);
    const L = engine.learnFromCompleted(snapshot);
    assert.ok(L.n >= 8, "need completed openers, got " + L.n);
    assert.ok(L.hits <= L.n);
    assert.ok(L.accuracy >= 0 && L.accuracy <= 1);
    assert.ok(L.byDay["2026-08-30"] && L.byDay["2026-08-30"].n > 0);
    const navi = L.misses.find(
      (m) => m.winnerId === "navone" || m.predictedId === "djokovic" || m.player1Id === "navone" || m.player2Id === "navone"
    );
    assert.ok(navi, "Djokovic/Navone should grade as a model miss");
  });

  it("fineTune from results writes new weights and does not lower graded n", () => {
    engine.setWeights(engine.DEFAULT_WEIGHTS);
    const before = engine.learnFromCompleted(snapshot);
    const tuned = engine.fineTune(snapshot);
    assert.equal(tuned.after.n, before.n);
    assert.ok(tuned.after.logLoss <= before.logLoss + 1e-9);
    const w = engine.getWeights();
    assert.equal(typeof w.ranking, "number");
    assert.equal(typeof w.direction, "number");
    assert.equal(typeof w.h2h, "number");
    engine.setWeights(engine.DEFAULT_WEIGHTS);
  });
});
