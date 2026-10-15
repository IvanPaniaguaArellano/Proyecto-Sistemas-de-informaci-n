
const express = require('express');
const router = express.Router();

const {
    listarActividades,
    registrarActividad
} = require('../controladores/actividadControlador');

const { verificarSesion } = require('../middleware/autenticacion');

// Todas las rutas requieren que el usuario haya iniciado sesión.
router.use(verificarSesion);

// Consultar todas las actividades o filtrar por niño.
router.get('/', listarActividades);

// Registrar una actividad nueva.
router.post('/', registrarActividad);

module.exports = router;
