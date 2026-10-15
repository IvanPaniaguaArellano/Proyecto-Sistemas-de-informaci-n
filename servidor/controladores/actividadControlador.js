
const conexion = require('../configuracion/db');

// Tipos de actividades permitidas.
const tiposPermitidos = [
    'Alimentación',
    'Descanso',
    'Juego',
    'Higiene',
    'Actividad educativa',
    'Otra'
];

// Consultar actividades.
// Si se envía ?nino_id=1, filtra por ese niño.
async function listarActividades(req, res) {
    try {
        const { nino_id } = req.query;

        let sql = `
            SELECT
                a.id,
                a.nino_id,
                n.nombre_completo AS nombre_nino,
                a.usuario_id,
                u.nombre_completo AS registrado_por,
                a.tipo_actividad,
                a.fecha_hora,
                a.observaciones
            FROM actividades_ninos a
            INNER JOIN ninos n ON n.id = a.nino_id
            INNER JOIN usuarios u ON u.id = a.usuario_id
        `;

        const parametros = [];

        if (nino_id !== undefined) {
            const idNino = Number(nino_id);

            if (!Number.isInteger(idNino) || idNino <= 0) {
                return res.status(400).json({
                    error: 'El identificador del niño no es válido.'
                });
            }

            sql += ' WHERE a.nino_id = ?';
            parametros.push(idNino);
        }

        sql += ' ORDER BY a.fecha_hora DESC';

        const [actividades] = await conexion.query(sql, parametros);

        res.json(actividades);
    } catch (error) {
        console.error('Error al listar actividades:', error.message);
        res.status(500).json({
            error: 'No se pudieron consultar las actividades.'
        });
    }
}

// Registrar una actividad.
async function registrarActividad(req, res) {
    try {
        const {
            nino_id,
            tipo_actividad,
            fecha_hora,
            observaciones
        } = req.body;

        const idNino = Number(nino_id);
        const idUsuario = Number(req.session.usuario.id);

        if (!Number.isInteger(idNino) || idNino <= 0) {
            return res.status(400).json({
                error: 'Debes seleccionar un niño válido.'
            });
        }

        if (!tiposPermitidos.includes(tipo_actividad)) {
            return res.status(400).json({
                error: 'El tipo de actividad no es válido.'
            });
        }

        if (
            observaciones !== undefined &&
            observaciones !== null &&
            typeof observaciones !== 'string'
        ) {
            return res.status(400).json({
                error: 'Las observaciones deben ser texto.'
            });
        }

        const [ninos] = await conexion.query(
            'SELECT id FROM ninos WHERE id = ? AND estado = ?',
            [idNino, 'Activo']
        );

        if (ninos.length === 0) {
            return res.status(404).json({
                error: 'El niño no existe o no está activo.'
            });
        }

        let fecha = null;

        if (fecha_hora) {
            const fechaValidada = new Date(fecha_hora);

            if (Number.isNaN(fechaValidada.getTime())) {
                return res.status(400).json({
                    error: 'La fecha y hora no son válidas.'
                });
            }

            fecha = fechaValidada;
        }

        const [resultado] = await conexion.query(
            `INSERT INTO actividades_ninos
                (nino_id, usuario_id, tipo_actividad, fecha_hora, observaciones)
             VALUES (?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP), ?)`,
            [
                idNino,
                idUsuario,
                tipo_actividad,
                fecha,
                observaciones?.trim() || null
            ]
        );

        res.status(201).json({
            mensaje: 'Actividad registrada correctamente.',
            id: resultado.insertId
        });
    } catch (error) {
        console.error('Error al registrar actividad:', error.message);
        res.status(500).json({
            error: 'No se pudo registrar la actividad.'
        });
    }
}

module.exports = {
    listarActividades,
    registrarActividad
};
