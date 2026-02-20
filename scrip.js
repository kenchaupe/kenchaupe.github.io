document.addEventListener('DOMContentLoaded', () => {
    // Variables de UI
    const carrito = document.querySelector('#lista-carrito tbody');
    const listaProductos = document.querySelector('#lista-1');
    const contenedorCarrito = document.querySelector('#carrito');
    const contadorProductos = document.querySelector('#contador-productos');
    const totalPagar = document.querySelector('#total-pagar');
    const btnComprar = document.querySelector('#Comprar');
    
    let articulosCarrito = JSON.parse(localStorage.getItem('carrito_gruken')) || [];

    carritoHTML();

    // --- EVENT LISTENERS ---
    if (listaProductos) {
        listaProductos.addEventListener('click', agregarProducto);
    }

    if (contenedorCarrito) {
        contenedorCarrito.addEventListener('click', eliminarProducto);
    }

    if (btnComprar) {
        btnComprar.addEventListener('click', (e) => {
            e.preventDefault();
            if(articulosCarrito.length === 0) {
                alert("Tu carrito está vacío");
                return;
            }
            window.location.href = 'checkout.html';
        });
    }

    // --- FUNCIONES ---

    function agregarProducto(e) {
        e.preventDefault();
        if (e.target.classList.contains('agregar-carrito')) {
            const productoSeleccionado = e.target.parentElement.parentElement;
            leerDatosProducto(productoSeleccionado);
        }
    }

    function leerDatosProducto(producto) {
        // Creamos el objeto con los datos actuales
        const infoProducto = {
            imagen: producto.querySelector('img')?.src || '', 
            titulo: producto.querySelector('h3').textContent,
            precio: producto.querySelector('.precio').textContent.replace(/[$.]/g, ''),
            id: producto.querySelector('.agregar-carrito').getAttribute('data-id'),
            color: producto.querySelector('input[name^="color"]:checked')?.value || 'N/A',
            talla: producto.querySelector('input[name^="talla"]:checked')?.value || 'N/A',
            cantidad: parseInt(producto.querySelector('select[name="Cantidad"]')?.value) || 1
        };

        // Revisar si ya existe la combinación exacta
        const existe = articulosCarrito.some(p => 
            p.id === infoProducto.id && 
            p.color === infoProducto.color && 
            p.talla === infoProducto.talla
        );
        
        if(existe) {
            articulosCarrito = articulosCarrito.map(p => {
                if(p.id === infoProducto.id && p.color === infoProducto.color && p.talla === infoProducto.talla) {
                    p.cantidad += infoProducto.cantidad;
                }
                return p;
            });
        } else {
            articulosCarrito = [...articulosCarrito, infoProducto];
        }

        carritoHTML();
        mostrarNotificacion(infoProducto.titulo);
    }

    function eliminarProducto(e) {
        if(e.target.classList.contains('borrar-producto')) {
            // Capturamos los 3 datos para identificar el producto único
            const id = e.target.getAttribute('data-id');
            const talla = e.target.getAttribute('data-talla');
            const color = e.target.getAttribute('data-color');

            // Filtramos: "Mantén todo lo que NO coincida exactamente con lo que quiero borrar"
            articulosCarrito = articulosCarrito.filter(p => 
                !(p.id === id && p.talla === talla && p.color === color)
            );
            
            carritoHTML();
        }
    }

    function carritoHTML() {
        limpiarHTML();

        let total = 0;
        let count = 0;

        articulosCarrito.forEach(p => {
            const row = document.createElement('tr');
            // IMPORTANTE: Agregamos data-talla y data-color al botón de borrar
            row.innerHTML = `
                <td><img src="${p.imagen}" width="50"></td>
                <td>${p.titulo} <br> <small>${p.talla} / ${p.color}</small></td>
                <td>$${p.precio}</td>
                <td>${p.cantidad}</td>
                <td>
                    <a href="#" class="borrar-producto" 
                        data-id="${p.id}" 
                        data-talla="${p.talla}" 
                        data-color="${p.color}">X</a>
                </td>
            `;
            carrito.appendChild(row);
            
            total += parseInt(p.precio) * p.cantidad;
            count += p.cantidad;
        });

        if(contadorProductos) contadorProductos.innerText = count;
        if(totalPagar) totalPagar.innerText = total.toLocaleString('es-AR');
        
        sincronizarStorage();
    }

    function limpiarHTML() {
        if(carrito) carrito.innerHTML = '';
    }

    function sincronizarStorage() {
        localStorage.setItem('carrito_gruken', JSON.stringify(articulosCarrito));
    }

   // Función para mostrar el mensaje de éxito
function mostrarNotificacion(nombre) {
    // Crear el elemento si no existe
    let alerta = document.querySelector('.notificacion');
    if(!alerta) {
        alerta = document.createElement('div');
        alerta.classList.add('notificacion');
        document.body.appendChild(alerta);
    }

    alerta.innerHTML = `<span class="notificacion-icono">✓</span> ${nombre} agregado al carrito`;
    
    // Mostrarla
    alerta.classList.add('mostrar');

    // Ocultarla después de 3 segundos
    setTimeout(() => {
        alerta.classList.remove('mostrar');
    }, 3000);
}
});