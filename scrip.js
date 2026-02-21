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
    // --- LÓGICA DE MÚSICA ---
    const audio = document.getElementById('musica-fondo');
    const btnMusica = document.getElementById('btn-musica');
    const iconoMusica = document.getElementById('icono-musica');

    function toggleMusica() {
        if (audio.paused) {
            audio.play();
            iconoMusica.classList.remove('fa-play');
            iconoMusica.classList.add('fa-pause');
        } else {
            audio.pause();
            iconoMusica.classList.remove('fa-pause');
            iconoMusica.classList.add('fa-play');
        }
    }

    if (btnMusica) {
        btnMusica.addEventListener('click', toggleMusica);
    }
    

    // Truco: Intentar reproducir automáticamente cuando el usuario haga su PRIMER clic en la web
    document.addEventListener('click', () => {
        if (audio.paused) {
            audio.play().then(() => {
                iconoMusica.classList.remove('fa-play');
                iconoMusica.classList.add('fa-pause');
            }).catch(err => console.log("El navegador aún bloquea el audio"));
        }
    }, { once: true }); // El { once: true } asegura que esto solo pase en el primer clic


    // NUEVO: Manejar clics en Swatches, Chips y Botones de Cantidad
    document.addEventListener('click', (e) => {
        // Para talles (chips) y colores (swatches)
        if (e.target.classList.contains('swatch') || e.target.classList.contains('chip')) {
            const parent = e.target.parentElement;
            // Quita la clase 'selected' de los hermanos y se la pone al clicado
            parent.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
            e.target.classList.add('selected');
        }

        // Para botones de cantidad (+/-)
        if (e.target.classList.contains('btn-cantidad')) {
            const input = e.target.parentElement.querySelector('.input-cantidad');
            let valor = parseInt(input.value);
            if (e.target.classList.contains('plus')) valor++;
            if (e.target.classList.contains('minus') && valor > 1) valor--;
            input.value = valor;
        }
    });

    // --- FUNCIONES ---

    function agregarProducto(e) {
        e.preventDefault();
        if (e.target.classList.contains('agregar-carrito')) {
            // Buscamos el contenedor principal del producto (item o product-txt)
            const productoSeleccionado = e.target.parentElement.parentElement;
            leerDatosProducto(productoSeleccionado);
        }
    }

    // FUNCIÓN ACTUALIZADA: Ahora lee Swatches, Chips e Input de cantidad
    function leerDatosProducto(producto) {
        const infoProducto = {
            imagen: producto.querySelector('img')?.src || '', 
            titulo: producto.querySelector('h3').textContent,
            precio: producto.querySelector('.precio').textContent.replace(/[$.]/g, ''),
            id: producto.querySelector('.agregar-carrito').getAttribute('data-id'),
            // Capturamos el valor del elemento que tiene la clase 'selected'
            color: producto.querySelector('.swatch.selected')?.getAttribute('data-valor') || 'No seleccionado',
            talla: producto.querySelector('.chip.selected')?.getAttribute('data-valor') || 'No seleccionado',
            cantidad: parseInt(producto.querySelector('.input-cantidad')?.value) || 1
        };

        // Validación: Si no seleccionó talle o color, detenemos la ejecución
        if(infoProducto.color === 'No seleccionado' || infoProducto.talla === 'No seleccionado') {
            alert("Por favor selecciona talle y color antes de agregar al carrito");
            return;
        }

        // Lógica para agregar o actualizar cantidad en el carrito
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
    // ESTA LÍNEA ES LA CLAVE:
    e.preventDefault(); 

    if(e.target.classList.contains('borrar-producto')) {
        const id = e.target.getAttribute('data-id');
        const talla = e.target.getAttribute('data-talla');
        const color = e.target.getAttribute('data-color');

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
              // Dentro de la función carritoHTML, cambia el row.innerHTML por este:
row.innerHTML = `
    <td><img src="${p.imagen}" width="60"></td>
    <td>
        <div class="carrito-info-prod">
            <strong>${p.titulo}</strong>
            <small>Talle: ${p.talla} | Color: ${p.color}</small>
        </div>
    </td>
    <td style="font-weight: 600;">$${parseInt(p.precio).toLocaleString('es-AR')}</td>
    <td>x${p.cantidad}</td>
    <td>
        <a href="#" class="borrar-producto" 
            data-id="${p.id}" 
            data-talla="${p.talla}" 
            data-color="${p.color}">✕</a>
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

    function mostrarNotificacion(nombre) {
        let alerta = document.querySelector('.notificacion');
        if(!alerta) {
            alerta = document.createElement('div');
            alerta.classList.add('notificacion');
            document.body.appendChild(alerta);
        }

        alerta.innerHTML = `<span class="notificacion-icono">✓</span> ${nombre} agregado al carrito`;
        alerta.classList.add('mostrar');

        setTimeout(() => {
            alerta.classList.remove('mostrar');
        }, 3000);
    }
    // --- LÓGICA DE INSTALACIÓN PWA ---
let deferredPrompt;
const installBanner = document.getElementById('pwa-install-banner');
const btnInstalar = document.getElementById('btn-instalar');
const btnCerrarPwa = document.getElementById('btn-cerrar-pwa');

// Registrar el Service Worker (necesario para PWA)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(err => console.log('SW no registrado', err));
    });
}

// Escuchar el evento de instalación
window.addEventListener('beforeinstallprompt', (e) => {
    // Evitar que el navegador muestre el prompt automático
    e.preventDefault();
    deferredPrompt = e;
    
    // Solo mostrar si el usuario no la ha cerrado antes en esta sesión
    if (!sessionStorage.getItem('pwa_dismissed')) {
        installBanner.style.display = 'flex';
    }
});

btnInstalar.addEventListener('click', async () => {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            console.log('Usuario aceptó la instalación');
        }
        deferredPrompt = null;
        installBanner.style.display = 'none';
    }
});

btnCerrarPwa.addEventListener('click', () => {
    installBanner.style.display = 'none';
    sessionStorage.setItem('pwa_dismissed', 'true');
});

});

