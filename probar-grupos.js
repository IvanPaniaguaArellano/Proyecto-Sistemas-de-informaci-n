
const edades = [1, 11, 12, 23, 24, 35, 36, 47, 48];

const grupos = [
    { nombre: 'Lactantes', minimo: 1, maximo: 12 },
    { nombre: 'Maternal 1', minimo: 12, maximo: 24 },
    { nombre: 'Maternal 2', minimo: 24, maximo: 36 },
    { nombre: 'Maternal 3', minimo: 36, maximo: 48 }
];

console.log('PRUEBA DE ASIGNACIÓN DE GRUPOS\n');

for (const edad of edades) {
    const grupo = grupos.find(
        g => edad >= g.minimo && edad < g.maximo
    );

    console.log(
        `${edad} meses: ${grupo ? grupo.nombre : 'Sin grupo disponible'}`
    );
}
