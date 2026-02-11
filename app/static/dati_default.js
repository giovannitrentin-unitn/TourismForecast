// --- DATA ---
async function fetchReceivedData(url) {
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.error(
        "Errore nella richiesta:",
        response.status,
        response.statusText,
      );
      return [];
    }

    const data = await response.json();

    if (!data || !data.received) {
      console.warn("Chiave 'received' non trovata nel JSON ricevuto");
      return [];
    }

    return data.received;
  } catch (error) {
    console.error("Errore fetch:", error);
    return [];
  }
}

async function getData() {
  await fetchReceivedData("/get_prediction").then((receivedData) => {
    rawData = receivedData;
  });
  await fetchReceivedData("/get_filters").then((receivedData) => {
    configFilters = receivedData;
  });
}

document.addEventListener("DOMContentLoaded", () => {
  toggleTheme(true);
  getData().then(() => {
    setDefaultFilter();
    renderFilters();
    aggiornaGrafico();
  });
  enforceAtLeastOne("target-item");
  enforceAtLeastOne("metrica-item");
  initAmbitoMensile();
  initGenerationValidation();
  initPeriodoSelector();
});
