
const express = require('express');
const router = express.Router();

const { listarGrupos } = require('../controladores/grupoControlador');
const { verificarSesion } = require('../middleware/autenticacion');

// Solo usuarios con sesión iniciada pueden consultar los grupos.
router.use(verificarSesion);

router.get('/', listarGrupos);

module.exports = router;
