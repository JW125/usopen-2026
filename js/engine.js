/**
 * US Open 2026 one-shot prediction, hottest-match, pricing-direction, and calendar grouping.
 * Pure functions over snapshot records. Works in the browser (no Node globals required)
 * and in Node tests via module.exports.
 */
(function (global) {
  "use strict";

  var REF_MS = Date.parse("2026-08-31T16:00:00Z");
  var DAY_MS = 86400000;
  var H2H_TAU_DAYS = 280;
  var VENUE_WEIGHT = {
    "Arthur Ashe": 12,
    "Louis Armstrong": 9,
    Grandstand: 6.5,
    "Stadium 17": 5,
    Grounds: 3.5,
  };
  var FIELD_WEIGHT = 2.2;
  var DIR_RANK = { down: 0, flat: 1, up: 2 };
  var DEFAULT_WEIGHTS = { ranking: 1.35, direction: 0.55, h2h: 0.9 };
  var activeWeights = {
    ranking: DEFAULT_WEIGHTS.ranking,
    direction: DEFAULT_WEIGHTS.direction,
    h2h: DEFAULT_WEIGHTS.h2h,
  };

  function getWeights() {
    return {
      ranking: activeWeights.ranking,
      direction: activeWeights.direction,
      h2h: activeWeights.h2h,
    };
  }

  function setWeights(w) {
    w = w || {};
    if (w.ranking != null) activeWeights.ranking = Number(w.ranking);
    if (w.direction != null) activeWeights.direction = Number(w.direction);
    if (w.h2h != null) activeWeights.h2h = Number(w.h2h);
    return getWeights();
  }

  function clamp(n, lo, hi) {
    return Math.max(lo, Math.min(hi, n));
  }

  function isObj(v) {
    return v && typeof v === "object";
  }

  function playerOf(players, id) {
    if (!id) return null;
    if (isObj(id) && id.id) return id;
    if (!players) return null;
    return players[id] || null;
  }

  function rankOf(p) {
    if (!p) return 400;
    var r = Number(p.rank);
    return isFinite(r) && r > 0 ? r : 400;
  }

  function rankPrevOf(p) {
    if (!p) return rankOf(p);
    var r = Number(p.rankPrev);
    return isFinite(r) && r > 0 ? r : rankOf(p);
  }

  /** Better (lower) rank → higher strength. */
  function rankStrength(rank) {
    return Math.exp(-(Math.max(1, rank) - 1) / 28);
  }

  /**
   * Positive when the player is improving (rank number falling).
   * Scaled so a 20-spot jump is about +1.
   */
  function rankingDirection(p) {
    return clamp((rankPrevOf(p) - rankOf(p)) / 20, -1.5, 1.5);
  }

  function parseDate(d) {
    if (d == null) return REF_MS;
    if (typeof d === "number") return d;
    var ms = Date.parse(String(d));
    return isFinite(ms) ? ms : REF_MS;
  }

  /**
   * Recency-weighted H2H advantage for A vs B in [-1, 1].
   * Most-recent meetings get exponentially higher weight.
   */
  function h2hAdvantage(idA, idB, h2h, nowMs) {
    if (!idA || !idB || !h2h || !h2h.length) return 0;
    var now = nowMs == null ? REF_MS : nowMs;
    var score = 0;
    var wsum = 0;
    for (var i = 0; i < h2h.length; i++) {
      var m = h2h[i];
      var wId = m.winnerId || m.winner;
      var lId = m.loserId || m.loser;
      if (!((wId === idA && lId === idB) || (wId === idB && lId === idA))) continue;
      var days = Math.max(0, (now - parseDate(m.date)) / DAY_MS);
      var w = Math.exp(-days / H2H_TAU_DAYS);
      wsum += w;
      score += (wId === idA ? 1 : -1) * w;
    }
    if (wsum === 0) return 0;
    return clamp(score / wsum, -1, 1);
  }

  function comboRank(entity, players) {
    if (!entity) return 400;
    if (entity.playerIds && entity.playerIds.length) {
      var sum = 0;
      for (var i = 0; i < entity.playerIds.length; i++) {
        sum += rankOf(playerOf(players, entity.playerIds[i]));
      }
      return sum / entity.playerIds.length;
    }
    return rankOf(entity);
  }

  function comboDirection(entity, players) {
    if (!entity) return 0;
    if (entity.playerIds && entity.playerIds.length) {
      var sum = 0;
      for (var i = 0; i < entity.playerIds.length; i++) {
        sum += rankingDirection(playerOf(players, entity.playerIds[i]));
      }
      return sum / entity.playerIds.length;
    }
    return rankingDirection(entity);
  }

  /**
   * P(A beats B). Uses current ranking, ranking direction, and recency-weighted H2H.
   */
  function winProbability(a, b, ctx) {
    ctx = ctx || {};
    var players = ctx.players || {};
    var pa = playerOf(players, a) || a || {};
    var pb = playerOf(players, b) || b || {};
    var idA = pa.id || (typeof a === "string" ? a : null);
    var idB = pb.id || (typeof b === "string" ? b : null);
    var sA = rankStrength(comboRank(pa, players));
    var sB = rankStrength(comboRank(pb, players));
    var rankingTerm = Math.log(sA + 1e-12) - Math.log(sB + 1e-12);
    var dirTerm = comboDirection(pa, players) - comboDirection(pb, players);
    var h2hTerm = h2hAdvantage(idA, idB, ctx.h2h || [], ctx.nowMs);
    var W = ctx.weights || activeWeights;
    var logit =
      (W.ranking != null ? W.ranking : DEFAULT_WEIGHTS.ranking) * rankingTerm +
      (W.direction != null ? W.direction : DEFAULT_WEIGHTS.direction) * dirTerm +
      (W.h2h != null ? W.h2h : DEFAULT_WEIGHTS.h2h) * h2hTerm;
    var pA = 1 / (1 + Math.exp(-logit));
    return clamp(pA, 0.02, 0.98);
  }

  function predictMatch(match, ctx) {
    ctx = ctx || {};
    var a = match.player1Id || match.a;
    var b = match.player2Id || match.b;
    var locked =
      match.status === "complete" ||
      match.status === "completed" ||
      match.locked === true;
    if (locked && match.winnerId) {
      var lw = match.winnerId;
      return {
        player1Id: a,
        player2Id: b,
        winnerId: lw,
        p1: lw === a ? 1 : 0,
        p2: lw === b ? 1 : 0,
        locked: true,
        status: "complete",
        score: match.score || "",
        round: match.round,
        slot: match.slot,
      };
    }
    var p1 = 0.5;
    if (a && b) p1 = winProbability(a, b, ctx);
    else if (a && !b) p1 = 1;
    else if (!a && b) p1 = 0;
    var winnerId = p1 >= 0.5 ? a : b;
    if (!a) winnerId = b;
    if (!b) winnerId = a;
    return {
      player1Id: a,
      player2Id: b,
      winnerId: winnerId,
      p1: a && b ? p1 : winnerId === a ? 1 : 0,
      p2: a && b ? 1 - p1 : winnerId === b ? 1 : 0,
      locked: false,
      status: match.status || "predicted",
      score: match.score || "",
      round: match.round,
      slot: match.slot,
    };
  }

  function openingMatches(bracket) {
    if (!bracket) return [];
    if (Array.isArray(bracket.opening) && bracket.opening.length) return bracket.opening;
    if (Array.isArray(bracket.matches) && bracket.matches.length) {
      var minRound = Infinity;
      for (var i = 0; i < bracket.matches.length; i++) {
        var r = Number(bracket.matches[i].round);
        if (isFinite(r) && r < minRound) minRound = r;
      }
      return bracket.matches.filter(function (m) {
        return Number(m.round) === minRound;
      });
    }
    return [];
  }

  /**
   * Fill every remaining slot. Completed winners stay locked.
   */
  function predictBracket(bracket, ctx) {
    ctx = ctx || {};
    var opening = openingMatches(bracket).slice();
    if (!opening.length) {
      return { id: bracket && bracket.id, name: bracket && bracket.name, rounds: [], championId: null };
    }
    opening.sort(function (x, y) {
      return (Number(x.slot) || 0) - (Number(y.slot) || 0);
    });
    var laterByRound = {};
    var laterList = bracket.later || [];
    for (var li = 0; li < laterList.length; li++) {
      var lm = laterList[li];
      var rk = String(lm.round);
      if (!laterByRound[rk]) laterByRound[rk] = {};
      laterByRound[rk][Number(lm.slot)] = lm;
    }

    var rounds = [];
    var current = [];
    for (var i = 0; i < opening.length; i++) {
      var src = opening[i];
      var predicted = predictMatch(
        {
          player1Id: src.player1Id || src.a,
          player2Id: src.player2Id || src.b,
          winnerId: src.winnerId,
          status: src.status,
          score: src.score,
          round: src.round || opening.length * 2,
          slot: src.slot != null ? src.slot : i,
        },
        ctx
      );
      current.push(predicted);
    }
    rounds.push(current);

    var drawSize = current.length * 2;
    while (current.length > 1) {
      var next = [];
      var nextRound = current.length;
      var laterMap = laterByRound[String(nextRound)] || {};
      for (var j = 0; j < current.length; j += 2) {
        var left = current[j];
        var right = current[j + 1];
        var lockedLater = laterMap[j / 2];
        var childSrc = {
          player1Id: left && left.winnerId,
          player2Id: right && right.winnerId,
          round: nextRound,
          slot: j / 2,
          status: "predicted",
        };
        if (lockedLater) {
          if (lockedLater.player1Id) childSrc.player1Id = lockedLater.player1Id;
          if (lockedLater.player2Id) childSrc.player2Id = lockedLater.player2Id;
          childSrc.winnerId = lockedLater.winnerId;
          childSrc.status = lockedLater.status || "complete";
          childSrc.score = lockedLater.score || "";
        }
        next.push(predictMatch(childSrc, ctx));
      }
      rounds.push(next);
      current = next;
    }

    var labels = roundLabels(drawSize, rounds.length);
    for (var r = 0; r < rounds.length; r++) {
      for (var k = 0; k < rounds[r].length; k++) {
        rounds[r][k].roundLabel = labels[r];
        rounds[r][k].round = labels[r];
      }
    }

    return {
      id: bracket.id,
      name: bracket.name,
      size: drawSize,
      rounds: rounds,
      championId: current.length ? current[0].winnerId : null,
    };
  }

  function roundLabels(drawSize, nRounds) {
    var names = [];
    var size = drawSize;
    for (var i = 0; i < nRounds; i++) {
      if (size === 2) names.push("Final");
      else if (size === 4) names.push("Semifinals");
      else if (size === 8) names.push("Quarterfinals");
      else if (size === 16) names.push("Round of 16");
      else names.push("Round of " + size);
      size = size / 2;
    }
    return names;
  }

  function predictAllBrackets(snapshot) {
    snapshot = snapshot || {};
    var ctx = { players: snapshot.players || {}, h2h: snapshot.h2h || [], nowMs: parseDate(snapshot.asOf) };
    var out = {};
    var brackets = snapshot.brackets || {};
    var keys = Object.keys(brackets);
    for (var i = 0; i < keys.length; i++) {
      out[keys[i]] = predictBracket(brackets[keys[i]], ctx);
    }
    return annotateAllSessions(snapshot, out);
  }

  function venueWeight(name) {
    if (!name) return FIELD_WEIGHT;
    if (VENUE_WEIGHT[name] != null) return VENUE_WEIGHT[name];
    var n = String(name);
    if (/Court\s+\d+/i.test(n) || /field/i.test(n) || /outer/i.test(n)) return FIELD_WEIGHT;
    return 3;
  }

  function isTicketedStadium(name) {
    return (
      name === "Arthur Ashe" ||
      name === "Louis Armstrong" ||
      name === "Grandstand" ||
      name === "Stadium 17"
    );
  }

  function isOpenField(name) {
    return !isTicketedStadium(name) && name !== "Grounds";
  }

  function starPower(id, players) {
    var p = playerOf(players, id);
    if (!p) return 0.15;
    var rank = comboRank(p, players);
    var seed = Number(p.seed) || 0;
    var base = 1 / Math.sqrt(Math.max(1, rank));
    if (seed && seed <= 8) base += 0.22;
    else if (seed && seed <= 16) base += 0.1;
    if (p.country === "USA") base += 0.08;
    return base;
  }

  /**
   * Deterministic hottest-match score for a billed match in a session/venue.
   */
  function hottestScore(match, ctx) {
    ctx = ctx || {};
    var players = ctx.players || {};
    var a = match.player1Id || match.a;
    var b = match.player2Id || match.b;
    var p1 = starPower(a, players);
    var p2 = starPower(b, players);
    var closeness = 0;
    if (a && b) {
      var wp = winProbability(a, b, ctx);
      closeness = 1 - Math.abs(wp - 0.5) * 2;
    }
    var venue = venueWeight(match.venue || ctx.venue);
    var night = (match.dayNight || ctx.dayNight) === "night" ? 2.4 : 0;
    var live = match.status === "live" ? 1.2 : 0;
    var score =
      (p1 + p2) * 18 +
      closeness * 4 +
      venue +
      night +
      live;
    return Math.round(score * 1000) / 1000;
  }

  function hottestMatches(matches, ctx) {
    var list = (matches || []).map(function (m, i) {
      return {
        match: m,
        heat: hottestScore(m, ctx),
        index: i,
        key:
          String(m.player1Id || m.a || "") +
          "|" +
          String(m.player2Id || m.b || "") +
          "|" +
          String(m.venue || "") +
          "|" +
          String(m.order || i),
      };
    });
    list.sort(function (x, y) {
      if (y.heat !== x.heat) return y.heat - x.heat;
      if (x.key < y.key) return -1;
      if (x.key > y.key) return 1;
      return x.index - y.index;
    });
    return list;
  }

  function playersFaceEachOtherNow(idA, idB, snapshot) {
    if (!idA || !idB || !snapshot || !snapshot.brackets) return false;
    var keys = Object.keys(snapshot.brackets);
    for (var i = 0; i < keys.length; i++) {
      var opening = openingMatches(snapshot.brackets[keys[i]]);
      for (var j = 0; j < opening.length; j++) {
        var m = opening[j];
        var a = m.player1Id || m.a;
        var b = m.player2Id || m.b;
        if ((a === idA && b === idB) || (a === idB && b === idA)) return true;
      }
    }
    return false;
  }

  function billedMatchHappenProb(idA, idB, snapshot, predictions, assumeHappen) {
    if (assumeHappen) return 1;
    if (!idA && !idB) return null;
    if (!idA || !idB) return 1;
    if (playersFaceEachOtherNow(idA, idB, snapshot)) return 1;
    var pA = advanceLikelihood(idA, snapshot, predictions, assumeHappen);
    var pB = advanceLikelihood(idB, snapshot, predictions, assumeHappen);
    return clamp(pA * pB, 0.02, 1);
  }

  function advanceLikelihood(playerId, snapshot, predictions, assumeHappen) {
    if (assumeHappen) return 1;
    if (!playerId) return 0.5;
    snapshot = snapshot || {};
    var brackets = snapshot.brackets || {};
    var keys = Object.keys(brackets);
    for (var i = 0; i < keys.length; i++) {
      var opening = openingMatches(brackets[keys[i]]);
      for (var j = 0; j < opening.length; j++) {
        var m = opening[j];
        var a = m.player1Id || m.a;
        var b = m.player2Id || m.b;
        var locked = m.status === "complete" || m.status === "completed";
        if (locked && m.winnerId) {
          if (m.winnerId === playerId) return 1;
          if (a === playerId || b === playerId) return 0;
        }
        if (a === playerId || b === playerId) {
          if (a && b) {
            var pred = predictions && predictions[keys[i]];
            if (pred && pred.rounds && pred.rounds[0] && pred.rounds[0][j]) {
              var cell = pred.rounds[0][j];
              return a === playerId ? cell.p1 : cell.p2;
            }
            var ctx = {
              players: snapshot.players,
              h2h: snapshot.h2h,
              nowMs: parseDate(snapshot.asOf),
            };
            var pA = winProbability(a, b, ctx);
            return a === playerId ? pA : 1 - pA;
          }
          return 1;
        }
      }
    }
    return 1;
  }

  function sessionDemand(session, ctx) {
    ctx = ctx || {};
    var snapshot = ctx.snapshot || {};
    var players = snapshot.players || ctx.players || {};
    var assume = !!ctx.assumeMatchupsHappen;
    var predictions = ctx.predictions || {};
    var matches = collectSessionMatches(session);
    var heatSum = 0;
    var happenLogs = 0;
    var happenCount = 0;
    var billedStars = 0;
    var named = 0;
    for (var i = 0; i < matches.length; i++) {
      var m = matches[i];
      var idA = m.player1Id || m.a;
      var idB = m.player2Id || m.b;
      if (idA || idB) named += 1;
      var hs = hottestScore(
        {
          player1Id: idA,
          player2Id: idB,
          venue: m.venue || session.venue,
          dayNight: session.dayNight,
          status: m.status,
        },
        { players: players, h2h: snapshot.h2h, nowMs: parseDate(snapshot.asOf) }
      );
      heatSum += hs;
      var hp = billedMatchHappenProb(idA, idB, snapshot, predictions, assume);
      if (hp != null) {
        happenLogs += Math.log(Math.max(hp, 1e-6));
        happenCount += 1;
      }
      billedStars += starPower(idA, players) + starPower(idB, players);
    }
    var venue = venueWeight(session.venue || (session.venues && session.venues[0] && session.venues[0].name));
    var night = session.dayNight === "night" ? 3 : 0;
    var n = Math.max(1, named || matches.length);
    var raw = heatSum / n + venue * 0.45 + night + billedStars * 6;
    var happen = happenCount ? Math.exp(happenLogs / happenCount) : 1;
    var happenClamped = clamp(happen, 0.05, 1);
    var expected = raw * (0.42 + 0.58 * happenClamped);
    return {
      raw: raw,
      expected: expected,
      happenProb: happenClamped,
      heat: heatSum / n,
      matchCount: matches.length,
    };
  }

  function collectSessionMatches(session) {
    if (!session) return [];
    if (Array.isArray(session.matches) && session.matches.length) {
      return session.matches.map(function (m) {
        return Object.assign({ venue: session.venue }, m);
      });
    }
    var out = [];
    var venues = session.venues || [];
    for (var i = 0; i < venues.length; i++) {
      var v = venues[i];
      var ms = v.matches || [];
      for (var j = 0; j < ms.length; j++) {
        out.push(Object.assign({ venue: v.name }, ms[j]));
      }
    }
    return out;
  }

  function priceNumbers(session) {
    var p = (session && session.price) || {};
    var venues = (session && session.venues) || [];
    var stadium = null;
    var grounds = null;
    if (p.resaleLow != null || p.list != null) stadium = p;
    for (var i = 0; i < venues.length; i++) {
      var v = venues[i];
      if (v.name === "Grounds" && v.price) grounds = v.price;
      else if (!stadium && v.price && isTicketedStadium(v.name)) stadium = v.price;
      if (v.kind === "grounds" && v.price) grounds = v.price;
    }
    if (!grounds && p.grounds != null) {
      grounds = { resaleLow: p.grounds, list: p.groundsList || p.grounds };
    }
    if (!grounds && session && session.groundsPrice != null) {
      grounds = { resaleLow: session.groundsPrice, list: session.groundsList || session.groundsPrice };
    }
    function num(obj, keys, fallback) {
      if (!obj) return fallback;
      for (var k = 0; k < keys.length; k++) {
        var n = Number(obj[keys[k]]);
        if (isFinite(n)) return n;
      }
      return fallback;
    }
    return {
      stadiumList: num(stadium, ["list", "face", "listPrice"], 0),
      stadiumResale: num(stadium, ["resaleLow", "low", "current"], 0),
      stadiumHigh: num(stadium, ["resaleHigh", "high"], 0),
      groundsList: num(grounds, ["list", "face", "listPrice"], 0),
      groundsResale: num(grounds, ["resaleLow", "low", "current", "resale"], 0),
      groundsHigh: num(grounds, ["resaleHigh", "high"], 0),
    };
  }

  /**
   * Current pricing plus expected direction (up / down / flat).
   * Direction falls when a billed star matchup is unlikely to happen.
   */
  function priceSession(session, ctx) {
    ctx = ctx || {};
    var demand = sessionDemand(session, ctx);
    var prices = priceNumbers(session);
    var tilt = demand.expected;
    var dir = "flat";
    if (demand.happenProb < 0.5) {
      tilt -= 8;
    } else if (demand.happenProb < 0.7) {
      tilt -= 3;
    }
    var asheNight =
      session.dayNight === "night" &&
      (session.venue === "Arthur Ashe" ||
        (session.venues || []).some(function (v) {
          return v.name === "Arthur Ashe";
        }));
    var armstrongNight =
      session.dayNight === "night" &&
      (session.venue === "Louis Armstrong" ||
        (session.venues || []).some(function (v) {
          return v.name === "Louis Armstrong";
        }));
    if (asheNight || armstrongNight) tilt += 2.5;
    if (tilt >= 16 && demand.happenProb >= 0.62) dir = "up";
    else if (tilt <= 11 || demand.happenProb < 0.5) dir = "down";
    else dir = "flat";

    var signal = "hold";
    if (dir === "up") signal = "buy";
    else if (dir === "down") signal = "sell";

    var reason;
    if (demand.happenProb < 0.5) {
      reason = "Billed matchup is unlikely to happen — demand expected to fade.";
    } else if (dir === "up") {
      reason = "High ranking quality and likely stars keep this session bid-side.";
    } else if (dir === "down") {
      reason = "Outer-court / low-star field — last-minute prices more likely to ease.";
    } else {
      reason = "Balanced demand. Wait for late scratches before flipping.";
    }

    return {
      direction: dir,
      tilt: Math.round(tilt * 1000) / 1000,
      happenProb: demand.happenProb,
      heat: Math.round(demand.heat * 1000) / 1000,
      demand: demand,
      prices: prices,
      stadiumPrice: prices.stadiumResale || prices.stadiumList,
      groundsPrice: prices.groundsResale || prices.groundsList,
      signal: signal,
      reason: reason,
    };
  }

  function flattenSessions(snapshot) {
    var sessions = (snapshot && snapshot.sessions) || [];
    return sessions;
  }

  function cloneJson(v) {
    return JSON.parse(JSON.stringify(v));
  }

  function projectedRoundIndex(hint) {
    var map = { R128: 0, R64: 1, R32: 2, R16: 3, QF: 4, SF: 5, "W Final": 6, "M Final": 6, Final: 6, rest: 4 };
    if (hint == null || hint === "") return null;
    return map[hint] != null ? map[hint] : null;
  }

  /**
   * Fill TBD session slots from the one-shot bracket BEFORE pricing, so names and direction match.
   */
  function fillProjectedSession(session, snapshot, predictions) {
    if (!session) return session;
    predictions = predictions || {};
    annotateAllSessions(snapshot, predictions);
    var num = officialSessionNumber(session.date, session.dayNight);
    var claimed = {};
    function claim(venue) {
      var events = Object.keys(predictions);
      for (var e = 0; e < events.length; e++) {
        var pred = predictions[events[e]];
        if (!pred || !pred.rounds) continue;
        for (var r = 0; r < pred.rounds.length; r++) {
          var round = pred.rounds[r] || [];
          for (var i = 0; i < round.length; i++) {
            var cell = round[i];
            if (!cell || !cell.session) continue;
            if (cell.session.sessionNumber !== num) continue;
            if (cell.session.venue !== venue) continue;
            var k = events[e] + ":" + r + ":" + i;
            if (claimed[k]) continue;
            claimed[k] = true;
            return cell;
          }
        }
      }
      return null;
    }
    function fillMatch(m, venue) {
      if (!m) return m;
      if (m.player1Id || m.a || m.player2Id || m.b) return m;
      var cell = claim(venue);
      if (!cell) return m;
      m.player1Id = cell.player1Id;
      m.player2Id = cell.player2Id;
      m.a = cell.player1Id;
      m.b = cell.player2Id;
      m.status = cell.locked ? "complete" : "projected";
      m.session = cell.session;
      return m;
    }
    (session.matches || []).forEach(function (m) {
      fillMatch(m, session.venue);
    });
    (session.venues || []).forEach(function (ven) {
      (ven.matches || []).forEach(function (m) {
        fillMatch(m, ven.name);
      });
    });
    return session;
  }

  /**
   * Group a calendar date + day/night into venues with hottest-match order.
   */
  function groupCalendar(snapshot, date, dayNight, ctx) {
    ctx = ctx || {};
    var predictions = ctx.predictions || predictAllBrackets(snapshot);
    var wantDate = String(date);
    var wantDn = dayNight === "night" ? "night" : "day";
    var sessions = flattenSessions(snapshot)
      .filter(function (s) {
        return String(s.date) === wantDate && (s.dayNight || "day") === wantDn;
      })
      .map(function (s) {
        return fillProjectedSession(cloneJson(s), snapshot, predictions);
      });
    var venuesOut = [];
    var allMatches = [];
    var engineCtx = {
      snapshot: snapshot,
      predictions: predictions,
      players: snapshot.players,
      h2h: snapshot.h2h,
      nowMs: parseDate(snapshot.asOf),
      assumeMatchupsHappen: false,
    };

    for (var i = 0; i < sessions.length; i++) {
      var s = sessions[i];
      var venues = s.venues && s.venues.length ? s.venues : [{ name: s.venue, matches: s.matches, price: s.price, crowd: s.crowd, camera: s.camera, kind: s.kind }];
      var sessionMatches = collectSessionMatches(s);
      var sessionPriced = priceSession(s, engineCtx);
      for (var v = 0; v < venues.length; v++) {
        var ven = venues[v];
        var groundsVen = venues.filter(function (x) {
          return x.name === "Grounds";
        });
        var field = isOpenField(ven.name);
        var isGrounds = ven.name === "Grounds" || ven.kind === "grounds";
        var demandMatches = isGrounds ? sessionMatches : ven.matches;
        var priced = isGrounds
          ? sessionPriced
          : priceSession(
              {
                date: s.date,
                dayNight: s.dayNight,
                venue: field ? "Grounds" : ven.name,
                venues: [ven].concat(groundsVen),
                matches: demandMatches,
                price: field ? null : ven.price || (isTicketedStadium(ven.name) ? ven.price || s.price : null),
                groundsPrice: s.groundsPrice,
                groundsList: s.groundsList,
              },
              engineCtx
            );
        if (field) priced.stadiumPrice = priced.groundsPrice;
        var labeled = (ven.matches || []).map(function (m, idx) {
          var row = {
            player1Id: m.player1Id || m.a,
            player2Id: m.player2Id || m.b,
            venue: ven.name,
            dayNight: s.dayNight,
            status: m.status || "scheduled",
            score: m.score || "",
            order: m.order != null ? m.order : idx,
            event: m.event,
            start: m.start,
            session: m.session || {
              sessionNumber: officialSessionNumber(s.date, s.dayNight),
              sessionLabel: "Session " + officialSessionNumber(s.date, s.dayNight),
              date: s.date,
              dayNight: s.dayNight,
              venue: ven.name,
              observed: m.status === "complete" || m.status === "live" || m.status === "scheduled",
            },
          };
          row.heat = hottestScore(row, engineCtx);
          allMatches.push(row);
          return row;
        });
        venuesOut.push({
          name: ven.name,
          sessionNumber: officialSessionNumber(s.date, s.dayNight),
          sessionLabel: "Session " + officialSessionNumber(s.date, s.dayNight),
          ticketed: ven.ticketed != null ? ven.ticketed : isTicketedStadium(ven.name) || ven.name === "Grounds",
          kind: ven.kind || (isOpenField(ven.name) ? "field" : ven.name === "Grounds" ? "grounds" : "stadium"),
          matches: labeled,
          price: ven.price || null,
          crowd: ven.crowd || { pct: 0, label: "No reading", source: "snapshot" },
          camera: ven.camera || {
            type: "fallback",
            url: "",
            fallback: "Live court camera is not embeddable from this page. Crowd meter uses the public session snapshot.",
          },
          pricing: priced,
        });
      }
    }

    var hottest = hottestMatches(allMatches, engineCtx);
    var sessionPrice = sessions[0] ? priceSession(sessions[0], engineCtx) : null;
    return {
      date: wantDate,
      dayNight: wantDn,
      venues: venuesOut,
      hottest: hottest,
      pricing: sessionPrice,
      sessions: sessions,
    };
  }

  function pad2(n) {
    n = String(n);
    return n.length < 2 ? "0" + n : n;
  }

  var SESSION_WHEN = {
    1: { date: "2026-08-30", dayNight: "day" },
    2: { date: "2026-08-30", dayNight: "night" },
    3: { date: "2026-08-31", dayNight: "day" },
    4: { date: "2026-08-31", dayNight: "night" },
    5: { date: "2026-09-01", dayNight: "day" },
    6: { date: "2026-09-01", dayNight: "night" },
    7: { date: "2026-09-02", dayNight: "day" },
    8: { date: "2026-09-02", dayNight: "night" },
    9: { date: "2026-09-03", dayNight: "day" },
    10: { date: "2026-09-03", dayNight: "night" },
    11: { date: "2026-09-04", dayNight: "day" },
    12: { date: "2026-09-04", dayNight: "night" },
    13: { date: "2026-09-05", dayNight: "day" },
    14: { date: "2026-09-05", dayNight: "night" },
    15: { date: "2026-09-06", dayNight: "day" },
    16: { date: "2026-09-06", dayNight: "night" },
    17: { date: "2026-09-07", dayNight: "day" },
    18: { date: "2026-09-07", dayNight: "night" },
    19: { date: "2026-09-08", dayNight: "day" },
    20: { date: "2026-09-08", dayNight: "night" },
    21: { date: "2026-09-09", dayNight: "day" },
    22: { date: "2026-09-09", dayNight: "night" },
    23: { date: "2026-09-10", dayNight: "night" },
    24: { date: "2026-09-11", dayNight: "day" },
    25: { date: "2026-09-11", dayNight: "night" },
    26: { date: "2026-09-12", dayNight: "day" },
    27: { date: "2026-09-13", dayNight: "day" },
  };

  var ARMSTRONG_TICKET_SESSIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 17];
  var GRANDSTAND_TICKET_SESSIONS = [1, 3, 5, 7, 9, 11, 13];

  function hasTicketSku(venue, sessionNumber) {
    var n = Number(sessionNumber);
    if (!n || n < 1 || n > 27) return false;
    if (venue === "Arthur Ashe" || venue === "Grounds") return true;
    if (venue === "Louis Armstrong") return ARMSTRONG_TICKET_SESSIONS.indexOf(n) !== -1;
    if (venue === "Grandstand") return GRANDSTAND_TICKET_SESSIONS.indexOf(n) !== -1;
    return false;
  }

  function officialSessionNumber(date, dayNight) {
    if (!date) return null;
    var day = String(date).slice(0, 10);
    var night = dayNight === "night";
    var keys = Object.keys(SESSION_WHEN);
    for (var i = 0; i < keys.length; i++) {
      var meta = SESSION_WHEN[keys[i]];
      if (meta.date === day && meta.dayNight === (night ? "night" : "day")) return Number(keys[i]);
    }
    return 0;
  }

  function dateAndNightForSession(n) {
    if (!n || n < 1) return { date: "2026-08-26", dayNight: "night" };
    return SESSION_WHEN[n] || { date: "2026-09-13", dayNight: "day" };
  }

  /**
   * Every official 2026 reserved-ticket SKU: Ashe 1–27, Armstrong 16 sessions,
   * Grandstand 7 day sessions, grounds for every numbered session.
   */
  function ticketCatalog(snapshot, ctx) {
    ctx = ctx || {};
    var predictions = ctx.predictions || predictAllBrackets(snapshot);
    var engineCtx = {
      snapshot: snapshot,
      predictions: predictions,
      players: snapshot.players,
      h2h: snapshot.h2h,
      assumeMatchupsHappen: false,
    };
    var pricedByNum = {};
    (snapshot.sessions || []).forEach(function (s) {
      var n = s.sessionNumber || officialSessionNumber(s.date, s.dayNight);
      if (!n) return;
      var copy = fillProjectedSession(cloneJson(s), snapshot, predictions);
      pricedByNum[n] = { session: copy, priced: priceSession(copy, engineCtx) };
    });
    var out = [];
    var venues = ["Arthur Ashe", "Louis Armstrong", "Grandstand", "Grounds"];
    for (var n = 1; n <= 27; n++) {
      var meta = SESSION_WHEN[n];
      if (!meta) continue;
      var pack = pricedByNum[n] || {};
      var sess = pack.session;
      var sessionPriced = pack.priced || {};
      for (var i = 0; i < venues.length; i++) {
        var venue = venues[i];
        if (!hasTicketSku(venue, n)) continue;
        var card = ((sess && sess.venues) || []).find(function (v) {
          return v.name === venue;
        });
        var slice = card
          ? priceSession(
              {
                date: meta.date,
                dayNight: meta.dayNight,
                venue: venue,
                matches: venue === "Grounds" ? collectSessionMatches(sess) : card.matches,
                price: card.price,
                groundsPrice: sess && sess.groundsPrice,
                groundsList: sess && sess.groundsList,
                venues: [card],
              },
              engineCtx
            )
          : sessionPriced;
        var prices = slice.prices || {};
        var resale =
          venue === "Grounds"
            ? slice.groundsPrice || prices.groundsResale || sessionPriced.groundsPrice
            : slice.stadiumPrice || prices.stadiumResale;
        out.push({
          sessionNumber: n,
          sessionLabel: "Session " + n,
          date: meta.date,
          dayNight: meta.dayNight,
          venue: venue,
          sku: "Session " + n + " · " + venue,
          ticketed: true,
          list: venue === "Grounds" ? prices.groundsList || 65 : prices.stadiumList || 0,
          resale: Number(resale) || 0,
          direction: slice.direction || sessionPriced.direction || "flat",
          signal: slice.signal || sessionPriced.signal || "hold",
          reason: slice.reason || "",
        });
      }
    }
    return out;
  }

  function venueShort(name) {
    if (name === "Arthur Ashe") return "Ashe";
    if (name === "Louis Armstrong") return "Armstrong";
    if (name === "Grandstand") return "Grandstand";
    if (name === "Stadium 17") return "Stad 17";
    if (name === "Grounds") return "Grounds";
    return name || "Field";
  }

  function pairKey(a, b) {
    if (!a || !b) return "";
    return a < b ? a + "|" + b : b + "|" + a;
  }

  function observedSessionIndex(snapshot) {
    var map = {};
    (snapshot.sessions || []).forEach(function (s) {
      var num = officialSessionNumber(s.date, s.dayNight);
      (s.venues || []).forEach(function (ven) {
        (ven.matches || []).forEach(function (m) {
          var a = m.player1Id || m.a;
          var b = m.player2Id || m.b;
          if (!a || !b) return;
          map[pairKey(a, b)] = {
            sessionNumber: num,
            sessionLabel: num > 0 ? "Session " + num : "Fan Week",
            date: s.date,
            dayNight: s.dayNight || "day",
            venue: ven.name,
            observed: true,
          };
        });
      });
    });
    return map;
  }

  function roundSessionWindow(roundLabel, eventId) {
    if (eventId === "xd") return { start: 0, end: 0 };
    if (roundLabel === "Round of 128") return { start: 1, end: 6 };
    if (roundLabel === "Round of 64") {
      if (eventId === "md") return { start: 11, end: 14 };
      if (eventId === "wd") return { start: 9, end: 12 };
      return { start: 7, end: 10 };
    }
    if (roundLabel === "Round of 32") return { start: 11, end: 14 };
    if (roundLabel === "Round of 16") return { start: 15, end: 18 };
    if (roundLabel === "Quarterfinals") return { start: 19, end: 22 };
    if (roundLabel === "Semifinals") {
      if (eventId === "ws") return { start: 24, end: 25 };
      return { start: 24, end: 25 };
    }
    if (roundLabel === "Final") {
      if (eventId === "ws" || eventId === "wd") return { start: 26, end: 26 };
      return { start: 27, end: 27 };
    }
    return { start: 7, end: 10 };
  }

  function expandSessionSlots(window, n, roundLabel) {
    var slots = [];
    if (!n) return slots;
    if (window.start === 0) {
      for (var z = 0; z < n; z++) {
        slots.push({
          sessionNumber: 0,
          sessionLabel: "Fan Week",
          date: "2026-08-26",
          dayNight: "night",
          venue: "Arthur Ashe",
          observed: false,
        });
      }
      return slots;
    }
    var late =
      roundLabel === "Round of 16" ||
      roundLabel === "Quarterfinals" ||
      roundLabel === "Semifinals" ||
      roundLabel === "Final";
    for (var sn = window.start; sn <= window.end && slots.length < n; sn++) {
      var meta = dateAndNightForSession(sn);
      var night = meta.dayNight === "night";
      var plan = [];
      function add(venue, c) {
        for (var i = 0; i < c; i++) plan.push(venue);
      }
      if (roundLabel === "Final" || roundLabel === "Semifinals") {
        add("Arthur Ashe", 2);
      } else if (roundLabel === "Quarterfinals") {
        add("Arthur Ashe", night ? 2 : 1);
        add("Louis Armstrong", night ? 0 : 1);
      } else if (roundLabel === "Round of 16") {
        add("Arthur Ashe", 2);
        add("Louis Armstrong", night ? 1 : 2);
      } else {
        add("Arthur Ashe", 2);
        add("Louis Armstrong", night ? 1 : 2);
        add("Grandstand", night ? 1 : 3);
        add("Stadium 17", night ? 1 : 2);
        var courts = ["Court 5", "Court 6", "Court 7", "Court 10", "Court 11", "Court 12"];
        add(courts[0], 0);
        var fieldN = night ? 2 : late ? 0 : 6;
        for (var f = 0; f < fieldN; f++) plan.push(courts[f % courts.length]);
      }
      for (var p = 0; p < plan.length && slots.length < n; p++) {
        slots.push({
          sessionNumber: sn,
          sessionLabel: "Session " + sn,
          date: meta.date,
          dayNight: meta.dayNight,
          venue: plan[p],
          observed: false,
        });
      }
    }
    while (slots.length < n) {
      var last = slots[slots.length - 1] || {
        sessionNumber: window.end,
        sessionLabel: "Session " + window.end,
        date: dateAndNightForSession(window.end).date,
        dayNight: dateAndNightForSession(window.end).dayNight,
        venue: "Arthur Ashe",
        observed: false,
      };
      slots.push(Object.assign({}, last));
    }
    return slots;
  }

  /**
   * Stamp each predicted match with the session + stadium it is expected to play.
   * Completed pairs keep the observed session from the snapshot.
   */
  function annotateBracketSessions(predicted, snapshot, eventId) {
    if (!predicted || !predicted.rounds) return predicted;
    var observed = observedSessionIndex(snapshot || {});
    var ctx = { players: (snapshot && snapshot.players) || {}, h2h: (snapshot && snapshot.h2h) || [] };
    predicted.rounds.forEach(function (round) {
      var label = (round[0] && round[0].roundLabel) || "";
      var window = roundSessionWindow(label, eventId);
      var slots = expandSessionSlots(window, round.length, label);
      var ranked = round.map(function (m, i) {
        return {
          m: m,
          i: i,
          heat: hottestScore(
            { player1Id: m.player1Id, player2Id: m.player2Id, venue: "Arthur Ashe", dayNight: "night" },
            ctx
          ),
        };
      });
      ranked.sort(function (a, b) {
        if (b.heat !== a.heat) return b.heat - a.heat;
        return a.i - b.i;
      });
      var obsCount = {};
      ranked.forEach(function (item) {
        var obs = observed[pairKey(item.m.player1Id, item.m.player2Id)];
        if (!obs) return;
        item.m.session = obs;
        var id = obs.sessionNumber + "|" + obs.venue;
        obsCount[id] = (obsCount[id] || 0) + 1;
      });
      var si = 0;
      ranked.forEach(function (item) {
        if (item.m.session) return;
        var chosen = null;
        while (si < slots.length && !chosen) {
          var sl = slots[si++];
          var id = sl.sessionNumber + "|" + sl.venue;
          if (obsCount[id] > 0) {
            obsCount[id] -= 1;
            continue;
          }
          chosen = sl;
        }
        item.m.session = chosen || slots[slots.length - 1] || {
          sessionNumber: window.end,
          sessionLabel: window.end ? "Session " + window.end : "Fan Week",
          date: dateAndNightForSession(window.end).date,
          dayNight: dateAndNightForSession(window.end).dayNight,
          venue: "Arthur Ashe",
          observed: false,
        };
      });
    });
    return predicted;
  }

  function annotateAllSessions(snapshot, predictions) {
    var keys = Object.keys(predictions || {});
    for (var i = 0; i < keys.length; i++) {
      annotateBracketSessions(predictions[keys[i]], snapshot, keys[i]);
    }
    return predictions;
  }

  function priceAllSessions(snapshot, ctx) {
    ctx = ctx || {};
    var predictions = ctx.predictions || predictAllBrackets(snapshot);
    var inner = Object.assign({}, ctx, { snapshot: snapshot, predictions: predictions });
    return flattenSessions(snapshot).map(function (s) {
      var copy = fillProjectedSession(cloneJson(s), snapshot, predictions);
      return Object.assign({ id: copy.id, date: copy.date, dayNight: copy.dayNight }, priceSession(copy, inner));
    });
  }

  function completedOpeners(snapshot) {
    var dateByPair = {};
    (snapshot.sessions || []).forEach(function (s) {
      collectSessionMatches(s).forEach(function (m) {
        var a = m.player1Id || m.a;
        var b = m.player2Id || m.b;
        if (a && b) dateByPair[pairKey(a, b)] = s.date;
      });
    });
    var out = [];
    var brackets = snapshot.brackets || {};
    Object.keys(brackets).forEach(function (eid) {
      openingMatches(brackets[eid]).forEach(function (m) {
        if (m.status !== "complete" && m.status !== "completed") return;
        if (!m.winnerId) return;
        var a = m.player1Id || m.a;
        var b = m.player2Id || m.b;
        out.push({
          eventId: eid,
          player1Id: a,
          player2Id: b,
          winnerId: m.winnerId,
          score: m.score || "",
          date: dateByPair[pairKey(a, b)] || String(snapshot.asOf || "").slice(0, 10),
        });
      });
    });
    return out;
  }

  /**
   * Blind-score completed matches (ignore locks) for yesterday/today accuracy.
   */
  function learnFromCompleted(snapshot, weights) {
    var ctx = {
      players: snapshot.players || {},
      h2h: snapshot.h2h || [],
      nowMs: parseDate(snapshot.asOf),
      weights: weights || getWeights(),
    };
    var rows = completedOpeners(snapshot);
    var hits = 0;
    var logLoss = 0;
    var misses = [];
    var byDay = {};
    rows.forEach(function (m) {
      var p1 = winProbability(m.player1Id, m.player2Id, ctx);
      var predId = p1 >= 0.5 ? m.player1Id : m.player2Id;
      var pFav = Math.max(p1, 1 - p1);
      var pActual = m.winnerId === m.player1Id ? p1 : 1 - p1;
      logLoss += -Math.log(Math.max(0.02, Math.min(0.98, pActual)));
      var hit = predId === m.winnerId;
      if (hit) hits += 1;
      else {
        misses.push({
          player1Id: m.player1Id,
          player2Id: m.player2Id,
          winnerId: m.winnerId,
          predictedId: predId,
          pFav: Math.round(pFav * 1000) / 1000,
          date: m.date,
          eventId: m.eventId,
        });
      }
      var day = m.date || "unknown";
      if (!byDay[day]) byDay[day] = { n: 0, hits: 0 };
      byDay[day].n += 1;
      if (hit) byDay[day].hits += 1;
    });
    var n = rows.length;
    var notes = misses.slice(0, 8).map(function (x) {
      return (
        "Miss: predicted " +
        x.predictedId +
        " (" +
        Math.round(x.pFav * 100) +
        "%) but " +
        x.winnerId +
        " won on " +
        x.date
      );
    });
    if (n === 0) notes.push("No completed matches to grade yet.");
    return {
      n: n,
      hits: hits,
      accuracy: n ? hits / n : 0,
      logLoss: n ? logLoss / n : 0,
      misses: misses,
      byDay: byDay,
      weights: ctx.weights,
      notes: notes,
    };
  }

  /**
   * Search nearby ranking / H2H / direction weights on completed results.
   */
  function fineTune(snapshot) {
    var before = learnFromCompleted(snapshot, getWeights());
    var ranks = [0.9, 1.15, 1.35, 1.6, 1.9];
    var dirs = [0.2, 0.4, 0.55, 0.85];
    var h2hs = [0.4, 0.7, 0.9, 1.2];
    var best = { loss: before.logLoss || 99, acc: before.accuracy, weights: getWeights() };
    for (var i = 0; i < ranks.length; i++) {
      for (var j = 0; j < dirs.length; j++) {
        for (var k = 0; k < h2hs.length; k++) {
          var w = { ranking: ranks[i], direction: dirs[j], h2h: h2hs[k] };
          var sc = learnFromCompleted(snapshot, w);
          if (sc.n === 0) continue;
          if (sc.logLoss < best.loss - 1e-6 || (Math.abs(sc.logLoss - best.loss) < 1e-6 && sc.accuracy > best.acc)) {
            best = { loss: sc.logLoss, acc: sc.accuracy, weights: w };
          }
        }
      }
    }
    setWeights(best.weights);
    var after = learnFromCompleted(snapshot, getWeights());
    return { before: before, after: after, weights: getWeights() };
  }

  function matchProbability(player1Id, player2Id, snapshot, extra) {
    extra = extra || {};
    return winProbability(player1Id, player2Id, {
      players: snapshot.players,
      h2h: snapshot.h2h,
      nowMs: parseDate(snapshot.asOf),
      weights: extra.weights || getWeights(),
    });
  }

  var api = {
    REF_MS: REF_MS,
    winProbability: winProbability,
    predictMatch: predictMatch,
    predictBracket: predictBracket,
    predictAllBrackets: predictAllBrackets,
    h2hAdvantage: h2hAdvantage,
    rankingDirection: rankingDirection,
    hottestScore: hottestScore,
    hottestMatches: hottestMatches,
    priceSession: priceSession,
    priceAllSessions: priceAllSessions,
    groupCalendar: groupCalendar,
    fillProjectedSession: fillProjectedSession,
    officialSessionNumber: officialSessionNumber,
    annotateBracketSessions: annotateBracketSessions,
    hasTicketSku: hasTicketSku,
    ticketCatalog: ticketCatalog,
    venueShort: venueShort,
    sessionDemand: sessionDemand,
    venueWeight: venueWeight,
    isTicketedStadium: isTicketedStadium,
    isOpenField: isOpenField,
    advanceLikelihood: advanceLikelihood,
    DIR_RANK: DIR_RANK,
    DEFAULT_WEIGHTS: DEFAULT_WEIGHTS,
    getWeights: getWeights,
    setWeights: setWeights,
    learnFromCompleted: learnFromCompleted,
    fineTune: fineTune,
    matchProbability: matchProbability,
  };

  global.USOpenEngine = api;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
