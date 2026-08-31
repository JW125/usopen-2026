"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const engine = require("../js/engine.js");
const snapshot = require("../js/snapshot.js");

describe("shipped priceSession / hottestScore", () => {
  const predictions = engine.predictAllBrackets(snapshot);
  const ctx = { snapshot, predictions, players: snapshot.players, h2h: snapshot.h2h };

  it("emits numeric grounds and stadium prices and an up/down/flat direction", () => {
    const mondayDay = snapshot.sessions.find((s) => s.id === "s3-day");
    const priced = engine.priceSession(mondayDay, ctx);
    assert.equal(typeof priced.stadiumPrice, "number");
    assert.ok(priced.stadiumPrice > 0);
    assert.equal(typeof priced.groundsPrice, "number");
    assert.ok(priced.groundsPrice > 0);
    assert.ok(["up", "down", "flat"].includes(priced.direction));
    assert.equal(typeof priced.prices.groundsResale, "number");
    assert.equal(typeof priced.prices.stadiumResale, "number");
  });

  it("scores a high-rank Ashe/Armstrong night hotter and more bid-side than a low-demand outer court", () => {
    const asheNight = {
      date: "2026-08-31",
      dayNight: "night",
      venue: "Arthur Ashe",
      matches: [
        { player1Id: "shelton", player2Id: "griekspoor" },
        { player1Id: "osaka", player2Id: "zakharova" },
      ],
      price: { list: 99, resaleLow: 99, resaleHigh: 650 },
      venues: [
        {
          name: "Arthur Ashe",
          price: { list: 99, resaleLow: 99, resaleHigh: 650 },
          matches: [{ player1Id: "shelton", player2Id: "griekspoor" }],
        },
        { name: "Grounds", price: { list: 65, resaleLow: 248 } },
      ],
    };
    const outer = {
      date: "2026-08-31",
      dayNight: "day",
      venue: "Court 13",
      matches: [{ player1Id: "tagger", player2Id: "korpatsch" }],
      price: { list: 0, resaleLow: 0, resaleHigh: 0 },
      venues: [
        { name: "Court 13", matches: [{ player1Id: "tagger", player2Id: "korpatsch" }] },
        { name: "Grounds", price: { list: 65, resaleLow: 80 } },
      ],
    };
    const hotAshe = engine.hottestScore(
      { player1Id: "shelton", player2Id: "griekspoor", venue: "Arthur Ashe", dayNight: "night" },
      ctx
    );
    const hotOuter = engine.hottestScore(
      { player1Id: "tagger", player2Id: "korpatsch", venue: "Court 13", dayNight: "day" },
      ctx
    );
    assert.ok(hotAshe > hotOuter, "Ashe night heat " + hotAshe + " vs outer " + hotOuter);
    const pAshe = engine.priceSession(asheNight, ctx);
    const pOuter = engine.priceSession(outer, ctx);
    assert.ok(pAshe.tilt > pOuter.tilt, "Ashe tilt " + pAshe.tilt + " vs outer " + pOuter.tilt);
    assert.ok(engine.DIR_RANK[pAshe.direction] >= engine.DIR_RANK[pOuter.direction]);
    assert.notEqual(pAshe.direction, "down");
  });

  it("moves direction down when a billed star matchup is predicted not to happen", () => {
    const fading = { id: "star", name: "Star", rank: 80, rankPrev: 90 };
    const cannon = { id: "cannon", name: "Cannon", rank: 2, rankPrev: 2 };
    const other = { id: "other", name: "Other", rank: 70, rankPrev: 70 };
    const nightOpp = { id: "nightopp", name: "Night Opp", rank: 12, rankPrev: 12 };
    const mini = {
      players: { star: fading, cannon, other, nightopp: nightOpp },
      h2h: [],
      asOf: "2026-08-31",
      brackets: {
        ms: {
          id: "ms",
          name: "Men's Singles",
          opening: [
            { slot: 0, player1Id: "star", player2Id: "cannon", status: "scheduled" },
            { slot: 1, player1Id: "other", player2Id: "nightopp", status: "scheduled" },
          ],
        },
      },
    };
    const preds = engine.predictAllBrackets(mini);
    assert.equal(preds.ms.rounds[0][0].winnerId, "cannon");
    const billed = {
      date: "2026-09-02",
      dayNight: "night",
      venue: "Arthur Ashe",
      matches: [{ player1Id: "star", player2Id: "nightopp" }],
      price: { list: 400, resaleLow: 520, resaleHigh: 1200 },
      venues: [
        {
          name: "Arthur Ashe",
          price: { list: 400, resaleLow: 520 },
          matches: [{ player1Id: "star", player2Id: "nightopp" }],
        },
        { name: "Grounds", price: { list: 80, resaleLow: 200 } },
      ],
    };
    const ifHappens = engine.priceSession(billed, {
      snapshot: mini,
      predictions: preds,
      assumeMatchupsHappen: true,
    });
    const predicted = engine.priceSession(billed, {
      snapshot: mini,
      predictions: preds,
      assumeMatchupsHappen: false,
    });
    assert.ok(
      predicted.tilt < ifHappens.tilt,
      "fail-to-happen tilt " + predicted.tilt + " should be below assume-happen " + ifHappens.tilt
    );
    assert.ok(engine.DIR_RANK[predicted.direction] <= engine.DIR_RANK[ifHappens.direction]);
    assert.ok(predicted.happenProb < 0.5);
    assert.equal(predicted.direction, "down");
  });

  it("does not treat empty TBD slots as a failed matchup (no 0.55^n collapse)", () => {
    const projected = {
      date: "2026-09-02",
      dayNight: "day",
      venue: "Arthur Ashe",
      projectedRound: "R64",
      matches: [
        { player1Id: null, player2Id: null, status: "projected" },
        { player1Id: null, player2Id: null, status: "projected" },
        { player1Id: null, player2Id: null, status: "projected" },
        { player1Id: null, player2Id: null, status: "projected" },
        { player1Id: null, player2Id: null, status: "projected" },
      ],
      price: { list: 240, resaleLow: 240, resaleHigh: 500 },
      venues: [{ name: "Arthur Ashe", matches: [{ player1Id: null, player2Id: null }] }],
    };
    const demand = engine.sessionDemand(projected, ctx);
    assert.ok(demand.happenProb > 0.9, "empty TBD courts must not multiply happenProb, got " + demand.happenProb);
    const priced = engine.priceSession(projected, ctx);
    assert.notEqual(
      priced.reason,
      "Billed matchup is unlikely to happen — demand expected to fade."
    );
  });

  it("prices projected Ashe/Armstrong sessions from filled names, not leftover TBD SELL", () => {
    const view = engine.groupCalendar(snapshot, "2026-09-02", "night", { predictions });
    const ashe = view.venues.find((v) => v.name === "Arthur Ashe");
    assert.ok(ashe, "Arthur Ashe night 2026-09-02");
    assert.ok(ashe.matches.length >= 1);
    ashe.matches.forEach((m) => {
      assert.ok(m.player1Id, "projected Ashe slot should have player1");
      assert.ok(m.player2Id, "projected Ashe slot should have player2");
    });
    const fromNames = engine.priceSession(
      {
        date: "2026-09-02",
        dayNight: "night",
        venue: "Arthur Ashe",
        matches: ashe.matches,
        price: ashe.price || { list: 200, resaleLow: 200 },
        venues: [ashe, { name: "Grounds", price: { list: 85, resaleLow: 85 } }],
        groundsPrice: 85,
      },
      ctx
    );
    assert.equal(ashe.pricing.direction, fromNames.direction);
    assert.equal(ashe.pricing.signal, fromNames.signal);
    assert.notEqual(ashe.pricing.reason, "Billed matchup is unlikely to happen — demand expected to fade.");
  });
});
