const alertModal = document.getElementById("alertModal");
const closeModal = document.getElementById("closeModal");
const markAttended = document.getElementById("markAttended");
const incidentLocation = document.getElementById("incidentLocation");
const incidentTime = document.getElementById("incidentTime");
const incidentDetail = document.getElementById("incidentDetail");
const historyContainer = document.getElementById("incidentHistory");
const alertSound = document.getElementById("alertSound");

// Historial
let incidentHistory = [];

// Simulación
let simTime = 3000; // 3 segundos por defecto
let simInterval = null;
let simRunning = false;

function startSimulation() {
  if (simInterval) clearInterval(simInterval);
  simInterval = setInterval(triggerIncident, simTime);
  simRunning = true;
  document.getElementById("toggleSimBtn").textContent = "⏹️ Detener simulación";
}

function stopSimulation() {
  if (simInterval) clearInterval(simInterval);
  simInterval = null;
  simRunning = false;
  document.getElementById("toggleSimBtn").textContent = "▶️ Iniciar simulación";
}

function triggerIncident() {
  const cameras = document.querySelectorAll(".camera");
  const randomIndex = Math.floor(Math.random() * cameras.length);
  const camera = cameras[randomIndex];

  const location = camera.getAttribute("data-location");
  const time = new Date().toLocaleString();
  const resident = "No registrado";

  // Mostrar modal
  incidentLocation.textContent = location;
  incidentTime.textContent = time;
  incidentDetail.value = "";
  alertModal.classList.remove("hidden");
  alertModal.classList.add("flex");

  // Resaltar cámara
  camera.classList.add("pulse-red");

  // Reproducir sonido
  alertSound.currentTime = 0;
  alertSound.play();

  // Guardar en historial
  const incident = { location, time, resident, detail: "", state: "Pendiente" };
  incidentHistory.push(incident);
  updateQuickHistory();

  // Quitar resaltado después de unos segundos
  setTimeout(() => camera.classList.remove("pulse-red"), 3000);
}

// Historial rápido
function updateQuickHistory() {
  historyContainer.innerHTML = "";
  incidentHistory.forEach((inc) => {
    const div = document.createElement("div");
    div.className = "p-2 bg-gray-700 rounded";
    div.textContent = `${inc.time} - ${inc.location} - ${inc.state}`;
    historyContainer.appendChild(div);
  });
}

// Cerrar modal
closeModal.addEventListener("click", () => {
  alertModal.classList.add("hidden");
  alertModal.classList.remove("flex");
});

// Marcar atendido
markAttended.addEventListener("click", () => {
  if (incidentHistory.length > 0) {
    let lastIncident = incidentHistory[incidentHistory.length - 1];
    lastIncident.state = "Atendido";
    lastIncident.detail = incidentDetail.value || "Sin detalle";
  }
  updateQuickHistory();
  alertModal.classList.add("hidden");
  alertModal.classList.remove("flex");
});

// ===================
// Historial completo
// ===================
const verHistorialBtn = document.getElementById("verHistorialBtn");
const historialModal = document.getElementById("historialModal");
const closeHistorial = document.getElementById("closeHistorial");
const historialTable = document.getElementById("historialTable");

verHistorialBtn.addEventListener("click", () => {
  loadHistorialTable();
  historialModal.classList.remove("hidden");
  historialModal.classList.add("flex");
});

closeHistorial.addEventListener("click", () => {
  historialModal.classList.add("hidden");
  historialModal.classList.remove("flex");
});

function loadHistorialTable(filters = {}) {
  historialTable.innerHTML = "";
  incidentHistory
    .filter((inc) => {
      if (filters.date && !inc.time.startsWith(filters.date)) return false;
      if (filters.state && inc.state !== filters.state) return false;
      if (filters.location && !inc.location.toLowerCase().includes(filters.location.toLowerCase())) return false;
      return true;
    })
    .forEach((inc) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td class="border px-2 py-1">${inc.time}</td>
        <td class="border px-2 py-1">${inc.location}</td>
        <td class="border px-2 py-1">${inc.detail}</td>
        <td class="border px-2 py-1">${inc.state}</td>
      `;
      historialTable.appendChild(tr);
    });
}

document.getElementById("applyFilters").addEventListener("click", () => {
  const date = document.getElementById("filterDate").value;
  const state = document.getElementById("filterState").value;
  const location = document.getElementById("filterLocation").value;
  loadHistorialTable({ date, state, location });
});

// ===================
// Configuración
// ===================
const configBtn = document.getElementById("configBtn");
const configModal = document.getElementById("configModal");
const closeConfig = document.getElementById("closeConfig");
const volumeControl = document.getElementById("volumeControl");
const simTimeInput = document.getElementById("simTime");
const themeSelect = document.getElementById("themeSelect");
const toggleSimBtn = document.getElementById("toggleSimBtn");

configBtn.addEventListener("click", () => {
  configModal.classList.remove("hidden");
  configModal.classList.add("flex");
});

closeConfig.addEventListener("click", () => {
  configModal.classList.add("hidden");
  configModal.classList.remove("flex");
});

// Control de volumen
volumeControl.addEventListener("input", () => {
  alertSound.volume = volumeControl.value;
});

// Control de tiempo de simulación
simTimeInput.addEventListener("change", () => {
  simTime = parseInt(simTimeInput.value) * 1000;
  if (simRunning) startSimulation(); // reinicia si está en marcha
});


// Encender/apagar simulación
toggleSimBtn.addEventListener("click", () => {
  if (simRunning) {
    stopSimulation();
  } else {
    startSimulation();
  }
});

// ===================
// Exportar CSV
// ===================
document.getElementById("exportCSV").addEventListener("click", () => {
  if (incidentHistory.length === 0) {
    alert("No hay datos para exportar.");
    return;
  }

  let csvContent = "data:text/csv;charset=utf-8,";
  csvContent += "Fecha/Hora,Ubicación,Detalle,Estado\n";
  incidentHistory.forEach(inc => {
    csvContent += `${inc.time},${inc.location},${inc.resident},${inc.detail},${inc.state}\n`;
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "historial_incidentes.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});

// ===================
// Exportar PDF (con jsPDF)
// ===================
document.getElementById("exportPDF").addEventListener("click", () => {
  if (incidentHistory.length === 0) {
    alert("No hay datos para exportar.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text("Historial de Incidentes", 14, 20);

  const headers = ["Fecha/Hora", "Ubicación", "Detalle", "Estado"];
  const data = incidentHistory.map(inc => [
    inc.time,
    inc.location,
    inc.detail,
    inc.state
  ]);

  doc.autoTable({
    startY: 30,
    head: [headers],
    body: data,
  });

  doc.save("historial_incidentes.pdf");
});


async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const video = document.getElementById("cam1");
      video.srcObject = stream;
    } catch (err) {
      console.error("Error al acceder a la cámara:", err);
    }
  }

  startCamera();
  