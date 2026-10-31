/* Shipyard Calc - math (no DOM). Works in the browser and in node for tests. */
(function (root) {
  "use strict";

  function gcd(a, b) {
    a = Math.abs(a); b = Math.abs(b);
    while (b) { var t = a % b; a = b; b = t; }
    return a;
  }

  function fracStr(n16) {
    var w = Math.floor(n16 / 16), r = n16 % 16;
    if (!r) return String(w);
    var g = gcd(r, 16), f = (r / g) + "/" + (16 / g);
    return w ? w + " " + f : f;
  }

  // ---------- Metric <-> Imperial ----------
  function mmToImp(mm) {
    var inch = mm / 25.4;
    var n16 = Math.round(inch * 16 + 1e-9);
    var ft = Math.floor(n16 / 192);
    var rem = n16 - ft * 192;
    var remStr = fracStr(rem);
    if (ft > 0 && rem > 0 && rem < 16) remStr = "0 " + remStr;
    var ftIn = ft > 0 ? ft + "' " + remStr + '"' : remStr + '"';
    return {
      dec: inch.toFixed(3) + '"',
      ftIn: ftIn,
      tot: fracStr(n16) + '"',
      ft: (inch / 12).toFixed(4) + "'",
      diff: n16 / 16 - inch
    };
  }

  function parseNum(s) {
    var t = String(s).trim().replace(",", ".");
    if (!t) return 0;
    if (!/^\d*\.?\d*$/.test(t) || t === ".") return NaN;
    return parseFloat(t);
  }

  function parseInches(s) {
    var t = String(s).trim().replace(/"/g, "");
    if (!t) return 0;
    var m = t.match(/^(\d+(?:\.\d+)?)?(?:[\s-]+)?(?:(\d+)\/(\d+))?$/);
    if (!m || (!m[1] && !m[2])) return NaN;
    var v = m[1] ? parseFloat(m[1]) : 0;
    if (m[2]) {
      var d = Number(m[3]);
      if (!d) return NaN;
      v += Number(m[2]) / d;
    }
    return v;
  }

  function diffNote(d) {
    if (Math.abs(d) < 0.0005) return "exact";
    var sign = d > 0 ? "+" : "\u2212";
    return "(" + sign + Math.abs(d).toFixed(3) + '" from exact)';
  }

  // ---------- Tape-measure fractions (exact rational math) ----------
  function q(n, d) {
    if (d === undefined) d = 1;
    if (d < 0) { n = -n; d = -d; }
    var g = gcd(n, d) || 1;
    return { n: n / g, d: d / g };
  }
  function qAdd(a, b) { return q(a.n * b.d + b.n * a.d, a.d * b.d); }
  function qSub(a, b) { return q(a.n * b.d - b.n * a.d, a.d * b.d); }
  function qMul(a, b) { return q(a.n * b.n, a.d * b.d); }
  function qDiv(a, b) { return b.n === 0 ? null : q(a.n * b.d, a.d * b.n); }

  var GLYPH = { 8: "\u00bd", 4: "\u00bc", 12: "\u00be", 2: "\u215b", 6: "\u215c", 10: "\u215d", 14: "\u215e" };
  function fracLabel(n16) {
    if (GLYPH[n16]) return GLYPH[n16];
    var g = gcd(n16, 16);
    return (n16 / g) + "/" + (16 / g);
  }

  // tokens: {t:"dig",v} {t:"frac",v:n16} {t:"ft"} {t:"op",v} {t:"val",q}
  function toParts(toks) {
    var out = [], cur = null;
    for (var i = 0; i < toks.length; i++) {
      var k = toks[i];
      if (k.t === "op") {
        if (cur) out.push({ kind: "term", term: cur });
        cur = null;
        out.push({ kind: "op", v: k.v });
        continue;
      }
      if (!cur) cur = { feet: "", inch: "", frac: 0, hasFt: false, val: null };
      if (k.t === "val") cur.val = k.q;
      else if (k.t === "dig") cur.inch += k.v;
      else if (k.t === "frac") cur.frac = k.v;
      else { cur.feet = cur.inch || "0"; cur.inch = ""; cur.hasFt = true; }
    }
    if (cur) out.push({ kind: "term", term: cur });
    return out;
  }

  function termQ(t) {
    if (t.val) return t.val;
    var r = q(Number(t.inch || "0") * 16 + t.frac, 16);
    if (t.hasFt) r = qAdd(r, q(Number(t.feet || "0") * 12));
    return r;
  }

  function lastTerm(toks) {
    var p = toParts(toks), last = p[p.length - 1];
    return last && last.kind === "term" ? last.term : null;
  }

  function press(toks, key, fresh) {
    var last = toks[toks.length - 1];
    var t = lastTerm(toks);
    if (/^\d$/.test(key)) {
      if (fresh) return [{ t: "dig", v: key }];
      if (t && (t.val || t.frac)) return toks;
      if (t && key === "0" && t.inch === "0") return toks;
      return toks.concat({ t: "dig", v: key });
    }
    if (key === "ft") {
      if (fresh || !t || t.val || t.hasFt || t.frac || !t.inch) return toks;
      return toks.concat({ t: "ft" });
    }
    if (key.charAt(0) === "f") {
      var n16 = Number(key.slice(1));
      if (fresh) return [{ t: "frac", v: n16 }];
      if (t && t.val) return toks;
      if (last && last.t === "frac") return toks.slice(0, -1).concat({ t: "frac", v: n16 });
      return toks.concat({ t: "frac", v: n16 });
    }
    if (!toks.length) return toks;
    if (last.t === "op") return toks.slice(0, -1).concat({ t: "op", v: key });
    return toks.concat({ t: "op", v: key });
  }

  function evaluate(toks) {
    var p = toParts(toks);
    while (p.length && p[p.length - 1].kind === "op") p.pop();
    if (!p.length) return null;
    var vals = [], ops = [], acc = null;
    for (var i = 0; i < p.length; i++) {
      var x = p[i];
      if (x.kind === "op") { ops.push(x.v); continue; }
      var v = termQ(x.term);
      if (acc === null) { acc = v; continue; }
      var op = ops.pop();
      if (op === "\u00d7") acc = qMul(acc, v);
      else if (op === "\u00f7") {
        var r = qDiv(acc, v);
        if (!r) return "div0";
        acc = r;
      } else { ops.push(op); vals.push(acc); acc = v; }
    }
    if (acc === null) return null;
    vals.push(acc);
    var res = vals[0];
    for (var j = 1; j < vals.length; j++) res = ops[j - 1] === "+" ? qAdd(res, vals[j]) : qSub(res, vals[j]);
    return res;
  }

  function fmtQ(r) {
    var exact = r.n / r.d;
    var neg = exact < 0;
    var n16 = Math.round(Math.abs(exact) * 16 + 1e-9);
    var sign = neg && n16 > 0 ? "\u2212" : "";
    var text = sign + fracStr(n16) + '"';
    var ftIn = "";
    if (n16 >= 192) {
      var ft = Math.floor(n16 / 192), rem = n16 - ft * 192;
      ftIn = sign + ft + "' " + fracStr(rem) + '"';
    }
    var isExact = (r.n * 16) % r.d === 0;
    var diff = (neg ? -n16 : n16) / 16 - exact;
    return {
      text: text,
      ftIn: ftIn,
      dec: exact.toFixed(3).replace("-", "\u2212") + '"',
      mm: (exact * 25.4).toFixed(1).replace("-", "\u2212") + " mm",
      isExact: isExact,
      diff: diff
    };
  }

  function showExpr(toks) {
    return toParts(toks).map(function (x) {
      if (x.kind === "op") return x.v;
      var t = x.term;
      if (t.val) return fmtQ(t.val).text;
      var s = "";
      if (t.hasFt) s += t.feet + "'";
      if (t.inch) s += (s ? " " : "") + t.inch;
      if (t.frac) s += (s ? " " : "") + fracLabel(t.frac);
      if (t.hasFt && (t.inch || t.frac)) s += '"';
      return s;
    }).join(" ");
  }

  // ---------- Plate weight ----------
  var MATS = {
    mild: { label: "Mild steel (490 lb/ft\u00b3)", name: "steel", lb: 490, kg: 7850 },
    stainless: { label: "Stainless (500 lb/ft\u00b3)", name: "stainless", lb: 500, kg: 8000 },
    alum: { label: "Aluminum (169 lb/ft\u00b3)", name: "aluminum", lb: 169, kg: 2700 }
  };
  var FT3_TO_M3 = 0.028316846592;

  // length in feet from the entry boxes
  function lenToFt(unit, a, b) {
    a = String(a || ""); b = String(b || "");
    if (unit === "ft") {
      if (a.trim() === "" && b.trim() === "") return NaN;
      return parseNum(a) + parseInches(b) / 12;
    }
    if (a.trim() === "") return NaN;
    if (unit === "in") return parseInches(a) / 12;
    if (unit === "mm") return parseNum(a) / 304.8;
    return parseNum(a) / 0.3048;
  }

  function thkToFt(unit, s) {
    s = String(s || "");
    if (s.trim() === "") return NaN;
    return unit === "mm" ? parseNum(s) / 304.8 : parseInches(s) / 12;
  }

  // L, W, T in feet; qty count; extraPct percent
  function plate(L, W, T, qty, extraPct, mat) {
    var m = MATS[mat] || MATS.mild;
    var ok = [L, W, T, qty].every(function (v) { return isFinite(v) && v > 0; });
    if (!ok) return null;
    var x = isFinite(extraPct) ? extraPct : 0;
    var area = L * W;
    var vol = area * T * (1 + x / 100);
    var pieceLb = vol * m.lb, pieceKg = vol * FT3_TO_M3 * m.kg;
    return {
      area: area,
      lbPerFt2: T * m.lb,
      pieceLb: pieceLb,
      pieceKg: pieceKg,
      totLb: pieceLb * qty,
      totKg: pieceKg * qty,
      tons: pieceLb * qty / 2000,
      tonnes: pieceKg * qty / 1000
    };
  }

  function fmtNum(v, dec) {
    return v.toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec });
  }
  function fmtWt(v) { return fmtNum(v, v < 1000 ? 1 : 0); }

  var api = {
    gcd: gcd, fracStr: fracStr, mmToImp: mmToImp, parseNum: parseNum, parseInches: parseInches,
    diffNote: diffNote, fracLabel: fracLabel, press: press, evaluate: evaluate, fmtQ: fmtQ,
    showExpr: showExpr, MATS: MATS, lenToFt: lenToFt, thkToFt: thkToFt, plate: plate,
    fmtNum: fmtNum, fmtWt: fmtWt
  };
  root.SC = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof self !== "undefined" ? self : this);
