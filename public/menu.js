
async function cargarMenu() {
    const contenedor = document.getElementById('menuPrincipal');

    if (!contenedor) {
        return;
    }

    try {
        const respuesta = await fetch('/api/auth/sesion', {
            credentials: 'same-origin'
        });

        if (respuesta.status === 401) {
            window.location.replace('/login.html');
            return;
        }

        if (!respuesta.ok) {
            throw new Error('No se pudo verificar la sesión.');
        }

        const datos = await respuesta.json();

        if (!datos.autenticado || !datos.usuario) {
            window.location.replace('/login.html');
            return;
        }

        const usuario = datos.usuario;
        const esAdministrador = usuario.rol === 'Administrador';

        contenedor.innerHTML = `
            <header class="sg-header">
                <div class="sg-barra">
                    <div class="sg-marca">
                        <h1>SistemaGuardería</h1>
                        <p>Administración y cuidado infantil</p>
                    </div>

                    <nav class="sg-nav">
                        <a href="/inicio.html">Inicio</a>
                        <a href="/ninos.html">Niños</a>
                        <a href="/actividades.html">Actividades</a>

                        ${esAdministrador ? `
                            <a href="/usuarios.html">Usuarios</a>
                            <a href="/bitacora.html">Bitácora</a>
                        ` : ''}

                        <span class="sg-datos-usuario">
                            ${escaparHTML(usuario.nombre || usuario.usuario)}
                            · ${escaparHTML(usuario.rol)}
                        </span>

                        <button type="button" id="cerrarSesionMenu">
                            Cerrar sesión
                        </button>
                    </nav>
                </div>
            </header>
        `;

        document.getElementById('cerrarSesionMenu')
            .addEventListener('click', async () => {
                try {
                    const salida = await fetch('/api/auth/logout', {
                        method: 'POST',
                        credentials: 'same-origin'
                    });

                    if (salida.ok) {
                        window.location.replace('/login.html');
                    } else {
                        alert('No se pudo cerrar la sesión.');
                    }
                } catch (error) {
                    alert('Error de conexión al cerrar sesión.');
                }
            });

    } catch (error) {
        contenedor.textContent =
            'No se pudo cargar el menú. Actualiza la página.';
        console.error(error);
    }
}

function escaparHTML(valor) {
    return String(valor ?? '').replace(/[&<>"']/g, caracter => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[caracter]);
}

cargarMenu();
