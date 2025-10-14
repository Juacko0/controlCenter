require("dotenv").config();
const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const webpush = require("web-push");
const mongoose = require("mongoose");
const Subscription = require("./models/Subscription");
const Incident = require("./models/Incident");

const app = express();
const PORT = process.env.PORT || 3000;
const mongoURI = process.env.MONGO_URI;

// ==============================
// 🧩 Middleware
// ==============================
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

// ==============================
// 🔐 Configuración de claves VAPID
// ==============================
webpush.setVapidDetails(
  "mailto:tuemail@ejemplo.com",
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// ==============================
// 🔑 Enviar clave pública al frontend
// ==============================
app.get("/vapidPublicKey", (req, res) => {
  res.send(process.env.VAPID_PUBLIC_KEY);
});

// ==============================
// 🌐 Página principal
// ==============================
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ==============================
// 📩 Registrar suscripción
// ==============================
app.post("/subscribe", async (req, res) => {
  try {
    const subscription = req.body;

    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ message: "Subscription inválida" });
    }

    await Subscription.updateOne(
      { endpoint: subscription.endpoint },
      subscription,
      { upsert: true }
    );

    res.status(201).json({ message: "Suscripción registrada correctamente" });
  } catch (err) {
    console.error("Error guardando suscripción:", err);
    res.status(500).json({ message: "Error guardando la suscripción" });
  }
});

// ==============================
// 🚨 Enviar notificación a todos los suscritos
// ==============================
app.post("/notify", async (req, res) => {
  try {
    const { title, message } = req.body;
    const payload = JSON.stringify({ title, body: message });

    const subscriptions = await Subscription.find();

    const notifications = subscriptions.map(sub =>
      webpush.sendNotification(sub, payload).catch(async err => {
        console.error("Error al enviar:", err);
        if (err.statusCode === 410 || err.statusCode === 404) {
          await Subscription.deleteOne({ endpoint: sub.endpoint });
        }
      })
    );

    await Promise.all(notifications);
    res.status(200).json({ message: "✅ Notificaciones enviadas" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error enviando notificaciones" });
  }
});

// ==============================
// 🧩 Endpoints para Incidentes
// ==============================

// Registrar un nuevo incidente
app.post("/addIncident", async (req, res) => {
  try {
    const incidentData = req.body;
    const newIncident = new Incident(incidentData);
    await newIncident.save();
    res.status(201).json({ message: "Incidente registrado correctamente", incident: newIncident });
  } catch (err) {
    console.error("❌ Error al guardar incidente:", err);
    res.status(500).json({ message: "Error al guardar el incidente" });
  }
});

// Obtener todos los incidentes
app.get("/getIncidents", async (req, res) => {
  try {
    const incidents = await Incident.find().sort({ createdAt: -1 });
    res.status(200).json(incidents);
  } catch (err) {
    console.error("❌ Error al obtener incidentes:", err);
    res.status(500).json({ message: "Error al obtener los incidentes" });
  }
});

// Filtrar incidentes desde la BD
app.post("/filterIncidents", async (req, res) => {
  try {
    const { date, state, location } = req.body;
    const query = {};

    if (date) {
      // Coincidencia por fecha (sin hora)
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);
      query.time = { $gte: start, $lt: end };
    }

    if (state && state !== "Todos") query.state = state;
    if (location) query.location = { $regex: location, $options: "i" };

    const incidents = await Incident.find(query).sort({ time: -1 });
    res.json(incidents);
  } catch (err) {
    console.error("❌ Error al filtrar incidentes:", err);
    res.status(500).json({ message: "Error al aplicar filtros" });
  }
});

// Actualizar incidente
app.put("/updateIncident/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updatedIncident = await Incident.findByIdAndUpdate(id, req.body, { new: true });
    res.json(updatedIncident);
  } catch (err) {
    console.error("❌ Error al actualizar incidente:", err);
    res.status(500).json({ message: "Error al actualizar incidente" });
  }
});

// ==============================
// 🚀 Conexión a MongoDB e iniciar servidor
// ==============================
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("✅ Conectado a MongoDB");
    app.listen(PORT, () => {
      console.log("Clave pública VAPID:", process.env.VAPID_PUBLIC_KEY);
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    });
  })
  .catch(err => console.error("❌ Error conectando a MongoDB:", err));
