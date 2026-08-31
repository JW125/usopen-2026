(function () {
  "use strict";

  var SNAP = typeof USOPEN_SNAPSHOT !== "undefined" ? USOPEN_SNAPSHOT : null;
  var ENG = typeof USOpenEngine !== "undefined" ? USOpenEngine : null;

  function el(id) {
    return document.getElementById(id);
  }

  function nameOf(id) {
    if (!id) return "TBD";
    var p = SNAP.players[id];
    return p ? p.name : String(id);
  }

  function seedOf(id) {
    var p = SNAP.players[id];
    return p && p.seed ? "[" + p.seed + "] " : "";
  }

  function money(n) {
    if (n == null || !isFinite(Number(n)) || Number(n) <= 0) return "—";
    return "$" + Math.round(Number(n));
  }

  function dirClass(d) {
    return d === "up" ? "up" : d === "down" ? "down" : "flat";
  }

  function dirArrow(d) {
    return d === "up" ? "▲ UP" : d === "down" ? "▼ DOWN" : "◆ FLAT";
  }

  var state = {
    tab: "ms",
    date: "2026-08-31",
    dayNight: "day",
    focusVenue: "Arthur Ashe",
    predictions: null,
  };

  function ticketRows() {
    if (!state._tickets) state._tickets = ENG.ticketCatalog(SNAP, { predictions: state.predictions });
    return state._tickets;
  }

  function renderTicker() {
    var host = el("ticker");
    if (!host) return;
    var catalog = ticketRows();
    host.innerHTML = catalog
      .map(function (t) {
        return (
          '<div class="tick" data-date="' +
          t.date +
          '" data-dn="' +
          t.dayNight +
          '" data-venue="' +
          t.venue +
          '"><div class="v">S' +
          t.sessionNumber +
          " " +
          t.dayNight +
          " · " +
          ENG.venueShort(t.venue) +
          '</div><div class="p">' +
          money(t.resale) +
          " <span class='" +
          dirClass(t.direction) +
          "'>" +
          dirArrow(t.direction) +
          "</span></div></div>"
        );
      })
      .join("");
    host.querySelectorAll(".tick[data-date]").forEach(function (tick) {
      tick.addEventListener("click", function () {
        state.date = tick.getAttribute("data-date");
        state.dayNight = tick.getAttribute("data-dn");
        state.focusVenue = tick.getAttribute("data-venue");
        render();
      });
    });
  }

  function renderTabs() {
    var host = el("tabs");
    var labels = [
      ["ms", "Men's Singles"],
      ["ws", "Women's Singles"],
      ["md", "Men's Doubles"],
      ["wd", "Women's Doubles"],
      ["xd", "Mixed Doubles"],
    ];
    host.innerHTML = labels
      .map(function (t) {
        return (
          '<button class="tab" role="tab" data-tab="' +
          t[0] +
          '" aria-selected="' +
          (state.tab === t[0]) +
          '">' +
          t[1] +
          "</button>"
        );
      })
      .join("");
    host.querySelectorAll(".tab").forEach(function (btn) {
      btn.addEventListener("click", function () {
        state.tab = btn.getAttribute("data-tab");
        render();
      });
    });
  }

  function sessBarClass(venue) {
    if (venue === "Arthur Ashe") return "ashe";
    if (venue === "Louis Armstrong") return "armstrong";
    if (venue === "Grandstand") return "grandstand";
    if (venue === "Stadium 17") return "stad17";
    return "field";
  }

  function renderBracket() {
    var pred = state.predictions[state.tab];
    var host = el("bracket");
    if (!pred) {
      host.innerHTML = "<p>No bracket.</p>";
      return;
    }
    var html = '<div class="bracket-scroll"><div class="rounds">';
    pred.rounds.forEach(function (round) {
      html += "<div class='round'><h3>" + (round[0] && round[0].roundLabel ? round[0].roundLabel : "Round") + "</h3>";
      round.forEach(function (m) {
        var w = m.winnerId;
        var sess = m.session || {};
        var label = sess.sessionLabel || (sess.sessionNumber ? "Session " + sess.sessionNumber : "Session");
        var venue = sess.venue || "";
        var when = sess.dayNight === "night" ? "Night" : "Day";
        html +=
          "<div class='match' role='button' tabindex='0' data-date='" +
          (sess.date || "") +
          "' data-dn='" +
          (sess.dayNight || "day") +
          "' data-venue='" +
          venue +
          "' title='" +
          label +
          " · " +
          venue +
          " · " +
          when +
          "'>";
        html +=
          "<div class='sess-bar " +
          sessBarClass(venue) +
          "'><span class='n'>" +
          (sess.sessionNumber > 0 ? "S" + sess.sessionNumber : "FW") +
          "</span><span class='v'>" +
          ENG.venueShort(venue) +
          "</span><span class='w'>" +
          when +
          "</span></div>";
        html += "<div class='match-body'>";
        if (m.locked) html += "<div class='lock'>locked score " + (m.score || "") + "</div>";
        html +=
          "<div class='lock'>" +
          label +
          " · " +
          (venue || "TBD court") +
          "</div>";
        ["player1Id", "player2Id"].forEach(function (k) {
          var id = m[k];
          var cls = id && id === w ? "win" : "lose";
          var pct = k === "player1Id" ? m.p1 : m.p2;
          html +=
            "<div class='row " +
            cls +
            "'><span>" +
            seedOf(id) +
            nameOf(id) +
            "</span><span class='pct'>" +
            (id ? Math.round((pct || 0) * 100) + "%" : "") +
            "</span></div>";
        });
        html += "</div></div>";
      });
      html += "</div>";
    });
    html += "</div></div>";
    html +=
      "<div class='champ'><span>One-shot champion</span><strong>" +
      seedOf(pred.championId) +
      nameOf(pred.championId) +
      "</strong></div>";
    host.innerHTML = html;
    host.querySelectorAll(".match[data-date]").forEach(function (card) {
      function go() {
        var d = card.getAttribute("data-date");
        var dn = card.getAttribute("data-dn");
        var ven = card.getAttribute("data-venue");
        if (d) state.date = d;
        if (dn) state.dayNight = dn;
        if (ven) state.focusVenue = ven;
        render();
      }
      card.addEventListener("click", go);
      card.addEventListener("keydown", function (ev) {
        if (ev.key === "Enter" || ev.key === " ") {
          ev.preventDefault();
          go();
        }
      });
    });
  }

  function uniqueDates() {
    var seen = {};
    var out = [];
    (SNAP.sessions || []).forEach(function (s) {
      if (!seen[s.date]) {
        seen[s.date] = true;
        out.push(s.date);
      }
    });
    return out;
  }

  function renderCalendarControls() {
    var host = el("dates");
    host.innerHTML = uniqueDates()
      .map(function (d) {
        var label = d.slice(5);
        return (
          '<button class="chip" data-date="' +
          d +
          '" aria-pressed="' +
          (state.date === d) +
          '">' +
          label +
          "</button>"
        );
      })
      .join("");
    host.querySelectorAll(".chip").forEach(function (btn) {
      btn.addEventListener("click", function () {
        state.date = btn.getAttribute("data-date");
        render();
      });
    });
    el("dn").innerHTML =
      '<button class="dn" data-dn="day" aria-pressed="' +
      (state.dayNight === "day") +
      '">Day session</button>' +
      '<button class="dn" data-dn="night" aria-pressed="' +
      (state.dayNight === "night") +
      '">Night session</button>';
    el("dn").querySelectorAll(".dn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        state.dayNight = btn.getAttribute("data-dn");
        render();
      });
    });
  }

  function renderMap(view) {
    var host = el("map");
    var names = (view.venues || []).map(function (v) {
      return v.name;
    });
    function blk(name, cls) {
      var on = names.indexOf(name) >= 0;
      return (
        '<div class="bowl-block ' +
        (cls || "") +
        (state.focusVenue === name ? " sel" : "") +
        '" data-venue="' +
        name +
        '">' +
        (on ? name : name) +
        "</div>"
      );
    }
    host.innerHTML =
      blk("Arthur Ashe") +
      '<div class="field-col">' +
      blk("Louis Armstrong", "small") +
      blk("Grandstand", "small") +
      blk("Stadium 17", "small") +
      "</div><div class='field-col'>" +
      (view.venues || [])
        .filter(function (v) {
          return ENG.isOpenField(v.name);
        })
        .slice(0, 6)
        .map(function (v) {
          return "<div data-venue='" + v.name + "'>" + v.name + "</div>";
        })
        .join("") +
      "</div>";
    host.querySelectorAll("[data-venue]").forEach(function (n) {
      n.addEventListener("click", function () {
        state.focusVenue = n.getAttribute("data-venue");
        render();
      });
    });
  }

  function renderCalendar() {
    var view = ENG.groupCalendar(SNAP, state.date, state.dayNight, { predictions: state.predictions });
    renderMap(view);
    if (!view.venues || !view.venues.length) {
      el("venues").innerHTML =
        "<p class='reason'>No numbered reserved session for this date/day-night. Thursday 10 Sep is <strong>Session 23 evening</strong> (Arthur Ashe). Saturday is Session 26 day; Sunday is Session 27 day.</p>";
      el("hottest").innerHTML = "";
      el("session-summary").innerHTML = "";
      return;
    }
    var host = el("venues");
    var html = "";
    (view.venues || []).forEach(function (v) {
      var hot = view.hottest[0] && view.hottest[0].match && view.hottest[0].match.venue === v.name;
      var pr = v.pricing || {};
      var crowd = (v.crowd && v.crowd.pct) || 0;
      html += '<article class="venue' + (hot ? " hot" : "") + '" data-name="' + v.name + '">';
      var sessN = v.sessionNumber || ENG.officialSessionNumber(state.date, state.dayNight);
      var sku = ENG.hasTicketSku(v.name, sessN);
      html +=
        "<h3>" +
        (v.sessionLabel ? v.sessionLabel + " · " : "") +
        v.name +
        (sku ? " · ticketed SKU" : v.ticketed ? " · ticketed" : " · open / field") +
        "</h3>";
      html += "<div class='meta'>" + (v.crowd && v.crowd.label ? v.crowd.label : "Crowd snapshot") + " · " + crowd + "% occupancy</div>";
      html += '<div class="crowd" title="crowd occupancy"><span style="width:' + crowd + '%"></span></div>';
      html += "<div class='price-line'><b>";
      if (!sku && v.name !== "Grounds" && v.kind !== "field") {
        html += v.ticketNote || "no reserved ticket this session";
      } else if (v.name === "Grounds" || v.kind === "field") html += "grounds " + money(pr.groundsPrice || pr.stadiumPrice);
      else html += money(pr.stadiumPrice);
      html += "</b><span class='signal " + (pr.signal || "hold") + "'>" + (pr.signal || "hold") + " " + dirArrow(pr.direction) + "</span></div>";
      html += "<p class='reason'>" + (pr.reason || "") + "</p>";
      html += "<ul class='mlist'>";
      (v.matches || []).forEach(function (m) {
        html +=
          "<li>" +
          seedOf(m.player1Id) +
          nameOf(m.player1Id) +
          " vs " +
          seedOf(m.player2Id) +
          nameOf(m.player2Id) +
          (m.score ? " · " + m.score : "") +
          (m.status === "live" ? " · LIVE" : "") +
          " <span class='heat'>heat " +
          Math.round(m.heat || 0) +
          "</span></li>";
      });
      if (!v.matches || !v.matches.length) html += "<li>Session access / no reserved match card</li>";
      html += "</ul>";
      var cam = v.camera || {};
      html += "<div class='cam'><strong>Camera / crowd slot · " + v.name + "</strong>";
      html += cam.fallback || SNAP.camerasNote;
      if (cam.page) html += ' <a href="' + cam.page + '" target="_blank" rel="noopener">usopen.org live scores</a>';
      html += "</div></article>";
    });
    host.innerHTML = html;

    var hotHost = el("hottest");
    hotHost.innerHTML =
      "<h2>Hottest matches</h2><ol>" +
      view.hottest
        .slice(0, 8)
        .map(function (h) {
          var m = h.match;
          return (
            "<li><strong>" +
            nameOf(m.player1Id) +
            " vs " +
            nameOf(m.player2Id) +
            "</strong> · " +
            m.venue +
            (m.session && m.session.sessionLabel ? " · " + m.session.sessionLabel : "") +
            " · heat " +
            h.heat.toFixed(1) +
            "</li>"
          );
        })
        .join("") +
      "</ol>";

    var g = (view.venues || []).find(function (v) {
      return v.name === "Grounds";
    });
    var ashe = (view.venues || []).find(function (v) {
      return v.name === "Arthur Ashe";
    });
    el("session-summary").innerHTML =
      "<p><strong>" +
      (ashe && ashe.sessionLabel ? ashe.sessionLabel + " · " : "") +
      state.date +
      " " +
      state.dayNight +
      "</strong> — grounds " +
      money(g && g.pricing ? g.pricing.groundsPrice : view.pricing && view.pricing.groundsPrice) +
      " · Arthur Ashe " +
      money(ashe && ashe.pricing ? ashe.pricing.stadiumPrice : 0) +
      ". Last-minute signal is buy / sell / hold only — no checkout here. If a billed star is predicted out, direction drops so you can dump resale before the matchup fails.</p>";
  }

  function renderTicketBoard() {
    var host = el("ticket-board");
    if (!host) return;
    var rows = ticketRows();
    var byS = {};
    rows.forEach(function (t) {
      if (!byS[t.sessionNumber]) {
        byS[t.sessionNumber] = { sessionNumber: t.sessionNumber, date: t.date, dayNight: t.dayNight, cells: {} };
      }
      byS[t.sessionNumber].cells[t.venue] = t;
    });
    var cols = ["Arthur Ashe", "Louis Armstrong", "Grandstand", "Grounds"];
    var html =
      "<table><thead><tr><th>Session</th><th>When</th><th>Arthur Ashe</th><th>Louis Armstrong</th><th>Grandstand</th><th>Grounds</th></tr></thead><tbody>";
    for (var n = 1; n <= 27; n++) {
      var row = byS[n];
      if (!row) continue;
      var sel = state.date === row.date && state.dayNight === row.dayNight ? " sel" : "";
      html +=
        '<tr class="' +
        sel +
        '"><td><button type="button" data-date="' +
        row.date +
        '" data-dn="' +
        row.dayNight +
        '">Session ' +
        n +
        "</button></td><td>" +
        row.date.slice(5) +
        " " +
        row.dayNight +
        "</td>";
      cols.forEach(function (venue) {
        var t = row.cells[venue];
        if (!t) {
          html += '<td class="na">not sold</td>';
          return;
        }
        html +=
          "<td><button type='button' data-date='" +
          t.date +
          "' data-dn='" +
          t.dayNight +
          "' data-venue='" +
          venue +
          "'>" +
          money(t.resale) +
          " <span class='" +
          dirClass(t.direction) +
          "'>" +
          dirArrow(t.direction) +
          "</span></button></td>";
      });
      html += "</tr>";
    }
    html += "</tbody></table>";
    host.innerHTML = html;
    host.querySelectorAll("button[data-date]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        state.date = btn.getAttribute("data-date");
        state.dayNight = btn.getAttribute("data-dn");
        if (btn.getAttribute("data-venue")) state.focusVenue = btn.getAttribute("data-venue");
        render();
      });
    });
  }

  function render() {
    renderTabs();
    renderBracket();
    renderCalendarControls();
    renderTicketBoard();
    renderCalendar();
  }

  function boot() {
    var root = el("app");
    if (!root) return;
    if (!SNAP || !ENG) {
      root.innerHTML = "<p>Failed to load snapshot or engine.</p>";
      return;
    }
    if (location.protocol === "file:") {
      var b = el("file-banner");
      if (b) {
        b.className += " show";
        b.hidden = false;
      }
    }
    state.predictions = ENG.predictAllBrackets(SNAP);
    el("asof").textContent = "Snapshot " + SNAP.asOf.replace("T", " ").slice(0, 16) + " ET";
    renderTicker();
    render();
  }

  globalThis.USOpenApp = { boot: boot, render: render, state: state };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
