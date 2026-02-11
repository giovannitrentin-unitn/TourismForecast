// Serve per la generazione
let currentPeriodType = "year";
const MIN_YEAR = 2013;
const MAX_YEAR = 2024;
const MIN_MONTH = 1;
const MAX_MONTH = 12;
// --- GENERATION SECTION ---
function generateForecast() {
  const predictionLength = parseInt(
    document.getElementById("predictionLength").value,
  );

  const predictionPrecision = parseInt(
    document.getElementById("predictionPrecision").value,
  );

  // Ambito mensile selezionato
  const ambito = Array.from(
    document.querySelectorAll(".ambito-item:checked"),
  ).map((el) => el.value);

  const metrica = Array.from(
    document.querySelectorAll(".metrica-item:checked"),
  ).map((el) => el.value);

  payload = {
    filters: {
      prediction_length: predictionLength,
      prediction_precision: predictionPrecision,
      ambito_mensile: ambito,
      metrica: metrica,
      periodo_dati: getPeriodoSelezionato(),
      periodo_previsione: getPeriodType(),
    },
  };

  // Richiesta di generazione
  fetch("/genera_previsioni", {
    method: "POST",
    headers: {
      "Content-Type": "application/json", // Indica che stiamo inviando JSON
    },
    body: JSON.stringify(payload), // Converte l'oggetto JS in JSON
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Errore nella richiesta: " + response.status);
      }
      return response.json(); // Convertiamo la risposta in JSON
    })
    .then((data) => {
      rawData = data;
      fetch("/get_filters", {
        method: "GET",
        headers: {
          "Content-Type": "application/json", // Indica che stiamo inviando JSON
        },
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Errore nella richiesta: " + response.status);
          }
          return response.json();
        })
        .then((data) => {
          configFilters = data;
          setDefaultFilter();
          aggiornaGrafico();
        });
    })
    .catch((error) => {
      console.error("Errore:", error);
    });
}

function getPeriodType() {
  if (currentPeriodType === "year") {
    return "Annuale";
  } else {
    return "Mensile";
  }
}

function enforceAtLeastOne(groupClass) {
  const checkboxes = document.querySelectorAll("." + groupClass);

  checkboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      const checked = document.querySelectorAll("." + groupClass + ":checked");

      if (checked.length === 0) {
        checkbox.checked = true; // riattiva l'ultimo deselezionato
      }
    });
  });
}

function initAmbitoMensile() {
  const ambitoItems = document.querySelectorAll(".ambito-item");
  const modeRadios = document.querySelectorAll('input[name="ambitoMode"]');

  if (!ambitoItems.length || !modeRadios.length) return;

  // ---- CLICK RADIO (Tutti / Strutture / Luoghi)
  modeRadios.forEach((radio) => {
    radio.addEventListener("change", () => {
      if (!radio.checked) return;

      const value = radio.value;

      ambitoItems.forEach((item) => {
        if (value === "all") {
          item.checked = true;
        } else if (value === "strutture") {
          item.checked = item.classList.contains("strutture");
        } else if (value === "luoghi") {
          item.checked = item.classList.contains("luoghi");
        }
      });
    });
  });

  // ---- CLICK MANUALE CHECKBOX
  ambitoItems.forEach((item) => {
    item.addEventListener("change", updateAmbitoMode);
  });

  function updateAmbitoMode() {
    const all = Array.from(ambitoItems);
    const checked = all.filter((i) => i.checked);

    const strutture = all.filter((i) => i.classList.contains("strutture"));
    const luoghi = all.filter((i) => i.classList.contains("luoghi"));

    const allChecked = checked.length === all.length;

    const onlyStrutture =
      strutture.every((i) => i.checked) && luoghi.every((i) => !i.checked);

    const onlyLuoghi =
      luoghi.every((i) => i.checked) && strutture.every((i) => !i.checked);

    // Reset radio
    modeRadios.forEach((r) => (r.checked = false));

    if (allChecked) {
      document.querySelector('input[value="all"]').checked = true;
    } else if (onlyStrutture) {
      document.querySelector('input[value="strutture"]').checked = true;
    } else if (onlyLuoghi) {
      document.querySelector('input[value="luoghi"]').checked = true;
    }
    // Se misto → restano tutti vuoti
  }
}

function initGenerationValidation() {
  const predictionLength = document.getElementById("predictionLength");
  const predictionPrecision = document.getElementById("predictionPrecision");

  // ---- VALIDAZIONE NUMERI ----
  function clampNumber(input) {
    const min = parseInt(input.min);
    const max = parseInt(input.max);
    let value = parseInt(input.value);

    if (isNaN(value)) value = min;

    if (value < min) value = min;
    if (value > max) value = max;

    input.value = value;
  }

  predictionLength.addEventListener("change", () =>
    clampNumber(predictionLength),
  );

  predictionPrecision.addEventListener("change", () =>
    clampNumber(predictionPrecision),
  );

  clampNumber(predictionLength);
  clampNumber(predictionPrecision);
}

function setPeriodType(type) {
  currentPeriodType = type;
  const btnYear = document.getElementById("btnPeriodYear");
  const btnMonth = document.getElementById("btnPeriodMonth");
  const rowYear = document.getElementById("periodYearRow");
  const rowMonth = document.getElementById("periodMonthRow");

  if (type === "year") {
    btnYear.classList.add("active");
    btnMonth.classList.remove("active");
    rowYear.style.display = "flex";
    rowMonth.style.display = "none";
  } else {
    btnYear.classList.remove("active");
    btnMonth.classList.add("active");
    rowYear.style.display = "none";
    rowMonth.style.display = "flex";
  }
}

function initPeriodoSelector() {
  const startYear = document.getElementById("startYear");
  const endYear = document.getElementById("endYear");

  const startMonthM = document.getElementById("startMonthM");
  const startYearM = document.getElementById("startYearM");
  const endMonthM = document.getElementById("endMonthM");
  const endYearM = document.getElementById("endYearM");

  // -------- POPOLA ANNI --------
  for (let y = MIN_YEAR; y <= MAX_YEAR; y++) {
    startYear.innerHTML += `<option value="${y}">${y}</option>`;
    endYear.innerHTML += `<option value="${y}">${y}</option>`;
    startYearM.innerHTML += `<option value="${y}">${y}</option>`;
    endYearM.innerHTML += `<option value="${y}">${y}</option>`;
  }

  // -------- POPOLA MESI --------
  for (let m = 1; m <= 12; m++) {
    const label = m.toString().padStart(2, "0");
    startMonthM.innerHTML += `<option value="${m}">${label}</option>`;
    endMonthM.innerHTML += `<option value="${m}">${label}</option>`;
  }

  // Default valori
  startYear.value = MIN_YEAR;
  endYear.value = MAX_YEAR;

  startYearM.value = MIN_YEAR;
  endYearM.value = MAX_YEAR;
  startMonthM.value = 1;
  endMonthM.value = 12;

  // Eventi validazione
  startYear.addEventListener("change", validateYearRange);
  endYear.addEventListener("change", validateYearRange);

  startYearM.addEventListener("change", validateMonthRange);
  endYearM.addEventListener("change", validateMonthRange);
  startMonthM.addEventListener("change", validateMonthRange);
  endMonthM.addEventListener("change", validateMonthRange);

  validateYearRange();
  validateMonthRange();
}

function validateYearRange() {
  const startYear = document.getElementById("startYear");
  const endYear = document.getElementById("endYear");

  let start = parseInt(startYear.value);
  let end = parseInt(endYear.value);

  if (start < MIN_YEAR) start = MIN_YEAR;
  if (end > MAX_YEAR) end = MAX_YEAR;

  if (start > end) start = end;

  startYear.value = start;
  endYear.value = end;
}

function validateMonthRange() {
  const sY = parseInt(document.getElementById("startYearM").value);
  const eY = parseInt(document.getElementById("endYearM").value);
  const sM = parseInt(document.getElementById("startMonthM").value);
  const eM = parseInt(document.getElementById("endMonthM").value);

  let startDate = new Date(sY, sM - 1);
  let endDate = new Date(eY, eM - 1);

  const minDate = new Date(MIN_YEAR, 0);
  const maxDate = new Date(MAX_YEAR, 11);

  if (startDate < minDate) startDate = minDate;
  if (endDate > maxDate) endDate = maxDate;

  if (startDate > endDate) startDate = endDate;

  // Riassegna valori corretti
  document.getElementById("startYearM").value = startDate.getFullYear();
  document.getElementById("startMonthM").value = startDate.getMonth() + 1;

  document.getElementById("endYearM").value = endDate.getFullYear();
  document.getElementById("endMonthM").value = endDate.getMonth() + 1;
}

function getPeriodoSelezionato() {
  const isYearMode = currentPeriodType === "year" ? true : false;

  if (isYearMode) {
    const start = document.getElementById("startYear").value + "-01";
    const end = document.getElementById("endYear").value + "-01";
    return [start, end];
  } else {
    const sY = document.getElementById("startYearM").value;
    const sM = document.getElementById("startMonthM").value.padStart(2, "0");

    const eY = document.getElementById("endYearM").value;
    const eM = document.getElementById("endMonthM").value.padStart(2, "0");

    let data_inizio = `${sY}-${sM}`;
    let data_fine = `${eY}-${eM}`;

    return [data_inizio, data_fine];
  }
}

function cancellaPrevisione() {
  // Chiama endpoint di cancellazione e poi carica i dati di default
  fetch("/delete_prediction", {
    method: "GET",
    headers: {
      "Content-Type": "application/json", // Indica che stiamo inviando JSON
    },
  }).then((response) => {
    if (!response.ok) {
      throw new Error("Errore nella richiesta: " + response.status);
    } else {
      getData();
    }
  });
}
