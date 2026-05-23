/**
 * GEO Map — Layer Comparison Component
 * RTL Arabic UI with two comparison modes
 */

// ============================================
// Mock data — multi-layer mode (layer keys only)
// ============================================
const multiLayerKeys = ["hotels", "roads", "buildings"];

/** Extended data for "نفس الطبقة" mode only */
const sameLayerData = {
  hotels: {
    browseCriteria: ["حسب المنطقة", "حسب التصنيف", "حسب الحالة"],
    dates: ["2024-01-01", "2024-03-01", "2024-06-01"],
  },
  roads: {
    browseCriteria: ["حسب النوع", "حسب الكثافة"],
    dates: ["2024-02-01", "2024-05-01"],
  },
  buildings: {
    browseCriteria: ["حسب الارتفاع", "حسب الاستخدام"],
    dates: ["2024-01-15", "2024-04-20"],
  },
};

/** Arabic display names for layers */
const layerLabels = {
  hotels: "الفنادق",
  roads: "الطرق",
  buildings: "المباني",
};

/** Simulated network delay when loading dates (ms) */
const DATE_LOAD_DELAY = 450;

/** Simulated delay when loading browse criteria (ms) */
const CRITERIA_LOAD_DELAY = 350;

// ============================================
// Validation messages (Arabic)
// ============================================
const messages = {
  required: "هذا الحقل مطلوب",
  sameDate: "يجب اختيار تاريخين مختلفين",
};

// ============================================
// DOM references
// ============================================
const modeTabs = document.querySelectorAll(".mode-tab");
const formMulti = document.getElementById("form-multi");
const formSame = document.getElementById("form-same");
const btnSubmit = document.getElementById("btn-submit");
const btnCancel = document.getElementById("btn-cancel");
const btnClose = document.querySelector(".panel-close");

/** Current active mode: "multi" | "same" */
let activeMode = "multi";

/** Whether user attempted submit (show errors) */
let showValidation = false;

// ============================================
// Utilities
// ============================================

/**
 * Format ISO date string for Arabic display
 * @param {string} isoDate - e.g. "2024-01-01"
 * @returns {string}
 */
function formatDateArabic(isoDate) {
  const [year, month, day] = isoDate.split("-");
  const months = [
    "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
    "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
  ];
  const m = parseInt(month, 10) - 1;
  return `${parseInt(day, 10)} ${months[m]} ${year}`;
}

/**
 * Populate a select with placeholder + options
 * @param {HTMLSelectElement} select
 * @param {Array<{value: string, label: string}>} options
 * @param {string} placeholder
 */
function fillSelect(select, options, placeholder = "— اختر —") {
  select.innerHTML = "";
  const empty = document.createElement("option");
  empty.value = "";
  empty.textContent = placeholder;
  select.appendChild(empty);

  options.forEach(({ value, label }) => {
    const opt = document.createElement("option");
    opt.value = value;
    opt.textContent = label;
    select.appendChild(opt);
  });
}

/**
 * Initialize all layer dropdowns from layersData
 */
function initLayerSelects() {
  const layerOptions = multiLayerKeys.map((key) => ({
    value: key,
    label: layerLabels[key] || key,
  }));

  document.querySelectorAll("[data-layer-select]").forEach((select) => {
    fillSelect(select, layerOptions, "— اختر طبقة —");
  });

  const sameLayerOptions = Object.keys(sameLayerData).map((key) => ({
    value: key,
    label: layerLabels[key] || key,
  }));
  const sameLayerSelect = document.getElementById("same-layer");
  if (sameLayerSelect) {
    fillSelect(sameLayerSelect, sameLayerOptions, "— اختر طبقة —");
  }
}

/**
 * Reset date select to empty/disabled state
 * @param {HTMLSelectElement} dateSelect
 */
function resetDateSelect(dateSelect) {
  const wrap = dateSelect.closest(".select-wrap");
  fillSelect(dateSelect, [], "— اختر تاريخاً —");
  dateSelect.value = "";
  dateSelect.disabled = true;
  if (wrap) wrap.classList.remove("is-loading");
}

/**
 * Simulate async browse-criteria fetch (same-layer mode)
 * @param {string} layerKey
 * @returns {Promise<string[]>}
 */
function fetchBrowseCriteriaForLayer(layerKey) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const entry = sameLayerData[layerKey];
      resolve(entry?.browseCriteria ? [...entry.browseCriteria] : []);
    }, CRITERIA_LOAD_DELAY);
  });
}

/**
 * Get dates for same-layer mode from sameLayerData
 * @param {string} layerKey
 * @returns {Promise<string[]>}
 */
function fetchSameLayerDates(layerKey) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const entry = sameLayerData[layerKey];
      resolve(entry?.dates ? [...entry.dates] : []);
    }, DATE_LOAD_DELAY);
  });
}

/**
 * Reset browse-criteria select (same-layer mode)
 * @param {HTMLSelectElement} criteriaSelect
 */
function resetBrowseCriteriaSelect(criteriaSelect) {
  const wrap = criteriaSelect.closest(".select-wrap");
  fillSelect(criteriaSelect, [], "— اختر معياراً —");
  criteriaSelect.value = "";
  criteriaSelect.disabled = true;
  if (wrap) wrap.classList.remove("is-loading");
}

/**
 * Load browse criteria into select with loading UI
 * @param {HTMLSelectElement} criteriaSelect
 * @param {string} layerKey
 */
async function loadBrowseCriteriaIntoSelect(criteriaSelect, layerKey) {
  const wrap = criteriaSelect.closest(".select-wrap");
  criteriaSelect.disabled = true;
  if (wrap) wrap.classList.add("is-loading");

  const criteria = await fetchBrowseCriteriaForLayer(layerKey);
  const options = criteria.map((c) => ({ value: c, label: c }));

  fillSelect(criteriaSelect, options, "— اختر معياراً —");
  criteriaSelect.disabled = false;
  if (wrap) wrap.classList.remove("is-loading");
}

/**
 * Load dates for same-layer mode (requires layer + criteria selected)
 * @param {HTMLSelectElement} dateSelect
 * @param {string} layerKey
 * @param {string[]} [excludeValues]
 */
async function loadSameLayerDatesIntoSelect(dateSelect, layerKey, excludeValues = []) {
  const wrap = dateSelect.closest(".select-wrap");
  dateSelect.disabled = true;
  if (wrap) wrap.classList.add("is-loading");

  const dates = await fetchSameLayerDates(layerKey);
  const options = dates
    .filter((d) => !excludeValues.includes(d))
    .map((d) => ({ value: d, label: formatDateArabic(d) }));

  fillSelect(dateSelect, options, "— اختر تاريخاً —");
  dateSelect.disabled = false;
  if (wrap) wrap.classList.remove("is-loading");
}

/**
 * Show/hide browse-criteria row with reveal animation
 * @param {boolean} show
 */
function toggleCriteriaRow(show) {
  const row = document.getElementById("same-criteria-row");
  if (!row) return;

  if (show) {
    row.hidden = false;
    requestAnimationFrame(() => row.classList.add("is-visible"));
  } else {
    row.classList.remove("is-visible");
    row.hidden = true;
  }
}

/**
 * Get selected direction from a form
 * @param {HTMLFormElement} form
 * @param {string} radioName
 * @returns {"vertical"|"horizontal"|""}
 */
function getDirection(form, radioName) {
  const checked = form.querySelector(`input[name="${radioName}"]:checked`);
  return checked ? checked.value : "";
}

/**
 * Show/hide inline error for a field
 * @param {string} errorId
 * @param {string} message
 */
function setFieldError(errorId, message) {
  const el = document.getElementById(errorId);
  const selectId = errorId.replace("error-", "");
  const select = document.getElementById(selectId);

  if (!el) return;

  if (message) {
    el.textContent = message;
    el.classList.add("is-visible");
    if (select) select.classList.add("is-invalid");
  } else {
    el.textContent = "";
    el.classList.remove("is-visible");
    if (select) select.classList.remove("is-invalid");
  }
}

/**
 * Clear all errors in a form
 * @param {HTMLFormElement} form
 */
function clearFormErrors(form) {
  form.querySelectorAll(".field-error").forEach((el) => {
    el.textContent = "";
    el.classList.remove("is-visible");
  });
  form.querySelectorAll(".select.is-invalid").forEach((s) => {
    s.classList.remove("is-invalid");
  });
}

// ============================================
// Validation
// ============================================

/**
 * Validate multi-layer form
 * @returns {{ valid: boolean, errors: Record<string, string>, data?: object }}
 */
function validateMultiForm() {
  const layer1 = document.getElementById("multi-layer1").value;
  const layer2 = document.getElementById("multi-layer2").value;
  const direction = getDirection(formMulti, "multi-direction");

  const errors = {};

  if (!layer1) errors["error-multi-layer1"] = messages.required;
  if (!layer2) errors["error-multi-layer2"] = messages.required;

  const valid = Object.keys(errors).length === 0 && !!direction;

  return {
    valid,
    errors,
    data: valid
      ? {
          mode: "multi",
          layer1,
          layer2,
          direction,
        }
      : undefined,
  };
}

/**
 * Validate same-layer form
 * @returns {{ valid: boolean, errors: Record<string, string>, data?: object }}
 */
function validateSameForm() {
  const layer = document.getElementById("same-layer").value;
  const browseCriteria = document.getElementById("same-browse-criteria").value;
  const firstDate = document.getElementById("same-date1").value;
  const secondDate = document.getElementById("same-date2").value;
  const direction = getDirection(formSame, "same-direction");

  const errors = {};

  if (!layer) errors["error-same-layer"] = messages.required;
  if (!browseCriteria) errors["error-same-browse-criteria"] = messages.required;
  if (!firstDate) errors["error-same-date1"] = messages.required;
  if (!secondDate) errors["error-same-date2"] = messages.required;

  if (firstDate && secondDate && firstDate === secondDate) {
    errors["error-same-date2"] = messages.sameDate;
  }

  const valid = Object.keys(errors).length === 0 && !!direction;

  return {
    valid,
    errors,
    data: valid
      ? {
          mode: "same",
          layer,
          browseCriteria,
          firstDate,
          secondDate,
          direction,
        }
      : undefined,
  };
}

/**
 * Run validation for active mode (silent = no UI errors)
 * @param {boolean} silent
 */
function runValidation(silent = false) {
  const result =
    activeMode === "multi" ? validateMultiForm() : validateSameForm();

  if (!silent && showValidation) {
    const form = activeMode === "multi" ? formMulti : formSame;
    clearFormErrors(form);
    Object.entries(result.errors).forEach(([id, msg]) => {
      setFieldError(id, msg);
    });
  }

  btnSubmit.disabled = !result.valid;
  return result;
}

// ============================================
// Mode switching
// ============================================

/**
 * Switch between comparison modes with fade animation
 * @param {"multi"|"same"} mode
 */
function switchMode(mode) {
  if (mode === activeMode) return;

  const outgoing = activeMode === "multi" ? formMulti : formSame;
  const incoming = mode === "multi" ? formMulti : formSame;

  activeMode = mode;
  showValidation = false;

  // Update tabs ARIA
  modeTabs.forEach((tab) => {
    const isActive = tab.dataset.mode === mode;
    tab.classList.toggle("is-active", isActive);
    tab.setAttribute("aria-selected", isActive ? "true" : "false");
    tab.tabIndex = isActive ? 0 : -1;
  });

  outgoing.classList.remove("is-visible");
  outgoing.classList.add("is-fading-out");
  outgoing.hidden = false;

  setTimeout(() => {
    outgoing.classList.remove("is-fading-out");
    outgoing.hidden = true;

    incoming.hidden = false;
    incoming.classList.add("is-fading-in");

    requestAnimationFrame(() => {
      incoming.classList.remove("is-fading-in");
      incoming.classList.add("is-visible");
    });

    clearFormErrors(incoming);
    runValidation(true);
    incoming.querySelector(".select, input")?.focus();
  }, 220);
}

// ============================================
// Event handlers — Same layer mode
// ============================================

async function onSameLayerChange() {
  const layer = document.getElementById("same-layer").value;
  const criteriaSelect = document.getElementById("same-browse-criteria");
  const date1 = document.getElementById("same-date1");
  const date2 = document.getElementById("same-date2");

  resetBrowseCriteriaSelect(criteriaSelect);
  resetDateSelect(date1);
  resetDateSelect(date2);
  toggleCriteriaRow(false);

  if (layer) {
    toggleCriteriaRow(true);
    await loadBrowseCriteriaIntoSelect(criteriaSelect, layer);
  }

  runValidation(true);
}

/**
 * After browse criteria selected — enable and load dates
 */
async function onSameBrowseCriteriaChange() {
  const layer = document.getElementById("same-layer").value;
  const criteria = document.getElementById("same-browse-criteria").value;
  const date1 = document.getElementById("same-date1");
  const date2 = document.getElementById("same-date2");

  resetDateSelect(date1);
  resetDateSelect(date2);

  if (layer && criteria) {
    await Promise.all([
      loadSameLayerDatesIntoSelect(date1, layer),
      loadSameLayerDatesIntoSelect(date2, layer),
    ]);
  }

  runValidation(true);
}

/**
 * When date1 changes, refresh date2 options excluding date1
 */
async function onSameDate1Change() {
  const layer = document.getElementById("same-layer").value;
  const criteria = document.getElementById("same-browse-criteria").value;
  const date1 = document.getElementById("same-date1").value;
  const date2 = document.getElementById("same-date2");

  if (!layer || !criteria) return;

  const prevDate2 = date2.value;
  await loadSameLayerDatesIntoSelect(date2, layer, date1 ? [date1] : []);

  // Restore date2 if still valid and different
  if (prevDate2 && prevDate2 !== date1) {
    const opt = [...date2.options].find((o) => o.value === prevDate2);
    if (opt) date2.value = prevDate2;
  }

  runValidation(true);
}

/**
 * When date2 changes, refresh date1 options excluding date2
 */
async function onSameDate2Change() {
  const layer = document.getElementById("same-layer").value;
  const criteria = document.getElementById("same-browse-criteria").value;
  const date2 = document.getElementById("same-date2").value;
  const date1 = document.getElementById("same-date1");

  if (!layer || !criteria) return;

  const prevDate1 = date1.value;
  await loadSameLayerDatesIntoSelect(date1, layer, date2 ? [date2] : []);

  if (prevDate1 && prevDate1 !== date2) {
    const opt = [...date1.options].find((o) => o.value === prevDate1);
    if (opt) date1.value = prevDate1;
  }

  runValidation(true);
}

// ============================================
// Submit & reset
// ============================================

function handleSubmit() {
  showValidation = true;
  const result = runValidation(false);

  if (!result.valid) return;

  console.log("مقارنة الطبقات — النتيجة:", result.data);
}

function resetActiveForm() {
  const form = activeMode === "multi" ? formMulti : formSame;
  form.reset();

  form.querySelectorAll("[data-date-select]").forEach(resetDateSelect);

  if (activeMode === "same") {
    const criteriaSelect = document.getElementById("same-browse-criteria");
    if (criteriaSelect) resetBrowseCriteriaSelect(criteriaSelect);
    toggleCriteriaRow(false);
  }

  // Restore default direction
  const dirName = activeMode === "multi" ? "multi-direction" : "same-direction";
  const vertical = form.querySelector(`input[name="${dirName}"][value="vertical"]`);
  if (vertical) vertical.checked = true;

  showValidation = false;
  clearFormErrors(form);
  runValidation(true);
}

// ============================================
// Keyboard navigation for tabs
// ============================================

function onTabKeydown(e) {
  const tabs = [...modeTabs];
  const currentIndex = tabs.findIndex((t) => t.classList.contains("is-active"));

  if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
    e.preventDefault();
    // RTL: ArrowRight = previous tab, ArrowLeft = next
    const delta = e.key === "ArrowRight" ? -1 : 1;
    let next = (currentIndex + delta + tabs.length) % tabs.length;
    tabs[next].focus();
    switchMode(tabs[next].dataset.mode);
  }

  if (e.key === "Home") {
    e.preventDefault();
    tabs[0].focus();
    switchMode("multi");
  }

  if (e.key === "End") {
    e.preventDefault();
    tabs[tabs.length - 1].focus();
    switchMode("same");
  }
}

// ============================================
// Bind events
// ============================================

function bindEvents() {
  modeTabs.forEach((tab) => {
    tab.addEventListener("click", () => switchMode(tab.dataset.mode));
    tab.addEventListener("keydown", onTabKeydown);
  });

  document.getElementById("multi-layer1").addEventListener("change", () => runValidation(true));
  document.getElementById("multi-layer2").addEventListener("change", () => runValidation(true));

  formMulti.querySelectorAll('input[name="multi-direction"]').forEach((r) => {
    r.addEventListener("change", () => runValidation(true));
  });

  document.getElementById("same-layer").addEventListener("change", onSameLayerChange);
  document.getElementById("same-browse-criteria").addEventListener("change", onSameBrowseCriteriaChange);
  document.getElementById("same-date1").addEventListener("change", onSameDate1Change);
  document.getElementById("same-date2").addEventListener("change", onSameDate2Change);

  formSame.querySelectorAll('input[name="same-direction"]').forEach((r) => {
    r.addEventListener("change", () => runValidation(true));
  });

  btnSubmit.addEventListener("click", handleSubmit);
  btnCancel.addEventListener("click", resetActiveForm);
  btnClose?.addEventListener("click", resetActiveForm);
}

// ============================================
// Init
// ============================================

function init() {
  initLayerSelects();
  bindEvents();

  // Tab keyboard: inactive tabs not in tab order
  modeTabs.forEach((tab) => {
    tab.tabIndex = tab.classList.contains("is-active") ? 0 : -1;
  });

  runValidation(true);
}

document.addEventListener("DOMContentLoaded", init);
