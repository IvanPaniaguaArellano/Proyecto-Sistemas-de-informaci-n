
const path = require('path');

function protegerPagina(rolRequerido) {
    return function (req, res, next) {
        if (!req.session || !req.session.usuario) {
            return res.redirect('/login.html');
        }

        if (
            rolRequerido &&
            req.session.usuario.rol !== rolRequerido
        ) {
            return res.status(403).send(
                'No tienes permiso para acceder a esta página.'
            );
        }

        next();
    };
}

module.exports = protegerPagina;
