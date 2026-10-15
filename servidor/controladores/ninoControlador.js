
const conexion = require('../configuracion/db');

async function listarNinos(req, res) {
    try {
        const [ninos] = await conexion.query(`
            SELECT
                n.id,
                n.nombre_completo,
                n.fecha_nacimiento,
                n.fecha_ingreso,
                n.estado,
                n.fecha_baja,
                n.fecha_egreso,
                n.grupo_id,
                g.nombre AS nombre_grupo
            FROM ninos n
            LEFT JOIN grupos g ON n.grupo_id = g.id
            ORDER BY n.nombre_completo ASC
        `);

        res.json(ninos);
    } catch (error) {
        console.error('Error al consultar niños:', error.message);

        res.status(500).json({
            error: 'No fue posible consultar los niños.'
        });
    }
}


async function registrarNino(req, res) {
    try {
        const {
            nombre_completo,
            fecha_nacimiento,
            fecha_ingreso
        } = req.body;

        // Validar los campos obligatorios.
        if (!nombre_completo?.trim() || !fecha_nacimiento || !fecha_ingreso) {
            return res.status(400).json({
                error: 'El nombre, la fecha de nacimiento y la fecha de ingreso son obligatorios.'
            });
        }

        // Validar que las fechas tengan formato correcto.
        const formatoFecha = /^\d{4}-\d{2}-\d{2}$/;

        function fechaValida(fecha) {
            if (!formatoFecha.test(fecha)) return false;

            const [anio, mes, dia] = fecha.split('-').map(Number);
            const fechaObjeto = new Date(Date.UTC(anio, mes - 1, dia));

            return fechaObjeto.getUTCFullYear() === anio
                && fechaObjeto.getUTCMonth() === mes - 1
                && fechaObjeto.getUTCDate() === dia;
        }

        if (!fechaValida(fecha_nacimiento) || !fechaValida(fecha_ingreso)) {
            return res.status(400).json({
                error: 'Las fechas no son válidas. Usa el formato AAAA-MM-DD.'
            });
        }

        // Validar que las fechas no sean futuras y que el ingreso
        // sea posterior o igual al nacimiento.
        const hoy = new Date();
        const hoyTexto = [
            hoy.getFullYear(),
            String(hoy.getMonth() + 1).padStart(2, '0'),
            String(hoy.getDate()).padStart(2, '0')
        ].join('-');

        if (fecha_nacimiento > hoyTexto || fecha_ingreso > hoyTexto) {
            return res.status(400).json({
                error: 'Las fechas de nacimiento e ingreso no pueden ser futuras.'
            });
        }

        if (fecha_ingreso < fecha_nacimiento) {
            return res.status(400).json({
                error: 'La fecha de ingreso no puede ser anterior al nacimiento.'
            });
        }

        // Calcular los meses cumplidos en la fecha de ingreso.
        const nacimiento = new Date(`${fecha_nacimiento}T12:00:00`);
        const ingreso = new Date(`${fecha_ingreso}T12:00:00`);

        let meses = (ingreso.getFullYear() - nacimiento.getFullYear()) * 12
            + ingreso.getMonth() - nacimiento.getMonth();

        if (ingreso.getDate() < nacimiento.getDate()) {
            meses--;
        }

        if (meses < 1) {
            return res.status(400).json({
                error: 'La edad mínima de ingreso es de 1 mes cumplido.'
            });
        }

        // Buscar el grupo correspondiente a la edad.
        const [grupos] = await conexion.query(`
            SELECT id, nombre, edad_minima_meses, edad_maxima_meses
            FROM grupos
            WHERE activo = 1
              AND edad_minima_meses <= ?
              AND edad_maxima_meses > ?
            ORDER BY edad_minima_meses DESC
            LIMIT 1
        `, [meses, meses]);

        if (grupos.length === 0) {
            return res.status(400).json({
                error: 'No existe un grupo activo para la edad del niño.'
            });
        }

        const grupo = grupos[0];

        // Registrar al niño con su grupo asignado.
        const [resultado] = await conexion.query(`
            INSERT INTO ninos (
                nombre_completo,
                fecha_nacimiento,
                fecha_ingreso,
                grupo_id,
                estado
            )
            VALUES (?, ?, ?, ?, ?)
        `, [
            nombre_completo.trim(),
            fecha_nacimiento,
            fecha_ingreso,
            grupo.id,
            'Activo'
        ]);

        return res.status(201).json({
            mensaje: 'Niño registrado correctamente.',
            id: resultado.insertId,
            nombre_completo: nombre_completo.trim(),
            edad_meses: meses,
            grupo: grupo.nombre,
            estado: 'Activo'
        });

    } catch (error) {
        console.error('Error al registrar niño:', error.message);

        return res.status(500).json({
            error: 'No fue posible registrar al niño.'
        });
    }
}


module.exports = { listarNinos, registrarNino };

