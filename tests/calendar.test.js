"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const engine = require("../js/engine.js");
const snapshot = require("../js/snapshot.js");

describe("shipped groupCalendar", () => {
  it("returns Ashe, Armstrong, another ticketed stadium, and a field court for Monday day", () => {
    const view = engine.groupCalendar(snapshot, "2026-08-31", "day");
    const names = view.venues.map((v) => v.name);
    assert.ok(names.includes("Arthur Ashe"));
    assert.ok(names.includes("Louis Armstrong"));
    assert.ok(names.includes("Grandstand") || names.includes("Stadium 17"));
    assert.ok(
      names.some((n) => engine.isOpenField(n)),
      "expected an open/field court, got " + names.join(",")
    );
    const ashe = view.venues.find((v) => v.name === "Arthur Ashe");
    assert.ok(ashe.matches.length >= 1);
    assert.ok(ashe.matches.every((m) => m.venue === "Arthur Ashe"));
    const grounds = view.venues.find((v) => v.name === "Grounds");
    assert.ok(grounds);
    assert.ok(grounds.pricing.groundsPrice > 0);
    assert.ok(view.venues.every((v) => v.camera == null && v.crowd == null));
  });

  it("orders hottest matches deterministically for the same inputs", () => {
    const a = engine.groupCalendar(snapshot, "2026-08-31", "night");
    const b = engine.groupCalendar(snapshot, "2026-08-31", "night");
    assert.ok(a.hottest.length > 0);
    const keysA = a.hottest.map((h) => h.key + ":" + h.heat).join("|");
    const keysB = b.hottest.map((h) => h.key + ":" + h.heat).join("|");
    assert.equal(keysA, keysB);
    for (let i = 1; i < a.hottest.length; i++) {
      assert.ok(a.hottest[i - 1].heat >= a.hottest[i].heat);
    }
    const day = engine.groupCalendar(snapshot, "2026-08-31", "day");
    assert.notEqual(
      day.hottest[0] && day.hottest[0].key,
      a.hottest[0] && a.hottest[0].key,
      "day vs night hottest should differ on this snapshot"
    );
  });

  it("prices Grounds from the session board, matching ticker/session direction", () => {
    const view = engine.groupCalendar(snapshot, "2026-08-31", "day");
    const grounds = view.venues.find((v) => v.name === "Grounds");
    assert.ok(grounds);
    assert.ok(view.pricing);
    assert.equal(
      grounds.pricing.direction,
      view.pricing.direction,
      "Grounds card " +
        grounds.pricing.direction +
        " vs session " +
        view.pricing.direction +
        " reason=" +
        grounds.pricing.reason
    );
    assert.equal(grounds.pricing.signal, view.pricing.signal);
    const monday = snapshot.sessions.find((s) => s.id === "s3-day");
    const sessionPriced = engine.priceSession(monday, {
      snapshot,
      predictions: engine.predictAllBrackets(snapshot),
    });
    assert.equal(grounds.pricing.direction, sessionPriced.direction);
  });

  it("fills Sep 2–13 TBD slots before pricing so Ashe shows stars and not empty-slot SELL", () => {
    const view = engine.groupCalendar(snapshot, "2026-09-02", "day");
    const ashe = view.venues.find((v) => v.name === "Arthur Ashe");
    const armstrong = view.venues.find((v) => v.name === "Louis Armstrong");
    assert.ok(ashe.matches[0] && ashe.matches[0].player1Id);
    assert.ok(armstrong.matches[0] && armstrong.matches[0].player1Id);
    const named = engine.priceSession(
      {
        date: view.date,
        dayNight: view.dayNight,
        venue: "Arthur Ashe",
        matches: ashe.matches,
        price: ashe.price,
        groundsPrice: view.pricing && view.pricing.groundsPrice,
      },
      { snapshot, predictions: engine.predictAllBrackets(snapshot) }
    );
    assert.equal(ashe.pricing.direction, named.direction);
    assert.ok(ashe.pricing.happenProb > 0.5, "happenProb after fill " + ashe.pricing.happenProb);
  });
});
