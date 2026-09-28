const usuario = JSON.parse(localStorage.getItem('usuario'));

if (!usuario) {
    window.location.href = 'index.html';
}

const tabla = document.getElementById('tablaUsuarios');

const modal = document.getElementById('modalEditar');

const editarForm = document.getElementById('editarForm');

async function cargarUsuarios() {

    try {

        const respuesta = await fetch('/usuarios');

        const usuarios = await respuesta.json();

        tabla.innerHTML = '';

        usuarios.forEach(usuario => {

            const fila = document.createElement('tr');

            fila.innerHTML = `
                <td>${usuario.id_usuario}</td>

                <td>${usuario.nombre}</td>

                <td>${usuario.correo}</td>

                <td>${usuario.fecha_registro}</td>

                <td>

                    <button onclick="editarUsuario(${usuario.id_usuario})">
                        Editar
                    </button>

                    <button onclick="eliminarUsuario(${usuario.id_usuario})">
                        Eliminar
                    </button>

                </td>
            `;

            tabla.appendChild(fila);

        });

    } catch (error) {

        console.error(error);

    }

}


// EDITAR USUARIO

async function editarUsuario(id) {

    try {

        const respuesta = await fetch(`/usuarios/${id}`);

        const usuario = await respuesta.json();

        if (!respuesta.ok) {

            alert(usuario.mensaje);

            return;

        }

        document.getElementById('editarId').value =
            usuario.id_usuario;

        document.getElementById('editarNombre').value =
            usuario.nombre;

        document.getElementById('editarCorreo').value =
            usuario.correo;

        document.getElementById('editarPassword').value = '';

        document.getElementById('mensajeEditar').textContent = '';

        modal.style.display = 'flex';

    } catch (error) {

        console.error(error);

        alert('Error al obtener el usuario');

    }

}


// GUARDAR CAMBIOS

editarForm.addEventListener('submit', async (event) => {

    event.preventDefault();

    const id =
        document.getElementById('editarId').value;

    const nombre =
        document.getElementById('editarNombre').value;

    const correo =
        document.getElementById('editarCorreo').value;

    const password =
        document.getElementById('editarPassword').value;

    const datos = {
        nombre,
        correo
    };

    if (password) {
        datos.password = password;
    }

    try {

        const respuesta = await fetch(`/usuarios/${id}`, {

            method: 'PUT',

            headers: {
                'Content-Type': 'application/json'
            },

            body: JSON.stringify(datos)

        });

        const resultado = await respuesta.json();

        document.getElementById('mensajeEditar').textContent =
            resultado.mensaje;

        if (respuesta.ok) {

            setTimeout(() => {

                modal.style.display = 'none';

                cargarUsuarios();

            }, 1000);

        }

    } catch (error) {

        console.error(error);

        document.getElementById('mensajeEditar').textContent =
            'Error al actualizar usuario';

    }

});


// CANCELAR EDICIÓN

document.getElementById('cancelarEdicion')
    .addEventListener('click', () => {

        modal.style.display = 'none';

    });


// ELIMINAR USUARIO

async function eliminarUsuario(id) {

    const confirmar = confirm(
        '¿Deseas eliminar este usuario?'
    );

    if (!confirmar) {
        return;
    }

    try {

        const respuesta = await fetch(`/usuarios/${id}`, {
            method: 'DELETE'
        });

        const datos = await respuesta.json();

        alert(datos.mensaje);

        cargarUsuarios();

    } catch (error) {

        console.error(error);

    }

}


// CERRAR SESIÓN

document.getElementById('cerrarSesion')
    .addEventListener('click', () => {

        localStorage.removeItem('usuario');

        window.location.href = 'index.html';

    });


// NUEVO USUARIO

document.getElementById('nuevoUsuario')
    .addEventListener('click', () => {

        window.location.href = 'registro.html';

    });


// CARGAR USUARIOS

cargarUsuarios();