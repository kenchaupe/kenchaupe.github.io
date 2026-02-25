// 1. Configuración Global de Supabase
const supabaseUrl = 'https://pvniwivsxluujijyqqpc.supabase.co';
const supabaseKey = 'sb_publishable_ss0VcJwu1wR5OVrNn2aYUw_sGG4HiJh'; // Nota: Asegúrate de que esta sea la clave correcta
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
    if (listaProductos) {
        listaProductos.addEventListener('click', agregarProducto);
    }

    if (contenedorCarrito) {
        contenedorCarrito.addEventListener('click', eliminarProducto);
    }

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

        // Autoplay interactivo profesional
        document.addEventListener('click', () => {
            if (audio.paused) {
                audio.play()
                    .then(() => iconoMusica.classList.replace('fa-play', 'fa-pause'))
                    .catch(() => console.log("Interacción requerida para audio"));
            }
        }, { once: true });
    }

    // --- MANEJO DE SELECCIONES (Tallas, Colores, Cantidad) ---
    document.addEventListener('click', async (e) => {
        // Tallas y Colores (Chips/Swatches)
        if (e.target.classList.contains('swatch') || e.target.classList.contains('chip')) {
            const parent = e.target.parentElement;
            parent.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
            e.target.classList.add('selected');

            const productoContenedor = e.target.closest('.item') || e.target.closest('.product-txt');
            if (productoContenedor) {
                await verificarStockYPrecio(productoContenedor);
            }
        }

        // Control de cantidad
        if (e.target.classList.contains('btn-cantidad')) {
            const input = e.target.parentElement.querySelector('.input-cantidad');
            let valor = parseInt(input.value);
            if (e.target.classList.contains('plus')) valor++;
            if (e.target.classList.contains('minus') && valor > 1) valor--;
            input.value = valor;
        }
    });

    // --- FUNCIONES CORE ---

    /**
     * Verifica la disponibilidad específica de una variante (talla/color)
     */
    async function verificarStockYPrecio(productoContenedor) {
        const btnAgregar = productoContenedor.querySelector('.agregar-carrito');
        const precioEtiqueta = productoContenedor.querySelector('.precio');
        
        const id = btnAgregar.getAttribute('data-id');
        const talla = productoContenedor.querySelector('.chip.selected')?.getAttribute('data-valor');
        const color = productoContenedor.querySelector('.swatch.selected')?.getAttribute('data-valor');

        // Solo consultar si ambos están seleccionados
        if (!talla || !color) return;

        // Feedback visual de carga
        btnAgregar.textContent = "Consultando...";
        btnAgregar.disabled = true;

        const { data, error } = await _supabase
            .from('productos')
            .select('stock, precio')
            .eq('id', id)
            .eq('talla', talla)
            .eq('color', color)
            .single();

        if (error || !data) {
            btnAgregar.textContent = "No disponible";
            return;
        }

        // Actualizar UI con datos de DB
        if (precioEtiqueta) precioEtiqueta.textContent = `$${data.precio}`;

        if (data.stock <= 0) {
            btnAgregar.disabled = true;
            btnAgregar.textContent = "Agotado";
            btnAgregar.classList.add('boton-deshabilitado');
        } else {
            btnAgregar.disabled = false;
            btnAgregar.textContent = "Agregar Al Carrito";
            btnAgregar.classList.remove('boton-deshabilitado');
        }
    }

    async function agregarProducto(e) {
        if (e.target.classList.contains('agregar-carrito')) {
            e.preventDefault();
            const productoSeleccionado = e.target.closest('.item') || e.target.closest('.product-txt');
            
            // Verificación final de stock antes de añadir
            const btn = e.target;
            const originalText = btn.textContent;
            btn.textContent = "Validando...";
            btn.disabled = true;

            const id = btn.getAttribute('data-id');
            const talla = productoSeleccionado.querySelector('.chip.selected')?.getAttribute('data-valor');
            const color = productoSeleccionado.querySelector('.swatch.selected')?.getAttribute('data-valor');
            const cantidadPedida = parseInt(productoSeleccionado.querySelector('.input-cantidad')?.value) || 1;

            if (!talla || !color) {
                alert("Por favor selecciona talle y color");
                btn.textContent = originalText;
                btn.disabled = false;
                return;
            }

            // Consultar stock real una última vez
            const { data } = await _supabase
                .from('productos')
                .select('stock')
                .eq('id', id).eq('talla', talla).eq('color', color).single();

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
            id: producto.querySelector('.agregar-carrito').getAttribute('data-id'),
            color: producto.querySelector('.swatch.selected').getAttribute('data-valor'),
            talla: producto.querySelector('.chip.selected').getAttribute('data-valor'),
            cantidad: parseInt(producto.querySelector('.input-cantidad')?.value) || 1
        };

        const existe = articulosCarrito.find(p => 
            p.id === infoProducto.id && p.color === infoProducto.color && p.talla === infoProducto.talla
        );
        
        if (existe) {
            // Validar que no exceda el stock total al sumar
            if ((existe.cantidad + infoProducto.cantidad) > stockDisponible) {
                alert("Has alcanzado el límite de stock para este producto");
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

            articulosCarrito = articulosCarrito.filter(p => 
                !(p.id === id && p.talla === talla && p.color === color)
            );
            
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
        sincronizarStorage();
    }

    function sincronizarStorage() {
        localStorage.setItem('carrito_gruken', JSON.stringify(articulosCarrito));
    }

    function mostrarNotificacion(nombre) {
        let alerta = document.querySelector('.notificacion') || document.createElement('div');
        if (!alerta.classList.contains('notificacion')) {
            alerta.classList.add('notificacion');
            document.body.appendChild(alerta);
        }
        alerta.innerHTML = `✓ ${nombre} agregado`;
        alerta.classList.add('mostrar');
        setTimeout(() => alerta.classList.remove('mostrar'), 3000);
    }

    // --- PWA LOGIC ---
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js').catch(err => console.log("SW Error:", err));
    }
});

// --- FUNCIONES GLOBALES ---

/**
 * Revisa el stock general al cargar la página. 
 * Si un ID no tiene stock en ninguna variante, se marca como Agotado.
 */
async function inicializarStockTienda() {
    const { data: productosBase, error } = await _supabase.from('productos').select('id, stock');
    if (error) return;

    // Agrupar stock por ID
    const stockPorId = productosBase.reduce((acc, item) => {
        acc[item.id] = (acc[item.id] || 0) + item.stock;
        return acc;
    }, {});

    document.querySelectorAll('.agregar-carrito').forEach(btn => {
        const id = btn.getAttribute('data-id');
        if ((stockPorId[id] || 0) <= 0) {
            btn.disabled = true;
            btn.textContent = "Sin Stock";
            btn.classList.add('boton-deshabilitado');
            btn.style.opacity = "0.5";
        }
    });
}

function abrirModalRecomendaciones() {
    const modal = document.getElementById("modal-recomendaciones");
    if (modal) modal.style.display = "block";
}

function toggleRecomendaciones(boton) {
    const ventana = boton.parentElement.querySelector('.ventana-flotante-resenas');
    document.querySelectorAll('.ventana-flotante-resenas').forEach(v => {
        if (v !== ventana) v.classList.remove('mostrar-ventana');
    });
    if (ventana) ventana.classList.toggle('mostrar-ventana');
}