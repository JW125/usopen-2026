"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

function loadBrowserScripts() {
  const document = {
    readyState: "complete",
    nodes: {},
    getElementById: function (id) {
      if (!this.nodes[id]) {
        this.nodes[id] = {
          id: id,
          innerHTML: "",
          hidden: false,
          className: "",
          textContent: "",
          querySelectorAll: function () {
            return [];
          },
          addEventListener: function () {},
        };
      }
      return this.nodes[id];
    },
    addEventListener: function () {},
  };
  const sandbox = {
    document: document,
    location: { protocol: "http:" },
    console: console,
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  sandbox.global = sandbox;
  document.defaultView = sandbox;
  const ctx = vm.createContext(sandbox);
  ["snapshot.js", "engine.js", "app.js"].forEach(function (name) {
    const code = fs.readFileSync(path.join(__dirname, "..", "js", name), "utf8");
    vm.runInContext(code, ctx, { filename: name });
  });
  return ctx;
}

describe("browser script load without Node module/require", () => {
  it("installs snapshot, engine, and UI boot without throwing", () => {
    const ctx = loadBrowserScripts();
    assert.ok(ctx.window.USOPEN_SNAPSHOT);
    assert.ok(ctx.window.USOPEN_SNAPSHOT.brackets.ms);
    assert.ok(ctx.window.USOpenEngine);
    assert.equal(typeof ctx.window.USOpenEngine.predictBracket, "function");
    assert.ok(ctx.window.USOpenApp);
    assert.equal(typeof ctx.window.USOpenApp.boot, "function");
    ctx.window.USOpenApp.boot();
    const app = ctx.document.getElementById("app");
    const bracket = ctx.document.getElementById("bracket");
    const venues = ctx.document.getElementById("venues");
    const ticker = ctx.document.getElementById("ticker");
    assert.ok(String(bracket.innerHTML).length > 200, "bracket surface should fill");
    assert.ok(String(venues.innerHTML).length > 200, "calendar surface should fill");
    assert.match(String(bracket.innerHTML), /One-shot champion/);
    assert.match(String(venues.innerHTML), /Arthur Ashe/);
    assert.match(String(venues.innerHTML), /Louis Armstrong/);
    assert.match(String(venues.innerHTML), /grounds/i);
    assert.match(String(venues.innerHTML), /play-card/);
    assert.match(String(venues.innerHTML), /%/);
    assert.doesNotMatch(String(venues.innerHTML), /occupancy|camera/i);
    assert.ok(String(ticker.innerHTML).length > 50);
    assert.match(String(ticker.innerHTML), /Session 1/);
    assert.match(String(ticker.innerHTML), /Session 27/);
    assert.match(String(ticker.innerHTML), /not sold/);
    assert.ok(!ctx.window.module, "browser sandbox must not define Node module");
  });
});
