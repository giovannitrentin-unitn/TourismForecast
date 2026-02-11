// Serve per il grafico
let rawData = null;
let chartInstance = null;

// --- THEME ENGINE ---
function toggleTheme(restore = false) {
  const html = document.documentElement;
  const switchBtn = document.getElementById("themeSwitch");
  let theme = "";
  if (restore) {
    theme = localStorage.getItem("theme");
  } else {
    const current = html.getAttribute("data-theme");
    theme = current === "dark" ? "light" : "dark";
    localStorage.setItem("theme", theme);
  }
  html.setAttribute("data-theme", theme);
  switchBtn.setAttribute("data-mode", theme);
}

// --- UI LOGIC ---
function toggleSidebar(side = null) {
  const sidebars = {
    leftfilter: {
      element: document.getElementById("sidebarLeftFilter"),
      button: document.getElementById("btnToggleLeftFilter"),
      group: "left",
    },
    leftgenerate: {
      element: document.getElementById("sidebarLeftGenerate"),
      button: document.getElementById("btnToggleLeftGenerate"),
      group: "left",
    },
    right: {
      element: document.getElementById("sidebarRight"),
      button: document.getElementById("btnToggleRight"),
      group: "right",
    },
  };

  const current = sidebars[side];
  if (!current) return;

  // Se è una sidebar di sinistra, chiudo le altre di sinistra
  if (current.group === "left") {
    Object.values(sidebars).forEach((s) => {
      if (s.group === "left" && s !== current) {
        s.element.classList.add("collapsed");
        s.button.classList.remove("active");
      }
    });
  }

  // Toggle della selezionata
  current.element.classList.toggle("collapsed");
  current.button.classList.toggle("active");

  setTimeout(() => {
    if (chartInstance) chartInstance.resize();
  }, 400);
}
