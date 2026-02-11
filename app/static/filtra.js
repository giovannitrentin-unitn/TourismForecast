// Serve per i filtri
let current_ambito;
let current_timeFilter;
let current_typeFilter;
let current_natFilter;
let current_startDate;
let current_endDate;
let configFilters = null;

// --- FILTER SECTION
// Funzione per aggiornare il chart

/**
 * FUNZIONE PRINCIPALE AGGIORNATA
 * @param {string} ambito - Es: "Val di Fassa"
 * @param {string} timeFilter - 'history', 'forecast', 'both'
 * @param {string} typeFilter - 'Arrivi', 'Partenze', 'both'
 * @param {string} natFilter - 'italiani', 'stranieri', 'both'
 * @param {string} startDate - Formato "YYYY-MM" (es: "2013-01")
 * @param {string} endDate - Formato "YYYY-MM" (es: "2013-03")
 */
function generaGraficoTurismo(
  ambito,
  timeFilter,
  typeFilter,
  natFilter,
  startDate,
  endDate,
) {
  console.log(rawData);
  console.log(ambito);
  console.log(timeFilter);
  console.log(typeFilter);
  console.log(natFilter);
  console.log(startDate);
  console.log(endDate);

  const labelsSet = new Set();
  const datasetsRaw = {
    arrivi_ita: {},
    arrivi_str: {},
    partenze_ita: {},
    partenze_str: {},
  };

  const extractData = (rootKey) => {
    if (!rawData[rootKey]) return;

    // Funzione interna per processare Arrivi o Presenze
    const processCategory = (categoryName, targetStoreIta, targetStoreStr) => {
      if (
        rawData[rootKey][categoryName] &&
        (typeFilter === categoryName || typeFilter === "both")
      ) {
        Object.keys(rawData[rootKey][categoryName]).forEach((date) => {
          // --- NUOVO: LOGICA FILTRO DATE ---
          // Se la data è fuori dal range, la saltiamo
          if (startDate && date < startDate) return;
          if (endDate && date > endDate) return;
          // ---------------------------------

          labelsSet.add(date);
          const item = rawData[rootKey][categoryName][date].find(
            (x) => x.ambito === ambito,
          );

          if (item) {
            if (natFilter === "italiani" || natFilter === "both")
              targetStoreIta[date] =
                (targetStoreIta[date] || 0) + item.italiani;
            if (natFilter === "stranieri" || natFilter === "both")
              targetStoreStr[date] =
                (targetStoreStr[date] || 0) + item.stranieri;
          }
        });
      }
    };

    processCategory("Arrivi", datasetsRaw.arrivi_ita, datasetsRaw.arrivi_str);
    processCategory(
      "Presenze",
      datasetsRaw.partenze_ita,
      datasetsRaw.partenze_str,
    );
  };

  if (timeFilter === "history" || timeFilter === "both") extractData("history");
  if (timeFilter === "forecast" || timeFilter === "both")
    extractData("forecast");

  // Ordina date e crea dataset (Logica standard Chart.js)
  const labels = Array.from(labelsSet).sort();

  const createDataset = (label, dataObj, color, dash = []) => {
    const dataArr = labels.map((date) => dataObj[date] || null);
    if (dataArr.some((x) => x !== null)) {
      return {
        label: label,
        data: dataArr,
        borderColor: color,
        backgroundColor: color,
        borderDash: dash,
        tension: 0.3,
        fill: false,
      };
    }
    return null;
  };

  const finalDatasets = [];

  // Logica composizione datasets (come prima)
  if (natFilter === "italiani" || natFilter === "both") {
    if (typeFilter === "Arrivi" || typeFilter === "both")
      finalDatasets.push(
        createDataset("Arrivi Italiani", datasetsRaw.arrivi_ita, "#36a2eb"),
      );
    if (typeFilter === "Presenze" || typeFilter === "both")
      finalDatasets.push(
        createDataset(
          "Presenze Italiani",
          datasetsRaw.partenze_ita,
          "#4bc0c0",
          [5, 5],
        ),
      );
  }
  if (natFilter === "stranieri" || natFilter === "both") {
    if (typeFilter === "Arrivi" || typeFilter === "both")
      finalDatasets.push(
        createDataset("Arrivi Stranieri", datasetsRaw.arrivi_str, "#ff6384"),
      );
    if (typeFilter === "Presenze" || typeFilter === "both")
      finalDatasets.push(
        createDataset(
          "Presenze Stranieri",
          datasetsRaw.partenze_str,
          "#ff9f40",
          [5, 5],
        ),
      );
  }

  // Render Chart
  const ctx = document.getElementById("mainChart").getContext("2d");
  if (chartInstance) chartInstance.destroy();

  chartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: finalDatasets.filter((d) => d !== null),
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: `Ambito: ${ambito} (${startDate} -> ${endDate})`,
        },
        tooltip: { mode: "index", intersect: false },
      },
      scales: {
        y: { beginAtZero: true },
      },
    },
  });
}

// --- CORREZIONE setDefaultFilter ---
function setDefaultFilter() {
  if (!configFilters) return;

  current_ambito = configFilters.filters.ambito_mensile[0];
  current_timeFilter = "both";
  current_typeFilter = "both";
  current_natFilter = "both";

  // Gestione date: trasforma YYYY-MM in YYYY-MM-01 se necessario
  const formattaData = (dataStr) => {
    if (!dataStr) return "";
    // Se la stringa ha solo 7 caratteri (es. 2013-01), aggiungiamo -01
    return dataStr.length === 7 ? `${dataStr}-01` : dataStr;
  };

  current_startDate = formattaData(configFilters.filters.periodo_dati[0]);
  current_endDate = formattaData(configFilters.filters.periodo_dati[1]);
}

function aggiornaGrafico() {
  generaGraficoTurismo(
    current_ambito,
    current_timeFilter,
    current_typeFilter,
    current_natFilter,
    current_startDate,
    current_endDate,
  );
}

function aggiornaTimeFilter(currentTime) {
  const btnHystory = document.getElementById("btnHistory");
  const btnForecast = document.getElementById("btnForecast");
  const btnAll = document.getElementById("btnAll");
  if (currentTime === "history") {
    btnForecast.classList.remove("active");
    btnAll.classList.remove("active");
    btnHystory.classList.add("active");
  } else if (currentTime === "forecast") {
    btnForecast.classList.add("active");
    btnAll.classList.remove("active");
    btnHystory.classList.remove("active");
  } else if (currentTime === "both") {
    btnForecast.classList.remove("active");
    btnAll.classList.add("active");
    btnHystory.classList.remove("active");
  }
  if (
    currentTime === "history" ||
    currentTime === "forecast" ||
    currentTime === "both"
  ) {
    current_timeFilter = currentTime;
    aggiornaGrafico();
  }
}

// --- NUOVA FUNZIONE DI SINCRONIZZAZIONE ---
// Questa funzione legge i valori dalla UI, aggiorna le variabili globali e lancia il grafico
function updateChart() {
  // 1. Aggiorna Ambito
  current_ambito = document.getElementById("selAmbito").value;

  // 2. Aggiorna Target (Nazionalità)
  const targetChecks = document.querySelectorAll("#targetGroup input:checked");
  const targetVals = Array.from(targetChecks).map((c) => c.value);
  if (targetVals.length === 2) current_natFilter = "both";
  else if (targetVals.length === 1) current_natFilter = targetVals[0];
  else current_natFilter = "none"; // Gestione caso nessun check

  // 3. Aggiorna Metrica (Tipologia: Arrivi/Partenze)
  const metricaChecks = document.querySelectorAll(
    "#metricaGroup input:checked",
  );
  const metricaVals = Array.from(metricaChecks).map((c) => c.value);
  if (metricaVals.length === 2) current_typeFilter = "both";
  else if (metricaVals.length === 1) {
    // Mapping per corrispondere alla logica di generaGraficoTurismo (Capitalized)
    current_typeFilter =
      metricaVals[0].charAt(0).toUpperCase() + metricaVals[0].slice(1);
  } else current_typeFilter = "none";

  // 4. Aggiorna Date
  const sY = document.getElementById("startYear").value;
  const sM = document.getElementById("startMonth").value;
  const eY = document.getElementById("endYear").value;
  const eM = document.getElementById("endMonth").value;

  current_startDate = `${sY}-${sM}-01`;
  current_endDate = `${eY}-${eM}-01`;

  // Chiamata alla funzione di renderizzazione
  aggiornaGrafico();
}

// --- UI RENDERING AGGIORNATO ---
function renderFilters() {
  const container = document.getElementById("filtersContainer");
  container.innerHTML = ""; // Pulisce il container prima di renderizzare

  // 1. AMBITO (Select)
  const secAmbito = createFilterSection("Ambito Turistico");
  const select = document.createElement("select");
  select.className = "select-box";
  select.id = "selAmbito";
  select.onchange = updateChart;

  configFilters.filters.ambito_mensile.forEach((opt) => {
    const o = document.createElement("option");
    o.value = opt;
    o.text = opt;
    o.selected = opt === current_ambito;
    select.appendChild(o);
  });
  secAmbito.appendChild(select);
  container.appendChild(secAmbito);

  // 2. TARGET (Checkbox)
  const secTarget = createFilterSection("Target");
  const grpTarget = document.createElement("div");
  grpTarget.id = "targetGroup";
  grpTarget.className = "checkbox-group";

  ["Italiani", "Stranieri"].forEach((t) => {
    const val = t.toLowerCase();
    // Check se deve essere selezionato in base a current_natFilter
    const isChecked = current_natFilter === "both" || current_natFilter === val;
    grpTarget.appendChild(createCheckbox(t, val, isChecked));
  });
  secTarget.appendChild(grpTarget);
  container.appendChild(secTarget);

  // 3. METRICA (Checkbox)
  const secMetrica = createFilterSection("Metrica");
  const grpMetrica = document.createElement("div");
  grpMetrica.id = "metricaGroup";
  grpMetrica.className = "checkbox-group";

  configFilters.filters.metrica.forEach((m) => {
    const val = m.toLowerCase();
    const isChecked =
      current_typeFilter === "both" || current_typeFilter.toLowerCase() === val;
    grpMetrica.appendChild(createCheckbox(m, val, isChecked));
  });
  secMetrica.appendChild(grpMetrica);
  container.appendChild(secMetrica);

  // 4. PERIODO (Date Inputs)
  const secPeriodo = createFilterSection("Periodo (Mese/Anno)");

  // Estraiamo anno e mese dalle variabili correnti per settare i default nei select
  const startParts = current_startDate.split("-");
  const endParts = current_endDate.split("-");

  const rowStart = document.createElement("div");
  rowStart.className = "period-row";
  rowStart.innerHTML = `<span class="period-label">Dal</span> 
                <select id="startMonth" class="select-box">${getMonthOptions(parseInt(startParts[1]) - 1)}</select>
                <select id="startYear" class="select-box">${getYearOptions(parseInt(startParts[0]))}</select>`;

  const rowEnd = document.createElement("div");
  rowEnd.className = "period-row";
  rowEnd.style.marginTop = "8px";
  rowEnd.innerHTML = `<span class="period-label">Al</span> 
                <select id="endMonth" class="select-box">${getMonthOptions(parseInt(endParts[1]) - 1)}</select>
                <select id="endYear" class="select-box">${getYearOptions(parseInt(endParts[0]))}</select>`;

  secPeriodo.appendChild(rowStart);
  secPeriodo.appendChild(rowEnd);
  container.appendChild(secPeriodo);

  // Listeners per le date
  ["startMonth", "startYear", "endMonth", "endYear"].forEach((id) => {
    document.getElementById(id).addEventListener("change", updateChart);
  });
}
function createFilterSection(title) {
  const div = document.createElement("div");
  div.className = "filter-section";
  div.innerHTML = `<div class="filter-title">${title}</div>`;
  return div;
}

function createCheckbox(label, value, checked) {
  const lbl = document.createElement("label");
  lbl.className = "checkbox-item";
  lbl.innerHTML = `<input type="checkbox" value="${value}" ${checked ? "checked" : ""} onchange="updateChart()"> ${label}`;
  return lbl;
}

function getYearOptions(selected = 2013) {
  let opts = "";
  for (let y = 2013; y <= 2100; y++) {
    // Allow future for forecast
    opts += `<option value="${y}" ${y === selected ? "selected" : ""}>${y}</option>`;
  }
  return opts;
}

function getMonthOptions(selectedIdx = 0) {
  const mNames = [
    "Gen",
    "Feb",
    "Mar",
    "Apr",
    "Mag",
    "Giu",
    "Lug",
    "Ago",
    "Set",
    "Ott",
    "Nov",
    "Dic",
  ];
  let opts = "";
  mNames.forEach((m, i) => {
    const val = (i + 1).toString().padStart(2, "0");
    opts += `<option value="${val}" ${i === selectedIdx ? "selected" : ""}>${m}</option>`;
  });
  return opts;
}
