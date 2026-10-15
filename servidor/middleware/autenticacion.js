
function verificarSesion(req, res, next) {
    if (!req.session || !req.session.usuario) {
        return res.status(401).json({
            error: 'Debes iniciar sesión para continuar.'
        });
    }

    next();
}

function soloAdministrador(req, res, next) {
    if (
        !req.session ||
        !req.session.usuario ||
        req.session.usuario.rol !== 'Administrador'
    ) {
        return res.status(403).json({
            error: 'No tienes permisos para realizar esta operación.'
        });
    }

    next();
}

module.exports = {
    verificarSesion,
    soloAdministrador
};
