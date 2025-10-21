require("dotenv").config();
const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const webpush = require("web-push");
const mongoose = require("mongoose");
const Subscription = require("./models/Subscription");
const Incident = require("./models/Incident");
const Residente = require("./models/Resident");
const Profesional = require("./models/Profesional");
const Usuario = require("./models/Usuario");
const bcrypt = require("bcrypt");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const jwt = require("jsonwebtoken");

const app = express();

const SECRET_KEY = process.env.JWT_SECRET || "miSuperSecreto123"

//
const expressWs = require("express-ws")(app);
const { proxy, scriptUrl } = require("rtsp-relay")(app);
///

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
    const { subscription, profesionalCodigo } = req.body;

    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ message: "Subscription inválida" });
    }

    // 🔹 Guardar o actualizar la suscripción (para no duplicar endpoints)
    await Subscription.updateOne(
      { endpoint: subscription.endpoint },
      subscription,
      { upsert: true }
    );

    // 🔹 Vincular la suscripción al profesional por su código (P001, P002, etc.)
    if (profesionalCodigo) {
      const profesionalActualizado = await Profesional.findOneAndUpdate(
        { codigo: profesionalCodigo }, // Busca por el campo "codigo"
        { codigoPWA: JSON.stringify(subscription) }, // Guarda el objeto de suscripción completo
        { new: true }
      );

      if (profesionalActualizado) {
        console.log(`✅ Suscripción vinculada al profesional ${profesionalCodigo}`);
      } else {
        console.warn(`⚠️ No se encontró profesional con código ${profesionalCodigo}`);
      }
    }

    res.status(201).json({ message: "Suscripción registrada correctamente" });
  } catch (err) {
    console.error("❌ Error guardando suscripción:", err);
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
////////////////////////////////
// ==============================
// 📹 Cámara RTSP
// ==============================
const handler = proxy({
  url: "rtsp://Prueba:Prueba123456789@192.168.1.40/stream1", // tu URL RTSP real
  verbose: false,
});

app.ws("/api/stream", handler);

// Exponer el script del cliente de rtsp-relay
app.get("/rtsp-relay.js", (req, res) => {
  res.type("application/javascript").sendFile(require.resolve("rtsp-relay/browser"));
});

// ==============================
// 🧠 Endpoints para Residentes y Profesionales
// ==============================

// 📦 Rutas API
app.post("/addprofesionales", async (req, res) => {
  try {
    const nuevoProfesional = new Profesional(req.body);
    await nuevoProfesional.save();
    res.status(201).json(nuevoProfesional);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post("/addresidentes", async (req, res) => {
  try {
    const nuevoResidente = new Residente(req.body);
    await nuevoResidente.save();
    res.status(201).json(nuevoResidente);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
// Obtener todos los residentes
app.get("/residentes", async (req, res) => {
  try {
    const residentes = await Residente.find();
    res.json(residentes);
  } catch (err) {
    console.error("❌ Error al obtener residentes:", err);
    res.status(500).json({ message: "Error al obtener residentes" });
  }
});

// Obtener todos los profesionales
app.get("/profesionales", async (req, res) => {
  try {
    const profesionales = await Profesional.find();
    res.json(profesionales);
  } catch (err) {
    console.error("❌ Error al obtener profesionales:", err);
    res.status(500).json({ message: "Error al obtener profesionales" });
  }
});

/////////////////////////////////////////////////
/////SESSION-MONGO////////////////////////////
app.use(session({
  secret: "miSecretoSuperSecreto", // cambia esto por un valor fuerte
  resave: false,
  saveUninitialized: false,
  cookie: {secure: false},
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI, // tu MongoDB
    ttl: 24 * 60 * 60 // 1 día de expiración
  }),
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, // 1 día
    httpOnly: true, // no accesible desde JS
    secure: false // en producción HTTPS = true
  }
}));

//////////////////////////////////////////////////////////////
////LOGIN/////////
app.post("/login", async (req, res) => {
  const { usuario, contraseña } = req.body;
  if (!usuario || !contraseña) return res.status(400).json({ message: "Datos incompletos" });

  try {
    const user = await Usuario.findOne({ usuario });
    if (!user) return res.status(401).json({ message: "Usuario no encontrado" });

    const esValido = await user.compararContraseña(contraseña);
    if (!esValido) return res.status(401).json({ message: "Contraseña incorrecta" });

    // ⚡ Validar horario (excepto Administrador)
    if (user.rol !== "Administrador" && user.horaInicio && user.horaFin) {
      const ahora = new Date();
      const horas = ahora.getHours().toString().padStart(2, "0");
      const minutos = ahora.getMinutes().toString().padStart(2, "0");
      const horaActual = `${horas}:${minutos}`;

      // Convertir a minutos para comparación
      const aMinutos = (h) => {
        const [hh, mm] = h.split(":").map(Number);
        return hh * 60 + mm;
      };

      const minutosActual = aMinutos(horaActual);
      const minutosInicio = aMinutos(user.horaInicio);
      const minutosFin = aMinutos(user.horaFin);

      // Comparar correctamente el rango horario
      if (minutosInicio <= minutosFin) {
        // Ejemplo: 08:00 - 13:00
        if (minutosActual < minutosInicio || minutosActual > minutosFin) {
          return res.status(403).json({
            message: `⛔ Fuera de horario (${user.horaInicio} - ${user.horaFin})`
          });
        }
      } else {
        // Ejemplo: turno que cruza medianoche (22:00 - 06:00)
        if (minutosActual > minutosFin && minutosActual < minutosInicio) {
          return res.status(403).json({
            message: `⛔ Fuera de horario (${user.horaInicio} - ${user.horaFin})`
          });
        }
      }
    }

    // Guardar usuario en la sesión
    req.session.usuario = usuario;

    // 🔑 Generar JWT
    const token = jwt.sign(
      { id: user._id, usuario: user.usuario, rol: user.rol },
      SECRET_KEY,
      { expiresIn: "1d" } // token válido por 1 día
    );

    res.json({ message: "✅ Login exitoso", usuario: req.session.usuario, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error en el servidor" });
  }
});

// CREAR USUARIO
app.post("/usuarios", async (req, res) => {
  const { usuario, contraseña, rol, horaInicio, horaFin } = req.body;

  if (!usuario || !contraseña || !rol) {
    return res.status(400).json({ message: "⚠️ Todos los campos son obligatorios" });
  }

  try {
    // Verificar si el usuario ya existe
    const existente = await Usuario.findOne({ usuario });
    if (existente) {
      return res.status(409).json({ message: "❌ El usuario ya existe" });
    }

    // Crear y guardar el usuario con horario (si se proporcionan)
    const nuevoUsuario = new Usuario({
      usuario,
      contraseña,
      rol,
      horaInicio: horaInicio || null,
      horaFin: horaFin || null
    });

    await nuevoUsuario.save();

    res.status(201).json({
      message: "✅ Usuario creado correctamente",
      usuario: {
        id: nuevoUsuario._id,
        usuario: nuevoUsuario.usuario,
        rol: nuevoUsuario.rol,
        horaInicio: nuevoUsuario.horaInicio,
        horaFin: nuevoUsuario.horaFin
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "❌ Error en el servidor" });
  }
});

///USUARIOS ACTIVOS//////////////////
app.get("/me", (req, res) => {
  // Revisar si envían token en header Authorization
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token) {
    try {
      const usuario = jwt.verify(token, SECRET_KEY);
      return res.json({ usuario });
    } catch (error) {
      return res.status(401).json({ message: "Token inválido o expirado" });
    }
  }

  // Si no hay token, revisar sesión normal
  if (req.session.usuario) {
    return res.json({ usuario: req.session.usuario });
  }

  res.status(401).json({ message: "No hay sesión activa" });
});

///////CERRAR SESION/////////////////
app.post("/logout", (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ message: "Error cerrando sesión" });
    res.clearCookie("connect.sid"); // limpiar cookie del navegador
    res.json({ message: "✅ Sesión cerrada" });
  });
});

//////////////////////////////////////////////////////////////
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
