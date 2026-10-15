
const express = require('express');
const router = express.Router();

const {
    listarUsuarios,
    obtenerUsuario,
    crearUsuario,
    actualizarUsuario,
    desactivarUsuario
} = require('../controladores/usuarioControlador');

const {
    verificarSesion,
    soloAdministrador
} = require('../middleware/autenticacion');

// Todas las rutas de usuarios requieren una sesión
// válida y permisos de administrador.
router.use(verificarSesion, soloAdministrador);

router.get('/', listarUsuarios);
router.get('/:id', obtenerUsuario);
router.post('/', crearUsuario);
router.put('/:id', actualizarUsuario);
router.delete('/:id', desactivarUsuario);

module.exports = router;
