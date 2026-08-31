"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

describe("shipped page source", () => {
  const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
  const app = fs.readFileSync(path.join(__dirname, "..", "js", "app.js"), "utf8");
  const css = fs.readFileSync(path.join(__dirname, "..", "css", "app.css"), "utf8");

  it("contains bracket tabs, stadium names, grounds pricing, day/night, hottest, camera/crowd fallback", () => {
    assert.match(html, /Men's Singles/);
    assert.match(html, /Women's Singles/);
    assert.match(html, /Men's Doubles/);
    assert.match(html, /Women's Doubles/);
    assert.match(html, /Mixed Doubles/);
    assert.match(html, /Arthur Ashe/);
    assert.match(html, /Louis Armstrong/);
    assert.match(html, /grounds/i);
    assert.match(html, /Day session|day vs night|Night session/i);
    assert.match(html, /Hottest matches/i);
    assert.match(html, /Camera \/ crowd|camera slots/i);
    assert.match(html, /usopen.org|not embeddable|rights-locked|file:\/\//i);
    assert.match(html, /<script src="js\/snapshot\.js">/);
    assert.match(html, /<script src="js\/engine\.js">/);
    assert.match(html, /<script src="js\/app\.js">/);
    assert.match(app, /boot/);
    assert.match(app, /groupCalendar/);
    assert.match(app, /predictAllBrackets/);
    assert.match(app, /sess-bar/);
    assert.match(app, /sessionLabel/);
    assert.match(html, /Session 15 at Arthur Ashe/);
    assert.match(html, /Session 16 at Louis Armstrong/);
    assert.match(html, /ticket-board/);
    assert.match(html, /Louis Armstrong 16 sessions/);
    assert.match(html, /Grandstand 7 day sessions/);
    assert.match(css, /sess-bar/);
    assert.match(css, /--court/);
  });
});
