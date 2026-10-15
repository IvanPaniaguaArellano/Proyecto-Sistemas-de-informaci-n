
const conexion = require('../configuracion/db');

async function listarGrupos(req, res) {
    try {
        const [grupos] = await conexion.query(
            `SELECT
                id,
                nombre,
                edad_minima_meses,
                edad_maxima_meses,
                CAST(activo AS UNSIGNED) AS activo
             FROM grupos
             ORDER BY edad_minima_meses ASC`
        );

        res.json(grupos);
    } catch (error) {
        console.error('Error al consultar grupos:', error.message);

        res.status(500).json({
            error: 'No fue posible consultar los grupos.'
        });
    }
}

module.exports = { listarGrupos };
