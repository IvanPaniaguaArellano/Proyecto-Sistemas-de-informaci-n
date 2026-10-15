
require('dotenv').config();

const protegerPagina = require('./middleware/protegerPaginas');
const usuarioRutas = require('./rutas/usuarioRutas');
const authRutas = require('./rutas/authRutas');
const express = require('express');
const path = require('path');
const session = require('express-session');
const conexion = require('./configuracion/db');

const ninoRutas = require('./rutas/ninoRutas');
const grupoRutas = require('./rutas/grupoRutas');
const actividadRutas = require('./rutas/actividadRutas');

const app = express();
const PORT = process.env.PORT || 3000;

// Permite recibir datos JSON y formularios.
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configura las sesiones de usuario.
app.use(session({
    name: 'guarderia.sid',
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: false, // Desarrollo local con HTTP.
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 // Una hora.
    }
}));

app.get(
    '/usuarios.html',
    protegerPagina('Administrador'),
    (req, res) => {
        res.sendFile(
            path.join(__dirname, '..', 'public', 'usuarios.html')
        );
    }
);


app.get(
    '/ninos.html',
    protegerPagina(),
    (req, res) => {
        const rolesPermitidos = [
            'Administrador',
            'Encargado',
            'Enfermeria'
        ];

        if (!rolesPermitidos.includes(req.session.usuario.rol)) {
            return res.status(403).send(
                'No tienes permiso para acceder a esta página.'
            );
        }

        res.sendFile(
            path.join(__dirname, '..', 'public', 'ninos.html')
        );
    }
);


app.get(
    '/actividades.html',
    protegerPagina(),
    (req, res) => {
        const rolesPermitidos = [
            'Administrador',
            'Encargado',
            'Enfermeria'
        ];

        if (!rolesPermitidos.includes(req.session.usuario.rol)) {
            return res.status(403).send(
                'No tienes permiso para acceder a esta página.'
            );
        }

        res.sendFile(
            path.join(__dirname, '..', 'public', 'actividades.html')
        );
    }
);


app.get(
    '/inicio.html',
    protegerPagina(),
    (req, res) => {
        res.sendFile(
            path.join(__dirname, '..', 'public', 'inicio.html')
        );
    }
);



// Publica las páginas web.
app.use(express.static(path.join(__dirname, '..', 'public')));

// Rutas existentes.
// Rutas del sistema.
app.use('/api/auth', authRutas);
app.use('/api/ninos', ninoRutas);
app.use('/api/grupos', grupoRutas);
app.use('/api/usuarios', usuarioRutas);
app.use('/api/actividades', actividadRutas);



// Estado del servidor y de MySQL.
app.get('/api/estado', async (req, res) => {
    try {
        const [resultado] = await conexion.query(
            'SELECT DATABASE() AS baseDatos, VERSION() AS version'
        );

        res.json({
            mensaje: 'Servidor de la guardería funcionando',
            baseDatos: resultado[0].baseDatos,
            mysql: resultado[0].version
        });
    } catch (error) {
        console.error('Error de conexión:', error.message);

        res.status(500).json({
            error: 'No se pudo conectar con MySQL.'
        });
    }
});

// Inicia el servidor.
async function iniciarServidor() {
    try {
        if (!process.env.SESSION_SECRET) {
            throw new Error('Falta configurar SESSION_SECRET en el archivo .env');
        }

        await conexion.query('SELECT 1');

        app.listen(PORT, () => {
            console.log(`Servidor iniciado en http://localhost:${PORT}`);
            console.log('Conexión con MySQL establecida.');
        });
    } catch (error) {
        console.error('No se pudo iniciar el servidor:', error.message);
        process.exit(1);
    }
}

iniciarServidor();
