
const bcrypt = require('bcrypt');
const conexion = require('../configuracion/db');

// Iniciar sesión.
async function iniciarSesion(req, res) {
    try {
        const { usuario, contrasena } = req.body;

        if (!usuario?.trim() || !contrasena) {
            return res.status(400).json({
                error: 'Ingresa tu usuario y contraseña.'
            });
        }

        const [usuarios] = await conexion.query(
            `SELECT id, nombre_completo, usuario, correo,
                    contrasena, rol,
                    CAST(activo AS UNSIGNED) AS activo
             FROM usuarios
             WHERE usuario = ?
             LIMIT 1`,
            [usuario.trim()]
        );

        if (usuarios.length === 0) {
            return res.status(401).json({
                error: 'Usuario o contraseña incorrectos.'
            });
        }

        const cuenta = usuarios[0];

        if (cuenta.activo !== 1) {
            return res.status(403).json({
                error: 'Esta cuenta está desactivada.'
            });
        }

        const contrasenaCorrecta = await bcrypt.compare(
            contrasena,
            cuenta.contrasena
        );

        if (!contrasenaCorrecta) {
            return res.status(401).json({
                error: 'Usuario o contraseña incorrectos.'
            });
        }

        // Regenerar la sesión después de autenticar.
        req.session.regenerate((error) => {
            if (error) {
                console.error('Error al crear sesión:', error.message);

                return res.status(500).json({
                    error: 'No se pudo iniciar la sesión.'
                });
            }

            req.session.usuario = {
                id: cuenta.id,
                nombre: cuenta.nombre_completo,
                usuario: cuenta.usuario,
                rol: cuenta.rol
            };

            req.session.save((errorGuardar) => {
                if (errorGuardar) {
                    console.error(
                        'Error al guardar sesión:',
                        errorGuardar.message
                    );

                    return res.status(500).json({
                        error: 'No se pudo guardar la sesión.'
                    });
                }

                return res.json({
                    mensaje: 'Inicio de sesión correcto.',
                    usuario: req.session.usuario
                });
            });
        });

    } catch (error) {
        console.error('Error al iniciar sesión:', error.message);

        return res.status(500).json({
            error: 'Ocurrió un error al iniciar sesión.'
        });
    }
}

// Consultar la sesión actual.
function obtenerSesion(req, res) {
    if (!req.session.usuario) {
        return res.status(401).json({
            autenticado: false
        });
    }

    return res.json({
        autenticado: true,
        usuario: req.session.usuario
    });
}

// Cerrar sesión.
function cerrarSesion(req, res) {
    req.session.destroy((error) => {
        if (error) {
            console.error('Error al cerrar sesión:', error.message);

            return res.status(500).json({
                error: 'No se pudo cerrar la sesión.'
            });
        }

        res.clearCookie('guarderia.sid', {
            httpOnly: true,
            secure: false,
            sameSite: 'lax'
        });

        return res.json({
            mensaje: 'Sesión cerrada correctamente.'
        });
    });
}

module.exports = {
    iniciarSesion,
    obtenerSesion,
    cerrarSesion
};
