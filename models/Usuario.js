const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const usuarioSchema = new mongoose.Schema({
  usuario: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  contraseña: {
    type: String,
    required: true
  },
  rol: {
    type: String,
    enum: ["Administrador",  "Trabajador"],
    default: "Trabajador"
  },
  horaInicio : {type: String },
  horaFin: {type: String }
}, {
  timestamps: true
});

// Hash de contraseña antes de guardar
usuarioSchema.pre("save", async function(next) {
  if (!this.isModified("contraseña")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.contraseña = await bcrypt.hash(this.contraseña, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Método para comparar contraseña
usuarioSchema.methods.compararContraseña = async function(password) {
  return await bcrypt.compare(password, this.contraseña);
};

module.exports = mongoose.model("Usuario", usuarioSchema);