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
const modal = document.getElementById("dataModal");
const modalTitle = document.getElementById("modalTitle");
const modalContent = document.getElementById("modalContent");

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
async function triggerIncident() {
  const cameras = document.querySelectorAll(".camera");
  const camera = cameras[Math.floor(Math.random() * cameras.length)];
  const location = camera.getAttribute("data-location");
  const time = new Date().toLocaleString();

  // Mostrar modal
  incidentLocation.textContent = location;
  incidentTime.textContent = time;
  incidentDetail.value = "";
  alertModal.classList.replace("hidden", "flex");

  // Resaltar cámara y sonido
  camera.classList.add("pulse-red");
  alertSound.currentTime = 0;
  alertSound.play();

  // Guardar el incidente en memoria (NO en la BD aún)
  const incident = {
    location,
    time: new Date(),
    residentName: "No registrado",
    detail: "",
    state: "Pendiente",
    isFall: false,
    injuryLevel: 1,
    intervention: {}
  };

  // Quitar el efecto rojo luego de unos segundos
  setTimeout(() => {
    camera.classList.remove("pulse-red");
  }, 3000);

  // ⏳ Si no hay respuesta del usuario en 15 segundos → guardar como pendiente automáticamente
  setTimeout(async () => {
    if (alertModal.classList.contains("flex")) {
      console.log("⏰ Tiempo expirado, guardando como pendiente...");
    }
  }, 15000);
}
// ==============================
// 🕒 Historial rápido
// ==============================
function updateQuickHistory() {
  historyContainer.innerHTML = "";

  incidentHistory.forEach(inc => {
    const fecha = inc.time ? new Date(inc.time).toLocaleString() : "Sin fecha";
    const lugar = inc.location || "Ubicación desconocida";
    const estado = inc.state || "Sin estado";

    const div = document.createElement("div");
    div.className = "p-2 bg-gray-700 rounded";
    div.textContent = `${fecha} - ${lugar} - ${estado}`;
    historyContainer.appendChild(div);
  });
}


// Cerrar = guardar como pendiente
closeIncidentModal.addEventListener("click", async (e) => {
  e.stopPropagation();
  const incident = {
    location: incidentLocation.textContent,
    time: new Date(),
    residentName: document.getElementById("incidentResident")?.value || "No registrado",
    detail: incidentDetail.value || "Sin detalle",
    state: "Pendiente",
    isFall: document.getElementById("incidentType")?.value === "true",
    injuryLevel: parseInt(document.getElementById("incidentInjuryLevel")?.value) || 1,
    intervention: {
      receivedAt: new Date().toISOString(),
      attendedAt: null,
      attendedBy: null
    }
  };

  try {
    const res = await fetch("/addIncident", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(incident)
    });
    const data = await res.json();
    console.log("🟡 Incidente guardado manualmente como pendiente:", data);
    incidentHistory.push(data.incident);
    updateQuickHistory();
  } catch (err) {
    console.error("❌ Error guardando incidente:", err);
  }

  alertModal.classList.replace("flex", "hidden");
});


// Marcar atendido
markAttended.addEventListener("click", async (e) => {
  e.stopPropagation();

    // 🧩 Validación de campos obligatorios
  const location = incidentLocation.textContent.trim();
  const time = incidentTime.textContent.trim();
  const detail = incidentDetail.value.trim();
  const resident = document.getElementById("incidentResident")?.value.trim() || "";

  if (!location || !time || !detail || !resident) {
    alert("⚠️ Debes completar todos los campos antes de marcar como atendido.");
    return;
  }

  const incident = {
    location: incidentLocation.textContent,
    time: new Date(),
    residentName: document.getElementById("incidentResident")?.value || "No registrado",
    detail: incidentDetail.value || "Sin detalle",
    state: "Atendido",
    isFall: document.getElementById("incidentType")?.value === "true",
    injuryLevel: parseInt(document.getElementById("incidentInjuryLevel")?.value) || 1,
    intervention: {
      receivedAt: new Date().toISOString(),
      attendedAt: new Date().toISOString(),
      attendedBy: "Supervisor 1"
    }
  };

  try {
    const res = await fetch("/addIncident", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(incident)
    });
    const data = await res.json();
    console.log("✅ Incidente atendido correctamente:", data);
    incidentHistory.push(data.incident);
    updateQuickHistory();
  } catch (err) {
    console.error("❌ Error guardando incidente atendido:", err);
  }

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

function loadHistorialTable() {
  historialTable.innerHTML = "";
  incidentHistory.forEach((inc, index) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="border px-2 py-1">${new Date(inc.time).toLocaleString()}</td>
      <td class="border px-2 py-1">${inc.location}</td>
      <td class="border px-2 py-1">${inc.detail}</td>
      <td class="border px-2 py-1">${inc.state}</td>
      <td class="border px-2 py-1 text-center">
        <button class="edit-btn text-blue-400 hover:text-blue-600" data-index="${index}" title="Editar">
          ✏️
        </button>
      </td>
    `;
    historialTable.appendChild(tr);
  });

  // 🎯 Asociar evento a cada botón de edición
  document.querySelectorAll(".edit-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const idx = e.currentTarget.dataset.index;
      openEditModal(incidentHistory[idx]);
    });
  });
}


// ==============================
// 📥 Cargar incidentes desde MongoDB
// ==============================
async function loadIncidentsFromDB() {
  try {
    const res = await fetch("/getIncidents");
    const data = await res.json();
    incidentHistory = data;
    updateQuickHistory();
    console.log("✅ Incidentes cargados desde MongoDB");
  } catch (err) {
    console.error("⚠️ Error cargando incidentes:", err);
  }
}
loadIncidentsFromDB();

// ==============================
// 🔍 Filtros
// ==============================
document.getElementById("applyFilters").addEventListener("click", async () => {
  const date = document.getElementById("filterDate").value;
  const state = document.getElementById("filterState").value;
  const location = document.getElementById("filterLocation").value;

  try {
    const res = await fetch("/filterIncidents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, state, location })
    });
    const data = await res.json();

    incidentHistory = data;
    loadHistorialTable(); // recarga la tabla
  } catch (err) {
    console.error("❌ Error aplicando filtros:", err);
    alert("Error al aplicar filtros");
  }
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
// 📤 Exportar Historial (PDF / CSV)
// ==============================
// Exportar CSV
document.getElementById("exportCSV").addEventListener("click", async () => {
  try {
    const response = await fetch("/getIncidents");
    const incidents = await response.json();

    if (!incidents.length) return alert("No hay datos para exportar.");

    // ✅ Encabezados CSV (separados por ;)
    const headers = ["ID", "Fecha", "Ubicación", "Detalle", "Estado", "Registrado por"];

    // ✅ Filas CSV con ; como separador
    const rows = incidents.map(inc => [
      inc._id || "N/A",
      new Date(inc.time).toLocaleString("es-PE", { dateStyle: "short", timeStyle: "medium" }),
      (inc.location || "Sin ubicación").replace(/;/g, ","), // evita romper el CSV
      `"${(inc.detail || "").replace(/"/g, '""')}"`, // escapa comillas
      inc.status || "Pendiente",
      inc.user || "Desconocido"
    ]);

    // ✅ Une usando punto y coma
    const csvContent = headers.join(";") + "\n" + rows.map(r => r.join(";")).join("\n");

    // ✅ Crear blob con codificación UTF-8 + BOM (para Excel)
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `Historial_Incidentes_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    console.log("✅ CSV exportado correctamente con separador ;");
  } catch (err) {
    console.error("❌ Error al exportar CSV:", err);
    alert("Error al generar el CSV.");
  }
});

// Exportar PDF
document.getElementById("exportPDF").addEventListener("click", () => {
  if (!incidentHistory.length) return alert("No hay datos para exportar.");

  const ventana = window.open("", "_blank");
  ventana.document.write("<h1>Reporte de Incidentes</h1>");
  ventana.document.write("<table border='1' style='border-collapse:collapse; width:100%'>");
  ventana.document.write("<tr><th>Fecha</th><th>Ubicación</th><th>Detalle</th><th>Estado</th></tr>");

  incidentHistory.forEach(inc => {
    ventana.document.write(`
      <tr>
        <td>${new Date(inc.time).toLocaleString()}</td>
        <td>${inc.location}</td>
        <td>${inc.detail}</td>
        <td>${inc.state}</td>
      </tr>
    `);
  });

  ventana.document.write("</table>");
  ventana.print();
});

// ==============================
// ✏️ Editar incidente
// ==============================
const editModal = document.getElementById("editModal");
const editLocation = document.getElementById("editLocation");
const editDetail = document.getElementById("editDetail");
const editState = document.getElementById("editState");
const saveEdit = document.getElementById("saveEdit");
const cancelEdit = document.getElementById("cancelEdit");

let currentIncident = null;

// Abre el modal con los datos actuales
function openEditModal(incident) {
  currentIncident = incident;
  editLocation.value = incident.location;
  editDetail.value = incident.detail;
  editState.value = incident.state;
  editModal.classList.replace("hidden", "flex");
}

// Cerrar modal
cancelEdit.addEventListener("click", () => {
  editModal.classList.replace("flex", "hidden");
  currentIncident = null;
});

// Guardar edición
saveEdit.addEventListener("click", async () => {
  if (!currentIncident) return;

  const updated = {
    ...currentIncident,
    location: editLocation.value.trim(),
    detail: editDetail.value.trim(),
    state: editState.value.trim()
  };

  try {
    const res = await fetch(`/updateIncident/${currentIncident._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated)
    });

    const data = await res.json();
    console.log("✅ Incidente actualizado:", data);

    // Cierra el modal
    editModal.classList.replace("flex", "hidden");
    currentIncident = null;

    // Recarga historial rápido y tabla completa (sin refrescar la página)
    await loadIncidentsFromDB();
    await loadHistorialTable();

  } catch (err) {
    console.error("❌ Error al actualizar incidente:", err);
    alert("No se pudo actualizar el incidente");
  }
});

// ==============================
// 🔍 Filtros (versión mejorada)
// ==============================
document.getElementById("applyFilters").addEventListener("click", async () => {
  const date = document.getElementById("filterDate").value;
  const state = document.getElementById("filterState").value;
  const location = document.getElementById("filterLocation").value;

  try {
    const res = await fetch("/filterIncidents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, state, location })
    });
    const data = await res.json();

    // Normalizamos mayúsculas/minúsculas por si hay diferencias en la BD
    incidentHistory = data.map(inc => ({
      ...inc,
      state: inc.state?.trim()?.toLowerCase() === "atendido" ? "Atendido" :
             inc.state?.trim()?.toLowerCase() === "pendiente" ? "Pendiente" :
             inc.state || "Sin estado"
    }));

    loadHistorialTable();
  } catch (err) {
    console.error("❌ Error aplicando filtros:", err);
    alert("Error al aplicar filtros");
  }
});

// ==============================
// 🎥 Conexión RTSP
// ==============================
if (typeof loadPlayer !== "undefined") {
  const camCanvas = document.getElementById("cam1");
  loadPlayer({
    url: "ws://" + location.host + "/api/stream",
    canvas: camCanvas,
  });
} else {
  console.warn("⚠️ El script de rtsp-relay no se ha cargado todavía.");
}

document.getElementById("btnProfesionales").addEventListener("click", async () => {
  await openModal("Gestión de Profesionales", "/profesionales");
});

document.getElementById("btnResidentes").addEventListener("click", async () => {
  await openModal("Gestión de Residentes", "/residentes");
});

closeModal.addEventListener("click", () => {
  modal.classList.add("hidden");
});

modal.addEventListener("click", (e) => {
  if (e.target === modal) modal.classList.add("hidden");
});

async function openModal(title, apiUrl) {
  modalTitle.textContent = title;
  modalContent.innerHTML = "<p class='text-gray-500'>Cargando datos...</p>";
  modal.classList.remove("hidden");

  try {
    const res = await fetch(apiUrl);
    const data = await res.json();

    if (title.includes("Profesionales")) {
      renderProfesionales(data);
    } else {
      renderResidentes(data);
    }
  } catch (err) {
    modalContent.innerHTML = `<p class="text-red-500">Error cargando datos: ${err.message}</p>`;
  }
}

function renderProfesionales(profesionales) {
  let table = `
    <table class="min-w-full border border-gray-300">
      <thead>
        <tr class="bg-blue-700 text-white">
          <th class="border p-2">ID</th>
          <th class="border p-2">Nombre</th>
          <th class="border p-2">Horario</th>
          <th class="border p-2">Código Suscripción PWA</th>
          <th class="border p-2">Estado</th>
        </tr>
      </thead>
      <tbody>
  `;
  profesionales.forEach(p => {
    table += `
      <tr class="hover:bg-blue-100 transition">
        <td class="border p-2">${p._id || "N/A"}</td>
        <td class="border p-2">${p.nombre || "Sin nombre"}</td>
        <td class="border p-2">${p.horario || "-"}</td>
        <td class="border p-2">${p.codigoSuscripcion || "No registrado"}</td>
        <td class="border p-2">${p.estado || "Desconocido"}</td>
      </tr>
    `;
  });
  table += `</tbody></table>`;
  modalContent.innerHTML = table;
}

function renderResidentes(residentes) {
  let table = `
    <table class="min-w-full border border-gray-300">
      <thead>
        <tr class="bg-green-700 text-white">
          <th class="border p-2">ID</th>
          <th class="border p-2">Nombre Completo</th>
          <th class="border p-2">Apoyo para Caminar</th>
        </tr>
      </thead>
      <tbody>
  `;
  residentes.forEach(r => {
    table += `
      <tr class="hover:bg-green-100 transition">
        <td class="border p-2">${r._id || "N/A"}</td>
        <td class="border p-2">${r.nombreCompleto || r.nombre || "Sin nombre"}</td>
        <td class="border p-2">${r.apoyoCaminar ? "Sí" : "No"}</td>
      </tr>
    `;
  });
  table += `</tbody></table>`;
  modalContent.innerHTML = table;
}

// ==============================
// 🔔 REGISTRO Y SUSCRIPCIÓN PUSH
// ==============================
async function initPushNotifications() {
  if (!("serviceWorker" in navigator)) {
    console.warn("❌ Este navegador no soporta Service Workers");
    return;
  }

  try {
    // Esperar a que el SW esté listo
    const reg = await navigator.serviceWorker.ready;
    console.log("🟢 Service Worker listo:", reg);

    // Solicitar permiso al usuario
    const permission = await Notification.requestPermission();
    console.log("🔔 Estado del permiso:", permission);

    if (permission !== "granted") {
      console.warn("🚫 Permiso de notificaciones denegado por el usuario");
      return;
    }

    // Obtener la clave pública VAPID desde el servidor
    const response = await fetch("/vapidPublicKey");
    if (!response.ok) throw new Error("No se pudo obtener la clave pública VAPID");
    const vapidPublicKey = await response.text();

    // Convertir la clave base64 a Uint8Array
    const convertedKey = urlBase64ToUint8Array(vapidPublicKey);

    // Crear la suscripción
    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedKey
    });

    console.log("📩 Suscripción creada:", subscription);

   // 🧠 Aquí colocas el ID del profesional actual (puedes obtenerlo dinámicamente más adelante)
const profesionalId = "P001"; // Ejemplo temporal

// Enviar la suscripción junto con el profesional
const saveResponse = await fetch("/subscribe", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    subscription,
    profesionalCodigo: "P001" // 👈 Cambia dinámicamente según el usuario que se suscribe
  })
});

    if (saveResponse.ok) {
      console.log("✅ Suscripción guardada en la base de datos");
    } else {
      console.error("❌ Error guardando la suscripción:", saveResponse.status);
    }
  } catch (err) {
    console.error("❌ Error durante la suscripción push:", err);
  }
}

// Función auxiliar para convertir la clave base64 a Uint8Array
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Ejecutar en el arranque
window.addEventListener("load", () => {
  initPushNotifications();
});

// ==============================
// 📱 Suscripción a notificaciones Push
// ==============================
async function subscribeUserToPush(profesionalCodigo) {
  try {
    const registration = await navigator.serviceWorker.ready;

    // 🔑 Obtener la clave pública del servidor
    const response = await fetch("/vapidPublicKey");
    const vapidPublicKey = await response.text();
    const convertedKey = urlBase64ToUint8Array(vapidPublicKey);

    // 💬 Suscribirse a notificaciones
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedKey,
    });

    // 📤 Enviar suscripción al backend junto con el código del profesional
    const res = await fetch("/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscription, profesionalCodigo }),
    });

    const data = await res.json();
    console.log("✅ Suscripción registrada:", data);
    alert(`Notificaciones activadas para el profesional ${profesionalCodigo}`);

  } catch (err) {
    console.error("❌ Error al suscribirse:", err);
  }
}

// 🔧 Convierte la clave base64 a Uint8Array
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

//===============================
//===========LOGIN===============
//===============================
const loginForm = document.getElementById("loginForm");
const loginOverlay = document.getElementById("loginOverlay");

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const usuario = document.getElementById("usuario").value.trim();
  const contraseña = document.getElementById("password").value.trim();

  if (!usuario || !contraseña) {
    alert("⚠️ Ingresa tu usuario y contraseña.");
    return;
  }

  try {
  const res = await fetch("/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ usuario, contraseña })
  });

  const data = await res.json();

  if (res.ok) {
    // Guardar token JWT
    localStorage.setItem("token", data.token);

    // Guardar usuario activo
    localStorage.setItem("usuarioActivo", JSON.stringify(data.usuario));

    // Ocultar login y mostrar panel
    loginOverlay.style.display = "none";
    document.body.classList.remove("overflow-hidden");

    // Mostrar usuario en la interfaz
    document.getElementById("usuarioActivoLabel").textContent = data.usuario.usuario;

    console.log("✅ Sesión iniciada:", data.usuario.usuario);
  } else {
    alert(data.message || "❌ Credenciales incorrectas.");
  }
} catch (err) {
  console.error("❌ Error en el login:", err);
}
});

document.addEventListener("DOMContentLoaded", () => {
  const loginOverlay = document.getElementById("loginOverlay");
  const usuarioLabel = document.getElementById("usuarioActivoLabel");

  // Mostrar usuario activo basado en JWT
  async function mostrarUsuarioActivo() {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch("/me", {
        headers: { "Authorization": `Bearer ${token}` }
      });

      const data = await res.json();

      if (res.ok) {
        // Tomar username del JWT
        const nombre = data.usuario.usuario || "Desconocido";
        usuarioLabel.textContent = `👤 ${nombre}`;

        // Ocultar overlay de login si existe
        if (loginOverlay) loginOverlay.style.display = "none";
        document.body.classList.remove("overflow-hidden");
      } else {
        usuarioLabel.textContent = "";
        localStorage.removeItem("token"); // eliminar token inválido
      }
    } catch (err) {
      console.error("Error obteniendo usuario:", err);
      usuarioLabel.textContent = "";
      localStorage.removeItem("token");
    }
  }

  mostrarUsuarioActivo();

  // Función de login usando JWT
  const formLogin = document.getElementById("loginForm");
  if (formLogin) {
    formLogin.addEventListener("submit", async (e) => {
      e.preventDefault();

      const usuario = document.getElementById("inputUsuario").value;
      const contraseña = document.getElementById("inputContraseña").value;

      try {
        const res = await fetch("/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ usuario, contraseña })
        });

        const data = await res.json();

        if (res.ok) {
          localStorage.setItem("token", data.token); // Guardar JWT
          mostrarUsuarioActivo(); // Mostrar usuario sin recargar
        } else {
          alert(data.message || "❌ Credenciales incorrectas.");
        }
      } catch (err) {
        console.error("Error en login:", err);
      }
    });
  }

  // Función de logout
  const btnLogout = document.getElementById("logoutBtn");
  if (btnLogout) {
    btnLogout.addEventListener("click", () => {
      localStorage.removeItem("token");
      usuarioLabel.textContent = "";
      if (loginOverlay) loginOverlay.style.display = "flex";
      document.body.classList.add("overflow-hidden");
    });
  }
});

// Botón de logout
const btnLogout = document.getElementById("logoutButton");

btnLogout.addEventListener("click", () => {
  // 1️⃣ Eliminar token
  localStorage.removeItem("token");

  // 2️⃣ Limpiar usuario activo en la interfaz
  document.getElementById("usuarioActivoLabel").textContent = "";

  // 3️⃣ Mostrar nuevamente el login
  loginOverlay.style.display = "flex";
  document.body.classList.add("overflow-hidden");

  console.log("✅ Sesión cerrada");
});

async function startLocalCamera() {
  const videoElement = document.getElementById("localCamera");
  
  try {
    // ✅ Pedir acceso a la cámara (USB o integrada)
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    videoElement.srcObject = stream;
    console.log("🎥 Cámara local iniciada correctamente");
  } catch (error) {
    console.error("❌ Error al acceder a la cámara local:", error);
    alert("No se pudo acceder a la cámara. Verifica los permisos del navegador.");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  startLocalCamera();
});