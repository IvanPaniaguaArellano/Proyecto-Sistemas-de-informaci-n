const formulario = document.getElementById('registroForm');

formulario.addEventListener('submit', async (event) => {

    event.preventDefault();

    const nombre = document.getElementById('nombre').value;
    const correo = document.getElementById('correo').value;
    const password = document.getElementById('password').value;

    try {

        const respuesta = await fetch('/usuarios', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                nombre,
                correo,
                password
            })
        });

        const datos = await respuesta.json();

        document.getElementById('mensaje').textContent =
            datos.mensaje;

        if (respuesta.ok) {

            document.getElementById('registroForm').reset();

            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);

        }

    } catch (error) {

        console.error(error);

        document.getElementById('mensaje').textContent =
            'Error al conectar con el servidor';

    }

});