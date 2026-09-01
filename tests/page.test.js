"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

describe("shipped page source", () => {
  const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
  const app = fs.readFileSync(path.join(__dirname, "..", "js", "app.js"), "utf8");
  const css = fs.readFileSync(path.join(__dirname, "..", "css", "app.css"), "utf8");

  it("contains bracket tabs, stadium names, grounds pricing, day/night, hottest matches", () => {
    assert.match(html, /Men's Singles/);
    assert.match(html, /Women's Singles/);
    assert.match(html, /Men's Doubles/);
    assert.match(html, /Women's Doubles/);
    assert.match(html, /Mixed Doubles/);
    assert.match(html, /Arthur Ashe/);
    assert.match(html, /Louis Armstrong/);
    assert.match(html, /grounds/i);
    assert.match(html, /Day session|day vs night|Night session/i);
    assert.match(app, /Hottest matches/);
    assert.match(html, /learn-bar/);
    assert.match(html, /Tune from results|learn-bar/);
    assert.match(app, /play-card/);
    assert.match(app, /fineTune|learnFromCompleted/);
    assert.doesNotMatch(html, /camera/i);
    assert.doesNotMatch(app, /camera/i);
    assert.doesNotMatch(css, /\.cam\b|\.crowd\b/);
    assert.match(html, /<script src="js\/snapshot\.js/);
    assert.match(html, /<script src="js\/engine\.js/);
    assert.match(html, /<script src="js\/app\.js/);
    assert.match(app, /boot/);
    assert.match(app, /groupCalendar/);
    assert.match(app, /predictAllBrackets/);
    assert.match(app, /sess-bar/);
    assert.match(app, /sessionLabel/);
    assert.match(html, /Session 15 at Arthur Ashe/);
    assert.match(html, /Session 16 at Louis Armstrong/);
    assert.match(html, /ticket-board/);
    assert.match(html, /Sessions 1 through 27 ticket prices, horizontal scroll/);
    assert.match(html, /viewport-fit=cover/);
    assert.match(html, /Mobile jump/);
    assert.match(css, /@media \(max-width: 720px\)/);
    assert.match(css, /scroll-snap-type: x mandatory/);
    assert.match(css, /courts-panel/);
    assert.match(app, /round-switch/);
    assert.match(app, /venue-chip/);
    assert.match(html, /Louis Armstrong 16 sessions/);
    assert.match(html, /Grandstand 7 day sessions/);
    assert.match(css, /sess-bar/);
    assert.match(css, /--court/);
  });
});
