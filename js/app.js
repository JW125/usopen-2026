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
    focusVenue: "",
    predictions: null,
    roundIdx: 0,
  };

  function isNarrow() {
    return typeof window !== "undefined" && window.matchMedia && window.matchMedia("(max-width: 720px)").matches;
  }

  function playRow(id, pct, live) {
    return (
      '<div class="play-row"><span class="play-name">' +
      seedOf(id) +
      nameOf(id) +
      (live ? " · LIVE" : "") +
      '</span><span class="play-pct">' +
      Math.round((pct || 0) * 100) +
      "%</span></div>"
    );
  }

  function playCard(m, venue) {
    var a = m.player1Id;
    var b = m.player2Id;
    var locked = m.status === "complete" || m.status === "completed";
    var p1 = 0.5;
    if (a && b) p1 = ENG.matchProbability(a, b, SNAP);
    if (locked && m.winnerId) {
      p1 = m.winnerId === a ? 1 : 0;
    }
    var modelP = a && b ? ENG.matchProbability(a, b, SNAP) : 0.5;
    var modelFav = modelP >= 0.5 ? a : b;
    var modelFavP = Math.max(modelP, 1 - modelP);
    var strength = modelFavP >= 0.8 ? "strong" : modelFavP >= 0.62 ? "lean" : "toss-up";
    var miss = locked && modelFav && m.winnerId && modelFav !== m.winnerId;
    var live = m.status === "live";
    var happen = m.happenProb;
    if (happen == null && ENG.pairHappenProb) {
      happen = ENG.pairHappenProb(a, b, state.predictions, m.status);
    }
    if (happen == null && (locked || live || m.status === "scheduled")) happen = 1;
    var happenPct = happen == null ? "" : Math.round(happen * 100) + "% play here";
    return (
      '<article class="play-card' +
      (miss ? " miss" : "") +
      (locked ? " done" : "") +
      '">' +
      (happenPct
        ? '<div class="play-happen">' + happenPct + "</div>"
        : "") +
      playRow(a, p1, live) +
      playRow(b, 1 - p1, false) +
      '<div class="play-meta">' +
      strength +
      (miss ? " · model miss" : "") +
      (m.score ? " · " + m.score : "") +
      " · " +
      venue +
      "</div></article>"
    );
  }

  function renderLearnBar() {
    var host = el("learn-bar");
    if (!host) return;
    var L = ENG.learnFromCompleted(SNAP);
    var y = L.byDay["2026-08-30"] || { n: 0, hits: 0 };
    var t = L.byDay["2026-08-31"] || { n: 0, hits: 0 };
    function frac(d) {
      return d.n ? d.hits + "/" + d.n : "—";
    }
    host.innerHTML =
      "<span>Yesterday " +
      frac(y) +
      " · Today " +
      frac(t) +
      " · " +
      (L.n ? Math.round(L.accuracy * 100) + "% graded" : "no grades") +
      '</span><button type="button" id="tune-btn">Tune from results</button>';
    var btn = el("tune-btn");
    if (btn) {
      btn.addEventListener("click", function () {
        var tuned = ENG.fineTune(SNAP);
        try {
          if (typeof localStorage !== "undefined") {
            localStorage.setItem("usopen-2026-weights", JSON.stringify(tuned.weights));
          }
        } catch (e) {}
        state.predictions = ENG.predictAllBrackets(SNAP);
        state._tickets = null;
        render();
      });
    }
  }

  function ticketRows() {
    if (!state._tickets) state._tickets = ENG.ticketCatalog(SNAP, { predictions: state.predictions });
    return state._tickets;
  }

  function renderTicker() {
    var host = el("ticker");
    if (!host) return;
    var catalog = ticketRows();
    var byS = {};
    catalog.forEach(function (t) {
      if (!byS[t.sessionNumber]) {
        byS[t.sessionNumber] = { sessionNumber: t.sessionNumber, date: t.date, dayNight: t.dayNight, cells: {} };
      }
      byS[t.sessionNumber].cells[t.venue] = t;
    });
    var cols = ["Arthur Ashe", "Louis Armstrong", "Grandstand", "Grounds"];
    var html = "";
    for (var n = 1; n <= 27; n++) {
      var row = byS[n];
      if (!row) continue;
      var on = state.date === row.date && state.dayNight === row.dayNight;
      html +=
        '<div class="sess-col' +
        (on ? " on" : "") +
        '" data-date="' +
        row.date +
        '" data-dn="' +
        row.dayNight +
        '"><div class="hd">Session ' +
        n +
        '<span>' +
        row.date.slice(5) +
        " " +
        row.dayNight +
        "</span></div>";
      cols.forEach(function (venue) {
        var t = row.cells[venue];
        if (!t) {
          html += '<div class="sku na"><span>' + ENG.venueShort(venue) + "</span><span>not sold</span></div>";
          return;
        }
        html +=
          '<button class="sku" type="button" data-date="' +
          t.date +
          '" data-dn="' +
          t.dayNight +
          '" data-venue="' +
          venue +
          '"><span>' +
          ENG.venueShort(venue) +
          "</span><span class='" +
          dirClass(t.direction) +
          "'>" +
          money(t.resale) +
          " " +
          dirArrow(t.direction) +
          "</span></button>";
      });
      html += "</div>";
    }
    host.innerHTML = html;
    if (host.querySelectorAll) {
      host.querySelectorAll(".sku[data-date], .sess-col").forEach(function (node) {
        node.addEventListener("click", function (ev) {
          ev.stopPropagation();
          var t = ev.currentTarget;
          if (t.getAttribute("data-date")) {
            state.date = t.getAttribute("data-date");
            state.dayNight = t.getAttribute("data-dn");
            if (t.getAttribute("data-venue")) state.focusVenue = t.getAttribute("data-venue");
            render();
          }
        });
      });
    }
    var current = host.querySelector && host.querySelector(".sess-col.on");
    if (current && current.scrollIntoView) {
      current.scrollIntoView({ inline: "center", block: "nearest", behavior: "instant" });
    }
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
        state.roundIdx = 0;
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
    var html = "";
    var narrow = isNarrow();
    var rounds = pred.rounds;
    if (narrow) {
      if (state.roundIdx < 0 || state.roundIdx >= rounds.length) state.roundIdx = 0;
      html += '<div class="round-switch">';
      rounds.forEach(function (round, i) {
        var lab = (round[0] && round[0].roundLabel) || "Round";
        html +=
          '<button type="button" class="chip" data-ri="' +
          i +
          '" aria-pressed="' +
          (state.roundIdx === i) +
          '">' +
          lab.replace("Round of ", "R") +
          "</button>";
      });
      html += "</div>";
      var one = pred.rounds[state.roundIdx].slice();
      one = one.filter(function (m) {
        var s = m.session || {};
        if (s.date !== state.date || (s.dayNight || "day") !== state.dayNight) return false;
        if (state.focusVenue && s.venue !== state.focusVenue) return false;
        return true;
      });
      if (!one.length && !state.focusVenue) one = pred.rounds[state.roundIdx];
      rounds = [one];
    }
    html += '<div class="bracket-scroll"><div class="rounds">';
    rounds.forEach(function (round) {
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
    if (host.querySelectorAll) {
      host.querySelectorAll(".round-switch .chip").forEach(function (btn) {
        btn.addEventListener("click", function (ev) {
          ev.stopPropagation();
          state.roundIdx = Number(btn.getAttribute("data-ri")) || 0;
          render();
        });
      });
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
      '<button type="button" class="dn" data-dn="day" aria-pressed="' +
      (state.dayNight === "day") +
      '">Day</button>' +
      '<button type="button" class="dn" data-dn="night" aria-pressed="' +
      (state.dayNight === "night") +
      '">Night</button>';
    el("dn").querySelectorAll(".dn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        state.dayNight = btn.getAttribute("data-dn");
        render();
      });
    });
  }

  function venueChip(name, label) {
    var on = name ? state.focusVenue === name : !state.focusVenue;
    return (
      '<button type="button" class="venue-chip' +
      (on ? " on" : "") +
      '" data-venue="' +
      name +
      '">' +
      (label || name) +
      "</button>"
    );
  }

  function setFocusVenue(name) {
    if (!name || name === state.focusVenue) state.focusVenue = "";
    else state.focusVenue = name;
  }

  function syncVenueSelection() {
    var host = el("map");
    if (!host || !host.querySelectorAll) return;
    host.querySelectorAll("[data-venue]").forEach(function (n) {
      var name = n.getAttribute("data-venue") || "";
      var on = name ? state.focusVenue === name : !state.focusVenue;
      if (n.classList.contains("venue-chip")) {
        if (on) n.classList.add("on");
        else n.classList.remove("on");
      }
      if (n.classList.contains("bowl-block")) {
        if (on) n.classList.add("sel");
        else n.classList.remove("sel");
      }
    });
  }

  var venueTapAt = 0;
  function applyVenueFilter(name) {
    var now = Date.now();
    if (now - venueTapAt < 120) return;
    venueTapAt = now;
    setFocusVenue(name);
    syncVenueSelection();
    renderCalendar({ skipMap: true });
    renderBracket();
  }

  function renderMap(view) {
    var host = el("map");
    var names = (view.venues || []).map(function (v) {
      return v.name;
    });
    var chips =
      '<div class="venue-row">' +
      venueChip("", "All courts") +
      names
        .map(function (name) {
          return venueChip(name);
        })
        .join("") +
      "</div>";
    if (isNarrow()) {
      host.innerHTML = chips;
    } else {
      function blk(name, cls) {
        return (
          '<div class="bowl-block ' +
          (cls || "") +
          (state.focusVenue === name ? " sel" : "") +
          '" data-venue="' +
          name +
          '">' +
          name +
          "</div>"
        );
      }
      host.innerHTML =
        chips +
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
    }
    if (host.querySelectorAll) {
      host.querySelectorAll("[data-venue]").forEach(function (n) {
        n.addEventListener("click", function (ev) {
          ev.preventDefault();
          ev.stopPropagation();
          applyVenueFilter(n.getAttribute("data-venue") || "");
        });
      });
    }
  }

  function renderCalendar(opts) {
    opts = opts || {};
    var view = ENG.groupCalendar(SNAP, state.date, state.dayNight, { predictions: state.predictions });
    if (!opts.skipMap) renderMap(view);
    renderLearnBar();
    if (!view.venues || !view.venues.length) {
      el("venues").innerHTML =
        "<p class='reason'>No numbered reserved session for this date/day-night. Thursday 10 Sep is <strong>Session 23 evening</strong> (Arthur Ashe). Saturday is Session 26 day; Sunday is Session 27 day.</p>";
      el("hottest").innerHTML = "";
      el("session-summary").innerHTML = "";
      return;
    }
    var host = el("venues");
    var html = "";
    var list = view.venues || [];
    var rest = [];
    if (state.focusVenue) {
      list = list.filter(function (v) {
        return v.name === state.focusVenue;
      });
    } else if (isNarrow()) {
      rest = list.filter(function (v) {
        return ENG.isOpenField(v.name);
      });
      list = list.filter(function (v) {
        return !ENG.isOpenField(v.name);
      });
    }
    if (state.focusVenue && !list.length) {
      html =
        "<p class='reason'>No matches at " +
        state.focusVenue +
        " this session. Pick All courts or another stadium.</p>";
    }
    list.forEach(function (v) {
      var pr = v.pricing || {};
      var sessN = v.sessionNumber || ENG.officialSessionNumber(state.date, state.dayNight);
      var sku = ENG.hasTicketSku(v.name, sessN);
      var priceLabel =
        v.name === "Grounds" || v.kind === "field"
          ? money(pr.groundsPrice || pr.stadiumPrice)
          : sku
            ? money(pr.stadiumPrice)
            : "grounds";
      html += '<section class="stadium-block" data-name="' + v.name + '">';
      html +=
        "<header><h3>" +
        (v.sessionLabel ? v.sessionLabel + " · " : "") +
        v.name +
        "</h3><span class='stad-price'>" +
        priceLabel +
        " <span class='" +
        dirClass(pr.direction) +
        "'>" +
        dirArrow(pr.direction) +
        "</span></span></header>";
      var matches = v.matches || [];
      if (!matches.length) {
        html += "<p class='reason'>Session ticket only.</p>";
      }
      matches.forEach(function (m) {
        html += playCard(m, v.name);
      });
      html += "</section>";
    });
    if (rest.length) {
      html += "<details class='outer-fold'><summary>Outer courts (" + rest.length + ")</summary>";
      rest.forEach(function (v) {
        html +=
          '<p class="mlist"><strong>' +
          v.name +
          "</strong> · grounds " +
          money(v.pricing && v.pricing.groundsPrice) +
          "</p><ul class='mlist'>";
        (v.matches || []).forEach(function (m) {
          html +=
            "<li>" +
            nameOf(m.player1Id) +
            " vs " +
            nameOf(m.player2Id) +
            (m.status === "live" ? " · LIVE" : "") +
            "</li>";
        });
        html += "</ul>";
      });
      html += "</details>";
    }
    host.innerHTML = html;

    var hotHost = el("hottest");
    var hot = (view.hottest || []).filter(function (h) {
      return !state.focusVenue || (h.match && h.match.venue === state.focusVenue);
    });
    hotHost.innerHTML =
      "<h2>Hottest matches</h2><ol>" +
      hot
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
    renderTicker();
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
    try {
      if (typeof localStorage !== "undefined") {
        var savedW = localStorage.getItem("usopen-2026-weights");
        if (savedW) ENG.setWeights(JSON.parse(savedW));
      }
    } catch (err) {}
    state.predictions = ENG.predictAllBrackets(SNAP);
    el("asof").textContent = "Snapshot " + SNAP.asOf.replace("T", " ").slice(0, 16) + " ET";
    if (window.matchMedia) {
      var mq = window.matchMedia("(max-width: 720px)");
      if (mq.addEventListener) mq.addEventListener("change", function () { render(); });
      else if (mq.addListener) mq.addListener(function () { render(); });
    }
    render();
  }

  globalThis.USOpenApp = { boot: boot, render: render, state: state };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
