
const bcrypt = require('bcrypt');
const conexion = require('../configuracion/db');

// Consultar todos los usuarios.
async function listarUsuarios(req, res) {
    try {
        const [usuarios] = await conexion.query(`
            SELECT
                id,
                nombre_completo,
                usuario,
                correo,
                rol,
                CAST(activo AS UNSIGNED) AS activo
            FROM usuarios
            ORDER BY nombre_completo ASC
        `);

        res.json(usuarios);
    } catch (error) {
        console.error('Error al listar usuarios:', error.message);
        res.status(500).json({
            error: 'No fue posible consultar los usuarios.'
        });
    }
}

// Consultar un usuario por ID.
async function obtenerUsuario(req, res) {
    try {
        const id = Number(req.params.id);

        if (!Number.isSafeInteger(id) || id <= 0) {
            return res.status(400).json({
                error: 'El ID del usuario no es válido.'
            });
        }

        const [usuarios] = await conexion.query(`
            SELECT
                id,
                nombre_completo,
                usuario,
                correo,
                rol,
                CAST(activo AS UNSIGNED) AS activo
            FROM usuarios
            WHERE id = ?
        `, [id]);

        if (usuarios.length === 0) {
            return res.status(404).json({
                error: 'Usuario no encontrado.'
            });
        }

        res.json(usuarios[0]);
    } catch (error) {
        console.error('Error al obtener usuario:', error.message);
        res.status(500).json({
            error: 'No fue posible consultar el usuario.'
        });
    }
}

// Crear un usuario.
async function crearUsuario(req, res) {
    try {
        const {
            nombre_completo,
            usuario,
            correo,
            contrasena,
            rol
        } = req.body;

        if (
            typeof nombre_completo !== 'string' ||
            !nombre_completo.trim() ||
            typeof usuario !== 'string' ||
            !usuario.trim() ||
            typeof correo !== 'string' ||
            !correo.trim() ||
            typeof contrasena !== 'string' ||
            !contrasena ||
            typeof rol !== 'string' ||
            !rol
        ) {
            return res.status(400).json({
                error: 'Todos los campos son obligatorios.'
            });
        }

        if (nombre_completo.trim().length > 100 ||
            usuario.trim().length > 50 ||
            correo.trim().length > 120) {
            return res.status(400).json({
                error: 'Uno o más campos superan la longitud permitida.'
            });
        }

        if (contrasena.length < 8) {
            return res.status(400).json({
                error: 'La contraseña debe tener al menos 8 caracteres.'
            });
        }

        const correoNormalizado = correo.trim().toLowerCase();
        const usuarioNormalizado = usuario.trim();

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correoNormalizado)) {
            return res.status(400).json({
                error: 'El correo electrónico no es válido.'
            });
        }

        // Solo se permiten los roles previstos para el sistema.
        const rolesPermitidos = [
            'Administrador',
            'Encargado',
            'Enfermeria'
        ];

        if (!rolesPermitidos.includes(rol)) {
            return res.status(400).json({
                error: 'El rol seleccionado no es válido.'
            });
        }

        const hash = await bcrypt.hash(contrasena, 12);

        const [resultado] = await conexion.query(`
            INSERT INTO usuarios (
                nombre_completo,
                usuario,
                correo,
                contrasena,
                rol,
                activo
            )
            VALUES (?, ?, ?, ?, ?, ?)
        `, [
            nombre_completo.trim(),
            usuarioNormalizado,
            correoNormalizado,
            hash,
            rol,
            1
        ]);

        res.status(201).json({
            mensaje: 'Usuario creado correctamente.',
            id: resultado.insertId
        });
    } catch (error) {
        console.error('Error al crear usuario:', error.message);

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                error: 'El nombre de usuario o correo ya está registrado.'
            });
        }

        res.status(500).json({
            error: 'No fue posible crear el usuario.'
        });
    }
}

// Actualizar los datos de un usuario.
async function actualizarUsuario(req, res) {
    try {
        const id = Number(req.params.id);

        if (!Number.isSafeInteger(id) || id <= 0) {
            return res.status(400).json({
                error: 'El ID del usuario no es válido.'
            });
        }

        const {
            nombre_completo,
            usuario,
            correo,
            contrasena,
            rol,
            activo
        } = req.body;

        if (
            typeof nombre_completo !== 'string' ||
            !nombre_completo.trim() ||
            typeof usuario !== 'string' ||
            !usuario.trim() ||
            typeof correo !== 'string' ||
            !correo.trim() ||
            typeof rol !== 'string' ||
            !rol
        ) {
            return res.status(400).json({
                error: 'Nombre, usuario, correo y rol son obligatorios.'
            });
        }

        if (nombre_completo.trim().length > 100 ||
            usuario.trim().length > 50 ||
            correo.trim().length > 120) {
            return res.status(400).json({
                error: 'Uno o más campos superan la longitud permitida.'
            });
        }

        const rolesPermitidos = [
            'Administrador',
            'Encargado',
            'Enfermeria'
        ];

        if (!rolesPermitidos.includes(rol)) {
            return res.status(400).json({
                error: 'El rol seleccionado no es válido.'
            });
        }

        const correoNormalizado = correo.trim().toLowerCase();

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correoNormalizado)) {
            return res.status(400).json({
                error: 'El correo electrónico no es válido.'
            });
        }

        if (
            contrasena !== undefined &&
            contrasena !== '' &&
            (typeof contrasena !== 'string' || contrasena.length < 8)
        ) {
            return res.status(400).json({
                error: 'La nueva contraseña debe tener al menos 8 caracteres.'
            });
        }

        if (activo !== undefined && activo !== 0 && activo !== 1 &&
            activo !== false && activo !== true) {
            return res.status(400).json({
                error: 'El estado de la cuenta no es válido.'
            });
        }

        const estado = activo === undefined
            ? 1
            : (activo === 1 || activo === true ? 1 : 0);

        const [existentes] = await conexion.query(
            'SELECT id FROM usuarios WHERE id = ?',
            [id]
        );

        if (existentes.length === 0) {
            return res.status(404).json({
                error: 'Usuario no encontrado.'
            });
        }

        // Evitar que el administrador desactive su propia cuenta.
        if (
            req.session.usuario.id === id &&
            estado === 0
        ) {
            return res.status(400).json({
                error: 'No puedes desactivar tu propia cuenta.'
            });
        }

        // Evitar desactivar al último administrador activo.
        const [cuentaActual] = await conexion.query(`
            SELECT rol, CAST(activo AS UNSIGNED) AS activo
            FROM usuarios
            WHERE id = ?
        `, [id]);

        if (
            cuentaActual[0].rol === 'Administrador' &&
            cuentaActual[0].activo === 1 &&
            (rol !== 'Administrador' || estado === 0)
        ) {
            const [administradores] = await conexion.query(`
                SELECT COUNT(*) AS total
                FROM usuarios
                WHERE rol = 'Administrador'
                  AND activo = 1
                  AND id <> ?
            `, [id]);

            if (administradores[0].total === 0) {
                return res.status(400).json({
                    error: 'Debe existir al menos un administrador activo.'
                });
            }
        }

        if (contrasena) {
            const hash = await bcrypt.hash(contrasena, 12);

            await conexion.query(`
                UPDATE usuarios
                SET nombre_completo = ?,
                    usuario = ?,
                    correo = ?,
                    contrasena = ?,
                    rol = ?,
                    activo = ?
                WHERE id = ?
            `, [
                nombre_completo.trim(),
                usuario.trim(),
                correoNormalizado,
                hash,
                rol,
                estado,
                id
            ]);
        } else {
            await conexion.query(`
                UPDATE usuarios
                SET nombre_completo = ?,
                    usuario = ?,
                    correo = ?,
                    rol = ?,
                    activo = ?
                WHERE id = ?
            `, [
                nombre_completo.trim(),
                usuario.trim(),
                correoNormalizado,
                rol,
                estado,
                id
            ]);
        }

        // Si se modificó el propio usuario, actualizar su sesión.
        if (req.session.usuario.id === id) {
            req.session.usuario.nombre = nombre_completo.trim();
            req.session.usuario.usuario = usuario.trim();
            req.session.usuario.rol = rol;
        }

        res.json({
            mensaje: 'Usuario actualizado correctamente.'
        });
    } catch (error) {
        console.error('Error al actualizar usuario:', error.message);

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                error: 'El nombre de usuario o correo ya está registrado.'
            });
        }

        res.status(500).json({
            error: 'No fue posible actualizar el usuario.'
        });
    }
}

// Desactivar una cuenta sin borrar su historial.
async function desactivarUsuario(req, res) {
    try {
        const id = Number(req.params.id);

        if (!Number.isSafeInteger(id) || id <= 0) {
            return res.status(400).json({
                error: 'El ID del usuario no es válido.'
            });
        }

        if (req.session.usuario.id === id) {
            return res.status(400).json({
                error: 'No puedes desactivar tu propia cuenta.'
            });
        }

        const [usuarios] = await conexion.query(`
            SELECT rol, CAST(activo AS UNSIGNED) AS activo
            FROM usuarios
            WHERE id = ?
        `, [id]);

        if (usuarios.length === 0) {
            return res.status(404).json({
                error: 'Usuario no encontrado.'
            });
        }

        if (usuarios[0].activo === 0) {
            return res.json({
                mensaje: 'La cuenta ya estaba desactivada.'
            });
        }

        if (usuarios[0].rol === 'Administrador') {
            const [administradores] = await conexion.query(`
                SELECT COUNT(*) AS total
                FROM usuarios
                WHERE rol = 'Administrador'
                  AND activo = 1
                  AND id <> ?
            `, [id]);

            if (administradores[0].total === 0) {
                return res.status(400).json({
                    error: 'No puedes desactivar al último administrador activo.'
                });
            }
        }

        await conexion.query(
            'UPDATE usuarios SET activo = 0 WHERE id = ?',
            [id]
        );

        res.json({
            mensaje: 'Usuario desactivado correctamente.'
        });
    } catch (error) {
        console.error('Error al desactivar usuario:', error.message);
        res.status(500).json({
            error: 'No fue posible desactivar el usuario.'
        });
    }
}

module.exports = {
    listarUsuarios,
    obtenerUsuario,
    crearUsuario,
    actualizarUsuario,
    desactivarUsuario
};
