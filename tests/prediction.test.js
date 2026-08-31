"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const engine = require("../js/engine.js");
const snapshot = require("../js/snapshot.js");

describe("shipped predictMatch / predictBracket", () => {
  it("locks completed winners and still fills every remaining slot", () => {
    const players = {
      ace: { id: "ace", name: "Ace", rank: 8, rankPrev: 12 },
      bee: { id: "bee", name: "Bee", rank: 40, rankPrev: 38 },
      cal: { id: "cal", name: "Cal", rank: 3, rankPrev: 2 },
      dot: { id: "dot", name: "Dot", rank: 55, rankPrev: 70 },
    };
    const bracket = {
      id: "slice",
      name: "Test Draw",
      opening: [
        { slot: 0, player1Id: "ace", player2Id: "bee", status: "complete", winnerId: "bee", score: "7-6 1-6 6-3" },
        { slot: 1, player1Id: "cal", player2Id: "dot", status: "scheduled" },
      ],
    };
    const result = engine.predictBracket(bracket, { players, h2h: [] });
    assert.equal(result.rounds[0][0].winnerId, "bee");
    assert.equal(result.rounds[0][0].locked, true);
    assert.ok(result.rounds[0][1].winnerId === "cal" || result.rounds[0][1].winnerId === "dot");
    assert.equal(result.rounds.length, 2);
    assert.ok(result.rounds[1][0].winnerId);
    assert.equal(result.championId, result.rounds[1][0].winnerId);
    const slots = result.rounds.reduce((n, r) => n + r.length, 0);
    assert.equal(slots, 3);
    for (const round of result.rounds) {
      for (const match of round) {
        assert.ok(match.winnerId, "every remaining slot needs a predicted winner");
      }
    }
  });

  it("weights more-recent H2H higher when ranking and direction are equal", () => {
    const players = {
      left: { id: "left", name: "Left", rank: 20, rankPrev: 20 },
      right: { id: "right", name: "Right", rank: 20, rankPrev: 20 },
    };
    const h2h = [
      { winnerId: "right", loserId: "left", date: "2022-01-15" },
      { winnerId: "right", loserId: "left", date: "2023-06-01" },
      { winnerId: "left", loserId: "right", date: "2026-08-01" },
    ];
    const p = engine.winProbability("left", "right", { players, h2h, nowMs: Date.parse("2026-08-31") });
    assert.ok(p > 0.5, "recent left win should outweigh older right wins, got " + p);
    const adv = engine.h2hAdvantage("left", "right", h2h, Date.parse("2026-08-31"));
    assert.ok(adv > 0, "h2h advantage should favor the more recent winner");
  });

  it("raises win probability for better rank plus improving direction vs a declining lower-ranked opponent", () => {
    const rising = { id: "rising", name: "Rising", rank: 8, rankPrev: 24 };
    const fading = { id: "fading", name: "Fading", rank: 40, rankPrev: 22 };
    const p = engine.winProbability(rising, fading, { players: { rising, fading }, h2h: [] });
    const pRev = engine.winProbability(fading, rising, { players: { rising, fading }, h2h: [] });
    assert.ok(p > 0.62, "favorite should be clearly ahead, got " + p);
    assert.ok(p > pRev);
    const flatPeer = { id: "peer", name: "Peer", rank: 8, rankPrev: 8 };
    const vsFlat = engine.winProbability(rising, flatPeer, {
      players: { rising, peer: flatPeer },
      h2h: [],
    });
    assert.ok(vsFlat > 0.5, "improving direction should beat an equal-ranked declining-or-flat peer");
  });

  it("fills every slot on the shipped 2026 singles draws and keeps Day 1 winners locked", () => {
    const ctx = {
      players: snapshot.players,
      h2h: snapshot.h2h,
      nowMs: Date.parse(snapshot.asOf),
    };
    const men = engine.predictBracket(snapshot.brackets.ms, ctx);
    const women = engine.predictBracket(snapshot.brackets.ws, ctx);
    assert.equal(men.rounds[0].length, 64);
    assert.equal(women.rounds[0].length, 64);
    assert.equal(men.rounds[men.rounds.length - 1].length, 1);
    assert.equal(women.rounds[women.rounds.length - 1].length, 1);
    assert.ok(men.championId);
    assert.ok(women.championId);
    const med = men.rounds[0].find((m) => m.player1Id === "medvedev" || m.player2Id === "medvedev");
    assert.equal(med.winnerId, "medvedev");
    assert.equal(med.locked, true);
    const navi = men.rounds[0].find((m) => m.player1Id === "navone" || m.player2Id === "navone");
    assert.equal(navi.winnerId, "navone");
    assert.notEqual(navi.winnerId, "djokovic");
    for (const round of men.rounds.concat(women.rounds)) {
      for (const match of round) {
        assert.ok(match.winnerId);
      }
    }
    const all = engine.predictAllBrackets(snapshot);
    assert.ok(all.ms && all.ws && all.md && all.wd && all.xd);
    assert.equal(all.xd.championId, "mx-muc-men");
  });
});
