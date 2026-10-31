/* Shipyard Calc - words in English and Spanish. Numbers, fractions and the "." stay the same in both. */
(function (root) {
  "use strict";
  var EN = {
    share: "Share", toLight: "Switch to light", toDark: "Switch to dark", close: "Close",
    shareTitle: "Scan to get Shipyard Calc", qrAlt: "QR code for {u}", copy: "Copy link", send: "Send link",
    copied: "Copied ✓", copyFail: "Press and hold the link to copy",
    ovHint: "Point their phone camera at the code. No phone numbers needed.",
    ovPriv: "Counts anonymous opens only. No personal info.",
    shareText: "Shipyard Calc - tape fractions, metric to imperial, plate weight:",
    tabFrac: "Tape Fractions", tabConv: "Metric ⇄ Imperial", tabPlate: "Plate Weight",
    fracH: "Tape-Measure Fractions", fStart: "Type a number, then tap a fraction",
    fHow: "Type the whole number, then tap its fraction: 25 then ½ is 25 ½. Or type a decimal like 12.83 to get the nearest tape mark. Tap ft ' after a number for feet, like 3 ft ' 4 ½. ⌫ takes back only the last thing you pressed. After =, tap an operator to keep going from the answer.",
    kDot: "Decimal point", kClear: "Clear all", kBack: "Backspace", kFt: "ft '", kFtAria: "Feet", fracAria: "{f} inch", k16: "More sixteenths",
    div0: "Can't divide by 0", ftIn: "Feet & inches", decMm: "Decimal · mm",
    exactMark: "Exact tape mark", nearest: "Nearest 1/16\" ",
    hint1: "25 then ½ = 25 ½ · 3 ft ' 4 = 3' 4\"", hint2: "Decimals too: 12.83 → nearest 1/16\"",
    recent: "Recent", recentFrac: "Recent math", recentConv: "Recent conversions", recentPlate: "Recent plates", from: "from ", clearList: "Clear list",
    cHeadImp: "Metric → Inches & Feet", cHeadMet: "Feet & Inches → Metric", dirImp: "Metric → Imperial", dirMet: "Imperial → Metric",
    measIn: "Measurement in {u}", typeU: "Type {u}", feet: "Feet", inchesOr: "Inches (or \"5 3/8\")", plusFrac: "Plus fraction", none: "none",
    ftInNear: "Feet & inches (nearest 1/16\")", inFrac: "Inches with fraction", decIn: "Decimal inches", decFt: "Decimal feet",
    numOnly: "Numbers only, like 1250 or 12.5", mmL: "Millimeters", cmL: "Centimeters", mL: "Meters",
    tryFt: "Try feet like 3, inches like 5 3/8 or 5.375", swap: "⇄ Swap direction", clear: "Clear",
    cHow: "1 inch = 25.4 mm exactly. Fractions round to the nearest 1/16\" and the note shows how far that rounding moved it.",
    plateH: "Plate Weight", lwIn: "Length & width in", uFt: "feet", uIn: "inches", length: "Length", width: "Width",
    phFt: "ft", phIn: "in", lenU: "Length ({u})", widU: "Width ({u})", thkIn: "Thickness in", thkMm: "Thickness (mm)", thkInch: "Thickness (inches)",
    eg14: "e.g. 14", egHalf: "e.g. 1/2", qty: "How many", material: "Material",
    matMild: "Mild steel (490 lb/ft³)", matStain: "Stainless (500 lb/ft³)", matAlum: "Aluminum (169 lb/ft³)",
    nmMild: "steel", nmStain: "stainless", nmAlum: "aluminum",
    tot: "Total weight", totN: "Total weight ({n} pieces)", tons: "{t} tons (2,000 lb)", metric: "Metric", each: "Each piece",
    area: "Plate area · weight per sq ft",
    safety: "Estimate for flat plate only. Always confirm the lift weight and rigging with your rigging plan or lift supervisor.",
    pHow: "Weight = length × width × thickness × density (mild steel 490 lb/ft³, 7850 kg/m³). Pounds use the lb/ft³ figure and kilograms use the kg/m³ figure.",
    homeH: "Put it on your home screen",
    homeIos: "<b>iPhone (Safari):</b> tap the Share button (square with an up arrow), then <b>Add to Home Screen</b>.",
    homeAnd: "<b>Android (Chrome):</b> tap the <b>⋮</b> menu, then <b>Install app</b> or <b>Add to Home screen</b>.",
    homeOff: "Works offline once it's opened. Your math and history stay on this phone.",
    fromExact: "from exact", exact: "exact",
    desc: "Tape-measure fractions, metric to imperial, and steel plate weight for the shipyard.",
    instRegion: "Install", instBtn: "Install app", instHide: "Hide install tip",
    instIos: "Install: tap Share {icon} then Add to Home Screen",
    instIosOther: "To install, open this page in Safari",
    instAnd: "Install: tap the ⋮ menu, then Install app or Add to Home screen",
    instInApp: "To install, open in Chrome: tap ⋮ then Open in Chrome or Open in browser"
  };
  var ES = {
    share: "Compartir", toLight: "Cambiar a claro", toDark: "Cambiar a oscuro", close: "Cerrar",
    shareTitle: "Escanea para obtener Shipyard Calc", qrAlt: "Código QR de {u}", copy: "Copiar enlace", send: "Enviar enlace",
    copied: "Copiado ✓", copyFail: "Mantén presionado el enlace para copiarlo",
    ovHint: "Que apunten la cámara del teléfono al código. No hace falta dar números de teléfono.",
    ovPriv: "Solo cuenta aperturas anónimas. Sin información personal.",
    shareText: "Shipyard Calc - fracciones de cinta, métrico a pulgadas, peso de placa:",
    tabFrac: "Fracciones de Cinta", tabConv: "Métrico ⇄ Pulgadas", tabPlate: "Peso de Placa",
    fracH: "Fracciones de Cinta Métrica", fStart: "Escribe un número y toca una fracción",
    fHow: "Escribe el número entero y luego toca su fracción: 25 y luego ½ es 25 ½. O escribe un decimal como 12.83 para ver la marca de cinta más cercana. Toca pies ' después de un número para pies, como 3 pies ' 4 ½. ⌫ borra solo lo último que tocaste. Después de =, toca una operación para seguir desde el resultado.",
    kDot: "Punto decimal", kClear: "Borrar todo", kBack: "Borrar último", kFt: "pies '", kFtAria: "Pies", fracAria: "{f} de pulgada", k16: "Más dieciseisavos",
    div0: "No se puede dividir entre 0", ftIn: "Pies y pulgadas", decMm: "Decimal · mm",
    exactMark: "Marca exacta de cinta", nearest: "1/16\" más cercano ",
    hint1: "25 y luego ½ = 25 ½ · 3 pies ' 4 = 3' 4\"", hint2: "También decimales: 12.83 → 1/16\" más cercano",
    recent: "Recientes", recentFrac: "Cálculos recientes", recentConv: "Conversiones recientes", recentPlate: "Placas recientes", from: "de ", clearList: "Borrar lista",
    cHeadImp: "Métrico → Pulgadas y Pies", cHeadMet: "Pies y Pulgadas → Métrico", dirImp: "Métrico → Pulgadas", dirMet: "Pulgadas → Métrico",
    measIn: "Medida en {u}", typeU: "Escribe {u}", feet: "Pies", inchesOr: "Pulgadas (o \"5 3/8\")", plusFrac: "Más fracción", none: "ninguna",
    ftInNear: "Pies y pulgadas (1/16\" más cercano)", inFrac: "Pulgadas con fracción", decIn: "Pulgadas decimales", decFt: "Pies decimales",
    numOnly: "Solo números, como 1250 o 12.5", mmL: "Milímetros", cmL: "Centímetros", mL: "Metros",
    tryFt: "Prueba pies como 3, pulgadas como 5 3/8 o 5.375", swap: "⇄ Invertir", clear: "Borrar",
    cHow: "1 pulgada = 25.4 mm exactos. Las fracciones se redondean al 1/16\" más cercano y la nota muestra cuánto cambió con el redondeo.",
    plateH: "Peso de Placa", lwIn: "Largo y ancho en", uFt: "pies", uIn: "pulgadas", length: "Largo", width: "Ancho",
    phFt: "pies", phIn: "pulg", lenU: "Largo ({u})", widU: "Ancho ({u})", thkIn: "Espesor en", thkMm: "Espesor (mm)", thkInch: "Espesor (pulgadas)",
    eg14: "ej. 14", egHalf: "ej. 1/2", qty: "Cantidad", material: "Material",
    matMild: "Acero dulce (490 lb/ft³)", matStain: "Acero inoxidable (500 lb/ft³)", matAlum: "Aluminio (169 lb/ft³)",
    nmMild: "acero", nmStain: "inoxidable", nmAlum: "aluminio",
    tot: "Peso total", totN: "Peso total ({n} piezas)", tons: "{t} toneladas cortas (2,000 lb)", metric: "Métrico", each: "Cada pieza",
    area: "Área de placa · peso por pie²",
    safety: "Es un estimado solo para placa plana. Siempre confirma el peso del izaje y el aparejo con tu plan de izaje o con el supervisor de izaje.",
    pHow: "Peso = largo × ancho × espesor × densidad (acero dulce 490 lb/ft³, 7850 kg/m³). Las libras usan el valor en lb/ft³ y los kilogramos el valor en kg/m³.",
    homeH: "Ponla en tu pantalla de inicio",
    homeIos: "<b>iPhone (Safari):</b> toca el botón Compartir (cuadro con flecha hacia arriba) y luego <b>Agregar a inicio</b>.",
    homeAnd: "<b>Android (Chrome):</b> toca el menú <b>⋮</b> y luego <b>Instalar aplicación</b> o <b>Agregar a la pantalla principal</b>.",
    homeOff: "Funciona sin internet una vez abierta. Tus cálculos e historial se quedan en este teléfono.",
    fromExact: "del exacto", exact: "exacto",
    desc: "Fracciones de cinta, métrico a pulgadas y peso de placa de acero para el astillero.",
    instRegion: "Instalar", instBtn: "Instalar app", instHide: "Ocultar aviso de instalación",
    instIos: "Instalar: toca Compartir {icon} y luego Agregar a inicio",
    instIosOther: "Para instalar, abre esta página en Safari",
    instAnd: "Instalar: toca el menú ⋮ y luego Instalar aplicación o Agregar a la pantalla principal",
    instInApp: "Para instalar, ábrela en Chrome: toca ⋮ y luego Abrir en Chrome o Abrir en el navegador"
  };
  function pick() {
    var list = (navigator.languages && navigator.languages.length) ? navigator.languages : [navigator.language || "en"];
    return String(list[0] || "en").toLowerCase().indexOf("es") === 0 ? "es" : "en";
  }
  var lang = pick(), D = lang === "es" ? ES : EN;
  function T(key, vars) {
    var s = D[key] !== undefined ? D[key] : EN[key];
    if (s === undefined) return key;
    if (vars) for (var k in vars) s = s.split("{" + k + "}").join(vars[k]);
    return s;
  }
  // fill the static page: data-i18n (text), data-i18n-html (trusted text with <b>), data-i18n-ph (placeholder), data-i18n-aria
  function apply(doc) {
    doc.documentElement.setAttribute("lang", lang);
    var meta = doc.querySelector('meta[name="description"]'); if (meta) meta.setAttribute("content", T("desc"));
    var each = function (sel, fn) { Array.prototype.forEach.call(doc.querySelectorAll(sel), fn); };
    each("[data-i18n]", function (e) { e.textContent = T(e.getAttribute("data-i18n")); });
    each("[data-i18n-html]", function (e) { e.innerHTML = T(e.getAttribute("data-i18n-html")); });
    each("[data-i18n-ph]", function (e) { e.setAttribute("placeholder", T(e.getAttribute("data-i18n-ph"))); });
    each("[data-i18n-aria]", function (e) { e.setAttribute("aria-label", T(e.getAttribute("data-i18n-aria"))); });
  }
  root.I18N = { lang: lang, T: T, apply: apply, EN: EN, ES: ES };
})(typeof self !== "undefined" ? self : this);
