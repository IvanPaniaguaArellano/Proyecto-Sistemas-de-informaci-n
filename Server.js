const express = require('express');
const app = express();
const bcrypt = require('bcrypt');
const cors = require('cors');
const pool = require('./db');
require('dotenv').config();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.json({
        mensaje: 'Servidor funcionando correctamente'
    });
});

// CREAR USUARIO
app.post('/usuarios', async (req, res) => {
    try {
        const { nombre, correo, password } = req.body;

        if (!nombre || !correo || !password) {
            return res.status(400).json({
                mensaje: 'Todos los campos son obligatorios'
            });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const [resultado] = await pool.execute(
            'INSERT INTO usuarios (nombre, correo, password) VALUES (?, ?, ?)',
            [nombre, correo, passwordHash]
        );

        res.status(201).json({
            mensaje: 'Usuario creado correctamente',
            id_usuario: resultado.insertId
        });

    } catch (error) {
        console.error(error);

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({
                mensaje: 'El correo ya está registrado'
            });
        }

        res.status(500).json({
            mensaje: 'Error al crear usuario'
        });
    }
});

// CONSULTAR USUARIOS
app.get('/usuarios', async (req, res) => {
    try {
        const [usuarios] = await pool.execute(
            'SELECT id_usuario, nombre, correo, fecha_registro FROM usuarios'
        );

        res.json(usuarios);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            mensaje: 'Error al consultar usuarios'
        });
    }
});

// CONSULTAR USUARIO POR ID
app.get('/usuarios/:id', async (req, res) => {
    try {
        const [usuarios] = await pool.execute(
            'SELECT id_usuario, nombre, correo, fecha_registro FROM usuarios WHERE id_usuario = ?',
            [req.params.id]
        );

        if (usuarios.length === 0) {
            return res.status(404).json({
                mensaje: 'Usuario no encontrado'
            });
        }

        res.json(usuarios[0]);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            mensaje: 'Error al consultar usuario'
        });
    }
});

// ACTUALIZAR USUARIO
app.put('/usuarios/:id', async (req, res) => {
    try {
        const { nombre, correo, password } = req.body;

        if (!nombre || !correo) {
            return res.status(400).json({
                mensaje: 'Nombre y correo son obligatorios'
            });
        }

        if (password) {
            const passwordHash = await bcrypt.hash(password, 10);

            const [resultado] = await pool.execute(
                'UPDATE usuarios SET nombre = ?, correo = ?, password = ? WHERE id_usuario = ?',
                [nombre, correo, passwordHash, req.params.id]
            );

            if (resultado.affectedRows === 0) {
                return res.status(404).json({
                    mensaje: 'Usuario no encontrado'
                });
            }

        } else {
            const [resultado] = await pool.execute(
                'UPDATE usuarios SET nombre = ?, correo = ? WHERE id_usuario = ?',
                [nombre, correo, req.params.id]
            );

            if (resultado.affectedRows === 0) {
                return res.status(404).json({
                    mensaje: 'Usuario no encontrado'
                });
            }
        }

        res.json({
            mensaje: 'Usuario actualizado correctamente'
        });

    } catch (error) {
        console.error(error);

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({
                mensaje: 'El correo ya está registrado'
            });
        }

        res.status(500).json({
            mensaje: 'Error al actualizar usuario'
        });
    }
});

// ELIMINAR USUARIO
app.delete('/usuarios/:id', async (req, res) => {
    try {
        const [resultado] = await pool.execute(
            'DELETE FROM usuarios WHERE id_usuario = ?',
            [req.params.id]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                mensaje: 'Usuario no encontrado'
            });
        }

        res.json({
            mensaje: 'Usuario eliminado correctamente'
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            mensaje: 'Error al eliminar usuario'
        });
    }
});

// LOGIN
app.post('/login', async (req, res) => {
    try {
        const { correo, password } = req.body;

        if (!correo || !password) {
            return res.status(400).json({
                mensaje: 'Correo y contraseña son obligatorios'
            });
        }

        const [usuarios] = await pool.execute(
            'SELECT * FROM usuarios WHERE correo = ?',
            [correo]
        );

        if (usuarios.length === 0) {
            return res.status(401).json({
                mensaje: 'Correo o contraseña incorrectos'
            });
        }

        const usuario = usuarios[0];

        const passwordCorrecta = await bcrypt.compare(
            password,
            usuario.password
        );

        if (!passwordCorrecta) {
            return res.status(401).json({
                mensaje: 'Correo o contraseña incorrectos'
            });
        }

        res.json({
            mensaje: 'Inicio de sesión correcto',
            usuario: {
                id_usuario: usuario.id_usuario,
                nombre: usuario.nombre,
                correo: usuario.correo
            }
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            mensaje: 'Error al iniciar sesión'
        });
    }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});