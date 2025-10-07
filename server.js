require("dotenv").config();
const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const webpush = require("web-push");
const app = express();
const PORT = process.env.PORT || 3000;
const Subscription = require("./models/Subscription");
const mongoose = require("mongoose");

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

// Registrar suscripción
app.post("/subscribe", async (req, res) => {
  try {
    const subscription = req.body;

    // Guardar en la base de datos si no existe
    await Subscription.updateOne(
      { endpoint: subscription.endpoint },
      subscription,
      { upsert: true }
    );

    res.status(201).json({ message: "Suscripción registrada correctamente" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error guardando la suscripción" });
  }
});


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
app.post("/subscribe", (req, res) => {
  const subscription = req.body;
  subscriptions.push(subscription);
  res.status(201).json({ message: "Suscripción registrada correctamente" });
});

// ==============================
// 🚨 Enviar notificación a todos los suscritos
// ==============================
app.post("/notify", async (req, res) => {
  try {
    const { title, message } = req.body;
    const payload = JSON.stringify({ title, body: message });

    // Obtener todas las suscripciones de la DB
    const subscriptions = await Subscription.find();

    const notifications = subscriptions.map(sub =>
      webpush.sendNotification(sub, payload).catch(async err => {
        console.error("Error al enviar:", err);

        // Si la suscripción ya no es válida, la eliminamos
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

mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ Conectado a MongoDB"))
  .catch(err => console.error("❌ Error conectando a MongoDB:", err));
  
// ==============================
// 🚀 Iniciar servidor
// ==============================
app.listen(PORT, () => {
  console.log("Clave pública VAPID:", process.env.VAPID_PUBLIC_KEY);
  console.log("Clave privada VAPID:", process.env.VAPID_PRIVATE_KEY);
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});