const mongoose = require('mongoose');

const profesionalesSchema = new mongoose.Schema({
codigo: { type: String, required: true, unique: true }, // 👈 Campo clave (P001, P002)
  nombre: { type: String, required: true },
  horario: { type: String, required: true },
  codigoPWA: { type: String },
  estado: { type: String, enum: ['Activo', 'Inactivo'], default: 'Activo' },

  // 🔔 Campo para guardar la suscripción completa del PWA
  codigoPWA: {
    endpoint: String,
    expirationTime: Number,
    keys: {
      p256dh: String,
      auth: String
    }
  }
});

module.exports = mongoose.model('profesionales', profesionalesSchema);
