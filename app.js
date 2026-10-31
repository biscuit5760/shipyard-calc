/* Shipyard Calc - UI */
// Anonymous open counter (GoatCounter). Change this one line if the site code changes; "" turns counting off.
var COUNTER_URL = "https://shipyardcalc.goatcounter.com/count";
(function () {
  "use strict";
  var SC = window.SC;
  var $ = function (id) { return document.getElementById(id); };
  var T = window.I18N.T;
  window.I18N.apply(document);
  var DW = { exact: T("exact"), fromExact: T("fromExact") }; // words for the rounding note
  var uName = function (u) { return u === "ft" ? T("phFt") : u === "in" ? T("phIn") : u; };

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
    $("themeBtn").setAttribute("aria-label", t === "dark" ? T("toLight") : T("toDark"));
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
    $("fKeys").classList.toggle("open16", !$("pad16").classList.contains("hidden"));
  }
  // real visible height: CSS 100dvh where supported, else track the visual viewport
  var hasDvh = window.CSS && CSS.supports && CSS.supports("height", "100dvh");
  function setAppH() {
    if (hasDvh) return;
    var h = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    document.documentElement.style.setProperty("--appH", Math.round(h) + "px");
  }
  setAppH();
  window.addEventListener("resize", setAppH);
  if (window.visualViewport) window.visualViewport.addEventListener("resize", setAppH);
  window.addEventListener("orientationchange", function () { setTimeout(setAppH, 300); });
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
    $("recentTitle").textContent = tool === "conv" ? T("recentConv") : tool === "frac" ? T("recentFrac") : T("recentPlate");
    fill($("recentList"), list.map(function (r) {
      var li = el("li");
      li.appendChild(el("div", "r-to", r.to));
      li.appendChild(el("div", "r-from", tool === "conv" ? T("from") + r.from : tool === "frac" ? r.from + " =" : r.from));
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
    $("fExpr").textContent = exprLine || T("fStart");
    $("fRes").textContent = r === "div0" ? T("div0") : f ? (fresh ? "" : f.isExact ? "= " : "\u2248 ") + f.text : "";
    fill($("fMore"), f ? [
      f.ftIn ? cell(T("ftIn"), f.ftIn) : null,
      cell(T("decMm"), f.dec + "  ·  " + f.mm),
      el("div", "fNote", f.isExact ? T("exactMark") : T("nearest") + SC.diffNote(f.diff, DW))
    ] : [
      el("div", "fHint", T("hint1")),
      el("div", "fHint", T("hint2"))
    ]);
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
  // screen-reader names come from each key's own value, e.g. f6 -> "3/8 inch" / "3/8 de pulgada"
  Array.prototype.forEach.call(document.querySelectorAll('#fKeys button[data-k^="f"]'), function (b) {
    b.setAttribute("aria-label", T("fracAria", { f: SC.fracStr(Number(b.getAttribute("data-k").slice(1))) }));
  });
  $("fracPad").addEventListener("click", onKeyClick);
  $("pad16").addEventListener("click", onKeyClick);
  $("numPad").addEventListener("click", onKeyClick);
  $("t16").addEventListener("click", function () {
    var open = $("pad16").classList.toggle("hidden") === false;
    $("t16").classList.toggle("on", open);
    $("t16").setAttribute("aria-expanded", open ? "true" : "false");
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
  [{ v: "0", l: T("none") }].concat(Array.from({ length: 15 }, function (_, i) {
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
    $("cHead").textContent = dir === "toImp" ? T("cHeadImp") : T("cHeadMet");
    $("cToImp").classList.toggle("hidden", dir !== "toImp");
    $("cToMet").classList.toggle("hidden", dir !== "toMet");
    $("cMetricLbl").textContent = T("measIn", { u: unit });
    $("cMetric").placeholder = T("typeU", { u: unit });
    if (c.imp) {
      fill($("cImpOut"), [
        cell(T("ftInNear"), c.imp.ftIn, true, SC.diffNote(c.imp.diff, DW)),
        cell(T("inFrac"), c.imp.tot),
        cell(T("decIn"), c.imp.dec),
        cell(T("decFt"), c.imp.ft)
      ]);
    } else {
      fill($("cImpOut"), c.metric.trim() !== "" ? [el("div", "note", T("numOnly"))] : []);
    }
    if (c.metOk) {
      fill($("cMetOut"), [
        cell(T("mmL"), SC.fmtMm(c.outMm) + " mm", true),
        cell(T("cmL"), (c.outMm / 10).toFixed(2) + " cm"),
        cell(T("mL"), (c.outMm / 1000).toFixed(3) + " m")
      ]);
    } else {
      fill($("cMetOut"), (c.feet.trim() !== "" || c.inches.trim() !== "") ? [el("div", "note", T("tryFt"))] : []);
    }
    // save after 1.5 s of no typing
    var from = dir === "toImp"
      ? c.metric.trim() + " " + unit
      : [c.feet.trim() ? c.feet.trim() + "'" : "", c.inches.trim() ? c.inches.trim() + '"' : "", c.frac !== "0" ? "+" + SC.fracStr(Number(c.frac)) + '"' : ""].filter(Boolean).join(" ");
    var to = dir === "toImp" ? (c.imp ? c.imp.ftIn + "  ·  " + c.imp.dec : "") : (c.metOk ? SC.fmtMm(c.outMm) + " mm" : "");
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
    $("pLLbl").textContent = T("lenU", { u: uName(lenUnit) });
    $("pWLbl").textContent = T("widU", { u: uName(lenUnit) });
    $("pL").placeholder = uName(lenUnit); $("pW").placeholder = uName(lenUnit);
    var inMode = lenUnit === "in" ? "text" : "decimal";
    $("pL").setAttribute("inputmode", inMode); $("pW").setAttribute("inputmode", inMode);
    $("pThkLbl").textContent = thkUnit === "mm" ? T("thkMm") : T("thkInch");
    $("pThk").placeholder = thkUnit === "mm" ? T("eg14") : T("egHalf");
    $("pThk").setAttribute("inputmode", thkUnit === "mm" ? "decimal" : "text");
    $("pThkFracs").classList.toggle("hidden", thkUnit !== "in");
    var thk = $("pThk").value;
    Array.prototype.forEach.call($("pThkFracs").querySelectorAll("button"), function (b) {
      b.classList.toggle("on", b.getAttribute("data-t") === thk);
    });

    var la = ftMode ? $("pLFt").value : $("pL").value, lb = ftMode ? $("pLIn").value : "";
    var wa = ftMode ? $("pWFt").value : $("pW").value, wb = ftMode ? $("pWIn").value : "";
    var L = SC.lenToFt(lenUnit, la, lb), W = SC.lenToFt(lenUnit, wa, wb), Th = SC.thkToFt(thkUnit, thk);
    var qs = $("pQty").value;
    var qRaw = qs.trim() === "" ? 1 : SC.parseNum(qs);
    var Q = isFinite(qRaw) && qRaw > 0 ? qRaw : NaN;
    var mat = $("pMat").value;
    var r = SC.plate(L, W, Th, Q, mat);
    if (!r) { fill($("pOut"), []); if (plateTimer) clearTimeout(plateTimer); return; }

    var tot = el("div", "cell");
    tot.appendChild(el("div", "lbl", Q > 1 ? T("totN", { n: Q }) : T("tot")));
    tot.appendChild(el("div", "v-big", SC.fmtWt(r.totLb) + " lb"));
    if (r.totLb >= 1000) tot.appendChild(el("div", "v-mid", T("tons", { t: SC.fmtNum(r.tons, 2) })));
    fill($("pOut"), [
      tot,
      cell(T("metric"), SC.fmtWt(r.totKg) + " kg  ·  " + SC.fmtNum(r.tonnes, 2) + " t"),
      Q > 1 ? cell(T("each"), SC.fmtWt(r.pieceLb) + " lb  ·  " + SC.fmtWt(r.pieceKg) + " kg") : null,
      cell(T("area"), SC.fmtNum(r.area, 1) + " ft²  ·  " + SC.fmtNum(r.lbPerFt2, 2) + " lb/ft²"),
      el("div", "note", T("safety"))
    ]);

    var dim = function (a, b) {
      return ftMode ? (a.trim() || "0") + "'" + (b.trim() ? " " + b.trim() + '"' : "") : a.trim() + " " + lenUnit;
    };
    var from = (Q > 1 ? Q + " × " : "") + dim(la, lb) + " x " + dim(wa, wb) + " x " + thk.trim() +
      (thkUnit === "mm" ? " mm" : '"') + " " + T({ mild: "nmMild", stainless: "nmStain", alum: "nmAlum" }[mat]);
    var to = SC.fmtWt(r.totLb) + " lb  ·  " + SC.fmtWt(r.totKg) + " kg";
    if (plateTimer) clearTimeout(plateTimer);
    plateTimer = setTimeout(function () { pushRecent("plate", from, to, true); }, 1500);
  }
  function clearLen() { ["pLFt", "pLIn", "pWFt", "pWIn", "pL", "pW"].forEach(function (id) { $(id).value = ""; }); }
  bindSeg($("pLenUnit"), function (v) { lenUnit = v; clearLen(); renderPlate(); });
  bindSeg($("pThkUnit"), function (v) { thkUnit = v; $("pThk").value = ""; renderPlate(); });
  ["pLFt", "pLIn", "pWFt", "pWIn", "pL", "pW", "pThk", "pQty"].forEach(function (id) {
    $(id).addEventListener("input", renderPlate);
  });
  $("pMat").addEventListener("change", renderPlate);
  $("pThkFracs").addEventListener("click", function (e) {
    var b = e.target.closest("button[data-t]");
    if (b) { $("pThk").value = b.getAttribute("data-t"); renderPlate(); }
  });
  $("pClear").addEventListener("click", function () {
    clearLen(); $("pThk").value = ""; $("pQty").value = "1"; renderPlate();
  });
  renderPlate();

  layoutMode();
  renderRecent();
  reserveOut();

  // ---------- share / QR ----------
  var SHARE_URL = "https://biscuit5760.github.io/shipyard-calc/";
  var ov = $("shareOv"), lastFocus = null;
  document.querySelector(".qrBox img").alt = T("qrAlt", { u: SHARE_URL });
  function openShare() { lastFocus = document.activeElement; ov.classList.remove("hidden"); $("shareCopy").textContent = T("copy"); $("shareClose").focus({ preventScroll: true }); }
  function closeShare() { ov.classList.add("hidden"); if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true }); }
  $("shareBtn").addEventListener("click", openShare);
  $("shareClose").addEventListener("click", closeShare);
  ov.addEventListener("click", function (e) { if (e.target === ov) closeShare(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !ov.classList.contains("hidden")) closeShare(); });
  function copied(ok) { $("shareCopy").textContent = ok ? T("copied") : T("copyFail"); }
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
      navigator.share({ title: "Shipyard Calc", text: T("shareText"), url: SHARE_URL }).catch(function () { /* cancelled */ });
    });
  }

  // ---------- offline ----------
  // ---------- install banner ----------
  // Phones never let a web page install itself, so this just makes the phone's own install step easy to find.
  // Android/Chrome/Edge/Samsung: one tap opens the phone's real Install box. iPhone: short Share -> Add to Home Screen tip.
  (function () {
    var bar = $("instBar"), btn = $("instBtn"), msg = $("instMsg");
    var DKEY = "shipyard-install-hidden", IKEY = "shipyard-installed", WEEK = 7 * 24 * 3600 * 1000;
    var ua = navigator.userAgent || "", deferred = null, mode = "", lastTap = 0, pending = null;
    function store(k, v) { try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { /* ignore */ } }
    function read(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
    function standalone() {
      var mm = function (q) { return window.matchMedia && window.matchMedia(q).matches; };
      return mm("(display-mode: standalone)") || mm("(display-mode: fullscreen)") || mm("(display-mode: minimal-ui)") ||
        navigator.standalone === true || document.referrer.indexOf("android-app://") === 0;
    }
    function hiddenByUser() { var t = Number(read(DKEY) || 0); return t > 0 && Date.now() - t < WEEK; }
    var isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    var isAndroid = /Android/i.test(ua);
    var inApp = /FBAN|FBAV|FB_IAB|Messenger|Instagram|Line\/|GSA\/|Snapchat|Twitter|MicroMessenger|GmailApp|; wv\)/i.test(ua);
    var iosOtherBrowser = /CriOS|FxiOS|EdgiOS|OPiOS/.test(ua); // these have Share > Add to Home Screen too (iOS 16.4+)
    var iosSafari = isIOS && !inApp && (iosOtherBrowser || /Safari\//.test(ua));

    var SHARE_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" role="img" aria-label="Share"><path d="M12 3v12"/><path d="M8 7l4-4 4 4"/><path d="M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1"/></svg>';
    function setMsg(key) {
      msg.textContent = "";
      T(key).split("{icon}").forEach(function (part, i) {
        if (i > 0) { var s = document.createElement("span"); s.className = "instSvg"; s.innerHTML = SHARE_SVG; s.firstChild.setAttribute("aria-label", T("share")); msg.appendChild(s); }
        if (part) msg.appendChild(document.createTextNode(part));
      });
    }
    function hide() { mode = ""; bar.classList.add("hidden"); document.body.classList.remove("instOn"); if (pending) { clearTimeout(pending); pending = null; } }
    function show(m) {
      if (standalone() || hiddenByUser()) return hide();
      if (m !== "prompt" && read(IKEY)) return; // already installed from this browser: no tip
      // never shift the keypad in the middle of typing: wait for a short pause
      var wait = 1500 - (Date.now() - lastTap);
      if (wait > 0) { if (pending) clearTimeout(pending); pending = setTimeout(function () { pending = null; show(m); }, wait); return; }
      mode = m;
      btn.classList.toggle("hidden", m !== "prompt");
      msg.classList.toggle("hidden", m === "prompt");
      if (m === "ios") setMsg("instIos");
      else if (m === "iosOther") setMsg("instIosOther");
      else if (m === "android") setMsg("instAnd");
      else if (m === "inApp") setMsg("instInApp");
      bar.classList.remove("hidden");
      document.body.classList.add("instOn");
    }
    document.addEventListener("pointerdown", function (e) { if (!bar.contains(e.target)) lastTap = Date.now(); }, true);

    if (standalone()) { store(IKEY, "1"); return; } // opened from the home screen: nothing to show
    window.addEventListener("beforeinstallprompt", function (e) {
      e.preventDefault();
      deferred = e;
      store(IKEY, null); // Chrome only offers this when the app is NOT installed
      show("prompt");
    });
    window.addEventListener("appinstalled", function () { store(IKEY, "1"); deferred = null; hide(); });
    btn.addEventListener("click", function () {
      if (!deferred) return hide();
      var ev = deferred; deferred = null;
      try {
        ev.prompt();
        if (ev.userChoice) ev.userChoice.then(function (c) { if (c && c.outcome === "accepted") store(IKEY, "1"); hide(); }, hide);
        else hide();
      } catch (err) { hide(); }
    });
    $("instX").addEventListener("click", function () { store(DKEY, String(Date.now())); hide(); });
    if (window.matchMedia) {
      var mq = window.matchMedia("(display-mode: standalone)");
      var onMode = function () { if (standalone()) hide(); };
      if (mq.addEventListener) mq.addEventListener("change", onMode); else if (mq.addListener) mq.addListener(onMode);
    }

    if (isIOS) { show(iosSafari ? "ios" : "iosOther"); return; }
    if (isAndroid) {
      // Chrome, Edge and Samsung fire beforeinstallprompt within a few seconds; QR-scanner and chat-app browsers usually don't.
      setTimeout(function () { if (!deferred && !mode) show(inApp ? "inApp" : "android"); }, 3000);
    }
  })();

  // ---------- anonymous open counter ----------
  // Sends only a path, title, and "installed"/"browser". No cookies, no IDs, no referrer.
  // /first-open: once ever per device. /app: at most once per day per device.
  (function () {
    if (!COUNTER_URL || location.protocol === "file:") return;
    function get(k) { try { return localStorage.getItem(k); } catch (e) { return "x"; } } // storage blocked: don't count
    function set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } }
    function today() { var d = new Date(); return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate(); }
    function mode() {
      var sa = (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) || navigator.standalone === true;
      return sa ? "installed" : "browser";
    }
    function ping(path) {
      var url = COUNTER_URL + "?p=" + path + "&t=Shipyard%20Calc&r=" + mode() + "&rnd=" + Math.random().toString(36).slice(2, 10);
      try {
        if (window.fetch) {
          fetch(url, { mode: "no-cors", credentials: "omit", referrerPolicy: "no-referrer", cache: "no-store", keepalive: true }).catch(function () { /* silent */ });
        } else {
          var img = new Image(); img.referrerPolicy = "no-referrer"; img.src = url;
        }
      } catch (e) { /* silent */ }
    }
    var sent = false;
    function run() {
      if (sent || !navigator.onLine) return;
      sent = true;
      if (!get("shipyard-count-first")) { set("shipyard-count-first", "1"); ping("/first-open"); }
      var d = today();
      if (get("shipyard-count-day") !== d) { set("shipyard-count-day", d); ping("/app"); }
    }
    function start() { if (navigator.onLine) run(); else window.addEventListener("online", run); }
    // after the page is up, so it never slows the app
    if (document.readyState === "complete") setTimeout(start, 0);
    else window.addEventListener("load", function () { setTimeout(start, 0); });
  })();

  // When a new version takes over, reload once so the new files show right away.
  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    var hadController = !!navigator.serviceWorker.controller, reloaded = false;
    navigator.serviceWorker.addEventListener("controllerchange", function () {
      if (!hadController || reloaded) return; // first install: nothing to refresh
      var key = "shipyard-sw-reload", now = Date.now(), last = 0;
      try { last = Number(sessionStorage.getItem(key) || 0); } catch (e) { /* ignore */ }
      if (now - last < 10000) return; // guard against reload loops
      try { sessionStorage.setItem(key, String(now)); } catch (e) { /* ignore */ }
      reloaded = true;
      location.reload();
    });
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("./sw.js").then(function (reg) {
        if (reg && reg.update) reg.update().catch(function () { /* offline */ });
      }).catch(function () { /* offline cache unavailable */ });
    });
  }
})();
