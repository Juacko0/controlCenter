const mongoose = require("mongoose");

const incidentSchema = new mongoose.Schema({
  location: { type: String, required: true,  default: "Ubicación no especificada"}, // Ubicación de la cámara o evento
  time: { type: Date, default: Date.now }, // Fecha/hora del incidente
  residentName: { type: String, default: "No registrado" }, // Nombre del residente
  detail: { type: String, default: "" }, // Detalles del evento
  state: {
    type: String,
    enum: ["Pendiente", "Atendido"],
    default: "Pendiente"
  }, // Estado actual
  isFall: { type: Boolean, default: false }, // Indica si fue una caída

  intervention: {
    receivedAt: { type: Date }, // Timestamp cuando se recibió la alerta
    attendedAt: { type: Date }, // Timestamp cuando se atendió
    attendedBy: { type: String } // Nombre o ID del encargado
  },

  injuryLevel: {
    type: Number,
    enum: [1, 2, 3], // 1=leve, 2=moderada, 3=grave
    default: 1
  },

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Incident", incidentSchema);