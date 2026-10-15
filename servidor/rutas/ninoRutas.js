
const express = require('express');
const router = express.Router();

const {
    listarNinos,
    registrarNino
} = require('../controladores/ninoControlador');

const {
    verificarSesion,
    soloAdministrador
} = require('../middleware/autenticacion');

// Todas las operaciones requieren iniciar sesión.
router.use(verificarSesion);

// Administrador, Encargado y Enfermería pueden consultar niños.
router.get('/', listarNinos);

// Solo Administrador y Encargado pueden registrar niños.
router.post('/', (req, res, next) => {
    const rolesPermitidos = ['Administrador', 'Encargado'];

    if (!rolesPermitidos.includes(req.session.usuario.rol)) {
        return res.status(403).json({
            error: 'No tienes permisos para registrar niños.'
        });
    }

    next();
}, registrarNino);

module.exports = router;
