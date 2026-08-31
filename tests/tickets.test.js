"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const engine = require("../js/engine.js");
const snapshot = require("../js/snapshot.js");

describe("shipped ticket catalog", () => {
  const catalog = engine.ticketCatalog(snapshot);

  it("lists every official reserved SKU: 27 Ashe, 16 Armstrong, 7 Grandstand, 27 grounds", () => {
    const ashe = catalog.filter((t) => t.venue === "Arthur Ashe");
    const arm = catalog.filter((t) => t.venue === "Louis Armstrong");
    const gs = catalog.filter((t) => t.venue === "Grandstand");
    const grounds = catalog.filter((t) => t.venue === "Grounds");
    assert.equal(ashe.length, 27);
    assert.equal(arm.length, 16);
    assert.equal(gs.length, 7);
    assert.equal(grounds.length, 27);
    assert.ok(engine.hasTicketSku("Louis Armstrong", 15));
    assert.ok(engine.hasTicketSku("Louis Armstrong", 17));
    assert.equal(engine.hasTicketSku("Louis Armstrong", 16), false);
    assert.equal(engine.hasTicketSku("Louis Armstrong", 18), false);
    assert.ok(engine.hasTicketSku("Grandstand", 13));
    assert.equal(engine.hasTicketSku("Grandstand", 14), false);
    assert.equal(engine.hasTicketSku("Grandstand", 2), false);
  });

  it("prices Session 23 as Sep 10 night Ashe (not a phantom Thursday day session)", () => {
    assert.equal(engine.officialSessionNumber("2026-09-10", "night"), 23);
    assert.equal(engine.officialSessionNumber("2026-09-10", "day"), 0);
    const s23 = catalog.filter((t) => t.sessionNumber === 23);
    assert.ok(s23.some((t) => t.venue === "Arthur Ashe"));
    assert.ok(s23.some((t) => t.venue === "Grounds"));
    assert.equal(
      s23.some((t) => t.venue === "Louis Armstrong"),
      false
    );
    assert.equal(s23[0].dayNight, "night");
    assert.equal(s23[0].date, "2026-09-10");
  });

  it("emits numeric resale prices and a direction for every SKU", () => {
    catalog.forEach((t) => {
      assert.equal(typeof t.resale, "number", t.sku);
      assert.ok(t.resale > 0, t.sku + " resale " + t.resale);
      assert.ok(["up", "down", "flat"].includes(t.direction), t.sku);
    });
  });
});
