"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const engine = require("../js/engine.js");
const snapshot = require("../js/snapshot.js");

describe("matchup play-here probability", () => {
  it("is 100% for an opening-round billed match (they are already in that slot)", () => {
    const players = {
      ace: { id: "ace", rank: 5, rankPrev: 5 },
      bee: { id: "bee", rank: 40, rankPrev: 40 },
      cal: { id: "cal", rank: 8, rankPrev: 8 },
      dot: { id: "dot", rank: 50, rankPrev: 50 },
    };
    const result = engine.predictBracket(
      {
        id: "t",
        opening: [
          { slot: 0, player1Id: "ace", player2Id: "bee", status: "scheduled" },
          { slot: 1, player1Id: "cal", player2Id: "dot", status: "scheduled" },
        ],
      },
      { players, h2h: [] }
    );
    assert.equal(result.rounds[0][0].happenProb, 1);
    assert.equal(result.rounds[0][1].happenProb, 1);
  });

  it("makes a later-round pairing the product of both players winning their prior matches", () => {
    const players = {
      ace: { id: "ace", rank: 5, rankPrev: 5 },
      bee: { id: "bee", rank: 80, rankPrev: 80 },
      cal: { id: "cal", rank: 6, rankPrev: 6 },
      dot: { id: "dot", rank: 90, rankPrev: 90 },
    };
    const ctx = { players, h2h: [] };
    const result = engine.predictBracket(
      {
        id: "t",
        opening: [
          { slot: 0, player1Id: "ace", player2Id: "bee", status: "scheduled" },
          { slot: 1, player1Id: "cal", player2Id: "dot", status: "scheduled" },
        ],
      },
      ctx
    );
    const pAce = engine.winProbability("ace", "bee", ctx);
    const pCal = engine.winProbability("cal", "dot", ctx);
    const final = result.rounds[1][0];
    assert.equal(final.player1Id, "ace");
    assert.equal(final.player2Id, "cal");
    assert.ok(Math.abs(final.happenProb - pAce * pCal) < 1e-9, "got " + final.happenProb + " expected " + pAce * pCal);
    assert.ok(final.happenProb < 1);
    assert.ok(final.happenProb > 0.5);
  });

  it("locks happenProb at 1 when a prior match is already complete", () => {
    const players = {
      ace: { id: "ace", rank: 5, rankPrev: 5 },
      bee: { id: "bee", rank: 40, rankPrev: 40 },
      cal: { id: "cal", rank: 8, rankPrev: 8 },
      dot: { id: "dot", rank: 50, rankPrev: 50 },
    };
    const ctx = { players, h2h: [] };
    const result = engine.predictBracket(
      {
        id: "t",
        opening: [
          { slot: 0, player1Id: "ace", player2Id: "bee", status: "complete", winnerId: "bee", score: "6-1 6-1" },
          { slot: 1, player1Id: "cal", player2Id: "dot", status: "scheduled" },
        ],
      },
      ctx
    );
    const pCal = engine.winProbability("cal", "dot", ctx);
    const final = result.rounds[1][0];
    assert.equal(final.player1Id, "bee");
    assert.ok(Math.abs(final.happenProb - pCal) < 1e-9, "got " + final.happenProb);
  });

  it("puts ~100% play-here on today's Ashe openers and a lower % on the projected men's final", () => {
    const all = engine.predictAllBrackets(snapshot);
    const opener = all.ms.rounds[0].find((m) => m.player1Id === "alcaraz" || m.player2Id === "alcaraz");
    assert.ok(opener);
    assert.equal(opener.happenProb, 1);
    const final = all.ms.rounds[all.ms.rounds.length - 1][0];
    assert.ok(final.happenProb < 0.5, "projected final happenProb " + final.happenProb);
    const view = engine.groupCalendar(snapshot, "2026-08-31", "day", { predictions: all });
    const ashe = view.venues.find((v) => v.name === "Arthur Ashe");
    const sab = ashe.matches.find((m) => m.player1Id === "sabalenka" || m.player2Id === "sabalenka");
    assert.ok(sab);
    assert.equal(sab.happenProb, 1);
    const later = engine.groupCalendar(snapshot, "2026-09-13", "day", { predictions: all });
    const asheFinal = later.venues.find((v) => v.name === "Arthur Ashe");
    assert.ok(asheFinal.matches[0]);
    assert.ok(asheFinal.matches[0].happenProb < 0.5, "final session happen " + asheFinal.matches[0].happenProb);
  });
});
