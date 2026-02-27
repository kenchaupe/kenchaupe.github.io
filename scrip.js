// ==========================================
// 1. CONFIGURACIÓN GLOBAL (SUPABASE)
// ==========================================
const supabaseUrl = 'https://pvniwivsxluujijyqqpc.supabase.co';
const supabaseKey = 'sb_publishable_ss0VcJwu1wR5OVrNn2aYUw_sGG4HiJh';
const _supabase = supabase.createClient(supabaseUrl, supabaseKey);

document.addEventListener('DOMContentLoaded', () => {
    // --- VARIABLES DE UI ---
    const carrito = document.querySelector('#lista-carrito tbody');
    const listaProductos = document.querySelector('#lista-1');
    const contenedorCarrito = document.querySelector('#carrito');
    const contadorProductos = document.querySelector('#contador-productos');
    const totalPagar = document.querySelector('#total-pagar');
    const btnComprar = document.querySelector('#Comprar');
    
    let articulosCarrito = JSON.parse(localStorage.getItem('carrito_gruken')) || [];

    // --- INICIALIZACIÓN ---
    carritoHTML();
    inicializarStockTienda(); 

    // --- EVENT LISTENERS ---
    if (listaProductos) listaProductos.addEventListener('click', agregarProducto);
    if (contenedorCarrito) contenedorCarrito.addEventListener('click', eliminarProducto);

    if (btnComprar) {
        btnComprar.addEventListener('click', (e) => {
            e.preventDefault();
            if (articulosCarrito.length === 0) {
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

    if (btnMusica && audio) {
        btnMusica.addEventListener('click', () => {
            if (audio.paused) {
                audio.play();
                iconoMusica.classList.replace('fa-play', 'fa-pause');
            } else {
                audio.pause();
                iconoMusica.classList.replace('fa-pause', 'fa-play');
            }
        });

        document.addEventListener('click', () => {
            if (audio.paused) {
                audio.play().then(() => iconoMusica.classList.replace('fa-play', 'fa-pause')).catch(() => {});
            }
        }, { once: true });
    }

    // --- MANEJO DE SELECCIONES (Tallas, Colores, Cantidad) ---
    document.addEventListener('click', async (e) => {
        // Tallas y Colores
        if (e.target.classList.contains('swatch') || e.target.classList.contains('chip')) {
            const parent = e.target.parentElement;
            parent.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
            e.target.classList.add('selected');

            const productoContenedor = e.target.closest('.item') || e.target.closest('.product-txt');
            if (productoContenedor) await verificarStockYPrecio(productoContenedor);
        }

        // Control de cantidad (+ y -)
        if (e.target.classList.contains('btn-cantidad')) {
            const input = e.target.parentElement.querySelector('.input-cantidad');
            let valor = parseInt(input.value);
            if (e.target.classList.contains('plus')) valor++;
            if (e.target.classList.contains('minus') && valor > 1) valor--;
            input.value = valor;
        }

        // Cierra la ventana de reseñas si se hace clic afuera
        if (!e.target.closest('.reputacion')) {
            document.querySelectorAll('.ventana-flotante-resenas').forEach(ventana => {
                ventana.classList.remove('mostrar-ventana');
            });
        }
    });

    // ==========================================
    // FUNCIONES DEL CARRITO Y STOCK LOCAL
    // ==========================================
    async function verificarStockYPrecio(productoContenedor) {
        const btnAgregar = productoContenedor.querySelector('.agregar-carrito');
        const precioEtiqueta = productoContenedor.querySelector('.precio');
        
        const id = btnAgregar.getAttribute('data-id').trim().toLowerCase();
        const talla = productoContenedor.querySelector('.chip.selected')?.getAttribute('data-valor');
        const color = productoContenedor.querySelector('.swatch.selected')?.getAttribute('data-valor');

        if (!talla || !color) return;

        btnAgregar.textContent = "Consultando...";
        btnAgregar.disabled = true;

        const { data, error } = await _supabase
            .from('productos')
            .select('stock, precio')
            .eq('id', id).eq('talla', talla).eq('color', color).single();

        if (error || !data) {
            btnAgregar.textContent = "No disponible";
            return;
        }

        if (precioEtiqueta) precioEtiqueta.textContent = `$${data.precio.toLocaleString('es-AR')}`;

        if (data.stock <= 0) {
            btnAgregar.disabled = true;
            btnAgregar.textContent = "Agotado";
            btnAgregar.style.opacity = "0.5";
            btnAgregar.style.backgroundColor = "#ccc";
        } else {
            btnAgregar.disabled = false;
            btnAgregar.textContent = "Agregar al carrito";
            btnAgregar.style.opacity = "1";
            btnAgregar.style.backgroundColor = ""; // Restaura color original
        }
    }

    async function agregarProducto(e) {
        if (e.target.classList.contains('agregar-carrito')) {
            e.preventDefault();
            const productoSeleccionado = e.target.closest('.item') || e.target.closest('.product-txt');
            
            const btn = e.target;
            const originalText = btn.textContent;
            btn.textContent = "Validando...";
            btn.disabled = true;

            const id = btn.getAttribute('data-id').trim().toLowerCase();
            const talla = productoSeleccionado.querySelector('.chip.selected')?.getAttribute('data-valor');
            const color = productoSeleccionado.querySelector('.swatch.selected')?.getAttribute('data-valor');
            const cantidadPedida = parseInt(productoSeleccionado.querySelector('.input-cantidad')?.value) || 1;

            if (!talla || !color) {
                alert("Por favor selecciona talla y color");
                btn.textContent = originalText;
                btn.disabled = false;
                return;
            }

            const { data } = await _supabase.from('productos').select('stock').eq('id', id).eq('talla', talla).eq('color', color).single();

            if (data && data.stock >= cantidadPedida) {
                leerDatosProducto(productoSeleccionado, data.stock);
            } else {
                alert(`Lo sentimos, solo quedan ${data ? data.stock : 0} unidades disponibles.`);
            }

            btn.textContent = originalText;
            btn.disabled = false;
        }
    }

    function leerDatosProducto(producto, stockDisponible) {
        const infoProducto = {
            imagen: producto.querySelector('img')?.src || '', 
            titulo: producto.querySelector('h3').textContent,
            precio: producto.querySelector('.precio').textContent.replace(/[$.]/g, ''),
            id: producto.querySelector('.agregar-carrito').getAttribute('data-id').trim().toLowerCase(),
            color: producto.querySelector('.swatch.selected').getAttribute('data-valor'),
            talla: producto.querySelector('.chip.selected').getAttribute('data-valor'),
            cantidad: parseInt(producto.querySelector('.input-cantidad')?.value) || 1
        };

        const existe = articulosCarrito.find(p => p.id === infoProducto.id && p.color === infoProducto.color && p.talla === infoProducto.talla);
        
        if (existe) {
            if ((existe.cantidad + infoProducto.cantidad) > stockDisponible) {
                alert("Has alcanzado el límite de stock disponible para este producto.");
                return;
            }
            existe.cantidad += infoProducto.cantidad;
        } else {
            articulosCarrito.push(infoProducto);
        }

        carritoHTML();
        mostrarNotificacion(infoProducto.titulo);
    }

    function eliminarProducto(e) {
        if (e.target.classList.contains('borrar-producto')) {
            e.preventDefault();
            const id = e.target.getAttribute('data-id');
            const talla = e.target.getAttribute('data-talla');
            const color = e.target.getAttribute('data-color');

            articulosCarrito = articulosCarrito.filter(p => !(p.id === id && p.talla === talla && p.color === color));
            carritoHTML();
        }
    }

    function carritoHTML() {
        if (!carrito) return;
        carrito.innerHTML = '';
        let total = 0;
        let count = 0;

        articulosCarrito.forEach(p => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><img src="${p.imagen}" width="60" style="border-radius: 5px;"></td>
                <td>
                    <div class="carrito-info-prod">
                        <strong>${p.titulo}</strong><br>
                        <small>${p.talla} | ${p.color}</small>
                    </div>
                </td>
                <td>$${parseInt(p.precio).toLocaleString('es-AR')}</td>
                <td>x${p.cantidad}</td>
                <td><a href="#" class="borrar-producto" data-id="${p.id}" data-talla="${p.talla}" data-color="${p.color}">✕</a></td>
            `;
            carrito.appendChild(row);
            total += parseInt(p.precio) * p.cantidad;
            count += p.cantidad;
        });

        if (contadorProductos) contadorProductos.innerText = count;
        if (totalPagar) totalPagar.innerText = total.toLocaleString('es-AR');
        localStorage.setItem('carrito_gruken', JSON.stringify(articulosCarrito));
    }

    function mostrarNotificacion(nombre) {
        let alerta = document.querySelector('.notificacion') || document.createElement('div');
        if (!alerta.classList.contains('notificacion')) {
            alerta.classList.add('notificacion');
            document.body.appendChild(alerta);
        }
        alerta.innerHTML = `✓ ${nombre} agregado al carrito`;
        alerta.classList.add('mostrar');
        setTimeout(() => alerta.classList.remove('mostrar'), 3000);
    }

    // PWA LOGIC
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js').catch(err => console.log("SW Error:", err));
    }
});

// ==========================================
// FUNCIONES GLOBALES (INVENTARIO Y RESEÑAS)
// ==========================================
async function inicializarStockTienda() {
    console.log("Iniciando sincronización general de la tienda...");
    
    try {
        // Obtenemos solo los campos necesarios de Supabase para mayor velocidad
        const { data, error } = await _supabase.from('productos').select('id, stock, nombre, precio, imagen_url');
        if (error) throw error;

        // 1. Agrupamos los datos (nombre, precio, imagen y suma de stock) usando .reduce()
        const productoInfo = data.reduce((map, item) => {
            const limpiaId = item.id.trim().toLowerCase();
            
            // Si es la primera vez que vemos este ID, inicializamos sus datos
            if (!map[limpiaId]) {
                map[limpiaId] = {
                    nombre: item.nombre,
                    precio: item.precio,
                    imagen: item.imagen_url,
                    stockTotal: 0
                };
            }
            
            // Sumamos el stock (útil si hay variaciones del mismo ID)
            map[limpiaId].stockTotal += item.stock;
            return map;
        }, {});

        // 2. Buscamos cada producto en el HTML y actualizamos su tarjeta
        document.querySelectorAll('.agregar-carrito').forEach(btn => {
            const idHtml = btn.getAttribute('data-id').trim().toLowerCase();
            const datosBD = productoInfo[idHtml];

            // Si el producto existe en Supabase, actualizamos la web
            if (datosBD) {
                const contenedorTexto = btn.closest('.product-txt');
                
                if (contenedorTexto) {
                    // --- A) ACTUALIZAR NOMBRE ---
                    const titulo = contenedorTexto.querySelector('h3');
                    if (titulo && datosBD.nombre) titulo.textContent = datosBD.nombre;

                    // --- B) ACTUALIZAR PRECIO ---
                    const precioSpan = contenedorTexto.querySelector('.precio');
                    if (precioSpan && datosBD.precio) {
                        precioSpan.textContent = "$" + datosBD.precio.toLocaleString('es-AR');
                    }

                    // --- C) ACTUALIZAR IMAGEN ---
                    const contenedorPrincipal = contenedorTexto.parentElement;
                    if (contenedorPrincipal) {
                        const primeraImagen = contenedorPrincipal.querySelector('.swiper-wrapper img');
                        if (primeraImagen && datosBD.imagen) primeraImagen.src = datosBD.imagen;
                    }
                }

                // --- D) LÓGICA DE STOCK (AGOTADO) ---
                const sinStock = datosBD.stockTotal <= 0;
                
                btn.disabled = sinStock;
                btn.textContent = sinStock ? "Agotado" : "Agregar al carrito";
                btn.style.backgroundColor = sinStock ? "#ff0000" : "";
                btn.style.opacity = sinStock ? "0.8" : "1";
                btn.style.pointerEvents = sinStock ? "none" : "auto";
            }
        });

    } catch (error) {
        console.error("Error al sincronizar la tienda con Supabase:", error);
    }
}
/**
 * Revisa el stock general al cargar la página unificando variables de ID
 */


/**
 * Abre y cierra la ventana flotante de reseñas (Estrellas)
 */
window.toggleRecomendaciones = function(boton) {
    // 1. Encontrar el contenedor de las reseñas junto a este botón
    const contenedorReputacion = boton.closest('.reputacion');
    const ventana = contenedorReputacion.querySelector('.ventana-flotante-resenas');

    // 2. Cerrar todas las demás ventanas abiertas para evitar superposiciones
    document.querySelectorAll('.ventana-flotante-resenas').forEach(v => {
        if (v !== ventana) v.classList.remove('mostrar-ventana');
    });

    // 3. Alternar la actual
    if (ventana) ventana.classList.toggle('mostrar-ventana');
};

const sinStock = datosBD.stockTotal <= 0;
btn.disabled = sinStock;
btn.textContent = sinStock ? "Agotado" : "Agregar al carrito";
btn.classList.toggle('boton-agotado', sinStock); // Esto pone o quita el color rojo automáticamente


// --- LÓGICA DEL INVENTARIO FLOTANTE (TECLA X) ---
document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    
    if (e.key.toLowerCase() === 'x') {
        toggleInventarioFlotante();
    }
});

function toggleInventarioFlotante() {
    let modal = document.getElementById('modal-inventario');
    
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modal-inventario';
        modal.classList.add('activo');
        modal.innerHTML = `
            <div class="inventario-flotante" style="position: relative;">
                <button class="cerrar-inventario" onclick="cerrarInventarioYSalir()" style="position: absolute; top: 15px; right: 20px; background: #dc3545; color: white; border: none; border-radius: 50%; width: 35px; height: 35px; font-size: 18px; cursor: pointer; z-index: 10000; box-shadow: 0 4px 8px rgba(0,0,0,0.3); transition: 0.3s;">
                    <i class="fa fa-times"></i>
                </button>
                <iframe src="admin.html" class="iframe-inventario" style="width: 100%; height: 100%; border: none; border-radius: 15px;"></iframe>
            </div>
        `;
        document.body.appendChild(modal);
    } else {
        modal.classList.toggle('activo');
    }
}

// Función que hace la doble acción (Cierra Sesión + Oculta Ventana)
async function cerrarInventarioYSalir() {
    // 1. Cerramos sesión por seguridad
    await _supabase.auth.signOut();
    
    // 2. Ocultamos la ventana de la pantalla
    let modal = document.getElementById('modal-inventario');
    if (modal) {
        modal.classList.remove('activo');
        
        // 3. Reiniciamos el iframe para que vuelva a pedir clave la próxima vez
        let iframe = modal.querySelector('.iframe-inventario');
        if (iframe) iframe.src = 'admin.html';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Esto le dice al navegador: "Espera a que cargue todo el HTML y luego ejecuta la función"
    inicializarStockTienda();
    // NUEVO: Cargar los datos visuales
    aplicarConfiguracionWeb();
});
function toggleInventarioFlotante() {
    let modal = document.getElementById('modal-inventario');
    
    // Si no existe, creamos la ventana flotante
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modal-inventario';
        modal.classList.add('activo');
        modal.innerHTML = `
            <div class="inventario-flotante">
                <button class="cerrar-inventario" onclick="toggleInventarioFlotante()">
                    <i class="fa fa-times"></i>
                </button>
                <iframe src="admin.html" class="iframe-inventario"></iframe>
            </div>
        `;
        document.body.appendChild(modal);
    } else {
        // Si ya existe, alternamos su visibilidad
        modal.classList.toggle('activo');
    }
}

