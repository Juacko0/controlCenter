// ==============================
// 🎛️ Referencias DOM
// ==============================
const alertModal = document.getElementById("alertModal");
const closeModal = document.getElementById("closeModal");
const markAttended = document.getElementById("markAttended");
const incidentLocation = document.getElementById("incidentLocation");
const incidentTime = document.getElementById("incidentTime");
const incidentDetail = document.getElementById("incidentDetail");
const historyContainer = document.getElementById("incidentHistory");
const alertSound = document.getElementById("alertSound");

// ==============================
// 📜 Variables globales
// ==============================
let incidentHistory = [];
let simTime = 3000;
let simInterval = null;
let simRunning = false;

// ==============================
// ▶️ Simulación de incidentes
// ==============================
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

// ==============================
// 🚨 Generar incidente
// ==============================
function triggerIncident() {
  const cameras = document.querySelectorAll(".camera");
  const camera = cameras[Math.floor(Math.random() * cameras.length)];
  const location = camera.getAttribute("data-location");
  const time = new Date().toLocaleString();
  const resident = "No registrado";

  // Mostrar modal
  incidentLocation.textContent = location;
  incidentTime.textContent = time;
  incidentDetail.value = "";
  alertModal.classList.replace("hidden", "flex");

  // Resaltar cámara
  camera.classList.add("pulse-red");
  alertSound.currentTime = 0;
  alertSound.play();

  // Agregar al historial
  const incident = { location, time, resident, detail: "", state: "Pendiente" };
  incidentHistory.push(incident);
  updateQuickHistory();

  setTimeout(() => camera.classList.remove("pulse-red"), 3000);
}

// ==============================
// 🕒 Historial rápido
// ==============================
function updateQuickHistory() {
  historyContainer.innerHTML = "";
  incidentHistory.forEach(inc => {
    const div = document.createElement("div");
    div.className = "p-2 bg-gray-700 rounded";
    div.textContent = `${inc.time} - ${inc.location} - ${inc.state}`;
    historyContainer.appendChild(div);
  });
}

// ==============================
// 🧩 Cerrar y marcar atendido
// ==============================
closeModal.addEventListener("click", () => {
  alertModal.classList.replace("flex", "hidden");
});

markAttended.addEventListener("click", () => {
  if (incidentHistory.length > 0) {
    let lastIncident = incidentHistory[incidentHistory.length - 1];
    lastIncident.state = "Atendido";
    lastIncident.detail = incidentDetail.value || "Sin detalle";
  }
  updateQuickHistory();
  alertModal.classList.replace("flex", "hidden");
});

// ==============================
// 📋 Historial completo
// ==============================
const verHistorialBtn = document.getElementById("verHistorialBtn");
const historialModal = document.getElementById("historialModal");
const closeHistorial = document.getElementById("closeHistorial");
const historialTable = document.getElementById("historialTable");

verHistorialBtn.addEventListener("click", () => {
  loadHistorialTable();
  historialModal.classList.replace("hidden", "flex");
});

closeHistorial.addEventListener("click", () => {
  historialModal.classList.replace("flex", "hidden");
});

function loadHistorialTable(filters = {}) {
  historialTable.innerHTML = "";
  incidentHistory
    .filter(inc => {
      if (filters.date && !inc.time.startsWith(filters.date)) return false;
      if (filters.state && inc.state !== filters.state) return false;
      if (filters.location && !inc.location.toLowerCase().includes(filters.location.toLowerCase())) return false;
      return true;
    })
    .forEach(inc => {
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

// ==============================
// 🔍 Filtros
// ==============================
document.getElementById("applyFilters").addEventListener("click", () => {
  const date = document.getElementById("filterDate").value;
  const state = document.getElementById("filterState").value;
  const location = document.getElementById("filterLocation").value;
  loadHistorialTable({ date, state, location });
});

// ==============================
// ⚙️ Configuración
// ==============================
const configBtn = document.getElementById("configBtn");
const configModal = document.getElementById("configModal");
const closeConfig = document.getElementById("closeConfig");
const volumeControl = document.getElementById("volumeControl");
const simTimeInput = document.getElementById("simTime");
const toggleSimBtn = document.getElementById("toggleSimBtn");

configBtn.addEventListener("click", () => configModal.classList.replace("hidden", "flex"));
closeConfig.addEventListener("click", () => configModal.classList.replace("flex", "hidden"));

// Volumen
volumeControl.addEventListener("input", () => {
  alertSound.volume = volumeControl.value;
});

// Tiempo de simulación
simTimeInput.addEventListener("change", () => {
  simTime = parseInt(simTimeInput.value) * 1000;
  if (simRunning) startSimulation();
});

// Alternar simulación
toggleSimBtn.addEventListener("click", () => (simRunning ? stopSimulation() : startSimulation()));

// ==============================
// 💾 Exportar CSV
// ==============================
document.getElementById("exportCSV").addEventListener("click", () => {
  if (incidentHistory.length === 0) return alert("No hay datos para exportar.");
  let csv = "Fecha/Hora,Ubicación,Residente,Detalle,Estado\n";
  incidentHistory.forEach(inc => {
    csv += `${inc.time},${inc.location},${inc.resident},${inc.detail},${inc.state}\n`;
  });
  const blob = new Blob([csv], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "historial_incidentes.csv";
  link.click();
});

// ==============================
// 📄 Exportar PDF
// ==============================
document.getElementById("exportPDF").addEventListener("click", () => {
  if (incidentHistory.length === 0) return alert("No hay datos para exportar.");
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text("Historial de Incidentes", 14, 20);
  const headers = ["Fecha/Hora", "Ubicación", "Detalle", "Estado"];
  const data = incidentHistory.map(inc => [inc.time, inc.location, inc.detail, inc.state]);
  doc.autoTable({ startY: 30, head: [headers], body: data });
  doc.save("historial_incidentes.pdf");
});

// ==============================
// 🎥 Cámara
// ==============================
async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    document.getElementById("cam1").srcObject = stream;
  } catch (err) {
    console.error("Error al acceder a la cámara:", err);
  }
}
startCamera();

// ==============================
// 🔔 Notificaciones Push + SW
// ==============================
if ("serviceWorker" in navigator && "PushManager" in window) {
  (async () => {
    try {
      const registration = await navigator.serviceWorker.register("/service-worker.js");
      console.log("✅ Service Worker registrado");

      const permission = await Notification.requestPermission();
      if (permission !== "granted") return console.warn("❌ Permiso denegado");

      const vapidKey = (await (await fetch("/vapidPublicKey")).text()).trim();
      console.log("🔑 Clave pública recibida:", vapidKey);

      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      await fetch("/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub),
      });

      console.log("📩 Usuario suscrito correctamente");
    } catch (err) {
      console.error("Error registrando SW:", err);
    }
  })();
}

// ==============================
// 🔧 Utilidad: conversión de clave
// ==============================
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}
