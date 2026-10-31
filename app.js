/* Shipyard Calc - UI */
(function () {
  "use strict";
  var SC = window.SC;
  var $ = function (id) { return document.getElementById(id); };

  // ---------- storage ----------
  var KEYS = { conv: "shipyard-calc-recent", frac: "shipyard-frac-recent", plate: "shipyard-plate-recent" };
  function loadList(key) {
    try {
      var raw = localStorage.getItem(key);
      if (raw) { var v = JSON.parse(raw); if (Array.isArray(v)) return v.slice(0, 10); }
    } catch (e) { /* storage blocked: session only */ }
    return [];
  }
  function saveList(key, list) {
    try { localStorage.setItem(key, JSON.stringify(list)); } catch (e) { /* session only */ }
  }
  var recent = { conv: loadList(KEYS.conv), frac: loadList(KEYS.frac), plate: loadList(KEYS.plate) };

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }
  function cell(label, value, big, note) {
    var c = el("div", "cell");
    c.appendChild(el("div", "lbl", label));
    c.appendChild(el("div", big ? "v-big" : "v-mid", value));
    if (note) c.appendChild(el("div", "note", note));
    return c;
  }
  function fill(box, nodes) {
    box.textContent = "";
    nodes.forEach(function (n) { if (n) box.appendChild(n); });
  }
  function segValue(seg) { var b = seg.querySelector("button.on"); return b ? b.getAttribute("data-v") : ""; }
  function bindSeg(seg, onChange) {
    seg.addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (!b || !seg.contains(b)) return;
      setSeg(seg, b.getAttribute("data-v"));
      onChange(b.getAttribute("data-v"));
    });
  }
  function setSeg(seg, v) {
    Array.prototype.forEach.call(seg.querySelectorAll("button"), function (b) {
      b.classList.toggle("on", b.getAttribute("data-v") === v);
    });
  }

  // ---------- theme ----------
  function applyTheme(t) {
    document.documentElement.setAttribute("data-theme", t);
    $("themeBtn").textContent = t === "dark" ? "☀" : "☾";
    $("themeBtn").setAttribute("aria-label", t === "dark" ? "Switch to light" : "Switch to dark");
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", t === "dark" ? "#0b0d10" : "#ffffff");
  }
  var theme = "dark";
  try { theme = localStorage.getItem("shipyard-theme") || "dark"; } catch (e) { /* default */ }
  applyTheme(theme);
  $("themeBtn").addEventListener("click", function () {
    theme = theme === "dark" ? "light" : "dark";
    applyTheme(theme);
    try { localStorage.setItem("shipyard-theme", theme); } catch (e) { /* ignore */ }
  });

  // ---------- tabs ----------
  var tool = "frac";
  Array.prototype.forEach.call(document.querySelectorAll(".tab"), function (b) {
    b.addEventListener("click", function () {
      tool = b.getAttribute("data-tab");
      Array.prototype.forEach.call(document.querySelectorAll(".tab"), function (x) { x.classList.toggle("active", x === b); });
      ["frac", "conv", "plate"].forEach(function (t) { $("tab-" + t).classList.toggle("hidden", t !== tool); });
      layoutMode();
      renderRecent();
    });
  });

  // ---------- steady layout ----------
  var recentHome = $("recentBox").parentNode;
  function layoutMode() {
    var fixed = tool === "frac";
    document.body.classList.toggle("fixed", fixed);
    var box = $("recentBox");
    if (fixed) $("fScroll").appendChild(box); else recentHome.appendChild(box);
    if (fixed) { window.scrollTo(0, 0); sizeKeys(); }
  }
  function sizeKeys() {
    if (tool !== "frac") return;
    var keys = $("fKeys"), panel = $("tab-frac");
    var rows = 7 + ($("pad16").classList.contains("hidden") ? 0 : 2);
    var gaps = (rows - 1) * 8;
    var top = $("fScroll").getBoundingClientRect().top;
    var bottomPad = 12 + 8 + 1 + (parseFloat(getComputedStyle(document.body).paddingBottom) || 0);
    var minScroll = 30;
    var avail = window.innerHeight - top - bottomPad - minScroll - gaps + 6 * (rows - 5);
    var kh = Math.max(42, Math.min(68, Math.floor(avail / rows)));
    document.documentElement.style.setProperty("--kh", kh + "px");
  }
  var lastW = 0, lastH = 0;
  window.addEventListener("resize", function () {
    // only re-measure on real size changes (rotation), not on tiny toolbar changes
    if (Math.abs(window.innerWidth - lastW) > 40 || Math.abs(window.innerHeight - lastH) > 120) {
      lastW = window.innerWidth; lastH = window.innerHeight; sizeKeys();
    }
  });
  // fit long text inside the fixed display without growing it
  function fitText(node, max, min) {
    var size = max;
    node.style.fontSize = size + "px";
    while (node.scrollWidth > node.clientWidth && size > min) { size -= 2; node.style.fontSize = size + "px"; }
  }

  // result boxes on the typing tabs only ever grow, so deleting a digit never yanks the page
  function reserveOut() {
    Array.prototype.forEach.call(document.querySelectorAll(".outBox"), function (box) {
      var maxH = 0;
      function ratchet() {
        if (box.offsetParent === null) return; // hidden tab
        var h = box.offsetHeight;
        if (h > maxH) { maxH = h; box.style.minHeight = h + "px"; }
      }
      if (window.MutationObserver) new MutationObserver(ratchet).observe(box, { childList: true, subtree: true, characterData: true });
      ratchet();
    });
  }

  // ---------- recent list ----------
  function pushRecent(which, from, to, dedupe) {
    var prev = recent[which];
    if (dedupe) {
      if (prev.length && prev[0].from === from && prev[0].to === to) return;
      prev = prev.filter(function (r) { return r.from !== from; });
    }
    recent[which] = [{ from: from, to: to }].concat(prev).slice(0, 10);
    saveList(KEYS[which], recent[which]);
    if (which === tool) renderRecent();
  }
  function renderRecent() {
    var list = recent[tool];
    $("recentBox").classList.toggle("hidden", list.length === 0);
    $("recentTitle").textContent = tool === "conv" ? "Recent conversions" : tool === "frac" ? "Recent math" : "Recent plates";
    fill($("recentList"), list.map(function (r) {
      var li = el("li");
      li.appendChild(el("div", "r-to", r.to));
      li.appendChild(el("div", "r-from", tool === "conv" ? "from " + r.from : tool === "frac" ? r.from + " =" : r.from));
      return li;
    }));
  }
  $("recentClear").addEventListener("click", function () {
    recent[tool] = [];
    saveList(KEYS[tool], []);
    renderRecent();
  });

  // =====================================================
  // Tape fractions
  // =====================================================
  var toks = [], fresh = false, lastExpr = "";
  function renderFrac() {
    var r = SC.evaluate(toks);
    var f = r !== null && r !== "div0" ? SC.fmtQ(r) : null;
    var exprLine = fresh ? lastExpr + " =" : SC.showExpr(toks);
    $("fExpr").textContent = exprLine || "Type a number, then tap a fraction";
    $("fRes").textContent = r === "div0" ? "Can't divide by 0" : f ? (fresh ? "" : "= ") + f.text : "";
    fill($("fMore"), f ? [
      f.ftIn ? cell("Feet & inches", f.ftIn) : null,
      cell("Decimal · mm", f.dec + "  ·  " + f.mm, false,
        f.isExact ? 'exact to 1/16"' : 'rounded to nearest 1/16" ' + SC.diffNote(f.diff))
    ] : []);
    var ex = $("fExpr");
    fitText(ex, 22, 15);
    ex.scrollLeft = ex.scrollWidth; // keep the newest entry in view (scrolls inside the display only)
    fitText($("fRes"), 42, 20);
    Array.prototype.forEach.call($("fMore").querySelectorAll(".v-mid"), function (v) { fitText(v, 19, 13); });
  }
  function tap(key) {
    var isOp = key === "+" || key === "\u2212" || key === "\u00d7" || key === "\u00f7";
    toks = SC.press(toks, key, fresh && !isOp);
    if (key !== "ft" || !fresh) { fresh = false; lastExpr = ""; }
    renderFrac();
  }
  function onKeyClick(e) {
    var b = e.target.closest("button[data-k]");
    if (b) tap(b.getAttribute("data-k"));
  }
  $("fracPad").addEventListener("click", onKeyClick);
  $("pad16").addEventListener("click", onKeyClick);
  $("numPad").addEventListener("click", onKeyClick);
  $("t16").addEventListener("click", function () {
    var open = $("pad16").classList.toggle("hidden") === false;
    $("t16").classList.toggle("on", open);
    sizeKeys();
  });
  $("fBack").addEventListener("click", function () { toks = toks.slice(0, -1); fresh = false; lastExpr = ""; renderFrac(); });
  $("fClear").addEventListener("click", function () { toks = []; fresh = false; lastExpr = ""; renderFrac(); });
  $("fEq").addEventListener("click", function () {
    var r = SC.evaluate(toks);
    if (r === null || r === "div0" || fresh) return;
    var expr = SC.showExpr(toks);
    var f = SC.fmtQ(r);
    pushRecent("frac", expr, f.ftIn ? f.text + " = " + f.ftIn : f.text, false);
    lastExpr = expr;
    toks = [{ t: "val", q: r }];
    fresh = true;
    renderFrac();
  });
  renderFrac();

  // =====================================================
  // Metric <-> Imperial
  // =====================================================
  var fracSel = $("cFrac");
  [{ v: "0", l: "none" }].concat(Array.from({ length: 15 }, function (_, i) {
    return { v: String(i + 1), l: SC.fracStr(i + 1) + '"' };
  })).forEach(function (o) { var op = el("option", null, o.l); op.value = o.v; fracSel.appendChild(op); });

  var dir = "toImp", unit = "mm", convTimer = null;
  function convCalc() {
    var metric = $("cMetric").value, feet = $("cFeet").value, inches = $("cInches").value, frac = fracSel.value;
    var mVal = SC.parseNum(metric);
    var mm = unit === "mm" ? mVal : unit === "cm" ? mVal * 10 : mVal * 1000;
    var impOk = metric.trim() !== "" && isFinite(mm) && mm >= 0;
    var imp = impOk ? SC.mmToImp(mm) : null;
    var totalIn = SC.parseNum(feet) * 12 + SC.parseInches(inches) + Number(frac) / 16;
    var metOk = (feet.trim() !== "" || inches.trim() !== "" || frac !== "0") && isFinite(totalIn) && totalIn >= 0;
    var outMm = metOk ? totalIn * 25.4 : 0;
    return { metric: metric, feet: feet, inches: inches, frac: frac, mm: mm, imp: imp, metOk: metOk, outMm: outMm };
  }
  function renderConv() {
    var c = convCalc();
    $("cHead").textContent = dir === "toImp" ? "Metric → Inches & Feet" : "Feet & Inches → Metric";
    $("cToImp").classList.toggle("hidden", dir !== "toImp");
    $("cToMet").classList.toggle("hidden", dir !== "toMet");
    $("cMetricLbl").textContent = "Measurement in " + unit;
    $("cMetric").placeholder = "Type " + unit;
    if (c.imp) {
      fill($("cImpOut"), [
        cell('Feet & inches (nearest 1/16")', c.imp.ftIn, true, SC.diffNote(c.imp.diff)),
        cell("Inches with fraction", c.imp.tot),
        cell("Decimal inches", c.imp.dec),
        cell("Decimal feet", c.imp.ft)
      ]);
    } else {
      fill($("cImpOut"), c.metric.trim() !== "" ? [el("div", "note", "Numbers only, like 1250 or 12.5")] : []);
    }
    if (c.metOk) {
      fill($("cMetOut"), [
        cell("Millimeters", c.outMm.toFixed(1) + " mm", true),
        cell("Centimeters", (c.outMm / 10).toFixed(2) + " cm"),
        cell("Meters", (c.outMm / 1000).toFixed(3) + " m")
      ]);
    } else {
      fill($("cMetOut"), (c.feet.trim() !== "" || c.inches.trim() !== "") ? [el("div", "note", "Try feet like 3, inches like 5 3/8 or 5.375")] : []);
    }
    // save after 1.5 s of no typing
    var from = dir === "toImp"
      ? c.metric.trim() + " " + unit
      : [c.feet.trim() ? c.feet.trim() + "'" : "", c.inches.trim() ? c.inches.trim() + '"' : "", c.frac !== "0" ? "+" + SC.fracStr(Number(c.frac)) + '"' : ""].filter(Boolean).join(" ");
    var to = dir === "toImp" ? (c.imp ? c.imp.ftIn + "  ·  " + c.imp.dec : "") : (c.metOk ? c.outMm.toFixed(1) + " mm" : "");
    if (convTimer) clearTimeout(convTimer);
    if (to) convTimer = setTimeout(function () { pushRecent("conv", from, to, true); }, 1500);
  }
  bindSeg($("cDir"), function (v) { dir = v; renderConv(); });
  bindSeg($("cUnit"), function (v) { unit = v; renderConv(); });
  ["cMetric", "cFeet", "cInches"].forEach(function (id) { $(id).addEventListener("input", renderConv); });
  fracSel.addEventListener("change", renderConv);
  $("cClear").addEventListener("click", function () {
    $("cMetric").value = ""; $("cFeet").value = ""; $("cInches").value = ""; fracSel.value = "0"; renderConv();
  });
  $("cSwap").addEventListener("click", function () {
    var c = convCalc();
    if (dir === "toImp") {
      if (c.imp && isFinite(c.mm)) {
        var n16 = Math.round((c.mm / 25.4) * 16 + 1e-9);
        var ft = Math.floor(n16 / 192), rem = n16 - ft * 192;
        $("cFeet").value = ft ? String(ft) : "";
        $("cInches").value = String(Math.floor(rem / 16));
        fracSel.value = String(rem % 16);
      }
      dir = "toMet";
    } else {
      if (c.metOk) { unit = "mm"; setSeg($("cUnit"), "mm"); $("cMetric").value = c.outMm.toFixed(1); }
      dir = "toImp";
    }
    setSeg($("cDir"), dir);
    renderConv();
  });
  renderConv();

  // =====================================================
  // Plate weight
  // =====================================================
  var lenUnit = "ft", thkUnit = "mm", plateTimer = null;
  function renderPlate() {
    var ftMode = lenUnit === "ft";
    $("pFtBoxes").classList.toggle("hidden", !ftMode);
    $("pOneBoxes").classList.toggle("hidden", ftMode);
    $("pLLbl").textContent = "Length (" + lenUnit + ")";
    $("pWLbl").textContent = "Width (" + lenUnit + ")";
    $("pL").placeholder = lenUnit; $("pW").placeholder = lenUnit;
    var inMode = lenUnit === "in" ? "text" : "decimal";
    $("pL").setAttribute("inputmode", inMode); $("pW").setAttribute("inputmode", inMode);
    $("pThkLbl").textContent = thkUnit === "mm" ? "Thickness (mm)" : "Thickness (inches)";
    $("pThk").placeholder = thkUnit === "mm" ? "e.g. 14" : "e.g. 1/2";
    $("pThk").setAttribute("inputmode", thkUnit === "mm" ? "decimal" : "text");
    $("pThkFracs").classList.toggle("hidden", thkUnit !== "in");
    var thk = $("pThk").value;
    Array.prototype.forEach.call($("pThkFracs").querySelectorAll("button"), function (b) {
      b.classList.toggle("on", b.getAttribute("data-t") === thk);
    });

    var la = ftMode ? $("pLFt").value : $("pL").value, lb = ftMode ? $("pLIn").value : "";
    var wa = ftMode ? $("pWFt").value : $("pW").value, wb = ftMode ? $("pWIn").value : "";
    var L = SC.lenToFt(lenUnit, la, lb), W = SC.lenToFt(lenUnit, wa, wb), T = SC.thkToFt(thkUnit, thk);
    var qs = $("pQty").value, xs = $("pExtra").value;
    var qRaw = qs.trim() === "" ? 1 : SC.parseNum(qs);
    var Q = isFinite(qRaw) && qRaw > 0 ? qRaw : NaN;
    var xRaw = xs.trim() === "" ? 0 : SC.parseNum(xs);
    var X = isFinite(xRaw) ? xRaw : 0;
    var mat = $("pMat").value;
    var r = SC.plate(L, W, T, Q, X, mat);
    if (!r) { fill($("pOut"), []); if (plateTimer) clearTimeout(plateTimer); return; }

    var tot = el("div", "cell");
    tot.appendChild(el("div", "lbl", Q > 1 ? "Total weight (" + Q + " pieces)" : "Total weight"));
    tot.appendChild(el("div", "v-big", SC.fmtWt(r.totLb) + " lb"));
    if (r.totLb >= 1000) tot.appendChild(el("div", "v-mid", SC.fmtNum(r.tons, 2) + " tons (2,000 lb)"));
    fill($("pOut"), [
      tot,
      cell("Metric", SC.fmtWt(r.totKg) + " kg  ·  " + SC.fmtNum(r.tonnes, 2) + " t"),
      Q > 1 ? cell("Each piece", SC.fmtWt(r.pieceLb) + " lb  ·  " + SC.fmtWt(r.pieceKg) + " kg") : null,
      cell("Plate area · weight per sq ft", SC.fmtNum(r.area, 1) + " ft²  ·  " + SC.fmtNum(r.lbPerFt2, 2) + " lb/ft²", false,
        X ? "Totals include +" + X + "% for stiffeners/extras" : ""),
      el("div", "note", "Estimate for flat plate only. Always confirm the lift weight and rigging with your rigging plan or lift supervisor.")
    ]);

    var dim = function (a, b) {
      return ftMode ? (a.trim() || "0") + "'" + (b.trim() ? " " + b.trim() + '"' : "") : a.trim() + " " + lenUnit;
    };
    var from = (Q > 1 ? Q + " × " : "") + dim(la, lb) + " x " + dim(wa, wb) + " x " + thk.trim() +
      (thkUnit === "mm" ? " mm" : '"') + " " + SC.MATS[mat].name + (X ? " +" + X + "%" : "");
    var to = SC.fmtWt(r.totLb) + " lb  ·  " + SC.fmtWt(r.totKg) + " kg";
    if (plateTimer) clearTimeout(plateTimer);
    plateTimer = setTimeout(function () { pushRecent("plate", from, to, true); }, 1500);
  }
  function clearLen() { ["pLFt", "pLIn", "pWFt", "pWIn", "pL", "pW"].forEach(function (id) { $(id).value = ""; }); }
  bindSeg($("pLenUnit"), function (v) { lenUnit = v; clearLen(); renderPlate(); });
  bindSeg($("pThkUnit"), function (v) { thkUnit = v; $("pThk").value = ""; renderPlate(); });
  ["pLFt", "pLIn", "pWFt", "pWIn", "pL", "pW", "pThk", "pQty", "pExtra"].forEach(function (id) {
    $(id).addEventListener("input", renderPlate);
  });
  $("pMat").addEventListener("change", renderPlate);
  $("pThkFracs").addEventListener("click", function (e) {
    var b = e.target.closest("button[data-t]");
    if (b) { $("pThk").value = b.getAttribute("data-t"); renderPlate(); }
  });
  $("pClear").addEventListener("click", function () {
    clearLen(); $("pThk").value = ""; $("pQty").value = "1"; $("pExtra").value = "0"; renderPlate();
  });
  renderPlate();

  lastW = window.innerWidth; lastH = window.innerHeight;
  layoutMode();
  renderRecent();
  reserveOut();

  // ---------- share / QR ----------
  var SHARE_URL = "https://biscuit5760.github.io/shipyard-calc/";
  var ov = $("shareOv"), lastFocus = null;
  function openShare() { lastFocus = document.activeElement; ov.classList.remove("hidden"); $("shareCopy").textContent = "Copy link"; $("shareClose").focus({ preventScroll: true }); }
  function closeShare() { ov.classList.add("hidden"); if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true }); }
  $("shareBtn").addEventListener("click", openShare);
  $("shareClose").addEventListener("click", closeShare);
  ov.addEventListener("click", function (e) { if (e.target === ov) closeShare(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !ov.classList.contains("hidden")) closeShare(); });
  function copied(ok) { $("shareCopy").textContent = ok ? "Copied ✓" : "Press and hold the link to copy"; }
  function fallbackCopy() {
    try {
      var ta = document.createElement("textarea"); ta.value = SHARE_URL; ta.setAttribute("readonly", "");
      ta.style.position = "fixed"; ta.style.opacity = "0"; document.body.appendChild(ta); ta.select();
      var ok = document.execCommand("copy"); document.body.removeChild(ta); copied(ok);
    } catch (e) { copied(false); }
  }
  $("shareCopy").addEventListener("click", function () {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(SHARE_URL).then(function () { copied(true); }, fallbackCopy);
    } else fallbackCopy();
  });
  if (navigator.share) {
    $("shareSend").classList.remove("hidden");
    $("shareSend").addEventListener("click", function () {
      navigator.share({ title: "Shipyard Calc", text: "Shipyard Calc - tape fractions, metric to imperial, plate weight:", url: SHARE_URL }).catch(function () { /* cancelled */ });
    });
  }

  // ---------- offline ----------
  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("./sw.js").catch(function () { /* offline cache unavailable */ });
    });
  }
})();
