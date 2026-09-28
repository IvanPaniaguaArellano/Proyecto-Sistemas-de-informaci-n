const formulario = document.getElementById('loginForm');

formulario.addEventListener('submit', async (event) => {

    event.preventDefault();

    const correo = document.getElementById('correo').value;
    const password = document.getElementById('password').value;

    try {

        const respuesta = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                correo,
                password
            })
        });

        const datos = await respuesta.json();

        if (!respuesta.ok) {
            document.getElementById('mensaje').textContent = datos.mensaje;
            return;
        }

        localStorage.setItem(
            'usuario',
            JSON.stringify(datos.usuario)
        );

        window.location.href = 'usuarios.html';

    } catch (error) {

        console.error(error);

        document.getElementById('mensaje').textContent =
            'No se pudo conectar con el servidor';

    }

});