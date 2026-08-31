"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const engine = require("../js/engine.js");
const snapshot = require("../js/snapshot.js");

describe("shipped session mapping", () => {
  const predictions = engine.predictAllBrackets(snapshot);

  it("numbers official sessions from the 2026 grid (Aug 30 = 1, Aug 31 day = 3, R16 weekend = 15)", () => {
    assert.equal(engine.officialSessionNumber("2026-08-30", "day"), 1);
    assert.equal(engine.officialSessionNumber("2026-08-30", "night"), 2);
    assert.equal(engine.officialSessionNumber("2026-08-31", "day"), 3);
    assert.equal(engine.officialSessionNumber("2026-09-06", "day"), 15);
    assert.equal(engine.officialSessionNumber("2026-09-06", "night"), 16);
    assert.equal(engine.officialSessionNumber("2026-09-13", "day"), 27);
  });

  it("keeps completed matchups on their observed session (Navone-Djokovic = Session 2 Arthur Ashe night)", () => {
    const r128 = predictions.ms.rounds[0];
    const m = r128.find(
      (x) =>
        (x.player1Id === "navone" && x.player2Id === "djokovic") ||
        (x.player1Id === "djokovic" && x.player2Id === "navone")
    );
    assert.ok(m && m.session);
    assert.equal(m.session.sessionNumber, 2);
    assert.equal(m.session.venue, "Arthur Ashe");
    assert.equal(m.session.dayNight, "night");
    assert.equal(m.session.observed, true);
  });

  it("maps Round of 16 to Sessions 15–18 split across Arthur Ashe and Louis Armstrong", () => {
    const r16 = predictions.ms.rounds.find((r) => r[0] && r[0].roundLabel === "Round of 16");
    assert.ok(r16);
    assert.equal(r16.length, 8);
    const nums = r16.map((m) => m.session && m.session.sessionNumber);
    const venues = r16.map((m) => m.session && m.session.venue);
    nums.forEach((n) => {
      assert.ok(n >= 15 && n <= 18, "R16 session " + n);
    });
    assert.ok(venues.includes("Arthur Ashe"));
    assert.ok(venues.includes("Louis Armstrong"));
    const ashe = r16.filter((m) => m.session.venue === "Arthur Ashe");
    const arm = r16.filter((m) => m.session.venue === "Louis Armstrong");
    assert.ok(ashe.length >= 2, "at least two R16 matches at Ashe");
    assert.ok(arm.length >= 1, "at least one R16 match at Armstrong");
    ashe.forEach((m) => {
      assert.match(m.session.sessionLabel, /^Session 1[5-8]$/);
    });
  });

  it("puts the women's final on Session 26 Ashe and the men's final on Session 27 Ashe", () => {
    const wf = predictions.ws.rounds[predictions.ws.rounds.length - 1][0];
    const mf = predictions.ms.rounds[predictions.ms.rounds.length - 1][0];
    assert.equal(wf.session.sessionNumber, 26);
    assert.equal(wf.session.venue, "Arthur Ashe");
    assert.equal(mf.session.sessionNumber, 27);
    assert.equal(mf.session.venue, "Arthur Ashe");
  });
});
