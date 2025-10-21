const mongoose = require('mongoose');

const residentesSchema = new mongoose.Schema({
  id: { type: String, required: true },
  nombreCompleto: { type: String, required: true },
  necesitaApoyo: { type: String, enum: ['Sí', 'No'], required: true }
});

module.exports = mongoose.model('residentes', residentesSchema);
